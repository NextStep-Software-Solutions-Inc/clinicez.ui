'use server';

/**
 * AI Server Actions for Pre-Assessment Notes
 * 
 * Provides AI-powered features for generating and enhancing pre-assessment notes.
 * RESTRICTED TO HEALTHCARE PROVIDERS ONLY
 */

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from '@/lib/healthcare-provider-auth';
import {
  getOrchestrator,
  createMessage,
  getFeatureTemperature,
  sanitizeInput,
  AIOperationResult,
} from '@/lib/ai';
import { checkAIUsageLimit, logAIUsage } from '@/lib/ai/usage-tracking';

/**
 * Generate pre-assessment notes from symptoms, comprehensive patient context, and attached images
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
    recentVitals?: Array<{
      dateTaken: Date | string;
      temp?: number;
      pulseRate?: number;
      respRate?: number;
      spo2?: number;
      weight?: number;
      height?: number;
      bmi?: number;
      bpSystolic?: number;
      bpDiastolic?: number;
    }>;
    allergies?: Array<{
      allergen: string;
      reaction: string;
      notes?: string;
    }>;
    comorbidities?: string[];
    medicalHistory?: string;
  },
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
  }>,
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

    // Build comprehensive context string
    let contextStr = '';
    if (patientContext) {
      const parts: string[] = [];
      
      // Basic patient information
      if (patientContext.age) parts.push(`Age: ${patientContext.age} years old`);
      if (patientContext.gender) parts.push(`Gender: ${patientContext.gender}`);
      if (patientContext.chiefComplaint) parts.push(`Chief Complaint: ${patientContext.chiefComplaint}`);
      
      // Current vital signs
      if (patientContext.vitalSigns) {
        const vitals: string[] = [];
        if (patientContext.vitalSigns.bloodPressure) vitals.push(`BP ${patientContext.vitalSigns.bloodPressure}`);
        if (patientContext.vitalSigns.temperature) vitals.push(`Temp ${patientContext.vitalSigns.temperature}`);
        if (patientContext.vitalSigns.heartRate) vitals.push(`HR ${patientContext.vitalSigns.heartRate} bpm`);
        if (patientContext.vitalSigns.respiratoryRate) vitals.push(`RR ${patientContext.vitalSigns.respiratoryRate}/min`);
        if (vitals.length > 0) parts.push(`Current Vital Signs: ${vitals.join(', ')}`);
      }
      
      // Recent vitals history with dates
      if (patientContext.recentVitals && patientContext.recentVitals.length > 0) {
        parts.push('\nRecent Vital Signs History:');
        patientContext.recentVitals.forEach((vital, index) => {
          const date = new Date(vital.dateTaken);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const vitalParts: string[] = [];
          if (vital.bpSystolic && vital.bpDiastolic) vitalParts.push(`BP ${vital.bpSystolic}/${vital.bpDiastolic}`);
          if (vital.temp) vitalParts.push(`Temp ${vital.temp}°C`);
          if (vital.pulseRate) vitalParts.push(`HR ${vital.pulseRate}`);
          if (vital.respRate) vitalParts.push(`RR ${vital.respRate}`);
          if (vital.spo2) vitalParts.push(`SpO2 ${vital.spo2}%`);
          if (vital.weight) vitalParts.push(`Weight ${vital.weight}kg`);
          if (vital.bmi) vitalParts.push(`BMI ${vital.bmi.toFixed(1)}`);
          if (vitalParts.length > 0) {
            parts.push(`  ${dateStr}: ${vitalParts.join(', ')}`);
          }
        });
      }
      
      // Allergies
      if (patientContext.allergies && patientContext.allergies.length > 0) {
        parts.push('\nKnown Allergies:');
        patientContext.allergies.forEach(allergy => {
          const allergyStr = `  - ${allergy.allergen}: ${allergy.reaction}${allergy.notes ? ` (${allergy.notes})` : ''}`;
          parts.push(allergyStr);
        });
      } else {
        parts.push('\nKnown Allergies: No known drug allergies (NKDA)');
      }
      
      // Comorbidities
      if (patientContext.comorbidities && patientContext.comorbidities.length > 0) {
        parts.push('\nComorbidities/Chronic Conditions:');
        patientContext.comorbidities.forEach(condition => {
          parts.push(`  - ${condition}`);
        });
      }
      
      // Medical history
      if (patientContext.medicalHistory) {
        parts.push(`\nMedical History: ${patientContext.medicalHistory}`);
      }
      
      if (parts.length > 0) {
        contextStr = `\n\nPatient Information:\n${parts.join('\n')}`;
      }
    }

    // Filter image attachments and prepare for AI analysis
    const imageAttachments = attachments?.filter(att => {
      // Check MIME type first if available (more reliable than extension)
      if (att.type) {
        // Only allow image MIME types
        if (!att.type.startsWith('image/')) return false;
      }
      
      // Also check file extension as secondary validation
      if (!att.name || typeof att.name !== 'string') return false;
      const ext = att.name.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
    }) || [];
    
    // Add image context to prompt
    let imageContext = '';
    if (imageAttachments.length > 0) {
      imageContext = `\n\nATTACHED MEDICAL IMAGES: ${imageAttachments.length} image(s) provided below for your analysis.\nImage files: ${imageAttachments.map(a => a.name).join(', ')}\nPlease analyze these images and incorporate relevant findings into your assessment.`;
    }

    const systemPrompt = `You are an experienced healthcare provider with expertise in patient assessment and clinical documentation.
    
    // Build multimodal message content with text and images
    const messageContent: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
      { type: 'text', text: prompt }
    ];
    
    // Add image attachments to message for actual AI analysis
    if (imageAttachments.length > 0) {
      imageAttachments.forEach(att => {
        messageContent.push({
          type: 'image',
          image: att.url, // Pass image URL to AI for analysis
        });
      });
    }

    const orchestrator = getOrchestrator();
    const response = await orchestrator.complete({
      messages: [{ role: 'user', content: messageContent }],
      systemPrompt,
      temperature: getFeatureTemperature('medical-note-summarization'),
      maxTokens: 1500,
    }); 
Your role is to generate structured, professional pre-assessment notes based on comprehensive patient information and symptoms.

CRITICAL FORMATTING REQUIREMENTS:
1. Write each sentence on a NEW LINE for better readability
2. Use medical symbols and abbreviations to keep text concise: % (percent), ° (degree), mmHg, mg, L, mL, kg, bpm, etc.
3. Use standard medical abbreviations: HR (heart rate), BP (blood pressure), RR (respiratory rate), SpO2 (oxygen saturation), Temp (temperature), NKDA (no known drug allergies), HTN (hypertension), DM (diabetes), etc.
4. Provide response in PLAIN TEXT format only - NO markdown, bullet points, asterisks, or special formatting
5. Write in clear, professional medical language as an experienced clinician would
6. Use ABSOLUTE DATES AND DEFINITE TERMS - NEVER use relative terms like "yesterday", "today", "recently", "lately", "a few days ago", "last week"
   - ALWAYS use specific dates: "Jan 15, 2026" or "January 15, 2026"
   - For time references, include the actual date: "3 days prior (Jan 12, 2026)" not "3 days ago"
   - Use "On [specific date]" not "recently" or "last week"
   - Example: "Fever started on Jan 12, 2026" NOT "Fever started 3 days ago"
   - Example: "BP measured on Jan 10, 2026 was 120/80" NOT "Recent BP was 120/80"

CONTENT REQUIREMENTS:
1. Assessment: Clinical observations based on ALL available patient data including vitals, allergies, comorbidities, medical history, and attached images
2. Home Instructions: Must be SPECIFIC to the chief complaint and assessment findings - address the actual condition presented
3. Remarks: Must REFERENCE the assessment findings and provide relevant clinical guidance for the consulting physician
4. Consider all patient safety factors including allergies and comorbidities in your recommendations
5. If medical images are attached, analyze and describe relevant findings in the assessment

Generate notes in this exact format:
Assessment: [Each clinical observation on a new line using medical symbols, abbreviations, and ABSOLUTE DATES]

Home Instructions: [Each instruction on a new line, specific to the chief complaint and assessment]

Remarks: [Each note on a new line, referencing assessment findings with ABSOLUTE DATES and patient history]

Always include appropriate disclaimers that this is a preliminary assessment requiring physician review.`;

    const sanitizedSymptoms = sanitizeInput(symptoms);
    
    // Get current date for reference
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const prompt = `Generate pre-assessment notes for a patient presenting with the following:

CHIEF COMPLAINT: ${sanitizedSymptoms}${contextStr}${imageContext}

TODAY'S DATE: ${currentDate} (Use this as reference for all date mentions)

REQUIREMENTS:
1. Assessment: Analyze the patient's condition based on the chief complaint and ALL available medical data (vitals, allergies, history, attached images). Write each observation on a new line using medical symbols (%, °, mmHg, etc.) and abbreviations (HR, BP, RR, SpO2). ALWAYS use ABSOLUTE DATES - never say "yesterday", "recently", or "a few days ago". Use specific dates like "Jan 15, 2026" or "3 days prior on Jan 12, 2026".

2. Home Instructions: Provide specific care instructions that DIRECTLY ADDRESS the chief complaint (${sanitizedSymptoms}). Each instruction on a new line. Use symbols and abbreviations. Instructions must be relevant to the actual condition presented.

3. Remarks: Reference findings from your assessment with ABSOLUTE DATES and patient's medical history. Each remark on a new line. Use medical abbreviations. Include relevant clinical considerations for the physician. Always use specific dates, not relative terms.

4. If medical images are attached, describe relevant findings and integrate them into your assessment.

CRITICAL: 
- Each sentence must be on a NEW LINE
- Use medical symbols: %, °, mmHg, mg, L, kg, bpm
- Use abbreviations: HR, BP, RR, SpO2, Temp, NKDA, HTN, DM
- ALWAYS use ABSOLUTE DATES: "Jan 15, 2026" NOT "yesterday" or "recently"
- Example: "Fever started on Jan 12, 2026" NOT "Fever started 3 days ago"
- Example: "BP on Jan 10, 2026 was 120/80" NOT "Recent BP was 120/80"
- Home instructions must relate to the chief complaint: ${sanitizedSymptoms}
- Remarks must reference the assessment findings with specific dates
- NO markdown formatting, NO bullet points, NO asterisks
- Plain text only with newlines between sentences`;

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
