/**
 * Usage logging types for SpecMate analytics
 */

export interface UsageLog {
  id: string                    // Unique log ID (UUID)
  timestamp: string            // ISO 8601 timestamp
  sessionId: string            // Session identifier (anonymous)
  
  // Usage metrics
  imageCount: number           // Number of images analyzed
  analysisOptions: {
    includeSustainability: boolean
    includeAlternatives: boolean
  }
  
  // Project information
  location?: {
    hasLocation: boolean
    jurisdiction?: string     // Only jurisdiction, not full address
    buildingCode?: string
  }
  brief?: {
    hasBrief: boolean
    briefLength?: number       // Character count only
    hasIntent: boolean         // Whether intent was extracted
  }
  
  // Analysis results
  materialCount: number        // Total materials identified
  tierDistribution: {
    tier1: number
    tier2: number
    tier3: number
  }
  csiDivisions: string[]       // List of CSI divisions found
  
  // Report generation
  reportGenerated: boolean     // Whether report was generated
  reportFormat?: 'markdown' | 'pdf' | 'both'
  
  // Performance metrics
  analysisDuration?: number   // Analysis time in milliseconds
  apiTokensUsed?: {
    input: number
    output: number
  }
  
  // Error tracking (if any)
  errors?: string[]            // Error types encountered (no sensitive data)
}

export interface LogSubmissionResponse {
  success: boolean
  logId?: string
  message?: string
}

