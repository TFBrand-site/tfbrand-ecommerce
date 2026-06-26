-- =========================================================================
-- TFBrand - Otimizações de Escalabilidade e Resiliência
-- Version: 20260626000500_scalability_optimizations
-- =========================================================================

-- 1. Criação de Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Criação de Índices Estratégicos para Buscas e Listagens
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_flags ON public.products(status, is_featured, is_bestseller);

-- Índice para a tabela analytics (Métricas de mais vendidos)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_prod ON public.analytics_events(event_type, product_id);

-- Índice para ordenar leads rapidamente no painel
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 2. Idempotência de Pedidos (Leads)
-- Adiciona a coluna para proteger contra envios duplicados de pedidos no frontend
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Garante que se houver registros antigos com idempotency_key vazia não deem conflito, então a constraint unique será condicional ou se aplicará para não-nulos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_leads_idempotency'
  ) THEN
    -- Adicionando unique normal (nulls não conflitam no PostgreSQL)
    ALTER TABLE public.leads ADD CONSTRAINT uq_leads_idempotency UNIQUE (idempotency_key);
  END IF;
END $$;

-- 3. Atualização da RPC Segura para o Checkout (Agora com Idempotency)
CREATE OR REPLACE FUNCTION public.create_order_lead_secure(
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb, -- array de { product_id, color_slug, size, quantity }
  p_device_info text,
  p_origin text,
  p_obs text,
  p_idempotency_key text DEFAULT NULL
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
  v_existing_lead record;
BEGIN
  -- A. Proteção contra envios duplicados via idempotency_key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, items, subtotal INTO v_existing_lead
    FROM public.leads
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      -- Se a chave já existe, retorna o resultado salvo anteriormente (Evita duplicidade)
      v_response := jsonb_build_object(
        'lead_id', v_existing_lead.id,
        'customer_name', p_customer_name,
        'customer_phone', p_customer_phone,
        'items', v_existing_lead.items,
        'subtotal', v_existing_lead.subtotal,
        'obs', p_obs,
        'is_duplicate', true
      );
      RETURN v_response;
    END IF;
  END IF;

  -- B. Validações iniciais de entrada
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;
  
  IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
    RAISE EXCEPTION 'Telefone do cliente é obrigatório';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A sacola de compras está vazia';
  END IF;

  -- C. Loop de validação de itens e recálculo
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

  -- D. Gravação segura do Lead na tabela leads com tratamento de concorrência
  BEGIN
    INSERT INTO public.leads (
      customer_name,
      customer_phone,
      items,
      subtotal,
      status,
      device_info,
      origin,
      idempotency_key,
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
      p_idempotency_key,
      now(),
      now()
    )
    RETURNING id INTO v_lead_id;
  EXCEPTION WHEN unique_violation THEN
    -- Se outro request paralelo gravou ao mesmo tempo, recupera o id do novo
    SELECT id, items, subtotal INTO v_existing_lead
    FROM public.leads
    WHERE idempotency_key = p_idempotency_key;
    
    v_response := jsonb_build_object(
      'lead_id', v_existing_lead.id,
      'customer_name', p_customer_name,
      'customer_phone', p_customer_phone,
      'items', v_existing_lead.items,
      'subtotal', v_existing_lead.subtotal,
      'obs', p_obs,
      'is_duplicate', true
    );
    RETURN v_response;
  END;

  -- E. Retorno com resumo consolidado para uso do WhatsApp no frontend
  v_response := jsonb_build_object(
    'lead_id', v_lead_id,
    'customer_name', p_customer_name,
    'customer_phone', p_customer_phone,
    'items', v_enriched_items,
    'subtotal', v_calculated_subtotal,
    'obs', p_obs,
    'is_duplicate', false
  );

  RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC Leve para Top 10 Mais Vendidos (Evitar transferir tabela para client-side)
CREATE OR REPLACE FUNCTION public.get_top_bestseller_ids()
RETURNS TABLE(product_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT ae.product_id
  FROM public.analytics_events ae
  WHERE ae.event_type = 'whatsapp_click' AND ae.product_id IS NOT NULL
  GROUP BY ae.product_id
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC Otimizada para Busca de Produtos (Levíssimo, apenas colunas de Card)
CREATE OR REPLACE FUNCTION public.search_public_products_rpc(
  p_query text,
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  sku text,
  price numeric(10,2),
  promotional_price numeric(10,2),
  is_featured boolean,
  is_bestseller boolean,
  is_new boolean,
  category_id uuid,
  category_slug text,
  variations jsonb
) AS $$
DECLARE
  v_clean_query text;
BEGIN
  -- Normaliza a query levemente para busca
  v_clean_query := '%' || lower(unaccent(trim(p_query))) || '%';

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.sku,
    p.price,
    p.promotional_price,
    p.is_featured,
    p.is_bestseller,
    p.is_new,
    p.category_id,
    c.slug AS category_slug,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pv.id,
          'color_name', pv.color_name,
          'color_slug', pv.color_slug,
          'hex_code', pv.hex_code,
          'images', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', pi.id,
                'url', pi.url,
                'is_main', pi.is_main,
                'display_order', pi.display_order
              ) ORDER BY pi.display_order ASC
            ) FROM public.product_images pi WHERE pi.variation_id = pv.id
          ),
          'sizes', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ps.id,
                'size', ps.size,
                'is_available', ps.is_available,
                'stock', ps.stock
              )
            ) FROM public.product_sizes ps WHERE ps.variation_id = pv.id
          )
        ) ORDER BY pv.display_order ASC
      )
      FROM public.product_variations pv 
      WHERE pv.product_id = p.id AND pv.active = true
    ) AS variations
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.status = 'published'
    AND (
      p_query IS NULL OR p_query = '' 
      OR lower(unaccent(p.name)) LIKE v_clean_query
      OR lower(unaccent(p.sku)) LIKE v_clean_query
      OR lower(unaccent(c.name)) LIKE v_clean_query
    )
  ORDER BY p.display_order ASC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
