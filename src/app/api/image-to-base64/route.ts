import { NextRequest, NextResponse } from 'next/server';
import { safeServerImageUrlToBase64 } from '@/lib/server-image-to-base64';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing image URL parameter' },
        { status: 400 }
      );
    }

    const base64 = await safeServerImageUrlToBase64(imageUrl);

    return NextResponse.json({ base64 });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return NextResponse.json(
      { error: 'Failed to convert image to base64' },
      { status: 500 }
    );
  }
}