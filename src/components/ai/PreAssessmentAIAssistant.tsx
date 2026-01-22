'use client';

/**
 * AI Assistant Component for Pre-Assessment Notes
 * 
 * Provides AI-powered features to help generate and enhance pre-assessment notes.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  usePreAssessmentAI, 
  usePreAssessmentEnhancement,
  useHomeInstructionsGenerator 
} from '@/hooks/ai/use-pre-assessment-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PreAssessmentAIAssistantProps {
  onApplyGenerated?: (notes: {
    assessment: string;
    homeInstructions: string;
    remarks: string;
  }) => void;
  currentAssessment?: string;
  currentRemarks?: string;
  clinicId?: number;
  tenantId?: number;
}

export function PreAssessmentAIAssistant({ 
  onApplyGenerated,
  currentAssessment,
  currentRemarks,
  clinicId,
  tenantId,
}: PreAssessmentAIAssistantProps) {
  const [symptoms, setSymptoms] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
  });

  const { generate, isLoading: isGenerating, error: generateError, generatedNotes, reset: resetGenerate } = usePreAssessmentAI();
  const { enhance, isLoading: isEnhancing, error: enhanceError, enhancement, reset: resetEnhance } = usePreAssessmentEnhancement();
  const { generate: generateInstructions, isLoading: isGeneratingInstructions, error: instructionsError, instructions } = useHomeInstructionsGenerator();

  const handleGenerate = async () => {
    await generate(symptoms, {
      age: patientAge ? Number(patientAge) : undefined,
      gender: patientGender || undefined,
      chiefComplaint: chiefComplaint || undefined,
      vitalSigns: {
        bloodPressure: vitalSigns.bloodPressure || undefined,
        temperature: vitalSigns.temperature || undefined,
        heartRate: vitalSigns.heartRate || undefined,
        respiratoryRate: vitalSigns.respiratoryRate || undefined,
      },
    }, clinicId, tenantId);
  };

  const handleEnhance = async () => {
    if (currentAssessment) {
      await enhance(currentAssessment, currentRemarks, clinicId, tenantId);
    }
  };

  const handleGenerateInstructions = async () => {
    if (currentAssessment) {
      await generateInstructions(currentAssessment, undefined, clinicId, tenantId);
    }
  };

  const handleApply = (notes: typeof generatedNotes) => {
    if (notes && onApplyGenerated) {
      onApplyGenerated(notes);
      resetGenerate();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
          AI Pre-Assessment Assistant
        </CardTitle>
        <CardDescription>
          Use AI to generate or enhance pre-assessment notes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="enhance">Enhance</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Symptoms/Observations *</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe patient symptoms and observations..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Patient age"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    placeholder="M/F/Other"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Input
                  id="complaint"
                  placeholder="Main reason for visit"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <Label>Vital Signs (Optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Blood Pressure"
                    value={vitalSigns.bloodPressure}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                  />
                  <Input
                    placeholder="Temperature"
                    value={vitalSigns.temperature}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                  />
                  <Input
                    placeholder="Heart Rate"
                    value={vitalSigns.heartRate}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                  />
                  <Input
                    placeholder="Respiratory Rate"
                    value={vitalSigns.respiratoryRate}
                    onChange={(e) => setVitalSigns({ ...vitalSigns, respiratoryRate: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !symptoms.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Notes
                  </>
                )}
              </Button>

              {generateError && (
                <Alert variant="destructive">
                  <AlertDescription>{generateError}</AlertDescription>
                </Alert>
              )}

              {generatedNotes && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
                        AI-Generated Notes
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleApply(generatedNotes)}
                        disabled={!onApplyGenerated}
                      >
                        Apply to Form
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <Badge variant="secondary" className="mb-2">Assessment</Badge>
                      <p className="text-gray-700 whitespace-pre-wrap">{generatedNotes.assessment}</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2">Home Instructions</Badge>
                      <p className="text-gray-700 whitespace-pre-wrap">{generatedNotes.homeInstructions}</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2">Remarks</Badge>
                      <p className="text-gray-700 whitespace-pre-wrap">{generatedNotes.remarks}</p>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-4">
                      ⚠️ AI-generated content. Please review and adjust as needed.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Enhance Tab */}
          <TabsContent value="enhance" className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                This will analyze your current assessment and provide enhancement suggestions.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleEnhance}
              disabled={isEnhancing || !currentAssessment}
              className="w-full"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Enhance Current Assessment
                </>
              )}
            </Button>

            {enhanceError && (
              <Alert variant="destructive">
                <AlertDescription>{enhanceError}</AlertDescription>
              </Alert>
            )}

            {enhancement && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 text-green-600" />
                    Enhanced Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Badge variant="secondary" className="mb-2">Enhanced Version</Badge>
                    <p className="text-gray-700 whitespace-pre-wrap">{enhancement.enhancedAssessment}</p>
                  </div>
                  {enhancement.suggestions.length > 0 && (
                    <div>
                      <Badge variant="secondary" className="mb-2">Suggestions</Badge>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {enhancement.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 italic mt-4">
                    💡 Review suggestions and incorporate as appropriate.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Home Instructions Tab */}
          <TabsContent value="instructions" className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Generate patient-friendly home care instructions based on the assessment.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerateInstructions}
              disabled={isGeneratingInstructions || !currentAssessment}
              className="w-full"
            >
              {isGeneratingInstructions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Home Instructions
                </>
              )}
            </Button>

            {instructionsError && (
              <Alert variant="destructive">
                <AlertDescription>{instructionsError}</AlertDescription>
              </Alert>
            )}

            {instructions && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 text-purple-600" />
                    Generated Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{instructions}</p>
                  <p className="text-xs text-gray-500 italic mt-4">
                    📋 Copy these instructions to the home instructions field.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
