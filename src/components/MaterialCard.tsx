import { useState } from 'react'
import type { Material } from '../types'

interface MaterialCardProps {
  material: Material
  showSustainability: boolean
  showAlternatives: boolean
  showCodeCompliance: boolean
}

export default function MaterialCard({
  material,
  showSustainability,
  showAlternatives,
  showCodeCompliance,
}: MaterialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getTierColors = (tier: 1 | 2 | 3) => {
    switch (tier) {
      case 1:
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          badge: 'bg-green-600',
        }
      case 2:
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          badge: 'bg-yellow-600',
        }
      case 3:
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          badge: 'bg-red-600',
        }
    }
  }

  const colors = getTierColors(material.tier)

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsExpanded(!isExpanded)
        }
      }}
      aria-expanded={isExpanded}
      className={`
        bg-white rounded-lg shadow-sm border-2 transition-all duration-200
        ${colors.border} ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}
        cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {material.csiNumber} - {material.csiDivision.toUpperCase()}
            </span>
          </div>
          <span
            className={`${colors.badge} text-white text-xs font-bold px-2 py-1 rounded`}
          >
            TIER {material.tier}
          </span>
        </div>

        {/* Material Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {material.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {material.description}
        </p>

        {/* Properties */}
        <div className="flex flex-wrap gap-2 mb-3">
          {material.properties.slice(0, 3).map((prop, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {prop}
            </span>
          ))}
          {material.properties.length > 3 && (
            <span className="text-xs text-gray-500">
              +{material.properties.length - 3} more
            </span>
          )}
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Full Description */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                📝 Description
              </h4>
              <p className="text-sm text-gray-700">{material.description}</p>
            </div>

            {/* All Properties */}
            {material.properties.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  🔧 Properties
                </h4>
                <div className="flex flex-wrap gap-2">
                  {material.properties.map((prop, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                💡 Feasibility Notes
              </h4>
              <p className="text-sm text-gray-700">{material.reasoning}</p>
            </div>

            {/* Sustainability Notes */}
            {showSustainability && material.sustainabilityNotes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🌱</span>
                  <div>
                    <h4 className="text-sm font-semibold text-green-900 mb-1">
                      Sustainability Notes
                    </h4>
                    <p className="text-sm text-green-800">
                      {material.sustainabilityNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Code Compliance */}
            {showCodeCompliance && material.codeCompliance && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-purple-900 mb-1">
                      Building Code Compliance
                    </h4>
                    <p className="text-sm text-purple-800">
                      {material.codeCompliance}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alternatives */}
            {showAlternatives && material.alternatives && material.alternatives.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  🔄 Alternative Materials
                </h4>
                <div className="space-y-3">
                  {material.alternatives.map((alt, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <h5 className="text-sm font-semibold text-gray-900 mb-1">
                        {alt.name}
                      </h5>
                      <p className="text-xs text-gray-700 mb-2">{alt.description}</p>
                      <p className="text-xs text-gray-600">
                        <strong>Tradeoffs:</strong> {alt.tradeoffs}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expand/Collapse Indicator */}
        <button
          className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      </div>
    </div>
  )
}


