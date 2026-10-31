'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui/primitives';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      setStatus({ ok: res.ok, msg: data.message || 'Operação concluída.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-pwd" className="mb-1.5 block text-xs font-medium text-slate-300">
          Nova Senha (mínimo 8 caracteres)
        </label>
        <Input
          id="new-pwd"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {status && (
        <p className={`text-xs ${status.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
          {status.msg}
        </p>
      )}

      <Button type="submit" variant="gold" className="w-full" disabled={loading || !token}>
        {loading ? 'Redefinindo...' : 'Salvar Nova Senha'}
      </Button>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-950 p-4">
      <Card className="w-full max-w-md space-y-4 p-7">
        <h1 className="text-xl font-bold text-white">Redefinir Credencial Private</h1>
        <Suspense fallback={<p className="text-xs text-slate-400">Carregando validação...</p>}>
          <ResetForm />
        </Suspense>
        <Link href="/login" className="block text-center text-xs text-gold-400 hover:underline">
          Ir para o Login
        </Link>
      </Card>
    </div>
  );
}
