/**
 * AI Provider Types and Interfaces
 * 
 * This file defines the core types and interfaces for the AI orchestrator system.
 * It provides a flexible abstraction layer for switching between different LLM providers.
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure-openai';

/**
 * AI model configuration for different providers
 */
export type AIModel = {
  openai: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-4o-mini';
  anthropic: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | 'claude-3-5-sonnet-20241022';
  google: 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  'azure-openai': 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
};

/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Message structure for AI conversations
 */
export interface AIMessage {
  role: MessageRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Configuration for AI completion requests
 */
export interface AICompletionConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  stop?: string[];
}

/**
 * AI completion request
 */
export interface AICompletionRequest extends AICompletionConfig {
  messages: AIMessage[];
  systemPrompt?: string;
}

/**
 * AI completion response
 */
export interface AICompletionResponse {
  id: string;
  provider: AIProvider;
  model: string;
  content: string;
  role: MessageRole;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter' | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Streaming chunk from AI completion
 */
export interface AIStreamChunk {
  id: string;
  provider: AIProvider;
  delta: string;
  finishReason: string | null;
}

/**
 * Function definition for function calling
 */
export interface AIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * AI orchestrator configuration
 */
export interface AIOrchestratorConfig {
  defaultProvider: AIProvider;
  defaultModel: string;
  fallbackProvider?: AIProvider;
  fallbackModel?: string;
  timeout?: number;
  retries?: number;
}

/**
 * AI feature types for the healthcare system
 */
export type AIFeatureType =
  | 'medical-note-summarization'
  | 'appointment-scheduling-assistant'
  | 'patient-insights'
  | 'prescription-generation'
  | 'medical-report-interpretation'
  | 'clinical-decision-support'
  | 'symptom-analysis'
  | 'drug-interaction-check'
  | 'diagnosis-suggestion'
  | 'treatment-plan-generation'
  | 'patient-communication'
  | 'data-visualization';

/**
 * Context for AI operations
 */
export interface AIContext {
  featureType: AIFeatureType;
  userId?: string;
  clinicId?: string;
  organizationId?: string;
  patientId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI operation result
 */
export interface AIOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: AIProvider;
  model: string;
  timestamp: Date;
}

/**
 * Prompt template for AI operations
 */
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  featureType: AIFeatureType;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  examples?: Array<{
    input: Record<string, unknown>;
    output: string;
  }>;
}
