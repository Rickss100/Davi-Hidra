'use client';

import React, { useState } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { Button, Input } from '@/components/ui/primitives';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export function PrivateAiDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou a Norte Invest AI, especialista no Método DAVI & Hydra. Posso analisar sua alocação estratégica, proventos, Yield on Cost ou Reserva de Emergência.'
    }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Não foi possível concluir a análise neste instante.'
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Conexão instável no momento. Tente novamente.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Abrir Norte Invest AI"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-obsidian-950 shadow-gold transition-transform hover:scale-105 md:bottom-6"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-36 right-5 z-50 flex h-[430px] w-[340px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gold-500/30 bg-obsidian-900 shadow-private md:bottom-20 md:w-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 bg-obsidian-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-gold-400" />
              <span className="text-sm font-bold text-white">Norte Invest AI</span>
            </div>
            <button
              type="button"
              aria-label="Fechar chat"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'user'
                    ? 'ml-8 rounded-xl bg-gold-500/20 p-3 text-gold-100'
                    : 'mr-6 rounded-xl border border-slate-800 bg-obsidian-950 p-3 text-slate-200'
                }
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-6 rounded-xl border border-slate-800 bg-obsidian-950 p-3 text-slate-400">
                Norte Invest AI está analisando os indicadores da sua carteira...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-800 bg-obsidian-950 p-3">
            <label htmlFor="private-ai-input" className="sr-only">
              Pergunte à Norte Invest AI
            </label>
            <Input
              id="private-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte à Norte Invest AI..."
              className="h-9 text-xs"
            />
            <Button type="submit" size="sm" variant="gold" disabled={loading} aria-label="Enviar pergunta">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
