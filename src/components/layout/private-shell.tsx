'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Compass,
  Target,
  Shield,
  Coins,
  PieChart,
  History,
  Radar,
  BookOpen,
  Users,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Smartphone,
  EyeOff,
  Menu,
  X,
  Settings,
  KeyRound
} from 'lucide-react';
import { usePortfolioData, useSyncLivePrices } from '@/hooks/use-portfolio';
import { Button, Badge } from '@/components/ui/primitives';
import { BrandLogo } from '@/components/ui/brand-logo';
import { TwoFactorModal } from '@/components/security/two-factor-modal';
import { ChangePasswordModal } from '@/components/security/change-password-modal';
import { SubscriptionCard } from '@/components/subscription/subscription-card';
import { PlansModal } from '@/components/subscription/plans-modal';
import { PrivateAiDrawer } from '@/components/chat/private-ai-drawer';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useClickToSpeech } from '@/lib/accessibility/use-click-to-speech';
import { CursorMagnifier } from '@/components/accessibility/cursor-magnifier';
import { AccessibilityDrawer } from '@/components/accessibility/accessibility-drawer';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/carteira', label: 'Carteira', icon: Briefcase },
  { href: '/onde-aportar', label: 'Onde Aportar', icon: Compass },
  { href: '/definir-objetivos', label: 'Definir Objetivos', icon: Target },
  { href: '/reserva-emergencia', label: 'Reserva de Emerg.', icon: Shield },
  { href: '/renda-passiva', label: 'Renda Passiva', icon: Coins },
  { href: '/resumo', label: 'Resumo', icon: PieChart },
  { href: '/radar', label: 'Radar de Ativos', icon: Radar },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/tutorial', label: 'Tutorial & Método', icon: BookOpen }
];

