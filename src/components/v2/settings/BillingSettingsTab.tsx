"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Save,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Receipt,
  FileSpreadsheet,
  Tag,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  upsertClinicBillingSettingAction,
  type UpsertClinicBillingSettingInput,
} from "@/actions/clinics/clinic-billing-setting.action";
import {
  getClinicPriceItemsAction,
  createClinicPriceItemAction,
  updateClinicPriceItemAction,
  deleteClinicPriceItemAction,
  seedStandardClinicPricesAction,
} from "@/actions/clinics/clinic-price-item.action";
import type { ClinicBillingMode, PriceCategory } from "@prisma/client";

interface BillingSettingsTabProps {
  clinicUid: string;
  initialBillingSetting: any;
  canManageSettings: boolean;
}

const PRICE_CATEGORIES: { label: string; value: PriceCategory }[] = [
  { label: "All Categories", value: "" as any },
  { label: "Consultation", value: "CONSULTATION" },
  { label: "Laboratory", value: "LABORATORY" },
  { label: "Imaging / Radiology", value: "IMAGING" },
  { label: "Heart Station", value: "HEART_STATION" },
  { label: "Procedures", value: "PROCEDURE" },
  { label: "Medications", value: "MEDICATION" },
  { label: "Supplies", value: "SUPPLIES" },
  { label: "Other / Certificates", value: "OTHER" },
];

