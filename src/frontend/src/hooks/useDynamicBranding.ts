import { useEffect } from "react";
import { useGetBrandingConfig } from "./useQueries";

export function useDynamicBranding() {
  const { data: brandingConfig } = useGetBrandingConfig();

  useEffect(() => {
    if (brandingConfig) {
      // Update document title
      if (brandingConfig.siteName) {
        document.title = brandingConfig.siteName;
      }

      // Update favicon
      if (brandingConfig.favicon) {
        const faviconUrl = brandingConfig.favicon.getDirectURL();
        let link: HTMLLinkElement | null =
          document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      }
    }
  }, [brandingConfig]);

  return brandingConfig;
}
