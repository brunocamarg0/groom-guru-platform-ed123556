// Cria uma preferência de pagamento no Mercado Pago para um agendamento.
// Usa o token OAuth da barbearia (Mercado Pago Connect) — o dinheiro cai direto na conta do dono.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getMPTokenForBarbearia } from "../_shared/mp-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const agendamentoId: string | undefined = body.agendamentoId;
    if (!agendamentoId) {
      return new Response(JSON.stringify({ error: "agendamentoId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: ag, error: agErr } = await admin
      .from("agendamentos")
      .select(
        "id, cliente_nome, telefone, servico_id, barbearia_id, servico:servicos(nome, preco)"
      )
      .eq("id", agendamentoId)
      .maybeSingle();

    if (agErr || !ag) {
      return new Response(JSON.stringify({ error: "Agendamento não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token OAuth da barbearia (Mercado Pago Connect)
    const mpInfo = await getMPTokenForBarbearia(ag.barbearia_id as string);
    if (!mpInfo) {
      return new Response(
        JSON.stringify({
          error: "mp_nao_conectado",
          message: "Esta barbearia ainda não conectou uma conta Mercado Pago. Pagamento online indisponível.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const valor = Number((ag.servico as any)?.preco ?? 0);
    const nomeServico = (ag.servico as any)?.nome ?? "Serviço";
    const origin = req.headers.get("origin") || "https://barbermaestro.com";

    const prefPayload = {
      items: [{ title: nomeServico, quantity: 1, currency_id: "BRL", unit_price: valor }],
      payer: { name: ag.cliente_nome },
      external_reference: agendamentoId,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      back_urls: {
        success: `${origin}/cliente/pagamento/sucesso?agendamento=${agendamentoId}`,
        failure: `${origin}/cliente/pagamento/falha?agendamento=${agendamentoId}`,
        pending: `${origin}/cliente/pagamento/pendente?agendamento=${agendamentoId}`,
      },
      auto_return: "approved",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpInfo.accessToken}`,
      },
      body: JSON.stringify(prefPayload),
    });

    const pref = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error:", pref);
      return new Response(
        JSON.stringify({ error: pref.message || "Erro Mercado Pago" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin.from("pagamentos").insert({
      agendamento_id: agendamentoId,
      valor,
      metodo: "pix",
      status: "processando",
      mercadopago_preference_id: pref.id,
    });

    await admin
      .from("agendamentos")
      .update({ forma_pagamento: "online" })
      .eq("id", agendamentoId);

    return new Response(
      JSON.stringify({
        preferenceId: pref.id,
        initPoint: pref.init_point,
        sandboxInitPoint: pref.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
