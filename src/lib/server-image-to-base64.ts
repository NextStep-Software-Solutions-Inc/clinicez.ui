/**
 * Server-side image to base64 converter
 * This avoids CORS issues by fetching images from the server
 */
export async function serverImageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting image to base64 on server:', error);
    throw new Error('Failed to convert image to base64');
  }
}

/**
 * Server-side safe image to base64 converter with fallback
 */
export async function safeServerImageUrlToBase64(url: string): Promise<string> {
  try {
    return await serverImageUrlToBase64(url);
  } catch (error) {
    console.warn('Failed to convert image to base64 on server, falling back to empty string:', error);
    return '';
  }
}