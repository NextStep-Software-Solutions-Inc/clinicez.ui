"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, FileText, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Each from "@/components/utils/Each";
import {
  GetNoteTemplatesWithSections,
  createNoteTemplateAction,
  createNoteSectionAction,
  deleteNoteTemplateAction,
  deleteNoteSectionAction,
  updateNoteTemplateAction,
  updateNoteSectionAction,
  updateNoteSectionsSortOrderAction,
} from "@/actions/note-template.action";
import { promiseWrapper } from "@/lib/with-error-handling";
import { getActionErrorMessage } from "@/lib/action-error";

type NoteTemplate = GetNoteTemplatesWithSections[number];
type NoteSection = NoteTemplate["NoteSections"][number];

interface NoteTemplateManagerProps {
  initialData: GetNoteTemplatesWithSections;
}

// ─── Root manager ────────────────────────────────────────────────────────────

export default function NoteTemplateManager({ initialData }: NoteTemplateManagerProps) {
  const [templates, setTemplates] = useState(initialData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      const result = await createNoteTemplateAction({ name });
      if (result.status && result.data) {
        toast.success(result.message);
        setTemplates(prev => {
          const newTemplate = { ...result.data, NoteSections: [] } as NoteTemplate;
          return [...prev, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
        });
        setIsCreateOpen(false);
        setCreateName("");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, "Failed to create note template"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateOpen(false);
    setCreateName("");
  };

  const handleUpdateTemplate = (updated: NoteTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleMove = async (template: NoteTemplate, fromIndex: number, toIndex: number) => {
    const sections = [...template.NoteSections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    const reordered = sections.map((s, idx) => ({ ...s, sortOrder: idx }));
    const previousSections = template.NoteSections;

    setTemplates(prev =>
      prev.map(t => t.id === template.id ? { ...t, NoteSections: reordered } : t)
    );

    toast.promise(
      promiseWrapper(updateNoteSectionsSortOrderAction)(
        reordered.map(({ id, sortOrder }) => ({ id, sortOrder }))
      ),
      {
        loading: "Saving order...",
        success: res => res.message,
        error: err => {
          setTemplates(prev =>
            prev.map(t => t.id === template.id ? { ...t, NoteSections: previousSections } : t)
          );
          return err;
        },
      }
    );
  };

  const handleSectionCreated = (templateId: number, section: NoteSection) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? {
              ...t,
              NoteSections: [...t.NoteSections, section].sort(
                (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
              ),
            }
          : t
      )
    );
  };

  const handleSectionUpdated = (templateId: number, section: NoteSection) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? { ...t, NoteSections: t.NoteSections.map(s => s.id === section.id ? section : s) }
          : t
      )
    );
  };

  const handleSectionDeleted = (templateId: number, sectionId: number) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? { ...t, NoteSections: t.NoteSections.filter(s => s.id !== sectionId) }
          : t
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <CardTitle className="text-lg">Note Templates</CardTitle>
            <CardDescription>
              Manage consultation note templates and their sections. Sections are displayed
              in the configured order during consultations.
            </CardDescription>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">No note templates found.</p>
        )}
        <Each
          of={templates}
          render={template => (
            <TemplateCard
              key={template.id}
              template={template}
              onMove={handleMove}
              onTemplateUpdated={handleUpdateTemplate}
              onTemplateDeleted={handleDeleteTemplate}
              onSectionCreated={handleSectionCreated}
              onSectionUpdated={handleSectionUpdated}
              onSectionDeleted={handleSectionDeleted}
            />
          )}
        />
      </CardContent>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Note Template</DialogTitle>
            <DialogDescription>Add a new note template to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              placeholder="e.g. SOAP, Progress Note"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !createName.trim()}>
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onMove,
  onTemplateUpdated,
  onTemplateDeleted,
  onSectionCreated,
  onSectionUpdated,
  onSectionDeleted,
}: {
  template: NoteTemplate;
  onMove: (template: NoteTemplate, from: number, to: number) => void;
  onTemplateUpdated: (t: NoteTemplate) => void;
  onTemplateDeleted: (id: number) => void;
  onSectionCreated: (templateId: number, section: NoteSection) => void;
  onSectionUpdated: (templateId: number, section: NoteSection) => void;
  onSectionDeleted: (templateId: number, sectionId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [editName, setEditName] = useState(template.name);
  const [editActive, setEditActive] = useState(template.isActive);
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(template.name);
    setEditActive(template.isActive);
    setIsEditOpen(true);
  };

  const openDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteOpen(true);
  };

  const handleUpdate = async () => {
    const name = editName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      const result = await updateNoteTemplateAction({ id: template.id, name, isActive: editActive });
      if (result.status && result.data) {
        toast.success(result.message);
        onTemplateUpdated({ ...template, name: result.data.name, isActive: result.data.isActive });
        setIsEditOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, "Failed to update note template"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteNoteTemplateAction(template.id);
      if (result.status) {
        toast.success(result.message);
        onTemplateDeleted(template.id);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, "Failed to delete note template"));
    }
  };

  return (
    <div className="rounded-md border">
      {/* Header row */}
      <div className="flex items-center gap-1 pl-3 pr-1">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 py-3 text-left hover:bg-muted/50 transition-colors min-w-0"
          onClick={() => setOpen(prev => !prev)}
          aria-expanded={open}
          aria-label={`Toggle ${template.name} sections`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{template.name}</span>
            <Badge variant="outline" className="shrink-0">{template.NoteSections.length} sections</Badge>
            {!template.isActive && <Badge variant="secondary" className="shrink-0">Inactive</Badge>}
          </div>
          <div className="ml-auto shrink-0">
            {open
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={openEdit}
          aria-label={`Edit ${template.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          onClick={openDelete}
          aria-label={`Delete ${template.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded sections */}
      {open && (
        <div className="border-t px-3 pb-3 pt-2 space-y-1">
          {template.NoteSections.length === 0 && (
            <p className="text-sm text-muted-foreground py-1">No sections defined.</p>
          )}
          <Each
            of={template.NoteSections}
            render={(section, index) => (
              <SectionRow
                key={section.id}
                section={section}
                index={index}
                total={template.NoteSections.length}
                onMoveUp={() => onMove(template, index, index - 1)}
                onMoveDown={() => onMove(template, index, index + 1)}
                onSectionUpdated={s => onSectionUpdated(template.id, s)}
                onSectionDeleted={id => onSectionDeleted(template.id, id)}
              />
            )}
          />
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setIsAddSectionOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </Button>
          </div>
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note Template</DialogTitle>
            <DialogDescription>Update the template name or active status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${template.id}`}>Name</Label>
              <Input
                id={`edit-name-${template.id}`}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleUpdate()}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id={`edit-active-${template.id}`}
                checked={editActive}
                onCheckedChange={setEditActive}
              />
              <Label htmlFor={`edit-active-${template.id}`}>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSaving || !editName.trim()}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template AlertDialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{template.name}&rdquo;? This will soft-delete the
              template (marked inactive) and clinics currently using it will no longer see its sections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Section Dialog */}
      <SectionFormDialog
        open={isAddSectionOpen}
        onOpenChange={setIsAddSectionOpen}
        title="Add Section"
        description="Add a new section to this note template."
        onSubmit={async (values) => {
          const result = await createNoteSectionAction({ noteTemplateId: template.id, ...values });
          if (result.status && result.data) {
            toast.success(result.message);
            onSectionCreated(template.id, result.data);
            setIsAddSectionOpen(false);
          } else {
            toast.error(result.message);
          }
        }}
      />
    </div>
  );
}

// ─── Section row ─────────────────────────────────────────────────────────────

function SectionRow({
  section,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onSectionUpdated,
  onSectionDeleted,
}: {
  section: NoteSection;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSectionUpdated: (s: NoteSection) => void;
  onSectionDeleted: (id: number) => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const result = await deleteNoteSectionAction(section.id);
      if (result.status) {
        toast.success(result.message);
        onSectionDeleted(section.id);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, "Failed to delete section"));
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-sm px-1 py-1 hover:bg-muted/40">
      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{section.label || section.name}</span>
        {section.label && section.label !== section.name && (
          <span className="ml-1.5 text-xs text-muted-foreground">({section.name})</span>
        )}
        {!section.isActive && (
          <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost" size="icon" className="h-7 w-7"
          disabled={index === 0} onClick={onMoveUp} aria-label="Move section up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7"
          disabled={index === total - 1} onClick={onMoveDown} aria-label="Move section down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setIsEditOpen(true)} aria-label={`Edit section ${section.name}`}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => setIsDeleteOpen(true)} aria-label={`Delete section ${section.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Edit Section Dialog */}
      <SectionFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Section"
        description="Update section details."
        initialValues={{
          name: section.name,
          label: section.label,
          description: section.description ?? "",
          showOnPatient: section.showOnPatient,
          isActive: section.isActive,
        }}
        showIsActive
        onSubmit={async (values) => {
          const result = await updateNoteSectionAction({ id: section.id, ...values });
          if (result.status && result.data) {
            toast.success(result.message);
            onSectionUpdated(result.data);
            setIsEditOpen(false);
          } else {
            toast.error(result.message);
          }
        }}
      />

      {/* Delete Section AlertDialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the &ldquo;{section.label || section.name}&rdquo; section?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Shared section form dialog ───────────────────────────────────────────────

type SectionFormValues = {
  name: string;
  label: string;
  description: string;
  showOnPatient: boolean;
  isActive?: boolean;
};

function SectionFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValues,
  showIsActive = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  initialValues?: SectionFormValues;
  showIsActive?: boolean;
  onSubmit: (values: SectionFormValues) => Promise<void>;
}) {
  const defaults: SectionFormValues = { name: "", label: "", description: "", showOnPatient: true, isActive: true };
  const [form, setForm] = useState<SectionFormValues>(initialValues ?? defaults);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initialValues ?? defaults);
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        label: form.label.trim(),
        description: form.description.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Name <span className="text-muted-foreground text-xs">(internal key)</span></Label>
            <Input
              id="section-name"
              placeholder="e.g. subjective"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-label">Label <span className="text-muted-foreground text-xs">(display name)</span></Label>
            <Input
              id="section-label"
              placeholder="e.g. Subjective"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              id="section-description"
              placeholder="Brief description of this section…"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="section-show-on-patient"
              checked={form.showOnPatient}
              onCheckedChange={v => setForm(f => ({ ...f, showOnPatient: v }))}
            />
            <Label htmlFor="section-show-on-patient">Visible to patient</Label>
          </div>
          {showIsActive && (
            <div className="flex items-center gap-3">
              <Switch
                id="section-is-active"
                checked={form.isActive ?? true}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="section-is-active">Active</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

