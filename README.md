# 🗾 東京ぬりつぶしマップ

GPS付きの写真をアップロードすると、撮影場所の市区を自動判定して東京の地図を塗りつぶしていくWebアプリ。

## 機能

- **写真アップロード** — EXIF GPS から座標を自動取得
- **撮影日表示** — EXIF DateTimeOriginal を参照（なければ当日日付）
- **オフライン判定** — D3.js の geoContains でブラウザ内で市区を特定（外部API不要）
- **塗りつぶし地図** — 訪問済みエリアがパープルに変化
- **周辺県・海の背景** — 東京の位置がわかりやすい地図表示
- **23区/市 境界線** — SVG mask で区エリアと市エリアの境界を太く表示
- **CSV保存** — 新エリア追加時に `visited.csv` を自動ダウンロード
- **CSV読込** — 過去データのインポートに対応
- **進捗表示** — 49エリア中の制覇率をプログレスバーで表示

## 対象エリア

- 23特別区（千代田区〜江戸川区）
- 26市（八王子市〜西東京市）
- **計49エリア**（島しょ部は除外）

## 技術スタック

- **Rsbuild** — ビルドツール
- **React 19 + TypeScript**
- **D3-geo** — GeoJSON → SVG パス変換、点-ポリゴン判定
- **exifr** — EXIF GPS / 撮影日読み取り
- **GeoJSON** — 国土数値情報ベースの東京市区町村境界データ

## ディレクトリ構成

```
src/
├── App.tsx              # メインコンポーネント
├── App.css              # スタイル
├── components/
│   ├── TokyoMap.tsx     # D3-geo SVG地図（周辺県・海・境界線）
│   ├── PhotoUploader.tsx # 写真アップ・EXIF読取・プレビュー
│   └── Stats.tsx        # 進捗・CSV読込・リセット
├── utils/
│   ├── exif.ts          # exifr でGPS+日付を抽出
│   ├── geo.ts           # geoContains で市区判定
│   └── storage.ts       # CSV読込/保存・localStorage
└── data/
    ├── tokyo.geojson.json     # 東京49市区の境界
    └── neighbors.geojson.json # 周辺4県の境界（埼玉・千葉・神奈川・山梨）
public/
└── visited.csv          # 訪問記録CSV（アプリ起動時に読込）
```

## データフロー

```
写真(EXIF) → exifr.gps() → [lat, lng]
          → D3 geoContains(feature, [lng, lat]) → 市区名
          → visited Map に追加 → SVG再描画 + CSV自動ダウンロード
```

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # dist/ に出力
```

## 運用

1. 写真をアップして塗りつぶし
2. 自動ダウンロードされた `visited.csv` を `public/visited.csv` に配置
3. 次回起動時に自動読込
