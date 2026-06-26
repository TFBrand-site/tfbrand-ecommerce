-- =========================================================================
-- TFBrand - Proteção de Checkout (RPC) e Segurança do Storage
-- Version: 20260626000100_lead_secure_rpc
-- =========================================================================

-- 1. CRIAÇÃO DA RPC SECURA PARA SALVAR LEADS E RECALCULAR PREÇOS NO SERVIDOR
CREATE OR REPLACE FUNCTION public.create_order_lead_secure(
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb, -- array de { product_id, color_slug, size, quantity }
  p_device_info text,
  p_origin text,
  p_obs text
)
RETURNS jsonb AS $$
DECLARE
  v_lead_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_color_slug text;
  v_size text;
  v_qty integer;
  
  v_product_name text;
  v_product_sku text;
  v_product_price numeric(10,2);
  v_color_name text;
  v_variation_id uuid;
  
  v_calculated_subtotal numeric(10,2) := 0;
  v_item_subtotal numeric(10,2);
  v_enriched_items jsonb := '[]'::jsonb;
  v_response jsonb;
  
  v_stock_available integer;
  v_is_avail boolean;
BEGIN
  -- A. Validações iniciais de entrada
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;
  
  IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
    RAISE EXCEPTION 'Telefone do cliente é obrigatório';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A sacola de compras está vazia';
  END IF;

  -- B. Loop de validação de itens e recálculo
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_color_slug := v_item->>'color_slug';
    v_size := v_item->>'size';
    v_qty := (v_item->>'quantity')::integer;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantidade de itens deve ser maior que zero';
    END IF;

    -- Validar produto e extrair preço real do banco (apenas se publicado)
    SELECT name, sku, COALESCE(promotional_price, price)
    INTO v_product_name, v_product_sku, v_product_price
    FROM public.products
    WHERE id = v_product_id AND status = 'published';

    IF v_product_name IS NULL THEN
      RAISE EXCEPTION 'Produto indisponível ou inativo';
    END IF;

    -- Validar variação de cor ativa e obter o ID da variação
    SELECT id, color_name
    INTO v_variation_id, v_color_name
    FROM public.product_variations
    WHERE product_id = v_product_id AND color_slug = v_color_slug AND active = true;

    IF v_variation_id IS NULL THEN
      RAISE EXCEPTION 'Cor selecionada não está disponível para este produto';
    END IF;

    -- Validar tamanho e estoque disponível
    SELECT stock, is_available
    INTO v_stock_available, v_is_avail
    FROM public.product_sizes
    WHERE product_id = v_product_id AND variation_id = v_variation_id AND size = v_size;

    IF v_is_avail IS NULL OR NOT v_is_avail OR v_stock_available < v_qty THEN
      -- Se não houver estoque suficiente, lançamos um alerta, mas registramos se necessário.
      -- Conforme regras, validamos estoque.
      RAISE EXCEPTION 'Tamanho % indisponível em estoque para o produto % (% )', v_size, v_product_name, v_color_name;
    END IF;

    -- Cálculo do subtotal do item no servidor
    v_item_subtotal := v_product_price * v_qty;
    v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;

    -- Enriquecer o array de itens com dados reais do banco
    v_enriched_items := v_enriched_items || jsonb_build_object(
      'product_id', v_product_id,
      'name', v_product_name,
      'sku', v_product_sku,
      'price', v_product_price,
      'quantity', v_qty,
      'size', v_size,
      'color', v_color_name,
      'color_slug', v_color_slug
    );
  END LOOP;

  -- C. Gravação segura do Lead na tabela leads
  INSERT INTO public.leads (
    customer_name,
    customer_phone,
    items,
    subtotal,
    status,
    device_info,
    origin,
    created_at,
    updated_at
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    v_enriched_items,
    v_calculated_subtotal,
    'iniciado',
    p_device_info,
    p_origin,
    now(),
    now()
  )
  RETURNING id INTO v_lead_id;

  -- D. Retorno com resumo consolidado para uso do WhatsApp no frontend
  v_response := jsonb_build_object(
    'lead_id', v_lead_id,
    'customer_name', p_customer_name,
    'customer_phone', p_customer_phone,
    'items', v_enriched_items,
    'subtotal', v_calculated_subtotal,
    'obs', p_obs
  );

  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. REVISÃO E BLINDAGEM DE POLÍTICAS DO STORAGE (BUCKET: product-images)

-- Garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Limpeza de políticas de storage anteriores
DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;
DROP POLICY IF EXISTS "Imagens públicas de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Imagens publicas" ON storage.objects;
DROP POLICY IF EXISTS "Imagens publicas de produtos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete" ON storage.objects;
DROP POLICY IF EXISTS "Upload por admin" ON storage.objects;
DROP POLICY IF EXISTS "Update por admin" ON storage.objects;
DROP POLICY IF EXISTS "Delete por admin" ON storage.objects;

DROP POLICY IF EXISTS "Imagens públicas do bucket" ON storage.objects;
DROP POLICY IF EXISTS "Upload apenas admin e editor" ON storage.objects;
DROP POLICY IF EXISTS "Update apenas admin e editor" ON storage.objects;
DROP POLICY IF EXISTS "Delete apenas admin e editor" ON storage.objects;

-- Criar novas políticas com validação de extensão de imagem e validação de role admin/editor
CREATE POLICY "Imagens públicas do bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Upload apenas admin e editor" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    public.is_editor_or_admin() AND
    lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'avif')
  );

CREATE POLICY "Update apenas admin e editor" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    public.is_editor_or_admin()
  ) WITH CHECK (
    bucket_id = 'product-images' AND
    public.is_editor_or_admin() AND
    lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'avif')
  );

CREATE POLICY "Delete apenas admin e editor" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    public.is_editor_or_admin()
  );
