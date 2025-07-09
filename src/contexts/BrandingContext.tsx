
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingData {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  logoAltText: string;
}

interface BrandingContextType {
  branding: BrandingData;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const defaultBranding: BrandingData = {
  companyName: 'PoupeJá!',
  logoUrl: '/lovable-uploads/87f23d85-2d95-44c2-af4e-c39a251cceff.png',
  faviconUrl: '/favicon.ico',
  logoAltText: 'PoupeJá Logo'
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Carregando configurações de branding...');
      
      // Usar a nova função pública que não requer autenticação
      const { data, error: brandingError } = await supabase.functions.invoke('get-branding-config');
      
      if (brandingError) {
        console.error('Erro ao carregar configurações de branding:', brandingError);
        console.log('Usando valores padrão devido ao erro');
        // Manter valores padrão em caso de erro
        setError(null); // Não mostrar erro para o usuário, apenas usar valores padrão
        return;
      }
      
      if (data?.success && data?.data) {
        const newBranding: BrandingData = {
          companyName: data.data.COMPANY_NAME || defaultBranding.companyName,
          logoUrl: data.data.LOGO_URL || defaultBranding.logoUrl,
          faviconUrl: data.data.FAVICON_URL || defaultBranding.faviconUrl,
          logoAltText: data.data.LOGO_ALT_TEXT || defaultBranding.logoAltText,
        };
        
        console.log('Configurações de branding carregadas com sucesso:', newBranding);
        setBranding(newBranding);
        
        // Atualizar favicon no documento se foi configurado
        if (newBranding.faviconUrl !== defaultBranding.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = newBranding.faviconUrl;
          }
        }
        
        // Atualizar título da página com o nome da empresa
        document.title = `${newBranding.companyName} - Controle Financeiro`;
      } else {
        console.log('Resposta da função de branding não contém dados válidos, usando valores padrão');
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err);
      console.log('Usando valores padrão devido à exceção');
      setError(null); // Não mostrar erro, usar valores padrão
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
    
    // Configurar listener para mudanças de configuração (via localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branding-refresh') {
        loadBranding();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Configurar intervalo para verificar mudanças (fallback)
    const interval = setInterval(() => {
      const shouldRefresh = localStorage.getItem('branding-refresh');
      if (shouldRefresh) {
        localStorage.removeItem('branding-refresh');
        loadBranding();
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const refreshBranding = async () => {
    await loadBranding();
  };

  const value = {
    branding,
    isLoading,
    error,
    refreshBranding
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
