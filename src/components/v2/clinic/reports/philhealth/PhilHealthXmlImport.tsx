"use client";

import { useState, useTransition } from "react";
import { FileUp, Loader2, Upload, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { parseXmlImportAction } from "@/actions/philhealth-yakap.actions";

interface PhilHealthXmlImportProps {
  clinicUid: string;
}

type ParsedRecord = {
  type: string;
  attributes: Record<string, string>;
  children?: ParsedRecord[];
};

export default function PhilHealthXmlImport({ clinicUid }: PhilHealthXmlImportProps) {
  const [xmlInput, setXmlInput] = useState("");
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setXmlInput(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!xmlInput.trim()) {
      toast.error("Please provide XML content");
      return;
    }
    startTransition(async () => {
      const result = await parseXmlImportAction(xmlInput);
      if (result.status && result.data) {
        const records = result.data as ParsedRecord[];
        setParsedRecords(records);
        setSelectedRecords(new Set());
        setExpandedRecords(new Set());
        toast.success(`Parsed ${records.length} records`);
      } else {
        toast.error(result.message || "Failed to parse XML");
      }
    });
  };

  const toggleSelected = (index: number) => {
    const next = new Set(selectedRecords);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedRecords(next);
  };

  const toggleExpanded = (index: number) => {
    const next = new Set(expandedRecords);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedRecords(next);
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
              <input
                type="file"
                accept=".xml"
                className="hidden"
                onChange={handleFileUpload}
              />
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
            onClick={handleParse}
            disabled={isPending || !xmlInput.trim()}
            className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Parse XML
          </Button>
        </CardContent>
      </Card>

      {parsedRecords.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">{parsedRecords.length} records parsed</p>
              <Badge variant="secondary">{selectedRecords.size} selected</Badge>
            </div>
            <div className="space-y-1 max-h-[500px] overflow-auto">
              {parsedRecords.map((record, index) => (
                <div key={index} className="border rounded-lg">
                  <div className="flex items-center gap-2 p-2">
                    <Checkbox
                      checked={selectedRecords.has(index)}
                      onCheckedChange={() => toggleSelected(index)}
                    />
                    <button
                      className="flex items-center gap-1 flex-1 text-left"
                      onClick={() => toggleExpanded(index)}
                    >
                      {expandedRecords.has(index) ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                      <Badge variant="outline" className="text-[10px]">{record.type}</Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {Object.keys(record.attributes).length} attributes
                      </span>
                    </button>
                  </div>
                  {expandedRecords.has(index) && (
                    <div className="px-8 pb-2">
                      <div className="rounded bg-muted/30 p-2 space-y-0.5">
                        {Object.entries(record.attributes).map(([key, value]) => (
                          <div key={key} className="flex gap-2 text-[10px]">
                            <span className="font-mono text-teal-600 dark:text-teal-400 min-w-[180px]">{key}</span>
                            <span className="text-foreground">{value || <span className="italic text-muted-foreground">empty</span>}</span>
                          </div>
                        ))}
                      </div>
                      {record.children && record.children.length > 0 && (
                        <div className="mt-2 ml-4 space-y-1">
                          {record.children.map((child, ci) => (
                            <div key={ci} className="text-[10px] border-l-2 border-muted pl-2">
                              <Badge variant="outline" className="text-[9px] mb-1">{child.type}</Badge>
                              <div className="space-y-0.5">
                                {Object.entries(child.attributes).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="font-mono text-teal-600 dark:text-teal-400 min-w-[160px]">{key}</span>
                                    <span>{value || <span className="italic text-muted-foreground">empty</span>}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
