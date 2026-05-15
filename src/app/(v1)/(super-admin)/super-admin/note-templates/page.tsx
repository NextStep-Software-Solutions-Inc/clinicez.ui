import { getNoteTemplatesWithSectionsAction } from "@actions/note-template.action";
import NoteTemplateManager from "@components/super-admin/NoteTemplateManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export default async function NoteTemplatesPage() {
  let templates: Awaited<ReturnType<typeof getNoteTemplatesWithSectionsAction>> | null = null;

  try {
    templates = await getNoteTemplatesWithSectionsAction();
  } catch {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Note Templates</CardTitle>
          <CardDescription>Failed to load note templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Unable to load note template data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <NoteTemplateManager initialData={templates} />;
}
