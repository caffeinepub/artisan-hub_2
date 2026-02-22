import { useEffect } from 'react';
import { useBrandingConfig } from './useQueries';

export function useDynamicBranding() {
  const { data: brandingConfig } = useBrandingConfig();

  useEffect(() => {
    // Update document title
    if (brandingConfig?.siteName) {
      document.title = brandingConfig.siteName;
    } else {
      document.title = 'Artisan Market';
    }

    // Update favicon
    const updateFavicon = () => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach((link) => link.remove());

      if (brandingConfig?.favicon) {
        // Create new favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = brandingConfig.favicon.getDirectURL();
        document.head.appendChild(link);
      } else {
        // Restore default favicon if exists
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = '/favicon.ico';
        document.head.appendChild(link);
      }
    };

    updateFavicon();
  }, [brandingConfig]);
}
