'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck, MessageCircle } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui/primitives';
import { BrandLogo } from '@/components/ui/brand-logo';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-obsidian-950 p-4">
      <div className="mb-6">
        <BrandLogo size="lg" centered />
      </div>
      <Card className="w-full max-w-md space-y-4 p-7">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>

        <h1 className="text-xl font-bold text-white">Recuperação de Acesso</h1>
        <p className="text-xs leading-relaxed text-slate-400">
          Informe seu e-mail cadastrado ou fale direto com nosso suporte técnico via WhatsApp para assistência imediata.
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

        <a
          href="https://api.whatsapp.com/send?phone=5527995263026&text=Ol%C3%A1%2C%20esqueci%20minha%20senha%20de%20acesso%20no%20Davi-Hidra.%20Pode%20me%20ajudar%20a%20redefinir%3F"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <MessageCircle className="h-4 w-4" />
          Falar com Suporte via WhatsApp
        </a>
      </Card>
    </div>
  );
}
