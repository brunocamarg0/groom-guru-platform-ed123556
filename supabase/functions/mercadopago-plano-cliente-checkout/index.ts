// Cria preferência Mercado Pago para um plano de cliente.
// Usa o token OAuth da barbearia (Mercado Pago Connect) — o pagamento cai na conta do dono.
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
    const planoId: string | undefined = body.planoId;
    const pagamentoRecorrente: boolean = !!body.pagamentoRecorrente;
    const profissionalId: string | null = body.profissionalId ?? null;
    if (!planoId) {
      return new Response(JSON.stringify({ error: "planoId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Plano + barbearia
    const { data: plano, error: pErr } = await admin
      .from("planos_cliente")
      .select("id, nome, valor, duracao_meses, barbearia_id, ativo")
      .eq("id", planoId)
      .maybeSingle();
    if (pErr || !plano || !plano.ativo) {
      return new Response(JSON.stringify({ error: "Plano inválido ou inativo" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente vinculado ao user logado
    const { data: cliente, error: cErr } = await admin
      .from("clientes")
      .select("id, nome, email")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (cErr || !cliente) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token OAuth da barbearia
    const mpInfo = await getMPTokenForBarbearia(plano.barbearia_id as string);
    if (!mpInfo) {
      return new Response(
        JSON.stringify({
          error: "mp_nao_conectado",
          message: "Esta barbearia ainda não conectou uma conta Mercado Pago.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cria assinatura pendente
    const agora = new Date();
    const venc = new Date(agora);
    venc.setMonth(venc.getMonth() + Number(plano.duracao_meses || 1));

    const { data: assinatura, error: aErr } = await admin
      .from("assinaturas_cliente")
      .insert({
        cliente_id: cliente.id,
        plano_id: plano.id,
        profissional_id: profissionalId,
        status: "pendente",
        pagamento_recorrente: pagamentoRecorrente,
        data_inicio: agora.toISOString(),
        data_vencimento: venc.toISOString(),
        proximo_vencimento: venc.toISOString(),
      })
      .select("id")
      .single();
    if (aErr || !assinatura) {
      console.error("assinatura insert error:", aErr);
      return new Response(JSON.stringify({ error: "Falha ao criar assinatura" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://barbermaestro.com";

    const prefPayload = {
      items: [{
        title: `Plano ${plano.nome}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(plano.valor),
      }],
      payer: { name: cliente.nome, email: cliente.email },
      external_reference: `plano_cliente:${assinatura.id}`,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      back_urls: {
        success: `${origin}/cliente/assinatura?status=sucesso`,
        failure: `${origin}/cliente/planos?status=falha`,
        pending: `${origin}/cliente/assinatura?status=pendente`,
      },
      auto_return: "approved",
      metadata: { tipo: "plano_cliente", assinatura_id: assinatura.id },
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

    await admin.from("pagamentos_assinatura").insert({
      assinatura_id: assinatura.id,
      valor: Number(plano.valor),
      status: "pendente",
      metodo_pagamento: "pix",
      data_vencimento: venc.toISOString(),
      mercadopago_preference_id: pref.id,
      link_pagamento: pref.init_point,
    });

    return new Response(
      JSON.stringify({
        assinaturaId: assinatura.id,
        preferenceId: pref.id,
        initPoint: pref.init_point,
        sandboxInitPoint: pref.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("plano-cliente-checkout error:", e);
    return new Response(JSON.stringify({ error: e?.message || "internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
