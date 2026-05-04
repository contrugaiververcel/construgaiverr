-- 1. Cria a coluna de dias nas tabelas (se ainda não existir)
ALTER TABLE public.carrinho ADD COLUMN IF NOT EXISTS dias_locacao INTEGER DEFAULT 1;
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS dias_locacao INTEGER DEFAULT 1;

-- 2. Limpa o carrinho atual para evitar inconsistências nos testes
TRUNCATE TABLE public.carrinho;

-- =========================================================================
-- 3. GATILHO: Forçar que o Carrinho tenha o PREÇO REAL do banco
-- =========================================================================
CREATE OR REPLACE FUNCTION public.enforce_cart_total() RETURNS TRIGGER AS $$
DECLARE
  v_preco NUMERIC;
  v_tipo TEXT;
BEGIN
  -- Busca o preço e o tipo que está na tabela oficial de anúncios (Server-side)
  SELECT preco, tipo INTO v_preco, v_tipo FROM public.anuncios WHERE id = NEW.anuncio_id;
  
  IF v_tipo = 'Locação' THEN
    NEW.total := v_preco * NEW.quantidade * COALESCE(NEW.dias_locacao, 1);
  ELSE
    NEW.total := v_preco * NEW.quantidade;
    NEW.dias_locacao := NULL; -- Limpa dias se for apenas venda
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_cart_total ON public.carrinho;
CREATE TRIGGER trg_enforce_cart_total
BEFORE INSERT OR UPDATE ON public.carrinho
FOR EACH ROW EXECUTE FUNCTION public.enforce_cart_total();


-- =========================================================================
-- 4. GATILHO: Forçar que os Itens do Pedido tenham PREÇO UNITÁRIO E SUBTOTAL reais
-- =========================================================================
CREATE OR REPLACE FUNCTION public.enforce_order_item_price() RETURNS TRIGGER AS $$
DECLARE
  v_preco NUMERIC;
  v_tipo TEXT;
BEGIN
  SELECT preco, tipo INTO v_preco, v_tipo FROM public.anuncios WHERE id = NEW.anuncio_id;
  
  -- Força o preço unitário oficial (ignora o que o React envia)
  NEW.preco_unitario := v_preco; 
  
  IF v_tipo = 'Locação' THEN
    NEW.subtotal := v_preco * NEW.quantidade * COALESCE(NEW.dias_locacao, 1);
  ELSE
    NEW.subtotal := v_preco * NEW.quantidade;
    NEW.dias_locacao := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_order_item_price ON public.itens_pedido;
CREATE TRIGGER trg_enforce_order_item_price
BEFORE INSERT OR UPDATE ON public.itens_pedido
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();


-- =========================================================================
-- 5. GATILHO: Recalcular o valor TOTAL da tabela `pedidos` automagicamente
-- =========================================================================
CREATE OR REPLACE FUNCTION public.update_pedido_total() RETURNS TRIGGER AS $$
DECLARE
  v_pedido_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_pedido_id := OLD.pedido_id;
  ELSE
    v_pedido_id := NEW.pedido_id;
  END IF;

  -- Soma todos os itens e joga direto no total do pedido, sobrepondo hackeamentos
  UPDATE public.pedidos 
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0) FROM public.itens_pedido WHERE pedido_id = v_pedido_id
  )
  WHERE id = v_pedido_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_pedido_total ON public.itens_pedido;
CREATE TRIGGER trg_update_pedido_total
AFTER INSERT OR UPDATE OR DELETE ON public.itens_pedido
FOR EACH ROW EXECUTE FUNCTION public.update_pedido_total();
