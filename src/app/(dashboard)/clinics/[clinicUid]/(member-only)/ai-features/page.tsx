"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SymptomAnalyzer, VisualizationRecommender } from "@/components/ai";
import { useParams } from "next/navigation";

export default function AIFeaturesPage() {
  const params = useParams<{ clinicUid: string }>();
  const clinicUid = params.clinicUid;

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
            <CardContent>
              <SymptomAnalyzer
                symptoms=""
                patientContext={{
                  age: 45,
                  gender: "Male",
                  conditions: ["Hypertension"],
                  allergies: []
                }}
                clinicId={clinicUid}
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
            <CardContent>
              <VisualizationRecommender
                dataDescription=""
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
