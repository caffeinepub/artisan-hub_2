import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-4xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including your name, email address, shipping
            address, and payment information when you make a purchase.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our products and services</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Order Fulfillment & Shipping</h2>
          <p>
            <strong>Free postage is provided on all orders.</strong> We do not collect personal shipping cost data for postage
            calculations, as postage is included at no charge for every purchase. Shipping address information is collected solely
            for the purpose of delivering your order.
          </p>

          <h2>4. Digital Products & App Access</h2>
          <p>
            Every purchase includes complimentary access to the <strong>Pro Ocarina Learning App</strong>, a digital learning tool
            for ocarina tablature and music composition. Purchase records may be used to verify and grant access to this digital
            inclusion. App access link details are displayed on your order confirmation page and are not stored beyond what is
            necessary to fulfil your order.
          </p>

          <h2>5. Returns & Refunds</h2>
          <p>
            <strong>We do not process returns or refunds.</strong> All sales are final. As a result, no return-related personal
            data (such as return shipping addresses or refund bank details) is collected or processed.
          </p>

          <h2>6. Information Sharing</h2>
          <p>
            We do not sell or rent your personal information to third parties. We may share your information with
            service providers who help us operate our business, such as payment processors and shipping companies.
          </p>

          <h2>7. Payment Processing</h2>
          <p>
            All payment information is processed securely through Stripe. We do not store your complete credit card
            information on our servers.
          </p>

          <h2>8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>9. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>

          <h2>10. Cookies</h2>
          <p>
            We use cookies and similar technologies to improve your browsing experience and analyze site traffic. You
            can control cookies through your browser settings.
          </p>

          <h2>11. Children's Privacy</h2>
          <p>
            Our services are not directed to children under 13. We do not knowingly collect personal information from
            children under 13.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            policy on this page.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through our website.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
