/**
 * Image compression utilities
 * Compresses images before sending to API to reduce payload size
 */

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

/**
 * Compress an image file to reduce its size
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed image as data URL
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    maxSizeMB = 5,
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          
          // Create canvas for compression
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          
          // Draw image to canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }
              
              // Check if compressed size is acceptable
              const sizeMB = blob.size / (1024 * 1024)
              if (sizeMB > maxSizeMB) {
                // If still too large, try more aggressive compression
                if (quality > 0.5) {
                  compressImage(file, { ...options, quality: quality * 0.8 })
                    .then(resolve)
                    .catch(reject)
                  return
                }
              }
              
              // Convert blob to data URL
              const reader = new FileReader()
              reader.onload = (e) => {
                resolve(e.target?.result as string)
              }
              reader.onerror = () => {
                reject(new Error('Failed to convert compressed image'))
              }
              reader.readAsDataURL(blob)
            },
            file.type.startsWith('image/png') ? 'image/png' : 'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Image compression failed'))
        }
      }
      
      img.src = e.target?.result as string
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Get estimated file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024)
}

/**
 * Check if image needs compression
 */
export function needsCompression(file: File, maxSizeMB: number = 5): boolean {
  return getFileSizeMB(file) > maxSizeMB
}

