# Gemini Pro Setup Guide

## Overview

ClinicEZ is now configured to use **Google Gemini Pro** as the default AI provider. Gemini Pro offers:

- ✅ **Fast responses** - Optimized for speed
- ✅ **Cost-effective** - Lower costs compared to other models
- ✅ **High quality** - Excellent performance for healthcare tasks
- ✅ **Free tier available** - Great for testing and small deployments
- ✅ **Scalable** - Handles high request volumes efficiently

## Important: Model Naming

For v1beta API compatibility, use the `-latest` suffix:
- ✅ **Correct**: `gemini-1.5-pro-latest` (default, recommended)
- ✅ **Also works**: `gemini-pro` (stable version)
- ❌ **Won't work**: `gemini-1.5-pro` (missing -latest suffix)

The `-latest` suffix ensures the model name is recognized by Google's v1beta API endpoint.

## Quick Setup

### 1. Get a Google AI API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

### 2. Configure Environment Variables

Add to your `.env.local` file:

```env
# Enable AI features
NEXT_PUBLIC_AI_ENABLED=true

# Use Google Gemini Pro (default)
NEXT_PUBLIC_AI_PROVIDER=google
NEXT_PUBLIC_AI_MODEL=gemini-1.5-pro-latest  # Note: Use -latest suffix for v1beta API

# Your Google AI API Key
GOOGLE_AI_API_KEY=your-actual-api-key-here

# Optional: Custom base URL (defaults to https://generativelanguage.googleapis.com/v1beta)
# GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

### 3. Restart Your Development Server

```bash
pnpm dev
```

## Configuration Details

### Default Settings

The system is now configured with these defaults:

- **Provider**: Google (`google`)
- **Model**: Gemini 1.5 Pro (`gemini-1.5-pro`)
- **Timeout**: 30 seconds
- **Retries**: 2 attempts

### Alternative Models

You can use other Gemini models by changing the `NEXT_PUBLIC_AI_MODEL` variable:

```env
# For higher quality/more complex tasks
NEXT_PUBLIC_AI_MODEL=gemini-1.5-pro

# For standard tasks (default)
NEXT_PUBLIC_AI_MODEL=gemini-1.5-pro
```

### Fallback Provider (Optional)

You can configure a fallback provider in case Gemini is unavailable:

```env
# Fallback to OpenAI if Gemini fails
NEXT_PUBLIC_AI_FALLBACK_PROVIDER=openai
NEXT_PUBLIC_AI_FALLBACK_MODEL=gpt-4o-mini
OPENAI_API_KEY=your-openai-key-here
```

## Features Available

All AI features work with Gemini Pro:

- ✅ Medical note summarization
- ✅ Symptom analysis with urgency detection
- ✅ Patient insights generation
- ✅ Data visualization recommendations
- ✅ Pre-assessment notes generation
- ✅ Pre-assessment notes enhancement
- ✅ Home care instructions generation

## Performance & Cost

### Gemini Pro Advantages

| Feature | Gemini Pro | GPT-4o-mini | Claude 3 Haiku |
|---------|-------------|-------------|----------------|
| Speed | ⚡⚡⚡ Very Fast | ⚡⚡ Fast | ⚡⚡ Fast |
| Cost | 💰 Very Low | 💰💰 Low | 💰💰 Low |
| Quality | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐ High |
| Free Tier | ✅ Yes | ❌ No | ❌ No |

### Pricing (as of 2024)

**Gemini Pro 1.5:**
- Input: $0.000075 per 1K tokens
- Output: $0.0003 per 1K tokens
- Free tier: 15 requests per minute

**For comparison:**
- GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- Claude 3 Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens

## Switching Providers

If you need to switch to a different provider:

### To OpenAI:
```env
NEXT_PUBLIC_AI_PROVIDER=openai
NEXT_PUBLIC_AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

### To Anthropic:
```env
NEXT_PUBLIC_AI_PROVIDER=anthropic
NEXT_PUBLIC_AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...
```

### To Azure OpenAI:
```env
NEXT_PUBLIC_AI_PROVIDER=azure-openai
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

## Troubleshooting

### API Key Issues

If you see authentication errors:

1. Verify your API key is correct
2. Check that the key hasn't expired
3. Ensure you're not hitting rate limits
4. Make sure `NEXT_PUBLIC_AI_ENABLED=true`

### Rate Limiting

Google AI has rate limits on the free tier:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

For higher limits, consider:
- Enabling billing on your Google Cloud project
- Using the fallback provider feature
- Implementing request queuing in your application

## Support

For more information:

- [AI Quick Start Guide](./AI_QUICK_START.md)
- [AI Integration Summary](./AI_INTEGRATION_SUMMARY.md)
- [Google AI Documentation](https://ai.google.dev/docs)

## Benefits of Gemini Pro

1. **Cost Savings**: Significantly lower costs for high-volume applications
2. **Speed**: Faster response times compared to larger models
3. **Free Tier**: Perfect for development and testing
4. **Quality**: Excellent performance for healthcare-specific tasks
5. **Reliability**: Backed by Google's infrastructure
6. **Easy Migration**: Switch providers anytime with a single environment variable

---

**Ready to use Gemini Pro!** Just add your API key and start using AI features.
