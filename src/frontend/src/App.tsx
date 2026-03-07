import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { useDynamicBranding } from "./hooks/useDynamicBranding";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import OcarinaStudio from "./pages/OcarinaStudio";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentSuccess from "./pages/PaymentSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShoppingBasket from "./pages/ShoppingBasket";
import Terms from "./pages/Terms";

function AppContent() {
  useDynamicBranding();
  return null;
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Marketplace,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

const basketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/basket",
  component: ShoppingBasket,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: Checkout,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-success",
  component: PaymentSuccess,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment-failure",
  component: PaymentFailure,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: Terms,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy-policy",
  component: PrivacyPolicy,
});

const ocarinaStudioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ocarina-studio",
  component: OcarinaStudio,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  basketRoute,
  checkoutRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  termsRoute,
  privacyRoute,
  ocarinaStudioRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppContent />
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
