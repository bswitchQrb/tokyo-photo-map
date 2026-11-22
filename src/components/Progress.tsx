import { useState } from 'react';
import type { VisitMap } from '../domain/visit';
import { importCsv } from '../infrastructure/visit-repository';

interface Props {
  visited: VisitMap;
  total: number;
}

/** 進み具合（ページ上部の見出し） */
export function Progress({ visited, total }: Props) {
  const count = visited.size;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="progress">
      <p className="progress-text">
        <span className="progress-count">{count}</span>
        <span className="progress-total"> / {total} 区市</span>
        <span className="progress-pct">{pct}%</span>
      </p>
      <div className="progress-bar" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={total}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface DataMenuProps {
  hasData: boolean;
  onImport: (records: VisitMap) => void;
  onExport: () => void;
  onClear: () => void;
}

/** 記録の読み込み・書き出し・リセット（普段は使わないので控えめに置く） */
export function DataMenu({ hasData, onImport, onExport, onClear }: DataMenuProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const handleImport = async () => {
    const records = await importCsv();
    if (records === null) return; // キャンセル
    if (records.size === 0) {
      setNotice('読み込める記録が見つかりませんでした。このアプリで書き出した CSV を選んでください。');
      return;
    }
    onImport(records);
    setNotice(`${records.size}か所の記録を読み込みました。同じ場所は早いほうの日付を残しています。`);
  };

  return (
    <>
      <div className="data-menu">
        <span className="data-menu-label">記録データ</span>
        <button type="button" className="link-btn" onClick={handleImport}>
          読み込む
        </button>
        <button type="button" className="link-btn" onClick={onExport} disabled={!hasData}>
          書き出す
        </button>
        <button type="button" className="link-btn is-danger" onClick={onClear} disabled={!hasData}>
          すべて消す
        </button>
      </div>
      {notice && (
        <p className="data-notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
}
