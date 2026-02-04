# Pre-Assessment AI Features Implementation Summary

## Overview
Complete AI-powered features for pre-assessment notes with usage tracking and rate limiting to prevent overcharging.

## Features Implemented

### 1. Pre-Assessment Note Generation
**File:** `src/actions/ai/pre-assessment-ai-actions.ts`

Generates complete pre-assessment notes from symptoms and patient context:
- **Input**: Symptoms, patient age, gender, chief complaint, vital signs
- **Output**: Structured assessment, home instructions, remarks
- **Use Case**: Nurses can quickly generate professional pre-consultation notes

```typescript
await generatePreAssessmentNotes(
  "Fever 38.5°C, cough, shortness of breath",
  {
    age: 45,
    gender: "Male",
    vitalSigns: { bloodPressure: "140/90", temperature: "38.5°C" }
  },
  clinicId,
  tenantId
);
```

### 2. Note Enhancement
**File:** `src/actions/ai/pre-assessment-ai-actions.ts`

Analyzes and enhances existing notes:
- **Input**: Current assessment and remarks
- **Output**: Enhanced assessment + list of suggestions
- **Use Case**: Improve clarity and completeness of existing documentation

```typescript
await enhancePreAssessmentNotes(
  currentAssessment,
  currentRemarks,
  clinicId,
  tenantId
);
```

### 3. Home Instructions Generation
**File:** `src/actions/ai/pre-assessment-ai-actions.ts`

Creates patient-friendly home care instructions:
- **Input**: Assessment and optional diagnosis
- **Output**: Clear, numbered home care instructions
- **Use Case**: Provide patients with easy-to-follow care guidance

```typescript
await generateHomeInstructions(
  assessment,
  diagnosis,
  clinicId,
  tenantId
);
```

## UI Components

### PreAssessmentAIAssistant Component
**File:** `src/components/ai/PreAssessmentAIAssistant.tsx`

Tabbed interface with three AI features:
1. **Generate Tab**: Input symptoms and patient context to generate notes
2. **Enhance Tab**: Improve existing assessment with AI suggestions
3. **Instructions Tab**: Generate home care instructions

Features:
- Input forms for symptoms, age, gender, chief complaint, vital signs
- "Apply to Form" button to populate parent form
- Loading states and error handling
- Color-coded result cards (blue for generated, green for enhanced, purple for instructions)
- Medical disclaimers on all AI-generated content

### Integration into PreAssessmentNoteSheet
**File:** `src/components/appointment/PreAssessmentNoteSheet.tsx`

- AI Assistant button in sheet header (visible when AI is enabled)
- Toggle to show/hide AI assistant
- Automatic form population when "Apply to Form" is clicked
- Passes clinicId and tenantId for usage tracking

## Usage Tracking & Rate Limiting

### Database Schema
**File:** `prisma/migrations/20260122030146_ai_usage_tracking/migration.sql`

Three new tables:

#### AIUsageLog
Logs every AI request:
- User ID, clinic ID, tenant ID
- Feature type, provider, model
- Token counts (prompt, completion, total)
- Estimated cost in USD
- Success/failure status
- Error messages

#### AIUsageLimit
Configurable limits per clinic or tenant:
- Maximum requests per month
- Optional token limit
- Optional cost limit in USD
- Reset day (1-31 for monthly reset)
- Active/inactive flag

#### AIUsageSummary
Aggregated usage per period:
- Total requests, tokens, cost
- Success/failure counts
- Last updated timestamp
- Period identifier (YYYY-MM format)

### Usage Tracking Service
**File:** `src/lib/ai/usage-tracking.ts`

#### checkAIUsageLimit()
- Checks if user/clinic/tenant has exceeded limits
- Returns: allowed (boolean), reason (string), current usage, limits
- Called before every AI operation
- Prevents API calls when limit exceeded

#### logAIUsage()
- Logs individual AI request to AIUsageLog
- Updates AIUsageSummary (upsert for current period)
- Tracks both clinic and tenant usage
- Calculates estimated cost automatically

#### getAIUsage()
- Returns current usage statistics
- Shows percent of limit used
- Includes success rate calculation

### React Hooks
**File:** `src/hooks/ai/use-pre-assessment-ai.ts`

