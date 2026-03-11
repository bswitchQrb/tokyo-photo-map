import exifr from 'exifr';

/** 写真のメタデータ */
export interface PhotoMeta {
  latitude: number;
  longitude: number;
  dateStr: string;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}/${m}/${d}`;
}

/** 写真ファイルからGPS・日付メタデータを抽出 */
export async function extractPhotoMeta(file: File): Promise<PhotoMeta | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps?.latitude || !gps?.longitude) return null;

    let dateStr: string;
    try {
      const exif = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
      const photoDate = exif?.DateTimeOriginal ?? exif?.CreateDate;
      dateStr = photoDate instanceof Date ? formatDate(photoDate) : formatDate(new Date());
    } catch {
      dateStr = formatDate(new Date());
    }

    return { latitude: gps.latitude, longitude: gps.longitude, dateStr };
  } catch {
    return null;
  }
}
