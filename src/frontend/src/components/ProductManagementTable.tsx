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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Minus, Plus, Save, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useBulkUpdateProducts,
  useGetProducts,
  useUpdateInventoryCount,
  useUpdateProduct,
} from "../hooks/useQueries";

interface EditingProduct {
  id: bigint;
  name: string;
  description: string;
  shape: string;
  category: string;
  price: string;
  imageFile: File | null;
  uploadProgress: number;
}

export default function ProductManagementTable() {
  const { data: products = [], isLoading } = useGetProducts();
  const updateProduct = useUpdateProduct();
  const updateInventoryCount = useUpdateInventoryCount();
  const bulkUpdateProducts = useBulkUpdateProducts();
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(
    null,
  );
  const [inventoryLoading, setInventoryLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );
  const [shapeFilter, setShapeFilter] = useState<string>("all");
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
  const [pendingBulkUpdate, setPendingBulkUpdate] = useState<any>(null);

  // Get unique shapes from products
  const uniqueShapes = useMemo(() => {
    const shapes = Array.from(
      new Set(products.map((p) => p.shape).filter(Boolean)),
    );
    return shapes.sort();
  }, [products]);

  // Filter products by shape
  const filteredProducts = useMemo(() => {
    if (shapeFilter === "all") return products;
    return products.filter((p) => p.shape === shapeFilter);
  }, [products, shapeFilter]);

  const handleEdit = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.stripeProductDescription,
      shape: product.shape,
      category: product.category,
      price: (Number(product.price) / 100).toFixed(2),
      imageFile: null,
      uploadProgress: 0,
    });
  };

  const handleCancel = () => {
    setEditingProduct(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setEditingProduct((prev) =>
        prev ? { ...prev, imageFile: e.target.files![0] } : null,
      );
    }
  };

  const fileToBytes = async (file: File): Promise<Uint8Array<ArrayBuffer>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve(new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      const priceInCents = Math.round(
        Number.parseFloat(editingProduct.price) * 100,
      );
      if (Number.isNaN(priceInCents) || priceInCents <= 0) {
        toast.error("Please enter a valid price");
        return;
      }

      let imageBlob: ExternalBlob | undefined = undefined;
      if (editingProduct.imageFile) {
        const imageBytes = await fileToBytes(editingProduct.imageFile);
        imageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress(
          (percentage) => {
            setEditingProduct((prev) =>
              prev ? { ...prev, uploadProgress: percentage } : null,
            );
          },
        );
      }

      // Check if this is a bulk edit (multiple products selected)
      if (
        selectedProductIds.size > 1 &&
        selectedProductIds.has(editingProduct.id.toString())
      ) {
        // Prepare bulk update (excluding images for bulk operations)
        const updates = {
          name: editingProduct.name,
          shape: editingProduct.shape,
          category: editingProduct.category,
          price: BigInt(priceInCents),
          description: editingProduct.description,
        };

        setPendingBulkUpdate({
          productIds: Array.from(selectedProductIds).map((id) => BigInt(id)),
          updates,
        });
        setShowBulkConfirmDialog(true);
      } else {
        // Single product update
        await updateProduct.mutateAsync({
          productId: editingProduct.id,
          name: editingProduct.name,
          shape: editingProduct.shape,
          category: editingProduct.category,
          price: BigInt(priceInCents),
          description: editingProduct.description,
          images: imageBlob ? [imageBlob] : undefined,
        });

        toast.success("Product updated successfully");
        setEditingProduct(null);
      }
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    }
  };

  const handleBulkConfirm = async () => {
    if (!pendingBulkUpdate) return;

    try {
      await bulkUpdateProducts.mutateAsync(pendingBulkUpdate);
      setEditingProduct(null);
      setSelectedProductIds(new Set());
    } catch (error) {
      console.error(error);
    } finally {
      setShowBulkConfirmDialog(false);
      setPendingBulkUpdate(null);
    }
  };

  const handleBulkCancel = () => {
    setShowBulkConfirmDialog(false);
    setPendingBulkUpdate(null);
  };

  const handleInventoryChange = async (
    productId: bigint,
    currentCount: bigint,
    delta: number,
  ) => {
    const newCount = Number(currentCount) + delta;
    if (newCount < 0) return;

    const key = productId.toString();
    setInventoryLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await updateInventoryCount.mutateAsync({
        productId,
        inventoryCount: BigInt(newCount),
      });
      toast.success("Inventory updated");
    } catch (error) {
      toast.error("Failed to update inventory");
      console.error(error);
    } finally {
      setInventoryLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(
        new Set(filteredProducts.map((p) => p.id.toString())),
      );
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const formatPrice = (priceInCents: bigint) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(priceInCents) / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No products found. Upload some products to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.has(p.id.toString()));
  const someSelected =
    filteredProducts.some((p) => selectedProductIds.has(p.id.toString())) &&
    !allSelected;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Shape Filter Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={shapeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setShapeFilter("all")}
              >
                All
              </Button>
              {uniqueShapes.map((shape) => (
                <Button
                  key={shape}
                  variant={shapeFilter === shape ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShapeFilter(shape)}
                >
                  {shape}
                </Button>
              ))}
            </div>
            {selectedProductIds.size > 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                {selectedProductIds.size} product
                {selectedProductIds.size !== 1 ? "s" : ""} selected
                {selectedProductIds.size > 1 &&
                  " - Edit one to apply changes to all selected"}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all products"
                      className={
                        someSelected ? "data-[state=checked]:bg-primary/50" : ""
                      }
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price (AUD)</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isEditing = editingProduct?.id === product.id;
                  const isSelected = selectedProductIds.has(
                    product.id.toString(),
                  );
                  const imageUrl =
                    product.images.length > 0
                      ? product.images[0].getDirectURL()
                      : "/assets/generated/product-placeholder.dim_400x400.png";
                  const isInventoryLoading =
                    inventoryLoading[product.id.toString()];

                  return (
                    <TableRow
                      key={product.id.toString()}
                      className={isSelected ? "bg-primary/5" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectProduct(
                              product.id.toString(),
                              checked as boolean,
                            )
                          }
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        {isEditing && editingProduct.imageFile ? (
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(
                                editingProduct.imageFile,
                              )}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                            {editingProduct.uploadProgress > 0 &&
                              editingProduct.uploadProgress < 100 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                                  <span className="text-white text-xs">
                                    {Math.round(editingProduct.uploadProgress)}%
                                  </span>
                                </div>
                              )}
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingProduct.name}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev ? { ...prev, name: e.target.value } : null,
                              )
                            }
                            className="max-w-xs"
                          />
                        ) : (
                          <span className="font-medium">{product.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingProduct.shape}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev
                                  ? { ...prev, shape: e.target.value }
                                  : null,
                              )
                            }
                            className="max-w-[120px]"
                          />
                        ) : (
                          <span className="text-sm">{product.shape}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingProduct.category}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev
                                  ? { ...prev, category: e.target.value }
                                  : null,
                              )
                            }
                            className="max-w-[120px]"
                          />
                        ) : (
                          <span className="text-sm">{product.category}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={editingProduct.description}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev
                                  ? { ...prev, description: e.target.value }
                                  : null,
                              )
                            }
                            className="max-w-md"
                            rows={2}
                          />
                        ) : (
                          <span className="text-sm line-clamp-2 max-w-md">
                            {product.stripeProductDescription}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingProduct.price}
                            onChange={(e) =>
                              setEditingProduct((prev) =>
                                prev
                                  ? { ...prev, price: e.target.value }
                                  : null,
                              )
                            }
                            className="max-w-[120px]"
                          />
                        ) : (
                          <span className="font-semibold">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              handleInventoryChange(
                                product.id,
                                product.inventoryCount,
                                -1,
                              )
                            }
                            disabled={
                              Number(product.inventoryCount) <= 0 ||
                              isInventoryLoading
                            }
                          >
                            {isInventoryLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {product.inventoryCount.toString()}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              handleInventoryChange(
                                product.id,
                                product.inventoryCount,
                                1,
                              )
                            }
                            disabled={isInventoryLoading}
                          >
                            {isInventoryLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            {selectedProductIds.size <= 1 && (
                              <>
                                <label htmlFor={`image-${product.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    asChild
                                  >
                                    <span>
                                      <Upload className="h-3 w-3" />
                                      Image
                                    </span>
                                  </Button>
                                </label>
                                <input
                                  id={`image-${product.id}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                />
                              </>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleSave}
                              className="gap-1"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancel}
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={showBulkConfirmDialog}
        onOpenChange={setShowBulkConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update {selectedProductIds.size} products with
              the same values. This action cannot be undone. Do you want to
              continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleBulkCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