Three custom hooks:
1. **usePreAssessmentAI()** - Generate notes
2. **usePreAssessmentEnhancement()** - Enhance notes
3. **useHomeInstructionsGenerator()** - Generate instructions

All hooks:
- Accept clinicId and tenantId parameters
- Handle loading states
- Provide error messages
- Return formatted data
- Include reset functions

## How It Works

### 1. User Interaction
```
1. User opens Pre-Assessment Note Sheet
2. Clicks "Show AI Assistant" button
3. Enters symptoms and patient context
4. Clicks "Generate Notes"
```

### 2. Backend Flow
```
1. checkAIUsageLimit() - Verify clinic/tenant hasn't exceeded limits
2. If allowed, call AI provider (OpenAI/Anthropic/Google)
3. logAIUsage() - Record usage in database
4. Return formatted response
5. If limit exceeded, return error message
```

### 3. Usage Tracking
```
AIUsageLog Entry:
- userId: "user_123"
- clinicId: 456
- featureType: "medical-note-summarization"
- provider: "openai"
- model: "gpt-4o-mini"
- promptTokens: 150
- completionTokens: 300
- totalTokens: 450
- estimatedCost: 0.0002  # $0.0002
- success: true

AIUsageSummary Update:
- clinicId: 456
- period: "2026-01"
- totalRequests: +1
- totalTokens: +450
- totalCostUSD: +0.0002
- successfulRequests: +1
```

## Configuration

### Setting Clinic Limits
```typescript
// In admin dashboard or migration
await prisma.aIUsageLimit.create({
  data: {
    clinicId: 123,
    limitType: 'MONTHLY',
    maxRequests: 1000,      // 1,000 requests per month
    maxTokens: 500000,      // 500K tokens per month
    maxCostUSD: 100.00,     // $100 per month
    resetDay: 1,            // Reset on 1st of each month
    isActive: true,
  },
});
```

### Setting Tenant Limits
```typescript
await prisma.aIUsageLimit.create({
  data: {
    tenantId: 789,
    limitType: 'MONTHLY',
    maxRequests: 5000,
    maxTokens: 2000000,
    maxCostUSD: 500.00,
    resetDay: 1,
    isActive: true,
  },
});
```

### Environment Variables
```env
# Required - at least one provider
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Optional - for usage alerts (future)
AI_COST_WARNING_THRESHOLD=80  # Warn at 80% of limit
AI_COST_ALERT_EMAILS=admin@clinic.com
```

## Error Handling

### Limit Exceeded
```
Error: "Clinic has reached the monthly limit of 1000 AI requests. 
        Limit resets on day 1 of next month."

Current Usage:
- Requests: 1000 / 1000 (100%)
- Tokens: 450,000 / 500,000 (90%)
- Cost: $89.50 / $100.00 (89.5%)
```

### Cost Limit Exceeded
```
Error: "Clinic has reached the monthly cost limit of $100.00."
```

### Token Limit Exceeded
```
Error: "Clinic has reached the monthly token limit of 500,000 tokens."
```

## Monitoring & Reporting

### Get Current Usage
```typescript
import { getAIUsage } from '@/lib/ai/usage-tracking';

const usage = await getAIUsage(clinicId);
console.log(usage);
// {
//   currentPeriod: {
//     requests: 750,
//     tokens: 340000,
//     costUSD: 67.50,
//     successRate: 98.5
//   },
//   limit: {
//     maxRequests: 1000,
//     maxTokens: 500000,
//     maxCostUSD: 100.00
//   },
//   percentUsed: {
//     requests: 75,
//     tokens: 68,
//     cost: 67.5
//   }
// }
```

### Query Usage Logs
```typescript
// Get all AI usage for a clinic this month
const logs = await prisma.aIUsageLog.findMany({
  where: {
    clinicId: 123,
    createdAt: {
      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  },
  include: {
    // User details if needed
  }
});

// Group by feature type
const byFeature = await prisma.aIUsageLog.groupBy({
  by: ['featureType'],
  where: { clinicId: 123 },
  _sum: {
    totalTokens: true,
    estimatedCost: true,
  },
  _count: {
    id: true,
  },
});
```

## Benefits

### For Nurses
- Generate professional pre-assessment notes in seconds
- Consistent documentation format
- Suggestions for what else to document
- Patient-friendly home instructions ready to use

