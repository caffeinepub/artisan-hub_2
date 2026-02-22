import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-4xl">Terms & Conditions</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Artisan Hub. By accessing and using this marketplace, you agree to be bound by these Terms and
            Conditions. Please read them carefully before making any purchase.
          </p>

          <h2>2. Products and Services</h2>
          <p>
            All products sold on Artisan Hub are handmade and unique. While we strive to accurately represent each
            item, slight variations may occur due to the handcrafted nature of our products.
          </p>

          <h2>3. Pricing and Payment</h2>
          <p>
            All prices are listed in USD. Payment is processed securely through Stripe. We accept major credit and
            debit cards. Prices are subject to change without notice.
          </p>

          <h2>4. Shipping and Delivery</h2>
          <p>
            Shipping times vary depending on your location and the product. We will provide estimated delivery times at
            checkout. We are not responsible for delays caused by shipping carriers.
          </p>

          <h2>5. Returns and Refunds</h2>
          <p>
            Due to the handmade nature of our products, we have a limited return policy. Please contact us within 7
            days of receiving your order if you have any concerns.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content on this website, including images, text, and designs, is the property of Artisan Hub and is
            protected by copyright laws.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            Artisan Hub is not liable for any indirect, incidental, or consequential damages arising from the use of
            our products or services.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the site after changes constitutes
            acceptance of the new terms.
          </p>

          <h2>9. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us through our website.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
