import { describe, expect, it } from 'vitest';
import type { VisitMap, VisitRecord } from '../domain/visit';
import { buildCsvText, parseCsv, splitCsv } from './visit-repository';

const rec = (overrides: Partial<VisitRecord> = {}): VisitRecord => ({
  code: '13101',
  name: '千代田区',
  visitedAt: '2026/11/15',
  photoName: 'IMG_0001.jpg',
  latitude: 35.6812,
  longitude: 139.7671,
  ...overrides,
});

describe('splitCsv', () => {
  it('クォート内のカンマ・改行・エスケープされた二重引用符を扱える', () => {
    expect(splitCsv('a,"b,c","d\ne","f""g"\n')).toEqual([['a', 'b,c', 'd\ne', 'f"g']]);
  });

  it('CRLF と LF のどちらの改行でも読める', () => {
    expect(splitCsv('a,b\r\nc,d\ne,f')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ]);
  });

  it('空のフィールドを保つ', () => {
    expect(splitCsv('a,,c\n')).toEqual([['a', '', 'c']]);
  });
});

describe('buildCsvText → parseCsv', () => {
  it('書き出した CSV をそのまま読み戻せる（ファイル名にカンマや引用符があっても）', () => {
    const original: VisitMap = new Map([
      ['13101', rec({ photoName: '東京駅, 丸の内 "夜".jpg' })],
      ['13108', rec({ code: '13108', name: '江東区', visitedAt: '2026/5/2', photoName: 'a\nb.jpg' })],
    ]);
    expect(parseCsv(buildCsvText(original))).toEqual(original);
  });

  it('先頭の BOM を無視する', () => {
    const text = '﻿' + buildCsvText(new Map([['13101', rec()]]));
    expect(parseCsv(text).get('13101')?.name).toBe('千代田区');
  });
});

describe('parseCsv', () => {
  it('列の並びが違っても見出しで読める', () => {
    const text = 'name,code,latitude,longitude,visitedAt,photoName\n千代田区,13101,35.68,139.76,2026/1/5,x.jpg\n';
    expect(parseCsv(text).get('13101')).toEqual(
      rec({ visitedAt: '2026/1/5', photoName: 'x.jpg', latitude: 35.68, longitude: 139.76 }),
    );
  });

  it('同じ区市が複数行あるときは早い日付の行を残す', () => {
    const text = [
      'code,name,visitedAt,photoName,latitude,longitude',
      '13101,千代田区,2026/10/1,late.jpg,35.68,139.76',
      '13101,千代田区,2026/9/1,early.jpg,35.68,139.76',
    ].join('\n');
    expect(parseCsv(text).get('13101')?.photoName).toBe('early.jpg');
  });

  it('コードが5桁の数字でない行と、見出しが無いファイルは読まない', () => {
    const text = 'code,name,visitedAt,photoName,latitude,longitude\nabc,千代田区,2026/1/1,x.jpg,0,0\n\n';
    expect(parseCsv(text).size).toBe(0);
    expect(parseCsv('13101,千代田区,2026/1/1,x.jpg,0,0\n').size).toBe(0);
    expect(parseCsv('').size).toBe(0);
  });
});
