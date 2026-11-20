import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import githubContributionsHandler from './api/github-contributions.ts'
import codingStatusHandler from './api/coding-status.ts'
import contactHandler from './api/contact.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.RESEND_API_KEY && !process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = env.RESEND_API_KEY
  }
  if (env.WEB3FORMS_ACCESS_KEY && !process.env.WEB3FORMS_ACCESS_KEY) {
    process.env.WEB3FORMS_ACCESS_KEY = env.WEB3FORMS_ACCESS_KEY
  }

  return {
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
          server.middlewares.use('/api/contact', (req, res) => {
            void contactHandler(req, res)
          })
        },
      },
    ],
  }
})
