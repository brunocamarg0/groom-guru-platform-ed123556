// Consulta status de um pagamento no Mercado Pago — server-side only.
// Usa o token OAuth da barbearia se fornecido (Mercado Pago Connect).
import { getMPTokenForBarbearia } from "../_shared/mp-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const paymentId = body?.paymentId;
    const barbeariaId: string | undefined = body?.barbeariaId;

    if (!paymentId || typeof paymentId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(paymentId)) {
      return new Response(JSON.stringify({ error: "paymentId inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let mpToken: string | undefined;
    if (barbeariaId) {
      const info = await getMPTokenForBarbearia(barbeariaId);
      mpToken = info?.accessToken;
    }
    if (!mpToken) {
      mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN_TEST");
    }
    if (!mpToken) {
      return new Response(JSON.stringify({ error: "MP token não disponível" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${mpToken}` } }
    );
    const data = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      return new Response(
        JSON.stringify({ error: "Falha ao consultar pagamento", status: mpRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("payment-status error:", e);
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
