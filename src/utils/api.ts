// Types are imported where needed

/**
 * Get API key from environment variable
 */
export function getApiKey(): string | null {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  return apiKey || null
}

/**
 * Validate API key format
 * Anthropic API keys start with 'sk-ant-'
 */
export function validateApiKey(apiKey: string | null): { valid: boolean; error?: string } {
  if (!apiKey) {
    return {
      valid: false,
      error: 'API key not configured. Please create a .env file with VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here'
    }
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return {
      valid: false,
      error: 'Invalid API key format. Key should start with "sk-ant-". Please check your .env file.'
    }
  }

  return { valid: true }
}

/**
 * Convert image data URL to base64 string
 */
export function imageToBase64(dataUrl: string): string {
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64 = dataUrl.split(',')[1]
  return base64
}

/**
 * Get media type from data URL
 */
export function getMediaType(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'image/jpeg'
  }
  if (dataUrl.startsWith('data:image/png')) {
    return 'image/png'
  }
  return 'image/jpeg' // default
}

