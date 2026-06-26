# Guia de Otimização de Imagens — TFBrand

A TFBrand é uma loja focada em moda feminina, onde a qualidade visual das fotos é fundamental para o sucesso das vendas. Este guia orienta a compressão inteligente e entrega correta de fotos sem penalizar o plano de dados do usuário final.

---

## 🎨 Diretrizes para Cadastro de Fotos (Painel Administrativo)

### 1. Formato e Compressão

- **Formato Preferencial:** WebP. Todas as imagens de upload devem ser convertidas automaticamente no navegador do administrador para o formato WebP antes de serem salvas no Supabase Storage.
- **Por que WebP?** Ele reduz o tamanho do arquivo em média 30% a 50% em comparação com JPEG e PNG com a mesma qualidade de exibição.
- **Transparência:** Usar PNG apenas se a imagem exigir transparência de fundo.

### 2. Resoluções Recomendadas

- **Capa / Imagem de Destaque:** Máximo de 1200px de largura.
- **Miniatura do Catalogo (Cards):** Máximo de 480px a 640px de largura.
- **Painel Administrativo / Thumbnails:** Até 200px de largura.

---

## 💻 Renderização e Tags no HTML (Frontend)

Para otimizar o carregamento e evitar o layout shift (CLS), siga as práticas abaixo:

### 1. Lazy Loading e Decoding Assíncrono

Todas as imagens localizadas abaixo da primeira dobra (imagens que o usuário só vê ao rolar a página) devem usar:

```html
<img src="url-da-imagem.webp" loading="lazy" decoding="async" alt="Descrição" />
```

- **LCP (Largest Contentful Paint):** A imagem principal da primeira dobra (como o banner principal do Hero) **não** deve ter `loading="lazy"`. Ela deve carregar imediatamente e ter `fetchpriority="high"`.

### 2. Aspect Ratio e Layout Shift

Sempre declare as dimensões ou a propriedade `aspect-ratio` no CSS das imagens para evitar que a página se mova de forma abrupta enquanto as imagens carregam:

```css
/* Exemplo de classe para cards de roupas da loja (proporção 3:4) */
.product-image-container {
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background-color: #f4f4f5;
}
```

---

## ☁️ Otimização no Supabase Storage e CDN

### 1. Cache Control Longo

No momento do upload do arquivo de imagem pelo painel administrativo, o cabeçalho de metadados `cache-control` deve ser fornecido obrigatoriamente:

```typescript
cacheControl: "public, max-age=31536000, immutable";
```

Isso instrui o navegador e os servidores de borda (CDN) do Supabase a guardarem o arquivo localmente no celular do usuário por até 1 ano.

### 2. Nome de Arquivo Único (Versionado)

Se uma imagem for atualizada, ela nunca deve ser salva sob o mesmo nome de arquivo anterior. As imagens devem usar um UUID ou hash temporal no caminho:
`products/{productId}/{colorSlug}/{uuid}-{variant}.webp`

Isso garante que, mesmo com o cache configurado para 1 ano, se a imagem for alterada, o navegador do cliente baixará a nova imagem de forma instantânea porque o endereço URL mudou.