export function BillingSettingsTab({
  clinicUid,
  initialBillingSetting,
  canManageSettings,
}: BillingSettingsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<"general" | "prices">("general");

  // Setting form state
  const [billingMode, setBillingMode] = useState<ClinicBillingMode>(
    initialBillingSetting?.billingMode ?? "COMMERCIAL"
  );
  const [currency, setCurrency] = useState(initialBillingSetting?.currency ?? "PHP");
  const [isVatRegistered, setIsVatRegistered] = useState(
    Boolean(initialBillingSetting?.isVatRegistered)
  );
  const [vatRate, setVatRate] = useState(Number(initialBillingSetting?.vatRate ?? 12.0));
  const [tinNumber, setTinNumber] = useState(initialBillingSetting?.tinNumber ?? "");
  const [birPermitNumber, setBirPermitNumber] = useState(
    initialBillingSetting?.birPermitNumber ?? ""
  );
  const [registeredBusinessName, setRegisteredBusinessName] = useState(
    initialBillingSetting?.registeredBusinessName ?? ""
  );
  const [registeredAddress, setRegisteredAddress] = useState(
    initialBillingSetting?.registeredAddress ?? ""
  );
  const [invoicePrefix, setInvoicePrefix] = useState(
    initialBillingSetting?.invoicePrefix ?? "INV-"
  );
  const [receiptPrefix, setReceiptPrefix] = useState(
    initialBillingSetting?.receiptPrefix ?? "OR-"
  );
  const [receiptFooterNotes, setReceiptFooterNotes] = useState(
    initialBillingSetting?.receiptFooterNotes ??
      "Thank you for choosing our clinic. This document serves as your official collection receipt."
  );
  const [enableDoctorPfTracking, setEnableDoctorPfTracking] = useState(
    initialBillingSetting?.enableDoctorPfTracking ?? true
  );
  const [enableHmoBilling, setEnableHmoBilling] = useState(
    initialBillingSetting?.enableHmoBilling ?? true
  );

  // Price catalog state
  const [priceItems, setPriceItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // New/Edit Item Form State
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<PriceCategory>("CONSULTATION");
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(500);
  const [itemIsVatable, setItemIsVatable] = useState(true);
  const [itemDoctorShare, setItemDoctorShare] = useState<number | "">("");

  // Load price items
  const loadPriceItems = () => {
    startTransition(async () => {
      const res = await getClinicPriceItemsAction(
        clinicUid,
        selectedCategory ? (selectedCategory as PriceCategory) : undefined,
        searchQuery
      );
      if (res.status) {
        setPriceItems(res.data);
      }
    });
  };

  useEffect(() => {
    loadPriceItems();
  }, [selectedCategory]);

  const handleSaveSettings = () => {
    if (!canManageSettings) {
      toast.error("You do not have permission to update billing settings.");
      return;
    }

    startTransition(async () => {
      const payload: UpsertClinicBillingSettingInput = {
        clinicUid,
        billingMode,
        currency,
        isVatRegistered,
        vatRate,
        tinNumber: tinNumber.trim() || null,
        birPermitNumber: birPermitNumber.trim() || null,
        registeredBusinessName: registeredBusinessName.trim() || null,
        registeredAddress: registeredAddress.trim() || null,
        invoicePrefix: invoicePrefix.trim() || "INV-",
        receiptPrefix: receiptPrefix.trim() || "OR-",
        receiptFooterNotes: receiptFooterNotes.trim() || null,
        enableDoctorPfTracking,
        enableHmoBilling,
      };

      const res = await upsertClinicBillingSettingAction(payload);
      if (res.status) {
        toast.success("Billing settings updated successfully. Reload page to see updated sidebar.");
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setItemCode("");
    setItemName("");
    setItemCategory("CONSULTATION");
    setItemUnitPrice(500);
    setItemIsVatable(true);
    setItemDoctorShare(70);
    setIsItemDialogOpen(true);
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItem(item);
    setItemCode(item.code || "");
    setItemName(item.name);
    setItemCategory(item.category);
    setItemUnitPrice(Number(item.unitPrice));
    setItemIsVatable(Boolean(item.isVatable));
    setItemDoctorShare(item.defaultDoctorSharePercent ? Number(item.defaultDoctorSharePercent) : "");
    setIsItemDialogOpen(true);
  };

  const handleSavePriceItem = () => {
    if (!itemName.trim()) {
      toast.error("Item name is required.");
      return;
    }
    if (itemUnitPrice < 0 || isNaN(itemUnitPrice)) {
      toast.error("Unit price must be a valid non-negative number.");
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateClinicPriceItemAction({
          priceItemId: editingItem.id,
          clinicUid,
          code: itemCode.trim() || undefined,
          name: itemName.trim(),
          category: itemCategory,
          unitPrice: Number(itemUnitPrice),
          isVatable: itemIsVatable,
          defaultDoctorSharePercent: itemDoctorShare !== "" ? Number(itemDoctorShare) : null,
        });
        if (res.status) {
          toast.success("Price item updated.");
          setIsItemDialogOpen(false);
          loadPriceItems();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createClinicPriceItemAction({
          clinicUid,
          code: itemCode.trim() || undefined,
          name: itemName.trim(),
          category: itemCategory,
          unitPrice: Number(itemUnitPrice),
          isVatable: itemIsVatable,
          defaultDoctorSharePercent: itemDoctorShare !== "" ? Number(itemDoctorShare) : undefined,
        });
        if (res.status) {
          toast.success("Price item added to catalog.");
          setIsItemDialogOpen(false);
          loadPriceItems();
        } else {
          toast.error(res.message);
        }
      }
    });
  };

  const handleDeleteItem = (itemId: number) => {
    if (!confirm("Are you sure you want to remove this price item?")) return;
    startTransition(async () => {
      const res = await deleteClinicPriceItemAction(itemId);
      if (res.status) {
        toast.success("Price item removed.");
        loadPriceItems();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleSeedStandardPrices = () => {
    if (!confirm("This will seed standard consultation, laboratory, imaging, and procedure prices into your catalog. Continue?")) {
      return;
    }
    startTransition(async () => {
      const res = await seedStandardClinicPricesAction(clinicUid);
      if (res.status) {
        toast.success(`Standard prices loaded! Added ${res.data?.count} items.`);
        loadPriceItems();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex gap-2">
          <Button
            variant={activeSubTab === "general" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("general")}
            className="gap-1.5"
          >
            <CreditCard className="h-4 w-4" />
            Billing & Invoicing Rules
          </Button>
          <Button
            variant={activeSubTab === "prices" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("prices")}
            className="gap-1.5"
          >
            <Tag className="h-4 w-4" />
            Price Catalog Master ({priceItems.length})
          </Button>
        </div>

        {activeSubTab === "general" && canManageSettings && (
          <Button onClick={handleSaveSettings} disabled={isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Billing Settings"}
          </Button>
        )}
      </div>

      {activeSubTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clinic Billing Mode Card */}
          <Card className="col-span-1 md:col-span-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Clinic Operational Mode
                  </CardTitle>
                  <CardDescription>
                    Select how this clinic operates. Commercial mode enables cashier POS, invoicing, and accounting.
                  </CardDescription>
                </div>
                <Badge variant={billingMode === "COMMERCIAL" ? "default" : "secondary"}>
                  {billingMode}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => canManageSettings && setBillingMode("COMMERCIAL")}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingMode === "COMMERCIAL"
                      ? "border-primary bg-background shadow-sm"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    Commercial (Private)
                    {billingMode === "COMMERCIAL" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Private fee-for-service clinic. Enables Cashier Counter, Patient Invoices, Official Receipts, and Accounting.
                  </p>
                </div>

                <div
                  onClick={() => canManageSettings && setBillingMode("HYBRID")}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingMode === "HYBRID"
                      ? "border-primary bg-background shadow-sm"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    Hybrid Clinic
                    {billingMode === "HYBRID" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Operates both PhilHealth Konsulta capitation and commercial billing for private/walk-in services.
                  </p>
                </div>

                <div
                  onClick={() => canManageSettings && setBillingMode("DISABLED")}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    billingMode === "DISABLED"
                      ? "border-primary bg-background shadow-sm"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    Non-Commercial / Subsidized
                    {billingMode === "DISABLED" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pure subsidized or Konsulta-only facility. Cashier and accounting menus will remain hidden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BIR & Tax Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Philippine Tax & BIR Details (EOPT Act)
              </CardTitle>
              <CardDescription>
                Tax identifiers displayed on patient Sales Invoices and Official Receipts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="regName">Registered Business Name</Label>
                <Input
                  id="regName"
                  value={registeredBusinessName}
                  onChange={(e) => setRegisteredBusinessName(e.target.value)}
                  placeholder="e.g. NextStep Health Medical Clinic Inc."
                  disabled={!canManageSettings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regAddress">Registered Business Address</Label>
                <Textarea
                  id="regAddress"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="Unit 101, Medical Tower, Manila"
                  rows={2}
                  disabled={!canManageSettings}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN Number</Label>
                  <Input
                    id="tin"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="000-000-000-000"
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permit">BIR Permit / ATP / CAS No.</Label>
                  <Input
                    id="permit"
                    value={birPermitNumber}
                    onChange={(e) => setBirPermitNumber(e.target.value)}
                    placeholder="e.g. CAS-2026-XXXX"
                    disabled={!canManageSettings}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>VAT Registered Entity</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable if the clinic charges 12% Value Added Tax on non-exempt services.
                  </p>
                </div>
                <Switch
                  checked={isVatRegistered}
                  onCheckedChange={setIsVatRegistered}
                  disabled={!canManageSettings}
                />
              </div>

              {isVatRegistered && (
                <div className="space-y-2 border-t pt-3">
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    disabled={!canManageSettings}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice & Receipt Series Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Document Numbering & Layout
              </CardTitle>
              <CardDescription>
                Serial prefixes and layout settings for customer documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invPrefix">Sales Invoice Prefix</Label>
                  <Input
                    id="invPrefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orPrefix">Official Receipt Prefix</Label>
                  <Input
                    id="orPrefix"
                    value={receiptPrefix}
                    onChange={(e) => setReceiptPrefix(e.target.value)}
                    placeholder="OR-"
                    disabled={!canManageSettings}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerNotes">Receipt Footer Notice</Label>
                <Textarea
                  id="footerNotes"
                  value={receiptFooterNotes}
                  onChange={(e) => setReceiptFooterNotes(e.target.value)}
                  placeholder="Official notice or thank you message at the bottom of thermal receipts"
                  rows={3}
                  disabled={!canManageSettings}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      Doctor Professional Fee (PF) Tracking
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Track doctor share per procedure and generate payout liquidations.
                    </p>
                  </div>
                  <Switch
                    checked={enableDoctorPfTracking}
                    onCheckedChange={setEnableDoctorPfTracking}
                    disabled={!canManageSettings}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                      HMO & Corporate Receivables Billing
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow billing insurance/HMO providers with patient co-payment splits.
                    </p>
                  </div>
                  <Switch
                    checked={enableHmoBilling}
                    onCheckedChange={setEnableHmoBilling}
                    disabled={!canManageSettings}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSubTab === "prices" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Master Price Catalog
                </CardTitle>
                <CardDescription>
                  Configure official clinic charges for doctor consultations, diagnostic tests, and procedures.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {priceItems.length === 0 && canManageSettings && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeedStandardPrices}
                    disabled={isPending}
                    className="gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    Seed Standard Prices
                  </Button>
                )}

                {canManageSettings && (
                  <Button size="sm" onClick={handleOpenNewItem} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Price Item
                  </Button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search item by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPriceItems()}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[220px] h-9">
                  <SelectValue placeholder="Category Filter" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {priceItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-3 border rounded-md border-dashed">
                <Tag className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="font-medium text-sm">No price items found in the catalog.</p>
                <p className="text-xs max-w-sm mx-auto">
                  Click "Seed Standard Prices" to quickly load common clinic items or click "Add Price Item" to define your custom fees.
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Code</TableHead>
                      <TableHead>Service / Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Unit Price ({currency})</TableHead>
                      <TableHead className="text-center">Doctor Share</TableHead>
                      <TableHead className="text-center">Tax</TableHead>
                      {canManageSettings && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.code || "—"}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₱{Number(item.unitPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {item.defaultDoctorSharePercent ? (
                            <span className="text-emerald-600 font-medium">
                              {Number(item.defaultDoctorSharePercent)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isVatable ? (
                            <Badge variant="secondary" className="text-[10px]">
                              12% VAT
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Exempt
                            </Badge>
                          )}
                        </TableCell>
                        {canManageSettings && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEditItem(item)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Price Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Price Item" : "Add New Price Catalog Item"}
            </DialogTitle>
            <DialogDescription>
              Set the standard fee, classification, and doctor revenue share percentage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Code (Optional)</Label>
                <Input
                  id="itemCode"
                  placeholder="e.g. LAB-CBC"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="itemCat">Category</Label>
                <Select
                  value={itemCategory}
                  onValueChange={(val) => setItemCategory(val as PriceCategory)}
                >
                  <SelectTrigger id="itemCat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_CATEGORIES.filter((c) => c.value).map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Item / Service Name</Label>
              <Input
                id="itemName"
                placeholder="e.g. Complete Blood Count (CBC)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ({currency})</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorShare">Doctor Share (% PF)</Label>
                <Input
                  id="doctorShare"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 70"
                  value={itemDoctorShare}
                  onChange={(e) =>
                    setItemDoctorShare(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div className="space-y-0.5">
                <Label>Subject to 12% VAT</Label>
                <p className="text-xs text-muted-foreground">
                  Uncheck for VAT-exempt medications or medical consultation services.
                </p>
              </div>
              <Switch checked={itemIsVatable} onCheckedChange={setItemIsVatable} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePriceItem} disabled={isPending}>
              {isPending ? "Saving..." : editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
