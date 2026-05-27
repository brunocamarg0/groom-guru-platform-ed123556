// Cria preferência Mercado Pago para a assinatura do dono (SaaS).
// Usa o token GLOBAL da plataforma (MERCADOPAGO_ACCESS_TOKEN), não o token da barbearia.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLANOS: Record<string, { nome: string; valor: number }> = {
  basico: { nome: "Plano Básico - Barber Maestro", valor: 97 },
  profissional: { nome: "Plano Profissional - Barber Maestro", valor: 197 },
  professional: { nome: "Plano Profissional - Barber Maestro", valor: 197 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const plano = String(body.plano || "basico").toLowerCase();
    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    const cfg = PLANOS[plano];
    if (!cfg) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!nome || !email) {
      return new Response(JSON.stringify({ error: "Nome e e-mail são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://barbermaestro.com";

    const preference = {
      items: [{
        id: `assinatura-${plano}`,
        title: cfg.nome,
        description: `Mensalidade ${cfg.nome}`,
        quantity: 1,
        unit_price: cfg.valor,
        currency_id: "BRL",
      }],
      payer: { name: nome, email },
      back_urls: {
        success: `${origin}/pagamento-assinatura-sucesso?plano=${plano}`,
        failure: `${origin}/pagamento-assinatura-falha?plano=${plano}`,
        pending: `${origin}/pagamento-assinatura-sucesso?plano=${plano}&status=pending`,
      },
      auto_return: "approved",
      statement_descriptor: "BARBER MAESTRO",
      metadata: { plano, tipo: "assinatura_dono", email },
      external_reference: `assinatura_${plano}_${Date.now()}`,
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("MP preference error:", data);
      return new Response(JSON.stringify({
        error: "Falha ao criar preferência no Mercado Pago",
        detalhes: data?.message || data?.error || JSON.stringify(data),
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("assinatura-dono-checkout error:", e);
    return new Response(JSON.stringify({ error: e?.message || "internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
