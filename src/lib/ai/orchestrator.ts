/**
 * AI Orchestrator
 * 
 * Central orchestrator for managing AI operations using Vercel AI SDK.
 * Provides a unified interface for AI operations with automatic fallback and retry logic.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText, LanguageModel } from 'ai';
import {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIOrchestratorConfig,
} from './types';
import { getAIConfig, providerConfig } from './config';

/**
 * AI Orchestrator class for managing multiple AI providers using Vercel AI SDK
 */
export class AIOrchestrator {
  private config: AIOrchestratorConfig;
  private models: Map<AIProvider, LanguageModel>;

  constructor(config?: Partial<AIOrchestratorConfig>) {
    this.config = { ...getAIConfig(), ...config };
    this.models = new Map();
    this.initializeModels();
  }

  /**
   * Initialize provider models using Vercel AI SDK
   * 
   * Note: baseURL is only passed if explicitly set via environment variables.
   * The SDK provides sensible defaults, so we don't need to specify them.
   */
  private initializeModels() {
    // OpenAI
    if (providerConfig.openai.apiKey) {
      const openai = createOpenAI({
        apiKey: providerConfig.openai.apiKey,
        organization: providerConfig.openai.organization,
        ...(providerConfig.openai.baseURL && { baseURL: providerConfig.openai.baseURL }),
      });
      this.models.set('openai', openai(this.config.defaultModel));
    }

    // Anthropic
    if (providerConfig.anthropic.apiKey) {
      const anthropic = createAnthropic({
        apiKey: providerConfig.anthropic.apiKey,
        ...(providerConfig.anthropic.baseURL && { baseURL: providerConfig.anthropic.baseURL }),
      });
      this.models.set('anthropic', anthropic(this.config.defaultModel));
    }

    // Google
    if (providerConfig.google.apiKey) {
      const google = createGoogleGenerativeAI({
        apiKey: providerConfig.google.apiKey,
        ...(providerConfig.google.baseURL && { baseURL: providerConfig.google.baseURL }),
      });
      this.models.set('google', google(this.config.defaultModel));
    }
  }

  /**
   * Get a model for a specific provider
   */
  private getModel(provider: AIProvider, modelName?: string): LanguageModel {
    if (!this.models.has(provider)) {
      throw new Error(`Provider ${provider} is not configured or available`);
    }

    // If model name is specified, create a new model instance
    if (modelName) {
      if (provider === 'openai' && providerConfig.openai.apiKey) {
        const openai = createOpenAI({
          apiKey: providerConfig.openai.apiKey,
          organization: providerConfig.openai.organization,
          ...(providerConfig.openai.baseURL && { baseURL: providerConfig.openai.baseURL }),
        });
        return openai(modelName);
      } else if (provider === 'anthropic' && providerConfig.anthropic.apiKey) {
        const anthropic = createAnthropic({
          apiKey: providerConfig.anthropic.apiKey,
          ...(providerConfig.anthropic.baseURL && { baseURL: providerConfig.anthropic.baseURL }),
        });
        return anthropic(modelName);
      } else if (provider === 'google' && providerConfig.google.apiKey) {
        const google = createGoogleGenerativeAI({
          apiKey: providerConfig.google.apiKey,
          ...(providerConfig.google.baseURL && { baseURL: providerConfig.google.baseURL }),
        });
        return google(modelName);
      }
    }

    return this.models.get(provider)!;
  }

