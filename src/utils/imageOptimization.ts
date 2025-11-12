import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
};

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  originalSize?: number;
  optimizedSize?: number;
  compressionRatio?: number;
}

/**
 * Optimizes an image by resizing and compressing it
 * @param uri - Local file URI of the image
 * @param options - Optimization parameters
 * @returns Optimized image URI and metadata
 */
export async function optimizeImage(
  uri: string,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Get original image info
    const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    // Calculate resize dimensions maintaining aspect ratio
    const { width, height } = calculateDimensions(
      imageInfo.width,
      imageInfo.height,
      opts.maxWidth,
      opts.maxHeight
    );

    // Perform optimization
    const manipulateActions = [];
    if (width !== imageInfo.width || height !== imageInfo.height) {
      manipulateActions.push({ resize: { width, height } });
    }

    const format =
      opts.format === 'jpeg'
        ? ImageManipulator.SaveFormat.JPEG
        : opts.format === 'png'
        ? ImageManipulator.SaveFormat.PNG
        : ImageManipulator.SaveFormat.WEBP;

    const result = await ImageManipulator.manipulateAsync(uri, manipulateActions, {
      compress: opts.quality,
      format,
    });

    // Get file sizes for comparison
    const originalSize = await getFileSize(uri);
    const optimizedSize = await getFileSize(result.uri);
    const compressionRatio = originalSize ? (1 - optimizedSize / originalSize) * 100 : 0;

    console.log(
      `📸 Image optimized: ${originalSize}KB → ${optimizedSize}KB (${compressionRatio.toFixed(1)}% reduction)`
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      originalSize,
      optimizedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error('Failed to optimize image');
  }
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if needed
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Get file size in KB
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return Math.round(blob.size / 1024);
  } catch {
    return 0;
  }
}

/**
 * Validate image before processing
 */
export async function validateImage(uri: string): Promise<{
  isValid: boolean;
  error?: string;
}> {
  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const sizeInMB = blob.size / (1024 * 1024);

    if (sizeInMB > MAX_FILE_SIZE_MB) {
      return {
        isValid: false,
        error: `Image is too large (${sizeInMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
      };
    }

    if (!ALLOWED_FORMATS.includes(blob.type)) {
      return {
        isValid: false,
        error: `Invalid image format: ${blob.type}. Allowed formats: JPEG, PNG, WebP.`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate image',
    };
  }
}

/**
 * Generate thumbnail for preview
 */
export async function generateThumbnail(uri: string, size: number = 200): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: size, height: size } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
