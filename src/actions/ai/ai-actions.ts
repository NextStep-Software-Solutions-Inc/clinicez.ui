'use server';

/**
 * AI Server Actions
 * 
 * Server-side actions for AI operations with proper authentication and rate limiting.
 * RESTRICTED TO HEALTHCARE PROVIDERS ONLY
 */

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from '@/lib/healthcare-provider-auth';
import {
  getOrchestrator,
  createMessage,
  createAIContext,
  getFeatureTemperature,
  sanitizeInput,
  validateHealthcareResponse,
  getTemplateByFeature,
  renderTemplate,
  AIFeatureType,
  AIOperationResult,
  AICompletionResponse,
} from '@/lib/ai';

/**
 * Generate AI completion
 */
export async function generateAICompletion(
  featureType: AIFeatureType,
  prompt: string,
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    context?: Record<string, unknown>;
  }
): Promise<AIOperationResult<string>> {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    // Verify user is a healthcare provider
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT,
    });

    if (!user || !user.HealthcareProvider) {
      return {
        success: false,
        error: 'AI features are restricted to registered healthcare providers only',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    // Sanitize input
    const sanitizedPrompt = sanitizeInput(prompt);

    // Get orchestrator
    const orchestrator = getOrchestrator();

    // Prepare request
    const temperature = options?.temperature ?? getFeatureTemperature(featureType);
    const messages = [createMessage('user', sanitizedPrompt)];

    // Make AI request
    const response = await orchestrator.complete({
      messages,
      systemPrompt: options?.systemPrompt,
      temperature,
      maxTokens: options?.maxTokens || 2000,
    });

    // Validate response for healthcare compliance
    const validation = validateHealthcareResponse(response.content);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Response validation failed: ${validation.warnings.join(', ')}`,
        provider: response.provider,
        model: response.model,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: response.content,
      usage: response.usage,
      provider: response.provider,
      model: response.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('AI completion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
      model: '',
      timestamp: new Date(),
    };
  }
}

/**
 * Summarize medical notes
 */
export async function summarizeMedicalNotes(
  consultationNotes: string,
  options?: {
    clinicId?: string;
    patientId?: string;
  }
): Promise<AIOperationResult<string>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const template = getTemplateByFeature('medical-note-summarization');
    if (!template) {
      return {
        success: false,
        error: 'Template not found',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const prompt = renderTemplate(template, { consultationNotes });

    return await generateAICompletion('medical-note-summarization', prompt, {
      systemPrompt: template.systemPrompt,
      context: {
        userId,
        ...options,
      },
    });
  } catch (error) {
    console.error('Medical note summarization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
      model: '',
      timestamp: new Date(),
    };
  }
}

/**
 * Analyze patient symptoms
 */
export async function analyzeSymptoms(
  symptomDescription: string,
  patientContext?: {
    age?: number;
    gender?: string;
    conditions?: string[];
    allergies?: string[];
  }
): Promise<AIOperationResult<{
  analysis: string;
  urgencyLevel: 'emergency' | 'urgent' | 'routine';
  recommendations: string[];
}>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const template = getTemplateByFeature('symptom-analysis');
    if (!template) {
      return {
        success: false,
        error: 'Template not found',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    let contextInfo = '';
    if (patientContext) {
      const parts: string[] = [];
      if (patientContext.age) parts.push(`Age: ${patientContext.age}`);
      if (patientContext.gender) parts.push(`Gender: ${patientContext.gender}`);
      if (patientContext.conditions?.length) parts.push(`Conditions: ${patientContext.conditions.join(', ')}`);
      if (patientContext.allergies?.length) parts.push(`Allergies: ${patientContext.allergies.join(', ')}`);
      contextInfo = parts.length > 0 ? `\n\nPatient Context:\n${parts.join('\n')}` : '';
    }

    const prompt = renderTemplate(template, { symptomDescription: symptomDescription + contextInfo });

    const result = await generateAICompletion('symptom-analysis', prompt, {
      systemPrompt: template.systemPrompt,
    });

    if (!result.success || !result.data) {
      return result as AIOperationResult<any>;
    }

    // Parse the response to extract structured data
    const analysis = result.data;
    let urgencyLevel: 'emergency' | 'urgent' | 'routine' = 'routine';
    
    if (analysis.toLowerCase().includes('emergency') || analysis.toLowerCase().includes('immediate')) {
      urgencyLevel = 'emergency';
    } else if (analysis.toLowerCase().includes('urgent')) {
      urgencyLevel = 'urgent';
    }

    const recommendations: string[] = [];
    const recommendationMatch = analysis.match(/recommended action[s]?:(.*?)(?:\n\n|\*\*|$)/is);
    if (recommendationMatch) {
      recommendations.push(recommendationMatch[1].trim());
    }

    return {
      success: true,
      data: {
        analysis,
        urgencyLevel,
        recommendations,
      },
      usage: result.usage,
      provider: result.provider,
      model: result.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Symptom analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
      model: '',
      timestamp: new Date(),
    };
  }
}

/**
 * Generate patient insights
 */
export async function generatePatientInsights(
  patientData: {
    appointments?: number;
    conditions?: string[];
    medications?: string[];
    recentVisits?: Array<{ date: string; reason: string }>;
    vitalsTrends?: Record<string, number[]>;
  },
  clinicId?: string
): Promise<AIOperationResult<string>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const template = getTemplateByFeature('patient-insights');
    if (!template) {
      return {
        success: false,
        error: 'Template not found',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const patientDataStr = JSON.stringify(patientData, null, 2);
    const prompt = renderTemplate(template, { patientData: patientDataStr });

    return await generateAICompletion('patient-insights', prompt, {
      systemPrompt: template.systemPrompt,
      context: {
        userId,
        clinicId,
      },
    });
  } catch (error) {
    console.error('Patient insights error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
      model: '',
      timestamp: new Date(),
    };
  }
}

/**
 * Recommend data visualization
 */
export async function recommendVisualization(
  dataDescription: string,
  dataType: 'appointments' | 'patient-stats' | 'clinic-metrics' | 'financial' | 'other'
): Promise<AIOperationResult<{
  visualizationType: string[];
  metrics: string[];
  suggestions: string;
}>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const template = getTemplateByFeature('data-visualization');
    if (!template) {
      return {
        success: false,
        error: 'Template not found',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const enrichedDescription = `Data Type: ${dataType}\n\n${dataDescription}`;
    const prompt = renderTemplate(template, { dataDescription: enrichedDescription });

    const result = await generateAICompletion('data-visualization', prompt, {
      systemPrompt: template.systemPrompt,
      temperature: 0.5,
    });

    if (!result.success || !result.data) {
      return result as AIOperationResult<any>;
    }

    // Extract structured recommendations
    const visualizationType: string[] = [];
    const metrics: string[] = [];
    
    // Simple parsing logic
    const typeMatches = result.data.match(/visualization type[s]?:(.*?)(?:\n\n|\d\.|$)/is);
    if (typeMatches) {
      const types = typeMatches[1].match(/(?:^|\n)\s*[-•*]?\s*([^\n]+)/g);
      if (types) {
        visualizationType.push(...types.map(t => t.trim().replace(/^[-•*]\s*/, '')));
      }
    }

    const metricsMatches = result.data.match(/key metrics:(.*?)(?:\n\n|\d\.|$)/is);
    if (metricsMatches) {
      const metricsList = metricsMatches[1].match(/(?:^|\n)\s*[-•*]?\s*([^\n]+)/g);
      if (metricsList) {
        metrics.push(...metricsList.map(m => m.trim().replace(/^[-•*]\s*/, '')));
      }
    }

    return {
      success: true,
      data: {
        visualizationType,
        metrics,
        suggestions: result.data,
      },
      usage: result.usage,
      provider: result.provider,
      model: result.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Visualization recommendation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
      model: '',
      timestamp: new Date(),
    };
  }
}
