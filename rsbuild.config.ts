import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const isGHPages = process.env.GITHUB_ACTIONS === 'true';

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Klee+One:wght@600&family=Zen+Maru+Gothic:wght@400;700&display=swap';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: '東京ぬりつぶしマップ — 写真で集める東京のスタンプ帳',
    meta: {
      description: '位置情報つきの写真を選ぶだけで、行った区や市にスタンプが押される東京のぬりつぶしマップ。写真はブラウザの中だけで処理します。',
      'theme-color': '#f5eedf',
    },
    tags: [
      { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
      { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
      { tag: 'link', attrs: { rel: 'stylesheet', href: FONTS_URL } },
    ],
  },
  output: {
    assetPrefix: isGHPages ? './' : '/',
  },
});
