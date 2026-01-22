# AI Features Quick Start Guide

## Overview
ClinicEZ now includes a powerful AI orchestrator built on **Vercel AI SDK** that supports multiple LLM providers for healthcare-specific features.

## Why Vercel AI SDK?

We use the open-source **Vercel AI SDK** for LLM orchestration because:
- ✅ **Open source** and well-maintained by Vercel
- ✅ **Provider-agnostic**: Easy switching between OpenAI, Anthropic, Google, etc.
- ✅ **Built for Next.js**: Optimized for React Server Components and streaming
- ✅ **TypeScript-first**: Full type safety
- ✅ **Streaming support**: Native support for real-time AI responses
- ✅ **Framework-agnostic**: Can be used in any JavaScript/TypeScript project

## Setup

### 1. Dependencies

The following packages are included:
```json
{
  "ai": "^6.0.44",              // Vercel AI SDK core
  "@ai-sdk/openai": "^3.0.14",  // OpenAI provider
  "@ai-sdk/anthropic": "^3.0.18", // Anthropic provider
  "@ai-sdk/google": "^3.0.10"    // Google AI provider
}
```

### 2. Configure Environment Variables

Copy the AI environment example:
```bash
cp .env.ai.example .env.local
```

Add your API keys to `.env.local`:
```env
# Minimum configuration - choose ONE provider
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AI_PROVIDER=openai
NEXT_PUBLIC_AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-your-key-here
```

### 3. Supported Providers

#### OpenAI (Recommended for most use cases)
- **Models**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Best for**: General purpose, fast responses, cost-effective
- **Get API Key**: https://platform.openai.com/api-keys

```env
NEXT_PUBLIC_AI_PROVIDER=openai
NEXT_PUBLIC_AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

#### Anthropic Claude (Best for complex medical reasoning)
- **Models**: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307
- **Best for**: Complex clinical scenarios, detailed analysis
- **Get API Key**: https://console.anthropic.com/

```env
NEXT_PUBLIC_AI_PROVIDER=anthropic
NEXT_PUBLIC_AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...
```

#### Google Gemini (Best for cost-efficiency)
- **Models**: gemini-1.5-pro, gemini-1.5-flash, gemini-pro
- **Best for**: High volume, cost-sensitive applications
- **Get API Key**: https://makersuite.google.com/app/apikey

```env
NEXT_PUBLIC_AI_PROVIDER=google
NEXT_PUBLIC_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_API_KEY=...
```

#### Azure OpenAI (Best for enterprise/compliance)
- **Models**: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- **Best for**: Enterprise deployments, data residency requirements
- **Setup**: Azure Portal

```env
NEXT_PUBLIC_AI_PROVIDER=azure-openai
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

### 4. Test Your Configuration

Start the development server:
```bash
pnpm dev
```

The AI features will be available if properly configured.

## Usage

### Using Server Actions

```typescript
import { generateAICompletion, summarizeMedicalNotes } from '@/actions/ai/ai-actions';

// General AI completion
const result = await generateAICompletion(
  'medical-note-summarization',
  'Patient presents with fever and cough...'
);

// Medical note summarization
const summary = await summarizeMedicalNotes(
  'Detailed consultation notes here...',
  { clinicId: 'clinic-123', patientId: 'patient-456' }
);
```

### Using React Hooks

```typescript
'use client';

import { useAICompletion, useMedicalNoteSummarization } from '@/hooks/ai/use-ai';

function MyComponent() {
  const { complete, isLoading, response } = useAICompletion();
  
  const handleClick = async () => {
    await complete('Summarize these notes...', {
      featureType: 'medical-note-summarization',
      stream: true, // Enable streaming
    });
  };

  return (
    <div>
      <button onClick={handleClick} disabled={isLoading}>
        Generate Summary
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

### Available Hooks

```typescript
// General AI completion
import { useAICompletion } from '@/hooks/ai/use-ai';

// Medical note summarization
import { useMedicalNoteSummarization } from '@/hooks/ai/use-ai';

// Symptom analysis
import { useSymptomAnalysis } from '@/hooks/ai/use-ai';

// Patient insights
import { usePatientInsights } from '@/hooks/ai/use-ai';

