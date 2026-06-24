"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { getMasterListRecordsAction, saveMasterListRecordAction, deleteMasterListRecordAction } from "@/actions/super-admin/master-list.action"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"

export function MasterListConsole({ slug }: { slug: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    loadData()
  }, [slug])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getMasterListRecordsAction(slug)
      if (res.data) setRecords(res.data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      // Cast generic strings
      const payload = { ...data }
      if (payload.sortOrder) payload.sortOrder = parseInt(payload.sortOrder)
      if (payload.isActive === "true" || payload.isActive === true) payload.isActive = true;
      else payload.isActive = false;
      
      const res = await saveMasterListRecordAction(slug, { id: editingId, ...payload })
      if (res.data) {
        toast.success(res.message)
        setIsDialogOpen(false)
        loadData()
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    reset(record)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingId(null)
    reset({ isActive: true })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteMasterListRecordAction(slug, id)
      toast.success("Record deleted")
      setRecords(records.filter(r => r.id !== id))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight capitalize">{slug.replace(/-/g, " ")}</h2>
          <p className="text-muted-foreground">Manage entries for the {slug.replace(/-/g, " ")} master list.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add Record
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code/YakapCode</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category/Desc</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : records.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.code || r.yakapCode || "-"}</TableCell>
                  <TableCell>{r.name || "-"}</TableCell>
                  <TableCell>{r.category || r.description || "-"}</TableCell>
                  <TableCell>{r.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Record" : "Add Record"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Code / YakapCode</Label>
              <Input {...register(slug.includes("medicine") ? "yakapCode" : "code")} placeholder="Enter code" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Enter name" />
            </div>
            <div className="space-y-2">
              <Label>Category / Description</Label>
              <Input {...register(slug === "icd" ? "category" : "description")} placeholder="Enter category or description" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register("isActive")} id="isActive" />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
