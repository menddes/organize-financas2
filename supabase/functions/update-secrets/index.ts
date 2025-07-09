
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
    console.log("Update secrets function called");
    console.log("Request method:", req.method);

    const body = await req.json();
    const { secrets } = body;

    console.log("Received secrets request:", {
      hasStripeSecretKey: !!secrets.STRIPE_SECRET_KEY,
      hasStripeWebhookSecret: !!secrets.STRIPE_WEBHOOK_SECRET,
      hasLogoUrl: !!secrets.LOGO_URL,
      hasFaviconUrl: !!secrets.FAVICON_URL,
      hasCompanyName: !!secrets.COMPANY_NAME,
      hasLogoAltText: !!secrets.LOGO_ALT_TEXT
    });

    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Unauthorized: No authorization header');
    }

    console.log("Authorization header present");

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const managementToken = Deno.env.get('MANAGEMENT_API_TOKEN');
    let projectRef = '';

    // Extrair o projectRef do URL do Supabase (formato padrão)
    if (supabaseUrl) {
      try {
        const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (urlMatch && urlMatch[1]) {
          projectRef = urlMatch[1];
          console.log('Extracted projectRef from Supabase URL:', projectRef);
        }
      } catch (error) {
        console.error('Failed to extract projectRef from URL:', error);
      }
    }

    // Verificar se conseguimos obter um projectRef
    if (!projectRef) {
      console.error('Could not extract projectRef from SUPABASE_URL');
      throw new Error('Could not determine project reference from SUPABASE_URL');
    }

    console.log("Environment variables:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasAnonKey: !!anonKey,
      hasManagementToken: !!managementToken,
      projectRef
    });

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

    console.log("User authenticated:", user.id);

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    console.log("Admin role check:", { hasAdminRole, roleError });

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      throw new Error('Failed to verify admin permissions');
    }

    if (!hasAdminRole) {
      console.error('User does not have admin permissions');
      throw new Error('Unauthorized: User does not have admin permissions');
    }

    console.log("User has admin permissions, proceeding with secrets update");

    // Validate secrets
    const errors = [];
    
    if (secrets.STRIPE_SECRET_KEY && !secrets.STRIPE_SECRET_KEY.startsWith('sk_')) {
      errors.push('Stripe Secret Key deve começar com "sk_"');
    }
    
    if (secrets.STRIPE_WEBHOOK_SECRET && !secrets.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      errors.push('Stripe Webhook Secret deve começar com "whsec_"');
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return new Response(JSON.stringify({
        success: false,
        error: errors.join(', ')
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Map of secrets to update (using valid names)
    const secretsToUpdate = {};
    
    // Stripe configuration
    if (secrets.STRIPE_SECRET_KEY && secrets.STRIPE_SECRET_KEY.trim() !== '') {
      secretsToUpdate['STRIPE_SECRET_KEY'] = secrets.STRIPE_SECRET_KEY;
    }
    
    if (secrets.STRIPE_WEBHOOK_SECRET && secrets.STRIPE_WEBHOOK_SECRET.trim() !== '') {
      secretsToUpdate['STRIPE_WEBHOOK_SECRET'] = secrets.STRIPE_WEBHOOK_SECRET;
    }
    
    if (secrets.STRIPE_PRICE_ID_MONTHLY && secrets.STRIPE_PRICE_ID_MONTHLY.trim() !== '') {
      secretsToUpdate['STRIPE_PRICE_ID_MONTHLY'] = secrets.STRIPE_PRICE_ID_MONTHLY;
    }
    
    if (secrets.STRIPE_PRICE_ID_ANNUAL && secrets.STRIPE_PRICE_ID_ANNUAL.trim() !== '') {
      secretsToUpdate['STRIPE_PRICE_ID_ANNUAL'] = secrets.STRIPE_PRICE_ID_ANNUAL;
    }
    
    // Plan pricing configuration
    if (secrets.PLAN_PRICE_MONTHLY && secrets.PLAN_PRICE_MONTHLY.trim() !== '') {
      secretsToUpdate['PLAN_PRICE_MONTHLY'] = secrets.PLAN_PRICE_MONTHLY;
    }
    
    if (secrets.PLAN_PRICE_ANNUAL && secrets.PLAN_PRICE_ANNUAL.trim() !== '') {
      secretsToUpdate['PLAN_PRICE_ANNUAL'] = secrets.PLAN_PRICE_ANNUAL;
    }
    
    // Contact configuration
    if (secrets.CONTACT_PHONE && secrets.CONTACT_PHONE.trim() !== '') {
      secretsToUpdate['CONTACT_PHONE'] = secrets.CONTACT_PHONE;
    }
    
    if (secrets.SUPPORT_EMAIL && secrets.SUPPORT_EMAIL.trim() !== '') {
      secretsToUpdate['SUPPORT_EMAIL'] = secrets.SUPPORT_EMAIL;
    }
    
    if (secrets.WHATSAPP_MESSAGE && secrets.WHATSAPP_MESSAGE.trim() !== '') {
      secretsToUpdate['WHATSAPP_MESSAGE'] = secrets.WHATSAPP_MESSAGE;
    }
    
    // Branding configuration
    if (secrets.LOGO_URL && secrets.LOGO_URL.trim() !== '') {
      secretsToUpdate['LOGO_URL'] = secrets.LOGO_URL;
    }
    
    if (secrets.FAVICON_URL && secrets.FAVICON_URL.trim() !== '') {
      secretsToUpdate['FAVICON_URL'] = secrets.FAVICON_URL;
    }
    
    if (secrets.COMPANY_NAME && secrets.COMPANY_NAME.trim() !== '') {
      secretsToUpdate['COMPANY_NAME'] = secrets.COMPANY_NAME;
    }
    
    if (secrets.LOGO_ALT_TEXT && secrets.LOGO_ALT_TEXT.trim() !== '') {
      secretsToUpdate['LOGO_ALT_TEXT'] = secrets.LOGO_ALT_TEXT;
    }
    
    console.log("Secrets to update:", Object.keys(secretsToUpdate));
    
    let updatedSecrets = [];
    let updateErrors = [];

    // If we have management token, use Management API to update secrets
    if (managementToken) {
      console.log("Using Management API to update secrets");
      
      for (const [secretName, secretValue] of Object.entries(secretsToUpdate)) {
        try {
          console.log(`Updating secret: ${secretName}`);
          
          const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${managementToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
              name: secretName,
              value: secretValue.toString()
            }])
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update secret ${secretName}:`, response.status, errorText);
            updateErrors.push(`Failed to update ${secretName}: ${response.status} ${errorText}`);
          } else {
            console.log(`Successfully updated secret: ${secretName}`);
            updatedSecrets.push(secretName);
          }
        } catch (error) {
          console.error(`Error updating secret ${secretName}:`, error);
          updateErrors.push(`Error updating ${secretName}: ${error.message}`);
        }
      }

      if (updateErrors.length > 0) {
        console.error('Some secrets failed to update:', updateErrors);
        return new Response(JSON.stringify({
          success: false,
          error: "Alguns secrets falharam ao atualizar",
          details: updateErrors,
          partialSuccess: updatedSecrets.length > 0,
          updatedSecrets
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      const response = {
        success: true,
        message: "Configurações salvas com sucesso no Supabase",
        environment: "production",
        updatedSecrets
      };

      console.log("Secrets successfully saved:", response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Fallback: Development mode simulation
      console.log("No management token found, running in development mode");

      const response = {
        success: true,
        message: "Configurações processadas (modo desenvolvimento)",
        note: "Para salvar em produção, configure MANAGEMENT_API_TOKEN nas secrets",
        environment: "development",
        secretsToUpdate: Object.keys(secretsToUpdate),
        nextSteps: [
          "1. Configure a secret MANAGEMENT_API_TOKEN no Supabase",
          "2. Obtenha o token no Dashboard do Supabase → Seu perfil → API Keys"
        ]
      };

      console.log("Secrets processed in development mode:", response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Error updating secrets:", error);
    
    let errorMessage = error.message || "Erro interno do servidor";
    let statusCode = 500;

    // Handle specific error cases
    if (errorMessage.includes('Unauthorized')) {
      statusCode = 401;
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      details: "Verifique se você tem permissões de administrador"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
