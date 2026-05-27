// Helper para obter o access token OAuth do Mercado Pago de uma barbearia.
// Lê de tabela privada `barbearia_mp_credentials` (somente service_role).
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
    .from("barbearia_mp_credentials")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refresh,
      token_expires_at: expiresAt,
      public_key: data.public_key ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("barbearia_id", barbeariaId);
  return data.access_token;
}

export async function getMPTokenForBarbearia(
  barbeariaId: string,
): Promise<MPBarbeariaToken | null> {
  const admin = getAdmin();
  const { data, error } = await admin
    .from("barbearia_mp_credentials")
    .select("access_token, refresh_token, token_expires_at, mp_user_id, public_key")
    .eq("barbearia_id", barbeariaId)
    .maybeSingle();

  if (error) console.error("getMPTokenForBarbearia error:", error);

  if (data?.access_token) {
    const exp = data.token_expires_at ? new Date(data.token_expires_at).getTime() : 0;
    if (exp && exp - Date.now() < 24 * 60 * 60 * 1000 && data.refresh_token) {
      const novo = await refreshToken(admin, barbeariaId, data.refresh_token);
      if (novo) {
        return {
          accessToken: novo,
          userId: data.mp_user_id,
          publicKey: data.public_key,
          source: "barbearia",
        };
      }
    }
    return {
      accessToken: data.access_token,
      userId: data.mp_user_id,
      publicKey: data.public_key,
      source: "barbearia",
    };
  }
  return null;
}
