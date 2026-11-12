import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import githubContributionsHandler from './api/github-contributions.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-github-contributions',
      configureServer(server) {
        server.middlewares.use('/api/github-contributions', (req, res) => {
          void githubContributionsHandler(req, res)
        })
      },
    },
  ],
})
