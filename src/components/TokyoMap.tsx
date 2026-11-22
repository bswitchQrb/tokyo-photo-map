import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import type { MunicipalityFeature } from '../domain/municipality';
import { isWard } from '../domain/municipality';
import type { VisitMap } from '../domain/visit';
import { mapColors as c } from '../theme/colors';

interface Props {
  geojson: FeatureCollection;
  visited: VisitMap;
}

const WIDTH = 800;
const HEIGHT = 440;
const PADDING = 16;

/** ラベルの位置（地図に対する割合）。端に寄りすぎるとはみ出すので内側に寄せる */
interface LabelPos {
  x: number;
  y: number;
}

export function TokyoMap({ geojson, visited }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [pos, setPos] = useState<LabelPos | null>(null);

  const { pathGen, features, wardPathD, cityPathD } = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [PADDING, PADDING],
        [WIDTH - PADDING, HEIGHT - PADDING],
      ],
      geojson,
    );
    const gen = geoPath().projection(projection);
    const feats = geojson.features as MunicipalityFeature[];

    let wardD = '';
    let cityD = '';
    for (const feat of feats) {
      const d = gen(feat) ?? '';
      if (isWard(feat.properties.code)) wardD += d;
      else cityD += d;
    }
    return { pathGen: gen, features: feats, wardPathD: wardD, cityPathD: cityD };
  }, [geojson]);

  const updatePos = useCallback((clientX: number, clientY: number) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    setPos({
      x: clamp(((clientX - rect.left) / rect.width) * 100, 14, 86),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 18, 100),
    });
  }, []);

  // マウスはホバーで、タッチはタップでエリアを選ぶ
  const handleHover = useCallback(
    (code: string, e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      setActive(code);
      updatePos(e.clientX, e.clientY);
    },
    [updatePos],
  );

  const handleSelect = useCallback(
    (code: string, e: React.MouseEvent) => {
      setActive(code);
      updatePos(e.clientX, e.clientY);
    },
    [updatePos],
  );

  const activeFeature = active ? features.find((f) => f.properties.code === active) : null;
  const activeRecord = active ? visited.get(active) : undefined;

  return (
    <div className="map-wrapper" ref={wrapperRef}>
      <svg
        className="map-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`東京の地図。${visited.size}エリアを訪問済み`}
        onPointerMove={(e) => e.pointerType === 'mouse' && active && updatePos(e.clientX, e.clientY)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        onClick={(e) => e.target === e.currentTarget && setActive(null)}
      >
        <defs>
          <mask id="ward-outline-mask">
            <rect width={WIDTH} height={HEIGHT} fill="white" />
            <path d={wardPathD} fill="black" />
          </mask>
          <mask id="city-outline-mask">
            <rect width={WIDTH} height={HEIGHT} fill="white" />
            <path d={cityPathD} fill="black" />
          </mask>
        </defs>

        {features.map((feat) => (
          <MunicipalityPath
            key={feat.properties.code}
            code={feat.properties.code}
            d={pathGen(feat) ?? ''}
            isVisited={visited.has(feat.properties.code)}
            isActive={active === feat.properties.code}
            onHover={handleHover}
            onSelect={handleSelect}
          />
        ))}

        {/* 23区と市部の外周だけを太線にする（内側の境界はマスクで隠す） */}
        <path d={wardPathD} fill="none" stroke={c.border} strokeWidth={c.borderWidth} mask="url(#ward-outline-mask)" pointerEvents="none" />
        <path d={cityPathD} fill="none" stroke={c.border} strokeWidth={c.borderWidth} mask="url(#city-outline-mask)" pointerEvents="none" />
      </svg>

      {activeFeature && pos && (
        <div className="map-label" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} role="status">
          <span className="map-label-name">{activeFeature.properties.name}</span>
          <span className="map-label-date">
            {activeRecord ? `${activeRecord.visitedAt} に訪問` : 'まだ行っていない'}
          </span>
        </div>
      )}
    </div>
  );
}

const MunicipalityPath = memo(function MunicipalityPath({
  code,
  d,
  isVisited,
  isActive,
  onHover,
  onSelect,
}: {
  code: string;
  d: string;
  isVisited: boolean;
  isActive: boolean;
  onHover: (code: string, e: React.PointerEvent) => void;
  onSelect: (code: string, e: React.MouseEvent) => void;
}) {
  let fill = isVisited ? c.visited : c.municipality;
  if (isActive) fill = isVisited ? c.visitedHover : c.municipalityHover;

  return (
    <path
      className="municipality"
      d={d}
      fill={fill}
      stroke={isActive ? c.strokeActive : c.stroke}
      strokeWidth={isActive ? c.strokeWidthActive : c.strokeWidth}
      strokeLinejoin="round"
      onPointerEnter={(e) => onHover(code, e)}
      onClick={(e) => onSelect(code, e)}
    />
  );
});
