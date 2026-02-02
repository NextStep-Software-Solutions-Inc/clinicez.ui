# Gemini 2.5 Flash Setup Guide

## Overview

ClinicEZ is configured to use **Google Gemini 2.5 Flash** via the **stable v1 API**. Gemini 2.5 Flash offers:

- ✅ **Production-Ready** - Stable v1 API, no breaking changes
- ✅ **Blazing Fast** - Optimized for speed and low latency  
- ✅ **Cost-Effective** - Excellent price-performance ratio
- ✅ **High Quality** - Latest generation with thinking capabilities
- ✅ **Large Context** - Up to 1 million input tokens
- ✅ **Multimodal** - Supports text, code, images, audio, video

## Stable v1 API (Recommended)

We use **stable v1 API** for production:
- ✅ Model: `gemini-2.5-flash`
- ✅ API: `https://generativelanguage.googleapis.com/v1` (default)
- ✅ No Breaking Changes
- ✅ Production-Ready

## Quick Setup

### 1. Get API Key
Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create an API key.

### 2. Configure `.env.local`

```env
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AI_PROVIDER=google
NEXT_PUBLIC_AI_MODEL=gemini-2.5-flash
GOOGLE_AI_API_KEY=your-key-here
```

### 3. Restart Server
```bash
pnpm dev
```

## Model Details

- **Released**: June 17, 2025
- **Retirement**: June 17, 2026
- **Context**: 1M tokens
- **Features**: Thinking capabilities, multimodal

## Support

- [AI Quick Start Guide](./AI_QUICK_START.md)
- [Google AI Docs](https://ai.google.dev/docs)
