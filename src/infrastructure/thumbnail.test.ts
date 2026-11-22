import { describe, expect, it } from 'vitest';
import { fitWithin } from './thumbnail';

describe('fitWithin', () => {
  it('横長・縦長とも長辺を上限に合わせて縮める', () => {
    expect(fitWithin(4032, 3024, 800)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(3024, 4032, 800)).toEqual({ width: 600, height: 800 });
  });

  it('上限より小さい写真は拡大しない', () => {
    expect(fitWithin(640, 480, 800)).toEqual({ width: 640, height: 480 });
  });

  it('極端に細長くても 0px にはならない', () => {
    expect(fitWithin(10000, 5, 800)).toEqual({ width: 800, height: 1 });
  });
});
