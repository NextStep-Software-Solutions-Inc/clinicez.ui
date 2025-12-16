import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { getAllAppointmentTabsAction } from "@actions/super-admin/appointment-tabs.action";
import AppointmentTabsTable from "@components/super-admin/AppointmentTabsTable";

export default async function AppointmentTabsPage() {
  const initialData = await getAllAppointmentTabsAction({
    pageSize: 10,
    pageNumber: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Tabs</CardTitle>
        <CardDescription>
          Manage appointment tabs that can be used by clinics to organize appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AppointmentTabsTable initialData={initialData} />
      </CardContent>
    </Card>
  );
}
