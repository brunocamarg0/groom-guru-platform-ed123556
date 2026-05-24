-- 1) Atualizar handle_new_user para também criar registro em clientes e atribuir role 'client'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_telefone TEXT;
  v_is_super_admin BOOLEAN;
BEGIN
  v_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  v_telefone := NEW.raw_user_meta_data->>'telefone';

  -- profile (já existia)
  INSERT INTO public.profiles (user_id, nome, email, foto)
  VALUES (
    NEW.id,
    v_nome,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT DO NOTHING;

  v_is_super_admin := lower(NEW.email) = 'brunocamargocontato@hotmail.com';

  -- Se NÃO for super-admin e ainda não tiver nenhum papel (owner/professional),
  -- registrar como cliente
  IF NOT v_is_super_admin
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id)
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client'::app_role)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.clientes (user_id, nome, email, telefone)
    VALUES (NEW.id, v_nome, NEW.email, v_telefone)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Backfill: usuários já existentes sem nenhum papel viram clientes
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'client'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
  AND lower(u.email) <> 'brunocamargocontato@hotmail.com'
ON CONFLICT DO NOTHING;

-- 3) Backfill: garantir registro em clientes para todos com role 'client' que não têm
INSERT INTO public.clientes (user_id, nome, email, telefone)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'nome', u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  u.raw_user_meta_data->>'telefone'
FROM auth.users u
INNER JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'client'::app_role
WHERE NOT EXISTS (SELECT 1 FROM public.clientes c WHERE c.user_id = u.id)
ON CONFLICT DO NOTHING;