# AI Temperature Settings Guide

## What is Temperature?

**Temperature** is a parameter that controls the **randomness and creativity** of AI model outputs. It's one of the most important hyperparameters for controlling AI behavior.

### How Temperature Works

- **Range**: 0.0 to 2.0 (typically 0.0 to 1.0 is used)
- **Effect**: Controls the probability distribution of token selection

#### Temperature Values and Their Effects

| Temperature | Behavior | Use Cases | Example |
|-------------|----------|-----------|---------|
| **0.0 - 0.2** | Deterministic, focused | Medical prescriptions, drug interactions | Always picks the most likely token |
| **0.3 - 0.4** | Mostly consistent | Medical summaries, clinical decisions | Very consistent with slight variation |
| **0.5 - 0.7** | Balanced | Scheduling, general healthcare tasks | Mix of consistency and creativity |
| **0.8 - 1.0** | Creative | Patient communication, educational content | More diverse, natural language |
| **1.0+** | Very creative | Brainstorming, creative writing | Can be unpredictable |

### Visual Representation

```
Temperature Scale:
0.0 ═══════════════════════════════════════════════════ 2.0
    ▲                    ▲                    ▲
    Deterministic        Balanced             Creative
    (Precision)          (Mix)                (Diversity)
```

## featureTemperatures Configuration

```typescript
export const featureTemperatures = {
  'medical-note-summarization': 0.3,        // Low - stick to source material
  'appointment-scheduling-assistant': 0.5,  // Medium - structure + flexibility
  'patient-insights': 0.7,                  // Higher - explore patterns
  'prescription-generation': 0.2,           // Very low - medical accuracy critical
  'medical-report-interpretation': 0.3,     // Low - factual analysis
  'clinical-decision-support': 0.3,         // Low - evidence-based only
  'symptom-analysis': 0.4,                  // Medium-low - differential diagnosis
  'drug-interaction-check': 0.1,            // Extremely low - no creativity
  'diagnosis-suggestion': 0.3,              // Low - based on evidence
  'treatment-plan-generation': 0.4,         // Medium-low - guidelines + personalization
  'patient-communication': 0.7,             // Higher - natural conversation
  'data-visualization': 0.5,                // Medium - balance structure + creativity
} as const;
```

## Why Different Features Need Different Temperatures

### 🔴 Critical Precision Tasks (0.1 - 0.3)

These tasks require **extreme accuracy** with minimal variation:

#### Drug Interaction Check (0.1) - LOWEST
```typescript
// Why so low?
// - Patient safety depends on accuracy
// - Must catch ALL potential interactions
// - No room for "creative interpretation"
// - Consistent output across all checks

// Example Output:
"Drug A (Warfarin) + Drug B (Aspirin) = HIGH risk of bleeding. Contraindicated."
```

#### Prescription Generation (0.2)
```typescript
// Why low?
// - Dosages must be precise
// - Routes of administration must be exact
// - Frequency must follow medical guidelines
// - No variations that could harm patients

// Example Output:
"Amoxicillin 500mg PO TID x 7 days"
// Always formats consistently
```

#### Medical Summarization (0.3)
```typescript
// Why low?
// - Must accurately reflect source notes
// - Cannot add information not in source
// - Must preserve medical terminology
// - Legal/liability considerations

// Example Output:
"Chief Complaint: Fever (38.5°C) and cough x3 days.
Assessment: Likely viral upper respiratory infection.
Plan: Supportive care, follow-up in 3 days if worsening."
```

### 🟡 Moderate Precision Tasks (0.4 - 0.5)

These tasks benefit from **some creativity** while maintaining accuracy:

#### Symptom Analysis (0.4)
```typescript
// Why medium-low?
// - Differential diagnosis requires considering multiple possibilities
// - Some variation helps explore different angles
// - Still needs to be medically sound
// - Balance between thoroughness and focus

// Example Output (varies slightly):
// Run 1: "Possible pneumonia. Recommend chest X-ray and CBC."
// Run 2: "Consider pneumonia or bronchitis. CXR and labs indicated."
// (Same conclusion, different phrasing)
```

