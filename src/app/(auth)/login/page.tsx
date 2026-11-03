'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui/primitives';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | '2fa'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [inactiveNotice, setInactiveNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInactiveNotice(null);
    setLoading(true);

    try {
      if (mode === 'register' && !acceptedTerms) {
        setError('É necessário concordar com os Termos de Uso e o Aviso de Isenção CVM para criar sua conta.');
        setLoading(false);
        return;
      }

      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        if (
          data.error === 'ACCOUNT_INACTIVE' ||
          data.error === 'PLAN_EXPIRED' ||
          String(data.message || '').toLowerCase().includes('inativa') ||
          String(data.message || '').toLowerCase().includes('assinatura')
        ) {
          setInactiveNotice(
            data.message ||
              'Sua conta está inativa por motivos técnicos ou encerramento do período de assinatura.'
          );
          return;
        }
        setError(data.message || 'Falha na autenticação.');
        return;
      }

      if (data.requires2FA) {
        setMode('2fa');
        return;
      }

      const targetRoute =
        data.user?.role === 'admin' || data.user?.role === 'collaborator' ? '/admin' : '/';
      router.replace(targetRoute);
      router.refresh();
    } catch {
      setError('Falha de comunicação segura com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Código 2FA inválido.');
        return;
      }

      const targetRoute =
        data.user?.role === 'admin' || data.user?.role === 'collaborator' ? '/admin' : '/';
      router.replace(targetRoute);
      router.refresh();
    } catch {
      setError('Erro ao verificar código 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-obsidian-800 via-obsidian-950 to-obsidian-950 px-4 py-10">
      <div className="mb-7">
        <BrandLogo size="lg" centered />
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-obsidian-900/95 p-7">
        {inactiveNotice ? (
          <div className="space-y-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Conta Inativa ou Expirada</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{inactiveNotice}</p>
            </div>
            <div className="space-y-2.5 pt-1">
              <a
                href="https://api.whatsapp.com/send?phone=5527995263026&text=Ol%C3%A1%2C%20preciso%20de%20suporte%20t%C3%A9cnico%20referente%20%C3%A0%20minha%20conta%20na%20Norte%20Invest."
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-obsidian-950 transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com o Suporte Técnico
              </a>
              <button
                type="button"
                onClick={() => setInactiveNotice(null)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 py-2 text-xs text-slate-300 hover:bg-obsidian-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar à tela de login
              </button>
            </div>
          </div>
        ) : mode === '2fa' ? (
          <form onSubmit={handleVerify2FA} className="space-y-5">
            <div className="text-center">
              <Badge tone="gold" className="mb-2">
                Verificação Bancária 2FA
              </Badge>
              <h2 className="text-lg font-bold text-white">Código do Autenticador</h2>
              <p className="mt-1 text-xs text-slate-400">
                Abra o Google Authenticator, Authy ou Senhas do iPhone e informe os 6 dígitos.
              </p>
            </div>

            <div>
              <label htmlFor="login-2fa-code" className="mb-1.5 block text-xs font-medium text-slate-300">
                Código Temporário (30s)
              </label>
              <Input
                id="login-2fa-code"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-[0.4em]"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={loading || totpCode.length < 6}>
              {loading ? 'Validando Criptografia...' : 'Confirmar Acesso'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setTotpCode('');
                setError('');
              }}
              className="block w-full text-center text-xs text-slate-400 hover:text-gold-300"
            >
              Voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginOrRegister} className="space-y-4">
            <div className="text-center">
              <h1 className="text-lg font-bold text-white">
                {mode === 'register'
                  ? 'Crie sua conta para começar a investir'
                  : 'Insira suas informações para realizar o login'}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                {mode === 'register'
                  ? 'Ambiente exclusivo MANTFRAI para controle de aportes pelo Método Antifrágil'
                  : 'Acesso seguro à sua carteira, metas e estratégias de alocação'}
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-obsidian-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === 'login' ? 'bg-emerald-500 text-obsidian-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === 'register' ? 'bg-emerald-500 text-obsidian-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar Conta Gratuita
              </button>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="auth-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-300">
                E-mail ou Login
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="auth-email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'register' ? 'Ex: seuemail@exemplo.com' : 'Digite seu e-mail de acesso'}
                  className="pl-9"
                />
              </div>
              {/* Atalhos rápidos de domínio da V1 */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {['@gmail.com', '@hotmail.com', '@outlook.com'].map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => {
                      const base = email.split('@')[0] || '';
                      setEmail(`${base}${domain}`);
                    }}
                    className="rounded-md border border-slate-800 bg-obsidian-950 px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-password" className="text-xs font-medium text-slate-300">
                  Senha
                </label>
                {mode === 'login' && (
                  <div className="flex items-center gap-3">
                    <Link href="/recuperar-senha" className="text-xs text-slate-400 hover:text-gold-300 hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="auth-password"
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  aria-label="Alternar visibilidade de senha"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="rounded-xl border border-slate-800 bg-obsidian-950/80 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-obsidian-900 text-gold-500 focus:ring-gold-500"
                  />
                  <span className="leading-snug">
                    Li e concordo com os{' '}
                    <Link
                      href="/termos"
                      target="_blank"
                      className="font-bold text-gold-400 underline hover:text-gold-300"
                    >
                      Termos de Uso
                    </Link>{' '}
                    e o Aviso CVM, ciente de que a MANTFRAI é uma ferramenta pedagógica e tecnológica e que toda decisão de investimento é de minha exclusiva responsabilidade.
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              <span>
                {loading
                  ? 'Processando...'
                  : mode === 'login'
                    ? 'Entrar'
                    : 'Criar Conta Gratuita'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sessão HttpOnly Zero-Trust • Criptografia AES-256 &amp; 2FA</span>
            </div>
          </form>
        )}
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <a
          href="https://api.whatsapp.com/send?phone=5527995263026&text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20meu%20acesso%20no%20Norte%20Invest."
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-400"
        >
          Suporte WhatsApp
        </a>
        <span>•</span>
        <Link href="/termos" className="hover:text-slate-300">
          Termos de Uso &amp; Privacidade (LGPD)
        </Link>
      </div>
    </div>
  );
}