export function PrivateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, refetch } = usePortfolioData();
  const syncPrices = useSyncLivePrices();

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const { openDrawer } = useAccessibility();
  useClickToSpeech();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const ctx = data?.context;
  const snapshot = data?.snapshot;
  const isPrivileged = ctx?.actor.role === 'admin' || ctx?.actor.role === 'collaborator';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const handleExitAudit = async () => {
    await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: null })
    });
    await refetch();
    router.refresh();
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      setShowIosGuide(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-obsidian-950 text-slate-100">
      {/* Banner Institucional de Modo Auditoria */}
      {ctx?.isAuditing && (
        <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-gold-500/40 bg-gold-500/15 px-4 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 font-semibold text-gold-300">
            <EyeOff className="h-4 w-4" />
            <span>
              MODO AUDITORIA COMPLIANCE ATIVO — Visualizando carteira de{' '}
              <strong className="text-white">{ctx.portfolioOwner.name}</strong> ({ctx.portfolioOwner.email})
            </span>
          </div>
          <Button size="sm" variant="gold" onClick={handleExitAudit}>
            Encerrar Auditoria
          </Button>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/90 bg-obsidian-900/95 md:flex">
          <div className="border-b border-slate-800/80 px-5 py-5">
            <BrandLogo size="md" />
          </div>

          <nav aria-label="Menu Principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                    active
                      ? 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:bg-obsidian-800 hover:text-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isPrivileged && (
              <Link
                href="/admin"
                className={cn(
                  'mt-3 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all',
                  pathname === '/admin'
                    ? 'border-gold-500 bg-gold-500/20 text-gold-300'
                    : 'border-slate-800 bg-obsidian-950/60 text-gold-400 hover:border-gold-500/40'
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>{ctx?.actor.role === 'admin' ? 'Painel Admin' : 'Painel Gestão (TI)'}</span>
              </Link>
            )}
          </nav>

          <div className="space-y-2.5 border-t border-slate-800/80 p-3">
            <SubscriptionCard
              user={ctx?.actor}
              onOpenPlans={() => setShowPlansModal(true)}
            />

            <button
              type="button"
              onClick={openDrawer}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-obsidian-950 px-3 py-2 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-400" />
                Acessibilidade & Cores
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                WCAG
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShow2FAModal(true)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-obsidian-950 px-3 py-2 text-xs font-medium text-slate-300 hover:border-gold-500/40"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Segurança 2FA
              </span>
              <Badge tone={ctx?.actor.totpEnabled ? 'emerald' : 'gold'}>
                {ctx?.actor.totpEnabled ? 'Ativo' : 'Ativar'}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setShowChangePasswordModal(true)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-obsidian-950 px-3 py-2 text-xs font-medium text-slate-300 hover:border-gold-500/40 hover:text-gold-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-gold-400" />
                Alterar Minha Senha
              </span>
            </button>

            <button
              type="button"
              onClick={handleInstallApp}
              className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-obsidian-950 px-3 py-2 text-xs font-medium text-slate-300 hover:border-gold-500/40 hover:text-gold-300"
            >
              <Smartphone className="h-4 w-4 text-gold-400" />
              <span>Instalar App no Celular</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Encerrar Sessão Segura</span>
            </button>
          </div>
        </aside>

        {/* Área Principal */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
          {/* Header Institucional */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/80 bg-obsidian-950/90 px-4 py-3.5 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu lateral"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg border border-slate-800 p-2 text-slate-300 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs text-slate-400">
                  Carteira Private •{' '}
                  <span className="font-semibold text-gold-400">
                    {ctx?.portfolioOwner.name || 'Carregando...'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {snapshot && (
                <div className="hidden items-center gap-3 text-xs text-slate-400 sm:flex">
                  <span className="money-value rounded-lg border border-slate-800 bg-obsidian-900 px-2.5 py-1">
                    USD/BRL: <strong className="text-slate-200">R$ {snapshot.usdToBrl.toFixed(2)}</strong>
                  </span>
                  <span className="money-value rounded-lg border border-slate-800 bg-obsidian-900 px-2.5 py-1">
                    SELIC: <strong className="text-emerald-400">{snapshot.selicRate.toFixed(2)}%</strong>
                  </span>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => syncPrices.mutate()}
                disabled={syncPrices.isPending}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', syncPrices.isPending && 'animate-spin')} />
                <span className="hidden sm:inline">
                  {syncPrices.isPending ? 'Sincronizando B3...' : 'Atualizar Cotações'}
                </span>
              </Button>

              <button
                type="button"
                onClick={openDrawer}
                title="Configurações & Acessibilidade"
                aria-label="Configurações & Acessibilidade"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1527] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[2400px] flex-1 p-3 sm:p-4 md:p-6 lg:p-8 transition-all">
            {children}
          </main>
        </div>
      </div>

      {/* Gaveta Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm md:hidden">
          <div className="flex w-72 flex-col bg-obsidian-900 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <BrandLogo size="sm" />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                      pathname === item.href
                        ? 'bg-emerald-500/15 font-medium text-emerald-400'
                        : 'text-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {isPrivileged && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gold-400"
                >
                  <Users className="h-4 w-4" />
                  <span>{ctx?.actor.role === 'admin' ? 'Painel Admin' : 'Painel Gestão (TI)'}</span>
                </Link>
              )}
            </div>
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <div className="mb-2">
                <SubscriptionCard
                  user={ctx?.actor}
                  onOpenPlans={() => {
                    setMobileMenuOpen(false);
                    setShowPlansModal(true);
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openDrawer();
                }}
              >
                <Settings className="h-4 w-4 text-emerald-400" />
                Configurações & Acessibilidade
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShow2FAModal(true);
                }}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Configurar 2FA QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowChangePasswordModal(true);
                }}
              >
                <KeyRound className="h-4 w-4 text-gold-400" />
                Alterar Minha Senha
              </Button>
              <Button variant="danger" size="sm" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior Nativa Mobile (PWA) — 5 atalhos como na V1 */}
      <nav
        aria-label="Navegação Rápida Mobile"
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-800 bg-obsidian-900/95 py-2 backdrop-blur-md md:hidden"
      >
        {[
          { href: '/', label: 'Home', icon: LayoutDashboard },
          { href: '/carteira', label: 'Carteira', icon: Briefcase },
          { href: '/onde-aportar', label: 'Aportar', icon: Compass },
          { href: '/definir-objetivos', label: 'Régua', icon: Target }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium',
                active ? 'text-emerald-400' : 'text-slate-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium text-slate-400"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Guia Rápido PWA iOS/Android */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gold-500/30 bg-obsidian-900 p-6">
            <h3 className="text-base font-bold text-white">Instalar App Norte Invest</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              • <strong>No iPhone (Safari):</strong> toque em <em>Compartilhar</em> na barra inferior e escolha{' '}
              <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
              <br />• <strong>No Android / Desktop (Chrome/Edge):</strong> clique no ícone de instalação na barra de endereço.
            </p>
            <Button variant="gold" size="sm" className="mt-4 w-full" onClick={() => setShowIosGuide(false)}>
              Entendi
            </Button>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />
      )}
      {showPlansModal && (
        <PlansModal
          onClose={() => setShowPlansModal(false)}
          userEmail={ctx?.actor.email}
          currentPlan={ctx?.actor.planPeriod}
        />
      )}
      <TwoFactorModal
        open={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onStatusChanged={() => refetch()}
      />
      <PrivateAiDrawer />
      <CursorMagnifier />
      <AccessibilityDrawer />
    </div>
  );
}
