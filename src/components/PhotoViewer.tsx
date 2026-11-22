import { useEffect, useRef, useState } from 'react';
import type { VisitRecord } from '../domain/visit';
import type { StoredPhoto } from '../infrastructure/photo-store';
import { getPhoto } from '../infrastructure/photo-store';

interface Props {
  /** 開いている区市の記録。null なら閉じている */
  record: VisitRecord | null;
  onClose: () => void;
}

type State = { status: 'loading' } | { status: 'none' } | { status: 'ready'; url: string; photo: StoredPhoto };

/** 区市の思い出の写真を、写真を1枚貼ったカードとして見せる */
export function PhotoViewer({ record, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>({ status: 'loading' });

  // 開閉を <dialog> に反映する
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (record && !dialog.open) dialog.showModal();
    if (!record && dialog.open) dialog.close();
  }, [record]);

  // 写真を読み込み、閉じたら ObjectURL を解放する
  const code = record?.code;
  useEffect(() => {
    if (!code) return;
    let url: string | null = null;
    let cancelled = false;
    setState({ status: 'loading' });
    getPhoto(code)
      .then((photo) => {
        if (cancelled) return;
        if (!photo) return setState({ status: 'none' });
        url = URL.createObjectURL(photo.blob);
        setState({ status: 'ready', url, photo });
      })
      .catch(() => !cancelled && setState({ status: 'none' }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [code]);

  return (
    <dialog
      ref={dialogRef}
      className="photo-viewer"
      aria-label={record ? `${record.name}の写真` : undefined}
      onClose={onClose}
      // 枠の外（背景）をタップしたら閉じる
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {record && (
        <figure className="photo-card">
          <div className="photo-card-frame">
            {state.status === 'ready' && <img src={state.url} alt={`${record.name}で撮った写真`} />}
            {state.status === 'loading' && <div className="photo-card-empty" />}
            {state.status === 'none' && (
              <div className="photo-card-empty">
                <p>この場所の写真は保存されていません</p>
                <p className="photo-card-empty-sub">CSV から読み込んだ記録や、写真の保存に対応する前の記録です</p>
              </div>
            )}
          </div>
          <figcaption className="photo-card-caption">
            <span className="photo-card-name">{record.name}</span>
            <span className="photo-card-date">
              {state.status === 'ready' ? state.photo.takenAt : record.visitedAt}
            </span>
          </figcaption>
          <button type="button" className="photo-card-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </figure>
      )}
    </dialog>
  );
}
