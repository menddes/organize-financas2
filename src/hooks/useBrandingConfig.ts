
import { useBranding } from '@/contexts/BrandingContext';

export const useBrandingConfig = () => {
  const { branding, isLoading, error, refreshBranding } = useBranding();
  
  return {
    companyName: branding.companyName,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    logoAltText: branding.logoAltText,
    isLoading,
    error,
    refreshBranding
  };
};
