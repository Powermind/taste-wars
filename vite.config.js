import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/', // GitHub Pages subpath
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
