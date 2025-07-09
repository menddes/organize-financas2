// Utilitário para mapear priceId para planType e vice-versa
import { supabase } from '@/integrations/supabase/client';

// Cache para armazenar as configurações de plano
let planConfigCache: any = null;

/**
 * Busca as configurações de plano do Supabase
 */
export async function getPlanConfig() {
  if (planConfigCache) return planConfigCache;
  
  try {
    const { data, error } = await supabase.functions.invoke('get-plan-config');
    if (error) throw error;
    
    planConfigCache = data;
    return data;
  } catch (err) {
    console.error('Erro ao carregar configurações de plano:', err);
    return null;
  }
}

/**
 * Converte um priceId para o planType correspondente (monthly ou annual)
 */
export async function getPlanTypeFromPriceId(priceId: string): Promise<'monthly' | 'annual' | null> {
  const config = await getPlanConfig();
  
  if (!config) return null;
  
  if (priceId === config.prices.monthly.priceId) return 'monthly';
  if (priceId === config.prices.annual.priceId) return 'annual';
  
  console.error(`PriceId inválido: ${priceId}. Não corresponde a nenhum plano conhecido.`);
  return null;
}

/**
 * Converte um planType para o priceId correspondente
 */
export async function getPriceIdFromPlanType(planType: 'monthly' | 'annual'): Promise<string | null> {
  const config = await getPlanConfig();
  
  if (!config) return null;
  
  if (planType === 'monthly') return config.prices.monthly.priceId;
  if (planType === 'annual') return config.prices.annual.priceId;
  
  console.error(`PlanType inválido: ${planType}. Deve ser 'monthly' ou 'annual'.`);
  return null;
}

/**
 * Versão síncrona para compatibilidade com código existente
 * Usa o cache se disponível, caso contrário retorna null
 */
export function getPlanTypeFromPriceIdSync(priceId: string): 'monthly' | 'annual' | null {
  if (!planConfigCache) return null;
  
  if (priceId === planConfigCache.prices.monthly.priceId) return 'monthly';
  if (priceId === planConfigCache.prices.annual.priceId) return 'annual';
  
  return null;
}

/**
 * Versão síncrona para compatibilidade com código existente
 * Usa o cache se disponível, caso contrário retorna null
 */
export function getPriceIdFromPlanTypeSync(planType: 'monthly' | 'annual'): string | null {
  if (!planConfigCache) return null;
  
  if (planType === 'monthly') return planConfigCache.prices.monthly.priceId;
  if (planType === 'annual') return planConfigCache.prices.annual.priceId;
  
  return null;
}