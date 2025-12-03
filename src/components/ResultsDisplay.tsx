import { useState } from 'react'
import type { Material } from '../types'
import SummaryStats from './SummaryStats'
import MaterialCard from './MaterialCard'

interface ResultsDisplayProps {
  materials: Material[]
  showSustainability: boolean
  showAlternatives: boolean
  showCodeCompliance: boolean
  onGenerateReport?: () => void
}

export default function ResultsDisplay({
  materials,
  showSustainability,
  showAlternatives,
  showCodeCompliance,
  onGenerateReport,
}: ResultsDisplayProps) {
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

  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(divisionKeys) // All expanded by default
  )

  const toggleDivision = (key: string) => {
    const newExpanded = new Set(expandedDivisions)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDivisions(newExpanded)
  }

  return (
    <div>
      <SummaryStats materials={materials} onGenerateReport={onGenerateReport} />

      <div className="space-y-6">
        {divisionKeys.map((divisionKey) => {
          const divisionMaterials = groupedByDivision[divisionKey]
          const isExpanded = expandedDivisions.has(divisionKey)

          // Group by tier within division
          const tier1 = divisionMaterials.filter((m) => m.tier === 1)
          const tier2 = divisionMaterials.filter((m) => m.tier === 2)
          const tier3 = divisionMaterials.filter((m) => m.tier === 3)

          return (
            <div
              key={divisionKey}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Division Header */}
              <button
                onClick={() => toggleDivision(divisionKey)}
                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  🏢{' '}
                  {divisionKey}
                  {divisionKey}
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isExpanded ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Division Content */}
              {isExpanded && (
                <div className="p-6">
                  {/* Tier 1 */}
                  {tier1.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-green-800 mb-3">
                        ✅ Tier 1: Readily Available ({tier1.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tier1.map((material, index) => (
                          <MaterialCard
                            key={index}
                            material={material}
                            showSustainability={showSustainability}
                            showAlternatives={showAlternatives}
                            showCodeCompliance={showCodeCompliance}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tier 2 */}
                  {tier2.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-yellow-800 mb-3">
                        ⚠️ Tier 2: Requires Customization ({tier2.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tier2.map((material, index) => (
                          <MaterialCard
                            key={index}
                            material={material}
                            showSustainability={showSustainability}
                            showAlternatives={showAlternatives}
                            showCodeCompliance={showCodeCompliance}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tier 3 */}
                  {tier3.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-red-800 mb-3">
                        ❌ Tier 3: Custom Development Required ({tier3.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tier3.map((material, index) => (
                          <MaterialCard
                            key={index}
                            material={material}
                            showSustainability={showSustainability}
                            showAlternatives={showAlternatives}
                            showCodeCompliance={showCodeCompliance}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


