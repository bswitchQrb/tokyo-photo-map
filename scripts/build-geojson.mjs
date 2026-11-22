/**
 * 元の境界データ（data-src/tokyo.raw.geojson.json, 約10MB）を
 * アプリに同梱する軽量版（src/data/tokyo.geojson.json）に変換する。
 *
 *   npm run geo:build
 *
 * 1. 正規化: 元データは 1 ポリゴンの中に「外周」が複数入っていて、面積ゼロの潰れたリングも混ざっている。
 *    mapshaper はこれを穴として扱ってしまうため、潰れたリングを捨てて外周ごとに別ポリゴンへ分ける。
 * 2. 簡略化: mapshaper で頂点を減らす（隣り合う市区の境界は共有したまま）。
 * 3. 巻き順の修正: mapshaper の出力は d3-geo と逆向きなので、リングを反転する。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geoArea } from 'd3-geo';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'data-src/tokyo.raw.geojson.json');
const DST = join(root, 'src/data/tokyo.geojson.json');
const SIMPLIFY = '10%';
const PRECISION = '0.00001'; // 約1m
const EARTH_RADIUS_KM = 6371;
const MIN_RING_KM2 = 0.0005; // 500㎡未満のリングは潰れたものとして捨てる

const polygonsOf = (geometry) =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

/** d3-geo の符号なし面積（ステラジアン）。時計回りの外周なら小さい値、逆回りなら 4π に近い値になる */
const ringArea = (ring) => geoArea({ type: 'Polygon', coordinates: [ring] });

function normalize(fc) {
  for (const f of fc.features) {
    const polys = [];
    for (const ring of polygonsOf(f.geometry).flat()) {
      const a = ringArea(ring);
      const km2 = Math.min(a, 4 * Math.PI - a) * EARTH_RADIUS_KM ** 2;
      if (km2 < MIN_RING_KM2) continue; // 潰れたリングは向きが判定できないので先に捨てる
      if (a > 2 * Math.PI) throw new Error(`想定外の反時計回りリング: ${f.properties.name}`);
      polys.push([ring]);
    }
    f.geometry = { type: 'MultiPolygon', coordinates: polys };
  }
  return fc;
}

function rewindForD3(fc) {
  for (const f of fc.features) {
    for (const poly of polygonsOf(f.geometry)) for (const ring of poly) ring.reverse();
    if (geoArea(f) > 2 * Math.PI) throw new Error(`巻き順の修正に失敗: ${f.properties.name}`);
  }
  return fc;
}

const work = mkdtempSync(join(tmpdir(), 'tokyo-geo-'));
try {
  const normalized = join(work, 'normalized.json');
  const simplified = join(work, 'simplified.json');
  writeFileSync(normalized, JSON.stringify(normalize(JSON.parse(readFileSync(SRC, 'utf8')))));

  execFileSync(
    join(root, 'node_modules/.bin/mapshaper'),
    [normalized, '-simplify', SIMPLIFY, 'keep-shapes', '-o', simplified, 'format=geojson', `precision=${PRECISION}`],
    { stdio: 'inherit' },
  );

  const out = rewindForD3(JSON.parse(readFileSync(simplified, 'utf8')));
  mkdirSync(dirname(DST), { recursive: true });
  writeFileSync(DST, JSON.stringify(out));
  console.log(`✔ ${DST} (${out.features.length} features, ${(readFileSync(DST).length / 1024).toFixed(0)} KB)`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
