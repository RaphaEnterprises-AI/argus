/**
 * Screenshot URL utility functions.
 *
 * Handles transformation of various screenshot URL formats to ensure they're accessible:
 * - Broken R2 URLs -> Worker proxy URLs
 * - Artifact IDs -> Worker proxy URLs
 * - Base64 data -> Data URLs
 * - Valid URLs -> Pass through
 */

// Worker URL for public screenshot access (no auth required)
export const WORKER_SCREENSHOT_URL = 'https://argus-api.samuelvinay-kumar.workers.dev/screenshots';

/**
 * Transform a screenshot URL/reference to an accessible URL.
 *
 * Handles:
 * - data: URLs (pass through)
 * - Valid HTTPS URLs (pass through, unless broken R2 URLs)
 * - Broken R2 URLs (transform to Worker proxy)
 * - Artifact IDs (screenshot_xxx format) (transform to Worker proxy)
 * - Raw base64 data (convert to data URL)
 */
export function resolveScreenshotUrl(src: string | null | undefined): string {
  if (!src) {
    return '/placeholder-screenshot.svg';
  }

  // Already a data URL - use directly
  if (src.startsWith('data:')) {
    return src;
  }

  // HTTP(S) URL - check for broken R2 URLs and transform
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Fix broken R2 URLs by routing through Worker proxy
    // Old format: https://argus-artifacts.r2.cloudflarestorage.com/screenshots/screenshot_xxx.png
    // New format: https://argus-api.samuelvinay-kumar.workers.dev/screenshots/screenshot_xxx
    if (src.includes('r2.cloudflarestorage.com')) {
      const match = src.match(/screenshots\/([^.]+)(?:\.png)?$/);
      if (match) {
        return `${WORKER_SCREENSHOT_URL}/${match[1]}`;
      }
    }
    return src;
  }

  // Artifact ID (format: screenshot_xxx_yyyymmdd_hhmmss)
  if (src.startsWith('screenshot_')) {
    return `${WORKER_SCREENSHOT_URL}/${src}`;
  }

  // Assume it's base64 data - only if it's long enough to be valid base64
  if (src.length > 100) {
    return `data:image/png;base64,${src}`;
  }

  // Short string that's not a valid reference - likely an error
  console.warn(`[resolveScreenshotUrl] Invalid screenshot value: ${src.substring(0, 50)}...`);
  return '/placeholder-screenshot.svg';
}
