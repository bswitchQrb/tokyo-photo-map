/** 訪問記録 */
export interface VisitRecord {
  name: string;
  code: string;
  /** 撮影日（"YYYY/M/D"） */
  visitedAt: string;
  photoName: string;
  latitude: number;
  longitude: number;
}

/** 訪問済みマップの型 */
export type VisitMap = Map<string, VisitRecord>;

/** 訪問済みかどうか */
export function isVisited(visits: VisitMap, code: string): boolean {
  return visits.has(code);
}

/** 新しい訪問を追加した新しいマップを返す（イミュータブル） */
export function addVisit(visits: VisitMap, record: VisitRecord): VisitMap {
  const next = new Map(visits);
  next.set(record.code, record);
  return next;
}

/**
 * "YYYY/M/D" を比較用の数値（YYYYMMDD）にする。
 * 読めない日付は「いちばん新しい」扱いにして、ちゃんとした日付を優先する
 */
export function visitDateKey(visitedAt: string): number {
  const m = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(visitedAt.trim());
  if (!m) return Number.POSITIVE_INFINITY;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}

/**
 * 複数の訪問をマージした新しいマップを返す。
 * 同じ区市の記録がすでにあるときは、訪問日が早いほう（その区市に初めて行った日）を残す
 */
export function mergeVisits(base: VisitMap, incoming: VisitMap): VisitMap {
  const next = new Map(base);
  for (const [code, record] of incoming) {
    const current = next.get(code);
    if (!current || visitDateKey(record.visitedAt) < visitDateKey(current.visitedAt)) {
      next.set(code, record);
    }
  }
  return next;
}
