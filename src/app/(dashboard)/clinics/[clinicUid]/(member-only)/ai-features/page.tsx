"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SymptomAnalyzer, VisualizationRecommender } from "@/components/ai";
import { useParams } from "next/navigation";

export default function AIFeaturesPage() {
  const params = useParams<{ clinicUid: string }>();
  const clinicUid = params.clinicUid;

  // State for Symptom Analyzer demo
  const [symptoms, setSymptoms] = useState("");
  const [patientAge, setPatientAge] = useState("45");
  const [patientGender, setPatientGender] = useState("Male");
  const [conditions, setConditions] = useState("Hypertension");
  const [patientAllergies, setPatientAllergies] = useState("");

  // State for Visualization Recommender demo
  const [dataDescription, setDataDescription] = useState("");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Features</h1>
        <p className="text-muted-foreground mt-2">
          Explore AI-powered tools to assist with clinical workflows
        </p>
      </div>

      <Tabs defaultValue="symptom-analyzer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="symptom-analyzer">Symptom Analyzer</TabsTrigger>
          <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="symptom-analyzer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Symptom Analysis with Urgency Detection</CardTitle>
              <CardDescription>
                Analyze patient symptoms and get urgency recommendations (Emergency/Urgent/Routine)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Patient Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Describe the patient's symptoms... (e.g., 'severe chest pain, shortness of breath, sweating')"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Age"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      placeholder="Gender"
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">Existing Conditions (comma-separated)</Label>
                  <Input
                    id="conditions"
                    placeholder="e.g., Hypertension, Diabetes"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Input
                    id="allergies"
                    placeholder="e.g., Penicillin, Aspirin"
                    value={patientAllergies}
                    onChange={(e) => setPatientAllergies(e.target.value)}
                  />
                </div>
              </div>

              <SymptomAnalyzer
                symptoms={symptoms}
                patientContext={{
                  age: patientAge ? parseInt(patientAge) : undefined,
                  gender: patientGender || undefined,
                  conditions: conditions ? conditions.split(',').map(c => c.trim()).filter(Boolean) : [],
                  allergies: patientAllergies ? patientAllergies.split(',').map(a => a.trim()).filter(Boolean) : []
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Visualization Recommendations</CardTitle>
              <CardDescription>
                Get AI-powered recommendations for the best chart types and metrics for your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataDescription">Data Description</Label>
                <Textarea
                  id="dataDescription"
                  placeholder="Describe the data you want to visualize... (e.g., 'monthly appointment trends by type over the past year')"
                  value={dataDescription}
                  onChange={(e) => setDataDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <VisualizationRecommender
                dataDescription={dataDescription}
                dataType="appointments"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Medical Note Summarization</CardTitle>
            <CardDescription>Available in Consultation Notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Navigate to: Clinics → Consultations → Select Consultation → Consultation Notes
            </p>
            <p className="text-sm mt-2">
              Look for the "AI Summarize" button in the consultation notes header.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Insights</CardTitle>
            <CardDescription>Available in Patient Cards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Navigate to: Clinics → Patients → View any patient card
            </p>
            <p className="text-sm mt-2">
              AI Patient Insights card appears at the bottom of each patient card.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
