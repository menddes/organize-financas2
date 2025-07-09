
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContactConfig {
  contactPhone: string;
  whatsappMessage: string;
  supportEmail: string;
}

export const useContactConfig = () => {
  const [config, setConfig] = useState<ContactConfig>({
    contactPhone: '5534998773972', // fallback
    whatsappMessage: 'Olá! Acabei de assinar o PoupeJá e gostaria de ativar minha conta.',
    supportEmail: 'suporte@poupeja.com'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-branding-config');
        
        if (error) {
          console.error('Erro ao buscar configurações:', error);
          setError('Erro ao carregar configurações');
          return;
        }
        
        if (data?.success && data?.data) {
          // Usar configurações do branding primeiro, depois tentar get-secrets
          try {
            const { data: secretsData } = await supabase.functions.invoke('get-secrets');
            if (secretsData?.success && secretsData?.data) {
              setConfig({
                contactPhone: secretsData.data.CONTACT_PHONE || config.contactPhone,
                whatsappMessage: secretsData.data.WHATSAPP_MESSAGE || config.whatsappMessage,
                supportEmail: secretsData.data.SUPPORT_EMAIL || config.supportEmail
              });
            }
          } catch (secretError) {
            console.log('Usando configurações padrão (secrets não disponíveis)');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar configurações:', err);
        setError('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactConfig();
  }, []);

  return { config, isLoading, error };
};