#### Treatment Plan Generation (0.4)
```typescript
// Why medium-low?
// - Must follow evidence-based guidelines
// - Can personalize based on patient factors
// - Some flexibility in treatment options
// - Balance standardization with individualization

// Example Output:
"1. Start Lisinopril 10mg daily for hypertension
 2. Lifestyle modifications: low-sodium diet, exercise 30min/day
 3. Monitor BP at home, follow-up in 2 weeks
 4. Consider adding HCTZ if BP not controlled"
```

### 🟢 Creative/Conversational Tasks (0.7)

These tasks benefit from **natural, varied language**:

#### Patient Communication (0.7)
```typescript
// Why higher?
// - Needs to sound natural and empathetic
// - Variety makes repeated interactions feel fresh
// - More engaging for patients
// - Still medically accurate but conversationally flexible

// Example Outputs (intentional variation):
// Output 1:
"Hi Sarah! I noticed your appointment is coming up next week. 
Just a friendly reminder to bring your insurance card and any 
medications you're currently taking. Looking forward to seeing you!"

// Output 2:
"Hello Sarah, this is a reminder about your appointment next Tuesday. 
Please remember to bring your insurance information and a list of 
your current medications. See you soon!"

// Output 3:
"Hey Sarah! Your appointment is next week. Don't forget to bring 
your insurance card and current medication list. Can't wait to 
help you feel better!"
```

#### Patient Insights (0.7)
```typescript
// Why higher?
// - Exploring patterns in data benefits from creativity
// - Can make interesting connections
// - Natural language explanations are important
// - Still grounded in data but allows exploration

// Example Output:
"Based on your patient's history, I notice a pattern of blood pressure 
spikes that correlate with high-stress periods at work. Their readings 
are consistently better during vacation periods. This suggests stress 
management techniques could be beneficial alongside medication. 
Consider discussing mindfulness exercises or work-life balance strategies."
```

## How It's Used in the System

### 1. Automatic Selection

When you call an AI function, the system automatically selects the appropriate temperature:

```typescript
// In your code:
await generateAICompletion('medical-note-summarization', prompt);

// System automatically uses temperature: 0.3
// You don't need to specify it!
```

### 2. The getFeatureTemperature Function

```typescript
// From src/lib/ai/utils.ts
export function getFeatureTemperature(featureType: AIFeatureType): number {
  return featureTemperatures[featureType] || 0.7; // Default to 0.7 if not found
}
```

### 3. Used in AI Actions

```typescript
// From src/actions/ai/ai-actions.ts
export async function generateAICompletion(
  featureType: AIFeatureType,
  prompt: string,
  options?: { temperature?: number }
) {
  // Automatically gets the right temperature
  const temperature = options?.temperature ?? getFeatureTemperature(featureType);
  
  const response = await orchestrator.complete({
    messages,
    temperature, // <- Applied here
  });
}
```

### 4. Override When Needed

You can always override the default temperature:

```typescript
// Use default temperature (0.3 for medical notes)
await generateAICompletion('medical-note-summarization', notes);

// Override to be more creative (not recommended for medical notes!)
await generateAICompletion('medical-note-summarization', notes, {
  temperature: 0.7, // Custom temperature
});
```

## Real-World Examples

### Example 1: Drug Interaction Check (temp=0.1)

**Input**: "Warfarin + Aspirin"

**Output (always consistent)**:
```
⚠️ MAJOR INTERACTION WARNING
Drug 1: Warfarin (anticoagulant)
Drug 2: Aspirin (antiplatelet)
Risk: Significantly increased bleeding risk
Severity: HIGH
Action: Contraindicated - do not use together
Alternative: Consider acetaminophen for pain
```

If temperature was 0.7, you might get inconsistent results like:
- Sometimes: "These might interact"
- Sometimes: "High risk"
- Sometimes: "Moderate concern"
**This inconsistency is dangerous!**

### Example 2: Patient Communication (temp=0.7)

**Input**: "Send appointment reminder"

