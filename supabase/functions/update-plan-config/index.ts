
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
    console.log("Update plan config function called");
    console.log("Request method:", req.method);

    const body = await req.json();
    const {
      monthlyPriceId,
      annualPriceId,
      monthlyPrice,
      annualPrice,
      annualOriginalPrice,
      annualSavings,
      contactPhone
    } = body;

    console.log("Updating plan configuration with:", {
      monthlyPriceId,
      annualPriceId,
      monthlyPrice,
      annualPrice,
      annualOriginalPrice,
      annualSavings,
      contactPhone
    });

    // Get auth header to verify user is authenticated
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
    // Extrair o projectRef do URL do Supabase (formato padrão)
    let projectRef = '';
    
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

    console.log("User has admin permissions, proceeding with plan config update");

    // Map of secrets to update
    const secretsToUpdate = {
      'STRIPE_PRICE_ID_MONTHLY': monthlyPriceId,
      'STRIPE_PRICE_ID_ANNUAL': annualPriceId,
      'PLAN_PRICE_MONTHLY': monthlyPrice,
      'PLAN_PRICE_ANNUAL': annualPrice,
      'PLAN_PRICE_ANNUAL_ORIGINAL': annualOriginalPrice,
      'PLAN_SAVINGS_ANNUAL': annualSavings,
      'CONTACT_PHONE': contactPhone
    };

    let updatedSecrets = [];
    let errors = [];

    // If we have management token, use Management API to update secrets
    if (managementToken) {
      console.log("Using Management API to update secrets");
      
      for (const [secretName, secretValue] of Object.entries(secretsToUpdate)) {
        if (secretValue && secretValue.trim() !== '') {
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
              errors.push(`Failed to update ${secretName}: ${response.status} ${errorText}`);
            } else {
              console.log(`Successfully updated secret: ${secretName}`);
              updatedSecrets.push(secretName);
            }
          } catch (error) {
            console.error(`Error updating secret ${secretName}:`, error);
            errors.push(`Error updating ${secretName}: ${error.message}`);
          }
        }
      }

      if (errors.length > 0) {
        console.error('Some secrets failed to update:', errors);
        return new Response(JSON.stringify({
          success: false,
          error: "Alguns secrets falharam ao atualizar",
          details: errors,
          partialSuccess: updatedSecrets.length > 0,
          updatedSecrets
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      const response = {
        success: true,
        message: "Configurações de plano salvas com sucesso no Supabase",
        environment: "production",
        updatedSecrets,
        updatedConfig: {
          prices: {
            monthly: {
              priceId: monthlyPriceId,
              price: monthlyPrice,
              displayPrice: `R$ ${monthlyPrice}`,
            },
            annual: {
              priceId: annualPriceId,
              price: annualPrice,
              originalPrice: annualOriginalPrice,
              savings: annualSavings,
              displayPrice: `R$ ${annualPrice}`,
              displayOriginalPrice: `R$ ${annualOriginalPrice}`,
              displaySavings: `Economize ${annualSavings}%`,
            }
          },
          contact: {
            phone: contactPhone
          }
        }
      };

      console.log("Plan configuration successfully saved:", response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Fallback: Development mode simulation
      console.log("No management token found, running in development mode");

      const response = {
        success: true,
        message: "Configurações de plano processadas (modo desenvolvimento)",
        note: "Para salvar em produção, configure MANAGEMENT_API_TOKEN nas secrets",
        environment: "development",
        updatedConfig: {
          prices: {
            monthly: {
              priceId: monthlyPriceId,
              price: monthlyPrice,
              displayPrice: `R$ ${monthlyPrice}`,
            },
            annual: {
              priceId: annualPriceId,
              price: annualPrice,
              originalPrice: annualOriginalPrice,
              savings: annualSavings,
              displayPrice: `R$ ${annualPrice}`,
              displayOriginalPrice: `R$ ${annualOriginalPrice}`,
              displaySavings: `Economize ${annualSavings}%`,
            }
          },
          contact: {
            phone: contactPhone
          }
        },
        nextSteps: [
          "1. Configure a secret MANAGEMENT_API_TOKEN no Supabase",
          "2. Use o token: sbp_fba34841239421df21aac76d6f52c4935f27ac23"
          // Remover a instrução sobre PROJECT_REF
        ]
      };

      console.log("Plan configuration processed in development mode:", response);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Error updating plan configuration:", error);
    
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
