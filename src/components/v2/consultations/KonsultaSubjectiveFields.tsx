"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Check, ChevronsUpDown, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getActiveSignsAndSymptomsAction } from "@/actions/super-admin/sign-and-symptom.action";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SubjectiveStructuredData {
  illnessHistory: string;
  signsSymptoms: string;
  painSite: string;
  otherComplaint: string;
}

interface KonsultaSubjectiveFieldsProps {
  data: SubjectiveStructuredData;
  onChange: (data: SubjectiveStructuredData) => void;
  disabled?: boolean;
}

/**
 * Renders the 4 PhilHealth Yakap structured subjective fields:
 * - Illness History (pIllnessHistory)
 * - Signs & Symptoms (pSignsSymptoms)
 * - Pain Site (pPainSite)
 * - Other Complaint (pOtherComplaint)
 *
 * Displayed above the free-text markdown editor when the consultation
 * is PhilHealth Yakap-enabled and the current section is "subjective".
 */
export default function KonsultaSubjectiveFields({
  data,
  onChange,
  disabled = false,
}: KonsultaSubjectiveFieldsProps) {
  const handleChange = (field: keyof SubjectiveStructuredData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const [signsSymptomsLibrary, setSignsSymptomsLibrary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getActiveSignsAndSymptomsAction();
        if (res.success && res.data) {
          setSignsSymptomsLibrary(res.data);
        }
      } catch (err) {
        console.error("Failed to load signs and symptoms", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedCodes = data.signsSymptoms ? data.signsSymptoms.split(";").filter(Boolean) : [];

  const toggleSymptom = (code: string) => {
    let newCodes = [...selectedCodes];
    if (newCodes.includes(code)) {
      newCodes = newCodes.filter((c) => c !== code);
    } else {
      newCodes.push(code);
    }
    handleChange("signsSymptoms", newCodes.join(";"));
  };

  return (
    <div className="rounded-lg border border-teal-200 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/10 p-3 mb-3 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        PhilHealth Yakap — Subjective Fields
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Illness History */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-illness-history" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Illness History
          </Label>
          <Textarea
            id="konsulta-illness-history"
            value={data.illnessHistory}
            onChange={(e) => handleChange("illnessHistory", e.target.value)}
            disabled={disabled}
            placeholder="History of present illness..."
            rows={2}
            className="text-xs resize-none"
          />
        </div>

        {/* Signs & Symptoms */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Signs & Symptoms
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled || isLoading}
                className="w-full justify-between h-auto min-h-8 py-1 px-3 text-xs"
              >
                <div className="flex flex-wrap gap-1">
                  {selectedCodes.length > 0 && signsSymptomsLibrary ? (
                    selectedCodes.map((code) => {
                      const item = signsSymptomsLibrary.find((s) => s.code === code);
                      return (
                        <Badge key={code} variant="secondary" className="text-[10px] py-0 px-1.5 h-5 flex items-center gap-1">
                          {item?.description || code}
                          <div
                            role="button"
                            className="hover:bg-muted rounded-full"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSymptom(code);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </div>
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground pt-0.5">Select signs & symptoms...</span>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search symptoms..." className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty className="text-xs py-3 text-center">No symptoms found.</CommandEmpty>
                  <CommandGroup className="max-h-48 overflow-y-auto">
                    {signsSymptomsLibrary?.map((symptom) => (
                      <CommandItem
                        key={symptom.code}
                        value={symptom.description}
                        onSelect={() => toggleSymptom(symptom.code)}
                        className="text-xs cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCodes.includes(symptom.code) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {symptom.code} - {symptom.description}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Pain Site */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-pain-site" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Pain Site
          </Label>
          <Input
            id="konsulta-pain-site"
            value={data.painSite}
            onChange={(e) => handleChange("painSite", e.target.value)}
            disabled={disabled}
            placeholder="e.g. Abdomen, Head, Chest..."
            className="h-7 text-xs"
          />
        </div>

        {/* Other Complaint */}
        <div className="space-y-1">
          <Label htmlFor="konsulta-other-complaint" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Other Complaint
          </Label>
          <Input
            id="konsulta-other-complaint"
            value={data.otherComplaint}
            onChange={(e) => handleChange("otherComplaint", e.target.value)}
            disabled={disabled}
            placeholder="Other complaints..."
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
