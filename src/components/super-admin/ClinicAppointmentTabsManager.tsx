"use client";

import { useState } from "react";
import { GetClinicAppointmentTabs, updateClinicAppointmentTabsAction } from "@actions/super-admin/clinics.action";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Badge } from "@components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Save, X } from "lucide-react";

interface ClinicAppointmentTabsManagerProps {
  clinicId: number;
  initialData: GetClinicAppointmentTabs;
}

export default function ClinicAppointmentTabsManager({
  clinicId,
  initialData,
}: ClinicAppointmentTabsManagerProps) {
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>(
    initialData.clinicAppointmentTabs.map((cat) => cat.appointmentTabId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [clinicAppointmentTabs, setClinicAppointmentTabs] = useState(initialData.clinicAppointmentTabs);

  const hasChanges = () => {
    const currentIds = new Set(
      initialData.clinicAppointmentTabs.map((cat) => cat.appointmentTabId)
    );
    const newIds = new Set(selectedTabIds);
    
    if (currentIds.size !== newIds.size) return true;
    
    for (const id of currentIds) {
      if (!newIds.has(id)) return true;
    }
    
    return false;
  };

  const handleToggleTab = (tabId: number) => {
    setSelectedTabIds((prev) =>
      prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateClinicAppointmentTabsAction({
        clinicId,
        appointmentTabIds: selectedTabIds,
      });
      
      // Update the initial data to reflect the saved state
      setClinicAppointmentTabs(
        selectedTabIds.map((tabId) => {
          const existingTab = initialData.clinicAppointmentTabs.find(
            (cat) => cat.appointmentTabId === tabId
          );
          if (existingTab) return existingTab;
          
          const tab = initialData.allAppointmentTabs.find((t) => t.id === tabId);
          return {
            id: 0, // Will be assigned by database
            appointmentTabId: tabId,
            AppointmentTab: {
              id: tab!.id,
              name: tab!.name,
              description: tab!.description,
              isActive: true,
            },
            ClinicRoleAppointmentTabs: [],
          };
        })
      );
      
      toast.success("Appointment tabs updated successfully");
    } catch (error) {
      toast.error("Failed to update appointment tabs");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedTabIds(
      initialData.clinicAppointmentTabs.map((cat) => cat.appointmentTabId)
    );
  };

  const getTabRoles = (tabId: number) => {
    const clinicTab = clinicAppointmentTabs.find(
      (cat) => cat.appointmentTabId === tabId
    );
    return clinicTab?.ClinicRoleAppointmentTabs.map((rat) => rat.ClinicRole.name) || [];
  };

  return (
    <div className="space-y-6">
      {hasChanges() && (
        <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            You have unsaved changes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-4">Available Appointment Tabs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select which appointment tabs should be available for this clinic. Selected tabs can then be assigned to specific clinic roles.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {initialData.allAppointmentTabs.map((tab) => {
            const isSelected = selectedTabIds.includes(tab.id);
            const roles = getTabRoles(tab.id);
            
            return (
              <Card
                key={tab.id}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "border-primary" : ""
                }`}
                onClick={() => handleToggleTab(tab.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTab(tab.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-base">{tab.name}</CardTitle>
                      {tab.description && (
                        <CardDescription className="mt-1">
                          {tab.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isSelected && roles.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground mb-2">
                      Accessible by roles:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roles.map((role, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
