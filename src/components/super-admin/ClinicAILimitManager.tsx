'use client';

/**
 * Clinic AI Limit Manager
 * 
 * Allows tenant owners and super admins to set AI limits for specific clinics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Save, Info, AlertTriangle } from 'lucide-react';
import {
  getClinicAILimitAction,
  setClinicAILimitAction,
} from '@/actions/super-admin/ai-limits.action';

interface ClinicAILimitManagerProps {
  clinicId: number;
  clinicName: string;
}

export function ClinicAILimitManager({ clinicId, clinicName }: ClinicAILimitManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [useCustomLimit, setUseCustomLimit] = useState(false);
  const [limitData, setLimitData] = useState<any>(null);
  const [formData, setFormData] = useState({
    maxRequests: 100,
    maxTokens: '',
    maxCostUSD: '',
    resetDay: 1,
    isActive: true,
  });

  useEffect(() => {
    loadLimit();
  }, [clinicId]);

  const loadLimit = async () => {
    setIsLoading(true);
    try {
      const result = await getClinicAILimitAction(clinicId);
      setLimitData(result);
      
      if (result.data?.clinicLimit) {
        setUseCustomLimit(true);
        setFormData({
          maxRequests: result.data?.clinicLimit.maxRequests,
          maxTokens: result.data?.clinicLimit.maxTokens?.toString() || '',
          maxCostUSD: result.data?.clinicLimit.maxCostUSD?.toString() || '',
          resetDay: result.data?.clinicLimit.resetDay || 1,
          isActive: result.data?.clinicLimit.isActive ?? true,
        });
      } else {
        setUseCustomLimit(false);
        setFormData({
          maxRequests: result.data?.effectiveLimit.maxRequests || 1000,
          maxTokens: result.data?.effectiveLimit.maxTokens?.toString() || '',
          maxCostUSD: result.data?.effectiveLimit.maxCostUSD?.toString() || '',
          resetDay: result.data?.effectiveLimit.resetDay || 1,
          isActive: true,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load clinic limit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!useCustomLimit) {
      toast.info('Custom limit not enabled. Using tenant/global defaults.');
      return;
    }

    setIsSaving(true);

    try {
      await setClinicAILimitAction(clinicId, {
        maxRequests: formData.maxRequests,
        maxTokens: formData.maxTokens ? parseInt(formData.maxTokens) : null,
        maxCostUSD: formData.maxCostUSD ? parseFloat(formData.maxCostUSD) : null,
        resetDay: formData.resetDay,
        isActive: formData.isActive,
      });

      toast.success('Clinic AI limit updated successfully');
      await loadLimit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update clinic limit');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const calculatePercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Usage Limits for {clinicName}</CardTitle>
        <CardDescription>
          Configure AI usage limits for this clinic. Limits must stay within tenant allocation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {limitData?.availableCapacity && (
            <div className="p-4 border rounded-lg space-y-3">
              <p className="text-sm font-medium">Tenant Available Capacity:</p>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requests</span>
                    <span className="font-medium">{limitData.availableCapacity.requests.toLocaleString()} available</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                {limitData.availableCapacity.tokens !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tokens</span>
                      <span className="font-medium">{limitData.availableCapacity.tokens.toLocaleString()} available</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                )}
                {limitData.availableCapacity.cost !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="font-medium">${limitData.availableCapacity.cost.toFixed(2)} available</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {useCustomLimit ? (
                <>Custom limits are active for this clinic. Sum of all clinic limits cannot exceed tenant capacity.</>
              ) : (
                <>Using tenant/global default limits. Enable custom limits to set clinic-specific values.</>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Use Custom Limits</Label>
              <p className="text-sm text-muted-foreground">
                Enable to set custom limits for this clinic
              </p>
            </div>
            <Switch
              checked={useCustomLimit}
              onCheckedChange={(checked) => {
                setUseCustomLimit(checked);
                if (!checked && limitData?.effectiveLimit) {
                  setFormData({
                    maxRequests: limitData.effectiveLimit.maxRequests,
                    maxTokens: limitData.effectiveLimit.maxTokens?.toString() || '',
                    maxCostUSD: limitData.effectiveLimit.maxCostUSD?.toString() || '',
                    resetDay: limitData.effectiveLimit.resetDay,
                    isActive: true,
                  });
                }
              }}
            />
          </div>

          {!useCustomLimit && limitData?.tenantLimit && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Current Tenant/Global Defaults:</p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Requests:</span>
                  <span className="font-medium">{limitData.effectiveLimit.maxRequests.toLocaleString()}/month</span>
                </div>
                {limitData.effectiveLimit.maxTokens && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Tokens:</span>
                    <span className="font-medium">{limitData.effectiveLimit.maxTokens.toLocaleString()}/month</span>
                  </div>
                )}
                {limitData.effectiveLimit.maxCostUSD && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Cost:</span>
                    <span className="font-medium">${limitData.effectiveLimit.maxCostUSD.toFixed(2)}/month</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reset Day:</span>
                  <span className="font-medium">Day {limitData.effectiveLimit.resetDay} of month</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxRequests">
                  Max Requests per Month *
                </Label>
                <Input
                  id="maxRequests"
                  type="number"
                  min="1"
                  max={limitData?.availableCapacity?.requests || undefined}
                  value={formData.maxRequests}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRequests: parseInt(e.target.value) })
                  }
                  disabled={!useCustomLimit}
                  required
                />
                {useCustomLimit && limitData?.availableCapacity && (
                  <p className="text-xs text-muted-foreground">
                    Max: {limitData.availableCapacity.requests.toLocaleString()} available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resetDay">Reset Day of Month *</Label>
                <Input
                  id="resetDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.resetDay}
                  onChange={(e) =>
                    setFormData({ ...formData, resetDay: parseInt(e.target.value) })
                  }
                  disabled={!useCustomLimit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">
                  Max Tokens per Month (Optional)
                </Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max={limitData?.availableCapacity?.tokens || undefined}
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                  placeholder="No limit"
                  disabled={!useCustomLimit}
                />
                {useCustomLimit && limitData?.availableCapacity?.tokens !== null && (
                  <p className="text-xs text-muted-foreground">
                    Max: {limitData.availableCapacity.tokens.toLocaleString()} available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCostUSD">
                  Max Cost USD per Month (Optional)
                </Label>
                <Input
                  id="maxCostUSD"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={limitData?.availableCapacity?.cost || undefined}
                  value={formData.maxCostUSD}
                  onChange={(e) => setFormData({ ...formData, maxCostUSD: e.target.value })}
                  placeholder="No limit"
                  disabled={!useCustomLimit}
                />
                {useCustomLimit && limitData?.availableCapacity?.cost !== null && (
                  <p className="text-xs text-muted-foreground">
                    Max: ${limitData.availableCapacity.cost.toFixed(2)} available
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable AI features for this clinic
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
                disabled={!useCustomLimit}
              />
            </div>

            {useCustomLimit && limitData?.availableCapacity && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Clinic limits are allocated from the tenant's available capacity. Total clinic allocations cannot exceed tenant limits.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving || !useCustomLimit}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Clinic Limit
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
