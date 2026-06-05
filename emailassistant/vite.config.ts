import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin to 5173 so the dev server never silently drifts to another port.
    // Port drift breaks OAuth (redirect URI is fixed to 5173) and strands
    // per-origin localStorage (tags/statuses saved under a different port).
    // strictPort makes Vite fail loudly if 5173 is busy instead of moving.
    port: 5173,
    strictPort: true,
    // Native FS events are not firing reliably in this workspace, which caused
    // the dev server to serve stale modules. Polling guarantees edits are detected.
    watch: { usePolling: true, interval: 200 },
  },
})
