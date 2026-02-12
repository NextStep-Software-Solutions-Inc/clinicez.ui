"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Heart, 
  AlertTriangle, 
  Pill, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Activity,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Types for health records
interface MedicalCondition {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'MODERATE' | 'MILD';
  diagnosedDate: Date;
  status: 'ACTIVE' | 'MANAGED' | 'RESOLVED';
  notes?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: 'SEVERE' | 'MODERATE' | 'MILD';
  reaction: string;
  discoveredDate?: Date;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';
}

interface VitalSign {
  id: string;
  date: Date;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

interface HealthRecordsTabProps {
  patientId: number;
  clinicId: number;
  userId: number;
  patientData: {
    Patient: {
      id: number;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  canEdit: boolean;
  canAdd: boolean;
}

export default function EnhancedHealthRecordsTab({ 
  patientId, 
  clinicId, 
  userId, 
  patientData, 
  canEdit, 
  canAdd 
}: HealthRecordsTabProps) {
  // Mock data - In real implementation, this would come from API
  const [conditions, setConditions] = useState<MedicalCondition[]>([
    {
      id: '1',
      name: 'Type 2 Diabetes',
      severity: 'MODERATE',
      diagnosedDate: new Date('2022-03-15'),
      status: 'MANAGED',
      notes: 'Controlled with medication and diet'
    },
    {
      id: '2',
      name: 'Hypertension',
      severity: 'MODERATE',
      diagnosedDate: new Date('2021-08-20'),
      status: 'ACTIVE',
      notes: 'Monitoring blood pressure regularly'
    }
  ]);

  const [allergies, setAllergies] = useState<Allergy[]>([
    {
      id: '1',
      allergen: 'Penicillin',
      severity: 'SEVERE',
      reaction: 'Anaphylaxis',
      discoveredDate: new Date('2018-05-10')
    },
    {
      id: '2',
      allergen: 'Peanuts',
      severity: 'MODERATE',
      reaction: 'Hives and swelling',
      discoveredDate: new Date('2015-02-14')
    }
  ]);

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      startDate: new Date('2022-03-15'),
      prescribedBy: 'Dr. John Smith',
      status: 'ACTIVE',
      notes: 'Take with meals'
    },
    {
      id: '2',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      startDate: new Date('2021-08-20'),
      prescribedBy: 'Dr. Jane Doe',
      status: 'ACTIVE'
    }
  ]);

