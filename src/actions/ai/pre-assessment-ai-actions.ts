'use server';

/**
 * AI Server Actions for Pre-Assessment Notes
 * 
 * Provides AI-powered features for generating and enhancing pre-assessment notes.
 */

import { auth } from '@clerk/nextjs/server';
import {
  getOrchestrator,
  createMessage,
  getFeatureTemperature,
  sanitizeInput,
  AIOperationResult,
} from '@/lib/ai';
import { checkAIUsageLimit, logAIUsage } from '@/lib/ai/usage-tracking';

/**
 * Generate pre-assessment notes from symptoms and patient context
 */
export async function generatePreAssessmentNotes(
  symptoms: string,
  patientContext?: {
    age?: number;
    gender?: string;
    chiefComplaint?: string;
    vitalSigns?: {
      bloodPressure?: string;
      temperature?: string;
      heartRate?: string;
      respiratoryRate?: string;
    };
  },
  clinicId?: number,
  tenantId?: number
): Promise<AIOperationResult<{
  assessment: string;
  homeInstructions: string;
  remarks: string;
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

    // Check usage limits
    const limitCheck = await checkAIUsageLimit({
      userId,
      clinicId,
      tenantId,
      featureType: 'medical-note-summarization',
    });

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.reason || 'AI usage limit exceeded',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    // Build context string
    let contextStr = '';
    if (patientContext) {
      const parts: string[] = [];
      if (patientContext.age) parts.push(`Age: ${patientContext.age}`);
      if (patientContext.gender) parts.push(`Gender: ${patientContext.gender}`);
      if (patientContext.chiefComplaint) parts.push(`Chief Complaint: ${patientContext.chiefComplaint}`);
      
      if (patientContext.vitalSigns) {
        const vitals: string[] = [];
        if (patientContext.vitalSigns.bloodPressure) vitals.push(`BP: ${patientContext.vitalSigns.bloodPressure}`);
        if (patientContext.vitalSigns.temperature) vitals.push(`Temp: ${patientContext.vitalSigns.temperature}`);
        if (patientContext.vitalSigns.heartRate) vitals.push(`HR: ${patientContext.vitalSigns.heartRate}`);
        if (patientContext.vitalSigns.respiratoryRate) vitals.push(`RR: ${patientContext.vitalSigns.respiratoryRate}`);
        if (vitals.length > 0) parts.push(`Vital Signs: ${vitals.join(', ')}`);
      }
      
      if (parts.length > 0) {
        contextStr = `\n\nPatient Context:\n${parts.join('\n')}`;
      }
    }

    const systemPrompt = `You are a healthcare assistant helping nurses create pre-assessment notes before a doctor's consultation. 
Your role is to generate structured, professional pre-assessment notes based on patient information and symptoms.

Generate notes in this format:
1. Assessment: Detailed clinical observations and initial assessment
2. Home Instructions: Clear, patient-friendly instructions for care at home
3. Remarks: Important notes for the doctor's attention

Be thorough but concise. Use medical terminology appropriately but ensure clarity.
Always include appropriate disclaimers that this is a preliminary assessment.`;

    const sanitizedSymptoms = sanitizeInput(symptoms);
    const prompt = `Generate pre-assessment notes for a patient with the following information:

Symptoms/Observations: ${sanitizedSymptoms}${contextStr}

Please provide:
1. Assessment (detailed clinical observations)
2. Home Instructions (clear instructions for the patient)
3. Remarks (important notes for the consulting physician)

Format your response clearly with these three sections.`;

    const orchestrator = getOrchestrator();
    const response = await orchestrator.complete({
      messages: [createMessage('user', prompt)],
      systemPrompt,
      temperature: getFeatureTemperature('medical-note-summarization'),
      maxTokens: 1500,
    });

    // Log usage
    await logAIUsage(
      {
        userId,
        clinicId,
        tenantId,
        featureType: 'medical-note-summarization',
      },
      {
        provider: response.provider,
        model: response.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        success: true,
      }
    );

    // Parse the response into sections
    const content = response.content;
    
    // Extract sections using regex patterns
    const assessmentMatch = content.match(/(?:Assessment|1\.\s*Assessment)[:\s]*\n([\s\S]*?)(?=(?:Home Instructions|2\.|Remarks|$))/i);
    const homeInstructionsMatch = content.match(/(?:Home Instructions|2\.\s*Home Instructions)[:\s]*\n([\s\S]*?)(?=(?:Remarks|3\.|$))/i);
    const remarksMatch = content.match(/(?:Remarks|3\.\s*Remarks)[:\s]*\n([\s\S]*?)$/i);

    const assessment = assessmentMatch ? assessmentMatch[1].trim() : content.split('\n\n')[0];
    const homeInstructions = homeInstructionsMatch ? homeInstructionsMatch[1].trim() : '';
    const remarks = remarksMatch ? remarksMatch[1].trim() : '';

    return {
      success: true,
      data: {
        assessment: assessment || content,
        homeInstructions: homeInstructions || 'Rest and monitor symptoms. Seek immediate medical attention if symptoms worsen.',
        remarks: remarks || 'Please review the assessment and vital signs before consultation.',
      },
      usage: response.usage,
      provider: response.provider,
      model: response.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Pre-assessment note generation error:', error);
    
    // Log failed attempt
    try {
      await logAIUsage(
        {
          userId: (await auth()).userId || 'unknown',
          clinicId,
          tenantId,
          featureType: 'medical-note-summarization',
        },
        {
          provider: 'openai',
          model: 'unknown',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
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
 * Enhance existing pre-assessment notes with AI suggestions
 */
export async function enhancePreAssessmentNotes(
  currentAssessment: string,
  currentRemarks?: string,
  clinicId?: number,
  tenantId?: number
): Promise<AIOperationResult<{
  enhancedAssessment: string;
  suggestions: string[];
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

    // Check usage limits
    const limitCheck = await checkAIUsageLimit({
      userId,
      clinicId,
      tenantId,
      featureType: 'medical-note-summarization',
    });

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.reason || 'AI usage limit exceeded',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const systemPrompt = `You are a clinical documentation expert helping improve pre-assessment notes.
Review the provided notes and suggest enhancements for clarity, completeness, and clinical relevance.
Maintain medical professionalism and accuracy.`;

    const prompt = `Review and enhance the following pre-assessment notes:

Assessment:
${sanitizeInput(currentAssessment)}

${currentRemarks ? `Remarks:\n${sanitizeInput(currentRemarks)}` : ''}

Please provide:
1. An enhanced version of the assessment (more detailed and professional)
2. A list of suggestions for what else should be documented

Focus on clinical completeness and documentation best practices.`;

    const orchestrator = getOrchestrator();
    const response = await orchestrator.complete({
      messages: [createMessage('user', prompt)],
      systemPrompt,
      temperature: 0.4,
      maxTokens: 1200,
    });

    // Log usage
    await logAIUsage(
      {
        userId,
        clinicId,
        tenantId,
        featureType: 'medical-note-summarization',
      },
      {
        provider: response.provider,
        model: response.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        success: true,
      }
    );

    // Parse enhanced assessment and suggestions
    const content = response.content;
    const sections = content.split(/(?:\n\n|\n)(?=\d\.|\*|-)/).filter(s => s.trim());
    
    const enhancedAssessment = sections[0] || currentAssessment;
    const suggestions: string[] = [];
    
    // Extract bullet points or numbered items as suggestions
    const suggestionMatches = content.match(/(?:^|\n)[-•*]\s*(.+?)(?=\n[-•*]|\n\n|$)/g);
    if (suggestionMatches) {
      suggestions.push(...suggestionMatches.map(s => s.replace(/^[-•*]\s*/, '').trim()));
    }

    return {
      success: true,
      data: {
        enhancedAssessment: enhancedAssessment.replace(/^(?:1\.|Enhanced Assessment:?)\s*/i, '').trim(),
        suggestions,
      },
      usage: response.usage,
      provider: response.provider,
      model: response.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Pre-assessment note enhancement error:', error);
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
 * Generate home instructions based on assessment
 */
export async function generateHomeInstructions(
  assessment: string,
  diagnosis?: string,
  clinicId?: number,
  tenantId?: number
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

    // Check usage limits
    const limitCheck = await checkAIUsageLimit({
      userId,
      clinicId,
      tenantId,
      featureType: 'patient-communication',
    });

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.reason || 'AI usage limit exceeded',
        provider: 'openai',
        model: '',
        timestamp: new Date(),
      };
    }

    const systemPrompt = `You are a healthcare professional creating clear, patient-friendly home care instructions.
Instructions should be practical, easy to follow, and appropriate for the patient's condition.
Include when to seek immediate medical attention.`;

    const prompt = `Based on the following assessment${diagnosis ? ' and diagnosis' : ''}, create clear home care instructions for the patient:

Assessment:
${sanitizeInput(assessment)}

${diagnosis ? `Diagnosis: ${sanitizeInput(diagnosis)}` : ''}

Provide clear, numbered home care instructions that are:
1. Easy for patients to understand and follow
2. Specific to their condition
3. Include warning signs that require immediate medical attention`;

    const orchestrator = getOrchestrator();
    const response = await orchestrator.complete({
      messages: [createMessage('user', prompt)],
      systemPrompt,
      temperature: 0.5,
      maxTokens: 800,
    });

    // Log usage
    await logAIUsage(
      {
        userId,
        clinicId,
        tenantId,
        featureType: 'patient-communication',
      },
      {
        provider: response.provider,
        model: response.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        success: true,
      }
    );

    return {
      success: true,
      data: response.content,
      usage: response.usage,
      provider: response.provider,
      model: response.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Home instructions generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
      model: '',
      timestamp: new Date(),
    };
  }
}
