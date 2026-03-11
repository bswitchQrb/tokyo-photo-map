/** 訪問記録 */
export interface VisitRecord {
  name: string;
  code: string;
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

/** 複数の訪問をマージした新しいマップを返す */
export function mergeVisits(base: VisitMap, incoming: VisitMap): VisitMap {
  const next = new Map(base);
  for (const [code, record] of incoming) {
    next.set(code, record);
  }
  return next;
}
