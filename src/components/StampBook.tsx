import type { MunicipalityProps } from '../domain/municipality';
import { isWard } from '../domain/municipality';
import type { VisitMap } from '../domain/visit';

interface Props {
  municipalities: MunicipalityProps[];
  visited: VisitMap;
  /** 直前のアップロードで新しく押されたスタンプ（押印アニメーション用） */
  freshCodes: ReadonlySet<string>;
  /** 写真が保存されている区市 */
  photoCodes: ReadonlySet<string>;
  onOpen: (code: string) => void;
}

type GroupProps = Omit<Props, 'municipalities'> & { title: string; items: MunicipalityProps[] };

/** コードから決まる -8°〜+8° の傾き。毎回同じ角度で押されているように見せる */
const tiltOf = (code: string) => ((Number(code) * 37) % 17) - 8;

/** "2026/1/5" → "1.5" */
const shortDate = (visitedAt: string) => visitedAt.split('/').slice(1).join('.');

export function StampBook({ municipalities, ...rest }: Props) {
  const wards = municipalities.filter((m) => isWard(m.code));
  const cities = municipalities.filter((m) => !isWard(m.code));

  return (
    <section className="stamp-book" aria-label="スタンプ帳">
      <StampGroup title="23区" items={wards} {...rest} />
      <StampGroup title="多摩の市" items={cities} {...rest} />
    </section>
  );
}

function StampGroup({ title, items, visited, freshCodes, photoCodes, onOpen }: GroupProps) {
  const count = items.filter((m) => visited.has(m.code)).length;

  return (
    <div className="stamp-group">
      <h3 className="stamp-group-title">
        {title}
        <span className="stamp-group-count">
          {count} / {items.length}
        </span>
      </h3>
      <ul className="stamp-grid">
        {items.map((m) => {
          const record = visited.get(m.code);
          return (
            <li key={m.code} className="stamp-slot">
              {record ? (
                <button
                  type="button"
                  className={`stamp${freshCodes.has(m.code) ? ' is-fresh' : ''}${photoCodes.has(m.code) ? ' has-photo' : ''}`}
                  data-len={m.name.length}
                  style={{ '--tilt': `${tiltOf(m.code)}deg` } as React.CSSProperties}
                  title={`${m.name}（${record.visitedAt}）`}
                  aria-label={`${m.name}、${record.visitedAt}に訪問。${photoCodes.has(m.code) ? '写真を見る' : '記録を見る'}`}
                  onClick={() => onOpen(m.code)}
                >
                  <span className="stamp-name">{m.name}</span>
                  <span className="stamp-date">{shortDate(record.visitedAt)}</span>
                </button>
              ) : (
                <span className="stamp-empty" data-len={m.name.length}>
                  {m.name}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
