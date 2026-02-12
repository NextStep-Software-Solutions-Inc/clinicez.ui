import { GlobalAIDefaultsManager } from '@/components/super-admin/GlobalAIDefaultsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Building2, Hospital } from 'lucide-react';

export const metadata = {
  title: 'AI Limits Management | Super Admin',
  description: 'Manage AI usage limits and allowances',
};

export default function AILimitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Brain className="mr-3 h-8 w-8" />
          AI Limits Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure global defaults and tenant-specific AI usage limits
        </p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Global Defaults</TabsTrigger>
          <TabsTrigger value="tenants">Tenant Limits</TabsTrigger>
          <TabsTrigger value="overview">Usage Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <GlobalAIDefaultsManager />
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Tenant AI Limits
              </CardTitle>
              <CardDescription>
                View and manage AI limits for individual tenants. Navigate to a specific tenant's page to configure limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Go to <strong>Tenants</strong> page and select a tenant to manage their AI limits.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Overview</CardTitle>
              <CardDescription>
                Monitor AI usage across all tenants and clinics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Usage analytics and reporting dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
