// Helper para obter o access token OAuth do Mercado Pago de uma barbearia.
// Renova automaticamente se estiver expirado (refresh_token).
// Faz fallback para o token global apenas se a barbearia não conectou (assinatura).
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface MPBarbeariaToken {
  accessToken: string;
  userId: string | null;
  publicKey: string | null;
  source: "barbearia" | "global";
}

export function getAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function refreshToken(
  admin: SupabaseClient,
  barbeariaId: string,
  refresh: string,
): Promise<string | null> {
  const clientId = Deno.env.get("MERCADOPAGO_CLIENT_ID");
  const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });
  if (!res.ok) {
    console.error("MP refresh failed:", await res.text());
    return null;
  }
  const data = await res.json();
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 0) * 1000).toISOString();
  await admin
    .from("barbearias")
    .update({
      mercadopago_access_token: data.access_token,
      mercadopago_refresh_token: data.refresh_token ?? refresh,
      mercadopago_token_expires_at: expiresAt,
      mercadopago_public_key: data.public_key ?? null,
    })
    .eq("id", barbeariaId);
  return data.access_token;
}

export async function getMPTokenForBarbearia(
  barbeariaId: string,
): Promise<MPBarbeariaToken | null> {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("barbearias")
    .select(
      "mercadopago_access_token, mercadopago_refresh_token, mercadopago_token_expires_at, mercadopago_user_id, mercadopago_public_key",
    )
    .eq("id", barbeariaId)
    .maybeSingle();

  if (error) console.error("getMPTokenForBarbearia error:", error);

  if (data?.mercadopago_access_token) {
    const exp = data.mercadopago_token_expires_at
      ? new Date(data.mercadopago_token_expires_at).getTime()
      : 0;
    // Renova se faltar menos de 1 dia para expirar
    if (exp && exp - Date.now() < 24 * 60 * 60 * 1000 && data.mercadopago_refresh_token) {
      const novo = await refreshToken(admin, barbeariaId, data.mercadopago_refresh_token);
      if (novo) {
        return {
          accessToken: novo,
          userId: data.mercadopago_user_id,
          publicKey: data.mercadopago_public_key,
          source: "barbearia",
        };
      }
    }
    return {
      accessToken: data.mercadopago_access_token,
      userId: data.mercadopago_user_id,
      publicKey: data.mercadopago_public_key,
      source: "barbearia",
    };
  }
  return null;
}
