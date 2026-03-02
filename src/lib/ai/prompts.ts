/**
 * AI Prompt Templates
 * 
 * Pre-defined prompt templates for various AI features in the healthcare system.
 */

import { AIPromptTemplate, AIFeatureType } from './types';

/**
 * Medical note summarization template
 */
export const medicalNoteSummarizationTemplate: AIPromptTemplate = {
  id: 'medical-note-summarization',
  name: 'Medical Note Summarization',
  description: 'Summarize medical consultation notes into a concise format',
  featureType: 'medical-note-summarization',
  systemPrompt: `You are a medical assistant specialized in summarizing clinical notes. 
Your role is to create clear, concise summaries of medical consultations while preserving all critical information.
Always maintain medical terminology accuracy and HIPAA compliance.
Include a disclaimer that this is an AI-generated summary and should be reviewed by healthcare professionals.`,
  userPromptTemplate: `Please summarize the following medical consultation notes:

{{consultationNotes}}

Create a structured summary using exactly the following section headings (use ## markdown heading for each section):
{{sectionNames}}

Keep the summary concise but complete.`,
  variables: ['consultationNotes', 'sectionNames'],
  examples: [
    {
      input: {
        consultationNotes: 'Patient presents with fever (38.5°C) and cough for 3 days. No recent travel. Lungs clear on auscultation.',
      },
      output: '**Chief Complaint:** Fever and cough\n**HPI:** 3-day history of fever (38.5°C) and cough. No recent travel.\n**Assessment:** Upper respiratory infection\n**Plan:** Symptomatic treatment, monitor temperature',
    },
  ],
};

/**
 * Patient insights template
 */
export const patientInsightsTemplate: AIPromptTemplate = {
  id: 'patient-insights',
  name: 'Patient Insights and Analytics',
  description: 'Generate insights from patient data and trends',
  featureType: 'patient-insights',
  systemPrompt: `You are a healthcare analytics expert specialized in interpreting patient data.
Analyze trends, identify patterns, and provide actionable insights for healthcare providers.
Focus on clinical relevance and patient outcomes.
Always include appropriate disclaimers about AI-generated insights.`,
  userPromptTemplate: `Analyze the following patient data and provide insights:

{{patientData}}

Please provide:
1. Key trends and patterns
2. Areas of concern
3. Recommendations for follow-up
4. Preventive care suggestions`,
  variables: ['patientData'],
};

/**
 * Appointment scheduling assistant template
 */
export const appointmentSchedulingTemplate: AIPromptTemplate = {
  id: 'appointment-scheduling-assistant',
  name: 'Appointment Scheduling Assistant',
  description: 'Help patients schedule appointments based on symptoms and urgency',
  featureType: 'appointment-scheduling-assistant',
  systemPrompt: `You are a medical appointment scheduling assistant.
Help patients determine the appropriate urgency and type of appointment based on their symptoms.
Always err on the side of caution and recommend immediate care when symptoms suggest urgency.
Provide clear, empathetic guidance.`,
  userPromptTemplate: `A patient reports the following symptoms:

{{symptoms}}

Please assess:
1. Urgency level (Emergency, Urgent, Routine)
2. Recommended appointment type
3. Estimated timeline
4. Any immediate care instructions

If symptoms suggest emergency, clearly state they should seek immediate medical attention.`,
  variables: ['symptoms'],
};

/**
 * Prescription generation assistance template
 */
export const prescriptionAssistanceTemplate: AIPromptTemplate = {
  id: 'prescription-generation',
  name: 'Prescription Generation Assistance',
  description: 'Assist in generating prescription recommendations',
  featureType: 'prescription-generation',
  systemPrompt: `You are a clinical pharmacology assistant helping healthcare providers with prescription information.
Provide evidence-based medication recommendations, dosing guidelines, and important considerations.
Always emphasize that final prescribing decisions must be made by licensed healthcare providers.
Include drug interactions, contraindications, and monitoring requirements.`,
  userPromptTemplate: `Based on the following clinical information:

{{clinicalInfo}}

Provide prescription guidance including:
1. Suggested medications (generic names)
2. Standard dosing
3. Duration of therapy
4. Important considerations (interactions, contraindications)
5. Monitoring requirements

Remember to include disclaimer that this is for informational purposes only.`,
  variables: ['clinicalInfo'],
};

/**
 * Medical report interpretation template
 */
export const medicalReportInterpretationTemplate: AIPromptTemplate = {
  id: 'medical-report-interpretation',
  name: 'Medical Report Interpretation',
  description: 'Help interpret laboratory and imaging results',
  featureType: 'medical-report-interpretation',
  systemPrompt: `You are a medical informatics specialist helping interpret diagnostic reports.
Explain laboratory values, imaging findings, and their clinical significance in clear terms.
Use appropriate medical terminology while also providing explanations.
Always note that interpretation should be confirmed by the ordering physician.`,
  userPromptTemplate: `Please interpret the following medical report:

{{reportData}}

Provide:
1. Summary of findings
2. Clinical significance
3. Normal vs. abnormal values
4. Potential clinical implications
5. Recommended follow-up

Include disclaimer about professional medical review.`,
  variables: ['reportData'],
};

