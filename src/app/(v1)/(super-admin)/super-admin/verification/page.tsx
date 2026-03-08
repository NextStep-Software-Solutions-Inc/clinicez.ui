import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { getAllVerificationRequestsAction, getAllValidIDTypesAction } from "@actions/super-admin/verification.action";
import VerificationRequestsTable from "@components/super-admin/VerificationRequestsTable";
import ValidIDTypesTable from "@components/super-admin/ValidIDTypesTable";

export default async function VerificationPage() {
  const [requestsData, idTypesData] = await Promise.all([
    getAllVerificationRequestsAction({ pageSize: 10, pageNumber: 1 }),
    getAllValidIDTypesAction(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Verification</CardTitle>
          <CardDescription>
            Review and manage user identity verification requests. Approve or reject submitted KYC documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList>
              <TabsTrigger value="requests">Verification Requests</TabsTrigger>
              <TabsTrigger value="id-types">Valid ID Types</TabsTrigger>
            </TabsList>
            <TabsContent value="requests">
              <VerificationRequestsTable initialData={requestsData} />
            </TabsContent>
            <TabsContent value="id-types">
              <ValidIDTypesTable initialData={idTypesData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
