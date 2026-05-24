
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner', 'professional', 'client');

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PROFILES (dados básicos do usuário autenticado)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  foto TEXT,
  data_nascimento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visíveis para o próprio usuário"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode criar seu próprio profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar seu próprio profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criação automática de profile ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, foto)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- USER_ROLES (papéis isolados — anti privilege escalation)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  barbearia_id UUID, -- nulo para super_admin e client; obrigatório para owner/professional
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, barbearia_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role: security definer evita recursão em RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- retorna a barbearia do usuário logado (owner ou professional)
CREATE OR REPLACE FUNCTION public.get_user_barbearia_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbearia_id FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('owner', 'professional')
    AND barbearia_id IS NOT NULL
  LIMIT 1;
$$;

CREATE POLICY "Usuário vê seus próprios papéis"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super-admin gerencia papéis"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- PLANOS (SaaS — assinatura da plataforma)
-- ============================================================
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_mensal NUMERIC(10,2) NOT NULL,
  limite_barbeiros INT NOT NULL DEFAULT 1,
  limite_agendamentos INT NOT NULL DEFAULT 100,
  recursos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planos visíveis para todos"
  ON public.planos FOR SELECT USING (TRUE);

CREATE POLICY "Super-admin gerencia planos"
  ON public.planos FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_planos_updated_at BEFORE UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BARBEARIAS
-- ============================================================
CREATE TABLE public.barbearias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj_cpf TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'basico',
  status TEXT NOT NULL DEFAULT 'em_teste',
  data_vencimento TIMESTAMPTZ,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  bairro TEXT,
  cep TEXT,
  modo_confirmacao TEXT NOT NULL DEFAULT 'hibrido',
  foto TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbearias visíveis publicamente"
  ON public.barbearias FOR SELECT USING (TRUE);

CREATE POLICY "Dono atualiza sua própria barbearia"
  ON public.barbearias FOR UPDATE
  USING (id = public.get_user_barbearia_id(auth.uid()));

CREATE POLICY "Super-admin gerencia barbearias"
  ON public.barbearias FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_barbearias_updated_at BEFORE UPDATE ON public.barbearias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- DONOS_BARBEARIA (vínculo user ↔ barbearia)
-- ============================================================
CREATE TABLE public.donos_barbearia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbearia_id UUID NOT NULL UNIQUE REFERENCES public.barbearias(id) ON DELETE CASCADE,
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donos_barbearia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono vê seu próprio vínculo"
  ON public.donos_barbearia FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super-admin gerencia donos"
  ON public.donos_barbearia FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_donos_updated_at BEFORE UPDATE ON public.donos_barbearia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CONVITES
-- ============================================================
CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  usado_em TIMESTAMPTZ,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Convites - super-admin"
  ON public.convites FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_convites_updated_at BEFORE UPDATE ON public.convites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SOLICITACOES_CADASTRO
-- ============================================================
CREATE TABLE public.solicitacoes_cadastro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj_cpf TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  plano TEXT NOT NULL DEFAULT 'basico',
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  barbearia_id UUID UNIQUE REFERENCES public.barbearias(id) ON DELETE SET NULL,
  aprovada_em TIMESTAMPTZ,
  aprovada_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_cadastro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode criar solicitação"
  ON public.solicitacoes_cadastro FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Super-admin gerencia solicitações"
  ON public.solicitacoes_cadastro FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ASSINATURAS (da barbearia na plataforma SaaS)