  /**
   * Complete a chat conversation with automatic fallback using Vercel AI SDK
   */
  async complete(request: Partial<AICompletionRequest>): Promise<AICompletionResponse> {
    const provider = request.provider || this.config.defaultProvider;
    const modelName = request.model || this.config.defaultModel;

    let lastError: Error | null = null;
    const retries = this.config.retries || 0;

    // Try primary provider with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const model = this.getModel(provider, modelName);
        
        // Build messages for Vercel AI SDK
        // Support both string content and multimodal content (text + images)
        const messages: any[] = request.messages?.map(msg => {
          // Handle multimodal content (array of text/image parts)
          if (Array.isArray(msg.content)) {
            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content.map(part => {
                if (part.type === 'text') {
                  return { type: 'text', text: part.text };
                } else if (part.type === 'image') {
                  return { type: 'image', image: part.image };
                }
                return part;
              }),
            };
          }
          
          // Handle simple string content
          return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          };
        }) || [];

        // Add system prompt if provided
        if (request.systemPrompt && !messages.some(m => m.role === 'system')) {
          messages.unshift({
            role: 'system',
            content: request.systemPrompt,
          });
        }

        const result = await generateText({
          model,
          messages,
          temperature: request.temperature ?? 0.7,
          ...(request.maxTokens ? { maxCompletionTokens: request.maxTokens } : {}),
          topP: request.topP,
          frequencyPenalty: request.frequencyPenalty,
          presencePenalty: request.presencePenalty,
          abortSignal: this.config.timeout 
            ? AbortSignal.timeout(this.config.timeout)
            : undefined,
        });

        return {
          id: result.response.id || Math.random().toString(),
          provider,
          model: result.response.modelId || modelName,
          content: result.text,
          role: 'assistant',
          finishReason: this.mapFinishReason(result.finishReason),
          usage: {
            promptTokens: (result.usage as any).promptTokens || 0,
            completionTokens: (result.usage as any).completionTokens || 0,
            totalTokens: (result.usage as any).totalTokens || 0,
          },
          metadata: {
            timestamp: result.response.timestamp,
            headers: result.response.headers,
          },
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed for ${provider}:`, error);
        
        if (attempt < retries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // Try fallback provider if configured
    if (this.config.fallbackProvider && this.config.fallbackProvider !== provider) {
      try {
        console.log(`Falling back to ${this.config.fallbackProvider}`);
        const fallbackModel = this.getModel(
          this.config.fallbackProvider,
          this.config.fallbackModel || this.config.defaultModel
        );

        const messages: any[] = request.messages?.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })) || [];

        if (request.systemPrompt && !messages.some(m => m.role === 'system')) {
          messages.unshift({
            role: 'system',
            content: request.systemPrompt,
          });
        }

        const result = await generateText({
          model: fallbackModel,
          messages,
          temperature: request.temperature ?? 0.7,
          ...(request.maxTokens ? { maxCompletionTokens: request.maxTokens } : {}),
          abortSignal: this.config.timeout 
            ? AbortSignal.timeout(this.config.timeout)
            : undefined,
        });

        return {
          id: result.response.id || Math.random().toString(),
          provider: this.config.fallbackProvider,
          model: result.response.modelId || this.config.fallbackModel || this.config.defaultModel,
          content: result.text,
          role: 'assistant',
          finishReason: this.mapFinishReason(result.finishReason),
          usage: {
            promptTokens: (result.usage as any).promptTokens || 0,
            completionTokens: (result.usage as any).completionTokens || 0,
            totalTokens: (result.usage as any).totalTokens || 0,
          },
        };
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
      }
    }

    throw lastError || new Error('AI completion failed');
  }

  /**
   * Stream a chat conversation using Vercel AI SDK
   */
  async *stream(request: Partial<AICompletionRequest>): AsyncIterableIterator<AIStreamChunk> {
    const provider = request.provider || this.config.defaultProvider;
    const modelName = request.model || this.config.defaultModel;

    try {
      const model = this.getModel(provider, modelName);
      
      const messages: any[] = request.messages?.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })) || [];

      if (request.systemPrompt && !messages.some(m => m.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      const result = streamText({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        ...(request.maxTokens ? { maxCompletionTokens: request.maxTokens } : {}),
        topP: request.topP,
        frequencyPenalty: request.frequencyPenalty,
        presencePenalty: request.presencePenalty,
      });

      for await (const chunk of result.textStream) {
        yield {
          id: Math.random().toString(),
          provider,
          delta: chunk,
          finishReason: null,
        };
      }
    } catch (error) {
      console.error(`Streaming failed for ${provider}:`, error);
      
      // Try fallback provider if configured
      if (this.config.fallbackProvider && this.config.fallbackProvider !== provider) {
        console.log(`Falling back to ${this.config.fallbackProvider} for streaming`);
        try {
          const fallbackModel = this.getModel(
            this.config.fallbackProvider,
            this.config.fallbackModel || this.config.defaultModel
          );

          const messages: any[] = request.messages?.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })) || [];

          if (request.systemPrompt && !messages.some(m => m.role === 'system')) {
            messages.unshift({
              role: 'system',
              content: request.systemPrompt,
            });
          }

          const fallbackResult = streamText({
            model: fallbackModel,
            messages,
            temperature: request.temperature ?? 0.7,
            ...(request.maxTokens ? { maxCompletionTokens: request.maxTokens } : {}),
          });

          for await (const chunk of fallbackResult.textStream) {
            yield {
              id: Math.random().toString(),
              provider: this.config.fallbackProvider,
              delta: chunk,
              finishReason: null,
            };
          }
          return;
        } catch (fallbackError) {
          console.error('Fallback streaming also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Map Vercel AI SDK finish reason to our format
   */
  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' | null {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content-filter':
        return 'content_filter';
      default:
        return null;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.models.keys());
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return this.models.has(provider);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIOrchestratorConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default orchestrator instance
 */
let defaultOrchestrator: AIOrchestrator | null = null;

/**
 * Get the default orchestrator instance
 */
export function getOrchestrator(): AIOrchestrator {
  if (!defaultOrchestrator) {
    defaultOrchestrator = new AIOrchestrator();
  }
  return defaultOrchestrator;
}

/**
 * Reset the default orchestrator (useful for testing)
 */
export function resetOrchestrator() {
  defaultOrchestrator = null;
}
