"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { discoverDatabaseSequencesAction, fixSingleSequenceAction } from "@/actions/super-admin/database.action";
import { Loader2, DatabaseZap, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DatabaseToolsPage() {
  const [isPending, setIsPending] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const handleFixSequences = async () => {
    setLogs([]);
    setProgress(0);
    setIsPending(true);
    
    try {
      setLogs(prev => [...prev, "Discovering database sequences..."]);
      const discoverResult = await discoverDatabaseSequencesAction();
      
      if (!discoverResult.status || !discoverResult.data) {
        toast.error(discoverResult.message);
        setLogs(prev => [...prev, `Error: ${discoverResult.message}`]);
        setIsPending(false);
        return;
      }

      const sequences = discoverResult.data;
      setLogs(prev => [...prev, `Found ${sequences.length} tables with ID sequences. Starting sync...`]);

      let fixedCount = 0;
      for (let i = 0; i < sequences.length; i++) {
        const seq = sequences[i];
        const fixResult = await fixSingleSequenceAction(seq.sequence_name, seq.table_name);
        setLogs(prev => [...prev, fixResult.message]);
        if (fixResult.status) fixedCount++;
        
        setProgress(Math.round(((i + 1) / sequences.length) * 100));
      }

      toast.success(`Successfully synced ${fixedCount} sequences!`);
      setLogs(prev => [...prev, `Done! Synced ${fixedCount} sequences across the database.`]);

    } catch (e) {
      toast.error("An error occurred during the sync process.");
      setLogs(prev => [...prev, "A fatal error occurred."]);
    } finally {
      setIsPending(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Database Tools</h3>
        <p className="text-sm text-muted-foreground">Manage database utilities and run maintenance tasks.</p>
      </div>
      
      <Card className="border-blue-100 dark:border-blue-900 shadow-sm">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/50">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <DatabaseZap className="h-5 w-5" /> 
            Sync Auto-Increment Sequences
          </CardTitle>
          <CardDescription className="text-blue-600/80 dark:text-blue-300/80">
            If you encounter <code className="bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-xs font-mono">Unique constraint failed on the fields: ('id')</code> errors when creating new records (like during imports or seeds), your Postgres database sequences have likely fallen out of sync. This tool automatically discovers all tables with ID sequences and resyncs them with their maximum respective ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Button 
            onClick={handleFixSequences} 
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
            {isPending ? "Syncing Sequences..." : "Sync Database Sequences"}
          </Button>
          
          {logs.length > 0 && (
            <div className="mt-6 border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Sync Execution Logs
                  </h4>
                  <span className="text-xs text-muted-foreground font-medium">{isPending ? `Processing... ${progress}%` : "Complete"}</span>
                </div>
                {isPending && (
                  <Progress 
                    value={progress} 
                    className="h-1.5 w-full bg-blue-100 dark:bg-blue-950" 
                    indicatorClassName="bg-blue-600 dark:bg-blue-500" 
                  />
                )}
              </div>
              <div className="p-4 bg-black/5 dark:bg-black/20 max-h-96 overflow-y-auto custom-scrollbar flex flex-col-reverse">
                <ul className="text-xs space-y-1.5 font-mono">
                  {logs.map((log, i) => (
                    <li key={i} className={`flex items-start gap-2 ${log.includes("Error") || log.includes("Failed") ? "text-red-500" : "text-muted-foreground"}`}>
                      <span className={log.includes("Error") || log.includes("Failed") ? "text-red-500 shrink-0 mt-0.5" : "text-emerald-500 shrink-0 mt-0.5"}>❯</span>
                      <span>{log}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
