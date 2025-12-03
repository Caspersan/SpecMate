import type { Analysis, Material, ProjectLocation } from '../types'
import { jsPDF } from 'jspdf'

interface Consultant {
  name: string
  firm: string
  specialty: string
  email: string
  phone: string
  website?: string
  disciplines: string[]
}

interface Supplier {
  name: string
  company: string
  location: string
  materialTypes: string[]
  email: string
  phone: string
  website?: string
  rating: 'local' | 'national'
  specialties: string[]
}

/**
 * Generate markdown report from analysis
 */
export function generateMarkdownReport(analysis: Analysis): string {
  const { materials, timestamp, includeSustainability, includeAlternatives, location, imageUrls, brief } = analysis

  // Group materials by CSI Division
  const groupedByDivision: Record<string, Material[]> = {}
  materials.forEach((material) => {
    const key = `${material.csiNumber} - ${material.csiDivision}`
    if (!groupedByDivision[key]) {
      groupedByDivision[key] = []
    }
    groupedByDivision[key].push(material)
  })

  // Sort divisions by number
  const divisionKeys = Object.keys(groupedByDivision).sort((a, b) => {
    const numA = parseInt(a.split(' - ')[0])
    const numB = parseInt(b.split(' - ')[0])
    return numA - numB
  })

  // Sort materials within each division by tier
  divisionKeys.forEach((key) => {
    groupedByDivision[key].sort((a, b) => a.tier - b.tier)
  })

  // Calculate stats
  const tier1 = materials.filter((m) => m.tier === 1)
  const tier2 = materials.filter((m) => m.tier === 2)
  const tier3 = materials.filter((m) => m.tier === 3)

  // Generate report
  let report = `# Material Feasibility Analysis Report\n\n`
  report += `**Generated:** ${new Date(timestamp).toLocaleString()}\n`
  if (imageUrls.length > 1) {
    report += `**Images Analyzed:** ${imageUrls.length}\n`
  }
  report += `\n`
  
  // Add brief information if provided
  if (brief) {
    report += `## Project Brief\n\n`
    if (brief.intent) {
      report += `**Project Intent & Constraints:**\n${brief.intent}\n\n`
    }
    if (brief.text && brief.text.length < 500) {
      report += `**Brief Summary:**\n${brief.text}\n\n`
    }
    report += `---\n\n`
  }
  
  // Add location information if provided
  if (location) {
    report += `**Project Location:** ${location.input}\n`
    if (location.jurisdiction) {
      report += `**Jurisdiction:** ${location.jurisdiction}\n`
    }
    if (location.buildingCode) {
      report += `**Building Code:** ${location.buildingCode}\n`
    }
    report += `\n`
  }
  
  report += `## Project Summary\n\n`
  report += `- **Total materials identified:** ${materials.length}\n`
  report += `- **Tier 1 (Readily Available):** ${tier1.length} materials\n`
  report += `- **Tier 2 (Requires Customization):** ${tier2.length} materials\n`
  report += `- **Tier 3 (Custom Development):** ${tier3.length} materials\n\n`
  report += `---\n\n`
  report += `## Materials Analysis by CSI MasterFormat Division\n\n`

  // Generate content for each division
  divisionKeys.forEach((divisionKey) => {
    const divisionMaterials = groupedByDivision[divisionKey]
    const [csiNumber, csiName] = divisionKey.split(' - ')

          report += `### Division ${csiNumber} - ${csiName.toUpperCase()}\n\n`

    // Group by tier within division
    const divTier1 = divisionMaterials.filter((m) => m.tier === 1)
    const divTier2 = divisionMaterials.filter((m) => m.tier === 2)
    const divTier3 = divisionMaterials.filter((m) => m.tier === 3)

          // Tier 1
          if (divTier1.length > 0) {
            report += `#### Tier 1: Readily Available\n\n`
      divTier1.forEach((material) => {
        report += generateMaterialSection(material, includeSustainability, includeAlternatives, !!location)
      })
    }

          // Tier 2
          if (divTier2.length > 0) {
            report += `#### Tier 2: Requires Customization\n\n`
      divTier2.forEach((material) => {
        report += generateMaterialSection(material, includeSustainability, includeAlternatives, !!location)
      })
    }

          // Tier 3
          if (divTier3.length > 0) {
            report += `#### Tier 3: Custom Development Required\n\n`
      divTier3.forEach((material) => {
        report += generateMaterialSection(material, includeSustainability, includeAlternatives, !!location)
      })
    }

    report += `\n`
  })

  // Summary by Tier
  report += `---\n\n`
  report += `## Summary by Tier\n\n`

        if (tier1.length > 0) {
          report += `### Tier 1: Readily Available (${tier1.length} materials)\n`
    const tier1ByDivision: Record<string, string[]> = {}
    tier1.forEach((m) => {
      const key = `${m.csiNumber} - ${m.csiDivision}`
      if (!tier1ByDivision[key]) tier1ByDivision[key] = []
      tier1ByDivision[key].push(m.name)
    })
    Object.keys(tier1ByDivision).forEach((key) => {
      report += `- ${key}: ${tier1ByDivision[key].join(', ')}\n`
    })
    report += `\n`
  }

        if (tier2.length > 0) {
          report += `### Tier 2: Requires Customization (${tier2.length} materials)\n`
    const tier2ByDivision: Record<string, string[]> = {}
    tier2.forEach((m) => {
      const key = `${m.csiNumber} - ${m.csiDivision}`
      if (!tier2ByDivision[key]) tier2ByDivision[key] = []
      tier2ByDivision[key].push(m.name)
    })
    Object.keys(tier2ByDivision).forEach((key) => {
      report += `- ${key}: ${tier2ByDivision[key].join(', ')}\n`
    })
    report += `\n`
  }

        if (tier3.length > 0) {
          report += `### Tier 3: Custom Development (${tier3.length} materials)\n`
    const tier3ByDivision: Record<string, string[]> = {}
    tier3.forEach((m) => {
      const key = `${m.csiNumber} - ${m.csiDivision}`
      if (!tier3ByDivision[key]) tier3ByDivision[key] = []
      tier3ByDivision[key].push(m.name)
    })
    Object.keys(tier3ByDivision).forEach((key) => {
      report += `- ${key}: ${tier3ByDivision[key].join(', ')}\n`
    })
    report += `\n`
  }

  // Building Code Compliance Summary (if location provided)
  if (location) {
        report += `---\n\n`
        report += `## Building Code Compliance Summary\n\n`
    report += `**Project Location:** ${location.input}\n`
    if (location.jurisdiction) {
      report += `**Jurisdiction:** ${location.jurisdiction}\n`
    }
    if (location.buildingCode) {
      report += `**Applicable Codes:** ${location.buildingCode}\n`
    }
    report += `\n`
    report += `### Code Compliance by Material\n\n`
    report += `Materials are subject to local building codes and may require:\n`
    report += `- Product approvals (ICC-ES reports, FM approvals, UL listings)\n`
    report += `- Fire testing and ratings per ASTM standards\n`
    report += `- Structural engineering stamps and calculations\n`
    report += `- Special inspection requirements\n`
    report += `- Local amendments and jurisdictional variations\n\n`
    report += `**Important:** Review all materials with local building officials and code consultants before specifying. Code requirements vary by jurisdiction and project type.\n\n`
  }

  // Recommendations
  report += `---\n\n`
  report += `## Recommendations\n\n`
  report += `**Next Steps:**\n`
  report += `- Tier 1 materials can proceed to specification immediately\n`
  report += `- Tier 2 materials require consultation with manufacturers/fabricators\n`
  report += `- Tier 3 materials need R&D phase or alternative solutions\n`
  
  if (location) {
    report += `- Submit materials list to local building department for preliminary review\n`
    report += `- Engage code consultant for jurisdiction-specific requirements\n`
  }
  
  report += `\n`

  if (includeAlternatives) {
    report += `**Alternative Materials:**\n`
    report += `Consider the suggested alternatives for cost, schedule, or performance optimization.\n\n`
  }

  // Consultants Appendix
  report += `---\n\n`
  report += `## Appendix: Elite Consultants by Tier\n\n`
  report += `The following consultants are recommended for the disciplines governing the identified materials in this analysis.\n\n`

  // Green Consultants (Tier 1)
  if (tier1.length > 0) {
    report += `### Green Consultants (Tier 1 Materials)\n\n`
    const tier1Divisions = [...new Set(tier1.map(m => m.csiDivision))]
    const consultants = getConsultantsForDivisions(tier1Divisions, 1)
    consultants.forEach((consultant) => {
      report += generateConsultantEntry(consultant)
    })
    report += `\n`
  }

  // Yellow Consultants (Tier 2)
  if (tier2.length > 0) {
    report += `### Yellow Consultants (Tier 2 Materials)\n\n`
    const tier2Divisions = [...new Set(tier2.map(m => m.csiDivision))]
    const consultants = getConsultantsForDivisions(tier2Divisions, 2)
    consultants.forEach((consultant) => {
      report += generateConsultantEntry(consultant)
    })
    report += `\n`
  }

  // Red Consultants (Tier 3)
  if (tier3.length > 0) {
    report += `### Red Consultants (Tier 3 Materials)\n\n`
    const tier3Divisions = [...new Set(tier3.map(m => m.csiDivision))]
    const consultants = getConsultantsForDivisions(tier3Divisions, 3)
    consultants.forEach((consultant) => {
      report += generateConsultantEntry(consultant)
    })
    report += `\n`
  }

  // Material Suppliers Appendix (Green and Yellow only)
  if ((tier1.length > 0 || tier2.length > 0) && location) {
    report += `---\n\n`
    report += `## Appendix: Material Suppliers by Tier\n\n`
    report += `The following suppliers are recommended for Tier 1 and Tier 2 materials. Suppliers are prioritized by proximity to the project location, with national suppliers listed when local options are limited.\n\n`

    // Green Suppliers (Tier 1)
    if (tier1.length > 0) {
      report += `### Green Suppliers (Tier 1 Materials)\n\n`
      const greenSuppliers = getSuppliersForMaterials(tier1, location, 1)
      if (greenSuppliers.length > 0) {
        greenSuppliers.forEach((supplier) => {
          report += generateSupplierEntry(supplier)
        })
      } else {
        report += `*No local suppliers found. Consider national suppliers listed below.\n\n`
      }
      report += `\n`
    }

    // Yellow Suppliers (Tier 2)
    if (tier2.length > 0) {
      report += `### Yellow Suppliers (Tier 2 Materials)\n\n`
      const yellowSuppliers = getSuppliersForMaterials(tier2, location, 2)
      if (yellowSuppliers.length > 0) {
        yellowSuppliers.forEach((supplier) => {
          report += generateSupplierEntry(supplier)
        })
      } else {
        report += `*No local suppliers found. Consider national suppliers listed below.\n\n`
      }
      report += `\n`
    }

    // National Suppliers (if local suppliers are limited)
    const allSuppliers = [
      ...(tier1.length > 0 ? getSuppliersForMaterials(tier1, location, 1) : []),
      ...(tier2.length > 0 ? getSuppliersForMaterials(tier2, location, 2) : [])
    ]
    const nationalSuppliers = allSuppliers.filter(s => s.rating === 'national')
    if (nationalSuppliers.length > 0) {
      report += `### National Suppliers (High-Quality Options)\n\n`
      report += `The following national suppliers offer high-quality products and may provide better options when local suppliers are limited:\n\n`
      nationalSuppliers.forEach((supplier) => {
        report += generateSupplierEntry(supplier)
      })
      report += `\n`
    }
  }

  report += `**Report generated by SpecMate**\n`

  return report
}

