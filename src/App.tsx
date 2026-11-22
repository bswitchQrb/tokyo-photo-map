import { useCallback, useEffect, useState } from 'react';
import tokyoGeoJson from './data/tokyo.geojson.json';
import { TokyoMap } from './components/TokyoMap';
import { PhotoUploader } from './components/PhotoUploader';
import { StampBook } from './components/StampBook';
import { DataMenu, Progress } from './components/Progress';
import { listMunicipalities } from './domain/municipality';
import type { VisitRecord, VisitMap } from './domain/visit';
import { mergeVisits } from './domain/visit';
import { load, save, exportCsv } from './infrastructure/visit-repository';
import './App.css';

const geojson = tokyoGeoJson as unknown as GeoJSON.FeatureCollection;
const MUNICIPALITIES = listMunicipalities(geojson);

export function App() {
  const [visited, setVisited] = useState<VisitMap>(() => load());
  const [freshCodes, setFreshCodes] = useState<ReadonlySet<string>>(new Set());

  // visited が変わるたびに localStorage に自動保存
  useEffect(() => {
    save(visited);
  }, [visited]);

  const handleVisit = useCallback((records: VisitRecord[]) => {
    setVisited((prev) => mergeVisits(prev, new Map(records.map((r) => [r.code, r]))));
    setFreshCodes(new Set(records.map((r) => r.code)));
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('記録をすべて消します。元に戻せません。よろしいですか？')) {
      setVisited(new Map());
      setFreshCodes(new Set());
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
          <TokyoMap geojson={geojson} visited={visited} />
          <p className="map-legend">
            <span className="legend-swatch is-visited" />行った
            <span className="legend-swatch" />まだ
            <span className="legend-note">地図をタップすると区市名が出ます</span>
          </p>
        </section>

        <section className="page page-stamps" aria-label="記録">
          <PhotoUploader geojson={geojson} visited={visited} onVisit={handleVisit} />
          <StampBook municipalities={MUNICIPALITIES} visited={visited} freshCodes={freshCodes} />
        </section>
      </main>

      <footer className="footer">
        <p>写真はこの端末のブラウザの中だけで読み取ります。サーバーには送信しません。</p>
        <p>記録はこのブラウザに保存されます。機種変更の前には「書き出す」で保存しておいてください。</p>
        <DataMenu hasData={visited.size > 0} onImport={handleImport} onExport={handleExport} onClear={handleClear} />
        <p className="credit">
          出典：国土数値情報（行政区域データ）（国土交通省）を加工して作成
        </p>
      </footer>
    </div>
  );
}
