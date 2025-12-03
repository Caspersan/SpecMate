// Core material type returned from API
export interface Material {
  name: string;              // e.g., "Glass Curtain Wall"
  description: string;       // 2-3 sentence description
  properties: string[];      // ["Transparent", "Structural", etc.]
  tier: 1 | 2 | 3;          // Feasibility classification
  reasoning: string;         // Why this tier
  csiDivision: string;      // e.g., "Openings"
  csiNumber: string;        // e.g., "08"
  sustainabilityNotes?: string;  // Optional: environmental performance
  alternatives?: Alternative[];  // Optional: alternative materials
  codeCompliance?: string;       // Optional: building code compliance notes
}

// Alternative material type
export interface Alternative {
  name: string;             // Alternative material name
  description: string;      // Brief description
  tradeoffs: string;        // What's gained/lost vs original
}

// Project location data
export interface ProjectLocation {
  input: string;              // User's input (address or coordinates)
  coordinates: {
    lat: number;
    lng: number;
  };
  jurisdiction?: string;      // Detected jurisdiction (e.g., "New York, NY, USA")
  buildingCode?: string;      // Primary building code (e.g., "IBC 2021")
}

// Project brief
export interface ProjectBrief {
  text: string;              // Brief text content
  intent?: string;            // Extracted project intent/constraints
}

// Analysis result
export interface Analysis {
  imageUrls: string[];       // Data URLs of uploaded images (supports multiple)
  materials: Material[];     // Array of identified materials
  timestamp: string;         // ISO 8601 timestamp
  includeSustainability: boolean;  // Whether sustainability was enabled
  includeAlternatives: boolean;    // Whether alternatives was enabled
  location?: ProjectLocation;      // Optional: project location for code compliance
  brief?: ProjectBrief;             // Optional: project brief
}

// API response shape
export interface ClaudeAPIResponse {
  content: Array<{
    type: 'text';
    text: string;  // Contains JSON array of materials
  }>;
  id?: string;
  type?: string;
  role?: string;
  model?: string;
  stop_reason?: string;
  stop_sequence?: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// CSI Division reference
export interface CSIDivision {
  number: string;            // e.g., "08"
  name: string;              // e.g., "Openings"
  fullName: string;          // e.g., "08 - Openings"
}

// Re-export logging types
export type { UsageLog, LogSubmissionResponse } from './logging'

