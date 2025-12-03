import { useEffect, useState } from 'react'
import type { Analysis } from '../types'
import { logReportGeneration } from '../utils/logging'

// Dynamically import PDF generation functions to reduce initial bundle size
async function loadPDFFunctions() {
  const reportModule = await import('../utils/report')
  return {
    generatePDFReport: reportModule.generatePDFReport,
    generatePDFBlob: reportModule.generatePDFBlob,
  }
}

interface ReportModalProps {
  analysis: Analysis
  onClose: () => void
  logId?: string | null  // Usage log ID for tracking report generation
}

export default function ReportModal({ analysis, onClose, logId }: ReportModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Generate PDF blob for preview (lazy load PDF functions)
    const generatePreview = async () => {
      try {
        setIsGenerating(true)
        setError(null)
        const { generatePDFBlob: generateBlob } = await loadPDFFunctions()
        const url = await generateBlob(analysis)
        setPdfUrl(url)
      } catch (error) {
        console.error('Error generating PDF preview:', error)
        setError(error instanceof Error ? error.message : 'Failed to generate PDF preview. Please try downloading the report directly.')
      } finally {
        setIsGenerating(false)
      }
    }

    generatePreview()

    // Cleanup: revoke blob URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [analysis])

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleDownload = async () => {
    try {
      const { generatePDFReport: generateReport } = await loadPDFFunctions()
      await generateReport(analysis)
      
      // Log PDF report generation
      if (logId) {
        logReportGeneration(logId, 'pdf').catch(() => {
          // Silently fail - don't interrupt user experience
        })
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to download PDF report. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ 
          height: '98vh',
          width: 'calc(98vh * 8.5 / 11)',
          maxWidth: '98vw',
          aspectRatio: '8.5 / 11'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">📄 Report Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-1">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-700 font-medium">Generating PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <svg
                className="w-12 h-12 text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-600 font-medium mb-2">Preview Generation Failed</p>
              <p className="text-gray-600 text-sm text-center max-w-md">{error}</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Download Report Anyway
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border border-gray-200 rounded-lg"
              title="PDF Report Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Failed to generate PDF preview</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-2 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            disabled={isGenerating}
          >
            Download Report (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}


