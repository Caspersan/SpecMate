import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { compressImage, needsCompression } from '../utils/imageCompression'

interface ImageUploadProps {
  onImageUpload: (imageUrls: string[]) => void
}

interface ImageInfo {
  url: string
  name: string
  size: number
  dimensions?: string
}

export default function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const maxSize = 10 * 1024 * 1024 // 10 MB
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG or PNG image file')
      return false
    }
    
    if (file.size > maxSize) {
      setError(`File size too large. Maximum size is ${formatFileSize(maxSize)}. Please compress the image and try again.`)
      return false
    }
    
    if (file.size === 0) {
      setError('File appears to be empty. Please select a valid image file.')
      return false
    }
    
    return true
  }

  const processFile = async (file: File): Promise<ImageInfo | null> => {
    if (!validateFile(file)) return null

    try {
      let dataUrl: string
      let finalFileSize = file.size
      
      // Compress image if it's large (>2MB or needs compression)
      if (needsCompression(file, 2)) {
        try {
          dataUrl = await compressImage(file, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.85,
            maxSizeMB: 5,
          })
          // Get compressed size from data URL
          const base64 = dataUrl.split(',')[1]
          finalFileSize = (base64.length * 3) / 4 // Approximate base64 size
        } catch (compressError) {
          // If compression fails, use original file
          const reader = new FileReader()
          dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        }
      } else {
        // For smaller files, just read directly
        const reader = new FileReader()
        dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      }
      
      if (!dataUrl) {
        throw new Error('Failed to process the image')
      }
      
      // Get image dimensions
      return new Promise<ImageInfo>((resolve, reject) => {
        const img = new Image()
        img.onerror = () => {
          reject(new Error('The selected file is not a valid image. Please select a JPEG or PNG file.'))
        }
        img.onload = () => {
          resolve({
            url: dataUrl,
            name: file.name,
            size: finalFileSize,
            dimensions: `${img.width} × ${img.height}px`
          })
        }
        img.src = dataUrl
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('An error occurred while processing the image')
    }
  }

  const processFiles = async (files: FileList) => {
    setError(null)
    setIsProcessing(true)
    
    const fileArray = Array.from(files)
    const maxFiles = 10 // Limit to 10 images
    
    if (fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed. Please select fewer images.`)
      setIsProcessing(false)
      return
    }
    
    try {
      const processedImages: ImageInfo[] = []
      const errors: string[] = []
      
      // Process all files
      for (const file of fileArray) {
        try {
          const imageInfo = await processFile(file)
          if (imageInfo) {
            processedImages.push(imageInfo)
          }
        } catch (fileError) {
          errors.push(`${file.name}: ${fileError instanceof Error ? fileError.message : 'Processing failed'}`)
        }
      }
      
      if (processedImages.length === 0) {
        setError(errors.length > 0 ? errors.join('; ') : 'No images were successfully processed.')
        setIsProcessing(false)
        return
      }
      
      if (errors.length > 0) {
        setError(`Some images failed to process: ${errors.join('; ')}`)
      }
      
      // Update state with all processed images
      const newImages = [...images, ...processedImages]
      setImages(newImages)
      
      // Notify parent with all image URLs
      onImageUpload(newImages.map(img => img.url))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while processing images.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImageUpload(newImages.map(img => img.url))
    setError(null)
  }

  const handleClearAll = () => {
    setImages([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageUpload([])
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (images.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Uploaded Images ({images.length})
          </h3>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative border border-gray-200 rounded-lg p-3">
              <img
                src={image.url}
                alt={`Uploaded image ${index + 1}: ${image.name}`}
                className="w-full h-auto rounded-lg mb-2 max-h-48 object-contain"
              />
              <div className="text-xs text-gray-600 mb-2">
                <p className="font-medium truncate" title={image.name}>{image.name}</p>
                <p>Size: {formatFileSize(image.size)}</p>
                {image.dimensions && <p>Dimensions: {image.dimensions}</p>}
              </div>
              <button
                onClick={() => handleRemoveImage(index)}
                className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                aria-label={`Remove ${image.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={handleClick}
          className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
        >
          Add More Images
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 h-full flex flex-col">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        aria-label="Upload image file"
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-1 flex items-center justify-center
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
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
          <p className="text-lg font-medium text-gray-700 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            JPEG or PNG images only (up to 10 images)
          </p>
          {isProcessing && (
            <p className="text-sm text-blue-600 mt-2">Processing images...</p>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}



