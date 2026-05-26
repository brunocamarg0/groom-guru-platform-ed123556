// Webhook do Mercado Pago — atualiza status do pagamento.
// Valida assinatura HMAC-SHA256 (x-signature) antes de processar.
// Usa o token da barbearia (Mercado Pago Connect) para consultar o pagamento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getMPTokenForBarbearia } from "../_shared/mp-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseSignatureHeader(header: string | null): { ts?: string; v1?: string } {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k && v) out[k] = v;
  }
  return { ts: out.ts, v1: out.v1 };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fallbackToken =
      Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ||
      Deno.env.get("MERCADOPAGO_ACCESS_TOKEN_TEST");
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

    const url = new URL(req.url);
    const queryDataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
    const rawBody = await req.text();
    let body: any = {};
    try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { body = {}; }
    const paymentId = body?.data?.id || queryDataId;

    // ===== Assinatura obrigatória =====
    if (!webhookSecret) {
      console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado");
      return new Response(JSON.stringify({ error: "webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ts, v1 } = parseSignatureHeader(req.headers.get("x-signature"));
    const requestId = req.headers.get("x-request-id") ?? "";

    if (!ts || !v1) {
      return new Response(JSON.stringify({ error: "missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manifest oficial do MP: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
    const manifest = `id:${paymentId ?? ""};request-id:${requestId};ts:${ts};`;
    const expected = await hmacSha256Hex(webhookSecret, manifest);

    if (!timingSafeEqual(expected, v1)) {
      console.warn("Assinatura inválida do webhook MP");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identifica barbearia pelo external_reference (agendamento) para obter o token correto.
    const admin = createClient(supabaseUrl, serviceKey);
    let mpToken: string | undefined = undefined;

    // 1ª tentativa: pelo body do webhook (rápido), depois pelo agendamento.
    const refFromBody = body?.external_reference;
    if (refFromBody) {
      const { data: ag } = await admin
        .from("agendamentos").select("barbearia_id").eq("id", refFromBody).maybeSingle();
      if (ag?.barbearia_id) {
        const info = await getMPTokenForBarbearia(ag.barbearia_id);
        if (info) mpToken = info.accessToken;
      }
    }
    if (!mpToken) mpToken = fallbackToken ?? undefined;
    if (!mpToken) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${mpToken}` } }
    );

    const mapped =
      status === "approved"
        ? "pago"
        : status === "rejected" || status === "cancelled"
        ? "cancelado"
        : status === "pending" || status === "in_process"
        ? "processando"
        : status;

    if (agendamentoId) {
      await admin
        .from("pagamentos")
        .update({
          status: mapped,
          mercadopago_payment_id: String(paymentId),
          mercadopago_status: status,
          mercadopago_payment_type: payment.payment_type_id ?? null,
          data_pagamento: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("agendamento_id", agendamentoId);

      if (status === "approved") {
        await admin
          .from("agendamentos")
          .update({ status: "confirmado" })
          .eq("id", agendamentoId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("webhook error:", e);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
