"use client";

import { useState } from "react";
import {
  GetAllValidIDTypes,
  getAllValidIDTypesAction,
  createValidIDTypeAction,
  updateValidIDTypeAction,
} from "@actions/super-admin/verification.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Label } from "@components/ui/label";
import { Switch } from "@components/ui/switch";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import type { ValidIDLevel } from "@prisma/client";

interface ValidIDTypesTableProps {
  initialData: GetAllValidIDTypes;
}

export default function ValidIDTypesTable({ initialData }: ValidIDTypesTableProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    level: "PRIMARY" as ValidIDLevel,
    automatedVerification: false,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getAllValidIDTypesAction();
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load valid ID types"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("ID type name is required");
      return;
    }
    try {
      await createValidIDTypeAction({
        name: createForm.name,
        level: createForm.level,
        description: createForm.description || undefined,
        automatedVerification: createForm.automatedVerification,
      });
      toast.success("Valid ID type created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", description: "", level: "PRIMARY", automatedVerification: false });
      loadData();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to create valid ID type"));
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateValidIDTypeAction({ id, isActive: !currentActive });
      toast.success(`ID type ${currentActive ? "deactivated" : "activated"} successfully`);
      loadData();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update ID type status"));
    }
  };

  const handleToggleAutomated = async (id: number, currentAutomated: boolean) => {
    try {
      await updateValidIDTypeAction({ id, automatedVerification: !currentAutomated });
      toast.success(`Automated verification ${currentAutomated ? "disabled" : "enabled"} successfully`);
      loadData();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update automated verification"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure the types of valid IDs that users can submit for verification.
        </p>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add ID Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Valid ID Type</DialogTitle>
              <DialogDescription>
                Add a new type of valid ID that users can submit for verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="id-name">Name</Label>
                <Input
                  id="id-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Driver's License"
                />
              </div>
              <div>
                <Label htmlFor="id-description">Description</Label>
                <Input
                  id="id-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label htmlFor="id-level">Level</Label>
                <Select
                  value={createForm.level}
                  onValueChange={(value: ValidIDLevel) => setCreateForm({ ...createForm, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIMARY">Primary</SelectItem>
                    <SelectItem value="SECONDARY">Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="id-automated">Automated Verification</Label>
                <Switch
                  id="id-automated"
                  checked={createForm.automatedVerification}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, automatedVerification: checked })}
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

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Automated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No valid ID types configured. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((idType) => (
                <TableRow key={idType.id}>
                  <TableCell className="font-medium">{idType.name}</TableCell>
                  <TableCell>
                    <Badge variant={idType.level === "PRIMARY" ? "default" : "secondary"}>
                      {idType.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {idType.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={idType.automatedVerification}
                      onCheckedChange={() => handleToggleAutomated(idType.id, idType.automatedVerification)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={idType.isActive ? "default" : "secondary"}>
                      {idType.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={idType.isActive}
                      onCheckedChange={() => handleToggleActive(idType.id, idType.isActive)}
                    />
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
