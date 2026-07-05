import { defineConfig } from 'vite';

export default defineConfig({
  base: '/debug-till-dawn/',
  server: { open: true },
  // Phaser 큰 번들 → 청크 경고 끔
  build: { chunkSizeWarningLimit: 2000 },
});
