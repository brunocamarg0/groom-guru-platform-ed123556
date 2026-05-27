
-- 1) Explicit service_role-only policies on barbearia_mp_credentials (auditable deny-by-default)
DROP POLICY IF EXISTS "Service role manages MP credentials" ON public.barbearia_mp_credentials;
CREATE POLICY "Service role manages MP credentials"
ON public.barbearia_mp_credentials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2) tickets_suporte: require cliente_id to belong to the authenticated user
DROP POLICY IF EXISTS "Usuário autenticado abre ticket" ON public.tickets_suporte;
CREATE POLICY "Usuário autenticado abre ticket"
ON public.tickets_suporte
FOR INSERT
TO authenticated
WITH CHECK (
  char_length(COALESCE(assunto, '')) > 0
  AND lower(cliente_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  AND cliente_id IS NOT NULL
  AND cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
);

-- 3) Enforce at most ONE owner/professional barbearia per user (prevents ambiguous tenant)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_barbearia_per_user
ON public.user_roles (user_id)
WHERE role IN ('owner'::app_role, 'professional'::app_role);

-- Make get_user_barbearia_id deterministic (defensive, even with the unique index above)
CREATE OR REPLACE FUNCTION public.get_user_barbearia_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbearia_id FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('owner'::app_role, 'professional'::app_role)
    AND barbearia_id IS NOT NULL
  ORDER BY
    CASE role WHEN 'owner'::app_role THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1;
$$;
