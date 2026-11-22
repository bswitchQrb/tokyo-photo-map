# 🗾 東京ぬりつぶしマップ

> **https://bswitchqrb.github.io/tokyo-photo-map/**

GPS付きの写真をアップロードすると、撮影場所の市区を自動判定して東京の地図を塗りつぶしていくWebアプリ。

## 機能

- **写真アップロード** — EXIF GPS から座標を自動取得
- **撮影日表示** — EXIF DateTimeOriginal を参照（なければ当日日付）
- **オフライン判定** — D3.js の geoContains でブラウザ内で市区を特定（外部API不要）
- **塗りつぶし地図** — 訪問済みエリアがグリーンに変化
- **23区/市 境界線** — SVG mask で区エリアと市エリアの境界を表示
- **自動保存** — localStorage で訪問データを自動永続化
- **CSV読込/エクスポート** — データのインポート・エクスポートに対応
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

## ディレクトリ構成（DDD）

```
src/
├── domain/                    # ドメイン層
│   ├── municipality.ts        #   市区町村（型・判定・検索）
│   ├── visit.ts               #   訪問記録（型・追加・マージ）
│   └── photo.ts               #   写真メタデータ（EXIF抽出）
├── infrastructure/            # インフラ層
│   └── visit-repository.ts    #   永続化（localStorage / CSV）
├── theme/                     # テーマ
│   └── colors.ts              #   地図（SVG）の配色
├── components/                # プレゼンテーション層
│   ├── TokyoMap.tsx            #   D3-geo SVG地図
│   ├── PhotoUploader.tsx       #   写真アップ・プレビュー
│   ├── StampBook.tsx           #   49区市のスタンプ帳
│   └── Progress.tsx            #   進捗・記録データの読込/書出/リセット
├── App.tsx                    # アプリルート
├── App.css                    # スタイル（CSS変数）
└── data/
    └── tokyo.geojson.json     # 東京49市区の境界（npm run geo:build で生成）
```

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # dist/ に出力
```

### 境界データの再生成

`data-src/tokyo.raw.geojson.json`（元データ・約10MB）を簡略化して、アプリに同梱する `src/data/tokyo.geojson.json`（約120KB）を作り直します。

```bash
npm run geo:build
```
