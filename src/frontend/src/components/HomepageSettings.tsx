import { useState, useEffect } from 'react';
import { useHomepageConfig, useUpdateHomepageConfig } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

export default function HomepageSettings() {
  const { data: homepageConfig, isLoading } = useHomepageConfig();
  const updateHomepage = useUpdateHomepageConfig();

  const [heroMotto, setHeroMotto] = useState('');
  const [promotionalText, setPromotionalText] = useState('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroImageUploadProgress, setHeroImageUploadProgress] = useState(0);

  // Initialize form with current config
  useEffect(() => {
    if (homepageConfig) {
      setHeroMotto(homepageConfig.heroMotto || '');
      setPromotionalText(homepageConfig.promotionalText || '');
      if (homepageConfig.heroImage) {
        setHeroImagePreview(homepageConfig.heroImage.getDirectURL());
      }
    }
  }, [homepageConfig]);

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
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

  const clearHeroImage = () => {
    setHeroImageFile(null);
    setHeroImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heroMotto.trim()) {
      toast.error('Hero motto is required');
      return;
    }

    if (!promotionalText.trim()) {
      toast.error('Promotional text is required');
      return;
    }

    try {
      let heroImageBlob: ExternalBlob | undefined = homepageConfig?.heroImage || undefined;

      // Upload hero image if changed
      if (heroImageFile) {
        const imageBytes = new Uint8Array(await heroImageFile.arrayBuffer());
        heroImageBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress((percentage) => {
          setHeroImageUploadProgress(percentage);
        });
      } else if (heroImagePreview === null && homepageConfig?.heroImage) {
        // Image was cleared
        heroImageBlob = undefined;
      }

      await updateHomepage.mutateAsync({
        heroMotto: heroMotto.trim(),
        promotionalText: promotionalText.trim(),
        heroImage: heroImageBlob,
      });

      toast.success('Homepage settings updated successfully');
      setHeroImageFile(null);
      setHeroImageUploadProgress(0);
    } catch (error) {
      console.error('Error updating homepage:', error);
      toast.error('Failed to update homepage settings');
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
              required
            />
          </div>

          {/* Hero Background Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="heroImage">Hero Background Image</Label>
            <div className="flex items-start gap-4">
              {heroImagePreview ? (
                <div className="relative">
                  <img
                    src={heroImagePreview}
                    alt="Hero background preview"
                    className="h-32 w-auto max-w-md object-cover border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={clearHeroImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-32 w-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="heroImage"
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended: 1920x800px, JPG or PNG
                </p>
                {heroImageUploadProgress > 0 && heroImageUploadProgress < 100 && (
                  <p className="text-sm text-primary mt-1">Uploading: {heroImageUploadProgress}%</p>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <div
              className="relative h-48 rounded-lg overflow-hidden border"
              style={{
                backgroundImage: `url(${heroImagePreview || '/assets/generated/hero-ocarinas.dim_1920x800.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
              <div className="relative z-10 p-6 flex flex-col justify-center h-full">
                <h2 className="font-serif text-2xl font-bold mb-2 text-foreground">
                  {heroMotto || 'Your Hero Motto'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {promotionalText || 'Your promotional text'}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateHomepage.isPending}>
              {updateHomepage.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
