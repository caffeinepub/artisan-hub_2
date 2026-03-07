import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useGetBrandingConfig,
  useUpdateBrandingConfig,
} from "../hooks/useQueries";

export default function BrandingSettings() {
  const { data: brandingConfig, isLoading } = useGetBrandingConfig();
  const updateBranding = useUpdateBrandingConfig();

  const [siteName, setSiteName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  const [faviconUploadProgress, setFaviconUploadProgress] = useState(0);

  // Initialize form with current config
  useState(() => {
    if (brandingConfig) {
      setSiteName(brandingConfig.siteName || "");
      if (brandingConfig.logo) {
        setLogoPreview(brandingConfig.logo.getDirectURL());
      }
      if (brandingConfig.favicon) {
        setFaviconPreview(brandingConfig.favicon.getDirectURL());
      }
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const clearFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!siteName.trim()) {
      toast.error("Site name is required");
      return;
    }

    try {
      let logoBlob: ExternalBlob | undefined =
        brandingConfig?.logo || undefined;
      let faviconBlob: ExternalBlob | undefined =
        brandingConfig?.favicon || undefined;

      // Upload logo if changed
      if (logoFile) {
        const logoBytes = new Uint8Array(await logoFile.arrayBuffer());
        logoBlob = ExternalBlob.fromBytes(logoBytes).withUploadProgress(
          (percentage) => {
            setLogoUploadProgress(percentage);
          },
        );
      } else if (logoPreview === null && brandingConfig?.logo) {
        // Logo was cleared
        logoBlob = undefined;
      }

      // Upload favicon if changed
      if (faviconFile) {
        const faviconBytes = new Uint8Array(await faviconFile.arrayBuffer());
        faviconBlob = ExternalBlob.fromBytes(faviconBytes).withUploadProgress(
          (percentage) => {
            setFaviconUploadProgress(percentage);
          },
        );
      } else if (faviconPreview === null && brandingConfig?.favicon) {
        // Favicon was cleared
        faviconBlob = undefined;
      }

      await updateBranding.mutateAsync({
        siteName: siteName.trim(),
        logo: logoBlob,
        favicon: faviconBlob,
        primaryColor: brandingConfig?.primaryColor,
        secondaryColor: brandingConfig?.secondaryColor,
        theme: brandingConfig?.theme,
      });

      toast.success("Branding settings updated successfully");
      setLogoFile(null);
      setFaviconFile(null);
      setLogoUploadProgress(0);
      setFaviconUploadProgress(0);
    } catch (error) {
      console.error("Error updating branding:", error);
      toast.error("Failed to update branding settings");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branding Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Settings</CardTitle>
        <CardDescription>
          Customize your store's branding and appearance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter your store name"
              required
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-start gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-24 w-auto max-w-xs object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={clearLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended: PNG or SVG, max height 64px
                </p>
                {logoUploadProgress > 0 && logoUploadProgress < 100 && (
                  <p className="text-sm text-primary mt-1">
                    Uploading: {logoUploadProgress}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <Label htmlFor="favicon">Favicon / Icon</Label>
            <div className="flex items-start gap-4">
              {faviconPreview ? (
                <div className="relative">
                  <img
                    src={faviconPreview}
                    alt="Favicon preview"
                    className="h-16 w-16 object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={clearFavicon}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-16 w-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="favicon"
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended: ICO, PNG, or SVG, 32x32px or 64x64px
                </p>
                {faviconUploadProgress > 0 && faviconUploadProgress < 100 && (
                  <p className="text-sm text-primary mt-1">
                    Uploading: {faviconUploadProgress}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateBranding.isPending}>
              {updateBranding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
