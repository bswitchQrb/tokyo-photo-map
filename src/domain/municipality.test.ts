import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import tokyoGeoJson from '../data/tokyo.geojson.json';
import { findMunicipality, isWard, listMunicipalities } from './municipality';

const geojson = tokyoGeoJson as unknown as FeatureCollection;

describe('簡略化した境界データ', () => {
  it('23区と26市の49区市がそろっている', () => {
    const list = listMunicipalities(geojson);
    expect(list).toHaveLength(49);
    expect(list.filter((m) => isWard(m.code))).toHaveLength(23);
  });

  // 簡略化や巻き順の修正で壊れやすい場所（埋立地・飛び地・境界の近く）を中心に確認する
  it.each([
    ['東京駅', 139.7671, 35.6812, '千代田区'],
    ['新宿駅', 139.7006, 35.6896, '新宿区'],
    ['有明（埋立地）', 139.7926, 35.6347, '江東区'],
    ['葛西臨海公園', 139.8619, 35.6413, '江戸川区'],
    ['羽田空港', 139.7798, 35.5494, '大田区'],
    ['お台場海浜公園', 139.7765, 35.6293, '港区'],
    ['八王子駅', 139.3389, 35.6558, '八王子市'],
    ['吉祥寺駅', 139.5797, 35.7031, '武蔵野市'],
  ])('%s は %s', (_label, lng, lat, expected) => {
    expect(findMunicipality(geojson, lng, lat)?.name).toBe(expected);
  });

  it.each([
    ['横浜駅（神奈川県）', 139.6222, 35.4658],
    ['奥多摩駅（町なので対象外）', 139.0967, 35.8094],
    ['東京湾の海上', 139.85, 35.55],
  ])('%s はどの区市にも入らない', (_label, lng, lat) => {
    expect(findMunicipality(geojson, lng, lat)).toBeNull();
  });
});
