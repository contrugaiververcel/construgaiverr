-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('cliente', 'vendedor');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update usuarios table to include additional fields
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS telefone_movel TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS aceito_termos BOOLEAN DEFAULT false;

-- Create favoritos table
CREATE TABLE public.favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anuncio_id UUID REFERENCES public.anuncios(id) ON DELETE CASCADE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (usuario_id, anuncio_id)
);

-- Enable RLS on favoritos
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- RLS policies for favoritos
CREATE POLICY "Users can view their own favorites"
  ON public.favoritos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can add to favorites"
  ON public.favoritos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can remove from favorites"
  ON public.favoritos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Create enderecos table
CREATE TABLE public.enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo_endereco TEXT NOT NULL,
  nome_destinatario TEXT NOT NULL,
  cep TEXT NOT NULL,
  rua TEXT NOT NULL,
  numero TEXT,
  sem_numero BOOLEAN DEFAULT false,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  telefone_contato TEXT NOT NULL,
  informacoes_adicionais TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on enderecos
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;

-- RLS policies for enderecos
CREATE POLICY "Users can view their own addresses"
  ON public.enderecos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own addresses"
  ON public.enderecos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own addresses"
  ON public.enderecos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own addresses"
  ON public.enderecos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endereco_id UUID REFERENCES public.enderecos(id) NOT NULL,
  opcao_entrega TEXT NOT NULL CHECK (opcao_entrega IN ('entrega', 'retirada')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'enviado', 'entregue', 'cancelado')),
  total NUMERIC NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Create itens_pedido table (BEFORE policies that reference it)
CREATE TABLE public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  anuncio_id UUID REFERENCES public.anuncios(id) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- Enable RLS on itens_pedido
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- NOW create RLS policies for pedidos (after itens_pedido exists)
CREATE POLICY "Users can view their own orders"
  ON public.pedidos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create orders"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Sellers can view orders for their products"
  ON public.pedidos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itens_pedido ip
      JOIN public.anuncios a ON ip.anuncio_id = a.id
      WHERE ip.pedido_id = pedidos.id
        AND a.usuario_id = auth.uid()
    )
  );

-- RLS policies for itens_pedido
CREATE POLICY "Users can view items from their orders"
  ON public.itens_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = itens_pedido.pedido_id
        AND p.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can view items from orders of their products"
  ON public.itens_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.anuncios a
      WHERE a.id = itens_pedido.anuncio_id
        AND a.usuario_id = auth.uid()
    )
  );

-- Update anuncios RLS policies to restrict creation to sellers only
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.anuncios;

CREATE POLICY "Sellers can insert listings"
  ON public.anuncios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id AND public.has_role(auth.uid(), 'vendedor'));

-- Update handle_new_user function to support role parameter
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, telefone_movel, data_nascimento, aceito_termos)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefone_movel',
    (new.raw_user_meta_data->>'data_nascimento')::DATE,
    COALESCE((new.raw_user_meta_data->>'aceito_termos')::BOOLEAN, false)
  );
  
  -- Insert default role as 'cliente' if not specified
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'cliente'::app_role)
  );
  
  RETURN new;
END;
$function$;