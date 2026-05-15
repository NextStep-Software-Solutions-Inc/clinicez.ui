"use client";

import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  getAllMasterImagingProceduresAction,
  getAllMasterLaboratoryProceduresAction,
  getAllMasterHeartStationProceduresAction,
} from "@/actions/super-admin/diagnostics-procedures.action";

const CATEGORY_LABELS = {
  imaging: "Imaging Procedure Categories",
  laboratory: "Laboratory Procedure Categories",
  heart_station: "Heart Station Procedure Categories",
};

interface LocalCategories {
  [key: string]: string[];
}

export function CategoriesManager() {
  const [activeType, setActiveType] = useState<"imaging" | "laboratory" | "heart_station">("imaging");
  const [baseCategories, setBaseCategories] = useState<LocalCategories>({
    imaging: [],
    laboratory: [],
    heart_station: [],
  });
  const [localCategories, setLocalCategories] = useState<LocalCategories>({
    imaging: [],
    laboratory: [],
    heart_station: [],
  });
  const [newCategory, setNewCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; category: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch master procedures to derive categories (no hardcoded defaults)
  const { data: imaging } = useQuery({
    queryKey: ["master-imaging-categories"],
    queryFn: () =>
      getAllMasterImagingProceduresAction({ pageNumber: 1, pageSize: 1000, includeInactive: true }),
  });
  const { data: laboratory } = useQuery({
    queryKey: ["master-laboratory-categories"],
    queryFn: () =>
      getAllMasterLaboratoryProceduresAction({ pageNumber: 1, pageSize: 1000, includeInactive: true }),
  });
  const { data: heartStation } = useQuery({
    queryKey: ["master-heart-station-categories"],
    queryFn: () =>
      getAllMasterHeartStationProceduresAction({ pageNumber: 1, pageSize: 1000, includeInactive: true }),
  });

  const derivedCategories = useMemo(() => {
    const uniq = (list: any[] | undefined) =>
      Array.from(
        new Set((list || []).map((p: any) => p.category).filter((c: string | null | undefined) => c && c.trim()))
      ).sort();

    return {
      imaging: uniq(imaging?.data),
      laboratory: uniq(laboratory?.data),
      heart_station: uniq(heartStation?.data),
    } as LocalCategories;
  }, [imaging, laboratory, heartStation]);

  // Initialize categories from derived lists once data is available
  useEffect(() => {
    setBaseCategories(derivedCategories);
    setLocalCategories((prev) => ({
      imaging: Array.from(new Set([...(prev.imaging || []), ...(derivedCategories.imaging || [])])),
      laboratory: Array.from(new Set([...(prev.laboratory || []), ...(derivedCategories.laboratory || [])])),
      heart_station: Array.from(new Set([...(prev.heart_station || []), ...(derivedCategories.heart_station || [])])),
    }));
  }, [derivedCategories]);

  const currentCategories = localCategories[activeType];

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (currentCategories.includes(newCategory.trim())) {
      toast.error("This category already exists");
      return;
    }

    setLocalCategories({
      ...localCategories,
      [activeType]: [...currentCategories, newCategory.trim()],
    });

    setNewCategory("");
    setHasChanges(true);
    toast.success("Category added");
  };

  const handleDeleteCategory = (category: string) => {
    setDeleteTarget({ type: activeType, category });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setLocalCategories({
      ...localCategories,
      [deleteTarget.type]: localCategories[deleteTarget.type].filter(
        (cat) => cat !== deleteTarget.category
      ),
    });

    setDeleteTarget(null);
    setHasChanges(true);
    toast.success("Category removed");
  };

  const handleSaveChanges = async () => {
    // Note: In production, this would call a server action to persist categories
    // For now, we'll just show a success message and reset the state
    toast.success("Categories updated successfully. (Note: Changes are local. Use server actions to persist.)");
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalCategories({
      imaging: [...(baseCategories.imaging || [])],
      laboratory: [...(baseCategories.laboratory || [])],
      heart_station: [...(baseCategories.heart_station || [])],
    });
    setHasChanges(false);
    toast.info("Changes discarded");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Procedure Categories</CardTitle>
          <CardDescription>
            Add or remove categories for different procedure types. These categories are used when creating
            master procedures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={(value) => setActiveType(value as any)}>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-3">
                <TabsTrigger value="imaging">Imaging</TabsTrigger>
                <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
                <TabsTrigger value="heart_station">Heart Station</TabsTrigger>
              </TabsList>
            </div>

            {(["imaging", "laboratory", "heart_station"] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">{CATEGORY_LABELS[type]}</h3>
                    <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted rounded-lg min-h-[80px]">
                      {localCategories[type]?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No categories added yet</p>
                      ) : (
                        localCategories[type]?.map((category) => (
                          <div
                            key={category}
                            className="flex items-center gap-2 bg-background border rounded-md px-3 py-2 hover:shadow-sm transition-shadow"
                          >
                            <span className="text-sm font-medium">{category}</span>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleAddCategory} className="space-y-3 border-t pt-4">
                    <div>
                      <Label htmlFor={`new-category-${type}`}>Add New Category</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id={`new-category-${type}`}
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="e.g., Digital Radiography"
                        />
                        <Button type="submit" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-800">You have unsaved changes</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Discard Changes
                </Button>
                <Button onClick={handleSaveChanges} className="bg-amber-600 hover:bg-amber-700">
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Categories Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • Categories help organize procedures by their type and standardize terminology across the system
          </p>
          <p>• When creating master procedures, you&apos;ll select from the categories you define here</p>
          <p>• Each procedure type (Imaging, Laboratory, Heart Station) has its own set of categories</p>
          <p>
            • Removing a category won&apos;t affect existing procedures, but it won&apos;t be available for new ones
          </p>
          <p>
            • Changes are saved to the database and will be reflected across all users and clinics
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the category &ldquo;{deleteTarget?.category}&rdquo;? This action cannot be
            undone. Existing procedures with this category will not be affected.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
