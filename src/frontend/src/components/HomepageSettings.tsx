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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useGetHomepageConfig,
  useUpdateHomepageConfig,
} from "../hooks/useQueries";

export default function HomepageSettings() {
  const { data: homepageConfig, isLoading } = useGetHomepageConfig();
  const updateConfig = useUpdateHomepageConfig();

  const [heroMotto, setHeroMotto] = useState("");
  const [promotionalText, setPromotionalText] = useState("");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize form with current config
  useEffect(() => {
    if (homepageConfig) {
      setHeroMotto(homepageConfig.heroMotto || "");
      setPromotionalText(homepageConfig.promotionalText || "");
      if (homepageConfig.heroImage) {
        setHeroImagePreview(homepageConfig.heroImage.getDirectURL());
      }
    }
  }, [homepageConfig]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setHeroImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setHeroImageFile(null);
    setHeroImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heroMotto.trim()) {
      toast.error("Hero motto is required");
      return;
    }

    try {
      let heroImageBlob: ExternalBlob | undefined =
        homepageConfig?.heroImage || undefined;

      // Upload hero image if changed
      if (heroImageFile) {
        const imageBytes = new Uint8Array(await heroImageFile.arrayBuffer());
        heroImageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress(
          (percentage) => {
            setUploadProgress(percentage);
          },
        );
      } else if (heroImagePreview === null && homepageConfig?.heroImage) {
        // Image was cleared
        heroImageBlob = undefined;
      }

      await updateConfig.mutateAsync({
        heroMotto: heroMotto.trim(),
        promotionalText: promotionalText.trim(),
        heroImage: heroImageBlob,
      });

      toast.success("Homepage settings updated successfully");
      setHeroImageFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error updating homepage config:", error);
      toast.error("Failed to update homepage settings");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homepage Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Settings</CardTitle>
        <CardDescription>Customize your homepage hero section</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hero Motto */}
          <div className="space-y-2">
            <Label htmlFor="heroMotto">Hero Motto</Label>
            <Input
              id="heroMotto"
              type="text"
              value={heroMotto}
              onChange={(e) => setHeroMotto(e.target.value)}
              placeholder="Enter your hero motto"
              required
            />
            <p className="text-xs text-muted-foreground">
              Main headline displayed on the homepage
            </p>
          </div>

          {/* Promotional Text */}
          <div className="space-y-2">
            <Label htmlFor="promotionalText">Promotional Text</Label>
            <Textarea
              id="promotionalText"
              value={promotionalText}
              onChange={(e) => setPromotionalText(e.target.value)}
              placeholder="Enter promotional text"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Supporting text displayed below the hero motto
            </p>
          </div>

          {/* Hero Background Image */}
          <div className="space-y-2">
            <Label htmlFor="heroImage">Hero Background Image</Label>
            <div className="space-y-4">
              {heroImagePreview ? (
                <div className="relative">
                  <img
                    src={heroImagePreview}
                    alt="Hero background preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                </div>
              )}
              <Input
                id="heroImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1920x600px or larger, JPG or PNG
              </p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-sm text-primary">
                  Uploading: {uploadProgress}%
                </p>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="relative h-64 rounded-lg overflow-hidden border"
              style={{
                backgroundImage: heroImagePreview
                  ? `url(${heroImagePreview})`
                  : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <h1 className="font-serif text-4xl font-bold mb-4">
                    {heroMotto || "Your Hero Motto"}
                  </h1>
                  <p className="text-lg max-w-2xl mx-auto">
                    {promotionalText ||
                      "Your promotional text will appear here"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? (
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
