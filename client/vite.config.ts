import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url'; // Modern yol çözümlemesi için eklendi
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ClinicAdmin Dashboard',
        short_name: 'ClinicAdmin',
        description: 'Small Clinic Management Dashboard',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true, // PWA'yı geliştirme modunda etkinleştir
      },
    }),
  ],
  resolve: {
    alias: {
      // '@': path.resolve(__dirname, './src'), // <-- Hatalı olan buydu
      '@': fileURLToPath(new URL('./src', import.meta.url)), // <-- Düzeltilmiş versiyon
    },
  },
  server: {
    port: 3000,
    proxy: {
      // API isteklerini backend'e yönlendir
      '/api': {
        target: 'http://localhost:5001', // Backend sunucu adresi
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    // Jest/Playwright test ortamlarını ayırt etmek için
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});