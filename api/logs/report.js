/**
 * Vercel Serverless Function for Report Generation Logging
 * 
 * Tracks when reports are generated
 */

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: { 
        message: 'Method not allowed. Use POST.',
        type: 'method_not_allowed'
      } 
    })
  }

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
    // In production, you'd update the database record
    // For now, we'll log it (can be enhanced with database)
    console.log('Report Generated:', { logId, format, timestamp })
    
    return res.status(200).json({
      success: true,
      message: 'Report generation logged'
    })
  } catch (error) {
    console.error('Error logging report generation:', error)
    return res.status(500).json({
      error: {
        message: 'Failed to log report generation',
        type: 'server_error'
      }
    })
  }
}

