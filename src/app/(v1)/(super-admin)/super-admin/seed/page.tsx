import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import SeedConsole from "@components/super-admin/SeedConsole";

export default function SeedPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Seeding</CardTitle>
        <CardDescription>
          Seed system reference data into the database. All operations are idempotent — existing records are skipped.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SeedConsole />
      </CardContent>
    </Card>
  );
}
