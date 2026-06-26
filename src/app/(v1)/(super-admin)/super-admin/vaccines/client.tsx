"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateVaccineAction, createVaccineAction, toggleVaccineStatusAction, deleteVaccineAction } from "@/actions/vaccines/manage-vaccines.action";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Vaccine = any; // Simplify typing for the client data

export function VaccinesClient({ initialData }: { initialData: Vaccine[] }) {
    const [vaccines, setVaccines] = useState<Vaccine[]>(initialData);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Vaccine>>({});

    const handleOpen = (vaccine?: Vaccine) => {
        if (vaccine) {
            setFormData({
                id: vaccine.id,
                name: vaccine.name,
                type: vaccine.type,
                description: vaccine.description || '',
                childImmcode: vaccine.PhilHealthData?.childImmcode || '',
                youngwImmcode: vaccine.PhilHealthData?.youngwImmcode || '',
                pregwImmcode: vaccine.PhilHealthData?.pregwImmcode || '',
                elderlyImmcode: vaccine.PhilHealthData?.elderlyImmcode || '',
                otherImm: vaccine.PhilHealthData?.otherImm || '',
            });
        } else {
            setFormData({
                name: '',
                type: 'VACCINE',
                description: '',
                childImmcode: '',
                youngwImmcode: '',
                pregwImmcode: '',
                elderlyImmcode: '',
                otherImm: '',
            });
        }
        setIsOpen(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const input = {
                name: formData.name!,
                type: formData.type!,
                description: formData.description,
                childImmcode: formData.childImmcode || null,
                youngwImmcode: formData.youngwImmcode || null,
                pregwImmcode: formData.pregwImmcode || null,
                elderlyImmcode: formData.elderlyImmcode || null,
                otherImm: formData.otherImm || null,
            };

            let res;
            if (formData.id) {
                res = await updateVaccineAction(formData.id, input);
            } else {
                res = await createVaccineAction(input);
            }

            if (res.success) {
                toast.success(formData.id ? "Vaccine updated successfully!" : "Vaccine created successfully!");
                setIsOpen(false);
                // Refresh page or optimistically update
                window.location.reload();
            } else {
                toast.error(res.error || "Failed to save vaccine");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        setIsLoading(true);
        try {
            const res = await toggleVaccineStatusAction(id, !currentStatus);
            if (res.success) {
                toast.success("Status updated!");
                window.location.reload();
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch (e) {
            toast.error("Error updating status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this vaccine?")) return;
        setIsLoading(true);
        try {
            const res = await deleteVaccineAction(id);
            if (res.success) {
                toast.success("Vaccine deleted!");
                window.location.reload();
            } else {
                toast.error(res.error || "Failed to delete");
            }
        } catch (e) {
            toast.error("Error deleting vaccine");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpen()} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Vaccine
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Child Code</TableHead>
                            <TableHead>Young W. Code</TableHead>
                            <TableHead>Preg W. Code</TableHead>
                            <TableHead>Elderly Code</TableHead>
                            <TableHead>Other Code</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vaccines.map((v) => (
                            <TableRow key={v.id}>
                                <TableCell className="font-medium">{v.name}</TableCell>
                                <TableCell>{v.type}</TableCell>
                                <TableCell>
                                    <Switch 
                                        checked={v.isActive} 
                                        onCheckedChange={() => handleToggleStatus(v.id, v.isActive)}
                                        disabled={isLoading}
                                    />
                                </TableCell>
                                <TableCell>{v.PhilHealthData?.childImmcode || '-'}</TableCell>
                                <TableCell>{v.PhilHealthData?.youngwImmcode || '-'}</TableCell>
                                <TableCell>{v.PhilHealthData?.pregwImmcode || '-'}</TableCell>
                                <TableCell>{v.PhilHealthData?.elderlyImmcode || '-'}</TableCell>
                                <TableCell>{v.PhilHealthData?.otherImm || '-'}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpen(v)} disabled={isLoading}>
                                        <Edit2 className="w-4 h-4 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} disabled={isLoading}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {vaccines.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-6 text-slate-500">
                                    No vaccines found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{formData.id ? 'Edit Vaccine' : 'Add New Vaccine'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Vaccine Name</Label>
                            <Input 
                                value={formData.name || ''} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. BCG"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Input 
                                value={formData.type || ''} 
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Description</Label>
                            <Input 
                                value={formData.description || ''} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="col-span-2 mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-4 text-slate-600">PhilHealth Konsulta Mappings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Child Immunization Code</Label>
                                    <Input 
                                        value={formData.childImmcode || ''} 
                                        onChange={(e) => setFormData({...formData, childImmcode: e.target.value})}
                                        placeholder="e.g. C01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Young Woman Code</Label>
                                    <Input 
                                        value={formData.youngwImmcode || ''} 
                                        onChange={(e) => setFormData({...formData, youngwImmcode: e.target.value})}
                                        placeholder="e.g. Y01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pregnant Woman Code</Label>
                                    <Input 
                                        value={formData.pregwImmcode || ''} 
                                        onChange={(e) => setFormData({...formData, pregwImmcode: e.target.value})}
                                        placeholder="e.g. P01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Elderly Code</Label>
                                    <Input 
                                        value={formData.elderlyImmcode || ''} 
                                        onChange={(e) => setFormData({...formData, elderlyImmcode: e.target.value})}
                                        placeholder="e.g. E01"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Other Immunization (Fallback text)</Label>
                                    <Input 
                                        value={formData.otherImm || ''} 
                                        onChange={(e) => setFormData({...formData, otherImm: e.target.value})}
                                        placeholder="Used if none of the specific codes apply"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading || !formData.name}>
                            {isLoading ? 'Saving...' : 'Save Vaccine'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
