'use server';

/**
 * AI Server Actions
 * 
 * Server-side actions for AI operations with proper authentication and rate limiting.
 */

import { auth } from '@clerk/nextjs/server';
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
    clinicId?: number;
    patientId?: string;
    sectionNames?: string[];
    outputFormat?: 'markdown' | 'plain_text';
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

    const defaultSections = ['Subjective', 'Objective', 'Assessment', 'Plan'];
    const sections = options?.sectionNames?.length ? options.sectionNames : defaultSections;
    const sectionNames = sections.map((s) => `- ${s}`).join('\n');

    const outputFormat = options?.outputFormat ?? 'markdown';
    const outputFormatInstruction =
      outputFormat === 'markdown'
        ? 'use ## markdown heading for each section'
        : 'use the section name followed by a colon as a plain-text heading (e.g., "Subjective:"), no markdown symbols';

    const prompt = renderTemplate(template, { consultationNotes, sectionNames, outputFormatInstruction });

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
    disabilities?: string[];
    familyHistory?: string[];
    surgicalHistory?: string[];
    personalHistory?: string;
    obGyneHistory?: string;
    attachments?: string[];
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
      if (patientContext.conditions?.length) parts.push(`Current Conditions: ${patientContext.conditions.join(', ')}`);
      if (patientContext.allergies?.length) parts.push(`Allergies: ${patientContext.allergies.join(', ')}`);
      if (patientContext.disabilities?.length) parts.push(`Disabilities: ${patientContext.disabilities.join(', ')}`);
      if (patientContext.familyHistory?.length) parts.push(`Family History: ${patientContext.familyHistory.join(', ')}`);
      if (patientContext.surgicalHistory?.length) parts.push(`Surgical History: ${patientContext.surgicalHistory.join(', ')}`);
      if (patientContext.personalHistory) parts.push(`Personal/Social History: ${patientContext.personalHistory}`);
      if (patientContext.obGyneHistory) parts.push(`OB/Gyne History: ${patientContext.obGyneHistory}`);
      if (patientContext.attachments?.length) parts.push(`Attachments/Documents: ${patientContext.attachments.join(', ')}`);
      contextInfo = parts.length > 0 ? `\n\nPatient Context:\n${parts.join('\n')}` : '';
    }

    const prompt = renderTemplate(template, { symptomDescription: symptomDescription + contextInfo });

    const result = await generateAICompletion('symptom-analysis', prompt, {
      systemPrompt: `You are a clinical decision support system for doctors and nurses. Provide practical clinical guidance based on the patient's symptom presentation and complete medical profile.

Analyze and respond with:
1. Clinical Assessment: Relevant findings considering patient age, gender, medical history, allergies, and current conditions
2. Differential Diagnoses: Most likely conditions to consider, ordered by clinical probability given the presentation
3. Urgency Triage: Emergency (immediate intervention needed) | Urgent (same-day evaluation) | Routine (scheduled evaluation acceptable)
4. Clinical Actions: Specific investigations, vital signs monitoring, treatments, or specialist referrals to consider

Use clinical terminology and evidence-based reasoning. Response must be actionable for immediate clinical decision-making. No introductory or closing phrases.`,
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
    const recommendationMatch = analysis.match(/recommended action[s]?:(.*?)(?:\n\n|\*\*|$)/i);
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
    vitalsTrends?: {
      bloodPressure?: string[];
      heartRate?: number[];
      temperature?: number[];
      weight?: number[];
      respiratoryRate?: number[];
    };
  },
  clinicId?: number
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
    const typeMatches = result.data.match(/visualization type[s]?:(.*?)(?:\n\n|\d\.|$)/i);
    if (typeMatches) {
      const types = typeMatches[1].match(/(?:^|\n)\s*[-•*]?\s*([^\n]+)/g);
      if (types) {
        visualizationType.push(...types.map(t => t.trim().replace(/^[-•*]\s*/, '')));
      }
    }

    const metricsMatches = result.data.match(/key metrics:(.*?)(?:\n\n|\d\.|$)/i);
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
