-- Create usuarios (users) table
CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  cidade text,
  bairro text,
  telefone text,
  criado_em timestamptz DEFAULT now()
);

-- Enable RLS on usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create policies for usuarios
CREATE POLICY "Users can view their own profile"
  ON public.usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.usuarios FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.usuarios FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create anuncios (listings) table
CREATE TABLE public.anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text NOT NULL,
  preco decimal(10,2) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('Venda', 'Locação')),
  categoria text NOT NULL,
  cidade text NOT NULL,
  bairro text NOT NULL,
  imagens text[] DEFAULT '{}',
  criado_em timestamptz DEFAULT now()
);

-- Enable RLS on anuncios
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

-- Create policies for anuncios
CREATE POLICY "Anyone can view listings"
  ON public.anuncios FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own listings"
  ON public.anuncios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own listings"
  ON public.anuncios FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own listings"
  ON public.anuncios FOR DELETE
  USING (auth.uid() = usuario_id);

-- Create carrinho (shopping cart) table
CREATE TABLE public.carrinho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  anuncio_id uuid REFERENCES public.anuncios(id) ON DELETE CASCADE NOT NULL,
  quantidade integer DEFAULT 1 NOT NULL CHECK (quantidade > 0),
  total decimal(10,2) NOT NULL,
  criado_em timestamptz DEFAULT now(),
  UNIQUE(usuario_id, anuncio_id)
);

-- Enable RLS on carrinho
ALTER TABLE public.carrinho ENABLE ROW LEVEL SECURITY;

-- Create policies for carrinho
CREATE POLICY "Users can view their own cart"
  ON public.carrinho FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert into their own cart"
  ON public.carrinho FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own cart"
  ON public.carrinho FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete from their own cart"
  ON public.carrinho FOR DELETE
  USING (auth.uid() = usuario_id);

-- Create mensagens (messages) table
CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  destinatario_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  conteudo text NOT NULL,
  criado_em timestamptz DEFAULT now()
);

-- Enable RLS on mensagens
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Create policies for mensagens
CREATE POLICY "Users can view their own messages"
  ON public.mensagens FOR SELECT
  USING (auth.uid() = remetente_id OR auth.uid() = destinatario_id);

CREATE POLICY "Users can send messages"
  ON public.mensagens FOR INSERT
  WITH CHECK (auth.uid() = remetente_id);

-- Create function and trigger to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;