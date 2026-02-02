/**
 * AI Configuration
 * 
 * Centralized configuration for AI features and providers.
 */

import { AIProvider, AIOrchestratorConfig } from './types';

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(): AIOrchestratorConfig {
  const defaultProvider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'google') as AIProvider;
  const defaultModel = process.env.NEXT_PUBLIC_AI_MODEL || 'gemini-1.5-pro';
  const fallbackProvider = process.env.NEXT_PUBLIC_AI_FALLBACK_PROVIDER as AIProvider | undefined;
  const fallbackModel = process.env.NEXT_PUBLIC_AI_FALLBACK_MODEL;

  return {
    defaultProvider,
    defaultModel,
    fallbackProvider,
    fallbackModel,
    timeout: Number(process.env.AI_TIMEOUT) || 30000, // 30 seconds default
    retries: Number(process.env.AI_RETRIES) || 2,
  };
}

/**
 * Provider-specific configuration
 * 
 * Note: baseURL is optional - the Vercel AI SDK has sensible defaults:
 * - OpenAI: https://api.openai.com/v1
 * - Anthropic: https://api.anthropic.com
 * - Google: https://generativelanguage.googleapis.com/v1beta
 * 
 * Only set baseURL via environment variables if you need to use a proxy or custom endpoint.
 */
export const providerConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
    baseURL: process.env.OPENAI_BASE_URL, // Optional: only for custom endpoints
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.ANTHROPIC_BASE_URL, // Optional: only for custom endpoints
  },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    baseURL: process.env.GOOGLE_AI_BASE_URL, // Optional: only for custom endpoints
  },
  'azure-openai': {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  },
} as const;

/**
 * Default model settings per provider
 */
export const defaultModels: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  google: 'gemini-1.5-pro',
  'azure-openai': 'gpt-4',
};

/**
 * Default temperature settings for different AI features
 */
export const featureTemperatures = {
  'medical-note-summarization': 0.3,
  'appointment-scheduling-assistant': 0.5,
  'patient-insights': 0.7,
  'prescription-generation': 0.2,
  'medical-report-interpretation': 0.3,
  'clinical-decision-support': 0.3,
  'symptom-analysis': 0.4,
  'drug-interaction-check': 0.1,
  'diagnosis-suggestion': 0.3,
  'treatment-plan-generation': 0.4,
  'patient-communication': 0.7,
  'data-visualization': 0.5,
} as const;

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_ENABLED === 'true';
}

/**
 * Check if a specific provider is configured
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!providerConfig.openai.apiKey;
    case 'anthropic':
      return !!providerConfig.anthropic.apiKey;
    case 'google':
      return !!providerConfig.google.apiKey;
    case 'azure-openai':
      return !!(providerConfig['azure-openai'].apiKey && providerConfig['azure-openai'].endpoint);
    default:
      return false;
  }
}

/**
 * Get available providers
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'azure-openai'];
  return providers.filter(isProviderConfigured);
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  requestsPerMinute: Number(process.env.AI_RATE_LIMIT_RPM) || 60,
  tokensPerMinute: Number(process.env.AI_RATE_LIMIT_TPM) || 150000,
  requestsPerDay: Number(process.env.AI_RATE_LIMIT_RPD) || 5000,
};

/**
 * Cost tracking configuration
 */
export const costConfig = {
  enabled: process.env.AI_COST_TRACKING_ENABLED === 'true',
  warningThreshold: Number(process.env.AI_COST_WARNING_THRESHOLD) || 100, // USD
  maxDailyBudget: Number(process.env.AI_MAX_DAILY_BUDGET) || 500, // USD
};
