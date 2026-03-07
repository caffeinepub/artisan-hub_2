import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Loader2, Music, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Variant_percentage_fixedAmount } from "../backend";
import type { DiscountCode } from "../backend";
import {
  useCreateDiscountCode,
  useDeleteDiscountCode,
  useDiscountCodes,
  usePaymentSettings,
  useUpdateDiscountCode,
  useUpdatePaymentSettings,
} from "../hooks/useQueries";

interface DiscountCodeFormData {
  id: string;
  code: string;
  discountType: Variant_percentage_fixedAmount;
  value: string;
  active: boolean;
}

const emptyForm: DiscountCodeFormData = {
  id: "",
  code: "",
  discountType: Variant_percentage_fixedAmount.percentage,
  value: "",
  active: true,
};

export default function PaymentSettingsTab() {
  const { data: discountCodes = [], isLoading: codesLoading } =
    useDiscountCodes();
  const { data: paymentSettings, isLoading: settingsLoading } =
    usePaymentSettings();
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const deleteCode = useDeleteDiscountCode();
  const updateSettings = useUpdatePaymentSettings();

  // Discount code form state
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [codeForm, setCodeForm] = useState<DiscountCodeFormData>(emptyForm);
  const [codeFormError, setCodeFormError] = useState("");

  // Payment settings form state
  const [proAppUrl, setProAppUrl] = useState("");
  const [bonusTitle, setBonusTitle] = useState("");
  const [bonusDescription, setBonusDescription] = useState("");
  const [bonusUrl, setBonusUrl] = useState("");
  const [bonusEnabled, setBonusEnabled] = useState(false);

  useEffect(() => {
    if (paymentSettings) {
      setProAppUrl(paymentSettings.proOcarinaAppUrl);
      setBonusTitle(paymentSettings.bonusItemConfig.title);
      setBonusDescription(paymentSettings.bonusItemConfig.description);
      setBonusUrl(paymentSettings.bonusItemConfig.url);
      setBonusEnabled(paymentSettings.bonusItemConfig.enabled);
    }
  }, [paymentSettings]);

  const openCreateDialog = () => {
    setEditingCode(null);
    setCodeForm(emptyForm);
    setCodeFormError("");
    setCodeDialogOpen(true);
  };

  const openEditDialog = (code: DiscountCode) => {
    setEditingCode(code);
    setCodeForm({
      id: code.id,
      code: code.code,
      discountType: code.discountType,
      value: code.value.toString(),
      active: code.active,
    });
    setCodeFormError("");
    setCodeDialogOpen(true);
  };

  const handleSaveCode = async () => {
    setCodeFormError("");
    if (!codeForm.code.trim()) {
      setCodeFormError("Code is required");
      return;
    }
    const numValue = Number.parseFloat(codeForm.value);
    if (Number.isNaN(numValue) || numValue <= 0) {
      setCodeFormError("Value must be a positive number");
      return;
    }
    if (
      codeForm.discountType === Variant_percentage_fixedAmount.percentage &&
      numValue > 100
    ) {
      setCodeFormError("Percentage cannot exceed 100");
      return;
    }

    try {
      if (editingCode) {
        await updateCode.mutateAsync({
          id: codeForm.id,
          code: codeForm.code.trim().toUpperCase(),
          discountType: codeForm.discountType,
          value: numValue,
          active: codeForm.active,
        });
      } else {
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await createCode.mutateAsync({
          id: newId,
          code: codeForm.code.trim().toUpperCase(),
          discountType: codeForm.discountType,
          value: numValue,
        });
      }
      setCodeDialogOpen(false);
    } catch {
      // errors handled by mutation hooks
    }
  };

  const handleSaveSettings = async () => {
    await updateSettings.mutateAsync({
      proOcarinaAppUrl: proAppUrl.trim(),
      bonusItemConfig: {
        title: bonusTitle.trim(),
        description: bonusDescription.trim(),
        url: bonusUrl.trim(),
        enabled: bonusEnabled,
      },
    });
  };

  const isSavingCode = createCode.isPending || updateCode.isPending;

  return (
    <div className="space-y-8">
      {/* Discount Codes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Discount Codes</CardTitle>
                <CardDescription>
                  Create and manage promo codes for customers to use at checkout
                </CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {codesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : discountCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No discount codes yet. Create your first promo code.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((dc) => (
                  <TableRow key={dc.id}>
                    <TableCell className="font-mono font-semibold">
                      {dc.code}
                    </TableCell>
                    <TableCell>
                      {dc.discountType ===
                      Variant_percentage_fixedAmount.percentage
                        ? "Percentage Off"
                        : "Fixed Amount"}
                    </TableCell>
                    <TableCell>
                      {dc.discountType ===
                      Variant_percentage_fixedAmount.percentage
                        ? `${dc.value}%`
                        : `$${dc.value.toFixed(2)} AUD`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={dc.active ? "default" : "secondary"}>
                        {dc.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(dc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Discount Code
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the code{" "}
                                <strong>{dc.code}</strong>? This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteCode.mutate(dc.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bonus Item Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Bonus Item</CardTitle>
              <CardDescription>
                Configure a free digital bonus item that appears on every order
                confirmation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="bonus-enabled"
                  checked={bonusEnabled}
                  onCheckedChange={setBonusEnabled}
                />
                <Label htmlFor="bonus-enabled">
                  Enable bonus item on order confirmations
                </Label>
              </div>
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bonus-title">Title</Label>
                  <Input
                    id="bonus-title"
                    placeholder="e.g. Pro Ocarina Learning App"
                    value={bonusTitle}
                    onChange={(e) => setBonusTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bonus-description">Description</Label>
                  <Textarea
                    id="bonus-description"
                    placeholder="e.g. Learn to read ocarina tablature and compose music with our free app included with every purchase."
                    value={bonusDescription}
                    onChange={(e) => setBonusDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bonus-url">Access URL</Label>
                  <Input
                    id="bonus-url"
                    type="url"
                    placeholder="https://..."
                    value={bonusUrl}
                    onChange={(e) => setBonusUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro Ocarina App URL Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Pro Ocarina Learning App</CardTitle>
              <CardDescription>
                Set the URL for the Pro Ocarina Learning App — displayed on
                every order confirmation page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="pro-app-url">Pro Ocarina Learning App URL</Label>
              <Input
                id="pro-app-url"
                type="url"
                placeholder="https://..."
                value={proAppUrl}
                onChange={(e) => setProAppUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to hide the app access section on order
                confirmations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button for Settings */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending || settingsLoading}
          className="gap-2"
        >
          {updateSettings.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save Payment Settings
        </Button>
      </div>

      {/* Discount Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? "Edit Discount Code" : "Create Discount Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dc-code">Promo Code</Label>
              <Input
                id="dc-code"
                placeholder="e.g. SAVE10"
                value={codeForm.code}
                onChange={(e) =>
                  setCodeForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-type">Discount Type</Label>
              <Select
                value={codeForm.discountType}
                onValueChange={(v) =>
                  setCodeForm((f) => ({
                    ...f,
                    discountType: v as Variant_percentage_fixedAmount,
                  }))
                }
              >
                <SelectTrigger id="dc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Variant_percentage_fixedAmount.percentage}>
                    Percentage Off (%)
                  </SelectItem>
                  <SelectItem
                    value={Variant_percentage_fixedAmount.fixedAmount}
                  >
                    Fixed Amount (AUD)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-value">
                Value{" "}
                {codeForm.discountType ===
                Variant_percentage_fixedAmount.percentage
                  ? "(%)"
                  : "(AUD)"}
              </Label>
              <Input
                id="dc-value"
                type="number"
                min="0"
                step={
                  codeForm.discountType ===
                  Variant_percentage_fixedAmount.percentage
                    ? "1"
                    : "0.01"
                }
                placeholder={
                  codeForm.discountType ===
                  Variant_percentage_fixedAmount.percentage
                    ? "e.g. 10"
                    : "e.g. 5.00"
                }
                value={codeForm.value}
                onChange={(e) =>
                  setCodeForm((f) => ({ ...f, value: e.target.value }))
                }
              />
            </div>
            {editingCode && (
              <div className="flex items-center gap-3">
                <Switch
                  id="dc-active"
                  checked={codeForm.active}
                  onCheckedChange={(v) =>
                    setCodeForm((f) => ({ ...f, active: v }))
                  }
                />
                <Label htmlFor="dc-active">Active</Label>
              </div>
            )}
            {codeFormError && (
              <p className="text-sm text-destructive">{codeFormError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCodeDialogOpen(false)}
              disabled={isSavingCode}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCode}
              disabled={isSavingCode}
              className="gap-2"
            >
              {isSavingCode && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCode ? "Save Changes" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
