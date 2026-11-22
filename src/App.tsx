import { useCallback, useEffect, useState } from 'react';
import tokyoGeoJson from './data/tokyo.geojson.json';
import { TokyoMap } from './components/TokyoMap';
import { PhotoUploader } from './components/PhotoUploader';
import type { NewVisit } from './components/PhotoUploader';
import { PhotoViewer } from './components/PhotoViewer';
import { StampBook } from './components/StampBook';
import { DataMenu, Progress } from './components/Progress';
import { listMunicipalities } from './domain/municipality';
import type { VisitMap } from './domain/visit';
import { mergeVisits } from './domain/visit';
import { load, save, exportCsv } from './infrastructure/visit-repository';
import { clearPhotos, listPhotoCodes, putPhoto, requestPersistence } from './infrastructure/photo-store';
import { makeThumbnail } from './infrastructure/thumbnail';
import './App.css';

const geojson = tokyoGeoJson as unknown as GeoJSON.FeatureCollection;
const MUNICIPALITIES = listMunicipalities(geojson);

export function App() {
  const [visited, setVisited] = useState<VisitMap>(() => load());
  const [freshCodes, setFreshCodes] = useState<ReadonlySet<string>>(new Set());
  const [photoCodes, setPhotoCodes] = useState<ReadonlySet<string>>(new Set());
  const [openCode, setOpenCode] = useState<string | null>(null);

  // 写真が保存されている区市を読み込む（写真本体は開いたときに読む）
  useEffect(() => {
    listPhotoCodes()
      .then((codes) => setPhotoCodes(new Set(codes)))
      .catch(() => {});
  }, []);

  // visited が変わるたびに localStorage に自動保存
  useEffect(() => {
    save(visited);
  }, [visited]);

  const handleVisit = useCallback(async (visits: NewVisit[]) => {
    setVisited((prev) => mergeVisits(prev, new Map(visits.map(({ record }) => [record.code, record]))));
    setFreshCodes(new Set(visits.map(({ record }) => record.code)));

    // 思い出の写真として、縮小したサムネイルを保存する（失敗してもスタンプは押せている）
    const saved: string[] = [];
    for (const { record, file } of visits) {
      const blob = await makeThumbnail(file);
      if (!blob) continue;
      try {
        await putPhoto({ code: record.code, blob, takenAt: record.visitedAt, photoName: record.photoName });
        saved.push(record.code);
      } catch {
        // 容量不足などで保存できなかった
      }
    }
    if (saved.length > 0) {
      setPhotoCodes((prev) => new Set([...prev, ...saved]));
      requestPersistence();
    }
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('記録と保存した写真をすべて消します。元に戻せません。よろしいですか？')) {
      setVisited(new Map());
      setFreshCodes(new Set());
      setPhotoCodes(new Set());
      clearPhotos().catch(() => {});
    }
  }, []);

  const handleImport = useCallback((records: VisitMap) => {
    setVisited((prev) => mergeVisits(prev, records));
  }, []);

  const handleExport = useCallback(() => exportCsv(visited), [visited]);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">東京ぬりつぶしマップ</h1>
        <p className="subtitle">写真で集める、東京のスタンプ帳</p>
      </header>

      <main className="notebook">
        <section className="page page-map" aria-label="地図">
          <Progress visited={visited} total={MUNICIPALITIES.length} />
          <TokyoMap geojson={geojson} visited={visited} onOpen={setOpenCode} />
          <p className="map-legend">
            <span className="legend-swatch is-visited" />行った
            <span className="legend-swatch" />まだ
            <span className="legend-note">行った場所をタップすると写真が見られます</span>
          </p>
        </section>

        <section className="page page-stamps" aria-label="記録">
          <PhotoUploader geojson={geojson} visited={visited} onVisit={handleVisit} />
          <StampBook
            municipalities={MUNICIPALITIES}
            visited={visited}
            freshCodes={freshCodes}
            photoCodes={photoCodes}
            onOpen={setOpenCode}
          />
        </section>
      </main>

      <PhotoViewer record={openCode ? (visited.get(openCode) ?? null) : null} onClose={() => setOpenCode(null)} />

      <footer className="footer">
        <p>写真はこの端末のブラウザの中だけで読み取り、縮小した1枚を思い出として保存します。サーバーには送信しません。</p>
        <p>記録と写真はこのブラウザに保存されます。機種変更の前には「書き出す」で記録を保存しておいてください（写真は書き出しに含まれません）。</p>
        <DataMenu hasData={visited.size > 0} onImport={handleImport} onExport={handleExport} onClear={handleClear} />
        <p className="credit">
          出典：
          <a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html" target="_blank" rel="noopener noreferrer">
            国土数値情報（行政区域データ）
          </a>
          （国土交通省）2020年1月1日時点のデータを加工して作成
        </p>
      </footer>
    </div>
  );
}
