import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import githubContributionsHandler from './api/github-contributions.ts'
import codingStatusHandler from './api/coding-status.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-endpoints',
      configureServer(server) {
        server.middlewares.use('/api/github-contributions', (req, res) => {
          void githubContributionsHandler(req, res)
        })
        server.middlewares.use('/api/coding-status', (req, res) => {
          void codingStatusHandler(req, res)
        })
      },
    },
  ],
})