/**
 * Clinical decision support template
 */
export const clinicalDecisionSupportTemplate: AIPromptTemplate = {
  id: 'clinical-decision-support',
  name: 'Clinical Decision Support',
  description: 'Provide evidence-based clinical decision support',
  featureType: 'clinical-decision-support',
  systemPrompt: `You are a clinical decision support system providing evidence-based recommendations.
Reference current clinical guidelines and best practices.
Present differential diagnoses, diagnostic approaches, and management options.
Always emphasize clinical judgment and individual patient factors.`,
  userPromptTemplate: `Clinical scenario:

{{clinicalScenario}}

Please provide:
1. Differential diagnoses (with reasoning)
2. Recommended diagnostic workup
3. Evidence-based management options
4. Key clinical pearls
5. Red flags to watch for

Include references to guidelines when applicable.`,
  variables: ['clinicalScenario'],
};

/**
 * Symptom analysis template
 */
export const symptomAnalysisTemplate: AIPromptTemplate = {
  id: 'symptom-analysis',
  name: 'Symptom Analysis',
  description: 'Analyze patient-reported symptoms',
  featureType: 'symptom-analysis',
  systemPrompt: `You are a symptom triage assistant helping assess patient symptoms.
Provide structured analysis of symptoms including severity, duration, and associated factors.
Guide patients on appropriate next steps.
Always recommend professional medical evaluation when symptoms are concerning.`,
  userPromptTemplate: `Patient reports:

{{symptomDescription}}

Analyze:
1. Primary symptoms
2. Associated symptoms
3. Severity assessment
4. Urgency level
5. Recommended action

Emphasize when professional medical evaluation is needed.`,
  variables: ['symptomDescription'],
};

/**
 * Treatment plan generation template
 */
export const treatmentPlanTemplate: AIPromptTemplate = {
  id: 'treatment-plan-generation',
  name: 'Treatment Plan Generation',
  description: 'Generate comprehensive treatment plans',
  featureType: 'treatment-plan-generation',
  systemPrompt: `You are a treatment planning assistant for healthcare providers.
Create comprehensive, evidence-based treatment plans considering patient-specific factors.
Include pharmacological and non-pharmacological interventions.
Emphasize shared decision-making and patient education.`,
  userPromptTemplate: `Create a treatment plan for:

{{diagnosis}}

Patient context:
{{patientContext}}

Include:
1. Treatment goals
2. Pharmacological interventions
3. Non-pharmacological interventions
4. Patient education points
5. Follow-up schedule
6. Outcome monitoring

Tailor to patient-specific factors.`,
  variables: ['diagnosis', 'patientContext'],
};

/**
 * Data visualization recommendations template
 */
export const dataVisualizationTemplate: AIPromptTemplate = {
  id: 'data-visualization',
  name: 'Data Visualization Recommendations',
  description: 'Recommend appropriate data visualizations for healthcare data',
  featureType: 'data-visualization',
  systemPrompt: `You are a healthcare data visualization expert.
Recommend appropriate charts and visualizations for different types of healthcare data.
Consider clarity, clinical relevance, and user needs.
Suggest specific visualization types and key metrics to display.`,
  userPromptTemplate: `I need to visualize the following healthcare data:

{{dataDescription}}

Please recommend:
1. Best visualization type(s)
2. Key metrics to highlight
3. Layout suggestions
4. Color coding schemes
5. Interactive features

Focus on clinical utility and ease of interpretation.`,
  variables: ['dataDescription'],
};

/**
 * Get template by feature type
 */
export function getTemplateByFeature(featureType: AIFeatureType): AIPromptTemplate | null {
  const templates: Record<AIFeatureType, AIPromptTemplate | undefined> = {
    'medical-note-summarization': medicalNoteSummarizationTemplate,
    'appointment-scheduling-assistant': appointmentSchedulingTemplate,
    'patient-insights': patientInsightsTemplate,
    'prescription-generation': prescriptionAssistanceTemplate,
    'medical-report-interpretation': medicalReportInterpretationTemplate,
    'clinical-decision-support': clinicalDecisionSupportTemplate,
    'symptom-analysis': symptomAnalysisTemplate,
    'treatment-plan-generation': treatmentPlanTemplate,
    'data-visualization': dataVisualizationTemplate,
    'drug-interaction-check': undefined,
    'diagnosis-suggestion': undefined,
    'patient-communication': undefined,
  };

  return templates[featureType] || null;
}

/**
 * Render template with variables
 */
export function renderTemplate(template: AIPromptTemplate, variables: Record<string, string>): string {
  let rendered = template.userPromptTemplate;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return rendered;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): AIPromptTemplate[] {
  return [
    medicalNoteSummarizationTemplate,
    appointmentSchedulingTemplate,
    patientInsightsTemplate,
    prescriptionAssistanceTemplate,
    medicalReportInterpretationTemplate,
    clinicalDecisionSupportTemplate,
    symptomAnalysisTemplate,
    treatmentPlanTemplate,
    dataVisualizationTemplate,
  ];
}
