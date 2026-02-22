import { Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, User, LogOut, LayoutDashboard, ShoppingBasket } from 'lucide-react';
import Footer from './Footer';
import { useGetCartItemCount, useBrandingConfig } from '../hooks/useQueries';

export default function Layout() {
  const navigate = useNavigate();
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: cartCount = 0 } = useGetCartItemCount();
  const { data: brandingConfig } = useBrandingConfig();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const siteName = brandingConfig?.siteName || 'Original Creations Market';
  const logoUrl = brandingConfig?.logo?.getDirectURL();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 w-auto max-h-8 object-contain" />
            ) : (
              <>
                <ShoppingBag className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl font-bold">{siteName}</span>
              </>
            )}
          </button>
          <nav className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/basket' })}
                  className="relative gap-2"
                >
                  <ShoppingBasket className="h-4 w-4" />
                  Basket
                  {cartCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard' })}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </>
            )}
            <Button
              onClick={handleAuth}
              disabled={loginStatus === 'logging-in'}
              variant={isAuthenticated ? 'outline' : 'default'}
              size="sm"
              className="gap-2"
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  {loginStatus === 'logging-in' ? 'Logging in...' : 'Login'}
                </>
              )}
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
