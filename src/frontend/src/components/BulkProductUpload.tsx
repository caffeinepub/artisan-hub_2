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
        generatingDescription: false,
        shape: '',
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
                price: firstProduct.price,
                inventoryCount: firstProduct.inventoryCount,
              }
        )
      );
    }
  }, [autoCopyEnabled, products.length > 0 ? products[0].description : '', products.length > 0 ? products[0].shape : '', products.length > 0 ? products[0].price : '', products.length > 0 ? products[0].inventoryCount : '']);

  const updateProduct = (index: number, field: keyof ProductPreview, value: string | number | boolean) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      newProducts[index] = { ...newProducts[index], [field]: value };

      // If auto-copy is enabled and we're updating the first product, update all others
      if (autoCopyEnabled && index === 0 && (field === 'description' || field === 'shape' || field === 'price' || field === 'inventoryCount')) {
        for (let i = 1; i < newProducts.length; i++) {
          newProducts[i] = { ...newProducts[i], [field]: value };
        }
      }

      return newProducts;
    });
  };

  const generateDescription = async (index: number) => {
    const product = products[index];
    updateProduct(index, 'generatingDescription', true);

    try {
      const prompt = `Generate a compelling product description for a ${product.shape} shaped item named "${product.name}". Make it appealing and highlight its unique qualities. Keep it under 100 words.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      const generatedDescription = data.choices[0]?.message?.content?.trim() || '';

      if (generatedDescription) {
        updateProduct(index, 'description', generatedDescription);
        toast.success('Description generated successfully');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate description. Please enter manually.');
    } finally {
      updateProduct(index, 'generatingDescription', false);
    }
  };

  const handleUpload = async () => {
    const invalidProducts = products.filter(
      p => !p.name.trim() || !p.shape.trim() || !p.price || parseFloat(p.price) <= 0
    );

    if (invalidProducts.length > 0) {
      toast.error('Please fill in all required fields (name, shape, price) for all products');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        // Convert file to bytes
        const arrayBuffer = await product.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Create ExternalBlob with progress tracking
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          updateProduct(i, 'uploadProgress', percentage);
        });

        const priceInCents = Math.round(parseFloat(product.price) * 100);

        await addProduct.mutateAsync({
          name: product.name,
          shape: product.shape,
          price: BigInt(priceInCents),
          stripeProductId: `prod_${Date.now()}_${i}`,
          stripeProductDescription: product.description,
          images: [blob],
          inventoryCount: BigInt(product.inventoryCount || '0'),
        });

        setProgress(((i + 1) / products.length) * 100);
      }

      toast.success(`Successfully uploaded ${products.length} product(s)`);
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

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Template Selector */}
          {!templatesLoading && templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template-select">Description Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id.toString()} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {selectedTemplate.content}
                </p>
              )}
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload Product Images</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
              <Button variant="outline" disabled={uploading} asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </label>
              </Button>
            </div>
          </div>

          {/* Auto-copy Toggle */}
          {products.length > 1 && (
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Switch
                id="auto-copy"
                checked={autoCopyEnabled}
                onCheckedChange={setAutoCopyEnabled}
                disabled={uploading}
              />
              <Label htmlFor="auto-copy" className="cursor-pointer">
                Auto-copy description, shape, price, and inventory from first product to all others
              </Label>
            </div>
          )}

          {/* Product Previews */}
          {products.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Products to Upload ({products.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      <img
                        src={URL.createObjectURL(product.file)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.uploadProgress > 0 && product.uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="w-3/4">
                            <Progress value={product.uploadProgress} />
                            <p className="text-xs text-center mt-2">{Math.round(product.uploadProgress)}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`name-${index}`} className="text-xs">
                          Product Name *
                        </Label>
                        <Input
                          id={`name-${index}`}
                          value={product.name}
                          onChange={e => updateProduct(index, 'name', e.target.value)}
                          disabled={uploading}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`description-${index}`} className="text-xs">
                            Description
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => generateDescription(index)}
                            disabled={uploading || product.generatingDescription}
                            className="h-6 px-2 text-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {product.generatingDescription ? 'Generating...' : 'AI Generate'}
                          </Button>
                        </div>
                        <Textarea
                          id={`description-${index}`}
                          value={product.description}
                          onChange={e => updateProduct(index, 'description', e.target.value)}
                          disabled={uploading || product.generatingDescription}
                          placeholder="Enter product description"
                          rows={3}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`shape-${index}`} className="text-xs">
                          Shape *
                        </Label>
                        <Input
                          id={`shape-${index}`}
                          value={product.shape}
                          onChange={e => updateProduct(index, 'shape', e.target.value)}
                          disabled={uploading}
                          placeholder="e.g., Dolphin, Heart, Star"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`price-${index}`} className="text-xs">
                            Price (AUD) *
                          </Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price}
                            onChange={e => updateProduct(index, 'price', e.target.value)}
                            disabled={uploading}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`inventory-${index}`} className="text-xs">
                            Inventory
                          </Label>
                          <Input
                            id={`inventory-${index}`}
                            type="number"
                            min="0"
                            value={product.inventoryCount}
                            onChange={e => updateProduct(index, 'inventoryCount', e.target.value)}
                            disabled={uploading}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        disabled={uploading}
                        className="w-full"
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading products...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Upload Button */}
          {products.length > 0 && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full" size="lg">
              {uploading ? 'Uploading...' : `Upload ${products.length} Product(s)`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