// Visualization recommendations
import { useVisualizationRecommendation } from '@/hooks/ai/use-ai';
```

## Available Features

### 1. Medical Note Summarization
Automatically summarize consultation notes into structured SOAP format.

```typescript
const { summarize, isLoading, summary } = useMedicalNoteSummarization();
await summarize(consultationNotes, { clinicId, patientId });
```

### 2. Symptom Analysis
Analyze patient symptoms and provide urgency assessment.

```typescript
const { analyze, analysis } = useSymptomAnalysis();
await analyze('Fever, cough, shortness of breath', {
  age: 45,
  gender: 'Male',
  conditions: ['Diabetes'],
});
// Returns: { analysis, urgencyLevel: 'urgent', recommendations: [...] }
```

### 3. Patient Insights
Generate insights from patient data and trends.

```typescript
const { generate, insights } = usePatientInsights();
await generate({
  appointments: 12,
  conditions: ['Hypertension', 'Diabetes'],
  medications: ['Metformin', 'Lisinopril'],
  recentVisits: [...],
});
```

### 4. Data Visualization Recommendations
Get AI recommendations for visualizing healthcare data.

```typescript
const { recommend, recommendation } = useVisualizationRecommendation();
await recommend('Monthly appointment statistics by type', 'appointments');
// Returns: { visualizationType: ['line-chart', 'bar-chart'], metrics: [...], suggestions: '...' }
```

## AI Feature Types

All AI operations support the following feature types:

- `medical-note-summarization`
- `appointment-scheduling-assistant`
- `patient-insights`
- `prescription-generation`
- `medical-report-interpretation`
- `clinical-decision-support`
- `symptom-analysis`
- `drug-interaction-check`
- `diagnosis-suggestion`
- `treatment-plan-generation`
- `patient-communication`
- `data-visualization`

## Cost Optimization

### Choose the Right Model

**For most tasks (notes, summaries):**
- OpenAI: `gpt-4o-mini` ($0.15 per 1M input tokens)
- Anthropic: `claude-3-haiku-20240307` ($0.25 per 1M input tokens)
- Google: `gemini-1.5-flash` ($0.075 per 1M input tokens)

**For complex medical reasoning:**
- OpenAI: `gpt-4o` ($5 per 1M input tokens)
- Anthropic: `claude-3-5-sonnet-20241022` ($3 per 1M input tokens)
- Google: `gemini-1.5-pro` ($1.25 per 1M input tokens)

### Set Budget Limits

```env
AI_COST_WARNING_THRESHOLD=100  # Alert at $100
AI_MAX_DAILY_BUDGET=500        # Hard limit at $500/day
```

### Enable Fallback

```env
NEXT_PUBLIC_AI_FALLBACK_PROVIDER=google
NEXT_PUBLIC_AI_FALLBACK_MODEL=gemini-1.5-flash
```

## Rate Limiting

Configure rate limits to prevent abuse:

```env
AI_RATE_LIMIT_RPM=60      # 60 requests per minute
AI_RATE_LIMIT_TPM=150000  # 150K tokens per minute
AI_RATE_LIMIT_RPD=5000    # 5000 requests per day
```

## Security Best Practices

### 1. Never Log Sensitive Data
```typescript
// ❌ Don't
console.log('Patient data:', patientData);

// ✅ Do
console.log('Processing patient data for AI analysis');
```

### 2. Validate All Responses
```typescript
import { validateHealthcareResponse } from '@/lib/ai';

const validation = validateHealthcareResponse(aiResponse);
if (!validation.isValid) {
  // Handle invalid response
}
```

### 3. Use Authentication
All AI actions automatically require Clerk authentication.

### 4. Sanitize Inputs
```typescript
import { sanitizeInput } from '@/lib/ai';

const cleanInput = sanitizeInput(userInput);
```

## Troubleshooting

### AI features not working
1. Check `NEXT_PUBLIC_AI_ENABLED=true`
2. Verify API key is set correctly
3. Check provider configuration matches available API key
4. Review browser console and server logs

### Slow responses
1. Try a faster model (e.g., `gpt-4o-mini` instead of `gpt-4`)
2. Enable streaming for better UX
3. Reduce `maxTokens` parameter
4. Check network latency

### High costs
1. Switch to smaller models
2. Implement caching for repeated queries
3. Set stricter rate limits
4. Use fallback providers for non-critical tasks

### Rate limit errors
1. Increase `AI_TIMEOUT` if requests are timing out
2. Reduce `AI_RATE_LIMIT_RPM` if hitting provider limits
3. Implement user-level rate limiting
4. Consider upgrading provider tier

### Advanced Usage

### Using Vercel AI SDK Directly

For advanced use cases, you can use Vercel AI SDK directly:

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Create a provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate text
const result = await generateText({
  model: openai('gpt-4o-mini'),
  messages: [
    { role: 'system', content: 'You are a medical assistant.' },
    { role: 'user', content: 'Summarize these notes...' }
  ],
  temperature: 0.3,
});

// Stream text
const stream = streamText({
  model: openai('gpt-4o-mini'),
  messages: [{ role: 'user', content: 'Hello' }],
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Custom Provider Configuration

```typescript
import { AIOrchestrator } from '@/lib/ai';

const orchestrator = new AIOrchestrator({
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  fallbackProvider: 'anthropic',
  fallbackModel: 'claude-3-haiku-20240307',
  timeout: 30000,
  retries: 2,
});

const response = await orchestrator.complete({
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
  maxTokens: 1000,
});
```

### Streaming Responses

```typescript
const { complete, response, isStreaming } = useAICompletion();

await complete(prompt, {
  stream: true, // Enable streaming
  featureType: 'patient-communication',
});

// Response updates in real-time as tokens arrive
```

### Custom Prompt Templates

```typescript
import { renderTemplate, getTemplateByFeature } from '@/lib/ai';

const template = getTemplateByFeature('medical-note-summarization');
const prompt = renderTemplate(template, {
  consultationNotes: 'Patient presents...',
});
```

## More Information

- **Vercel AI SDK Documentation**: https://sdk.vercel.ai/docs
- **Full Documentation**: See `/docs/AI_FEATURES_RECOMMENDATIONS.md`
- **API Reference**: See TypeScript types in `/src/lib/ai/types.ts`
- **GitHub**: https://github.com/vercel/ai

## Support

For issues or questions:
1. Check this guide and the full documentation
2. Review the code examples in `/src/lib/ai/`
3. Open an issue on GitHub
4. Contact: clinicez.official@gmail.com
