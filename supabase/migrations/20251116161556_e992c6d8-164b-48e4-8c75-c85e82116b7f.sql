-- Criar tabela de avaliações
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL,
  anuncio_id UUID,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can view reviews"
  ON public.avaliacoes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON public.avaliacoes
  FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_id 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'cliente'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON public.avaliacoes
  FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.avaliacoes
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- Índices para melhor performance
CREATE INDEX idx_avaliacoes_vendedor ON public.avaliacoes(vendedor_id);
CREATE INDEX idx_avaliacoes_anuncio ON public.avaliacoes(anuncio_id);
CREATE INDEX idx_avaliacoes_usuario ON public.avaliacoes(usuario_id);