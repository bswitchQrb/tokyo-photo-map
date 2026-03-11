import type { VisitRecord, VisitMap } from '../domain/visit';

const STORAGE_KEY = 'tokyo-photo-map-visited';
const CSV_HEADER = 'code,name,visitedAt,photoName,latitude,longitude';

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildCsvText(visited: VisitMap): string {
  const rows = [CSV_HEADER];
  for (const r of visited.values()) {
    rows.push(
      [r.code, escapeCsv(r.name), r.visitedAt, escapeCsv(r.photoName), r.latitude, r.longitude].join(','),
    );
  }
  return rows.join('\n') + '\n';
}

export function parseCsv(text: string): VisitMap {
  const lines = text.trim().split('\n');
  const map: VisitMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 6) continue;
    const record: VisitRecord = {
      code: cols[0],
      name: cols[1].replace(/^"|"$/g, ''),
      visitedAt: cols[2],
      photoName: cols[3].replace(/^"|"$/g, ''),
      latitude: Number(cols[4]),
      longitude: Number(cols[5]),
    };
    if (record.code && record.name) {
      map.set(record.code, record);
    }
  }
  return map;
}

/** localStorageから読み込み */
export function load(): VisitMap {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return new Map();
    const entries: [string, VisitRecord][] = JSON.parse(json);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

/** localStorageに保存 */
export function save(visited: VisitMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited.entries()]));
}

/** CSVファイルとしてエクスポート（ダウンロード） */
export function exportCsv(visited: VisitMap): void {
  const blob = new Blob([buildCsvText(visited)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'visited.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** ファイル選択ダイアログからCSVをインポート */
export function importCsv(): Promise<VisitMap> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(new Map());
      const text = await file.text();
      resolve(parseCsv(text));
    };
    input.click();
  });
}
