import { useState, useEffect } from 'react';
import { useAddProduct, useDescriptionTemplates } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

interface BulkProductUploadProps {
  onComplete?: () => void;
}

interface ProductPreview {
  file: File;
  name: string;
  description: string;
  shape: string;
  category: string;
  price: string;
  inventoryCount: string;
  uploadProgress: number;
}

export default function BulkProductUpload({ onComplete }: BulkProductUploadProps) {
  const addProduct = useAddProduct();
  const { data: templates = [], isLoading: templatesLoading } = useDescriptionTemplates();
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Auto-select first template if only one exists
  useEffect(() => {
    if (templates.length === 1 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id.toString());
    }
  }, [templates, selectedTemplateId]);

  // Get the selected template content
  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);
  const templateContent = selectedTemplate?.content || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newProducts: ProductPreview[] = newFiles.map((file, index) => ({
        file,
        name: `Product ${products.length + index + 1}`,
        description: templateContent,
        shape: '',
        category: '',
        price: '',
        inventoryCount: '0',
        uploadProgress: 0,
      }));
      setProducts([...products, ...newProducts]);
    }
  };

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      // Update all products with the new template content
      setProducts(prevProducts =>
        prevProducts.map(product => ({
          ...product,
          description: template.content,
        }))
      );
    }
  };

  // Auto-copy effect: when enabled, sync fields from first item to all others (including description)
  useEffect(() => {
    if (autoCopyEnabled && products.length > 1) {
      const firstProduct = products[0];
      setProducts(prevProducts =>
        prevProducts.map((product, index) =>
          index === 0
            ? product
            : {
                ...product,
                description: firstProduct.description,
                shape: firstProduct.shape,
                category: firstProduct.category,
                price: firstProduct.price,
                inventoryCount: firstProduct.inventoryCount,
              }
        )
      );
    }
  }, [autoCopyEnabled, products.length > 0 ? products[0].description : '', products.length > 0 ? products[0].shape : '', products.length > 0 ? products[0].category : '', products.length > 0 ? products[0].price : '', products.length > 0 ? products[0].inventoryCount : '']);

  const updateProduct = (index: number, field: keyof ProductPreview, value: string | number) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      newProducts[index] = { ...newProducts[index], [field]: value };

      // If auto-copy is enabled and we're updating the first product, update all others
      if (autoCopyEnabled && index === 0 && (field === 'description' || field === 'shape' || field === 'category' || field === 'price' || field === 'inventoryCount')) {
        for (let i = 1; i < newProducts.length; i++) {
          newProducts[i] = { ...newProducts[i], [field]: value };
        }
      }

      return newProducts;
    });
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

    const invalidProducts = products.filter(
      (p) => !p.name.trim() || !p.description.trim() || !p.shape.trim() || !p.category.trim() || !p.price || parseFloat(p.price) <= 0
    );

    if (invalidProducts.length > 0) {
      toast.error('Please fill in all required fields (name, description, shape, category, and valid price) for all products');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const imageBytes = await fileToBytes(product.file);
        const imageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress((percentage) => {
          updateProduct(i, 'uploadProgress', percentage);
        });

        const priceInCents = Math.round(parseFloat(product.price) * 100);
        const inventoryCount = parseInt(product.inventoryCount) || 0;

        await addProduct.mutateAsync({
          name: product.name,
          shape: product.shape,
          category: product.category,
          price: BigInt(priceInCents),
          stripeProductId: `prod_${Date.now()}_${i}`,
          stripeProductDescription: product.description,
          images: [imageBlob],
          inventoryCount: BigInt(inventoryCount),
        });

        setProgress(((i + 1) / products.length) * 100);
      }

      toast.success(`Successfully uploaded ${products.length} product(s)!`);
      setProducts([]);
      setProgress(0);
      onComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload products. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Bulk Product Upload</h2>
          <p className="text-muted-foreground">Upload multiple products at once</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-copy"
              checked={autoCopyEnabled}
              onCheckedChange={setAutoCopyEnabled}
              disabled={products.length <= 1}
            />
            <Label htmlFor="auto-copy" className="text-sm">
              Auto-copy from first
            </Label>
          </div>
          <label htmlFor="file-upload">
            <Button asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Select Images
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {!templatesLoading && templates.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="template-select">Description Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id.toString()} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a template to pre-populate descriptions for all products
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <>
          <div className="space-y-4">
            {products.map((product, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={URL.createObjectURL(product.file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {product.uploadProgress > 0 && product.uploadProgress < 100 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{Math.round(product.uploadProgress)}%</span>
                          </div>
                          <Progress value={product.uploadProgress} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`}>Product Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`shape-${index}`}>Shape *</Label>
                          <Input
                            id={`shape-${index}`}
                            value={product.shape}
                            onChange={(e) => updateProduct(index, 'shape', e.target.value)}
                            placeholder="e.g., Round, Square"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`category-${index}`}>Category *</Label>
                          <Input
                            id={`category-${index}`}
                            value={product.category}
                            onChange={(e) => updateProduct(index, 'category', e.target.value)}
                            placeholder="e.g., Chocolate, Praline"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description *</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={product.description}
                          onChange={(e) => updateProduct(index, 'description', e.target.value)}
                          placeholder="Enter product description"
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`price-${index}`}>Price (AUD) *</Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price}
                            onChange={(e) => updateProduct(index, 'price', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`inventory-${index}`}>Inventory Count</Label>
                          <Input
                            id={`inventory-${index}`}
                            type="number"
                            min="0"
                            value={product.inventoryCount}
                            onChange={(e) => updateProduct(index, 'inventoryCount', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setProducts([])} disabled={uploading}>
              Clear All
            </Button>
            <Button onClick={handleUpload} disabled={uploading || products.length === 0}>
              {uploading ? `Uploading... ${Math.round(progress)}%` : `Upload ${products.length} Product(s)`}
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </>
      )}

      {products.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images selected. Click "Select Images" to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
