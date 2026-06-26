-- =========================================================================
-- TFBrand - Automação de Estoque via Trigger
-- Version: 20260626000200_lead_stock_trigger
-- =========================================================================
-- Esse script cria um gatilho (trigger) na tabela 'leads' que desconta o 
-- estoque dos produtos apenas quando um lead é "confirmado", e devolve 
-- o estoque se o lead deixar de ser "confirmado" (ex: "cancelado").
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS trigger AS $$
DECLARE
  v_item jsonb;
  v_product_id uuid;
  v_color_slug text;
  v_size text;
  v_qty integer;
  v_variation_id uuid;
BEGIN
  -- 1. SE O PEDIDO FOI CONFIRMADO AGORA (antes não era) -> DESCONTAR ESTOQUE
  IF NEW.status = 'confirmado' AND (OLD.status IS DISTINCT FROM 'confirmado') THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (v_item->>'product_id')::uuid;
      v_color_slug := v_item->>'color_slug';
      v_size := v_item->>'size';
      v_qty := (v_item->>'quantity')::integer;

      -- Encontrar o ID da variação usando produto e slug da cor
      SELECT id INTO v_variation_id 
      FROM public.product_variations 
      WHERE product_id = v_product_id AND color_slug = v_color_slug
      LIMIT 1;

      IF v_variation_id IS NOT NULL THEN
        -- Diminuir estoque e atualizar is_available se zerar
        UPDATE public.product_sizes
        SET 
          stock = GREATEST(stock - v_qty, 0),
          is_available = CASE WHEN (stock - v_qty) <= 0 THEN false ELSE true END
        WHERE product_id = v_product_id AND variation_id = v_variation_id AND size = v_size;
      END IF;
    END LOOP;
  END IF;

  -- 2. SE O PEDIDO ERA CONFIRMADO E FOI CANCELADO (ou mudou pra outro) -> DEVOLVER ESTOQUE
  IF OLD.status = 'confirmado' AND (NEW.status IS DISTINCT FROM 'confirmado') THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := (v_item->>'product_id')::uuid;
      v_color_slug := v_item->>'color_slug';
      v_size := v_item->>'size';
      v_qty := (v_item->>'quantity')::integer;

      -- Encontrar o ID da variação
      SELECT id INTO v_variation_id 
      FROM public.product_variations 
      WHERE product_id = v_product_id AND color_slug = v_color_slug
      LIMIT 1;

      IF v_variation_id IS NOT NULL THEN
        -- Aumentar estoque e garantir que is_available fique true
        UPDATE public.product_sizes
        SET 
          stock = stock + v_qty,
          is_available = true
        WHERE product_id = v_product_id AND variation_id = v_variation_id AND size = v_size;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger antigo caso exista para não duplicar
DROP TRIGGER IF EXISTS trg_lead_status_stock_update ON public.leads;

-- Cria o trigger na tabela leads
CREATE TRIGGER trg_lead_status_stock_update
AFTER UPDATE ON public.leads
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_lead_status_change();
