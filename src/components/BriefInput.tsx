import { useState, useRef } from 'react'

interface BriefInputProps {
  onBriefChange: (brief: { text: string; intent?: string } | null) => void
}

export default function BriefInput({ onBriefChange }: BriefInputProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextChange = (value: string) => {
    setText(value)
    if (value.trim()) {
      onBriefChange({ text: value })
    } else {
      onBriefChange(null)
    }
    setError(null)
  }

  const handleFileSelect = async (selectedFile: File) => {
    setError(null)
    setIsProcessing(true)

    // Validate file type
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const validExtensions = ['.txt', '.pdf', '.doc', '.docx']

    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
    const isValidType = validTypes.includes(selectedFile.type) || validExtensions.includes(fileExtension)

    if (!isValidType) {
      setError('Please upload a .txt, .pdf, .doc, or .docx file')
      setIsProcessing(false)
      return
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      setIsProcessing(false)
      return
    }

    try {
      let extractedText = ''

      // Read text files directly
      if (selectedFile.type === 'text/plain' || fileExtension === '.txt') {
        extractedText = await selectedFile.text()
      } else {
        // For PDF/DOCX, we'll extract text using FileReader
        // Note: Full PDF/DOCX parsing would require additional libraries
        // For now, we'll show a message that the file was uploaded
        // In production, you'd want to use a library like pdf-parse or mammoth
        extractedText = `[Document: ${selectedFile.name}]\n\nNote: Full text extraction from ${fileExtension} files requires additional processing. Please paste the document content in the text field above, or the file name will be used as a reference.`
      }

      setFile(selectedFile)
      setFileName(selectedFile.name)
      setText(extractedText)
      onBriefChange({ text: extractedText })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setFileName(null)
    setText('')
    onBriefChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        📝 Project Brief (Optional)
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Provide project requirements, constraints, or design intent to refine material analysis. You can enter text directly or upload a document.
      </p>

      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label htmlFor="brief-text" className="block text-sm font-medium text-gray-700 mb-2">
            Brief Text
          </label>
          <textarea
            id="brief-text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter project brief, requirements, constraints, or design intent..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Upload Document
          </label>
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOCX, or TXT (max 5MB)
              </p>
              {isProcessing && (
                <div className="mt-2">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fileName}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {text && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Brief Loaded
                </p>
                <p className="text-sm text-blue-800">
                  Project intent will be extracted and used to constrain material analysis
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  {text.length} characters
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

