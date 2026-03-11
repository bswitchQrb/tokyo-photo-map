import { useCallback, useEffect, useState } from 'react';
import tokyoGeoJson from './data/tokyo.geojson.json';
import { TokyoMap } from './components/TokyoMap';
import { PhotoUploader } from './components/PhotoUploader';
import { Stats } from './components/Stats';
import { countMunicipalities } from './domain/municipality';
import type { VisitRecord, VisitMap } from './domain/visit';
import { mergeVisits } from './domain/visit';
import { load, save, exportCsv } from './infrastructure/visit-repository';
import './App.css';

const geojson = tokyoGeoJson as unknown as GeoJSON.FeatureCollection;
const TOTAL_MUNICIPALITIES = countMunicipalities(geojson);

export function App() {
  const [visited, setVisited] = useState<VisitMap>(() => load());

  // visitedが変わるたびにlocalStorageに自動保存
  useEffect(() => {
    save(visited);
  }, [visited]);

  const handleVisit = useCallback((records: VisitRecord[]) => {
    setVisited((prev) => {
      const incoming: VisitMap = new Map(records.map((r) => [r.code, r]));
      return mergeVisits(prev, incoming);
    });
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('本当にリセットする？全部消えちゃうよ！')) {
      setVisited(new Map());
    }
  }, []);

  const handleImport = useCallback((records: VisitMap) => {
    setVisited((prev) => mergeVisits(prev, records));
  }, []);

  const handleExport = useCallback(() => {
    exportCsv(visited);
  }, [visited]);

  return (
    <div className="app">
      <header className="header">
        <h1>🗾 東京ぬりつぶしマップ</h1>
        <p className="subtitle">写真をアップして東京を制覇しよう！</p>
      </header>

      <main className="main">
        <div className="map-container">
          <TokyoMap
            geojson={geojson}
            visited={visited}
            width={800}
            height={600}
          />
        </div>

        <div className="sidebar">
          <PhotoUploader
            geojson={geojson}
            visited={visited}
            onVisit={handleVisit}
          />
          <Stats
            visited={visited}
            total={TOTAL_MUNICIPALITIES}
            onClear={handleClear}
            onImport={handleImport}
            onExport={handleExport}
          />
        </div>
      </main>
    </div>
  );
}