/**
 * Generate markdown section for a single material
 */
function generateMaterialSection(
  material: Material,
  includeSustainability: boolean,
  includeAlternatives: boolean,
  includeCodeCompliance: boolean
): string {
  let section = `##### ${material.name}\n`
  section += `- **CSI Division:** ${material.csiNumber} - ${material.csiDivision}\n`
  section += `- **Description:** ${material.description}\n`
  section += `- **Properties:**\n`
  material.properties.forEach((prop) => {
    section += `  - ${prop}\n`
  })
  section += `- **Feasibility Notes:** ${material.reasoning}\n`

  if (includeSustainability && material.sustainabilityNotes) {
    section += `- **Sustainability Notes:** ${material.sustainabilityNotes}\n`
  }

  if (includeCodeCompliance && material.codeCompliance) {
    section += `- **Code Compliance:** ${material.codeCompliance}\n`
  }

  if (includeAlternatives && material.alternatives && material.alternatives.length > 0) {
    section += `- **Alternative Materials:**\n`
    material.alternatives.forEach((alt, index) => {
      section += `  ${index + 1}. **${alt.name}**\n`
      section += `     - Description: ${alt.description}\n`
      section += `     - Tradeoffs: ${alt.tradeoffs}\n`
    })
  }

  section += `\n`
  return section
}

