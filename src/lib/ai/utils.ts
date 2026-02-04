/**
 * AI Utility Functions
 * 
 * Helper functions for AI operations throughout the application.
 */

import { AIMessage, AIContext, AIFeatureType } from './types';
import { featureTemperatures } from './config';

/**
 * Create a formatted AI message
 */
export function createMessage(role: 'system' | 'user' | 'assistant', content: string): AIMessage {
  return {
    role,
    content,
  };
}

/**
 * Create a conversation from a list of messages
 */
export function createConversation(messages: Array<{ role: 'user' | 'assistant'; content: string }>): AIMessage[] {
  return messages.map(msg => createMessage(msg.role, msg.content));
}

/**
 * Get appropriate temperature for a feature type
 */
export function getFeatureTemperature(featureType: AIFeatureType): number {
  return featureTemperatures[featureType] || 0.7;
}

/**
 * Sanitize user input to prevent prompt injection
 */
export function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns
  return input
    .replace(/```[\s\S]*?```/g, '[code block]') // Remove code blocks
    .replace(/<\|.*?\|>/g, '') // Remove special tokens
    .replace(/#{2,}/g, '##') // Limit heading levels
    .trim();
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Count tokens (approximate)
 * This is a rough estimation. For accurate counting, use tiktoken library
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Format medical context for AI
 */
export function formatMedicalContext(data: {
  patientInfo?: {
    age?: number;
    gender?: string;
    conditions?: string[];
    allergies?: string[];
  };
  symptoms?: string[];
  medications?: string[];
  vitalSigns?: Record<string, number | string>;
}): string {
  const parts: string[] = [];

  if (data.patientInfo) {
    const { age, gender, conditions, allergies } = data.patientInfo;
    if (age || gender) {
      parts.push(`Patient: ${age ? age + ' years old' : ''} ${gender || ''}`);
    }
    if (conditions && conditions.length > 0) {
      parts.push(`Existing conditions: ${conditions.join(', ')}`);
    }
    if (allergies && allergies.length > 0) {
      parts.push(`Allergies: ${allergies.join(', ')}`);
    }
  }

  if (data.symptoms && data.symptoms.length > 0) {
    parts.push(`Symptoms: ${data.symptoms.join(', ')}`);
  }

  if (data.medications && data.medications.length > 0) {
    parts.push(`Current medications: ${data.medications.join(', ')}`);
  }

  if (data.vitalSigns && Object.keys(data.vitalSigns).length > 0) {
    const vitals = Object.entries(data.vitalSigns)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    parts.push(`Vital signs: ${vitals}`);
  }

  return parts.join('\n');
}

/**
 * Extract structured data from AI response
 */
export function extractStructuredData<T>(response: string, format: 'json' | 'markdown' = 'json'): T | null {
  try {
    if (format === 'json') {
      // Try to find JSON in the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]) as T;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to extract structured data:', error);
    return null;
  }
}

/**
 * Format conversation history for context
 */
export function formatConversationHistory(messages: AIMessage[], maxMessages: number = 10): string {
  const recentMessages = messages.slice(-maxMessages);
  return recentMessages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
}

/**
 * Create a context object for AI operations
 */
export function createAIContext(
  featureType: AIFeatureType,
  options?: {
    userId?: string;
    clinicId?: string;
    organizationId?: string;
    patientId?: string;
    metadata?: Record<string, unknown>;
  }
): AIContext {
  return {
    featureType,
    ...options,
  };
}

/**
 * Validate AI response for healthcare compliance
 */
export function validateHealthcareResponse(response: string): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for disclaimer
  if (!response.toLowerCase().includes('not a substitute') && 
      !response.toLowerCase().includes('consult') &&
      !response.toLowerCase().includes('healthcare provider')) {
    warnings.push('Response should include a medical disclaimer');
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /do not consult/i,
    /skip the doctor/i,
    /instead of seeing a doctor/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(response)) {
      warnings.push('Response contains potentially dangerous medical advice');
      return { isValid: false, warnings };
    }
  }

  return {
    isValid: true,
    warnings,
  };
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Calculate cost estimate for AI operation
 * Costs in USD per 1K tokens (approximate as of 2024)
 */
export function estimateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'gemini-pro': { input: 0.00025, output: 0.0005 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  };

  const modelCost = costs[model] || { input: 0, output: 0 };
  return (promptTokens / 1000) * modelCost.input + (completionTokens / 1000) * modelCost.output;
}
