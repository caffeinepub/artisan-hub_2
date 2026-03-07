import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useAddProduct, useGetDescriptionTemplates } from "../hooks/useQueries";

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
  descriptionManuallyEdited: boolean;
}

const SHAPE_TEMPLATE_NAMES = ["Turtle", "Dolphin", "Frog", "Whale"];

export default function BulkProductUpload({
  onComplete,
}: BulkProductUploadProps) {
  const addProduct = useAddProduct();
  const { data: templates = [], isLoading: templatesLoading } =
    useGetDescriptionTemplates();
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoCopyEnabled, setAutoCopyEnabled] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const defaultTemplateSetRef = useRef(false);

  // Auto-select the "Default" template on load once templates are available
  useEffect(() => {
    if (
      !templatesLoading &&
      templates.length > 0 &&
      !defaultTemplateSetRef.current
    ) {
      defaultTemplateSetRef.current = true;
      // Prefer a template named "Default", otherwise fall back to the first template
      const defaultTemplate =
        templates.find((t) => t.name === "Default") ?? templates[0];
      setSelectedTemplateId(defaultTemplate.id.toString());
    }
  }, [templates, templatesLoading]);

  // Get the selected template content
  const selectedTemplate = templates.find(
    (t) => t.id.toString() === selectedTemplateId,
  );
  const templateContent = selectedTemplate?.content || "";

  /**
   * Given a shape string, find the best matching template content.
   * If the shape matches one of the known shape template names (case-insensitive),
   * use that template. Otherwise fall back to the "Default" template.
   */
  const getTemplateContentForShape = (shape: string): string => {
    const trimmedShape = shape.trim();
    const matchedShapeTemplate = SHAPE_TEMPLATE_NAMES.find(
      (name) => name.toLowerCase() === trimmedShape.toLowerCase(),
    );

    if (matchedShapeTemplate) {
      const shapeTemplate = templates.find(
        (t) => t.name === matchedShapeTemplate,
      );
      if (shapeTemplate) return shapeTemplate.content;
    }

    // Fall back to Default template
    const defaultTemplate = templates.find((t) => t.name === "Default");
    if (defaultTemplate) return defaultTemplate.content;

    // Last resort: use currently selected template content
    return templateContent;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newProducts: ProductPreview[] = newFiles.map((file, index) => ({
        file,
        name: `Product ${products.length + index + 1}`,
        description: templateContent,
        shape: "",
        category: "",
        price: "",
        inventoryCount: "0",
        uploadProgress: 0,
        descriptionManuallyEdited: false,
      }));
      setProducts([...products, ...newProducts]);
    }
  };

  // Handle template selection change — only update descriptions that haven't been manually edited
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id.toString() === templateId);
    if (template) {
      setProducts((prevProducts) =>
        prevProducts.map((product) => ({
          ...product,
          description: product.descriptionManuallyEdited
            ? product.description
            : template.content,
          // Clear manual edit flag when user explicitly picks a template
          descriptionManuallyEdited: false,
        })),
      );
    }
  };

  // Auto-copy effect: when enabled, sync fields from first item to all others (including description)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on first product fields only
  useEffect(() => {
    if (autoCopyEnabled && products.length > 1) {
      const firstProduct = products[0];
      setProducts((prevProducts) =>
        prevProducts.map((product, index) =>
          index === 0
            ? product
            : {
                ...product,
                description: firstProduct.description,
                descriptionManuallyEdited: product.descriptionManuallyEdited,
                shape: firstProduct.shape,
                category: firstProduct.category,
                price: firstProduct.price,
                inventoryCount: firstProduct.inventoryCount,
              },
        ),
      );
    }
  }, [
    autoCopyEnabled,
    products.length,
    products[0]?.description,
    products[0]?.shape,
    products[0]?.category,
    products[0]?.price,
    products[0]?.inventoryCount,
  ]);

  const updateProduct = (
    index: number,
    field: keyof ProductPreview,
    value: string | number | boolean,
  ) => {
    setProducts((prevProducts) => {
      const newProducts = [...prevProducts];
      newProducts[index] = { ...newProducts[index], [field]: value };

      // Mark description as manually edited when the user types in it
      if (field === "description") {
        newProducts[index] = {
          ...newProducts[index],
          descriptionManuallyEdited: true,
        };
      }

      // When shape changes, auto-select the matching template description (if not manually edited)
      if (field === "shape" && typeof value === "string") {
        if (!newProducts[index].descriptionManuallyEdited) {
          const autoDescription = getTemplateContentForShape(value);
          newProducts[index] = {
            ...newProducts[index],
            description: autoDescription,
          };
        }
      }

      // If auto-copy is enabled and we're updating the first product, update all others
      if (
        autoCopyEnabled &&
        index === 0 &&
        (field === "description" ||
          field === "shape" ||
          field === "category" ||
          field === "price" ||
          field === "inventoryCount")
      ) {
        for (let i = 1; i < newProducts.length; i++) {
          newProducts[i] = { ...newProducts[i], [field]: value };
          if (field === "description") {
            newProducts[i] = {
              ...newProducts[i],
              descriptionManuallyEdited: true,
            };
          }
          // Also apply shape-based template auto-selection to copied products
          if (field === "shape" && typeof value === "string") {
            if (!newProducts[i].descriptionManuallyEdited) {
              const autoDescription = getTemplateContentForShape(value);
              newProducts[i] = {
                ...newProducts[i],
                description: autoDescription,
              };
            }
          }
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
      toast.error("Please select at least one image");
      return;
    }

    const invalidProducts = products.filter(
      (p) =>
        !p.name.trim() ||
        !p.description.trim() ||
        !p.shape.trim() ||
        !p.category.trim() ||
        !p.price ||
        Number.parseFloat(p.price) <= 0,
    );

    if (invalidProducts.length > 0) {
      toast.error(
        "Please fill in all required fields (name, description, shape, category, and valid price) for all products",
      );
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const imageBytes = await fileToBytes(product.file);
        const imageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress(
          (percentage) => {
            updateProduct(i, "uploadProgress", percentage);
          },
        );

        const priceInCents = Math.round(Number.parseFloat(product.price) * 100);
        const inventoryCount = Number.parseInt(product.inventoryCount) || 0;

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
      console.error("Upload error:", error);
      toast.error("Failed to upload products. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Bulk Product Upload</h2>
          <p className="text-muted-foreground">
            Upload multiple products at once
          </p>
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
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem
                      key={template.id.toString()}
                      value={template.id.toString()}
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Descriptions auto-fill based on product shape (Turtle, Dolphin,
                Frog, Whale → matching template; others → Default). Manually
                edited descriptions are preserved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <>
          <div className="space-y-4">
            {products.map((product, index) => (
              <Card
                // biome-ignore lint/suspicious/noArrayIndexKey: products are ephemeral upload previews without stable IDs
                key={index}
              >
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <img
                          src={URL.createObjectURL(product.file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`name-${index}`}>Product Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={product.name}
                          onChange={(e) =>
                            updateProduct(index, "name", e.target.value)
                          }
                          placeholder="Enter product name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`shape-${index}`}>Shape *</Label>
                          <Input
                            id={`shape-${index}`}
                            value={product.shape}
                            onChange={(e) =>
                              updateProduct(index, "shape", e.target.value)
                            }
                            placeholder="e.g., Turtle"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`category-${index}`}>
                            Category *
                          </Label>
                          <Input
                            id={`category-${index}`}
                            value={product.category}
                            onChange={(e) =>
                              updateProduct(index, "category", e.target.value)
                            }
                            placeholder="e.g., Pendant"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`price-${index}`}>
                            Price (AUD) *
                          </Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price}
                            onChange={(e) =>
                              updateProduct(index, "price", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`inventory-${index}`}>
                            Inventory
                          </Label>
                          <Input
                            id={`inventory-${index}`}
                            type="number"
                            min="0"
                            value={product.inventoryCount}
                            onChange={(e) =>
                              updateProduct(
                                index,
                                "inventoryCount",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`description-${index}`}>
                          Description *
                        </Label>
                        {product.descriptionManuallyEdited && (
                          <span className="text-xs text-muted-foreground italic">
                            Manually edited
                          </span>
                        )}
                      </div>
                      <Textarea
                        id={`description-${index}`}
                        value={product.description}
                        onChange={(e) =>
                          updateProduct(index, "description", e.target.value)
                        }
                        placeholder="Enter product description"
                        className="flex-1 min-h-[200px]"
                      />
                    </div>
                  </div>
                  {product.uploadProgress > 0 &&
                    product.uploadProgress < 100 && (
                      <div className="mt-4">
                        <Progress value={product.uploadProgress} />
                        <p className="text-sm text-muted-foreground mt-1">
                          Uploading: {product.uploadProgress}%
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? "s" : ""} ready
              to upload
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setProducts([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading... {Math.round(progress)}%
                  </>
                ) : (
                  `Upload ${products.length} Product${products.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