  const [vitals, setVitals] = useState<VitalSign[]>([
    {
      id: '1',
      date: new Date(),
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.6,
      weight: 70,
      height: 170,
      oxygenSaturation: 98
    }
  ]);

  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);

  // Severity badge colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'SEVERE':
        return 'destructive';
      case 'MODERATE':
        return 'default';
      case 'MILD':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'destructive';
      case 'MANAGED':
        return 'default';
      case 'RESOLVED':
      case 'COMPLETED':
        return 'secondary';
      case 'DISCONTINUED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const patientName = `${patientData.Patient?.firstName || ''} ${patientData.Patient?.lastName || ''}`.trim();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conditions</p>
                <p className="text-2xl font-bold">{conditions.length}</p>
              </div>
              <Heart className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                <p className="text-2xl font-bold">{allergies.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medications</p>
                <p className="text-2xl font-bold">
                  {medications.filter(m => m.status === 'ACTIVE').length}
                </p>
              </div>
              <Pill className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Vitals</p>
                <p className="text-2xl font-bold">
                  {vitals.length > 0 ? format(vitals[0].date, 'MMM d') : '-'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical Conditions
              </CardTitle>
              <CardDescription>Current and past medical conditions</CardDescription>
            </div>
            {canAdd && (
              <Dialog open={isAddConditionOpen} onOpenChange={setIsAddConditionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Medical Condition</DialogTitle>
                    <DialogDescription>
                      Add a new medical condition to the patient's record
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Condition Name</Label>
                      <Input placeholder="e.g., Type 2 Diabetes" />
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                          <SelectItem value="MODERATE">Moderate</SelectItem>
                          <SelectItem value="MILD">Mild</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Diagnosed Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="MANAGED">Managed</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea placeholder="Additional notes..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddConditionOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast.success('Condition added successfully');
                      setIsAddConditionOpen(false);
                    }}>
                      Add Condition
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mt-2">No medical conditions recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conditions.map((condition) => (
                <div key={condition.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{condition.name}</h4>
                        <Badge variant={getSeverityColor(condition.severity)}>
                          {condition.severity}
                        </Badge>
                        <Badge variant={getStatusColor(condition.status)}>
                          {condition.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Diagnosed: {format(condition.diagnosedDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                      {condition.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{condition.notes}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Allergies
              </CardTitle>
              <CardDescription>Known allergies and adverse reactions</CardDescription>
            </div>
            {canAdd && (
              <Dialog open={isAddAllergyOpen} onOpenChange={setIsAddAllergyOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Allergy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Allergy</DialogTitle>
                    <DialogDescription>
                      Record a new allergy for the patient
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Allergen</Label>
                      <Input placeholder="e.g., Penicillin, Peanuts" />
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEVERE">Severe</SelectItem>
                          <SelectItem value="MODERATE">Moderate</SelectItem>
                          <SelectItem value="MILD">Mild</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reaction</Label>
                      <Textarea placeholder="Describe the reaction..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Discovered Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAllergyOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast.success('Allergy added successfully');
                      setIsAddAllergyOpen(false);
                    }}>
                      Add Allergy
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allergies.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mt-2">No allergies recorded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allergies.map((allergy) => (
                <div key={allergy.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{allergy.allergen}</h4>
                        <Badge variant={getSeverityColor(allergy.severity)}>
                          {allergy.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{allergy.reaction}</p>
                      {allergy.discoveredDate && (
                        <p className="text-xs text-muted-foreground">
                          Discovered: {format(allergy.discoveredDate, 'MMM yyyy')}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-500" />
                Current Medications
              </CardTitle>
              <CardDescription>Active prescriptions and medications</CardDescription>
            </div>
            {canAdd && (
              <Dialog open={isAddMedicationOpen} onOpenChange={setIsAddMedicationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
                    <DialogDescription>
                      Add a new medication to the patient's record
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Medication Name</Label>
                      <Input placeholder="e.g., Metformin" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dosage</Label>
                        <Input placeholder="e.g., 500mg" />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Input placeholder="e.g., Twice daily" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Prescribed By</Label>
                      <Input placeholder="Doctor's name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date (Optional)</Label>
                        <Input type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea placeholder="Instructions or notes..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMedicationOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast.success('Medication added successfully');
                      setIsAddMedicationOpen(false);
                    }}>
                      Add Medication
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {medications.filter(m => m.status === 'ACTIVE').length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mt-2">No active medications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.filter(m => m.status === 'ACTIVE').map((medication) => (
                <div key={medication.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{medication.name}</h4>
                        <Badge variant={getStatusColor(medication.status)}>
                          {medication.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Dosage</p>
                          <p className="font-medium">{medication.dosage}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-medium">{medication.frequency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Prescribed By</p>
                          <p className="font-medium">{medication.prescribedBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Started: {format(medication.startDate, 'MMM d, yyyy')}</span>
                        {medication.endDate && (
                          <span>Ends: {format(medication.endDate, 'MMM d, yyyy')}</span>
                        )}
                      </div>
                      {medication.notes && (
                        <p className="text-sm text-muted-foreground">{medication.notes}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Vital Signs */}
      {vitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Latest Vital Signs
            </CardTitle>
            <CardDescription>
              Recorded on {format(vitals[0].date, 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vitals[0].bloodPressure && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="text-2xl font-bold">{vitals[0].bloodPressure}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
              )}
              {vitals[0].heartRate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-2xl font-bold">{vitals[0].heartRate}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
              )}
              {vitals[0].temperature && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="text-2xl font-bold">{vitals[0].temperature}</p>
                  <p className="text-xs text-muted-foreground">°C</p>
                </div>
              )}
              {vitals[0].oxygenSaturation && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">O₂ Saturation</p>
                  <p className="text-2xl font-bold">{vitals[0].oxygenSaturation}%</p>
                  <p className="text-xs text-muted-foreground">SpO2</p>
                </div>
              )}
              {vitals[0].weight && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-2xl font-bold">{vitals[0].weight}</p>
                  <p className="text-xs text-muted-foreground">kg</p>
                </div>
              )}
              {vitals[0].height && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-2xl font-bold">{vitals[0].height}</p>
                  <p className="text-xs text-muted-foreground">cm</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
