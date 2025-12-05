/**
 * Vercel Serverless Function for Anthropic API Proxy
 * 
 * This keeps your API key secure on the server side.
 * 
 * To use:
 * 1. Deploy to Vercel
 * 2. Set ANTHROPIC_API_KEY in Vercel dashboard (Settings → Environment Variables)
 * 3. The function will be available at: https://your-app.vercel.app/api/anthropic/messages
 */

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access')
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: { 
        message: 'Method not allowed. Use POST.',
        type: 'method_not_allowed'
      } 
    })
  }

  // Get API key from environment variable
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is not set')
    return res.status(500).json({ 
      error: { 
        message: 'API key not configured on server',
        type: 'server_error'
      } 
    })
  }

  try {
    // Forward request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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
    return res.status(response.status).json(data)
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
    
    return res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'server_error',
      },
    })
  }
}


