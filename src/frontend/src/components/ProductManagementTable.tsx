import { useState } from 'react';
import { useGetProducts, useUpdateProduct, useUpdateInventoryCount } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Save, X, Upload, Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

interface EditingProduct {
  id: bigint;
  name: string;
  description: string;
  price: string;
  imageFile: File | null;
  uploadProgress: number;
}

export default function ProductManagementTable() {
  const { data: products = [], isLoading } = useGetProducts();
  const updateProduct = useUpdateProduct();
  const updateInventoryCount = useUpdateInventoryCount();
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState<{ [key: string]: boolean }>({});

  const handleEdit = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.stripeProductDescription,
      price: (Number(product.price) / 100).toFixed(2),
      imageFile: null,
      uploadProgress: 0,
    });
  };

  const handleCancel = () => {
    setEditingProduct(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditingProduct((prev) => (prev ? { ...prev, imageFile: e.target.files![0] } : null));
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
      const priceInCents = Math.round(parseFloat(editingProduct.price) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        toast.error('Please enter a valid price');
        return;
      }

      let imageBlob: ExternalBlob | undefined = undefined;
      if (editingProduct.imageFile) {
        const imageBytes = await fileToBytes(editingProduct.imageFile);
        imageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress((percentage) => {
          setEditingProduct((prev) => (prev ? { ...prev, uploadProgress: percentage } : null));
        });
      }

      await updateProduct.mutateAsync({
        productId: editingProduct.id,
        name: editingProduct.name,
        price: BigInt(priceInCents),
        stripeProductDescription: editingProduct.description,
        images: imageBlob ? [imageBlob] : undefined,
      });

      toast.success('Product updated successfully');
      setEditingProduct(null);
    } catch (error) {
      toast.error('Failed to update product');
      console.error(error);
    }
  };

  const handleInventoryChange = async (productId: bigint, currentCount: bigint, delta: number) => {
    const newCount = Number(currentCount) + delta;
    if (newCount < 0) return;

    const key = productId.toString();
    setInventoryLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await updateInventoryCount.mutateAsync({
        productId,
        inventoryCount: BigInt(newCount),
      });
      toast.success('Inventory updated');
    } catch (error) {
      toast.error('Failed to update inventory');
      console.error(error);
    } finally {
      setInventoryLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatPrice = (priceInCents: bigint) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
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
          <p className="text-muted-foreground text-center py-8">No products found. Upload some products to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price (AUD)</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isEditing = editingProduct?.id === product.id;
                const imageUrl = product.images.length > 0
                  ? product.images[0].getDirectURL()
                  : '/assets/generated/product-placeholder.dim_400x400.png';
                const isInventoryLoading = inventoryLoading[product.id.toString()];

                return (
                  <TableRow key={product.id.toString()}>
                    <TableCell>
                      {isEditing && editingProduct.imageFile ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(editingProduct.imageFile)}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded"
                          />
                          {editingProduct.uploadProgress > 0 && editingProduct.uploadProgress < 100 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                              <span className="text-white text-xs">{Math.round(editingProduct.uploadProgress)}%</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <img src={imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct((prev) => (prev ? { ...prev, name: e.target.value } : null))
                          }
                          className="max-w-xs"
                        />
                      ) : (
                        <span className="font-medium">{product.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={editingProduct.description}
                          onChange={(e) =>
                            setEditingProduct((prev) => (prev ? { ...prev, description: e.target.value } : null))
                          }
                          className="max-w-md"
                          rows={2}
                        />
                      ) : (
                        <span className="text-sm line-clamp-2 max-w-md">{product.stripeProductDescription}</span>
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
                            setEditingProduct((prev) => (prev ? { ...prev, price: e.target.value } : null))
                          }
                          className="max-w-[120px]"
                        />
                      ) : (
                        <span className="font-semibold">{formatPrice(product.price)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleInventoryChange(product.id, product.inventoryCount, -1)}
                          disabled={Number(product.inventoryCount) <= 0 || isInventoryLoading}
                        >
                          {isInventoryLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                        </Button>
                        <span className="w-12 text-center font-medium">{product.inventoryCount.toString()}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleInventoryChange(product.id, product.inventoryCount, 1)}
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
                          <label htmlFor={`image-${product.id}`}>
                            <Button variant="outline" size="sm" className="gap-1" asChild>
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
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                            disabled={updateProduct.isPending}
                            className="gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1">
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="gap-1">
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
  );
}
