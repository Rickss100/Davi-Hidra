'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui/primitives';

interface TwoFactorModalProps {
  open: boolean;
  onClose: () => void;
  onStatusChanged: () => void;
}

export function TwoFactorModal({ open, onClose, onStatusChanged }: TwoFactorModalProps) {
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setCode('');
    setPassword('');
    setRecoveryCodes(null);
    setLoading(true);

    fetch('/api/auth/2fa', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setTotpEnabled(Boolean(data.totpEnabled));
        setQrCodeUrl(data.qrCodeDataUrl || null);
        setManualKey(data.manualKey || null);
      })
      .catch(() => setError('Erro ao carregar configuração de segurança.'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Código inválido.');
        return;
      }
      setTotpEnabled(true);
      setRecoveryCodes(data.recoveryCodes || []);
      onStatusChanged();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Senha incorreta.');
        return;
      }
      setTotpEnabled(false);
      onStatusChanged();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-2fa-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <Card className="relative w-full max-w-md border-gold-500/30 bg-obsidian-900 p-6">
        <button
          type="button"
          aria-label="Fechar janela de segurança"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-obsidian-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 id="modal-2fa-title" className="text-lg font-bold text-white">
              Autenticação em 2 Fatores (2FA)
            </h2>
            <p className="text-xs text-slate-400">
              Padrão Private Banking (Google Authenticator / Authy / iPhone)
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Gerando chave criptográfica AES-256...</p>
        ) : recoveryCodes ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <div className="mb-1 flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Blindagem 2FA Ativada com Sucesso!</span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Guarde estes códigos de referência em local seguro caso troque de aparelho:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-obsidian-950 p-3 font-mono text-xs text-gold-300">
              {recoveryCodes.map((rc) => (
                <div key={rc} className="rounded bg-obsidian-900 px-2 py-1.5 text-center">
                  {rc}
                </div>
              ))}
            </div>
            <Button variant="gold" className="w-full" onClick={onClose}>
              Concluir e Fechar
            </Button>
          </div>
        ) : totpEnabled ? (
          <form onSubmit={handleDisable} className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
              <span className="text-sm font-medium text-emerald-300">Status da Conta</span>
              <Badge tone="emerald">2FA Ativo & Criptografado</Badge>
            </div>
            <div>
              <label htmlFor="disable-2fa-pwd" className="mb-1.5 block text-xs font-medium text-slate-300">
                Confirme sua senha atual para desativar o 2FA
              </label>
              <Input
                id="disable-2fa-pwd"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha de acesso"
              />
            </div>
            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
            <Button type="submit" variant="danger" className="w-full" disabled={submitting}>
              {submitting ? 'Validando...' : 'Desativar 2FA nesta Conta'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEnable} className="space-y-4">
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-white p-3">
              {qrCodeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="QR Code para aplicativo autenticador 2FA"
                  className="h-44 w-44"
                />
              )}
            </div>

            {manualKey && (
              <div className="rounded-lg border border-slate-800 bg-obsidian-950 p-2.5 text-center">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                  Chave Manual (caso não use câmera)
                </span>
                <code className="mt-0.5 block select-all font-mono text-xs text-gold-300">
                  {manualKey}
                </code>
              </div>
            )}

            <div>
              <label htmlFor="totp-verify-input" className="mb-1.5 block text-xs font-medium text-slate-300">
                Digite o código de 6 dígitos gerado no seu celular
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="totp-verify-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="pl-9 text-center font-mono text-base tracking-[0.35em]"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={submitting || code.length < 6}>
              {submitting ? 'Ativando Blindagem...' : 'Confirmar e Ativar 2FA'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
