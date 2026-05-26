// Desconecta a conta Mercado Pago de uma barbearia.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("barbearia_id, role")
      .eq("user_id", user.id)
      .in("role", ["owner", "super_admin"])
      .maybeSingle();

    const body = await req.json().catch(() => ({}));
    const barbeariaId: string | undefined = body.barbeariaId || roleRow?.barbearia_id;
    if (!barbeariaId) {
      return new Response(JSON.stringify({ error: "Barbearia não identificada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("barbearias")
      .update({
        mercadopago_user_id: null,
        mercadopago_access_token: null,
        mercadopago_refresh_token: null,
        mercadopago_token_expires_at: null,
        mercadopago_public_key: null,
        mercadopago_connected_at: null,
      })
      .eq("id", barbeariaId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("disconnect error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