-- ============================================================
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL UNIQUE REFERENCES public.barbearias(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos(id),
  status TEXT NOT NULL DEFAULT 'ativa',
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_vencimento TIMESTAMPTZ NOT NULL,
  proximo_vencimento TIMESTAMPTZ NOT NULL,
  pagamento_recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  mercadopago_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono vê assinatura da sua barbearia"
  ON public.assinaturas FOR SELECT
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super-admin gerencia assinaturas"
  ON public.assinaturas FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_assinaturas_updated_at BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FATURAS
-- ============================================================
CREATE TABLE public.faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento TIMESTAMPTZ NOT NULL,
  data_pagamento TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  metodo_pagamento TEXT,
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  mercadopago_status TEXT,
  link_pagamento TEXT,
  qr_code_pix TEXT,
  codigo_boleto TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faturas_assinatura_status ON public.faturas(assinatura_id, status);
CREATE INDEX idx_faturas_vencimento ON public.faturas(data_vencimento);

ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono vê faturas da sua assinatura"
  ON public.faturas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assinaturas a
      WHERE a.id = faturas.assinatura_id
        AND a.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super-admin gerencia faturas"
  ON public.faturas FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_faturas_updated_at BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SERVICOS
-- ============================================================
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  duracao INT NOT NULL,
  tipo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INT NOT NULL DEFAULT 0,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Serviços visíveis publicamente"
  ON public.servicos FOR SELECT USING (TRUE);

CREATE POLICY "Dono gerencia serviços da sua barbearia"
  ON public.servicos FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_servicos_updated_at BEFORE UPDATE ON public.servicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  foto TEXT,
  data_nascimento DATE,
  vip BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  email_verificado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê seu próprio cadastro"
  ON public.clientes FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Cliente atualiza seu próprio cadastro"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Cliente cria seu próprio cadastro"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Super-admin gerencia clientes"
  ON public.clientes FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PROFISSIONAIS
-- ============================================================
CREATE TABLE public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT NOT NULL,
  foto TEXT,
  especialidades TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  comissao_tipo TEXT NOT NULL DEFAULT 'percentual',
  comissao_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  comissao_assinatura NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  data_admissao TIMESTAMPTZ NOT NULL DEFAULT now(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissionais visíveis publicamente"
  ON public.profissionais FOR SELECT USING (TRUE);

CREATE POLICY "Profissional atualiza seu próprio cadastro"
  ON public.profissionais FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Dono gerencia profissionais da sua barbearia"
  ON public.profissionais FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_profissionais_updated_at BEFORE UPDATE ON public.profissionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AGENDAMENTOS
-- ============================================================
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL,
  horario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  confirmado_automaticamente BOOLEAN NOT NULL DEFAULT FALSE,
  data_confirmacao_automatica TIMESTAMPTZ,
  forma_pagamento TEXT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agendamentos_barbearia_data ON public.agendamentos(barbearia_id, data);
CREATE INDEX idx_agendamentos_cliente ON public.agendamentos(cliente_id);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê seus próprios agendamentos"
  ON public.agendamentos FOR SELECT
  USING (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
    OR barbearia_id = public.get_user_barbearia_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Qualquer um pode criar agendamento"
  ON public.agendamentos FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Dono atualiza agendamentos da sua barbearia"
  ON public.agendamentos FOR UPDATE
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Dono deleta agendamentos da sua barbearia"
  ON public.agendamentos FOR DELETE
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_agendamentos_updated_at BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AGENDAMENTO_PROFISSIONAL
-- ============================================================
CREATE TABLE public.agendamento_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agendamento_id, profissional_id)
);

ALTER TABLE public.agendamento_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visível para envolvidos"
  ON public.agendamento_profissional FOR SELECT USING (TRUE);

CREATE POLICY "Qualquer um cria vínculo no agendamento"
  ON public.agendamento_profissional FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Dono gerencia vínculos da sua barbearia"
  ON public.agendamento_profissional FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_profissional.agendamento_id
        AND (a.barbearia_id = public.get_user_barbearia_id(auth.uid())
             OR public.has_role(auth.uid(), 'super_admin'))
    )
  )
  WITH CHECK (TRUE);

-- ============================================================
-- PRODUTOS
-- ============================================================
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  estoque INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  foto TEXT,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos visíveis publicamente"
  ON public.produtos FOR SELECT USING (TRUE);

CREATE POLICY "Dono gerencia produtos da sua barbearia"
  ON public.produtos FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_produtos_updated_at BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PROMOCOES
-- ============================================================
CREATE TABLE public.promocoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  valido_de TIMESTAMPTZ NOT NULL,
  valido_ate TIMESTAMPTZ NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  aplicavel_a TEXT NOT NULL DEFAULT 'todos',
  servico_id UUID,
  horario_inicio TEXT,
  horario_fim TEXT,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promoções visíveis publicamente"
  ON public.promocoes FOR SELECT USING (TRUE);

CREATE POLICY "Dono gerencia promoções da sua barbearia"
  ON public.promocoes FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_promocoes_updated_at BEFORE UPDATE ON public.promocoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AVALIACOES
