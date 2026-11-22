/** 保存するサムネイルの長辺（px） */
export const THUMBNAIL_MAX_SIZE = 800;
const JPEG_QUALITY = 0.82;

/** 縦横比を保ったまま、長辺が max 以下になる大きさを返す（拡大はしない） */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * 写真を縮小した JPEG にする。EXIF の向きは反映し、位置情報などのメタデータは含まれない。
 * ブラウザが読めない形式（PC の HEIC など）のときは null
 */
export async function makeThumbnail(file: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = fitWithin(bitmap.width, bitmap.height, THUMBNAIL_MAX_SIZE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  } catch {
    return null;
  }
}
