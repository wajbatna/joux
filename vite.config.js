import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Use Vite's default esbuild minifier; terser is not installed.
    minify: 'esbuild'
  },
  server: {
    port: 3000,
    open: true
  }
});
