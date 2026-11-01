import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/primitives';

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card className="space-y-4 p-8">
        <h1 className="text-2xl font-bold text-white">
          Termos de Uso, Compliance & Política de Privacidade (LGPD)
        </h1>
        <p className="text-sm leading-relaxed text-slate-300">
          A plataforma <strong>Norte Invest Private (Método DAVI & Hydra)</strong> é uma ferramenta tecnológica de consolidação patrimonial, organização de carteira e simulação matemática de rebalanceamento baseada nos objetivos definidos pelo próprio investidor.
        </p>
        <p className="text-sm leading-relaxed text-slate-300">
          <strong>Segurança & Privacidade:</strong> Todos os dados patrimoniais são armazenados em banco transacional PostgreSQL com isolamento estrito por titular, sessões criptografadas em cookies <code>HttpOnly</code>, suporte a Autenticação em Dois Fatores (2FA RFC 6238) e trilha de auditoria em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
        <Link href="/login" className="inline-block pt-4 text-sm font-semibold text-gold-400 hover:underline">
          ← Voltar para a Plataforma
        </Link>
      </Card>
    </div>
  );
}
