import { useState } from 'react'
import type { Analysis, ProjectLocation, ProjectBrief } from './types'
import ImageUpload from './components/ImageUpload'
import AnalysisOptions from './components/AnalysisOptions'
import LocationInput from './components/LocationInput'
import BriefInput from './components/BriefInput'
import ResultsDisplay from './components/ResultsDisplay'
import ReportModal from './components/ReportModal'
import ContactModal from './components/ContactModal'
import Snowflakes from './components/Snowflakes'
import { analyzeImage } from './utils/analyze'
import { createUsageLog, submitUsageLog } from './utils/logging'

// Check if current date is in December
function isDecember(): boolean {
  return new Date().getMonth() === 11 // Month is 0-indexed, so 11 = December
}

function App() {
  const isHolidaySeason = isDecember()
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [includeSustainability, setIncludeSustainability] = useState(false)
  const [includeAlternatives, setIncludeAlternatives] = useState(false)
  const [location, setLocation] = useState<ProjectLocation | null>(null)
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [currentLogId, setCurrentLogId] = useState<string | null>(null)

  const handleImageUpload = (urls: string[]) => {
    setImageUrls(urls)
    setAnalysis(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (imageUrls.length === 0) return

    setIsLoading(true)
    setError(null)
    setAnalysis(null)
    
    const startTime = Date.now()

    try {
      const result = await analyzeImage({
        imageDataUrls: imageUrls,
        includeSustainability,
        includeAlternatives,
        location,
        brief,
      })

      const analysisDuration = Date.now() - startTime
      const timestamp = new Date().toISOString()

      const newAnalysis: Analysis = {
        imageUrls,
        materials: result.materials,
        timestamp,
        includeSustainability,
        includeAlternatives,
        location: location || undefined,
        brief: result.brief || brief || undefined,
      }
      setAnalysis(newAnalysis)
      
      // Create and submit usage log
      const usageLog = createUsageLog(newAnalysis, analysisDuration, result.apiTokens)
      setCurrentLogId(usageLog.id)
      submitUsageLog(usageLog).catch(() => {
        // Silently fail - don't interrupt user experience
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative ${isHolidaySeason ? 'bg-green-700' : 'bg-gray-50'}`}>
      {/* Snowflakes animation - behind content, in front of background */}
      {isHolidaySeason && <Snowflakes />}
      
      {/* Holiday message */}
      {isHolidaySeason && (
        <div className="relative z-10 text-center py-4">
          <h2 className="text-2xl font-bold text-red-600 animate-pulse">
            Happy Holidays!
          </h2>
        </div>
      )}
      
      <header className={`relative z-10 ${isHolidaySeason ? 'bg-white/95 backdrop-blur-sm' : 'bg-white'} shadow-sm border-b border-gray-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🏗️ SpecMate</h1>
          <p className="mt-2 text-sm text-gray-600">
            📋 Material Feasibility Analyzer for Architects
          </p>
          <p className="mt-4 text-base text-gray-700 leading-relaxed max-w-3xl">
            SpecMate analyzes early stage architectural visualizations to identify construction materials and classify them by feasibility. The tool determines which materials are readily available, which require customization, and which need custom development or R&D. This enables architects to quickly assess the buildability of their design concepts and make informed material specification decisions.
          </p>
        </div>
      </header>
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Three Column Layout */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left Column: Image Upload and Project Location (stacked) */}
            <div className="flex flex-col gap-6">
              <div className="flex">
                <ImageUpload onImageUpload={handleImageUpload} />
              </div>
              {imageUrls.length > 0 && (
                <div className="flex">
                  <LocationInput onLocationChange={setLocation} />
                </div>
              )}
            </div>

            {/* Middle Column: Project Brief */}
            {imageUrls.length > 0 && (
              <div className="flex">
                <BriefInput onBriefChange={setBrief} />
              </div>
            )}

            {/* Right Column: Analysis Options */}
            {imageUrls.length > 0 && (
              <div className="flex">
                <AnalysisOptions
                  includeSustainability={includeSustainability}
                  includeAlternatives={includeAlternatives}
                  onSustainabilityChange={setIncludeSustainability}
                  onAlternativesChange={setIncludeAlternatives}
                  onAnalyze={!isLoading ? handleAnalyze : undefined}
                  isAnalyzing={isLoading}
                />
              </div>
            )}
          </div>
        </section>

        {/* Loading Overlay */}
        {isLoading && (
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700 font-medium">
                {brief ? 'Extracting project intent and analyzing materials...' : 'Analyzing materials...'} this may take 20-30 seconds
              </p>
              {brief && (
                <p className="text-sm text-gray-500 mt-2">
                  Processing brief to constrain material analysis
                </p>
              )}
            </div>
          </section>
        )}

        {/* Results Area */}
        {analysis && (
          <section className="mt-8">
            <ResultsDisplay
              materials={analysis.materials}
              showSustainability={analysis.includeSustainability}
              showAlternatives={analysis.includeAlternatives}
              showCodeCompliance={!!analysis.location}
              onGenerateReport={() => setShowReportModal(true)}
            />
          </section>
        )}

        {/* Report Modal */}
        {showReportModal && analysis && (
          <ReportModal
            analysis={analysis}
            onClose={() => setShowReportModal(false)}
            logId={currentLogId}
          />
        )}

        {/* Error Display */}
        {error && (
          <section className="mt-8" role="alert">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Contact Button - Fixed at bottom */}
      <footer className="relative z-10 mt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <button
            onClick={() => setShowContactModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            👋 Feedback
          </button>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </div>
  )
}

export default App

