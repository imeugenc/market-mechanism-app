import type { ReactNode } from "react";

import { ScrollViewStyleReset } from "expo-router/html";

export default function RootHtml({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <title>Market Mechanism</title>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Market Mechanism" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Market Mechanism" />
        <meta
          name="description"
          content="Market Mechanism - analiză zilnică, after action review și cereri personale pentru traderi disciplinați."
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body,#root{background:#000;height:100%;} body{margin:0;padding:0;overscroll-behavior-y:none;} @supports (padding: env(safe-area-inset-bottom)){ body{padding-bottom: env(safe-area-inset-bottom);} }",
          }}
        />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "var mmTitle='Market Mechanism'; if (!document.title) { document.title = mmTitle; } var mmTitleNode=document.querySelector('title[data-rh=\"true\"]'); if (mmTitleNode && !mmTitleNode.textContent) { mmTitleNode.textContent = mmTitle; } if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }",
          }}
        />
      </body>
    </html>
  );
}