-- ============================================================
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL UNIQUE REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nota_profissional INT NOT NULL CHECK (nota_profissional BETWEEN 1 AND 5),
  nota_atendimento INT NOT NULL CHECK (nota_atendimento BETWEEN 1 AND 5),
  nota_ambiente INT NOT NULL CHECK (nota_ambiente BETWEEN 1 AND 5),
  comentario TEXT,
  resposta TEXT,
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliações visíveis publicamente"
  ON public.avaliacoes FOR SELECT USING (TRUE);

CREATE POLICY "Cliente cria sua própria avaliação"
  ON public.avaliacoes FOR INSERT
  WITH CHECK (cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid()));

CREATE POLICY "Dono responde avaliações da sua barbearia"
  ON public.avaliacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = avaliacoes.agendamento_id
        AND a.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
  );

CREATE TRIGGER trg_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- NOTIFICACOES
-- ============================================================
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  url_acao TEXT,
  label_acao TEXT,
  barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono vê notificações da sua barbearia"
  ON public.notificacoes FOR SELECT
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Dono atualiza notificações da sua barbearia"
  ON public.notificacoes FOR UPDATE
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super-admin gerencia notificações"
  ON public.notificacoes FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_notificacoes_updated_at BEFORE UPDATE ON public.notificacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PAGAMENTOS (de agendamentos)
-- ============================================================
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL UNIQUE REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  metodo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  taxa_gateway NUMERIC(10,2) DEFAULT 0,
  data_pagamento TIMESTAMPTZ,
  data_vencimento TIMESTAMPTZ,
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  mercadopago_status TEXT,
  mercadopago_payment_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pagamento visível para envolvidos"
  ON public.pagamentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = pagamentos.agendamento_id
        AND (
          a.barbearia_id = public.get_user_barbearia_id(auth.uid())
          OR a.cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
        )
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Dono gerencia pagamentos da sua barbearia"
  ON public.pagamentos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = pagamentos.agendamento_id
        AND a.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (TRUE);

CREATE TRIGGER trg_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- COMISSOES_PAGAS
-- ============================================================
CREATE TABLE public.comissoes_pagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  valor_comissao NUMERIC(10,2) NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  porcentagem NUMERIC(10,2) NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento TIMESTAMPTZ,
  mes_referencia TEXT NOT NULL,
  observacao TEXT,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agendamento_id, profissional_id)
);

CREATE INDEX idx_comissoes_prof_mes ON public.comissoes_pagas(profissional_id, mes_referencia);
CREATE INDEX idx_comissoes_barb_mes ON public.comissoes_pagas(barbearia_id, mes_referencia);