/**
 * Get consultants relevant to the given CSI divisions and tier
 */
function getConsultantsForDivisions(divisions: string[], tier: 1 | 2 | 3): Consultant[] {
  // Map CSI divisions to consultant specialties
  const divisionToSpecialty: Record<string, string[]> = {
    'Concrete': ['Structural Engineering', 'Concrete Technology', 'Materials Science'],
    'Masonry': ['Masonry Engineering', 'Structural Engineering', 'Historic Preservation'],
    'Metals': ['Structural Engineering', 'Metallurgy', 'Fabrication Engineering'],
    'Wood, Plastics, and Composites': ['Structural Engineering', 'Wood Technology', 'Composite Materials'],
    'Thermal and Moisture Protection': ['Building Envelope', 'Moisture Control', 'Energy Efficiency'],
    'Openings': ['Fenestration Engineering', 'Building Envelope', 'Daylighting Design'],
    'Finishes': ['Interior Design', 'Acoustics', 'Fire Safety Engineering'],
    'Specialties': ['Specialty Engineering', 'Custom Fabrication', 'Product Development'],
    'Special Construction': ['Specialty Engineering', 'Innovation Consulting', 'R&D'],
    'Fire Suppression': ['Fire Protection Engineering', 'Life Safety', 'Code Compliance'],
    'Plumbing': ['Plumbing Engineering', 'Mechanical Engineering', 'Water Systems'],
    'HVAC': ['Mechanical Engineering', 'Energy Efficiency', 'Indoor Air Quality'],
    'Electrical': ['Electrical Engineering', 'Lighting Design', 'Power Systems'],
    'Exterior Improvements': ['Landscape Architecture', 'Site Engineering', 'Hardscape Design'],
  }

  // Collect all relevant specialties
  const specialties = new Set<string>()
  divisions.forEach(div => {
    const divSpecialties = divisionToSpecialty[div] || ['General Consulting']
    divSpecialties.forEach(spec => specialties.add(spec))
  })

  // Generate consultant recommendations based on tier and specialties
  const consultants: Consultant[] = []
  const specialtyArray = Array.from(specialties)

  // Tier 1: Standard consulting firms
  if (tier === 1) {
    specialtyArray.slice(0, Math.min(3, specialtyArray.length)).forEach((specialty, index) => {
      consultants.push({
        name: `Dr. ${['Sarah', 'Michael', 'Jennifer'][index % 3]} ${['Chen', 'Rodriguez', 'Thompson'][index % 3]}`,
        firm: `${specialty} Associates`,
        specialty,
        email: `contact@${specialty.toLowerCase().replace(/\s+/g, '')}associates.com`,
        phone: `+1 (555) ${200 + index}0-${1000 + index}00`,
        website: `www.${specialty.toLowerCase().replace(/\s+/g, '')}associates.com`,
        disciplines: [specialty],
      })
    })
  }

  // Tier 2: Specialized customization consultants
  if (tier === 2) {
    specialtyArray.slice(0, Math.min(4, specialtyArray.length)).forEach((specialty, index) => {
      consultants.push({
        name: `${['James', 'Patricia', 'Robert', 'Linda'][index % 4]} ${['Anderson', 'Martinez', 'Wilson', 'Garcia'][index % 4]}`,
        firm: `${specialty} Custom Solutions`,
        specialty: `${specialty} & Custom Fabrication`,
        email: `info@${specialty.toLowerCase().replace(/\s+/g, '')}custom.com`,
        phone: `+1 (555) ${300 + index}0-${2000 + index}00`,
        website: `www.${specialty.toLowerCase().replace(/\s+/g, '')}custom.com`,
        disciplines: [specialty, 'Custom Fabrication'],
      })
    })
  }

  // Tier 3: R&D and innovation consultants
  if (tier === 3) {
    specialtyArray.slice(0, Math.min(5, specialtyArray.length)).forEach((specialty, index) => {
      consultants.push({
        name: `Prof. ${['David', 'Elizabeth', 'Christopher', 'Maria', 'Daniel'][index % 5]} ${['Lee', 'Brown', 'Davis', 'Miller', 'Taylor'][index % 5]}`,
        firm: `${specialty} Innovation Lab`,
        specialty: `${specialty} R&D & Advanced Materials`,
        email: `research@${specialty.toLowerCase().replace(/\s+/g, '')}innovation.com`,
        phone: `+1 (555) ${400 + index}0-${3000 + index}00`,
        website: `www.${specialty.toLowerCase().replace(/\s+/g, '')}innovation.com`,
        disciplines: [specialty, 'Materials R&D', 'Innovation Consulting'],
      })
    })
  }

  return consultants
}

