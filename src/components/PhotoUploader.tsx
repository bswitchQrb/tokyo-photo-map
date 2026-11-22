import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { extractPhotoMeta } from '../domain/photo';
import { findMunicipality } from '../domain/municipality';
import type { VisitRecord, VisitMap } from '../domain/visit';
import { visitDateKey } from '../domain/visit';

/** 新しく押すスタンプと、その元になった写真 */
export interface NewVisit {
  record: VisitRecord;
  file: File;
}

interface Props {
  geojson: FeatureCollection;
  visited: VisitMap;
  onVisit: (visits: NewVisit[]) => void;
}

type PhotoStatus = 'success' | 'no-gps' | 'outside' | 'duplicate';

interface ProcessedPhoto {
  previewUrl: string;
  fileName: string;
  municipality: string | null;
  status: PhotoStatus;
}

const STATUS_LABEL: Record<PhotoStatus, string> = {
  success: '新しいスタンプ',
  duplicate: '押印済み',
  'no-gps': '位置情報なし',
  outside: '都外',
};

export function PhotoUploader({ geojson, visited, onVisit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ tone: 'good' | 'muted'; text: string } | null>(null);
  const [previews, setPreviews] = useState<ProcessedPhoto[]>([]);

  // 差し替え・アンマウント時にプレビュー画像の ObjectURL を解放する
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [previews]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setProcessing(true);
      setMessage(null);

      const results: ProcessedPhoto[] = [];
      // 同じアップロードの中に同じ区市の写真が何枚かあれば、撮影日がいちばん早い写真を使う
      const pending = new Map<string, NewVisit & { resultIndex: number }>();

      for (const file of Array.from(files)) {
        const previewUrl = URL.createObjectURL(file);
        const meta = await extractPhotoMeta(file);
        if (!meta) {
          results.push({ previewUrl, fileName: file.name, municipality: null, status: 'no-gps' });
          continue;
        }
        const muni = findMunicipality(geojson, meta.longitude, meta.latitude);
        if (!muni) {
          results.push({ previewUrl, fileName: file.name, municipality: null, status: 'outside' });
          continue;
        }
        if (visited.has(muni.code)) {
          results.push({ previewUrl, fileName: file.name, municipality: muni.name, status: 'duplicate' });
          continue;
        }
        const record: VisitRecord = {
          name: muni.name,
          code: muni.code,
          visitedAt: meta.dateStr,
          photoName: file.name,
          latitude: meta.latitude,
          longitude: meta.longitude,
        };
        const prev = pending.get(muni.code);
        if (prev && visitDateKey(prev.record.visitedAt) <= visitDateKey(record.visitedAt)) {
          results.push({ previewUrl, fileName: file.name, municipality: muni.name, status: 'duplicate' });
          continue;
        }
        if (prev) results[prev.resultIndex].status = 'duplicate';
        pending.set(muni.code, { record, file, resultIndex: results.length });
        results.push({ previewUrl, fileName: file.name, municipality: muni.name, status: 'success' });
      }

      const newVisits = [...pending.values()].map(({ record, file }) => ({ record, file }));
      if (newVisits.length > 0) onVisit(newVisits);
      setPreviews(results);
      setMessage(summarize(results, newVisits.map((v) => v.record)));
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    },
    [geojson, visited, onVisit],
  );

  return (
    <div className="uploader">
      <input
        ref={inputRef}
        id="photo-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        className={`drop-zone${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <button
          type="button"
          className="add-photo-btn"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
        >
          {processing ? '写真を読んでいます…' : '写真からスタンプを押す'}
        </button>
        <p className="drop-hint">位置情報つきの写真を選んでください（複数まとめてOK）</p>
      </div>

      {message && <p className={`upload-message is-${message.tone}`}>{message.text}</p>}

      {previews.length > 0 && (
        <ul className="snapshots">
          {previews.map((p) => (
            <li key={p.previewUrl} className={`snapshot is-${p.status}`}>
              <img src={p.previewUrl} alt={p.fileName} />
              <span className="snapshot-caption">{p.municipality ?? STATUS_LABEL[p.status]}</span>
              {p.municipality && <span className="snapshot-status">{STATUS_LABEL[p.status]}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function summarize(results: ProcessedPhoto[], newRecords: VisitRecord[]) {
  const count = (s: PhotoStatus) => results.filter((r) => r.status === s).length;
  const parts: string[] = [];
  if (newRecords.length > 0) {
    const names = newRecords.map((r) => r.name);
    parts.push(
      names.length <= 3
        ? `${names.join('・')}にスタンプを押しました`
        : `${names.slice(0, 2).join('・')}ほか${names.length - 2}か所にスタンプを押しました`,
    );
  }
  if (count('duplicate')) parts.push(`${count('duplicate')}枚は押印済みの場所`);
  if (count('no-gps')) parts.push(`${count('no-gps')}枚は位置情報が入っていませんでした`);
  if (count('outside')) parts.push(`${count('outside')}枚は対象エリアの外でした`);
  return { tone: newRecords.length > 0 ? ('good' as const) : ('muted' as const), text: parts.join('。') + '。' };
}
