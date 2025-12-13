"use client";

import { useState } from "react";
import { GetAllAppointmentTabs, getAllAppointmentTabsAction, updateAppointmentTabAction, createAppointmentTabAction } from "@actions/super-admin/appointment-tabs.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { toast } from "sonner";
import { Switch } from "@components/ui/switch";
import { Textarea } from "@components/ui/textarea";

interface AppointmentTabsTableProps {
  initialData: GetAllAppointmentTabs;
}

export default function AppointmentTabsTable({ initialData }: AppointmentTabsTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getAllAppointmentTabsAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error("Failed to load appointment tabs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await updateAppointmentTabAction({ id, isActive: !currentStatus });
      toast.success("Appointment tab updated successfully");
      loadData(data.pageNumber);
    } catch (error) {
      toast.error("Failed to update appointment tab");
    }
  };

  const handleCreate = async () => {
    try {
      await createAppointmentTabAction(createForm);
      toast.success("Appointment tab created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", description: "" });
      loadData(1);
    } catch (error) {
      toast.error("Failed to create appointment tab");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search appointment tabs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Appointment Tab
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Appointment Tab</DialogTitle>
              <DialogDescription>Add a new appointment tab to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Tab name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Tab description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
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
              <TableHead>Clinics Using</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No appointment tabs found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((tab) => (
                <TableRow key={tab.id}>
                  <TableCell className="font-medium">{tab.name}</TableCell>
                  <TableCell className="text-sm">{tab.description || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tab._count.ClinicAppointmentTabs}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tab.isActive ? "default" : "secondary"}>
                      {tab.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={tab.isActive}
                      onCheckedChange={() => handleToggleActive(tab.id, tab.isActive)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pageNumber - 1) * data.pageSize + 1} to{" "}
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} tabs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber - 1)}
              disabled={data.pageNumber === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber + 1)}
              disabled={data.pageNumber >= data.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
