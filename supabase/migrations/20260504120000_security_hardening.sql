-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Aplicada em 2026-05-04
-- ============================================================

-- 1. Remove a política perigosa que permitia qualquer usuário
--    autenticado inserir qualquer role para si mesmo.
--    A inserção de roles deve acontecer SOMENTE via trigger handle_new_user.
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;


-- 2. Adiciona a política de INSERT que estava faltando em itens_pedido.
--    Sem ela, o RLS bloquearia inserts via SDK, mas a ausência explícita
--    é um risco caso RLS seja temporariamente desabilitado.
CREATE POLICY "Users can insert items into their own orders"
  ON public.itens_pedido FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = pedido_id AND p.usuario_id = auth.uid()
    )
  );


-- 3. Corrige a política de UPDATE em anuncios para exigir role de vendedor.
--    Antes, qualquer usuário autenticado que fosse dono poderia editar.
DROP POLICY IF EXISTS "Users can update their own listings" ON public.anuncios;

CREATE POLICY "Sellers can update their own listings"
  ON public.anuncios FOR UPDATE
  USING (auth.uid() = usuario_id AND public.has_role(auth.uid(), 'vendedor'));


-- 4. Corrige a política de DELETE em anuncios para exigir role de vendedor.
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.anuncios;

CREATE POLICY "Sellers can delete their own listings"
  ON public.anuncios FOR DELETE
  USING (auth.uid() = usuario_id AND public.has_role(auth.uid(), 'vendedor'));


-- 5. Cria tabela admin_users para autenticação real de administradores.
--    Substitui as credenciais hardcoded no frontend.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  criado_em  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Administradores só veem o próprio registro nesta tabela
CREATE POLICY "Admins can view their own admin record"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);


-- 6. Cria função is_admin com SECURITY DEFINER para verificar admin status
--    sem expor a tabela admin_users diretamente.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = _user_id
  )
$$;


-- ============================================================
-- PASSO MANUAL NECESSÁRIO APÓS RODAR ESTA MIGRATION:
--
-- 1. Acesse o Supabase Dashboard > Authentication > Users
-- 2. Crie ou encontre o usuário que será o administrador
-- 3. Copie o UUID do usuário (coluna "UID")
-- 4. Execute no SQL Editor do Supabase:
--
--    INSERT INTO public.admin_users (user_id)
--    VALUES ('<UUID_DO_SEU_USUARIO_ADMIN>');
--
-- A partir daí, este usuário poderá fazer login em /admin-login
-- com seu e-mail e senha cadastrados no Supabase Auth.
-- ============================================================
