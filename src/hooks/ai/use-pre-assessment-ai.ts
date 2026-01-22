/**
 * React Hooks for Pre-Assessment AI Features
 * 
 * Custom hooks for AI-powered pre-assessment note generation and enhancement.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for generating pre-assessment notes
 */
export function usePreAssessmentAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedNotes, setGeneratedNotes] = useState<{
    assessment: string;
    homeInstructions: string;
    remarks: string;
  } | null>(null);

  const generate = useCallback(async (
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
  ) => {
    setIsLoading(true);
    setError(null);
    setGeneratedNotes(null);

    try {
      const { generatePreAssessmentNotes } = await import('@/actions/ai/pre-assessment-ai-actions');
      const result = await generatePreAssessmentNotes(symptoms, patientContext, clinicId, tenantId);

      if (result.success && result.data) {
        setGeneratedNotes(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate notes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Pre-assessment generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setGeneratedNotes(null);
  }, []);

  return {
    generate,
    reset,
    isLoading,
    error,
    generatedNotes,
  };
}

/**
 * Hook for enhancing pre-assessment notes
 */
export function usePreAssessmentEnhancement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancement, setEnhancement] = useState<{
    enhancedAssessment: string;
    suggestions: string[];
  } | null>(null);

  const enhance = useCallback(async (
    currentAssessment: string,
    currentRemarks?: string,
    clinicId?: number,
    tenantId?: number
  ) => {
    setIsLoading(true);
    setError(null);
    setEnhancement(null);

    try {
      const { enhancePreAssessmentNotes } = await import('@/actions/ai/pre-assessment-ai-actions');
      const result = await enhancePreAssessmentNotes(currentAssessment, currentRemarks, clinicId, tenantId);

      if (result.success && result.data) {
        setEnhancement(result.data);
      } else {
        throw new Error(result.error || 'Failed to enhance notes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Pre-assessment enhancement error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setEnhancement(null);
  }, []);

  return {
    enhance,
    reset,
    isLoading,
    error,
    enhancement,
  };
}

/**
 * Hook for generating home instructions
 */
export function useHomeInstructionsGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');

  const generate = useCallback(async (
    assessment: string,
    diagnosis?: string,
    clinicId?: number,
    tenantId?: number
  ) => {
    setIsLoading(true);
    setError(null);
    setInstructions('');

    try {
      const { generateHomeInstructions } = await import('@/actions/ai/pre-assessment-ai-actions');
      const result = await generateHomeInstructions(assessment, diagnosis, clinicId, tenantId);

      if (result.success && result.data) {
        setInstructions(result.data);
      } else {
        throw new Error(result.error || 'Failed to generate instructions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Home instructions generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setInstructions('');
  }, []);

  return {
    generate,
    reset,
    isLoading,
    error,
    instructions,
  };
}