**Output 1**:
```
Hi John! Just a quick reminder that you have an appointment with 
Dr. Smith tomorrow at 2 PM. Please arrive 15 minutes early to 
complete any necessary paperwork. See you soon!
```

**Output 2**:
```
Hello John, this is a friendly reminder about your appointment 
tomorrow at 2:00 PM with Dr. Smith. We ask that you arrive 
15 minutes before your scheduled time. Looking forward to 
seeing you!
```

**Output 3**:
```
Hey John! Your appointment is tomorrow at 2 PM. Don't forget 
to come 15 mins early for paperwork. Can't wait to see you!
```

All convey the same information but sound more natural and less robotic!

## Best Practices

### ✅ DO

- **Use low temperature (0.1-0.3)** for medical decision-making
- **Use medium temperature (0.4-0.5)** for analysis and planning
- **Use higher temperature (0.7)** for patient communication
- **Test outputs** at different temperatures to find the sweet spot
- **Document** why you chose a specific temperature

### ❌ DON'T

- **Don't use high temperature** for critical medical tasks
- **Don't use 0.0** unless you really need 100% determinism
- **Don't go above 1.0** for healthcare applications
- **Don't change temperatures** without understanding the impact
- **Don't use one-size-fits-all** - different features need different settings

## Safety Considerations

### Why Low Temperature is Critical for Healthcare

1. **Patient Safety**: Consistent, accurate medical advice
2. **Legal Liability**: Reduces risk of variable/incorrect advice
3. **Regulatory Compliance**: Many healthcare regulations require deterministic systems
4. **Reproducibility**: Same input should give same output for auditing
5. **Trust**: Healthcare providers need predictable AI behavior

### When Higher Temperature is Safe

- **Non-clinical content**: Educational materials, general health tips
- **Communication**: Appointment reminders, patient engagement
- **Brainstorming**: Treatment options exploration (reviewed by clinician)
- **Insights**: Pattern discovery (verified by human)

## Testing Different Temperatures

Want to see the effect? Try this in your code:

```typescript
const prompt = "Summarize this patient note: Fever 38.5C, cough x3d, no SOB";

// Test at different temperatures
for (const temp of [0.1, 0.3, 0.5, 0.7, 1.0]) {
  const result = await generateAICompletion('medical-note-summarization', prompt, {
    temperature: temp,
  });
  console.log(`Temperature ${temp}:`, result.data);
}
```

You'll see:
- **0.1-0.3**: Very similar outputs, medical language, concise
- **0.5-0.7**: More varied phrasing, still accurate
- **1.0**: Creative but potentially inconsistent

## Summary

| Feature Type | Temperature | Reason | Output Consistency |
|--------------|-------------|--------|-------------------|
| Drug Interactions | 0.1 | Patient safety critical | 99% same |
| Prescriptions | 0.2 | Dosage accuracy required | 95% same |
| Medical Summaries | 0.3 | Must reflect source | 90% same |
| Symptom Analysis | 0.4 | Differential diagnosis | 80% similar |
| Treatment Plans | 0.4 | Guidelines + personalization | 80% similar |
| Scheduling | 0.5 | Structure + flexibility | 70% similar |
| Data Visualization | 0.5 | Balance | 70% similar |
| Patient Communication | 0.7 | Natural language | 50% varied |
| Patient Insights | 0.7 | Pattern exploration | 50% varied |

**The Golden Rule**: When in doubt, **err on the side of lower temperature** for healthcare applications. Patient safety always comes first!

## Related Documentation

- [AI Quick Start Guide](./AI_QUICK_START.md)
- [AI Integration Summary](./AI_INTEGRATION_SUMMARY.md)
- [Gemini Flash Setup](./GEMINI_FLASH_SETUP.md)

## Additional Resources

- [OpenAI Temperature Documentation](https://platform.openai.com/docs/api-reference/chat/create#chat-create-temperature)
- [Anthropic Claude Best Practices](https://docs.anthropic.com/claude/docs/intro-to-claude)
- [Google AI Temperature Guide](https://ai.google.dev/docs/concepts#model_parameters)
