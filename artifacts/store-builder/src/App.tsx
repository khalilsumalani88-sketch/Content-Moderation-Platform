import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useEffect, useRef } from "react";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

setBaseUrl(basePath);

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(142.1 76.2% 36.3%)",
    colorForeground: "hsl(222.2 84% 4.9%)",
    colorMutedForeground: "hsl(215.4 16.3% 46.9%)",
    colorDanger: "hsl(0 84.2% 60.2%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(222.2 84% 4.9%)",
    colorNeutral: "hsl(214.3 31.8% 91.4%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-gray-900",
    headerSubtitle: "text-sm text-gray-500",
    socialButtonsBlockButtonText: "text-sm font-medium",
    formFieldLabel: "text-sm font-medium text-gray-700",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-gray-500 text-sm",
    dividerText: "text-xs text-gray-500",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-600 text-sm",
    alertText: "text-sm",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
    formFieldInput: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
    footerAction: "flex items-center justify-center gap-1",
    dividerLine: "bg-border h-px",
    alert: "rounded-md p-3",
    otpCodeFieldInput: "border-input",
    formFieldRow: "space-y-2",
    main: "space-y-4",
  },
};

function ClerkAuthSyncer() {
  const { addListener, session } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!session) return null;
      return session.getToken();
    });
  }, [session]);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Pages
import Home from "@/pages/home";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Products from "@/pages/products";
import ProductForm from "@/pages/product-form";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Settings from "@/pages/settings";
import Storefront from "@/pages/storefront";
import Subscription from "@/pages/subscription";
import AiTools from "@/pages/ai-tools";
import Referrals from "@/pages/referrals";
import Growth from "@/pages/growth";
import AdminPanel from "@/pages/admin";

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, props }: { component: React.ComponentType<any>; props?: Record<string, unknown> }) {
  return (
    <>
      <Show when="signed-in">
        <Component {...(props ?? {})} />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* Protected dashboard routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/products">
        <ProtectedRoute component={Products} />
      </Route>
      <Route path="/products/new">
        <ProtectedRoute component={ProductForm} />
      </Route>
      <Route path="/products/:id/edit">
        {(params) => <ProtectedRoute component={ProductForm} props={{ isEdit: true }} />}
      </Route>
      <Route path="/orders">
        <ProtectedRoute component={Orders} />
      </Route>
      <Route path="/orders/:id">
        <ProtectedRoute component={OrderDetail} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/subscription">
        <ProtectedRoute component={Subscription} />
      </Route>
      <Route path="/ai-tools">
        <ProtectedRoute component={AiTools} />
      </Route>
      <Route path="/referrals">
        <ProtectedRoute component={Referrals} />
      </Route>
      <Route path="/growth">
        <ProtectedRoute component={Growth} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} />
      </Route>

      {/* Public storefront */}
      <Route path="/store/:slug" component={Storefront} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProvider
            publishableKey={clerkPubKey}
            proxyUrl={clerkProxyUrl}
            appearance={clerkAppearance}
            signInUrl={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            routerPush={(to) => setLocation(stripBase(to))}
            routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
          >
            <ClerkAuthSyncer />
            <Router />
          </ClerkProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
