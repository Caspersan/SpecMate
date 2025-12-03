interface AnalysisOptionsProps {
  includeSustainability: boolean
  includeAlternatives: boolean
  onSustainabilityChange: (value: boolean) => void
  onAlternativesChange: (value: boolean) => void
  onAnalyze?: () => void
  isAnalyzing?: boolean
}

export default function AnalysisOptions({
  includeSustainability,
  includeAlternatives,
  onSustainabilityChange,
  onAlternativesChange,
  onAnalyze,
  isAnalyzing = false,
}: AnalysisOptionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        ⚙️ Analysis Options
      </h2>
      <div className="space-y-4 flex-1">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={includeSustainability}
            onChange={(e) => onSustainabilityChange(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-700">
              Include sustainability notes
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Adds environmental performance analysis for each material
            </p>
          </div>
        </label>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={includeAlternatives}
            onChange={(e) => onAlternativesChange(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-700">
              Include alternative materials
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Suggests 2-3 alternative materials for each identified material
            </p>
          </div>
        </label>
      </div>

      {/* Analyze Button */}
      {onAnalyze && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Materials'}
          </button>
        </div>
      )}
    </div>
  )
}


