/**
 * AI Streaming API Route
 * 
 * Provides streaming AI responses for real-time user interactions.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator, createMessage, getFeatureTemperature, AIFeatureType } from '@/lib/ai';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      prompt,
      featureType,
      systemPrompt,
      temperature,
      maxTokens,
    }: {
      prompt: string;
      featureType?: AIFeatureType;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get orchestrator
    const orchestrator = getOrchestrator();

    // Prepare request
    const messages = [createMessage('user', prompt)];
    const temp = temperature ?? (featureType ? getFeatureTemperature(featureType) : 0.7);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of orchestrator.stream({
            messages,
            systemPrompt,
            temperature: temp,
            maxTokens: maxTokens || 2000,
          })) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : 'Streaming error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI streaming API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
