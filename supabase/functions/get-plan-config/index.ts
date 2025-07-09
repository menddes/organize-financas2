
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Buscar todas as configurações das variáveis de ambiente do Supabase
    const monthlyPrice = Deno.env.get("PLAN_PRICE_MONTHLY") || "";
    const annualPrice = Deno.env.get("PLAN_PRICE_ANNUAL") || "";
    
    // Converter strings para números, tratando formatação brasileira
    const monthlyValue = parseFloat(monthlyPrice.replace(',', '.'));
    const annualValue = parseFloat(annualPrice.replace(',', '.'));
    
    // Calcular preço anual original (12 * mensal)
    const originalAnnualValue = monthlyValue * 12;
    
    // Calcular porcentagem de desconto
    let discountPercentage = "0";
    if (monthlyValue > 0 && annualValue > 0) {
      const discount = ((originalAnnualValue - annualValue) / originalAnnualValue) * 100;
      discountPercentage = discount.toFixed(0);
    }
    
    const config = {
      prices: {
        monthly: {
          priceId: Deno.env.get("STRIPE_PRICE_ID_MONTHLY") || "",
          price: monthlyPrice,
          displayPrice: `R$ ${monthlyPrice}`,
        },
        annual: {
          priceId: Deno.env.get("STRIPE_PRICE_ID_ANNUAL") || "",
          price: annualPrice,
          originalPrice: originalAnnualValue.toFixed(2).replace('.', ','),
          savings: discountPercentage,
          displayPrice: `R$ ${annualPrice}`,
          displayOriginalPrice: `R$ ${originalAnnualValue.toFixed(2).replace('.', ',')}`,
          displaySavings: `Economize ${discountPercentage}%`,
        }
      },
      contact: {
        phone: Deno.env.get("CONTACT_PHONE") || ""
      }
    };

    console.log("Plan configuration loaded:", config);

    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error loading plan configuration:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
