import { useState, useEffect } from 'react';
import { useGetShopDetails, useUpdateShopDetails } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ShopDetails } from '../backend';

export default function ShopDetailsSettings() {
  const { data: shopDetails, isLoading } = useGetShopDetails();
  const updateDetails = useUpdateShopDetails();

  const [formData, setFormData] = useState<ShopDetails>({
    shopName: '',
    address: {
      street: '',
      city: '',
      zipcode: '',
      country: '',
    },
    contactDetails: {
      phone: '',
      email: '',
    },
    openingHours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    },
    companyDetails: {
      vatId: '',
      taxId: '',
    },
  });

  useEffect(() => {
    if (shopDetails) {
      setFormData(shopDetails);
    }
  }, [shopDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (formData.contactDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactDetails.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      await updateDetails.mutateAsync(formData);
      toast.success('Shop details updated successfully');
    } catch (error) {
      console.error('Error updating shop details:', error);
      toast.error('Failed to update shop details');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shop Details</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Details</CardTitle>
        <CardDescription>Manage your shop information and contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              placeholder="Enter shop name"
            />
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contactDetails.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactDetails: { ...formData.contactDetails, email: e.target.value },
                    })
                  }
                  placeholder="shop@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.contactDetails.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactDetails: { ...formData.contactDetails, phone: e.target.value },
                    })
                  }
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Address</h3>
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zip Code</Label>
                <Input
                  id="zipcode"
                  value={formData.address.zipcode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zipcode: e.target.value },
                    })
                  }
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, country: e.target.value },
                    })
                  }
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatId">VAT ID</Label>
                <Input
                  id="vatId"
                  value={formData.companyDetails.vatId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyDetails: { ...formData.companyDetails, vatId: e.target.value },
                    })
                  }
                  placeholder="VAT123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.companyDetails.taxId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyDetails: { ...formData.companyDetails, taxId: e.target.value },
                    })
                  }
                  placeholder="TAX123456"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateDetails.isPending}>
              {updateDetails.isPending ? (
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
