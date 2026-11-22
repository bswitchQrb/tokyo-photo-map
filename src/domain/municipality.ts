import { geoContains } from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

/** 市区町村のプロパティ */
export interface MunicipalityProps {
  code: string;
  name: string;
  prefecture: string;
}

/** GeoJSON Feature with Municipality properties */
export type MunicipalityFeature = Feature<Polygon | MultiPolygon, MunicipalityProps>;

/** 23区かどうか判定（コード 13101〜13123） */
export function isWard(code: string): boolean {
  const n = Number(code);
  return n >= 13101 && n <= 13123;
}

/** 座標から市区町村を検索 */
export function findMunicipality(
  geojson: FeatureCollection,
  longitude: number,
  latitude: number,
): MunicipalityProps | null {
  for (const feature of geojson.features) {
    if (geoContains(feature as MunicipalityFeature, [longitude, latitude])) {
      return (feature as MunicipalityFeature).properties;
    }
  }
  return null;
}

/** GeoJSON から全市区町村数を取得 */
export function countMunicipalities(geojson: FeatureCollection): number {
  return new Set(
    geojson.features.map((f) => (f.properties as MunicipalityProps).code),
  ).size;
}

/** GeoJSON から市区町村の一覧をコード順で取得（同じコードは1件にまとめる） */
export function listMunicipalities(geojson: FeatureCollection): MunicipalityProps[] {
  const byCode = new Map<string, MunicipalityProps>();
  for (const f of geojson.features) {
    const p = f.properties as MunicipalityProps;
    if (!byCode.has(p.code)) byCode.set(p.code, p);
  }
  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}
