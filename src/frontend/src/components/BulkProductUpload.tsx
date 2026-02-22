import { useState, useEffect } from 'react';
import { useAddProduct } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

interface BulkProductUploadProps {
  onComplete?: () => void;
}

interface ProductPreview {
  file: File;
  name: string;
  description: string;
  generatingDescription: boolean;
  shape: string;
  price: string;
  inventoryCount: string;
}

const DEFAULT_DESCRIPTION = 'Handcrafted 3D printed dolphin ocarina, uniquely designed and precision-crafted for beautiful sound and artisan appeal. This one-of-a-kind piece combines intricate detail with functional artistry, perfect for collectors and music enthusiasts alike';

export default function BulkProductUpload({ onComplete }: BulkProductUploadProps) {
  const addProduct = useAddProduct();
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newProducts: ProductPreview[] = newFiles.map((file, index) => ({
        file,
        name: `Product ${products.length + index + 1}`,
        description: DEFAULT_DESCRIPTION,
        generatingDescription: false,
        shape: '',
        price: '',
        inventoryCount: '0',
      }));
      setProducts([...products, ...newProducts]);
    }
  };

  // Auto-copy effect: when enabled, sync fields from first item to all others
  useEffect(() => {
    if (autoCopyEnabled && products.length > 1) {
      const firstProduct = products[0];
      setProducts(prevProducts =>
        prevProducts.map((product, index) =>
          index === 0
            ? product
            : {
                ...product,
                name: firstProduct.name,
                shape: firstProduct.shape,
                price: firstProduct.price,
                inventoryCount: firstProduct.inventoryCount,
              }
        )
      );
    }
  }, [
    autoCopyEnabled,
    products.length > 0 ? products[0]?.name : '',
    products.length > 0 ? products[0]?.shape : '',
    products.length > 0 ? products[0]?.price : '',
    products.length > 0 ? products[0]?.inventoryCount : '',
  ]);

  const generateDescription = (title: string, shape: string, price: string): string => {
    const priceValue = parseFloat(price);
    const priceText = !isNaN(priceValue) && priceValue > 0 ? ` priced at $${priceValue.toFixed(2)}` : '';
    
    return `Beautiful handcrafted ${title.toLowerCase()} in ${shape.toLowerCase()} shape. This unique piece${priceText} is carefully made with attention to detail and quality craftsmanship. Each item is one-of-a-kind and perfect for adding artisan charm to your collection.`;
  };

  const handleGenerateDescription = (index: number) => {
    const product = products[index];
    
    if (!product.shape.trim() || !product.name.trim()) {
      toast.error('Please fill in product name and shape first');
      return;
    }

    // Set generating state
    setProducts(products.map((p, i) => 
      i === index ? { ...p, generatingDescription: true } : p
    ));

    // Simulate AI generation with a small delay
    setTimeout(() => {
      const aiDescription = generateDescription(
        product.name,
        product.shape,
        product.price
      );
      setProducts(products.map((p, i) => 
        i === index ? { ...p, description: aiDescription, generatingDescription: false } : p
      ));
    }, 500);
  };

  const updateProductField = (index: number, field: keyof ProductPreview, value: string) => {
    setProducts(products.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
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

  const handleUpload = async () => {
    if (products.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    // Validate all products have required fields
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.name.trim() || !product.description.trim() || !product.shape.trim() || !product.price) {
        toast.error(`Product ${i + 1}: Please fill in all fields (name, description, shape, and price)`);
        return;
      }

      const priceInCents = Math.round(parseFloat(product.price) * 100);
      if (isNaN(priceInCents) || priceInCents <= 0) {
        toast.error(`Product ${i + 1}: Please enter a valid price`);
        return;
      }

      const inventory = parseInt(product.inventoryCount);
      if (isNaN(inventory) || inventory < 0) {
        toast.error(`Product ${i + 1}: Please enter a valid inventory count`);
        return;
      }
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const priceInCents = Math.round(parseFloat(product.price) * 100);
        const inventory = parseInt(product.inventoryCount);

        // Convert file to bytes and create ExternalBlob
        const imageBytes = await fileToBytes(product.file);
        const imageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress((percentage) => {
          const baseProgress = (i / products.length) * 100;
          const fileProgress = (percentage / 100) * (100 / products.length);
          setProgress(baseProgress + fileProgress);
        });

        await addProduct.mutateAsync({
          name: product.name.trim(),
          shape: product.shape.trim(),
          price: BigInt(priceInCents),
          stripeProductId: `prod_${Date.now()}_${i}`,
          stripeProductDescription: product.description.trim(),
          images: [imageBlob],
          inventoryCount: BigInt(inventory),
        });

        setProgress(((i + 1) / products.length) * 100);
      }

      toast.success(`Successfully uploaded ${products.length} product${products.length > 1 ? 's' : ''}`);
      setProducts([]);
      setAutoCopyEnabled(false);
      onComplete?.();
    } catch (error) {
      toast.error('Failed to upload products');
      console.error(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="images">Product Images</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
          {products.length > 0 && (
            <p className="text-sm text-muted-foreground">{products.length} product(s) ready to upload</p>
          )}
        </div>

        {/* Auto-copy toggle */}
        {products.length > 1 && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="auto-copy" className="text-sm font-medium">
                Auto-copy fields from first item
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically copy name, shape, price, and inventory from the first product to all others
              </p>
            </div>
            <Switch
              id="auto-copy"
              checked={autoCopyEnabled}
              onCheckedChange={setAutoCopyEnabled}
              disabled={uploading}
            />
          </div>
        )}

        {/* Product Previews */}
        {products.length > 0 && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="font-medium text-sm">Product Details</h3>
            {products.map((product, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg bg-background">
                <div className="flex items-start gap-3">
                  <img
                    src={URL.createObjectURL(product.file)}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`name-${index}`} className="text-xs">
                        Product Name {index === 0 && autoCopyEnabled && products.length > 1 && (
                          <span className="text-primary">(Master)</span>
                        )}
                      </Label>
                      <Input
                        id={`name-${index}`}
                        value={product.name}
                        onChange={(e) => updateProductField(index, 'name', e.target.value)}
                        placeholder="Enter product name"
                        disabled={uploading || (autoCopyEnabled && index > 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`shape-${index}`} className="text-xs">
                        Shape {index === 0 && autoCopyEnabled && products.length > 1 && (
                          <span className="text-primary">(Master)</span>
                        )}
                      </Label>
                      <Input
                        id={`shape-${index}`}
                        value={product.shape}
                        onChange={(e) => updateProductField(index, 'shape', e.target.value)}
                        placeholder="e.g., Round, Square, Oval"
                        disabled={uploading || (autoCopyEnabled && index > 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`price-${index}`} className="text-xs">
                        Price (USD) {index === 0 && autoCopyEnabled && products.length > 1 && (
                          <span className="text-primary">(Master)</span>
                        )}
                      </Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.price}
                        onChange={(e) => updateProductField(index, 'price', e.target.value)}
                        placeholder="0.00"
                        disabled={uploading || (autoCopyEnabled && index > 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`inventory-${index}`} className="text-xs">
                        Inventory Count {index === 0 && autoCopyEnabled && products.length > 1 && (
                          <span className="text-primary">(Master)</span>
                        )}
                      </Label>
                      <Input
                        id={`inventory-${index}`}
                        type="number"
                        min="0"
                        value={product.inventoryCount}
                        onChange={(e) => updateProductField(index, 'inventoryCount', e.target.value)}
                        placeholder="0"
                        disabled={uploading || (autoCopyEnabled && index > 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`desc-${index}`} className="text-xs">Description</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateDescription(index)}
                          disabled={
                            uploading ||
                            product.generatingDescription ||
                            !product.shape.trim() ||
                            !product.name.trim()
                          }
                          className="h-7 gap-1 text-xs"
                        >
                          <Sparkles className="h-3 w-3" />
                          {product.generatingDescription ? 'Generating...' : 'Generate AI Description'}
                        </Button>
                      </div>
                      <Textarea
                        id={`desc-${index}`}
                        value={product.description}
                        onChange={(e) => updateProductField(index, 'description', e.target.value)}
                        placeholder="Enter product description"
                        disabled={uploading}
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProduct(index)}
                    disabled={uploading}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">Uploading... {Math.round(progress)}%</p>
          </div>
        )}

        <Button onClick={handleUpload} disabled={uploading || products.length === 0} className="w-full gap-2">
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : `Upload ${products.length} Product${products.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}
