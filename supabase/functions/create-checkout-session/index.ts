
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função helper para logs de depuração
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Função para verificar se o token é anônimo
const isAnonymousToken = (token: string): boolean => {
  try {
    // Decodificar o payload do JWT (parte do meio)
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    const decoded = JSON.parse(atob(payload));
    logStep("Token payload analysis", { 
      role: decoded.role, 
      sub: decoded.sub ? "present" : "missing",
      email: decoded.email ? "present" : "missing"
    });
    
    // Se o role é anon ou não tem sub, é token anônimo
    return decoded.role === 'anon' || !decoded.sub;
  } catch (error) {
    logStep("Error analyzing token", { error: error.message });
    return true;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get request body
    const { planType, successUrl, cancelUrl } = await req.json();
    logStep("Received parameters", { planType, successUrl, cancelUrl });
    
    // Verificar header de autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found", { headerExists: true, headerLength: authHeader.length });
    
    // Extrair e analisar token
    const token = authHeader.replace("Bearer ", "");
    logStep("Token extracted from header", { tokenLength: token.length });
    
    // Verificar se é token anônimo
    if (isAnonymousToken(token)) {
      logStep("ERROR: Anonymous token detected");
      throw new Error("Token anônimo detectado. É necessário estar autenticado com uma conta válida para criar uma sessão de checkout.");
    }
    
    // Initialize Supabase client with auth header
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    let user;
    let userError;
    
    // Primeira tentativa: usar getUser() com o client configurado
    logStep("Attempting to get user data (method 1)");
    const { data: userData1, error: userError1 } = await supabaseClient.auth.getUser();
    
    if (!userError1 && userData1.user && userData1.user.id) {
      user = userData1.user;
      logStep("User authenticated via method 1", { userId: user.id, email: user.email });
    } else {
      // Segunda tentativa: usar getUser(token) explicitamente
      logStep("Attempting to get user data (method 2)", { error1: userError1?.message });
      const { data: userData2, error: userError2 } = await supabaseClient.auth.getUser(token);
      
      if (!userError2 && userData2.user && userData2.user.id) {
        user = userData2.user;
        logStep("User authenticated via method 2", { userId: user.id, email: user.email });
      } else {
        userError = userError2;
        logStep("Both authentication methods failed", { 
          error1: userError1?.message, 
          error2: userError2?.message,
          tokenStart: token.substring(0, 20) + "..." 
        });
      }
    }
    
    if (userError || !user || !user.id) {
      logStep("ERROR: User authentication failed", { 
        error: userError?.message || "No user found",
        code: userError?.status || "unknown",
        hasUser: !!user,
        hasUserId: user?.id ? "present" : "missing"
      });
      throw new Error(`User authentication failed: ${userError?.message || "Unable to authenticate user"}`);
    }
    
    if (!user.email) {
      logStep("ERROR: User email not found");
      throw new Error("User email not available");
    }
    
    logStep("User authenticated successfully", { userId: user.id, email: user.email });
    
    // Determinar o priceId com base no tipo de plano
    let priceId;
    if (planType === 'monthly') {
      priceId = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
    } else if (planType === 'annual') {
      priceId = Deno.env.get("STRIPE_PRICE_ID_ANNUAL");
    } else {
      throw new Error("Tipo de plano inválido. Deve ser 'monthly' ou 'annual'");
    }
    
    logStep("Using priceId", { priceId, planType });
    
    if (!priceId) {
      throw new Error(`ID de preço não encontrado para o tipo de plano: ${planType}`);
    }
    
    // Verificar se o priceId corresponde a um dos valores esperados
    const validPriceIds = [
      Deno.env.get("STRIPE_PRICE_ID_MONTHLY"),
      Deno.env.get("STRIPE_PRICE_ID_ANNUAL")
    ];
    
    if (!validPriceIds.includes(priceId)) {
      logStep("ERROR: Invalid priceId", { receivedPriceId: priceId, validPriceIds });
      throw new Error("priceId inválido");
    }
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    logStep("Stripe initialized successfully");
    
    // Check if user already has a customer ID
    const { data: customerData } = await supabaseClient
      .from("poupeja_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    
    let customerId = customerData?.stripe_customer_id;
    logStep("Checked existing customer", { customerId });
    
    // If no customer exists, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
      
      // Save customer ID to database
      await supabaseClient.from("poupeja_customers").insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        email: user.email,
      });
      
      logStep("Saved customer to database");
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });
    
    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });
    
    // Return the checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout-session", { message: errorMessage });
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
