
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
    console.log("Get branding config function called (public)");

    // Esta função é pública - não requer autenticação
    // Retorna apenas configurações de branding que são seguras para serem públicas
    
    // Configurações de branding (públicas)
    const logoUrl = Deno.env.get('LOGO_URL') || '/lovable-uploads/87f23d85-2d95-44c2-af4e-c39a251cceff.png';
    const faviconUrl = Deno.env.get('FAVICON_URL') || '/favicon.ico';
    const companyName = Deno.env.get('COMPANY_NAME') || 'PoupeJá!';
    const logoAltText = Deno.env.get('LOGO_ALT_TEXT') || 'PoupeJá Logo';

    const response = {
      success: true,
      data: {
        LOGO_URL: logoUrl,
        FAVICON_URL: faviconUrl,
        COMPANY_NAME: companyName,
        LOGO_ALT_TEXT: logoAltText,
      }
    };

    console.log("Returning branding config:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error getting branding config:", error);
    
    // Em caso de erro, retornar valores padrão
    const fallbackResponse = {
      success: true,
      data: {
        LOGO_URL: '/lovable-uploads/87f23d85-2d95-44c2-af4e-c39a251cceff.png',
        FAVICON_URL: '/favicon.ico',
        COMPANY_NAME: 'PoupeJá!',
        LOGO_ALT_TEXT: 'PoupeJá Logo',
      }
    };

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
