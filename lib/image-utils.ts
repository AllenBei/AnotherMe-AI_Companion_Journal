import imageCompression from 'browser-image-compression'

// 图片压缩选项接口
export interface ImageCompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  quality?: number
  preserveExif?: boolean
  fileType?: string
}

// 压缩结果接口
export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  sourceFileKey?: string // 用于精确匹配原始文件的标识
}

// 默认压缩选项
const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 2, // 最大2MB
  maxWidthOrHeight: 1920, // 最大宽高1920px
  useWebWorker: true, // 使用Web Worker提高性能
  quality: 0.8, // 80%质量
  preserveExif: false, // 不保留EXIF数据以减少文件大小
}

/**
 * 压缩单个图片文件
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    const originalSize = file.size
    const compressedFile = await imageCompression(file, mergedOptions)
    const compressedSize = compressedFile.size
    const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100)
    
    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: Math.max(0, compressionRatio)
    }
  } catch (error) {
    console.error('Image compression failed:', error)
    throw new Error('图片压缩失败')
  }
}

/**
 * 批量压缩多个图片文件
 */
export async function compressImages(
  files: File[],
  options: ImageCompressionOptions = {},
  onProgress?: (progress: number, currentIndex: number, originalFile?: File) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await compressImage(files[i], options)
      results.push(result)
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100, i, files[i])
      }
    } catch (error) {
      console.error(`Failed to compress file ${i}:`, error)
      // 如果压缩失败，使用原文件
      results.push({
        compressedFile: files[i],
        originalSize: files[i].size,
        compressedSize: files[i].size,
        compressionRatio: 0
      })
    }
  }
  
  return results
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 创建图片预览URL
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * 清理图片预览URL
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * 获取图片尺寸信息
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = createImagePreview(file)
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
      revokeImagePreview(url)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      revokeImagePreview(url)
    }
    
    img.src = url
  })
}

/**
 * 支持的图片格式列表
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
] as const

/**
 * 支持的图片格式显示名称
 */
export const SUPPORTED_IMAGE_FORMATS = 'JPEG, PNG, WebP, GIF'

/**
 * 默认最大文件大小 (MB)
 */
export const DEFAULT_MAX_FILE_SIZE = 10

/**
 * 默认最大文件数量
 */
export const DEFAULT_MAX_FILES = 5 