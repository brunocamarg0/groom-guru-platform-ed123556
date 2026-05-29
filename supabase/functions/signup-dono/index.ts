// Edge function: cadastro de Dono (cria auth user + barbearia + user_role owner)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  nomeBarbearia: string;
  nomeContato: string;
  telefone: string;
  email: string;
  senha: string;
  endereco?: string | null;
  bairro: string;
  cidade: string;
  cep?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;

    // validação básica
    const required = ["nomeBarbearia", "nomeContato", "telefone", "email", "senha", "bairro", "cidade"] as const;
    for (const f of required) {
      if (!body[f] || String(body[f]).trim() === "") {
        return new Response(JSON.stringify({ error: `Campo obrigatório: ${f}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (body.senha.length < 6 || body.senha.length > 72) {
      return new Response(JSON.stringify({ error: "Senha deve ter entre 6 e 72 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. cria usuário auth (email já confirmado para login imediato)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email.trim().toLowerCase(),
      password: body.senha,
      email_confirm: true,
      user_metadata: {
        nome: body.nomeContato,
        telefone: body.telefone,
      },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message || "Erro ao criar usuário";
      const status = msg.toLowerCase().includes("already") ? 409 : 400;
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = created.user.id;

    // 2. cria barbearia
    const { data: barbearia, error: barbErr } = await admin
      .from("barbearias")
      .insert({
        nome: body.nomeBarbearia,
        cnpj_cpf: "",
        responsavel: body.nomeContato,
        email: body.email,
        telefone: body.telefone,
        endereco: body.endereco ?? null,
        bairro: body.bairro,
        cidade: body.cidade,
        cep: body.cep ?? null,
      })
      .select()
      .single();

    if (barbErr || !barbearia) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
      return new Response(JSON.stringify({ error: barbErr?.message || "Erro ao criar barbearia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. cria user_role owner ligado à barbearia
    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: userId,
      role: "owner",
      barbearia_id: barbearia.id,
    });

    if (roleErr) {
      await admin.from("barbearias").delete().eq("id", barbearia.id);
      await admin.auth.admin.deleteUser(userId).catch(() => {});
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. registra em donos_barbearia
    await admin.from("donos_barbearia").insert({
      user_id: userId,
      barbearia_id: barbearia.id,
    });

    // 5. remove role 'client' criada automaticamente pelo trigger handle_new_user
    await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "client");
    // remove registro em clientes (também criado pelo trigger)
    await admin.from("clientes").delete().eq("user_id", userId);

    // 6. envia email de boas-vindas ao dono (não bloqueia em caso de falha)
    try {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRole}`,
          apikey: serviceRole,
        },
        body: JSON.stringify({
          templateName: "boas-vindas-dono",
          recipientEmail: body.email.trim().toLowerCase(),
          idempotencyKey: `boas-vindas-dono-${userId}`,
          templateData: {
            nomeDono: body.nomeContato,
            nomeBarbearia: body.nomeBarbearia,
          },
        }),
      });
      if (!emailRes.ok) {
        const txt = await emailRes.text();
        console.error("send-transactional-email respondeu não-OK", emailRes.status, txt);
      } else {
        console.log("Email de boas-vindas enfileirado com sucesso para", body.email);
      }
    } catch (emailErr) {
      console.error("Falha ao enfileirar email de boas-vindas (não crítico)", emailErr);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, barbearia_id: barbearia.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("signup-dono error", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
