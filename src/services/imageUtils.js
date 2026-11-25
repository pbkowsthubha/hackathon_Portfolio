/**
 * Image Processing Utilities for Client-Side LocalStorage
 * Resizes and compresses images to maintain high visual quality
 * while preventing localStorage quota exhaustion.
 */

export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB raw limit
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' }
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image (JPEG, PNG, or WebP).',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Image file size must be less than 2MB.',
    }
  }

  return { valid: true }
}

export function processAndCompressImage(file, maxDimension = 360, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return reject(new Error(validation.error))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))

    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image for processing.'))

      img.onload = () => {
        let { width, height } = img

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available.'))
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }

      img.src = e.target.result
    }

    reader.readAsDataURL(file)
  })
}

export function processProjectThumbnail(file, maxDimension = 900, quality = 0.82) {
  return processAndCompressImage(file, maxDimension, quality)
}