ALTER TABLE public.comissoes_pagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profissional vê suas próprias comissões"
  ON public.comissoes_pagas FOR SELECT
  USING (
    profissional_id IN (SELECT id FROM public.profissionais WHERE user_id = auth.uid())
    OR barbearia_id = public.get_user_barbearia_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Dono gerencia comissões da sua barbearia"
  ON public.comissoes_pagas FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_comissoes_pagas_updated_at BEFORE UPDATE ON public.comissoes_pagas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TICKETS_SUPORTE
-- ============================================================
CREATE TABLE public.tickets_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  prioridade TEXT NOT NULL DEFAULT 'media',
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  resposta TEXT,
  respondido_por TEXT,
  respondido_em TIMESTAMPTZ,
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets_suporte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode abrir ticket"
  ON public.tickets_suporte FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Cliente vê seus próprios tickets"
  ON public.tickets_suporte FOR SELECT
  USING (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super-admin gerencia tickets"
  ON public.tickets_suporte FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets_suporte
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PLANOS_CLIENTE (planos de assinatura da barbearia para clientes)
-- ============================================================
CREATE TABLE public.planos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(10,2) NOT NULL,
  duracao_meses INT NOT NULL,
  beneficios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planos cliente visíveis publicamente"
  ON public.planos_cliente FOR SELECT USING (TRUE);

CREATE POLICY "Dono gerencia planos cliente da sua barbearia"
  ON public.planos_cliente FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_planos_cliente_updated_at BEFORE UPDATE ON public.planos_cliente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ASSINATURAS_CLIENTE
-- ============================================================
CREATE TABLE public.assinaturas_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL UNIQUE REFERENCES public.clientes(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos_cliente(id),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ativa',
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_vencimento TIMESTAMPTZ NOT NULL,
  proximo_vencimento TIMESTAMPTZ NOT NULL,
  pagamento_recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  mercadopago_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê sua própria assinatura"
  ON public.assinaturas_cliente FOR SELECT
  USING (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
    OR profissional_id IN (SELECT id FROM public.profissionais WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = assinaturas_cliente.profissional_id
        AND p.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Dono gerencia assinaturas dos clientes da sua barbearia"
  ON public.assinaturas_cliente FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.planos_cliente pc
      WHERE pc.id = assinaturas_cliente.plano_id
        AND pc.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (TRUE);

CREATE TRIGGER trg_assinaturas_cliente_updated_at BEFORE UPDATE ON public.assinaturas_cliente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PAGAMENTOS_ASSINATURA
-- ============================================================
CREATE TABLE public.pagamentos_assinatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID NOT NULL REFERENCES public.assinaturas_cliente(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  data_vencimento TIMESTAMPTZ NOT NULL,
  data_pagamento TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  metodo_pagamento TEXT,
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  mercadopago_status TEXT,
  link_pagamento TEXT,
  qr_code_pix TEXT,
  codigo_boleto TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pag_assin_status ON public.pagamentos_assinatura(assinatura_id, status);
CREATE INDEX idx_pag_assin_vencimento ON public.pagamentos_assinatura(data_vencimento);

ALTER TABLE public.pagamentos_assinatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visível para envolvidos"
  ON public.pagamentos_assinatura FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assinaturas_cliente ac
      WHERE ac.id = pagamentos_assinatura.assinatura_id
        AND (
          ac.cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.planos_cliente pc
            WHERE pc.id = ac.plano_id
              AND pc.barbearia_id = public.get_user_barbearia_id(auth.uid())
          )
        )
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super-admin gerencia pagamentos assinatura"
  ON public.pagamentos_assinatura FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_pag_assin_updated_at BEFORE UPDATE ON public.pagamentos_assinatura
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- COMISSOES_ASSINATURA
-- ============================================================
CREATE TABLE public.comissoes_assinatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  assinatura_id UUID NOT NULL REFERENCES public.assinaturas_cliente(id) ON DELETE CASCADE,
  pagamento_id UUID NOT NULL REFERENCES public.pagamentos_assinatura(id) ON DELETE CASCADE,
  valor_comissao NUMERIC(10,2) NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento TIMESTAMPTZ,
  mes_referencia TEXT NOT NULL,
  observacao TEXT,
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pagamento_id, profissional_id)
);

CREATE INDEX idx_com_assin_prof_mes ON public.comissoes_assinatura(profissional_id, mes_referencia);
CREATE INDEX idx_com_assin_barb_mes ON public.comissoes_assinatura(barbearia_id, mes_referencia);

ALTER TABLE public.comissoes_assinatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visível para envolvidos"
  ON public.comissoes_assinatura FOR SELECT
  USING (
    profissional_id IN (SELECT id FROM public.profissionais WHERE user_id = auth.uid())
    OR barbearia_id = public.get_user_barbearia_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Dono gerencia comissões assinatura da sua barbearia"
  ON public.comissoes_assinatura FOR ALL
  USING (barbearia_id = public.get_user_barbearia_id(auth.uid())
         OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (barbearia_id = public.get_user_barbearia_id(auth.uid())
              OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_com_assin_updated_at BEFORE UPDATE ON public.comissoes_assinatura
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENTE_PROFISSIONAL
-- ============================================================
CREATE TABLE public.cliente_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, profissional_id)
);

CREATE INDEX idx_cli_prof_cliente ON public.cliente_profissional(cliente_id);
CREATE INDEX idx_cli_prof_prof ON public.cliente_profissional(profissional_id);

ALTER TABLE public.cliente_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visível para envolvidos"
  ON public.cliente_profissional FOR SELECT
  USING (
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
    OR profissional_id IN (SELECT id FROM public.profissionais WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = cliente_profissional.profissional_id
        AND p.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Dono gerencia vínculos cliente-profissional"
  ON public.cliente_profissional FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = cliente_profissional.profissional_id
        AND p.barbearia_id = public.get_user_barbearia_id(auth.uid())
    )
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (TRUE);

CREATE TRIGGER trg_cli_prof_updated_at BEFORE UPDATE ON public.cliente_profissional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
