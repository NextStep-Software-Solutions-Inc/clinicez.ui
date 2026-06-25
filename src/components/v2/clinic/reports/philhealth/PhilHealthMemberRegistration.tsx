"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Loader2, Search, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { verifyKonsultaPinAction } from "@/actions/philhealth-yakap.actions";

interface PhilHealthMemberRegistrationProps {
  clinicUid: string;
}

export default function PhilHealthMemberRegistration({ clinicUid }: PhilHealthMemberRegistrationProps) {
  const [pin, setPin] = useState("");
  const [type, setType] = useState("MM"); // MM = Member, DD = Dependent
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    let val = e.target.value.replace(/\D/g, "");
    
    // Limit to 12 digits max
    if (val.length > 12) {
      val = val.substring(0, 12);
    }
    
    // Format as XX-XXXXXXXXX-X
    let formatted = val;
    if (val.length > 11) {
      formatted = `${val.substring(0, 2)}-${val.substring(2, 11)}-${val.substring(11, 12)}`;
    } else if (val.length > 2) {
      formatted = `${val.substring(0, 2)}-${val.substring(2)}`;
    }
    
    setPin(formatted);
    if (result) setResult(null);
  };

  const handleVerify = () => {
    const cleanPin = pin.replace(/\D/g, "");
    if (cleanPin.length !== 12) {
      toast.error("PIN must be exactly 12 digits");
      return;
    }

    startTransition(async () => {
      const res = await verifyKonsultaPinAction(clinicUid, cleanPin, type);
      if (res.success) {
        toast.success("Verification complete");
        setResult(res.data);
      } else {
        toast.error(res.error || "Failed to verify PIN");
        setResult({ error: res.error });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Member/Dependent Registration</h2>
        <p className="text-sm text-muted-foreground">Verify if a patient is registered to your facility (isMemberDependerRegistered)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              Registration Check
            </CardTitle>
            <CardDescription>
              Check the PhilHealth Yakap database using a PIN and Member Type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>PhilHealth Identification Number (PIN)</Label>
              <Input 
                value={pin} 
                onChange={handlePinChange} 
                placeholder="XX-XXXXXXXXX-X"
                maxLength={14}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Patient Type</Label>
              <RadioGroup value={type} onValueChange={(val) => { setType(val); if (result) setResult(null); }} className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 border rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors w-full bg-background has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/30 dark:has-[:checked]:bg-teal-950/20">
                  <RadioGroupItem value="MM" id="type-mm" />
                  <Label htmlFor="type-mm" className="cursor-pointer font-medium w-full text-sm">Member (MM)</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors w-full bg-background has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/30 dark:has-[:checked]:bg-teal-950/20">
                  <RadioGroupItem value="DD" id="type-dd" />
                  <Label htmlFor="type-dd" className="cursor-pointer font-medium w-full text-sm">Dependent (DD)</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              className="w-full gap-2 bg-gradient-to-r from-teal-600 to-emerald-600" 
              onClick={handleVerify}
              disabled={isPending || !pin}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify Registration
            </Button>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Response Data</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const isErrorObj = !!result?.error;
              const isYes = result === "YES" || result?.result === "YES" || result?.success === true;
              const isNo = result === "NO" || result?.result === "NO";
              
              const isSuccessStatus = isYes;

              let title = "";
              let description = "";
              
              if (isYes) {
                title = "Registered";
                description = "The patient is actively registered to your facility.";
              } else if (isNo) {
                title = "Not Registered";
                description = "The patient is NOT registered to your facility.";
              } else if (isErrorObj) {
                title = "Verification Error";
                description = result.error;
              } else {
                title = result.success === false ? "Verification Failed" : "Verification Complete";
                description = result.message || "No specific message returned.";
              }

              return (
                <div className="space-y-4">
                  <div className={`p-5 rounded-xl border flex items-start gap-4 shadow-sm transition-all ${
                    isSuccessStatus
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-800 dark:text-emerald-100" 
                      : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-900 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-800 dark:text-red-100"
                  }`}>
                    <div className={`p-2 rounded-full ${isSuccessStatus ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                      {isSuccessStatus ? (
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-lg font-bold mb-1 tracking-tight">
                        {title}
                      </p>
                      <p className="text-sm font-medium opacity-90 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>

                  {/* Show raw response block ONLY if it's an error object or some other unexpected JSON */}
                  {!isYes && !isNo && (
                    <div className="rounded-lg border bg-muted/50 p-3 overflow-auto max-h-64 custom-scrollbar">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">Raw Response Data:</p>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
