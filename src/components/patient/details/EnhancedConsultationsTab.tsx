"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Stethoscope, 
  Calendar, 
  User, 
  FileText, 
  Clock,
  Search,
  Filter,
  ExternalLink,
  Activity,
  Pill,
  ClipboardList,
  TrendingUp,
  Eye
} from "lucide-react";
import { format } from "date-fns";

// Types for consultations
interface Consultation {
  id: string;
  date: Date;
  physician: {
    name: string;
    specialty: string;
  };
  chiefComplaint: string;
  diagnosis: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type: 'REGULAR' | 'FOLLOW_UP' | 'EMERGENCY' | 'TELEMEDICINE';
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
  };
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
  }>;
  labOrders?: Array<{
    test: string;
    status: string;
  }>;
  followUp?: Date;
  notes?: string;
}

interface EnhancedConsultationsTabProps {
  patientId: number;
  clinicId: number;
  clinicUid: string;
  patientData: {
    Patient: {
      id: number;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

export default function EnhancedConsultationsTab({ 
  patientId, 
  clinicId, 
  clinicUid,
  patientData 
}: EnhancedConsultationsTabProps) {
  // Mock data - In real implementation, this would come from API
  const [consultations, setConsultations] = useState<Consultation[]>([
    {
      id: '1',
      date: new Date('2024-02-10T10:00:00'),
      physician: {
        name: 'Dr. Sarah Johnson',
        specialty: 'Internal Medicine'
      },
      chiefComplaint: 'Annual Check-up',
      diagnosis: 'Good overall health, mild hypertension noted',
      status: 'COMPLETED',
      type: 'REGULAR',
      vitals: {
        bloodPressure: '130/85',
        heartRate: 75,
        temperature: 36.7,
        weight: 70
      },
      prescriptions: [
        {
          medication: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily'
        }
      ],
      labOrders: [
        {
          test: 'Complete Blood Count',
          status: 'Completed'
        },
        {
          test: 'Lipid Profile',
          status: 'Pending'
        }
      ],
      followUp: new Date('2024-05-10'),
      notes: 'Patient advised to monitor blood pressure daily and maintain healthy diet.'
    },
    {
      id: '2',
      date: new Date('2024-01-15T14:30:00'),
      physician: {
        name: 'Dr. Michael Chen',
        specialty: 'Cardiology'
      },
      chiefComplaint: 'Chest discomfort',
      diagnosis: 'Gastroesophageal reflux disease (GERD)',
      status: 'COMPLETED',
      type: 'REGULAR',
      vitals: {
        bloodPressure: '125/80',
        heartRate: 72,
        temperature: 36.6,
        weight: 69
      },
      prescriptions: [
        {
          medication: 'Omeprazole',
          dosage: '20mg',
          frequency: 'Once daily before breakfast'
        }
      ],
      notes: 'ECG normal. Symptoms likely due to GERD. Follow up if symptoms persist.'
    },
    {
      id: '3',
      date: new Date('2024-03-05T09:00:00'),
      physician: {
        name: 'Dr. Sarah Johnson',
        specialty: 'Internal Medicine'
      },
      chiefComplaint: 'Follow-up visit',
      diagnosis: 'Blood pressure well controlled',
      status: 'SCHEDULED',
      type: 'FOLLOW_UP',
      notes: 'Scheduled follow-up to check blood pressure control.'
    }
  ]);

  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Filter consultations
  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.physician.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || consultation.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || consultation.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'SCHEDULED':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return 'destructive';
      case 'FOLLOW_UP':
        return 'secondary';
      case 'TELEMEDICINE':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Statistics
  const totalConsultations = consultations.length;
  const completedConsultations = consultations.filter(c => c.status === 'COMPLETED').length;
  const scheduledConsultations = consultations.filter(c => c.status === 'SCHEDULED').length;
  const lastConsultation = consultations.find(c => c.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalConsultations}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedConsultations}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{scheduledConsultations}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                <p className="text-lg font-bold">
                  {lastConsultation ? format(lastConsultation.date, 'MMM d') : '-'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search consultations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="TELEMEDICINE">Telemedicine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultations List */}
      <div className="space-y-4">
        {filteredConsultations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mt-2">No consultations found</p>
            </CardContent>
          </Card>
        ) : (
          filteredConsultations.map((consultation) => (
            <Card key={consultation.id} className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedConsultation(consultation)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{consultation.chiefComplaint}</h3>
                          <Badge variant={getStatusColor(consultation.status)}>
                            {consultation.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getTypeColor(consultation.type)}>
                            {consultation.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{consultation.diagnosis}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(consultation.date, 'MMM d, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {consultation.physician.name} • {consultation.physician.specialty}
                      </div>
                    </div>

                    {/* Quick Info */}
                    {consultation.status === 'COMPLETED' && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                          <div className="flex items-center gap-1 text-primary">
                            <Pill className="h-4 w-4" />
                            {consultation.prescriptions.length} Prescription(s)
                          </div>
                        )}
                        {consultation.labOrders && consultation.labOrders.length > 0 && (
                          <div className="flex items-center gap-1 text-blue-500">
                            <ClipboardList className="h-4 w-4" />
                            {consultation.labOrders.length} Lab Order(s)
                          </div>
                        )}
                        {consultation.followUp && (
                          <div className="flex items-center gap-1 text-orange-500">
                            <Calendar className="h-4 w-4" />
                            Follow-up: {format(consultation.followUp, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedConsultation} onOpenChange={(open) => !open && setSelectedConsultation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedConsultation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedConsultation.chiefComplaint}</DialogTitle>
                <DialogDescription>
                  Consultation on {format(selectedConsultation.date, 'MMMM d, yyyy • h:mm a')}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="summary" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="treatment">Treatment</TabsTrigger>
                  <TabsTrigger value="labs">Lab Orders</TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-1">Physician</p>
                        <p className="font-semibold">{selectedConsultation.physician.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedConsultation.physician.specialty}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <div className="flex gap-2">
                          <Badge variant={getStatusColor(selectedConsultation.status)}>
                            {selectedConsultation.status}
                          </Badge>
                          <Badge variant={getTypeColor(selectedConsultation.type)}>
                            {selectedConsultation.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Diagnosis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{selectedConsultation.diagnosis}</p>
                    </CardContent>
                  </Card>

                  {selectedConsultation.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{selectedConsultation.notes}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedConsultation.followUp && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Follow-up Scheduled</p>
                            <p className="font-semibold">{format(selectedConsultation.followUp, 'MMMM d, yyyy')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Vitals Tab */}
                <TabsContent value="vitals" className="space-y-4 mt-4">
                  {selectedConsultation.vitals ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Blood Pressure</p>
                          <p className="text-2xl font-bold">{selectedConsultation.vitals.bloodPressure}</p>
                          <p className="text-xs text-muted-foreground">mmHg</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Heart Rate</p>
                          <p className="text-2xl font-bold">{selectedConsultation.vitals.heartRate}</p>
                          <p className="text-xs text-muted-foreground">bpm</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="text-2xl font-bold">{selectedConsultation.vitals.temperature}</p>
                          <p className="text-xs text-muted-foreground">°C</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="text-2xl font-bold">{selectedConsultation.vitals.weight}</p>
                          <p className="text-xs text-muted-foreground">kg</p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No vital signs recorded</p>
                  )}
                </TabsContent>

                {/* Treatment Tab */}
                <TabsContent value="treatment" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Prescriptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0 ? (
                        <div className="space-y-3">
                          {selectedConsultation.prescriptions.map((prescription, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <p className="font-semibold">{prescription.medication}</p>
                              <p className="text-sm text-muted-foreground">
                                {prescription.dosage} • {prescription.frequency}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No prescriptions</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lab Orders Tab */}
                <TabsContent value="labs" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Laboratory Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedConsultation.labOrders && selectedConsultation.labOrders.length > 0 ? (
                        <div className="space-y-3">
                          {selectedConsultation.labOrders.map((order, index) => (
                            <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                              <p className="font-medium">{order.test}</p>
                              <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No lab orders</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
