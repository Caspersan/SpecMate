/**
 * Extract project intent from brief text using Claude API
 * Note: API key validation is handled by the backend proxy
 */
export async function extractProjectIntent(briefText: string): Promise<string> {

  const prompt = `Analyze the following project brief and extract key project intent, requirements, and constraints that should influence material selection and feasibility analysis.

Project Brief:
${briefText}

Extract and summarize:
1. Project type and purpose (e.g., residential, commercial, institutional, mixed-use)
2. Key design requirements or constraints (e.g., sustainability goals, budget constraints, timeline, aesthetic preferences)
3. Performance requirements (e.g., durability, energy efficiency, fire resistance, acoustic performance)
4. Material preferences or restrictions (e.g., preferred materials, materials to avoid, local sourcing requirements)
5. Special considerations (e.g., historic preservation, accessibility, maintenance requirements)

Return a concise summary (2-4 sentences) that captures the essential project intent and constraints that should guide material analysis. Focus on actionable directives that would affect material feasibility and selection.

If the brief is unclear or lacks specific requirements, return: "No specific project constraints identified. Standard material analysis applies."`

  // Use relative URL that works with both:
  // - Vite proxy in development (configured in vite.config.ts)
  // - Backend server in production (server.js or hosting platform)
  const apiUrl = '/api/anthropic/messages'

  try {
    // Prepare headers
    // Note: API key is handled by the backend proxy (Vite proxy in dev, server.js in production)
    // Never send API key from client - it's a security risk
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    }

    // Add timeout (30 seconds for brief extraction)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response: Response
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Brief analysis timed out. Continuing with brief text as-is.')
      }
      
      // Handle network errors
      if (fetchError instanceof TypeError) {
        const errorMsg = fetchError.message.toLowerCase()
        if (errorMsg.includes('cors') || errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
          throw new Error('Network error during brief analysis. Continuing with brief text as-is.')
        }
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`
      
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('API authentication failed. Brief intent extraction unavailable.')
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Brief intent extraction unavailable.')
      }
      if (response.status >= 500) {
        throw new Error('API service unavailable. Brief intent extraction unavailable.')
      }
      
      throw new Error(`Brief analysis failed: ${errorMessage}`)
    }

    const data = await response.json()
    const textContent = data.content[0]?.text

    if (!textContent) {
      throw new Error('No content in API response')
    }

    return textContent.trim()
  } catch (error) {
    // If extraction fails, return a fallback message (graceful degradation)
    console.error('Failed to extract project intent:', error)
    return 'Brief provided but intent extraction unavailable. Brief text will be used as context for material analysis.'
  }
}

