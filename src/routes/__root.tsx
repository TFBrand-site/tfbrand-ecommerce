import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import * as React from "react";
import { CartProvider } from "@/lib/bag-store";
import { SearchProvider } from "@/lib/search-store";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import "@/styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        {GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <HeadContent />
      </head>
      <body>
        <SearchProvider>
          <CartProvider>
            <Outlet />
            <ScrollToTopButton />
          </CartProvider>
        </SearchProvider>
        <Scripts />
      </body>
    </html>
  );
}