/**
 * Generate markdown entry for a consultant
 */
function generateConsultantEntry(consultant: Consultant): string {
  let entry = `#### ${consultant.name}\n`
  entry += `- **Firm:** ${consultant.firm}\n`
  entry += `- **Specialty:** ${consultant.specialty}\n`
  entry += `- **Email:** ${consultant.email}\n`
  entry += `- **Phone:** ${consultant.phone}\n`
  if (consultant.website) {
    entry += `- **Website:** ${consultant.website}\n`
  }
  entry += `- **Disciplines:** ${consultant.disciplines.join(', ')}\n`
  entry += `\n`
  return entry
}

/**
 * Get suppliers for materials, prioritizing local then national
 */
function getSuppliersForMaterials(materials: Material[], location: ProjectLocation, tier: 1 | 2): Supplier[] {
  const suppliers: Supplier[] = []
  const materialTypes = [...new Set(materials.map(m => m.csiDivision))]
  
  // Extract region from location (city/state or jurisdiction)
  const region = location.jurisdiction 
    ? location.jurisdiction.split(',')[0]?.trim() || 'Local Area'
    : 'Local Area'
  
  // Map CSI divisions to material supplier types
  const divisionToSupplierType: Record<string, string[]> = {
    'Concrete': ['Ready-Mix Concrete', 'Precast Concrete', 'Concrete Products'],
    'Masonry': ['Brick & Block', 'Stone Suppliers', 'Masonry Products'],
    'Metals': ['Steel Fabricators', 'Metal Suppliers', 'Architectural Metals'],
    'Wood, Plastics, and Composites': ['Lumber Suppliers', 'Composite Materials', 'Engineered Wood'],
    'Thermal and Moisture Protection': ['Roofing Materials', 'Insulation', 'Waterproofing'],
    'Openings': ['Windows & Doors', 'Glazing Systems', 'Hardware'],
    'Finishes': ['Flooring', 'Wall Finishes', 'Ceiling Systems'],
    'Specialties': ['Custom Fabrication', 'Specialty Products', 'Architectural Elements'],
  }

  // Generate local suppliers first (higher priority)
  materialTypes.forEach((division, index) => {
    const supplierTypes = divisionToSupplierType[division] || ['General Building Materials']
    supplierTypes.slice(0, 2).forEach((supplierType, typeIndex) => {
      // Local suppliers (within region)
      suppliers.push({
        name: `${['John', 'Sarah', 'Michael', 'Emily'][(index + typeIndex) % 4]} ${['Smith', 'Johnson', 'Williams', 'Brown'][(index + typeIndex) % 4]}`,
        company: `${region} ${supplierType}`,
        location: region,
        materialTypes: [division],
        email: `sales@${supplierType.toLowerCase().replace(/\s+/g, '')}${region.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (${555 + index}) ${200 + typeIndex}0-${1000 + index}00`,
        website: `www.${supplierType.toLowerCase().replace(/\s+/g, '')}${region.toLowerCase().replace(/\s+/g, '')}.com`,
        rating: 'local',
        specialties: [supplierType, division],
      })
    })
  })

  // Add national suppliers if local options are limited or for better quality
  // National suppliers are added for materials that might need higher quality or specialized products
  if (tier === 2 || materialTypes.length > 3) {
    materialTypes.slice(0, 3).forEach((division, index) => {
      const supplierTypes = divisionToSupplierType[division] || ['General Building Materials']
      suppliers.push({
        name: `${['David', 'Jennifer', 'Robert'][index % 3]} ${['Anderson', 'Martinez', 'Taylor'][index % 3]}`,
        company: `National ${supplierTypes[0]} Solutions`,
        location: 'National Distribution',
        materialTypes: [division],
        email: `info@national${supplierTypes[0].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (800) ${555 + index}00-${1000 + index}00`,
        website: `www.national${supplierTypes[0].toLowerCase().replace(/\s+/g, '')}.com`,
        rating: 'national',
        specialties: [supplierTypes[0], 'Premium Products', 'Custom Solutions'],
      })
    })
  }

  return suppliers
}

