import { useCallback, useRef, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { extractPhotoMeta } from '../domain/photo';
import { findMunicipality } from '../domain/municipality';
import type { VisitRecord, VisitMap } from '../domain/visit';

interface Props {
  geojson: FeatureCollection;
  visited: VisitMap;
  onVisit: (records: VisitRecord[]) => void;
}

interface ProcessedPhoto {
  previewUrl: string;
  fileName: string;
  municipality: string | null;
  dateStr: string | null;
  status: 'success' | 'no-gps' | 'outside' | 'duplicate';
}

type ResultMessage =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }
  | { type: 'duplicate'; text: string }
  | null;

export function PhotoUploader({ geojson, visited, onVisit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ResultMessage>(null);
  const [previews, setPreviews] = useState<ProcessedPhoto[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setProcessing(true);
      setResult(null);
      setPreviews([]);

      let successCount = 0;
      let noGpsCount = 0;
      let outsideCount = 0;
      let dupCount = 0;
      const newPreviews: ProcessedPhoto[] = [];
      const newRecords: VisitRecord[] = [];
      const visitedCodes = new Set(visited.keys());

      for (const file of Array.from(files)) {
        const previewUrl = URL.createObjectURL(file);
        const meta = await extractPhotoMeta(file);

        if (!meta) {
          noGpsCount++;
          newPreviews.push({ previewUrl, fileName: file.name, municipality: null, dateStr: null, status: 'no-gps' });
          continue;
        }

        const muni = findMunicipality(geojson, meta.longitude, meta.latitude);
        if (!muni) {
          outsideCount++;
          newPreviews.push({ previewUrl, fileName: file.name, municipality: null, dateStr: meta.dateStr, status: 'outside' });
          continue;
        }

        if (visitedCodes.has(muni.code)) {
          dupCount++;
          newPreviews.push({ previewUrl, fileName: file.name, municipality: muni.name, dateStr: meta.dateStr, status: 'duplicate' });
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
        newRecords.push(record);
        visitedCodes.add(muni.code);
        successCount++;
        newPreviews.push({ previewUrl, fileName: file.name, municipality: muni.name, dateStr: meta.dateStr, status: 'success' });
      }

      if (newRecords.length > 0) {
        onVisit(newRecords);
      }

      setPreviews(newPreviews);

      const msgs: string[] = [];
      if (successCount > 0) msgs.push(`${successCount}件の新しいエリアを塗りつぶしたよ！`);
      if (dupCount > 0) msgs.push(`${dupCount}件はもう塗りつぶし済み`);
      if (noGpsCount > 0) msgs.push(`${noGpsCount}件は位置情報なし`);
      if (outsideCount > 0) msgs.push(`${outsideCount}件は東京都外`);

      if (successCount > 0) {
        setResult({ type: 'success', text: msgs.join(' / ') });
      } else if (dupCount > 0) {
        setResult({ type: 'duplicate', text: msgs.join(' / ') });
      } else {
        setResult({ type: 'error', text: msgs.join(' / ') });
      }

      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    },
    [geojson, visited, onVisit],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const statusLabel = (status: ProcessedPhoto['status']) => {
    switch (status) {
      case 'success': return '🎉 NEW!';
      case 'duplicate': return '✅ 済み';
      case 'no-gps': return '📍 GPS なし';
      case 'outside': return '🗺️ 都外';
    }
  };

  return (
    <div className="uploader">
      <div
        className="drop-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {processing ? (
          <p className="processing">処理中...</p>
        ) : (
          <>
            <p className="drop-text">📸 写真をドラッグ＆ドロップ</p>
            <p className="drop-sub">またはクリックして選択（複数OK）</p>
          </>
        )}
      </div>

      {result && (
        <p className={`result-msg ${result.type}`}>{result.text}</p>
      )}

      {previews.length > 0 && (
        <div className="preview-grid">
          {previews.map((p, i) => (
            <div key={i} className={`preview-card ${p.status}`}>
              <img src={p.previewUrl} alt={p.fileName} />
              <div className="preview-info">
                <span className="preview-status">{statusLabel(p.status)}</span>
                {p.municipality && <span className="preview-muni">{p.municipality}</span>}
                {p.dateStr && <span className="preview-date">{p.dateStr}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
