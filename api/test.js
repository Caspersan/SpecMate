export default async function handler(req, res) {
  console.log('[TEST] Function invoked at:', new Date().toISOString())
  console.log('[TEST] Request method:', req.method)
  console.log('[TEST] Environment check - ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)
  
  return res.status(200).json({
    success: true,
    message: 'Test function is working',
    timestamp: new Date().toISOString(),
    apiKeyExists: !!process.env.ANTHROPIC_API_KEY
  })
}

