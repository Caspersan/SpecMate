/**
 * Test if the API key has access to Claude vision features
 */
export async function testVisionAccess(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!apiKey) {
    return {
      success: false,
      message: 'No API key found in environment variables',
    }
  }

  try {
    // Test basic access first
    const response = await fetch('/api/anthropic/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'test',
          },
        ],
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ API key is valid and has access to the model')
      return {
        success: true,
        message: 'API key is valid and has access to claude-sonnet-4-20250514',
        details: data,
      }
    }

    // Check specific error types
    if (data.error?.type === 'permission_error') {
      console.error('❌ No access to this model - permission error')
      return {
        success: false,
        message: `Permission error: ${data.error.message || 'Your account may not have access to this model'}`,
        details: data.error,
      }
    }

    if (data.error?.type === 'authentication_error') {
      console.error('❌ Authentication error')
      return {
        success: false,
        message: `Authentication error: ${data.error.message || 'Invalid API key'}`,
        details: data.error,
      }
    }

    if (data.error?.type === 'not_found_error') {
      console.error('❌ Model not found')
      return {
        success: false,
        message: `Model not found: ${data.error.message || 'claude-sonnet-4-20250514 may not be available'}`,
        details: data.error,
      }
    }

    console.error('❌ API request failed:', data)
    return {
      success: false,
      message: `API Error (${response.status}): ${data.error?.message || response.statusText}`,
      details: data.error || data,
    }
  } catch (err) {
    console.error('❌ Error testing API:', err)
    return {
      success: false,
      message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      details: err,
    }
  }
}

