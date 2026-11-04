'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Trash2, ArrowUpRight } from 'lucide-react';
import { Button, Input } from '@/components/ui/primitives';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

const QUICK_PROMPTS = [
  'Onde fica a aba de configuração?',
  'Como funciona o Onde Aportar?',
  'Como está minha carteira hoje?',
  'O que são os Setores BEST?',
  'Onde assistir às 30 aulas?'
];

/**
 * Renderiza texto com formatação limpa de markdown leve (negrito, marcadores e quebras de linha)
 */
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : trimmed;

        // Parse de **negrito**
        const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-gold-300">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-[11px] sm:text-xs">
              <span className="text-gold-400 font-bold shrink-0">•</span>
              <span className="text-slate-200">{renderedLine}</span>
            </div>
          );
        }

        return (
          <p key={lIdx} className="text-[11px] sm:text-xs text-slate-200">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

export function PrivateAiDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    role: 'assistant',
    content:
      'Olá! Sou a **MANTFRAI AI**, sua estrategista inteligente no Método Antifrágil de Investimento. Posso orientar suas dúvidas sobre navegação (como achar configurações, temas e lupa), explicar a metodologia, simular aportes pelo Motor RDM ou diagnosticar sua carteira em tempo real.'
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
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
        {
          role: 'assistant',
          content: 'Conexão instável no momento. Por favor, tente novamente.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleClearHistory = () => {
    setMessages([initialGreeting]);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Abrir MANTFRAI AI"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-obsidian-950 shadow-gold transition-all hover:scale-110 active:scale-95 md:bottom-6"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-36 right-5 z-50 flex h-[490px] w-[350px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gold-500/35 bg-obsidian-900 shadow-private md:bottom-20 md:w-[410px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-obsidian-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide">MANTFRAI AI</span>
                <span className="block text-[10px] text-emerald-400 font-medium">Online • Consultoria Ativa</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Limpar histórico"
                title="Limpar conversa"
                onClick={handleClearHistory}
                className="rounded p-1 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Fechar chat"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'user'
                    ? 'ml-8 rounded-2xl bg-gold-500/20 border border-gold-500/30 p-3 text-gold-100'
                    : 'mr-4 rounded-2xl border border-slate-800 bg-obsidian-950/90 p-3 text-slate-200 shadow-sm'
                }
              >
                {m.role === 'user' ? (
                  <p className="text-[11px] sm:text-xs font-medium text-gold-100">{m.content}</p>
                ) : (
                  <FormattedMessage content={m.content} />
                )}
              </div>
            ))}

            {loading && (
              <div className="mr-4 flex items-center gap-2 rounded-2xl border border-slate-800 bg-obsidian-950 p-3 text-xs text-slate-400">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-gold-400" />
                <span>MANTFRAI AI está formulando a resposta...</span>
              </div>
            )}

            {/* Quick Prompts quando conversa está no início */}
            {messages.length <= 2 && !loading && (
              <div className="pt-2">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Sugestões Rápidas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="group flex items-center gap-1 rounded-full border border-slate-800 bg-obsidian-950 px-2.5 py-1 text-[10px] text-slate-300 transition-all hover:border-gold-500/50 hover:bg-gold-500/10 hover:text-gold-200"
                    >
                      <span>{prompt}</span>
                      <ArrowUpRight className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form de Envio */}
          <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-800 bg-obsidian-950 p-3">
            <label htmlFor="private-ai-input" className="sr-only">
              Pergunte à MANTFRAI AI
            </label>
            <Input
              id="private-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida ou comando..."
              className="h-9 text-xs bg-obsidian-900 border-slate-700/80 focus:border-gold-500"
            />
            <Button
              type="submit"
              size="sm"
              variant="gold"
              disabled={loading || !input.trim()}
              aria-label="Enviar pergunta"
              className="px-3"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