### For Clinics
- Improved documentation quality
- Time savings on administrative tasks
- Standardized pre-assessment process
- Control over AI costs with usage limits

### For Administrators
- Complete visibility into AI usage
- Prevent unexpected costs
- Per-clinic cost allocation
- Usage analytics for planning

## Security & Compliance

✅ **Authentication**: All AI operations require Clerk authentication
✅ **Authorization**: User permissions checked before access
✅ **Data Privacy**: No PHI stored in AI logs (only metadata)
✅ **Audit Trail**: Complete log of all AI operations
✅ **Cost Control**: Hard limits prevent runaway costs
✅ **Error Handling**: Failed requests logged but don't count against limits
✅ **Rate Limiting**: Per-clinic and per-tenant limits enforced

## Future Enhancements

### Recommended Next Steps
1. **Admin Dashboard**
   - View real-time usage across all clinics
   - Adjust limits dynamically
   - Send usage alerts/notifications
   - Export usage reports

2. **Usage Analytics**
   - Charts showing usage trends
   - Cost forecasting
   - Feature adoption metrics
   - Success/failure analysis

3. **Credit System**
   - Purchase additional AI credits
   - Rollover unused credits
   - Credit packages for different tiers
   - Automatic top-up options

4. **Enhanced Limits**
   - Daily limits in addition to monthly
   - Per-feature limits
   - User-level limits
   - Time-of-day restrictions

5. **Optimization**
   - Cache common queries
   - Batch similar requests
   - Use smaller models for simple tasks
   - Implement request deduplication

## Files Changed

### New Files
- `src/actions/ai/pre-assessment-ai-actions.ts` - AI server actions
- `src/hooks/ai/use-pre-assessment-ai.ts` - React hooks
- `src/components/ai/PreAssessmentAIAssistant.tsx` - UI component
- `src/lib/ai/usage-tracking.ts` - Usage tracking service
- `prisma/migrations/20260122030146_ai_usage_tracking/migration.sql` - DB schema
- `docs/PRE_ASSESSMENT_AI_FEATURES.md` - This document

### Modified Files
- `src/components/appointment/PreAssessmentNoteSheet.tsx` - Added AI assistant integration

## Testing

### Manual Testing Steps
1. Enable AI features (`NEXT_PUBLIC_AI_ENABLED=true`)
2. Open pre-assessment notes sheet
3. Click "Show AI Assistant"
4. Test Generate tab with sample symptoms
5. Test Enhance tab with existing assessment
6. Test Instructions tab
7. Click "Apply to Form" and verify fields populate
8. Check database for usage logs
9. Set low limit and verify limit enforcement
10. Check error messages when limit exceeded

### Database Queries for Testing
```sql
-- Check usage logs
SELECT * FROM "AIUsageLog" 
WHERE "clinicId" = 123 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check current period summary
SELECT * FROM "AIUsageSummary"
WHERE "clinicId" = 123 AND "period" = '2026-01';

-- Check limits
SELECT * FROM "AIUsageLimit"
WHERE "clinicId" = 123;
```

## Migration Instructions

1. **Run Migration**
```bash
cd /home/runner/work/clinicez.ui/clinicez.ui
pnpm prisma migrate deploy
```

2. **Set Default Limits** (Optional)
```sql
-- Set default limits for all existing clinics
INSERT INTO "AIUsageLimit" ("clinicId", "limitType", "maxRequests", "maxTokens", "maxCostUSD", "resetDay", "isActive", "createdAt", "updatedAt")
SELECT 
  id as "clinicId",
  'MONTHLY' as "limitType",
  1000 as "maxRequests",
  500000 as "maxTokens",
  100.00 as "maxCostUSD",
  1 as "resetDay",
  true as "isActive",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Clinic"
WHERE id NOT IN (SELECT "clinicId" FROM "AIUsageLimit" WHERE "clinicId" IS NOT NULL);
```

3. **Verify Installation**
```typescript
import { checkAIUsageLimit } from '@/lib/ai/usage-tracking';

const result = await checkAIUsageLimit({
  userId: 'test',
  clinicId: 123,
  featureType: 'medical-note-summarization',
});

console.log(result.allowed); // Should be true if limits not set or not exceeded
```

## Support

For questions or issues:
- Review this documentation
- Check implementation files
- Test with sample data
- Contact: clinicez.official@gmail.com
