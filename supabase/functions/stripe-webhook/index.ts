
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new (await import("https://esm.sh/stripe@13.6.0")).Stripe(
  Deno.env.get("STRIPE_SECRET_KEY") || "",
  {
    apiVersion: "2023-10-16",
  }
);

const cryptoProvider = {
  computeHMACSignatureAsync: (payload, secret) => {
    const key = new TextEncoder().encode(secret);
    return crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ).then((cryptoKey) =>
      crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload))
    ).then((signature) =>
      Array.from(new Uint8Array(signature), (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('')
    );
  }
};

// Função para verificar a assinatura do Stripe
async function verifyStripeSignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) return false;
  
  try {
    await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
    return true;
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return false;
  }
}

// Adicione esta função para criar um middleware personalizado
const handleRequest = async (req: Request) => {
  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  
  // Obter o corpo da requisição uma vez e armazená-lo
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  
  // Verificar se a requisição tem uma assinatura válida do Stripe
  const isValidStripeSignature = await verifyStripeSignature(body, signature);
  
  // Se não for uma assinatura válida do Stripe, retornar erro 401
  if (!isValidStripeSignature) {
    console.error("Assinatura Stripe inválida ou ausente");
    return new Response("Unauthorized: Invalid Stripe signature", { status: 401 });
  }
  
  console.log("Assinatura Stripe válida verificada, prosseguindo com o processamento");
  
  // Se chegamos aqui, temos uma assinatura Stripe válida
  let event;
  try {
    // Reconstruir o evento do Stripe
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!signature || !webhookSecret) {
      return new Response("Missing signature or webhook secret", {
        status: 400
      });
    }
    
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // O restante do código permanece o mesmo
    switch (event.type) {
      case "checkout.session.completed":
        {
          const session = event.data.object;
          const userId = session.metadata?.user_id;

          if (!userId) {
            throw new Error("No user ID in metadata");
          }

          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Map the new price IDs to plan types
          const priceId = subscription.items.data[0].price.id;
          let planType;
          // Substitua o switch case hardcoded por:
          const monthlyPriceId = Deno.env.get('STRIPE_PRICE_ID_MONTHLY');
          const annualPriceId = Deno.env.get('STRIPE_PRICE_ID_ANNUAL');
          
          switch (priceId) {
            case monthlyPriceId:
              planType = "monthly";
              break;
            case annualPriceId:
              planType = "annual";
              break;
            default:
              console.warn(`Unknown price ID: ${priceId}`);
              planType = "monthly"; // Default fallback
          }

          console.log(`Processing subscription for price ID: ${priceId}, plan type: ${planType}`);

          await supabase.from("poupeja_subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: subscription.status,
            plan_type: planType,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          });

          console.log(`Subscription created/updated for user ${userId} with plan ${planType}`);
          break;
        }
      case "customer.subscription.updated":
        {
          const subscription = event.data.object;
          console.log("Processing subscription update:", JSON.stringify(subscription));
          
          try {
            // Verificar se os timestamps são válidos antes de converter
            const updateData = {
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end
            };
            
            // Adicionar verificações de segurança para os timestamps
            if (subscription.current_period_start && typeof subscription.current_period_start === 'number') {
              updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
            }
            
            if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
              updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
            }
            
            // Adicionar lógica para atualizar o plan_type com base no preço
            if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
              const priceId = subscription.items.data[0].price.id;
              const monthlyPriceId = Deno.env.get('STRIPE_PRICE_ID_MONTHLY');
              const annualPriceId = Deno.env.get('STRIPE_PRICE_ID_ANNUAL');
              
              let planType;
              switch (priceId) {
                case monthlyPriceId:
                  planType = "monthly";
                  break;
                case annualPriceId:
                  planType = "annual";
                  break;
                default:
                  // Verificar o intervalo como fallback
                  if (subscription.items.data[0].price.recurring?.interval === 'year') {
                    planType = "annual";
                  } else {
                    planType = "monthly"; // Default fallback
                  }
              }
              
              if (planType) {
                updateData.plan_type = planType;
                console.log(`Updating plan_type to ${planType} for subscription ${subscription.id}`);
              }
            }
            
            const updateResult = await supabase.from("poupeja_subscriptions").update(updateData)
              .eq("stripe_subscription_id", subscription.id);
            
            console.log("Update result:", JSON.stringify(updateResult));
            
            if (updateResult.error) {
              throw new Error(`Supabase update error: ${updateResult.error.message}`);
            }
            
            console.log(`Subscription updated: ${subscription.id}`);
          } catch (updateError) {
            console.error("Error updating subscription:", updateError);
            throw updateError; // Re-throw to be caught by the outer try-catch
          }
          break;
        }
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object;
          await supabase.from("poupeja_subscriptions").update({
            status: "canceled"
          }).eq("stripe_subscription_id", subscription.id);

          console.log(`Subscription canceled: ${subscription.id}`);
          break;
        }
    }

    // No final do arquivo, nas respostas
    return new Response(JSON.stringify({
      received: true,
      event: event.type
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error processing webhook:", error.message, error.stack);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature"
      },
      status: 500
    });
  }
};

// Use o middleware personalizado
serve(handleRequest);
