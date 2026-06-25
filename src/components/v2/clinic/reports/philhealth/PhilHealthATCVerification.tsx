"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Loader2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { verifyAtcAction } from "@/actions/philhealth-yakap.actions";

interface PhilHealthATCVerificationProps {
  clinicUid: string;
}

export default function PhilHealthATCVerification({ clinicUid }: PhilHealthATCVerificationProps) {
  const [pin, setPin] = useState("");
  const [atc, setAtc] = useState("");
  const [effectivityDate, setEffectivityDate] = useState("");
  const [result, setResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

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
    if (!cleanPin || cleanPin.length !== 12 || !atc || !effectivityDate) {
      toast.error("Please fill in all fields correctly (PIN must be 12 digits)");
      return;
    }
    startTransition(async () => {
      const response = await verifyAtcAction(clinicUid, cleanPin, atc, effectivityDate);
      if (response.status && response.data) {
        const data = response.data as { valid: boolean; message: string };
        setResult(data);
      } else {
        setResult({ valid: false, message: response.message || "Verification failed" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">ATC Verification</h2>
        <p className="text-sm text-muted-foreground">Verify Authorization Transaction Code (ATC) with PhilHealth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              ATC Details
            </CardTitle>
            <CardDescription>
              Enter the PIN, ATC, and Effectivity Date to verify.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="atc-pin">PhilHealth PIN</Label>
            <Input
              id="atc-pin"
              placeholder="XX-XXXXXXXXX-X"
              value={pin}
              onChange={handlePinChange}
              maxLength={14}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="atc-code">ATC Code</Label>
            <Input
              id="atc-code"
              placeholder="Authorization Transaction Code"
              value={atc}
              onChange={(e) => { setAtc(e.target.value); if (result) setResult(null); }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="atc-date">Effectivity Date</Label>
            <Input
              id="atc-date"
              type="date"
              value={effectivityDate}
              onChange={(e) => { setEffectivityDate(e.target.value); if (result) setResult(null); }}
            />
          </div>
          <Button
            onClick={handleVerify}
            disabled={isPending || !pin || !atc || !effectivityDate}
            className="w-full gap-2 bg-gradient-to-r from-teal-600 to-emerald-600"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verify ATC
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
            <div className={`p-5 rounded-xl border flex items-start gap-4 shadow-sm transition-all ${
              result.valid
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-800 dark:text-emerald-100"
                : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-900 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-800 dark:text-red-100"
            }`}>
              <div className={`p-2 rounded-full ${result.valid ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                {result.valid ? (
                  <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="pt-0.5">
                <p className="text-lg font-bold mb-1 tracking-tight">
                  {result.valid ? "Authorization Transaction Code is valid" : "Authorization Transaction Code is invalid"}
                </p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {result.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
