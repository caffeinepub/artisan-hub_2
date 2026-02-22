import { useNavigate } from '@tanstack/react-router';
import { Heart } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(window.location.hostname || 'artisan-hub');

  return (
    <footer className="border-t border-border/40 bg-muted/30 mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">Artisan Hub</h3>
            <p className="text-sm text-muted-foreground">
              Discover unique handmade treasures crafted with love and care.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Legal</h4>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => navigate({ to: '/terms' })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => navigate({ to: '/privacy-policy' })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Privacy Policy
              </button>
            </nav>
          </div>
          <div>
            <h4 className="font-medium mb-3">Connect</h4>
            <p className="text-sm text-muted-foreground">
              Questions? We'd love to hear from you.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Artisan Hub. All rights reserved.
          </p>
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
