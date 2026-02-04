/**
 * AI React Hooks
 * 
 * Custom React hooks for AI operations.
 */

import { useState, useCallback } from 'react';
import { AIFeatureType, AIStreamChunk } from '@/lib/ai';

/**
 * Hook for AI completion with streaming support
 */
export function useAICompletion() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const complete = useCallback(async (
    prompt: string,
    options?: {
      featureType?: AIFeatureType;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      if (options?.stream) {
        setIsStreaming(true);
        const response = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            featureType: options.featureType,
            systemPrompt: options.systemPrompt,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            if (!trimmedLine.startsWith('data: ')) continue;

            try {
              const jsonStr = trimmedLine.slice(6);
              const data: AIStreamChunk = JSON.parse(jsonStr);

              if (data.delta) {
                fullResponse += data.delta;
                setResponse(fullResponse);
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }

        setIsStreaming(false);
      } else {
        // Non-streaming completion
        const { generateAICompletion } = await import('@/actions/ai/ai-actions');

        const result = await generateAICompletion(
          options?.featureType || 'patient-communication',
          prompt,
          {
            systemPrompt: options?.systemPrompt,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
          }
        );

        if (result.success && result.data) {
          setResponse(result.data);
        } else {
          throw new Error(result.error || 'AI completion failed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('AI completion error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResponse('');
    setIsStreaming(false);
  }, []);

  return {
    complete,
    reset,
    isLoading,
    isStreaming,
    error,
    response,
  };
}

/**
 * Hook for medical note summarization
 */
export function useMedicalNoteSummarization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');

  const summarize = useCallback(async (
    consultationNotes: string,
    options?: {
      clinicId?: number;
      patientId?: number;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setSummary('');

    try {
      const { summarizeMedicalNotes } = await import('@/actions/ai/ai-actions');
      const result = await summarizeMedicalNotes(consultationNotes, {
        clinicId: options?.clinicId,
        patientId: options?.patientId?.toString(),
      });

      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        throw new Error(result.error || 'Summarization failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Summarization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    summarize,
    isLoading,
    error,
    summary,
  };
}

/**
 * Hook for symptom analysis
 */
export function useSymptomAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    analysis: string;
    urgencyLevel: 'emergency' | 'urgent' | 'routine';
    recommendations: string[];
  } | null>(null);

  const analyze = useCallback(async (
    symptomDescription: string,
    patientContext?: {
      age?: number;
      gender?: string;
      conditions?: string[];
      allergies?: string[];
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const { analyzeSymptoms } = await import('@/actions/ai/ai-actions');
      const result = await analyzeSymptoms(symptomDescription, patientContext);

      if (result.success && result.data) {
        setAnalysis(result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Symptom analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analyze,
    isLoading,
    error,
    analysis,
  };
}

/**
 * Hook for patient insights
 */
export function usePatientInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string>('');

  const generate = useCallback(async (
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
  ) => {
    setIsLoading(true);
    setError(null);
    setInsights('');

    try {
      const { generatePatientInsights } = await import('@/actions/ai/ai-actions');
      const result = await generatePatientInsights(patientData, clinicId);

      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        throw new Error(result.error || 'Insights generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Patient insights error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    isLoading,
    error,
    insights,
  };
}

/**
 * Hook for data visualization recommendations
 */
export function useVisualizationRecommendation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{
    visualizationType: string[];
    metrics: string[];
    suggestions: string;
  } | null>(null);

  const recommend = useCallback(async (
    dataDescription: string,
    dataType: 'appointments' | 'patient-stats' | 'clinic-metrics' | 'financial' | 'other'
  ) => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const { recommendVisualization } = await import('@/actions/ai/ai-actions');
      const result = await recommendVisualization(dataDescription, dataType);

      if (result.success && result.data) {
        setRecommendation(result.data);
      } else {
        throw new Error(result.error || 'Recommendation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Visualization recommendation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommend,
    isLoading,
    error,
    recommendation,
  };
}
