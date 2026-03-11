import type { VisitMap } from '../domain/visit';
import { importCsv } from '../infrastructure/visit-repository';

interface Props {
  visited: VisitMap;
  total: number;
  onClear: () => void;
  onImport: (records: VisitMap) => void;
  onExport: () => void;
}

export function Stats({ visited, total, onClear, onImport, onExport }: Props) {
  const count = visited.size;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  const handleImport = async () => {
    const records = await importCsv();
    if (records.size > 0) onImport(records);
  };

  return (
    <div className="stats">
      <div className="stats-bar">
        <div className="stats-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="stats-text">
        <strong>{count}</strong> / {total} エリア制覇（{pct}%）
      </p>

      <div className="stats-buttons">
        <button className="csv-btn" type="button" onClick={handleImport}>
          📤 CSV読込
        </button>
        <button className="csv-btn" type="button" onClick={onExport} disabled={count === 0}>
          📥 CSVエクスポート
        </button>
      </div>

      {count > 0 && (
        <details className="visited-list">
          <summary>訪問済みエリア一覧</summary>
          <ul>
            {[...visited.values()]
              .sort((a, b) => a.code.localeCompare(b.code))
              .map((r) => (
                <li key={r.code}>
                  {r.name}（{r.visitedAt}）
                </li>
              ))}
          </ul>
          <button className="clear-btn" type="button" onClick={onClear}>
            リセット
          </button>
        </details>
      )}
    </div>
  );
}
