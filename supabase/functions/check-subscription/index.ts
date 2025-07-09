import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, session_id } = await req.json();
    
    if (!email) {
      throw new Error("Email é obrigatório");
    }
    
    console.log(`Verificando usuário com email: ${email}`);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Alterado de SUPABASE_ANON_KEY para SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Verificar se o usuário existe no Auth
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    });
    
    if (userError) {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`);
    }
    
    const user = users?.users?.[0];
    
    if (!user) {
      return new Response(
        JSON.stringify({ exists: false, message: "Usuário não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se o usuário tem uma assinatura
    const { data: subscription, error: subscriptionError } = await supabase
      .from("poupeja_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (subscriptionError && !subscriptionError.message.includes("No rows found")) {
      throw new Error(`Erro ao buscar assinatura: ${subscriptionError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        exists: true,
        hasSubscription: !!subscription,
        user: {
          id: user.id,
          email: user.email
        },
        subscription: subscription || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});