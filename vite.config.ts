import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Three and Rapier dwarf the game code; splitting them keeps the app
        // chunk small enough to iterate on without re-shipping the engine.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('@dimforge/rapier') || id.includes('@react-three/rapier')) {
            return 'physics';
          }
          if (id.includes('@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
});
