-- Add company information fields to usuarios table for sellers
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS nome_empresa TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS descricao_empresa TEXT,
ADD COLUMN IF NOT EXISTS logo_empresa TEXT;