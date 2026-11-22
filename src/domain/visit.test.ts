import { describe, expect, it } from 'vitest';
import type { VisitMap, VisitRecord } from './visit';
import { mergeVisits, visitDateKey } from './visit';

const rec = (code: string, visitedAt: string, photoName = 'a.jpg'): VisitRecord => ({
  code,
  name: `区${code}`,
  visitedAt,
  photoName,
  latitude: 35.6,
  longitude: 139.7,
});
const mapOf = (...records: VisitRecord[]): VisitMap => new Map(records.map((r) => [r.code, r]));

describe('visitDateKey', () => {
  it('月日が1桁でも2桁でも正しく大小を比べられる', () => {
    expect(visitDateKey('2026/9/1')).toBeLessThan(visitDateKey('2026/10/1'));
    expect(visitDateKey('2026/1/31')).toBeLessThan(visitDateKey('2026/2/1'));
  });

  it('ハイフン区切りも読める', () => {
    expect(visitDateKey('2026-03-05')).toBe(visitDateKey('2026/3/5'));
  });

  it('読めない日付はいちばん新しい扱いになる', () => {
    expect(visitDateKey('')).toBe(Number.POSITIVE_INFINITY);
    expect(visitDateKey('きのう')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('mergeVisits', () => {
  it('新しい区市は追加される', () => {
    const merged = mergeVisits(mapOf(rec('13101', '2026/5/1')), mapOf(rec('13102', '2026/6/1')));
    expect([...merged.keys()]).toEqual(['13101', '13102']);
  });

  it('同じ区市は早い日付の記録が残る', () => {
    const base = mapOf(rec('13101', '2026/10/1', 'later.jpg'));
    expect(mergeVisits(base, mapOf(rec('13101', '2026/9/1', 'earlier.jpg'))).get('13101')?.photoName).toBe('earlier.jpg');
    expect(mergeVisits(base, mapOf(rec('13101', '2026/11/1', 'latest.jpg'))).get('13101')?.photoName).toBe('later.jpg');
  });

  it('元のマップは変更しない', () => {
    const base = mapOf(rec('13101', '2026/5/1'));
    mergeVisits(base, mapOf(rec('13102', '2026/6/1')));
    expect(base.size).toBe(1);
  });
});
