'use client';

/**
 * Tenant AI Limit Manager
 * 
 * Allows super admins to set AI limits for specific tenants
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Info, AlertTriangle } from 'lucide-react';
import {
  getTenantAILimitAction,
  setTenantAILimitAction,
} from '@/actions/super-admin/ai-limits.action';

interface TenantAILimitManagerProps {
  tenantId: number;
  tenantName: string;
}

export function TenantAILimitManager({ tenantId, tenantName }: TenantAILimitManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [useCustomLimit, setUseCustomLimit] = useState(false);
  const [limitData, setLimitData] = useState<any>(null);
  const [formData, setFormData] = useState({
    maxRequests: 1000,
    maxTokens: '',
    maxCostUSD: '',
    resetDay: 1,
    isActive: true,
  });

  useEffect(() => {
    loadLimit();
  }, [tenantId]);

  const loadLimit = async () => {
    setIsLoading(true);
    try {
      const result = await getTenantAILimitAction(tenantId);
      setLimitData(result);
      
      if (result.data?.tenantLimit) {
        setUseCustomLimit(true);
        setFormData({
          maxRequests: result.data?.tenantLimit.maxRequests,
          maxTokens: result.data?.tenantLimit.maxTokens?.toString() || '',
          maxCostUSD: result.data?.tenantLimit.maxCostUSD?.toString() || '',
          resetDay: result.data?.tenantLimit.resetDay,
          isActive: result.data?.tenantLimit.isActive,
        });
      } else {
        setUseCustomLimit(false);
        setFormData({
          maxRequests: result.data?.globalDefaults?.defaultMaxRequests || 1000,
          maxTokens: result.data?.globalDefaults?.defaultMaxTokens?.toString() || '',
          maxCostUSD: result.data?.globalDefaults?.defaultMaxCostUSD?.toString() || '',
          resetDay: result.data?.globalDefaults?.defaultResetDay || 1,
          isActive: true,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load tenant limit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!useCustomLimit) {
      toast.info('Custom limit not enabled. Using global defaults.');
      return;
    }

    setIsSaving(true);

    try {
      await setTenantAILimitAction(tenantId, {
        maxRequests: formData.maxRequests,
        maxTokens: formData.maxTokens ? parseInt(formData.maxTokens) : null,
        maxCostUSD: formData.maxCostUSD ? parseFloat(formData.maxCostUSD) : null,
        resetDay: formData.resetDay,
        isActive: formData.isActive,
      });

      toast.success('Tenant AI limit updated successfully');
      await loadLimit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update tenant limit');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Usage Limits for {tenantName}</CardTitle>
        <CardDescription>
          Configure AI usage limits for this tenant. Clinics under this tenant cannot exceed these limits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {useCustomLimit ? (
                <>Custom limits are active. Clinics under this tenant can allocate from this pool.</>
              ) : (
                <>Using global default limits. Enable custom limits to set tenant-specific values.</>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Use Custom Limits</Label>
              <p className="text-sm text-muted-foreground">
                Enable to set custom limits for this tenant
              </p>
            </div>
            <Switch
              checked={useCustomLimit}
              onCheckedChange={(checked) => {
                setUseCustomLimit(checked);
                if (!checked && limitData?.globalDefaults) {
                  setFormData({
                    maxRequests: limitData.globalDefaults.defaultMaxRequests || 1000,
                    maxTokens: limitData.globalDefaults.defaultMaxTokens?.toString() || '',
                    maxCostUSD: limitData.globalDefaults.defaultMaxCostUSD?.toString() || '',
                    resetDay: limitData.globalDefaults.defaultResetDay || 1,
                    isActive: true,
                  });
                }
              }}
            />
          </div>

          {!useCustomLimit && limitData?.globalDefaults && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Current Global Defaults:</p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Requests:</span>
                  <span className="font-medium">{limitData.globalDefaults.defaultMaxRequests.toLocaleString()}/month</span>
                </div>
                {limitData.globalDefaults.defaultMaxTokens && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Tokens:</span>
                    <span className="font-medium">{limitData.globalDefaults.defaultMaxTokens.toLocaleString()}/month</span>
                  </div>
                )}
                {limitData.globalDefaults.defaultMaxCostUSD && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Cost:</span>
                    <span className="font-medium">${limitData.globalDefaults.defaultMaxCostUSD.toFixed(2)}/month</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reset Day:</span>
                  <span className="font-medium">Day {limitData.globalDefaults.defaultResetDay} of month</span>
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
                  value={formData.maxRequests}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRequests: parseInt(e.target.value) })
                  }
                  disabled={!useCustomLimit}
                  required
                />
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
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                  placeholder="No limit"
                  disabled={!useCustomLimit}
                />
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
                  value={formData.maxCostUSD}
                  onChange={(e) => setFormData({ ...formData, maxCostUSD: e.target.value })}
                  placeholder="No limit"
                  disabled={!useCustomLimit}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable AI features for this tenant
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

            {useCustomLimit && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Changing tenant limits may affect existing clinic allocations. Ensure total clinic limits don't exceed the new tenant limit.
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
                    Save Tenant Limit
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
