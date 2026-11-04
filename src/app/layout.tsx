import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers';

export const metadata: Metadata = {
  title: 'MANTFRAI • Método Antifrágil de Investimento',
  description:
    'Plataforma de Gestão Patrimonial Antifrágil, Motor RDM de Rebalanceamento e Filtro MFS de Ações Perenes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MANTFRAI'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }]
  }
};

export const viewport: Viewport = {
  themeColor: '#070A11',
  width: 'device-width',
  initialScale: 1
};

const DEV_SW_CLEANUP_SCRIPT = `
(function() {
  try {
    var h = window.location.hostname;
    if ((h === 'localhost' || h === '127.0.0.1') && 'serviceWorker' in navigator) {
      var hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        if (!regs.length && !hadController) return;
        Promise.all(regs.map(function(r) { return r.unregister(); }))
          .then(function() {
            if ('caches' in window) {
              return caches.keys().then(function(keys) {
                return Promise.all(keys.map(function(k) { return caches.delete(k); }));
              });
            }
          })
          .then(function() {
            if (hadController && !sessionStorage.getItem('__sw_purged')) {
              sessionStorage.setItem('__sw_purged', '1');
              window.location.reload();
            }
          });
      });
    }
  } catch (e) {}
})();
`;

const ACCESSIBILITY_INIT_SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('norte_invest_accessibility_v2');
    if (raw) {
      var p = JSON.parse(raw);
      if (p.colorTheme === 'light_titanium') {
        document.documentElement.setAttribute('data-theme', 'light_titanium');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else if (p.colorTheme) {
        document.documentElement.setAttribute('data-theme', p.colorTheme);
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
      if (p.pageZoom && p.pageZoom !== 1.0) {
        document.documentElement.style.zoom = String(p.pageZoom);
      }
      if (p.fontScale && p.fontScale !== 'standard') {
        document.documentElement.setAttribute('data-font-scale', p.fontScale);
      }
      if (p.fontDyslexic) {
        document.documentElement.setAttribute('data-dyslexic', 'true');
      }
      if (p.highlightClickTargets) {
        document.documentElement.setAttribute('data-highlight-targets', 'true');
      }
      if (p.reduceMotion) {
        document.documentElement.setAttribute('data-reduce-motion', 'true');
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: DEV_SW_CLEANUP_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: ACCESSIBILITY_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-obsidian-950 text-slate-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