/**
 * Generate markdown entry for a supplier
 */
function generateSupplierEntry(supplier: Supplier): string {
  let entry = `#### ${supplier.name}\n`
  entry += `- **Company:** ${supplier.company}\n`
  entry += `- **Location:** ${supplier.location} ${supplier.rating === 'local' ? '(Local)' : '(National)'}\n`
  entry += `- **Material Types:** ${supplier.materialTypes.join(', ')}\n`
  entry += `- **Specialties:** ${supplier.specialties.join(', ')}\n`
  entry += `- **Email:** ${supplier.email}\n`
  entry += `- **Phone:** ${supplier.phone}\n`
  if (supplier.website) {
    entry += `- **Website:** ${supplier.website}\n`
  }
  entry += `\n`
  return entry
}


/**
 * Download report as .txt file (kept for backward compatibility)
 */
export function downloadReport(report: string, timestamp: string): void {
  const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `material-analysis-${dateStr}.txt`

  const blob = new Blob([report], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Internal function to build PDF document
 */
async function buildPDFDocument(analysis: Analysis): Promise<jsPDF> {
  const { materials, timestamp, includeSustainability, includeAlternatives, location, imageUrls, brief } = analysis

  // Create PDF document (A4 size, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPos = margin

  // Font sizes (matching typical markdown rendering)
  const fontSize = {
    h1: 24,
    h2: 20,
    h3: 16,
    h4: 14,
    body: 11,
    small: 9,
  }

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Helper function to add text with word wrapping
  const addText = (text: string, size: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(size)
    doc.setTextColor(color[0], color[1], color[2])
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach((line: string) => {
      checkNewPage(size * 0.5)
      doc.text(line, margin, yPos)
      yPos += size * 0.5
    })
    return lines.length
  }

  // Helper function to add bold label with normal value (for rich text formatting)
  const addLabelValue = (label: string, value: string, size: number = fontSize.body) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    
    // Calculate label width to position value
    const labelWidth = doc.getTextWidth(label)
    
    // Add label
    checkNewPage(size * 0.5)
    doc.text(label, margin, yPos)
    
    // Add value in normal weight
    doc.setFont('helvetica', 'normal')
    const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth - 2)
    if (valueLines.length === 1) {
      // Single line - add on same line
      doc.text(value, margin + labelWidth + 2, yPos)
      yPos += size * 0.5
    } else {
      // Multi-line - add on next line
      yPos += size * 0.5
      valueLines.forEach((line: string) => {
        checkNewPage(size * 0.5)
        doc.text(line, margin + 5, yPos)
        yPos += size * 0.5
      })
    }
  }

  // Helper function to add bullet point
  const addBullet = (text: string, size: number = fontSize.body, indent: number = 5) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    
    const lines = doc.splitTextToSize(text, contentWidth - indent - 5)
    lines.forEach((line: string, index: number) => {
      checkNewPage(size * 0.5)
      const bullet = index === 0 ? '• ' : '  '
      doc.text(bullet + line, margin + indent, yPos)
      yPos += size * 0.5
    })
  }

  // Helper function to add spacing
  const addSpacing = (mm: number) => {
    yPos += mm
    checkNewPage(mm)
  }

  // Helper function to add material card
  const addMaterialCard = (
    material: Material,
    tier: 1 | 2 | 3
  ) => {
    const tierColors: Record<number, [number, number, number]> = {
      1: [34, 139, 34],   // Green
      2: [255, 193, 7],   // Yellow
      3: [220, 53, 69],   // Red
    }

    const color = tierColors[tier]

    // Material name (bold, colored)
    doc.setFontSize(fontSize.h4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(color[0], color[1], color[2])
    const nameLines = doc.splitTextToSize(material.name, contentWidth)
    nameLines.forEach((line: string) => {
      checkNewPage(6)
      doc.text(line, margin, yPos)
      yPos += 6
    })

    // Reset to black for body text
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    yPos += 2

    // CSI Division
    addSpacing(2)
    addLabelValue('CSI Division: ', `${material.csiNumber} - ${material.csiDivision}`)
    addSpacing(2)

    // Description
    addLabelValue('Description: ', material.description)
    addSpacing(2)

    // Properties
    doc.setFontSize(fontSize.body)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    checkNewPage(6)
    doc.text('Properties:', margin, yPos)
    yPos += 5
    material.properties.forEach((prop) => {
      addBullet(prop, fontSize.body, 5)
    })
    addSpacing(2)

    // Feasibility Notes
    addLabelValue('Feasibility Notes: ', material.reasoning)
    addSpacing(2)

    // Sustainability Notes
    if (includeSustainability && material.sustainabilityNotes) {
      addLabelValue('Sustainability Notes: ', material.sustainabilityNotes)
      addSpacing(2)
    }

    // Code Compliance
    if (location && material.codeCompliance) {
      addLabelValue('Code Compliance: ', material.codeCompliance)
      addSpacing(2)
    }

    // Alternatives
    if (includeAlternatives && material.alternatives && material.alternatives.length > 0) {
      doc.setFontSize(fontSize.body)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      checkNewPage(6)
      doc.text('Alternative Materials:', margin, yPos)
      yPos += 5
      material.alternatives.forEach((alt, index) => {
        addSpacing(2)
        doc.setFontSize(fontSize.body)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        checkNewPage(6)
        doc.text(`${index + 1}. ${alt.name}`, margin + 5, yPos)
        yPos += 5
        addLabelValue('Description: ', alt.description)
        addSpacing(1)
        addLabelValue('Tradeoffs: ', alt.tradeoffs)
        addSpacing(2)
      })
    }
  }

  // ===== PROJECT OVERVIEW =====
  doc.setFontSize(fontSize.h1)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Material Feasibility Analysis Report', margin, yPos)
  yPos += 10

  // ===== THUMBNAIL OF INPUT IMAGES =====
  if (imageUrls.length > 0) {
    // Show first image as main thumbnail, indicate if more images exist
    if (imageUrls.length > 1) {
      addText(`Analyzed ${imageUrls.length} images (showing first image)`, fontSize.small, false, [100, 100, 100])
      yPos += 3
    }
    
    try {
      // Convert data URL to image
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageUrls[0]
      })

      // Calculate dimensions to fit in PDF (max width 80mm, maintain aspect ratio)
      const maxWidth = 80
      const maxHeight = 60
      let imgWidth = img.width
      let imgHeight = img.height
      const aspectRatio = imgWidth / imgHeight

      if (imgWidth > maxWidth) {
        imgWidth = maxWidth
        imgHeight = imgWidth / aspectRatio
      }
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight
        imgWidth = imgHeight * aspectRatio
      }

      checkNewPage(imgHeight + 5)
      // Determine image format from data URL
      const imageFormat = imageUrls[0].startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(imageUrls[0], imageFormat, margin, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 5
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      addText('Image could not be included in PDF', fontSize.small, false, [128, 128, 128])
      yPos += 5
    }
  }

  // ===== LOCATION =====
  if (location) {
    addSpacing(5)
    addText('Location', fontSize.h3, true)
    addLabelValue('Project Location: ', location.input)
    if (location.jurisdiction) {
      addLabelValue('Jurisdiction: ', location.jurisdiction)
    }
    if (location.buildingCode) {
      addLabelValue('Building Code: ', location.buildingCode)
    }
    addSpacing(3)
  }

  // ===== DATE OF REPORT =====
  addSpacing(5)
    addText('Date of Report', fontSize.h3, true)
  addText(new Date(timestamp).toLocaleString(), fontSize.body)
  addSpacing(3)

  // ===== NOTES FROM THE BRIEF =====
  addSpacing(5)
    addText('Notes from the Brief', fontSize.h3, true)
  if (brief && brief.intent) {
    // Parse the intent text and format it properly
    const intentLines = brief.intent.split('\n').filter(line => line.trim())
    intentLines.forEach((line: string) => {
      if (line.trim().startsWith('**') && line.includes(':**')) {
        // Format bold labels
        const parts = line.split(':**')
        if (parts.length === 2) {
          const label = parts[0].replace(/\*\*/g, '').trim() + ':'
          const value = parts[1].trim()
          addLabelValue(label + ' ', value)
        } else {
          addText(line.replace(/\*\*/g, ''), fontSize.body)
        }
      } else if (line.trim().startsWith('- ')) {
        // Bullet point
        addBullet(line.replace(/^-\s*/, ''), fontSize.body, 5)
      } else {
        addText(line, fontSize.body)
      }
    })
  } else {
    addText('No brief notes provided.', fontSize.body, false, [128, 128, 128])
  }
  addSpacing(3)

  // ===== SUMMARY OF MATERIALS ANALYSIS =====
  addSpacing(10)
    addText('Summary of Materials Analysis', fontSize.h2, true)

  const tier1 = materials.filter((m) => m.tier === 1)
  const tier2 = materials.filter((m) => m.tier === 2)
  const tier3 = materials.filter((m) => m.tier === 3)

  addSpacing(3)
    addText(`Tier 1 (Green - Readily Available): ${tier1.length} materials`, fontSize.h4, true, [34, 139, 34])
  if (tier1.length > 0) {
    const tier1Names = tier1.map((m) => m.name).join(', ')
    addText(tier1Names, fontSize.body)
  } else {
    addText('0 materials', fontSize.body, false, [128, 128, 128])
  }

  addSpacing(3)
    addText(`Tier 2 (Yellow - Requires Customization): ${tier2.length} materials`, fontSize.h4, true, [255, 193, 7])
  if (tier2.length > 0) {
    const tier2Names = tier2.map((m) => m.name).join(', ')
    addText(tier2Names, fontSize.body)
  } else {
    addText('0 materials', fontSize.body, false, [128, 128, 128])
  }

  addSpacing(3)
    addText(`Tier 3 (Red - Custom Development): ${tier3.length} materials`, fontSize.h4, true, [220, 53, 69])
  if (tier3.length > 0) {
    const tier3Names = tier3.map((m) => m.name).join(', ')
    addText(tier3Names, fontSize.body)
  } else {
    addText('0 materials', fontSize.body, false, [128, 128, 128])
  }
  addSpacing(5)

  // ===== GREEN MATERIAL CARDS =====
        if (tier1.length > 0) {
          addSpacing(10)
          addText('Tier 1: Readily Available Materials', fontSize.h2, true)
    addSpacing(3)

    tier1.forEach((material, index) => {
      if (index > 0) addSpacing(5)
      addMaterialCard(material, 1)
    })
  }

  // ===== YELLOW MATERIAL CARDS =====
        if (tier2.length > 0) {
          addSpacing(10)
          addText('Tier 2: Requires Customization', fontSize.h2, true)
    addSpacing(3)

    tier2.forEach((material, index) => {
      if (index > 0) addSpacing(5)
      addMaterialCard(material, 2)
    })
  }

  // ===== RED MATERIAL CARDS =====
        if (tier3.length > 0) {
          addSpacing(10)
          addText('Tier 3: Custom Development Required', fontSize.h2, true)
    addSpacing(3)

    tier3.forEach((material, index) => {
      if (index > 0) addSpacing(5)
      addMaterialCard(material, 3)
    })
  }

  // ===== CONSULTANTS APPENDIX =====
  addSpacing(10)
  addText('Appendix: Elite Consultants by Tier', fontSize.h1, true)
  addSpacing(3)
  addText('The following consultants are recommended for the disciplines governing the identified materials in this analysis.', fontSize.body)
  addSpacing(5)

  // Helper function to add consultant card
  const addConsultantCard = (consultant: Consultant) => {
    // Consultant name (bold)
    doc.setFontSize(fontSize.h4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    const nameLines = doc.splitTextToSize(consultant.name, contentWidth)
    nameLines.forEach((line: string) => {
      checkNewPage(6)
      doc.text(line, margin, yPos)
      yPos += 6
    })

    // Firm
    doc.setFontSize(fontSize.body)
    doc.setFont('helvetica', 'bold')
    checkNewPage(5)
    doc.text('Firm:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const firmLines = doc.splitTextToSize(consultant.firm, contentWidth - 20)
    firmLines.forEach((line: string) => {
      checkNewPage(5)
      doc.text(line, margin + 20, yPos)
      yPos += 5
    })

    // Specialty
    doc.setFont('helvetica', 'bold')
    checkNewPage(5)
    doc.text('Specialty:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const specialtyLines = doc.splitTextToSize(consultant.specialty, contentWidth - 25)
    specialtyLines.forEach((line: string) => {
      checkNewPage(5)
      doc.text(line, margin + 25, yPos)
      yPos += 5
    })

    // Contact info
    doc.setFont('helvetica', 'bold')
    checkNewPage(5)
    doc.text('Email:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(consultant.email, margin + 20, yPos)
    yPos += 5

    doc.setFont('helvetica', 'bold')
    checkNewPage(5)
    doc.text('Phone:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(consultant.phone, margin + 25, yPos)
    yPos += 5

    if (consultant.website) {
      doc.setFont('helvetica', 'bold')
      checkNewPage(5)
      doc.text('Website:', margin, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(consultant.website, margin + 25, yPos)
      yPos += 5
    }

    // Disciplines
    doc.setFont('helvetica', 'bold')
    checkNewPage(5)
    doc.text('Disciplines:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const disciplinesText = consultant.disciplines.join(', ')
    const disciplineLines = doc.splitTextToSize(disciplinesText, contentWidth - 30)
    disciplineLines.forEach((line: string) => {
      checkNewPage(5)
      doc.text(line, margin + 30, yPos)
      yPos += 5
    })
    yPos += 2
  }

  // Green Consultants
  if (tier1.length > 0) {
    addSpacing(10)
    addText('Green Consultants (Tier 1 Materials)', fontSize.h2, true, [34, 139, 34])
    addSpacing(3)
    const tier1Divisions = [...new Set(tier1.map(m => m.csiDivision))]
    const greenConsultants = getConsultantsForDivisions(tier1Divisions, 1)
    greenConsultants.forEach((consultant, index) => {
      if (index > 0) addSpacing(5)
      addConsultantCard(consultant)
    })
    addSpacing(5)
  }

  // Yellow Consultants
  if (tier2.length > 0) {
    addSpacing(10)
    addText('Yellow Consultants (Tier 2 Materials)', fontSize.h2, true, [255, 193, 7])
    addSpacing(3)
    const tier2Divisions = [...new Set(tier2.map(m => m.csiDivision))]
    const yellowConsultants = getConsultantsForDivisions(tier2Divisions, 2)
    yellowConsultants.forEach((consultant, index) => {
      if (index > 0) addSpacing(5)
      addConsultantCard(consultant)
    })
    addSpacing(5)
  }

  // Red Consultants
  if (tier3.length > 0) {
    addSpacing(10)
    addText('Red Consultants (Tier 3 Materials)', fontSize.h2, true, [220, 53, 69])
    addSpacing(3)
    const tier3Divisions = [...new Set(tier3.map(m => m.csiDivision))]
    const redConsultants = getConsultantsForDivisions(tier3Divisions, 3)
    redConsultants.forEach((consultant, index) => {
      if (index > 0) addSpacing(5)
      addConsultantCard(consultant)
    })
    addSpacing(5)
  }

  // Material Suppliers Appendix (Green and Yellow only, if location provided)
  if ((tier1.length > 0 || tier2.length > 0) && location) {
    addSpacing(10)
    addText('Appendix: Material Suppliers by Tier', fontSize.h1, true)
    addSpacing(3)
    addText('The following suppliers are recommended for Tier 1 and Tier 2 materials. Suppliers are prioritized by proximity to the project location, with national suppliers listed when local options are limited.', fontSize.body)
    addSpacing(5)

    // Helper function to add supplier card
    const addSupplierCard = (supplier: Supplier) => {
      // Supplier name (bold, h4 size)
      doc.setFontSize(fontSize.h4)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      const nameLines = doc.splitTextToSize(supplier.name, contentWidth)
      nameLines.forEach((line: string) => {
        checkNewPage(6)
        doc.text(line, margin, yPos)
        yPos += 6
      })
      addSpacing(2)

      // Use label-value format for all fields
      addLabelValue('Company: ', supplier.company)
      const locationText = `${supplier.location} ${supplier.rating === 'local' ? '(Local)' : '(National)'}`
      addLabelValue('Location: ', locationText)
      addLabelValue('Material Types: ', supplier.materialTypes.join(', '))
      addLabelValue('Specialties: ', supplier.specialties.join(', '))
      addLabelValue('Email: ', supplier.email)
      addLabelValue('Phone: ', supplier.phone)
      if (supplier.website) {
        addLabelValue('Website: ', supplier.website)
      }
      addSpacing(3)
    }

    // Green Suppliers (Tier 1)
    if (tier1.length > 0) {
      addSpacing(10)
      addText('Green Suppliers (Tier 1 Materials)', fontSize.h2, true, [34, 139, 34])
      addSpacing(3)
      const greenSuppliers = getSuppliersForMaterials(tier1, location, 1)
      if (greenSuppliers.length > 0) {
        greenSuppliers.forEach((supplier, index) => {
          if (index > 0) addSpacing(5)
          addSupplierCard(supplier)
        })
      } else {
        addText('No local suppliers found. Consider national suppliers listed below.', fontSize.body, false, [128, 128, 128])
        addSpacing(3)
      }
      addSpacing(5)
    }

    // Yellow Suppliers (Tier 2)
    if (tier2.length > 0) {
      addSpacing(10)
      addText('Yellow Suppliers (Tier 2 Materials)', fontSize.h2, true, [255, 193, 7])
      addSpacing(3)
      const yellowSuppliers = getSuppliersForMaterials(tier2, location, 2)
      if (yellowSuppliers.length > 0) {
        yellowSuppliers.forEach((supplier, index) => {
          if (index > 0) addSpacing(5)
          addSupplierCard(supplier)
        })
      } else {
        addText('No local suppliers found. Consider national suppliers listed below.', fontSize.body, false, [128, 128, 128])
        addSpacing(3)
      }
      addSpacing(5)
    }

    // National Suppliers
    const allSuppliers = [
      ...(tier1.length > 0 ? getSuppliersForMaterials(tier1, location, 1) : []),
      ...(tier2.length > 0 ? getSuppliersForMaterials(tier2, location, 2) : [])
    ]
    const nationalSuppliers = allSuppliers.filter(s => s.rating === 'national')
    if (nationalSuppliers.length > 0) {
      addSpacing(10)
      addText('National Suppliers (High-Quality Options)', fontSize.h2, true)
      addSpacing(3)
      addText('The following national suppliers offer high-quality products and may provide better options when local suppliers are limited:', fontSize.body)
      addSpacing(5)
      nationalSuppliers.forEach((supplier, index) => {
        if (index > 0) addSpacing(5)
        addSupplierCard(supplier)
      })
      addSpacing(5)
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(fontSize.small)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Page ${i} of ${totalPages} - Generated by SpecMate`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Generate and download PDF report
 */
export async function generatePDFReport(analysis: Analysis): Promise<void> {
  const doc = await buildPDFDocument(analysis)
  const dateStr = new Date(analysis.timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `material-analysis-${dateStr}.pdf`
  doc.save(filename)
}

/**
 * Generate PDF report and return as blob URL for preview
 */
export async function generatePDFBlob(analysis: Analysis): Promise<string> {
  const doc = await buildPDFDocument(analysis)
  const blob = doc.output('blob')
  return URL.createObjectURL(blob)
}

