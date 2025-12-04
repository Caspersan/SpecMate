/**
 * Usage logging utility
 * Sends anonymous usage data to backend for analytics
 */

import type { Analysis, UsageLog } from '../types'

/**
 * Generate a session ID (stored in sessionStorage)
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-side'
  
  let sessionId = sessionStorage.getItem('specmate_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('specmate_session_id', sessionId)
  }
  return sessionId
}

/**
 * Generate a unique log ID
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Create usage log from analysis data
 */
export function createUsageLog(
  analysis: Analysis, 
  analysisDuration?: number,
  apiTokens?: { input: number; output: number }
): UsageLog {
  const tier1 = analysis.materials.filter(m => m.tier === 1).length
  const tier2 = analysis.materials.filter(m => m.tier === 2).length
  const tier3 = analysis.materials.filter(m => m.tier === 3).length
  
  const csiDivisions = [...new Set(analysis.materials.map(m => `${m.csiNumber} - ${m.csiDivision}`))]
  
  return {
    id: generateLogId(),
    timestamp: analysis.timestamp,
    sessionId: getSessionId(),
    imageCount: analysis.imageUrls.length,
    analysisOptions: {
      includeSustainability: analysis.includeSustainability,
      includeAlternatives: analysis.includeAlternatives,
    },
    location: analysis.location ? {
      hasLocation: true,
      jurisdiction: analysis.location.jurisdiction,
      buildingCode: analysis.location.buildingCode,
    } : undefined,
    brief: analysis.brief ? {
      hasBrief: true,
      briefLength: analysis.brief.text.length,
      hasIntent: !!analysis.brief.intent,
    } : undefined,
    materialCount: analysis.materials.length,
    tierDistribution: {
      tier1,
      tier2,
      tier3,
    },
    csiDivisions,
    reportGenerated: false, // Will be updated when report is generated
    analysisDuration,
    apiTokensUsed: apiTokens,
  }
}

/**
 * Submit usage log to backend
 * Fails silently to not interrupt user experience
 */
export async function submitUsageLog(log: UsageLog): Promise<void> {
  try {
    const response = await fetch('/api/logs/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    })
    
    if (!response.ok) {
      // Silently fail - don't interrupt user experience
      console.warn('Failed to submit usage log:', response.status)
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.warn('Error submitting usage log:', error)
  }
}

/**
 * Log report generation
 */
export async function logReportGeneration(
  logId: string,
  format: 'markdown' | 'pdf' | 'both'
): Promise<void> {
  try {
    await fetch('/api/logs/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logId,
        format,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Silently fail
    console.warn('Error logging report generation:', error)
  }
}

/**
 * Submit contact form message to backend
 */
export async function submitContactLog(data: {
  name: string
  subject: string
  message: string
}): Promise<void> {
  const response = await fetch('/api/logs/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'Failed to submit contact form')
  }
}

