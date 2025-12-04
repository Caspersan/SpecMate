import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read .env file manually to get API key
function getApiKeyFromEnv(): string | null {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const match = envContent.match(/VITE_ANTHROPIC_API_KEY=(.+)/)
    if (match && match[1]) {
      return match[1].trim()
    }
  } catch (error) {
    console.error('[Vite Config] Could not read .env file')
  }
  return null
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split PDF generation libraries into separate chunk
          'pdf-libs': ['jspdf'],
          'canvas-libs': ['html2canvas'],
          // Split vendor libraries
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit since we have large PDF libraries
  },
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        secure: true,
        selfHandleResponse: false,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, '/v1'),
        configure: (proxy, _options) => {
          const apiKeyFromEnv = getApiKeyFromEnv()
          
          console.log('[Proxy] Anthropic proxy configured')
          console.log('[Proxy] API Key loaded:', apiKeyFromEnv ? `YES (${apiKeyFromEnv.substring(0, 15)}...)` : 'NO')
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Proxy] Incoming request:', req.method, req.url)
            // Ensure the API key is set on every request
            if (apiKeyFromEnv) {
              proxyReq.removeHeader('x-api-key')
              proxyReq.setHeader('x-api-key', apiKeyFromEnv)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
              console.log('[Proxy] Headers set: x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access')
            } else {
              console.error('[Proxy] ERROR: No API key found in .env file')
            }
          })
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Proxy] Response status:', proxyRes.statusCode, 'for', req.url)
            if (proxyRes.statusCode === 401) {
              console.error('[Proxy] 401 Unauthorized - API key may be invalid')
            }
          })
          
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy Error]:', err.message)
          })
        },
      },
    },
  },
})

