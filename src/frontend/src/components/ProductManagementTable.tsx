import { useState } from 'react';
import { useGetProducts, useUpdateProduct, useReplaceProductImage, useIncrementInventory } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Check, X, Upload, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Product } from '../backend';

interface EditingState {
  productId: bigint | null;
  field: 'name' | 'shape' | 'price' | null;
  value: string;
}

export default function ProductManagementTable() {
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const updateProduct = useUpdateProduct();
  const replaceImage = useReplaceProductImage();
  const incrementInventory = useIncrementInventory();
  const [editing, setEditing] = useState<EditingState>({ productId: null, field: null, value: '' });
  const [uploadingImage, setUploadingImage] = useState<bigint | null>(null);
  const [incrementingProduct, setIncrementingProduct] = useState<bigint | null>(null);

  const startEdit = (product: Product, field: 'name' | 'shape' | 'price') => {
    let value = '';
    if (field === 'name') value = product.name;
    else if (field === 'shape') value = product.shape;
    else if (field === 'price') value = (Number(product.price) / 100).toFixed(2);

    setEditing({ productId: product.id, field, value });
  };

  const cancelEdit = () => {
    setEditing({ productId: null, field: null, value: '' });
  };

  const saveEdit = async (product: Product) => {
    if (!editing.field || editing.productId !== product.id) return;

    try {
      const updates: any = { productId: product.id };

      if (editing.field === 'name') {
        if (!editing.value.trim()) {
          toast.error('Product name cannot be empty');
          return;
        }
        updates.name = editing.value.trim();
      } else if (editing.field === 'shape') {
        if (!editing.value.trim()) {
          toast.error('Shape cannot be empty');
          return;
        }
        updates.shape = editing.value.trim();
      } else if (editing.field === 'price') {
        const priceInCents = Math.round(parseFloat(editing.value) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0) {
          toast.error('Please enter a valid price');
          return;
        }
        updates.price = BigInt(priceInCents);
      }

      await updateProduct.mutateAsync(updates);
      toast.success('Product updated successfully');
      cancelEdit();
    } catch (error) {
      toast.error('Failed to update product');
      console.error(error);
    }
  };

  const handleIncrementInventory = async (productId: bigint) => {
    setIncrementingProduct(productId);
    try {
      await incrementInventory.mutateAsync(productId);
      toast.success('Inventory incremented successfully');
    } catch (error) {
      toast.error('Failed to increment inventory');
      console.error(error);
    } finally {
      setIncrementingProduct(null);
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

  const handleImageUpload = async (product: Product, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(product.id);
    try {
      const imageBytes = await fileToBytes(file);
      const imageBlob = ExternalBlob.fromBytes(imageBytes);

      await replaceImage.mutateAsync({
        productId: product.id,
        imageIndex: BigInt(0),
        newImage: imageBlob,
      });

      toast.success('Image updated successfully');
    } catch (error) {
      toast.error('Failed to update image');
      console.error(error);
    } finally {
      setUploadingImage(null);
      event.target.value = '';
    }
  };

  if (productsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
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
          <CardTitle>Manage Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No products yet. Upload your first product to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isEditing = editing.productId === product.id;
                const imageUrl = product.images.length > 0
                  ? product.images[0].getDirectURL()
                  : '/assets/generated/product-placeholder.dim_400x400.png';

                return (
                  <TableRow key={product.id.toString()}>
                    <TableCell>
                      <div className="relative group">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <label
                          htmlFor={`image-upload-${product.id}`}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded"
                        >
                          <Upload className="h-5 w-5 text-white" />
                        </label>
                        <input
                          id={`image-upload-${product.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(product, e)}
                          disabled={uploadingImage === product.id}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      {isEditing && editing.field === 'name' ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="max-w-xs"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEdit(product)}
                            disabled={updateProduct.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="font-medium">{product.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(product, 'name')}
                            className="h-6 w-6"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing && editing.field === 'shape' ? (
                        <div className="flex gap-2 items-center">
                          <Textarea
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="max-w-md min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => saveEdit(product)}
                              disabled={updateProduct.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                            {product.shape}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(product, 'shape')}
                            className="h-6 w-6 flex-shrink-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing && editing.field === 'price' ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="w-24"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEdit(product)}
                            disabled={updateProduct.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="font-semibold">
                            ${(Number(product.price) / 100).toFixed(2)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(product, 'price')}
                            className="h-6 w-6"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <span className="font-medium">{product.inventoryCount.toString()}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleIncrementInventory(product.id)}
                          disabled={incrementingProduct === product.id}
                          className="h-6 w-6"
                          title="Increment inventory by 1"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">ID: {product.id.toString()}</span>
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
