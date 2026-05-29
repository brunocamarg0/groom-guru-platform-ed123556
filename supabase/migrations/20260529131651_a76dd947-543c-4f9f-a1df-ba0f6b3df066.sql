-- Fix: clientes UPDATE restricted to authenticated
DROP POLICY IF EXISTS "Cliente atualiza seu próprio cadastro" ON public.clientes;
CREATE POLICY "Cliente atualiza seu próprio cadastro"
ON public.clientes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix: clientes SELECT restricted to authenticated
DROP POLICY IF EXISTS "Cliente vê seu próprio cadastro" ON public.clientes;
CREATE POLICY "Cliente vê seu próprio cadastro"
ON public.clientes
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Fix: agendamentos INSERT restricted to authenticated
DROP POLICY IF EXISTS "Qualquer um pode criar agendamento" ON public.agendamentos;
CREATE POLICY "Usuário autenticado cria agendamento"
ON public.agendamentos
FOR INSERT
TO authenticated
WITH CHECK (validar_agendamento_input(barbearia_id, servico_id));

-- Fix: avaliacoes INSERT restricted to authenticated
DROP POLICY IF EXISTS "Cliente cria sua própria avaliação" ON public.avaliacoes;
CREATE POLICY "Cliente cria sua própria avaliação"
ON public.avaliacoes
FOR INSERT
TO authenticated
WITH CHECK (cliente_id IN (SELECT clientes.id FROM clientes WHERE clientes.user_id = auth.uid()));

-- Fix: tickets_suporte SELECT restricted to authenticated
DROP POLICY IF EXISTS "Cliente vê seus próprios tickets" ON public.tickets_suporte;
CREATE POLICY "Cliente vê seus próprios tickets"
ON public.tickets_suporte
FOR SELECT
TO authenticated
USING ((cliente_id IN (SELECT clientes.id FROM clientes WHERE clientes.user_id = auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));