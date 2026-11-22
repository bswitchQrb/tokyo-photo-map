import { useMemo, useState, useCallback, memo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection } from 'geojson';
import type { MunicipalityFeature } from '../domain/municipality';
import { isWard } from '../domain/municipality';
import type { VisitMap } from '../domain/visit';
import { colors } from '../theme/colors';

const c = colors.map;

interface Props {
  geojson: FeatureCollection;
  visited: VisitMap;
  width: number;
  height: number;
}

export function TokyoMap({ geojson, visited, width, height }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  const { pathGen, features, wardPathD, cityPathD } = useMemo(() => {
    const projection = geoMercator().fitSize(
      [width * 0.85, height * 0.85],
      geojson,
    );
    const center = projection.translate();
    projection.translate([center[0] + width * 0.075, center[1] + height * 0.075]);

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
  }, [geojson, width, height]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    setTooltip({
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height),
    });
  }, [width, height]);

  const hoveredFeature = hovered
    ? features.find((f) => f.properties.code === hovered)
    : null;
  const hoveredRecord = hovered ? visited.get(hovered) : null;

  return (
    <div className="map-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: width, overflow: 'hidden', borderRadius: 12 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHovered(null); setTooltip(null); }}
      >
        <rect width={width} height={height} fill={c.background} rx={8} onMouseEnter={() => setHovered(null)} />

        <defs>
          <mask id="ward-outline-mask">
            <rect width={width} height={height} fill="white" />
            <path d={wardPathD} fill="black" />
          </mask>
          <mask id="city-outline-mask">
            <rect width={width} height={height} fill="white" />
            <path d={cityPathD} fill="black" />
          </mask>
        </defs>

        {features.map((feat) => (
          <MunicipalityPath
            key={feat.properties.code}
            feat={feat}
            d={pathGen(feat) ?? ''}
            isVisited={visited.has(feat.properties.code)}
            isHovered={hovered === feat.properties.code}
            onMouseEnter={setHovered}
          />
        ))}

        <path d={wardPathD} fill="none" stroke={c.border} strokeWidth={c.borderWidth} mask="url(#ward-outline-mask)" style={{ pointerEvents: 'none' }} />
        <path d={cityPathD} fill="none" stroke={c.border} strokeWidth={c.borderWidth} mask="url(#city-outline-mask)" style={{ pointerEvents: 'none' }} />

        {hoveredFeature && tooltip && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={tooltip.x + 12}
              y={tooltip.y - 36}
              rx={8}
              ry={8}
              width={hoveredRecord
                ? hoveredFeature.properties.name.length * 18 + 100
                : hoveredFeature.properties.name.length * 18 + 20}
              height={30}
              fill={c.tooltip}
            />
            <text
              x={tooltip.x + 22}
              y={tooltip.y - 17}
              fill={c.tooltipText}
              fontSize={14}
              fontFamily="sans-serif"
            >
              {hoveredFeature.properties.name}
              {hoveredRecord ? `（${hoveredRecord.visitedAt}）` : ''}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

const MunicipalityPath = memo(function MunicipalityPath({
  feat,
  d,
  isVisited,
  isHovered,
  onMouseEnter,
}: {
  feat: MunicipalityFeature;
  d: string;
  isVisited: boolean;
  isHovered: boolean;
  onMouseEnter: (code: string) => void;
}) {
  const code = feat.properties.code;

  let fill: string = c.municipalityDefault;
  if (isVisited && isHovered) fill = c.municipalityVisitedHover;
  else if (isVisited) fill = c.municipalityVisited;
  else if (isHovered) fill = c.municipalityHover;

  return (
    <path
      d={d}
      fill={fill}
      stroke={isHovered ? c.strokeHover : c.stroke}
      strokeWidth={isHovered ? c.strokeWidthHover : c.strokeWidth}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onMouseEnter(code)}
    />
  );
});
