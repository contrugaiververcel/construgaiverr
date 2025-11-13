-- Add new fields to anuncios table
ALTER TABLE public.anuncios 
ADD COLUMN medidas TEXT,
ADD COLUMN entrega BOOLEAN DEFAULT false,
ADD COLUMN condicao TEXT CHECK (condicao IN ('novo', 'seminovo', 'usado')),
ADD COLUMN quantidade INTEGER,
ADD COLUMN dias_locacao INTEGER;