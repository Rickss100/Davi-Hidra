'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui/primitives';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | '2fa'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register' ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Falha na autenticação.');
        return;
      }

      if (data.requires2FA) {
        setMode('2fa');
        return;
      }

      router.replace('/');
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

      router.replace('/');
      router.refresh();
    } catch {
      setError('Erro ao verificar código 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-obsidian-800 via-obsidian-950 to-obsidian-950 px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-xl font-black text-obsidian-950 shadow-gold">
          N
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">NORTE INVEST</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
          Private Wealth & Método DAVI / Hydra
        </p>
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-obsidian-900/95 p-7">
        {mode === '2fa' ? (
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
              {loading ? 'Validando Criptografia...' : 'Confirmar Acesso Private'}
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
            <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-obsidian-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === 'login' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Acessar Carteira
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  mode === 'register' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nova Conta Private
              </button>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="auth-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ricardo Arthur"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-300">
                E-mail ou Identificador
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="auth-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@norteinvest.com"
                  className="pl-9"
                />
              </div>
              {email.length > 2 && !email.includes('@') && mode === 'register' && (
                <div className="mt-1.5 flex gap-1.5">
                  {['@gmail.com', '@icloud.com'].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setEmail(`${email}${domain}`)}
                      className="rounded border border-slate-800 bg-obsidian-950 px-2 py-0.5 text-[11px] text-slate-400 hover:border-gold-500/40 hover:text-gold-300"
                    >
                      +{domain}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-password" className="text-xs font-medium text-slate-300">
                  Senha Criptografada
                </label>
                {mode === 'login' && (
                  <Link href="/recuperar-senha" className="text-xs text-gold-400 hover:underline">
                    Recuperar acesso
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              <span>{loading ? 'Autenticando...' : mode === 'login' ? 'Entrar com Segurança' : 'Criar Conta Blindada'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sessão HttpOnly Zero-Trust • Criptografia AES-256 & 2FA</span>
            </div>
          </form>
        )}
      </Card>

      <Link href="/termos" className="mt-6 text-xs text-slate-500 hover:text-slate-300">
        Termos de Uso, Compliance & Política de Privacidade (LGPD)
      </Link>
    </div>
  );
}
