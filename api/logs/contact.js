/**
 * Vercel Serverless Function for Contact Form Logging
 * 
 * Stores contact form submissions for SpecMate
 * 
 * To use:
 * 1. Deploy to Vercel
 * 2. Logs will be stored in the configured storage location
 * 3. Endpoint: /api/logs/contact
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
    const { name, subject, message, timestamp, sessionId } = req.body
    
    // Validate required fields
    if (!name || !subject || !message) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: name, subject, message',
          type: 'validation_error'
        }
      })
    }
    
    // Create contact log object
    const contactLog = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: timestamp || new Date().toISOString(),
      sessionId: sessionId || 'unknown',
      name: name.trim(),
      subject: subject.trim(),
      message: message.trim(),
    }
    
    // Log to Vercel's logging system
    // These logs can be viewed in the Vercel dashboard under Functions > Logs
    console.log('=== CONTACT FORM SUBMISSION ===')
    console.log(JSON.stringify(contactLog, null, 2))
    console.log('================================')
    
    return res.status(200).json({
      success: true,
      logId: contactLog.id,
      message: 'Contact form submitted successfully'
    })
  } catch (error) {
    console.error('Error processing contact form:', error)
    return res.status(500).json({
      error: {
        message: 'Failed to submit contact form',
        type: 'server_error'
      }
    })
  }
}

