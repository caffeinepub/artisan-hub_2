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
            Welcome to Original Creations Hub. By accessing and using this marketplace, you agree to be bound by these Terms and
            Conditions. Please read them carefully before making any purchase.
          </p>

          <h2>2. Products and Services</h2>
          <p>
            All products sold on Original Creations Hub are original designs and unique creations. While we strive to accurately represent each
            item, slight variations may occur due to the custom-made nature of our products.
          </p>

          <h2>3. Pricing and Payment</h2>
          <p>
            All prices are listed in Australian Dollars (AUD). Payment is processed securely through Stripe. We accept major credit and
            debit cards. Prices are subject to change without notice.
          </p>

          <h2>4. Shipping and Delivery</h2>
          <p>
            <strong>Free postage is included on every order with no minimum purchase required.</strong> We ship to all eligible destinations
            and will provide estimated delivery times at checkout. We are not responsible for delays caused by shipping carriers or
            circumstances beyond our control.
          </p>

          <h2>5. Returns and Refunds</h2>
          <p>
            <strong>All sales are final. We do not accept returns or offer refunds for any purchases.</strong> Due to the custom-made and
            unique nature of our products, we are unable to process returns or exchanges. Please review your order carefully before completing
            your purchase. If you receive a damaged or incorrect item, please contact us immediately so we can assess the situation.
          </p>

          <h2>6. Digital Inclusions — Pro Ocarina Learning App</h2>
          <p>
            Every purchase from Original Creations Hub includes complimentary access to the <strong>Pro Ocarina Learning App</strong>, a
            digital tool for learning to read ocarina tablature and composing music on the ocarina. Access details will be provided on your
            order confirmation page. This digital inclusion is provided as a courtesy and is subject to availability. We reserve the right
            to modify or discontinue the app access at any time with reasonable notice.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            All content on this website, including images, text, and designs, is the property of Original Creations Hub and is
            protected by copyright laws.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            Original Creations Hub is not liable for any indirect, incidental, or consequential damages arising from the use of
            our products or services.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the site after changes constitutes
            acceptance of the new terms.
          </p>

          <h2>10. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us through our website.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
