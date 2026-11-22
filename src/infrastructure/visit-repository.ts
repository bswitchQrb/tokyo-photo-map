import type { VisitRecord, VisitMap } from '../domain/visit';
import { visitDateKey } from '../domain/visit';

const STORAGE_KEY = 'tokyo-photo-map-visited';
const CSV_COLUMNS = ['code', 'name', 'visitedAt', 'photoName', 'latitude', 'longitude'] as const;
/** Excel（Windows）で開いたときに UTF-8 と認識させるための BOM */
const BOM = '﻿';

function escapeCsv(val: string): string {
  if (/[",\r\n]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function buildCsvText(visited: VisitMap): string {
  const rows = [CSV_COLUMNS.join(',')];
  for (const r of visited.values()) {
    rows.push(
      [r.code, r.name, r.visitedAt, r.photoName, String(r.latitude), String(r.longitude)].map(escapeCsv).join(','),
    );
  }
  return rows.join('\r\n') + '\r\n';
}

/**
 * RFC 4180 形式の CSV を行×列に分解する。
 * クォート内のカンマ・改行・エスケープされた `""` を扱い、改行は CRLF / LF のどちらでも読む
 */
export function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** CSV テキストから訪問記録を読み込む。列は見出し行の名前で探すので、列の並びが変わっていても読める */
export function parseCsv(text: string): VisitMap {
  const [header, ...rows] = splitCsv(text.replace(/^﻿/, ''));
  const map: VisitMap = new Map();
  if (!header) return map;

  const index = Object.fromEntries(CSV_COLUMNS.map((c) => [c, header.findIndex((h) => h.trim() === c)]));
  if (index.code < 0 || index.name < 0) return map;
  const get = (cols: string[], key: (typeof CSV_COLUMNS)[number]) =>
    index[key] >= 0 ? (cols[index[key]] ?? '').trim() : '';

  for (const cols of rows) {
    const code = get(cols, 'code');
    const name = get(cols, 'name');
    if (!/^\d{5}$/.test(code) || !name) continue;

    const record: VisitRecord = {
      code,
      name,
      visitedAt: get(cols, 'visitedAt'),
      photoName: get(cols, 'photoName'),
      latitude: Number(get(cols, 'latitude')) || 0,
      longitude: Number(get(cols, 'longitude')) || 0,
    };
    // 同じ区市が複数行あるときは、訪問日が早い行を残す（mergeVisits と同じ規則）
    const current = map.get(code);
    if (!current || visitDateKey(record.visitedAt) < visitDateKey(current.visitedAt)) map.set(code, record);
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited.entries()]));
  } catch {
    // プライベートブラウズなどで保存できない場合は、このタブの中だけで使えるようにする
  }
}

/** CSVファイルとしてエクスポート（ダウンロード） */
export function exportCsv(visited: VisitMap): void {
  const blob = new Blob([BOM + buildCsvText(visited)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tokyo-photo-map.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** ファイル選択ダイアログからCSVをインポート（キャンセルされたら null） */
export function importCsv(): Promise<VisitMap | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? parseCsv(await file.text()) : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
