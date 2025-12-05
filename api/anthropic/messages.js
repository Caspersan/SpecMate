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
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('API')))
    return res.status(500).json({ 
      error: { 
        message: 'API key not configured on server. Please set ANTHROPIC_API_KEY in Vercel environment variables.',
        type: 'server_error',
        details: 'The ANTHROPIC_API_KEY environment variable is missing. Go to Vercel Dashboard → Settings → Environment Variables to add it.'
      } 
    })
  }
  
  // Validate API key format
  if (!apiKey.startsWith('sk-ant-')) {
    console.error('ANTHROPIC_API_KEY has invalid format (should start with "sk-ant-")')
    return res.status(500).json({ 
      error: { 
        message: 'Invalid API key format on server',
        type: 'server_error',
        details: 'API key should start with "sk-ant-". Please verify your ANTHROPIC_API_KEY in Vercel environment variables.'
      } 
    })
  }

  try {
    // Log request details (without sensitive data)
    console.log('Forwarding request to Anthropic API')
    console.log('Request body keys:', Object.keys(req.body || {}))
    console.log('Model:', req.body?.model)
    console.log('Messages count:', req.body?.messages?.length)
    
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
    
    console.log('Anthropic API response status:', response.status, response.statusText)

    // Parse response JSON (handle both success and error responses)
    let data
    try {
      const responseText = await response.text()
      console.log('Response preview:', responseText.substring(0, 200))
      
      if (!responseText) {
        return res.status(500).json({
          error: {
            message: 'Empty response from Anthropic API',
            type: 'server_error',
            details: 'The API returned an empty response. This may indicate a service issue.'
          },
        })
      }
      
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError)
      // If response is not JSON, return error
      return res.status(500).json({
        error: {
          message: 'Invalid response from Anthropic API',
          type: 'server_error',
          details: parseError.message || 'Response was not valid JSON'
        },
      })
    }

    // Forward the response status and data
    // If Anthropic returned an error, forward it with the same status code
    if (!response.ok) {
      console.error('Anthropic API error:', data)
    }
    
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(503).json({
        error: {
          message: 'Unable to connect to Anthropic API. Please try again later.',
          type: 'service_unavailable',
          details: 'Network error when connecting to api.anthropic.com'
        },
      })
    }
    
    // Handle other fetch-related errors
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      return res.status(504).json({
        error: {
          message: 'Request to Anthropic API timed out',
          type: 'timeout',
          details: 'The request took too long to complete'
        },
      })
    }
    
    return res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'server_error',
        details: `Unexpected error: ${error.name || 'Unknown'}`
      },
    })
  }
}


