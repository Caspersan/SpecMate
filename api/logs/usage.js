/**
 * Vercel Serverless Function for Usage Logging
 * 
 * Stores anonymous usage analytics for SpecMate
 * 
 * To use:
 * 1. Deploy to Vercel
 * 2. Logs will be stored in the configured storage location
 * 3. Endpoint: /api/logs/usage
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
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

  try {
    const logData = req.body
    
    // Validate log data structure
    if (!logData || !logData.id || !logData.timestamp) {
      return res.status(400).json({
        error: {
          message: 'Invalid log data structure',
          type: 'validation_error'
        }
      })
    }
    
    // Log to Vercel's logging system
    // These logs can be viewed in the Vercel dashboard under Functions > Logs
    console.log('=== USAGE LOG ===')
    console.log(JSON.stringify(logData, null, 2))
    console.log('=================')
    
    return res.status(200).json({
      success: true,
      logId: logData.id,
      message: 'Log saved successfully'
    })
  } catch (error) {
    console.error('Error processing usage log:', error)
    return res.status(500).json({
      error: {
        message: 'Failed to save log',
        type: 'server_error'
      }
    })
  }
}

