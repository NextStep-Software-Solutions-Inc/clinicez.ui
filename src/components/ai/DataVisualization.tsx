'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DataVisualizationProps {
  appointmentHistory?: Array<{
    date: string;
    subject: string;
  }>;
  vitalSigns?: Array<{
    date: string;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: string;
    weight?: string;
  }>;
  conditions?: string[];
  medications?: Array<{
    name: string;
    dosage?: string;
  }>;
}

export function DataVisualization({
  appointmentHistory = [],
  vitalSigns = [],
  conditions = [],
  medications = [],
}: DataVisualizationProps) {
  // Prepare appointment trend data
  const appointmentTrend = useMemo(() => {
    const grouped: Record<string, number> = {};
    appointmentHistory.forEach((apt) => {
      const date = new Date(apt.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped)
      .sort((a, b) => new Date(`${a[0]} 2024`).getTime() - new Date(`${b[0]} 2024`).getTime())
      .map(([date, count]) => ({ date, appointments: count }));
  }, [appointmentHistory]);

  // Prepare vital signs data
  const vitalsTrend = useMemo(() => {
    return vitalSigns
      .map((vs) => ({
        date: new Date(vs.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        heartRate: vs.heartRate || 0,
        temp: vs.temperature ? parseFloat(vs.temperature) : 0,
        systolic: vs.bloodPressure
          ? parseInt(vs.bloodPressure.split('/')[0] || '0')
          : 0,
      }))
      .slice(-10);
  }, [vitalSigns]);

  // Prepare conditions pie data
  const conditionsPie = useMemo(() => {
    const grouped: Record<string, number> = {};
    conditions.forEach((cond) => {
      grouped[cond] = (grouped[cond] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [conditions]);

  // Prepare medications data
  const medicationsData = useMemo(() => {
    return medications.slice(0, 5).map((med) => ({
      name: med.name.substring(0, 15),
      full: med.name,
      dosage: med.dosage || 'N/A',
    }));
  }, [medications]);

  const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'];

  if (
    appointmentHistory.length === 0 &&
    vitalSigns.length === 0 &&
    conditions.length === 0 &&
    medications.length === 0
  ) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Patient Analytics & Visualizations</CardTitle>
        <CardDescription>
          Visual representation of patient health data and appointment history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appointments" className="w-full space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            {appointmentHistory.length > 0 && (
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            )}
            {vitalSigns.length > 0 && <TabsTrigger value="vitals">Vitals</TabsTrigger>}
            {conditions.length > 0 && <TabsTrigger value="conditions">Conditions</TabsTrigger>}
            {medications.length > 0 && <TabsTrigger value="medications">Medications</TabsTrigger>}
          </TabsList>

          {appointmentHistory.length > 0 && (
            <TabsContent value="appointments" className="space-y-4">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" fill="#0891b2" name="Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground">
                Total appointments: {appointmentHistory.length}
              </p>
            </TabsContent>
          )}

          {vitalSigns.length > 0 && (
            <TabsContent value="vitals" className="space-y-4">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    {vitalsTrend.some((v) => v.heartRate > 0) && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        name="Heart Rate (bpm)"
                        dot={false}
                      />
                    )}
                    {vitalsTrend.some((v) => v.temp > 0) && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="temp"
                        stroke="#f59e0b"
                        name="Temperature (°C)"
                        dot={false}
                      />
                    )}
                    {vitalsTrend.some((v) => v.systolic > 0) && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="systolic"
                        stroke="#3b82f6"
                        name="BP Systolic (mmHg)"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          )}

          {conditions.length > 0 && (
            <TabsContent value="conditions" className="space-y-4">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conditionsPie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {conditionsPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground">
                Total conditions: {conditions.length}
              </p>
            </TabsContent>
          )}

          {medications.length > 0 && (
            <TabsContent value="medications" className="space-y-4">
              <div className="space-y-2">
                {medicationsData.map((med, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm" title={med.full}>
                        {med.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{med.dosage}</p>
                    </div>
                    <div className="w-16 h-8 bg-primary rounded-md" />
                  </div>
                ))}
                {medications.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    +{medications.length - 5} more medications
                  </p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
