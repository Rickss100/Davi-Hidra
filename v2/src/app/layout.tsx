import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Norte Invest Private | Método DAVI & Hydra',
  description:
    'Plataforma Institucional de Gestão Patrimonial, Rebalanceamento Inteligente e Renda Passiva.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Norte Invest'
  },
  icons: {
    icon: [
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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-obsidian-950 text-slate-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
