-- ============================================================
-- FIX SIGNUP TRIGGER MIGRATION
-- Aplicada em 2026-07-20
-- Torna a trigger de criação de perfil robusta contra erros de type cast e idempotente
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_role TEXT;
  v_birth_date DATE;
BEGIN
  -- Tratamento seguro da data de nascimento (evita erro de cast com strings vazias)
  IF new.raw_user_meta_data->>'data_nascimento' IS NOT NULL AND new.raw_user_meta_data->>'data_nascimento' <> '' THEN
    BEGIN
      v_birth_date := (new.raw_user_meta_data->>'data_nascimento')::DATE;
    EXCEPTION WHEN OTHERS THEN
      v_birth_date := NULL;
    END;
  ELSE
    v_birth_date := NULL;
  END IF;

  -- Tratamento seguro do papel (role) do usuário
  IF new.raw_user_meta_data->>'role' IS NOT NULL AND new.raw_user_meta_data->>'role' <> '' THEN
    v_role := new.raw_user_meta_data->>'role';
  ELSE
    v_role := 'cliente';
  END IF;

  -- Garante que a role seja válida dentro dos valores permitidos do enum
  IF v_role NOT IN ('cliente', 'vendedor') THEN
    v_role := 'cliente';
  END IF;

  -- Inserção na tabela public.usuarios (com suporte a conflito para evitar duplicações/erros)
  INSERT INTO public.usuarios (id, nome, email, telefone_movel, data_nascimento, aceito_termos)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone_movel',
    v_birth_date,
    COALESCE((new.raw_user_meta_data->>'aceito_termos')::BOOLEAN, false)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    telefone_movel = EXCLUDED.telefone_movel,
    data_nascimento = EXCLUDED.data_nascimento,
    aceito_termos = EXCLUDED.aceito_termos;
  
  -- Inserção na tabela public.user_roles (com DO NOTHING se já existir)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    v_role::app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$function$;
