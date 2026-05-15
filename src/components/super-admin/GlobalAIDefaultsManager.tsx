'use client';

/**
 * Global AI Defaults Manager for Super Admin
 * 
 * Allows super admins to set default AI usage limits that apply to all tenants
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Save, Info } from 'lucide-react';
import {
  getGlobalAIDefaultsAction,
  updateGlobalAIDefaultsAction,
  type GlobalAIDefaults,
} from '@/actions/super-admin/ai-limits.action';

export function GlobalAIDefaultsManager() {
  const [defaults, setDefaults] = useState<GlobalAIDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    defaultMaxRequests: 1000,
    defaultMaxTokens: '500000',
    defaultMaxCostUSD: '100.00',
    defaultResetDay: 1,
  });

  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    setIsLoading(true);
    try {
      const result = await getGlobalAIDefaultsAction();
      setDefaults(result.data);
      setFormData({
        defaultMaxRequests: result.data?.defaultMaxRequests || 1000,
        defaultMaxTokens: result.data?.defaultMaxTokens?.toString() || '',
        defaultMaxCostUSD: result.data?.defaultMaxCostUSD?.toString() || '',
        defaultResetDay: result.data?.defaultResetDay || 1,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load defaults');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateGlobalAIDefaultsAction({
        defaultMaxRequests: formData.defaultMaxRequests,
        defaultMaxTokens: formData.defaultMaxTokens ? parseInt(formData.defaultMaxTokens) : null,
        defaultMaxCostUSD: formData.defaultMaxCostUSD ? parseFloat(formData.defaultMaxCostUSD) : null,
        defaultResetDay: formData.defaultResetDay,
      });

      toast.success('Global AI defaults updated successfully');
      await loadDefaults();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update defaults');
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
        <CardTitle>Global AI Default Limits</CardTitle>
        <CardDescription>
          Set default AI usage limits that apply to all tenants unless they have custom limits configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            These defaults are used as fallback values for tenants that don&apos;t have custom limits set.
            Tenants can override these values, and clinics must stay within their tenant&apos;s limits.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultMaxRequests">
                Default Max Requests per Month *
              </Label>
              <Input
                id="defaultMaxRequests"
                type="number"
                min="1"
                value={formData.defaultMaxRequests}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxRequests: parseInt(e.target.value) })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Default monthly request limit for tenants
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultResetDay">Reset Day of Month *</Label>
              <Input
                id="defaultResetDay"
                type="number"
                min="1"
                max="31"
                value={formData.defaultResetDay}
                onChange={(e) =>
                  setFormData({ ...formData, defaultResetDay: parseInt(e.target.value) })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Day of month when limits reset (1-31)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMaxTokens">
                Default Max Tokens per Month (Optional)
              </Label>
              <Input
                id="defaultMaxTokens"
                type="number"
                min="1"
                value={formData.defaultMaxTokens}
                onChange={(e) => setFormData({ ...formData, defaultMaxTokens: e.target.value })}
                placeholder="No limit"
              />
              <p className="text-xs text-muted-foreground">
                Optional token limit for cost control
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMaxCostUSD">
                Default Max Cost USD per Month (Optional)
              </Label>
              <Input
                id="defaultMaxCostUSD"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.defaultMaxCostUSD}
                onChange={(e) => setFormData({ ...formData, defaultMaxCostUSD: e.target.value })}
                placeholder="No limit"
              />
              <p className="text-xs text-muted-foreground">
                Optional maximum spending in USD
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Defaults
                </>
              )}
            </Button>
          </div>
        </form>

        {defaults && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(defaults.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
