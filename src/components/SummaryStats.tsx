import type { Material } from '../types'

interface SummaryStatsProps {
  materials: Material[]
  onGenerateReport?: () => void
}

export default function SummaryStats({ materials, onGenerateReport }: SummaryStatsProps) {
  const tier1Count = materials.filter(m => m.tier === 1).length
  const tier2Count = materials.filter(m => m.tier === 2).length
  const tier3Count = materials.filter(m => m.tier === 3).length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">📊 Summary</h2>
        {onGenerateReport && (
          <button
            onClick={onGenerateReport}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Generate Report
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Materials</p>
          <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-800 mb-1">Tier 1 (Readily Available)</p>
          <p className="text-2xl font-bold text-green-900">{tier1Count}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-1">Tier 2 (Requires Customization)</p>
          <p className="text-2xl font-bold text-yellow-900">{tier2Count}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-800 mb-1">Tier 3 (Needs Development)</p>
          <p className="text-2xl font-bold text-red-900">{tier3Count}</p>
        </div>
      </div>
    </div>
  )
}


