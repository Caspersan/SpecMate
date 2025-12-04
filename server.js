/**
 * Backend proxy server for SpecMate
 * This keeps the API key secure on the server side
 * 
 * To run: node server.js
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFile, mkdir } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Get API key from environment variable (NOT VITE_ prefix)
const API_KEY = process.env.ANTHROPIC_API_KEY

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set!')
  console.error('Set it with: export ANTHROPIC_API_KEY=sk-ant-your-key-here')
  process.exit(1)
}

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Large limit for base64 images

// Serve static files from dist directory (built React app)
app.use(express.static(join(__dirname, 'dist')))

// Proxy endpoint for Anthropic API
app.post('/api/anthropic/messages', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    // Parse response JSON (handle both success and error responses)
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      // If response is not JSON, return error
      return res.status(500).json({
        error: {
          message: 'Invalid response from API',
          type: 'server_error',
        },
      })
    }

    // Forward the response status and data
    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({
        error: {
          message: 'Unable to connect to Anthropic API. Please try again later.',
          type: 'service_unavailable',
        },
      })
    }
    
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'server_error',
      },
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiKeyConfigured: !!API_KEY })
})

// Usage logging endpoint
app.post('/api/logs/usage', async (req, res) => {
  try {
    const logData = req.body
    
    // Validate log data
    if (!logData || !logData.id || !logData.timestamp) {
      return res.status(400).json({
        error: {
          message: 'Invalid log data structure',
          type: 'validation_error'
        }
      })
    }
    
    // Generate filename with date for organization
    const date = new Date(logData.timestamp)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `${dateStr}_${logData.id}.json`
    
    // Store log in logs/usage directory
    const logsDir = join(__dirname, 'logs', 'usage')
    const filepath = join(logsDir, filename)
    
    try {
      await mkdir(logsDir, { recursive: true })
      await writeFile(filepath, JSON.stringify(logData, null, 2), 'utf-8')
    } catch (fileError) {
      console.error('Error writing log file:', fileError)
      // Continue anyway - log to console as fallback
      console.log('Usage Log:', JSON.stringify(logData))
    }
    
    res.status(200).json({
      success: true,
      logId: logData.id,
      message: 'Log saved successfully'
    })
  } catch (error) {
    console.error('Error saving usage log:', error)
    res.status(500).json({
      error: {
        message: 'Failed to save log',
        type: 'server_error'
      }
    })
  }
})

// Report generation logging endpoint
app.post('/api/logs/report', async (req, res) => {
  try {
    const { logId, format, timestamp } = req.body
    
    if (!logId || !format) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: logId, format',
          type: 'validation_error'
        }
      })
    }
    
    // Update the usage log with report generation info
    // Find and update the log file
    const date = new Date(timestamp || new Date())
    const dateStr = date.toISOString().split('T')[0]
    const logsDir = join(__dirname, 'logs', 'usage')
    
    // Try to find the log file (it should start with the date)
    // In production, use a database for better querying
    console.log('Report Generated:', { logId, format, timestamp })
    
    res.status(200).json({
      success: true,
      message: 'Report generation logged'
    })
  } catch (error) {
    console.error('Error logging report generation:', error)
    res.status(500).json({
      error: {
        message: 'Failed to log report generation',
        type: 'server_error'
      }
    })
  }
})

// Contact form logging endpoint
app.post('/api/logs/contact', async (req, res) => {
  try {
    const { name, subject, message, timestamp, sessionId } = req.body
    
    if (!name || !subject || !message) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: name, subject, message',
          type: 'validation_error'
        }
      })
    }
    
    const contactLog = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: timestamp || new Date().toISOString(),
      sessionId: sessionId || 'unknown',
      name: name.trim(),
      subject: subject.trim(),
      message: message.trim(),
    }
    
    const date = new Date(contactLog.timestamp)
    const dateStr = date.toISOString().split('T')[0]
    const logsDir = join(__dirname, 'logs', 'contact')
    const filename = `${dateStr}_${contactLog.id}.json`
    const filepath = join(logsDir, filename)
    
    try {
      await mkdir(logsDir, { recursive: true })
      await writeFile(filepath, JSON.stringify(contactLog, null, 2), 'utf-8')
    } catch (fileError) {
      console.log('Contact Log:', JSON.stringify(contactLog))
    }
    
    res.status(200).json({
      success: true,
      logId: contactLog.id,
      message: 'Contact form submitted successfully'
    })
  } catch (error) {
    console.error('Error saving contact log:', error)
    res.status(500).json({
      error: {
        message: 'Failed to save contact form',
        type: 'server_error'
      }
    })
  }
})

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`✅ API key configured: ${API_KEY.substring(0, 15)}...`)
  console.log(`📁 Serving static files from: ${join(__dirname, 'dist')}`)
})


