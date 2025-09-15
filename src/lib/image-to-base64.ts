/**
 * Converts an image URL to a base64 data URI via our API proxy
 * This avoids CORS issues by proxying the request through our server
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(`/api/image-to-base64?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const { base64 } = await response.json();
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
}

/**
 * Converts an image URL to a base64 data URI with error fallback
 * Returns empty string if conversion fails
 */
export async function safeImageUrlToBase64(url: string): Promise<string> {
  try {
    return await imageUrlToBase64(url);
  } catch (error) {
    console.warn('Failed to convert image to base64, falling back to empty string:', error);
    return '';
  }
}