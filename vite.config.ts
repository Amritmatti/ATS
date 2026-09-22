import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inside a container there is no browser to open, and bind-mounted file events do not
// propagate from a Windows host, so the watcher has to poll.
const inDocker = process.env.DOCKER === '1'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    host: inDocker ? true : 'localhost',
    open: !inDocker,
    watch: inDocker ? { usePolling: true, interval: 300 } : undefined,
  },
  preview: {
    port: 8080,
    host: inDocker ? true : 'localhost',
  },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1600 },
})
