// Callback OAuth do Mercado Pago Connect.
// Recebe ?code=&state=, valida HMAC do state, troca code por tokens, salva na barbearia,
// e redireciona o usuário de volta para o painel.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

async function verifyState(state: string, secret: string): Promise<any | null> {
  const [b64, sig] = state.split(".");
  if (!b64 || !sig) return null;
  const payload = atob(b64);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try { return JSON.parse(payload); } catch { return null; }
}

function redirect(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID");
  const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const fallbackOrigin = "https://barbermaestro.com";

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (!clientId || !clientSecret) {
    return redirect(`${fallbackOrigin}/dono/configuracoes?mp=erro&motivo=config`);
  }

  let parsed: any = null;
  if (state) parsed = await verifyState(state, clientSecret);
  const origin = parsed?.o ?? fallbackOrigin;

  if (error) return redirect(`${origin}/dono/configuracoes?mp=erro&motivo=${encodeURIComponent(error)}`);
  if (!code || !parsed) return redirect(`${origin}/dono/configuracoes?mp=erro&motivo=state`);

  try {
    const redirectUri = `${supabaseUrl}/functions/v1/mercadopago-oauth-callback`;
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.access_token) {
      console.error("MP oauth exchange failed:", data);
      return redirect(`${origin}/dono/configuracoes?mp=erro&motivo=token`);
    }

    const expiresAt = new Date(Date.now() + (data.expires_in ?? 0) * 1000).toISOString();
    const admin = createClient(supabaseUrl, serviceKey);
    const { error: upErr } = await admin
      .from("barbearias")
      .update({
        mercadopago_user_id: String(data.user_id),
        mercadopago_access_token: data.access_token,
        mercadopago_refresh_token: data.refresh_token,
        mercadopago_token_expires_at: expiresAt,
        mercadopago_public_key: data.public_key ?? null,
        mercadopago_connected_at: new Date().toISOString(),
      })
      .eq("id", parsed.b);

    if (upErr) {
      console.error("MP save token failed:", upErr);
      return redirect(`${origin}/dono/configuracoes?mp=erro&motivo=save`);
    }

    return redirect(`${origin}/dono/configuracoes?mp=ok`);
  } catch (e) {
    console.error("oauth-callback error:", e);
    return redirect(`${origin}/dono/configuracoes?mp=erro&motivo=excecao`);
  }
});
