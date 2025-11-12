import { Image } from 'expo-image';

/**
 * Preload images for better UX
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(
      urls.map((url) =>
        Image.prefetch(url, {
          cachePolicy: 'memory-disk',
        })
      )
    );
  } catch (error) {
    console.error('Failed to preload images:', error);
  }
}

/**
 * Clear image cache (for settings)
 */
export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearMemoryCache();
    await Image.clearDiskCache();
    console.log('✅ Image cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Get cache size in bytes (approximation)
 * Note: Exact cache size is not available via expo-image API
 * This returns an estimated size based on memory cache status
 */
export async function getCacheSize(): Promise<number> {
  // expo-image doesn't provide a direct way to get cache size
  // Return 0 for now, but the clear function still works
  return 0;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
