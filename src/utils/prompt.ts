import type { ProjectLocation, ProjectBrief } from '../types'

/**
 * Generate analysis prompt based on options
 */
export function generateAnalysisPrompt(
  includeSustainability: boolean,
  includeAlternatives: boolean,
  location?: ProjectLocation | null,
  brief?: ProjectBrief | null
): string {
  let prompt = `Analyze these architectural renderings or AI-generated building images.

${brief && brief.intent ? `PROJECT BRIEF CONSTRAINTS:
${brief.intent}

IMPORTANT: When analyzing materials, prioritize and constrain your analysis based on the project brief requirements above. Materials should align with the project's stated goals, constraints, and preferences. If certain materials conflict with the brief requirements, note this in the reasoning and adjust tier classifications accordingly.

` : ''}Identify all major building materials and systems visible, including:
- Facade/cladding systems
- Structural elements (if visible)
- Roofing materials
- Glazing systems
- Any distinctive architectural features
- Paving or hardscape materials

For each material or system identified, provide:
1. Name: Brief descriptive name (e.g., "Glass Curtain Wall", "Corrugated Metal Roof")
2. Description: What you see and its apparent function (2-3 sentences)
3. Properties: List of visual/performance characteristics (array of strings)
4. Tier: Classify as:
   - Tier 1: Standard, readily available products exist from multiple manufacturers
   - Tier 2: Material category exists but would require customization, special fabrication, or unusual application
   - Tier 3: Would require custom development, R&D, or doesn't currently exist as a buildable product
5. Reasoning: Brief explanation for tier classification (1-2 sentences)
6. CSI Division: Classify by CSI MasterFormat Division (e.g., "Thermal and Moisture Protection")
7. CSI Number: 2-digit division number (e.g., "07")`

  if (includeSustainability) {
    prompt += `
8. Sustainability Notes: Environmental performance considerations including embodied carbon, recyclability, durability, toxicity, and lifecycle impact (2-3 sentences)`
  }

  if (includeAlternatives) {
    prompt += `
9. Alternatives: Array of 2-3 alternative materials that could achieve similar aesthetic/functional goals. For each alternative include:
   - Name: Alternative material name
   - Description: Brief description of the alternative
   - Tradeoffs: What's gained or lost compared to the original material`
  }

  if (location) {
    const nextNumber = [includeSustainability, includeAlternatives].filter(Boolean).length + 8
    prompt += `
${nextNumber}. Code Compliance: Building code compliance considerations for this material in ${location.jurisdiction} under ${location.buildingCode}. Include:
   - Applicable building code requirements and restrictions
   - Material approval requirements (ICC-ES reports, FM approvals, testing standards)
   - Installation requirements and code-mandated specifications
   - Fire rating and life safety requirements where applicable
   - Energy code implications (ASHRAE, local energy standards)
   - Climate-specific or regional requirements
   (2-3 sentences)`
  }

  prompt += `

Use these CSI MasterFormat Divisions:
- 03: Concrete
- 04: Masonry
- 05: Metals
- 06: Wood, Plastics, and Composites
- 07: Thermal and Moisture Protection
- 08: Openings (Doors, Windows, Glazing)
- 09: Finishes (Ceilings, Flooring, Wall Finishes)
- 10: Specialties
- 12: Furnishings
- 13: Special Construction
- 14: Conveying Equipment
- 21: Fire Suppression
- 22: Plumbing
- 23: HVAC
- 26: Electrical
- 31: Earthwork
- 32: Exterior Improvements
- 33: Utilities

Aim to identify 5-15 materials (comprehensive but focused on major systems).

Return ONLY a valid JSON array with no additional text or markdown formatting:
[
  {
    "name": "Material Name",
    "description": "Description text",
    "properties": ["Property 1", "Property 2"],
    "tier": 1,
    "reasoning": "Reasoning text",
    "csiDivision": "Division Name",
    "csiNumber": "00"`

  if (includeSustainability) {
    prompt += `,
    "sustainabilityNotes": "Environmental notes"`
  }

  if (includeAlternatives) {
    prompt += `,
    "alternatives": [
      {
        "name": "Alternative Name",
        "description": "Alternative description",
        "tradeoffs": "Tradeoffs explanation"
      }
    ]`
  }

  if (location) {
    prompt += `,
    "codeCompliance": "Building code compliance notes for ${location.jurisdiction}"`
  }

  prompt += `
  }
]`

  return prompt
}

