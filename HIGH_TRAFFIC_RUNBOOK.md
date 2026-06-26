# Guia de Alta Disponibilidade & Resiliência (High Traffic Runbook)

Este documento descreve as implementações arquiteturais adotadas para preparar a TFBrand para suportar picos intensos de acesso (ex: campanhas de Black Friday, lançamentos com influenciadores) sem sobrecarregar o Supabase ou causar queda no frontend.

## 1. Otimizações no Supabase e Banco de Dados

*   **Paginação e Limit (Load More)**: A lista de produtos agora utiliza `limit` e `offset`, abandonando a carga em memória (Full Table Scan no cliente) que carregava todos os registros e imagens de uma vez.
*   **RPCs de Busca**: A pesquisa textual e os destaques ("mais vendidos") usam `search_public_products_rpc` e `get_bestsellers_rpc`, delegando a carga de filtro e ordenação ao banco PostgreSQL que roda muito mais rápido e já conta com índices otimizados (como índices em `status`, `categoria`, `created_at`).
*   **Idempotência no Checkout**: Para impedir que um usuário impaciente clique várias vezes no botão de checkout (gerando múltiplos carrinhos e requisições repetidas no backend), inserimos o campo `idempotency_key` e a Constraint Unique `uq_leads_idempotency` na tabela `leads`. Agora, duplicatas do mesmo cliente são bloqueadas a nível de banco. A RPC `create_order_lead_secure` encapsula toda a criação do carrinho.

## 2. Otimizações de CDN e Imagens (Cloudinary)

*   **Adoção Estrita do Cloudinary**: Nenhuma imagem original (crua, de 4MB+) é enviada ao frontend. A função `getOptimizedImageUrl` recebe e injeta os tamanhos adequados (`w_300`, `w_800`, `w_1200`).
*   **Srcset e Sizes**: Na página de produto (`product.$id.tsx`), a imagem principal utiliza a tag HTML `<img srcSet="...">` nativa. O browser do usuário decide se carrega a imagem de 400px (mobile) ou 1200px (desktop), otimizando a banda (LCP mais rápido) e evitando Gargalos de Transferência (Bandwidth limits).
*   **Thumbnails Leves e Blur**: Todas as listas de produtos utilizam larguras menores (ex: `100px` ou `300px`) via CDN Cloudinary.

## 3. Checklist de Capacidade (Antes de Campanhas Fortes)

1.  [ ] **Supabase Limits**: Verificar se as conexões simultâneas do pooler Supabase suportam o pico esperado (idealmente habilitar pgbouncer no modo "transaction" se não estiver ativo nas configurações do Supabase).
2.  [ ] **Teste de Carga**: Rodar os scripts de k6 que estão em `tests/load/`. Comande: `k6 run tests/load/catalog.js`. Analise se os tempos de resposta da RPC de busca se mantêm < 300ms.
3.  [ ] **Cloudinary Limits**: Verificar os "Credits" no dashboard da Cloudinary para garantir que o limite mensal de banda de transformação não será excedido em caso de requisições de milhões de acessos.
4.  [ ] **Vercel / Edge**: Conferir se as APIs e o Vercel não possuem limitações de tempo de execução nas Funções Serverless caso tenham sido criadas. Como o projeto usa client/SPA com RPC via SDK, a CDN entrega o frontend puro super rápido.
5.  [ ] **Monitoramento (Logs)**: O Log Explorer do Supabase (`auth` e `api` filters) deve ser monitorado ativamente nas primeiras horas do pico para capturar lentidões.

## 4. Como agir sob ataque de tráfego/excesso abusivo

*   Caso o Supabase fique lento, habilitar imediatamente limitação de requisições por IP caso esteja configurado no Cloudflare (caso exista proxy na frente) ou através do próprio WAF Vercel (para impedir excesso de acesso em assets estáticos).
*   Desativar momentaneamente chamadas pesadas que não têm cache (por exemplo, features não essenciais do checkout) através de flags no banco caso a situação seja crítica (Fallback Manual).
