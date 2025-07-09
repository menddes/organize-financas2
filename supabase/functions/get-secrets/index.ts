
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    console.log("Get secrets function called");

    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Unauthorized: No authorization header');
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY');
    
    // Configurações de preços e planos
    const planPriceMonthly = Deno.env.get('PLAN_PRICE_MONTHLY') || '';
    const planPriceAnnual = Deno.env.get('PLAN_PRICE_ANNUAL') || '';
    
    // Configurações de contato
    const contactPhone = Deno.env.get('CONTACT_PHONE') || '';
    const supportEmail = Deno.env.get('SUPPORT_EMAIL') || '';
    const whatsappMessage = Deno.env.get('WHATSAPP_MESSAGE') || '';
    
    // Configurações do Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
    const stripePriceIdMonthly = Deno.env.get('STRIPE_PRICE_ID_MONTHLY') || '';
    const stripePriceIdAnnual = Deno.env.get('STRIPE_PRICE_ID_ANNUAL') || '';
    
    // Configurações de branding
    const logoUrl = Deno.env.get('LOGO_URL') || '';
    const faviconUrl = Deno.env.get('FAVICON_URL') || '';
    const companyName = Deno.env.get('COMPANY_NAME') || '';
    const logoAltText = Deno.env.get('LOGO_ALT_TEXT') || '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client to verify user
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      throw new Error('Unauthorized: Invalid user session');
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      throw new Error('Failed to verify admin permissions');
    }

    if (!hasAdminRole) {
      console.error('User does not have admin permissions');
      throw new Error('Unauthorized: User does not have admin permissions');
    }

    const response = {
      success: true,
      data: {
        // Preços
        PLAN_PRICE_MONTHLY: planPriceMonthly,
        PLAN_PRICE_ANNUAL: planPriceAnnual,
        
        // Contato
        CONTACT_PHONE: contactPhone,
        SUPPORT_EMAIL: supportEmail,
        WHATSAPP_MESSAGE: whatsappMessage,
        
        // Stripe
        STRIPE_SECRET_KEY: stripeSecretKey,
        STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
        STRIPE_PRICE_ID_MONTHLY: stripePriceIdMonthly,
        STRIPE_PRICE_ID_ANNUAL: stripePriceIdAnnual,
        
        // Branding
        LOGO_URL: logoUrl,
        FAVICON_URL: faviconUrl,
        COMPANY_NAME: companyName,
        LOGO_ALT_TEXT: logoAltText,
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error getting secrets:", error);
    
    let errorMessage = error.message || "Erro interno do servidor";
    let statusCode = 500;

    if (errorMessage.includes('Unauthorized')) {
      statusCode = 401;
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
