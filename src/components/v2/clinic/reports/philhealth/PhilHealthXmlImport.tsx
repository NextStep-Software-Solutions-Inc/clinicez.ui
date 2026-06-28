"use client";

import React, { useState, useTransition, useRef } from "react";
import { FileUp, Loader2, Upload, Check, ChevronDown, ChevronRight, AlertCircle, User, Activity, Stethoscope, Pill, Microscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { parseXmlImportAction, validateTransferredXmlAction, importKonsultaDataAction } from "@/actions/philhealth-yakap.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface PhilHealthXmlImportProps {
  clinicUid: string;
}

export type ParsedRecord = {
  type: string;
  attributes: Record<string, string>;
  children?: ParsedRecord[];
};

export interface GroupedPatientRecord {
  pHciCaseNo: string;
  enlistment: ParsedRecord | null;
  profiles: ParsedRecord[];
  soaps: ParsedRecord[];
  diagnostics: ParsedRecord[];
  medicines: ParsedRecord[];
}

export default function PhilHealthXmlImport({ clinicUid }: PhilHealthXmlImportProps) {
  const [xmlInput, setXmlInput] = useState("");
  const [parsedRecords, setParsedRecords] = useState<GroupedPatientRecord[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [validationResult, setValidationResult] = useState<{
    status: boolean;
    message?: string;
    decryptedErrors?: string;
    decryptedResult?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{ imported: number; existing: number; error: number; errors: string[] } | null>(null);
  const cancelImportRef = useRef(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setXmlInput(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleValidateAndParse = () => {
    if (!xmlInput.trim()) {
      toast.error("Please provide XML content");
      return;
    }
    setValidationResult(null);
    setParsedRecords([]);
    startTransition(async () => {
      // 1. Validate
      const vResult = await validateTransferredXmlAction(clinicUid, xmlInput, "2"); // Tagging 2
      
      if (vResult.status && vResult.data) {
        const vData = vResult.data as any;
        const isSuccess = vData.success !== false && !vData.error;
        
        setValidationResult({
          status: isSuccess,
          message: vData.message || vData.error,
          decryptedErrors: vData.decryptedErrors,
          decryptedResult: vData.decryptedResult
        });

        if (isSuccess) {
          // 2. Parse if validation succeeded
          const result = await parseXmlImportAction(clinicUid, xmlInput);
          if (result.status && result.data) {
            const records = result.data as GroupedPatientRecord[];
            setParsedRecords(records);
            
            // Auto-select everything by default
            const allItems = new Set<string>();
            records.forEach(p => {
              allItems.add(`patient-${p.pHciCaseNo}`);
              if (p.enlistment) allItems.add(`enlistment-${p.pHciCaseNo}`);
              p.profiles.forEach((_, i) => allItems.add(`profile-${p.pHciCaseNo}-${i}`));
              p.soaps.forEach((_, i) => allItems.add(`soap-${p.pHciCaseNo}-${i}`));
              p.diagnostics.forEach((_, i) => allItems.add(`diagnostic-${p.pHciCaseNo}-${i}`));
              p.medicines.forEach((_, i) => allItems.add(`medicine-${p.pHciCaseNo}-${i}`));
            });
            setSelectedItems(allItems);
            setExpandedPatients(new Set());
            toast.success(`Validated and Parsed ${records.length} patients`);
          } else {
            toast.error(result.message || "Failed to parse XML after validation");
          }
        } else {
          toast.error("XML validation failed. Please check errors.");
        }
      } else {
        toast.error(vResult.message || "Failed to validate XML");
      }
    });
  };

  const togglePatientExpansion = (caseNo: string) => {
    const next = new Set(expandedPatients);
    if (next.has(caseNo)) next.delete(caseNo);
    else next.add(caseNo);
    setExpandedPatients(next);
  };

  const toggleItem = (id: string, groupIds?: string[]) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
      if (groupIds) groupIds.forEach(gId => next.delete(gId));
    } else {
      next.add(id);
      if (groupIds) groupIds.forEach(gId => next.add(gId));
    }
    setSelectedItems(next);
  };

  const handleImport = async () => {
    if (selectedItems.size === 0) return;

    setImportSummary(null);
    setShowImportDialog(true);
    setIsImporting(true);
    setImportProgress(0);
    cancelImportRef.current = false;

    const patientsToImport = parsedRecords.filter(p => selectedItems.has(`patient-${p.pHciCaseNo}`));
    const selectedArray = Array.from(selectedItems);
    
    const summary = { imported: 0, existing: 0, error: 0, errors: [] as string[] };
    const chunkSize = 2; // small chunks for complex XML data
    
    for (let i = 0; i < patientsToImport.length; i += chunkSize) {
      if (cancelImportRef.current) {
        summary.errors.push("Import cancelled by user.");
        break;
      }
      
      const chunk = patientsToImport.slice(i, i + chunkSize);
      try {
        const result = await importKonsultaDataAction(clinicUid, chunk, selectedArray);
        if (result.status && result.summary) {
          summary.imported += result.summary.imported;
          summary.existing += result.summary.existing;
          summary.error += result.summary.error;
          if (result.summary.errors) summary.errors.push(...result.summary.errors);
        } else {
          summary.error += chunk.length;
          summary.errors.push(result.message || "Unknown error during chunk import");
        }
      } catch (e: any) {
        summary.error += chunk.length;
        summary.errors.push(e?.message || "Network error or server crash");
      }
      setImportProgress(Math.min(100, Math.round(((i + chunk.length) / patientsToImport.length) * 100)));
    }
    
    setImportSummary(summary);
    setIsImporting(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">XML Import</h2>
        <p className="text-sm text-muted-foreground">Upload or paste PhilHealth Konsulta XML to parse and review</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors text-sm">
              <Upload className="h-4 w-4" />
              Upload XML File
              <input type="file" accept=".xml,.xml.enc" className="hidden" onChange={handleFileUpload} />
            </label>
            <span className="text-xs text-muted-foreground">or paste XML below</span>
          </div>

          <Textarea
            placeholder="Paste your PhilHealth Konsulta XML here..."
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            className="min-h-[200px] font-mono text-xs"
          />

          <Button
            onClick={handleValidateAndParse}
            disabled={isPending || !xmlInput.trim()}
            className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Validate & Parse XML
          </Button>
        </CardContent>
      </Card>

      {validationResult && (() => {
        const isSuccess = validationResult.status;
        const message = validationResult.message;
        const rawDecryptedStr = validationResult.decryptedErrors || validationResult.decryptedResult;

        let errorList: string[] = [];
        if (!isSuccess && rawDecryptedStr) {
          try {
            const cleanStr = rawDecryptedStr.replace(/[\x00-\x1F\x7F-\x9F]+$/g, '');
            const decryptedObj = JSON.parse(cleanStr);
            if (Array.isArray(decryptedObj.errors)) {
              errorList = decryptedObj.errors;
            } else if (typeof decryptedObj.errors === "string") {
              errorList = [decryptedObj.errors];
            }
          } catch (err) {
            const matches = Array.from(rawDecryptedStr.matchAll(/"(Line No\.[^"]+)"/g)).map(m => m[1]);
            if (matches.length > 0) {
              errorList = matches;
            } else {
              const fallbackMatches = rawDecryptedStr.match(/"([^"]+)"/g);
              if (fallbackMatches) {
                 errorList = fallbackMatches.map(m => m.replace(/(^"|"$)/g, '')).filter(s => s !== "errors");
              }
            }
          }
        }

        const groupedErrors: Record<string, string[]> = {};
        for (const err of errorList) {
          const match = err.match(/^Line No\. (\d+) : (.+)$/);
          if (match) {
            const lineNo = match[1];
            if (!groupedErrors[lineNo]) groupedErrors[lineNo] = [];
            groupedErrors[lineNo].push(match[2]);
          } else {
            if (!groupedErrors["General"]) groupedErrors["General"] = [];
            groupedErrors["General"].push(err);
          }
        }

        return (
          <Card className={isSuccess ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                {isSuccess ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                <CardTitle className="text-sm">
                  {isSuccess ? "XML Validated Successfully" : "XML Validation Failed"}
                </CardTitle>
                {errorList.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {errorList.length} issue{errorList.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {message && (
                <p className={`text-xs font-medium ${isSuccess ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                  {message}
                </p>
              )}
              {errorList.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(groupedErrors).map(([lineNo, errors]) => (
                    <div key={lineNo} className="rounded-lg border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800">
                          {lineNo === "General" ? "General Issues" : `Line ${lineNo}`}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {errors.length} issue{errors.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {errors.map((err, idx) => (
                          <li key={idx} className="text-[11px] text-red-800 dark:text-red-300 flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5 shrink-0">•</span>
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {parsedRecords.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3 bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Found {parsedRecords.length} Patient Encounters</h3>
                <p className="text-sm text-gray-500">Select the records you want to import. You can select specific patient encounters or granular items like SOAP notes and medicines.</p>
              </div>
              <Badge variant="secondary" className="text-sm py-1 px-3">{selectedItems.size} items selected</Badge>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-auto custom-scrollbar pr-2">
              {parsedRecords.map((patient) => {
                 const caseNo = patient.pHciCaseNo;
                 const pin = patient.enlistment?.attributes?.pMemPin || patient.enlistment?.attributes?.pPatientPin || patient.profiles?.[0]?.attributes?.pPatientPin || patient.soaps?.[0]?.attributes?.pPatientPin || "Unknown PIN";
                 const isExpanded = expandedPatients.has(caseNo);
                 
                 const childIds: string[] = [];
                 if (patient.enlistment) childIds.push(`enlistment-${caseNo}`);
                 patient.profiles.forEach((_, i) => childIds.push(`profile-${caseNo}-${i}`));
                 patient.soaps.forEach((_, i) => childIds.push(`soap-${caseNo}-${i}`));
                 patient.diagnostics.forEach((_, i) => childIds.push(`diagnostic-${caseNo}-${i}`));
                 patient.medicines.forEach((_, i) => childIds.push(`medicine-${caseNo}-${i}`));
                 
                 const patientId = `patient-${caseNo}`;
                 const isAllSelected = childIds.every(id => selectedItems.has(id)) && selectedItems.has(patientId);
                 const isIndeterminate = !isAllSelected && (selectedItems.has(patientId) || childIds.some(id => selectedItems.has(id)));

                 return (
                   <div key={caseNo} className={`border rounded-lg bg-card transition-colors ${isExpanded ? "border-primary/20 shadow-sm" : ""}`}>
                     <div className={`flex items-center gap-3 p-3 transition-colors ${isExpanded ? "bg-muted/50 rounded-t-lg border-b" : "hover:bg-muted/30 rounded-lg"}`}>
                        <Checkbox 
                          checked={isAllSelected ? true : (isIndeterminate ? "indeterminate" : false)} 
                          onCheckedChange={() => toggleItem(patientId, childIds)} 
                        />
                        <button className="flex items-center gap-2 flex-1 text-left font-medium text-sm" onClick={() => togglePatientExpansion(caseNo)}>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <span className={caseNo === "UNKNOWN" ? "italic text-muted-foreground" : ""}>
                            {caseNo === "UNKNOWN" ? "Unmapped Records" : `Case: ${caseNo}`}
                          </span>
                          <span className="text-xs text-muted-foreground font-normal ml-2">(PIN: {pin})</span>
                          {patient.enlistment && <span className="text-xs text-muted-foreground font-normal ml-2 hidden sm:inline-block truncate max-w-[200px]">{patient.enlistment.attributes.pMemFname} {patient.enlistment.attributes.pMemLname}</span>}
                        </button>
                        <div className="flex gap-1.5 opacity-80 hidden md:flex">
                          {patient.enlistment && <Badge variant="outline" className="text-[10px]"><User className="h-3 w-3 mr-1"/>Enlistment</Badge>}
                          {patient.profiles.length > 0 && <Badge variant="outline" className="text-[10px]"><Activity className="h-3 w-3 mr-1"/>{patient.profiles.length} Profiles</Badge>}
                          {patient.soaps.length > 0 && <Badge variant="outline" className="text-[10px]"><Stethoscope className="h-3 w-3 mr-1"/>{patient.soaps.length} SOAPs</Badge>}
                          {patient.diagnostics.length > 0 && <Badge variant="outline" className="text-[10px]"><Microscope className="h-3 w-3 mr-1"/>{patient.diagnostics.length} Diagnostics</Badge>}
                          {patient.medicines.length > 0 && <Badge variant="outline" className="text-[10px]"><Pill className="h-3 w-3 mr-1"/>{patient.medicines.length} Meds</Badge>}
                        </div>
                     </div>
                     
                     {isExpanded && (
                        <div className="p-3 space-y-3 pl-[46px]">
                           {/* Render Enlistment */}
                           {patient.enlistment && (
                             <div className="flex items-start gap-3">
                               <Checkbox checked={selectedItems.has(`enlistment-${caseNo}`)} onCheckedChange={() => toggleItem(`enlistment-${caseNo}`)} className="mt-2" />
                               <div className="flex-1 border rounded-md p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                                 <Badge variant="secondary" className="mb-2 text-[10px]">ENLISTMENT</Badge>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                                    {Object.entries(patient.enlistment.attributes).filter(([_,v]) => v).map(([k, v]) => (
                                       <div key={k} className="flex flex-col"><span className="text-muted-foreground text-[10px] capitalize">{k.replace(/^p/, '')}</span><span className="font-medium truncate">{v}</span></div>
                                    ))}
                                 </div>
                               </div>
                             </div>
                           )}
                           {/* Render Profiles */}
                           {patient.profiles.map((prof, i) => (
                             <div key={`profile-${i}`} className="flex items-start gap-3">
                               <Checkbox checked={selectedItems.has(`profile-${caseNo}-${i}`)} onCheckedChange={() => toggleItem(`profile-${caseNo}-${i}`)} className="mt-2" />
                               <div className="flex-1 border rounded-md p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                                 <Badge variant="secondary" className="mb-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">PROFILE</Badge>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                                    {Object.entries(prof.attributes).filter(([k,v]) => v && k !== "pPatientPin" && k !== "pHciCaseNo").slice(0, 7).map(([k, v]) => (
                                       <div key={k} className="flex flex-col"><span className="text-muted-foreground text-[10px] capitalize">{k.replace(/^p/, '')}</span><span className="font-medium truncate">{v}</span></div>
                                    ))}
                                    <div className="text-muted-foreground text-[10px] col-span-full italic mt-1">...and more details inside</div>
                                 </div>
                               </div>
                             </div>
                           ))}
                           {/* Render SOAPs */}
                           {patient.soaps.map((soap, i) => (
                             <div key={`soap-${i}`} className="flex items-start gap-3">
                               <Checkbox checked={selectedItems.has(`soap-${caseNo}-${i}`)} onCheckedChange={() => toggleItem(`soap-${caseNo}-${i}`)} className="mt-2" />
                               <div className="flex-1 border rounded-md p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                                 <Badge variant="secondary" className="mb-2 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">SOAP {soap.attributes.pHciTransNo}</Badge>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px]">Date</span><span className="font-medium">{soap.attributes.pSoapDate || soap.attributes.pTransDate}</span></div>
                                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px]">ATC</span><span className="font-medium">{soap.attributes.pATC}</span></div>
                                    {Object.entries(soap.attributes).filter(([k,v]) => v && k !== "pPatientPin" && k !== "pHciCaseNo" && k !== "pHciTransNo" && k !== "pSoapDate" && k !== "pTransDate" && k !== "pATC").slice(0, 2).map(([k, v]) => (
                                       <div key={k} className="flex flex-col"><span className="text-muted-foreground text-[10px] capitalize">{k.replace(/^p/, '')}</span><span className="font-medium truncate">{v}</span></div>
                                    ))}
                                 </div>
                               </div>
                             </div>
                           ))}
                           {/* Render Diagnostics */}
                           {patient.diagnostics.map((diag, i) => (
                             <div key={`diag-${i}`} className="flex items-start gap-3">
                               <Checkbox checked={selectedItems.has(`diagnostic-${caseNo}-${i}`)} onCheckedChange={() => toggleItem(`diagnostic-${caseNo}-${i}`)} className="mt-2" />
                               <div className="flex-1 border rounded-md p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                                 <Badge variant="secondary" className="mb-2 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">DIAGNOSTIC {diag.attributes.pHciTransNo}</Badge>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                                    {Object.entries(diag.attributes).filter(([k,v]) => v && k !== "pPatientPin" && k !== "pHciCaseNo" && k !== "pHciTransNo").slice(0, 4).map(([k, v]) => (
                                       <div key={k} className="flex flex-col"><span className="text-muted-foreground text-[10px] capitalize">{k.replace(/^p/, '')}</span><span className="font-medium truncate">{v}</span></div>
                                    ))}
                                 </div>
                               </div>
                             </div>
                           ))}
                           {/* Render Medicines */}
                           {patient.medicines.map((med, i) => (
                             <div key={`med-${i}`} className="flex items-start gap-3">
                               <Checkbox checked={selectedItems.has(`medicine-${caseNo}-${i}`)} onCheckedChange={() => toggleItem(`medicine-${caseNo}-${i}`)} className="mt-2" />
                               <div className="flex-1 border rounded-md p-3 bg-muted/10 hover:bg-muted/20 transition-colors">
                                 <Badge variant="secondary" className="mb-2 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">MEDICINE {med.attributes.pHciTransNo}</Badge>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px]">Drug Code</span><span className="font-medium truncate">{med.attributes.pDrugCode}</span></div>
                                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px]">Quantity</span><span className="font-medium">{med.attributes.pQuantity}</span></div>
                                    {Object.entries(med.attributes).filter(([k,v]) => v && k !== "pPatientPin" && k !== "pHciCaseNo" && k !== "pHciTransNo" && k !== "pDrugCode" && k !== "pQuantity").slice(0, 2).map(([k, v]) => (
                                       <div key={k} className="flex flex-col"><span className="text-muted-foreground text-[10px] capitalize">{k.replace(/^p/, '')}</span><span className="font-medium truncate">{v}</span></div>
                                    ))}
                                 </div>
                               </div>
                             </div>
                           ))}
                        </div>
                     )}
                   </div>
                 );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleImport} disabled={selectedItems.size === 0 || isImporting} className="bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md">
                Import {selectedItems.size} Selected Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        if (!open && !isImporting) setShowImportDialog(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importing XML Data</DialogTitle>
            <DialogDescription>
              {isImporting ? "Please wait while we securely import your selected XML data." : "Import completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            {isImporting ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4 px-4">
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Processing records... {importProgress}%</p>
                <Progress 
                  value={importProgress} 
                  className="h-2 w-full max-w-xs bg-emerald-100 dark:bg-emerald-950" 
                  indicatorClassName="bg-emerald-600 dark:bg-emerald-500" 
                />
              </div>
            ) : importSummary ? (
              <div className="w-full space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{importSummary.imported}</p>
                    <p className="text-xs text-muted-foreground mt-1">Imported</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importSummary.existing}</p>
                    <p className="text-xs text-muted-foreground mt-1">Existing</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{importSummary.error}</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </div>
                </div>
                
                {importSummary.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-red-600 mb-2">Errors encountered:</p>
                    <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded text-[10px] text-red-800 dark:text-red-300 max-h-32 overflow-y-auto">
                      <ul className="list-disc pl-4 space-y-1">
                        {importSummary.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isImporting) {
                  cancelImportRef.current = true;
                } else {
                  setShowImportDialog(false);
                }
              }} 
            >
              {isImporting ? "Cancel Import" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
