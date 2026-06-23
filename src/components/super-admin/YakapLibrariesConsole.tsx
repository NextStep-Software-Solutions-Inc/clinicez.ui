"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Trash2, Edit, ExternalLink, Activity, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import {
  getYakapLibraries,
  createYakapLibrary,
  updateYakapLibrary,
  deleteYakapLibrary,
} from "@/actions/super-admin/yakap-library.action";

export function YakapLibrariesConsole() {
  const router = useRouter();
  const [libraries, setLibraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Library state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    setLoading(true);
    const res = await getYakapLibraries();
    if (res.status && res.data) {
      setLibraries(res.data);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName) {
      toast.error("Library name is required");
      return;
    }
    setSubmitting(true);
    const res = await createYakapLibrary({ name: newName, description: newDesc });
    setSubmitting(false);

    if (res.status) {
      toast.success(res.message);
      setIsCreateOpen(false);
      setNewName("");
      setNewDesc("");
      fetchLibraries();
      // Redirect to the newly created library to upload data
      router.push(`/super-admin/yakap-libraries/${res.data.id}`);
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const res = await updateYakapLibrary(id, { isActive: !currentStatus });
    if (res.status) {
      toast.success(res.message);
      fetchLibraries();
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this library and all its rows?")) return;
    const res = await deleteYakapLibrary(id);
    if (res.status) {
      toast.success(res.message);
      fetchLibraries();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Yakap Libraries</h2>
          <p className="text-muted-foreground">Manage PhilHealth Yakap Lookup Tables dynamically.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Library
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Yakap Library</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Library Name</label>
                <Input
                  placeholder="e.g. eClaims_Hospitals"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create Library"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Loading libraries...
                </TableCell>
              </TableRow>
            ) : libraries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No libraries found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              libraries.map((lib) => (
                <TableRow key={lib.id}>
                  <TableCell className="font-medium">{lib.name}</TableCell>
                  <TableCell>{lib.description || "-"}</TableCell>
                  <TableCell>{lib._count?.Rows || 0}</TableCell>
                  <TableCell>
                    <Badge variant={lib.isActive ? "default" : "secondary"}>
                      {lib.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(lib.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/super-admin/yakap-libraries/${lib.id}`)}
                      title="Manage Data"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(lib.id, lib.isActive)}
                      title={lib.isActive ? "Disable" : "Enable"}
                    >
                      {lib.isActive ? <PowerOff className="h-4 w-4 text-red-500" /> : <Activity className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lib.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
