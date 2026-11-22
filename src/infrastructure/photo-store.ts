/**
 * 区市ごとの思い出の写真（縮小したサムネイル）を IndexedDB に保存する。
 * 1つの区市に1枚だけ持ち、キーは区市コード。写真はこの端末のブラウザの外には出さない。
 */

export interface StoredPhoto {
  code: string;
  blob: Blob;
  /** 撮影日（"YYYY/M/D"） */
  takenAt: string;
  photoName: string;
}

const DB_NAME = 'tokyo-photo-map';
const DB_VERSION = 1;
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: 'code' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    // 失敗したら次回また開き直せるようにする
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function putPhoto(photo: StoredPhoto): Promise<void> {
  await run('readwrite', (s) => s.put(photo));
}

export async function getPhoto(code: string): Promise<StoredPhoto | null> {
  return (await run<StoredPhoto | undefined>('readonly', (s) => s.get(code))) ?? null;
}

/** 写真がある区市コードの一覧（写真本体は読まない） */
export async function listPhotoCodes(): Promise<string[]> {
  return (await run('readonly', (s) => s.getAllKeys())).map(String);
}

export async function clearPhotos(): Promise<void> {
  await run('readwrite', (s) => s.clear());
}

/**
 * ブラウザに「このサイトのデータを勝手に消さないで」と頼む。
 * 認められるかはブラウザ次第（Safari は使われていないサイトのデータを消すことがある）
 */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) {
      await navigator.storage.persist?.();
    }
  } catch {
    // 対応していなくても動作には影響しない
  }
}
