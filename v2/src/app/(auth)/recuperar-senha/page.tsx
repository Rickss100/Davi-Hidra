'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui/primitives';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-950 p-4">
      <Card className="w-full max-w-md space-y-4 p-7">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>

        <h1 className="text-xl font-bold text-white">Recuperação de Acesso</h1>
        <p className="text-xs leading-relaxed text-slate-400">
          Informe seu e-mail cadastrado. Por segurança, o token de recuperação é criptografado com SHA-256 e nunca é exibido na rede pública.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <MailCheck className="h-4 w-4" />
              <span>Solicitação Registrada</span>
            </div>
            Caso sua conta esteja ativa em nossa base Private, as instruções foram processadas. Você também pode solicitar redefinição imediata à nossa mesa de suporte Private.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rec-email" className="mb-1.5 block text-xs font-medium text-slate-300">
                E-mail Cadastrado
              </label>
              <Input
                id="rec-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : 'Solicitar Redefinição Segura'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
