import type { Material, ClaudeAPIResponse, ProjectLocation, ProjectBrief } from '../types'
import { imageToBase64, getMediaType } from './api'
import { generateAnalysisPrompt } from './prompt'
import { extractProjectIntent } from './brief'

interface AnalyzeImageParams {
  imageDataUrls: string[]  // Support multiple images
  includeSustainability: boolean
  includeAlternatives: boolean
  location?: ProjectLocation | null
  brief?: ProjectBrief | null
}

/**
 * Analyze images using Claude Vision API
 * Supports multiple images in a single analysis
 */
export async function analyzeImage({
  imageDataUrls,
  includeSustainability,
  includeAlternatives,
  location,
  brief,
}: AnalyzeImageParams): Promise<{ 
  materials: Material[]
  brief?: ProjectBrief
  apiTokens?: { input: number; output: number }
}> {
  // Note: API key validation is handled by the backend proxy
  // In development: Vite proxy (vite.config.ts) reads VITE_ANTHROPIC_API_KEY from .env
  // In production: Backend server (server.js) reads ANTHROPIC_API_KEY from environment

  // Convert all images to base64 format for API
  const imageContent = imageDataUrls.map(imageDataUrl => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: getMediaType(imageDataUrl),
      data: imageToBase64(imageDataUrl),
    },
  }))

  // Extract project intent from brief if provided
  let processedBrief: ProjectBrief | null = null
  if (brief && brief.text.trim()) {
    try {
      const intent = await extractProjectIntent(brief.text)
      processedBrief = {
        text: brief.text,
        intent,
      }
    } catch (error) {
      console.error('Failed to extract project intent:', error)
      // Continue with brief text only
      processedBrief = brief
    }
  }

  // Generate prompt
  const prompt = generateAnalysisPrompt(includeSustainability, includeAlternatives, location, processedBrief)

  // Use relative URL that works with both:
  // - Vite proxy in development (configured in vite.config.ts)
  // - Backend server in production (server.js or hosting platform)
  const apiUrl = '/api/anthropic/messages'
  
  // Prepare API request with multiple images
  // Claude API supports multiple images in a single request
  const requestBody = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          // Add all images first
          ...imageContent,
          // Then add the text prompt
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  }

  // Prepare headers
  // Note: API key is handled by the backend proxy (Vite proxy in dev, server.js in production)
  // Never send API key from client - it's a security risk
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  }

  let response: Response
  try {
    // Add timeout to fetch request (60 seconds for image analysis)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out. The analysis is taking longer than expected. Please try again with a smaller image or check your internet connection.')
      }
      
      // Handle network errors
      if (fetchError instanceof TypeError) {
        const errorMsg = fetchError.message.toLowerCase()
        if (errorMsg.includes('cors') || errorMsg.includes('failed to fetch')) {
          throw new Error(
            'Cannot connect to the API server. ' +
            'In development, make sure you\'re using the Vite dev server (npm run dev). ' +
            'For production, verify the backend proxy is configured. See README.md for details.'
          )
        }
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.')
        }
      }
      throw fetchError
    }
  } catch (fetchError) {
    // Re-throw with better error messages
    if (fetchError instanceof Error) {
      throw fetchError
    }
    throw new Error('An unexpected error occurred while connecting to the API.')
  }

  // Handle HTTP errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`
    
    // Log error for debugging (without sensitive headers)
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      errorMessage: errorData.error?.message || 'Unknown error'
    })
    
    if (response.status === 401) {
      throw new Error(`Invalid API key (401 Unauthorized). Error: ${errorMessage}. Please verify your API key at https://console.anthropic.com/`)
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.')
    }
    if (response.status >= 500) {
      throw new Error('Anthropic API is currently unavailable. Please try again later.')
    }
    
    throw new Error(errorMessage)
  }

  // Parse response
  let data: ClaudeAPIResponse
  try {
    data = await response.json()
  } catch (parseError) {
    throw new Error('Invalid response format from API. Please try again.')
  }
  
  // Validate response structure
  if (!data || !data.content || !Array.isArray(data.content)) {
    throw new Error('Invalid response structure from API. Please try again.')
  }
  
  // Extract text content
  const textContent = data.content.find(item => item.type === 'text')?.text
  
  if (!textContent) {
    throw new Error('No text content in API response. The analysis may have failed. Please try again.')
  }
  
  // Extract API token usage for logging
  const apiTokens = data.usage ? {
    input: data.usage.input_tokens,
    output: data.usage.output_tokens,
  } : undefined

  // Parse JSON from response
  try {
    // Try to extract JSON from the response (might have markdown code blocks)
    let jsonText = textContent.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n')
      jsonText = lines.slice(1, -1).join('\n').trim()
    }
    
    // Remove any leading/trailing whitespace
    jsonText = jsonText.trim()
    
    // Parse JSON
    const materials: Material[] = JSON.parse(jsonText)
    
    // Validate it's an array
    if (!Array.isArray(materials)) {
      throw new Error('API response is not an array')
    }
    
    // Validate each material has required fields
    materials.forEach((material, index) => {
      if (!material.name || !material.description || !material.tier || !material.csiDivision || !material.csiNumber) {
        throw new Error(`Material at index ${index} is missing required fields`)
      }
    })
    
    return { 
      materials, 
      brief: processedBrief || undefined,
      apiTokens, // Include token usage for logging
    }
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      throw new Error(`Failed to parse API response as JSON: ${parseError.message}. Response: ${textContent.substring(0, 200)}...`)
    }
    throw parseError
  }
}

