import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const isGHPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: 'Tokyo Photo Map - 東京塗りつぶしマップ',
  },
  output: {
    assetPrefix: isGHPages ? './' : '/',
  },
});
