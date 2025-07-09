
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanConfig {
  prices: {
    monthly: {
      priceId: string;
      price: string;
      displayPrice: string;
    };
    annual: {
      priceId: string;
      price: string;
      originalPrice: string;
      savings: string;
      displayPrice: string;
      displayOriginalPrice: string;
      displaySavings: string;
    };
  };
  contact: {
    phone: string;
  };
}

export const usePlanConfig = () => {
  const [config, setConfig] = useState<PlanConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('get-plan-config');
        
        if (error) throw error;
        
        setConfig(data);
        setError(null);
      } catch (err) {
        console.error('Error loading plan config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        
        // Definir valores vazios em vez de usar variáveis de ambiente
        setConfig({
          prices: {
            monthly: {
              priceId: '',
              price: '',
              displayPrice: 'R$ -',
            },
            annual: {
              priceId: '',
              price: '',
              originalPrice: '',
              savings: '',
              displayPrice: 'R$ -',
              displayOriginalPrice: 'R$ -',
              displaySavings: 'Economize -%',
            }
          },
          contact: {
            phone: ''
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, isLoading, error };
};
