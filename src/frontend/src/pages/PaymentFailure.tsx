import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="font-serif text-3xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            We couldn't process your payment. Please try again or use a
            different payment method.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate({ to: "/checkout" })}
              variant="outline"
            >
              Try Again
            </Button>
            <Button onClick={() => navigate({ to: "/" })}>
              Return to Shop
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
