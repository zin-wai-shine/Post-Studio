import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localFsPlugin } from './scripts/localFsPlugin.js';

export default defineConfig({
  plugins: [react(), localFsPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
