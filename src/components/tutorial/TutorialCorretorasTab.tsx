'use client';

import React, { useState } from 'react';
import {
  Building2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Headphones,
  Smartphone,
  Laptop,
  Globe,
  Copy,
  ArrowRight,
  FileSpreadsheet,
  Sparkles,
  AlertTriangle,
  Coins
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui/primitives';

interface CorretoraData {
  id: string;
  name: string;
  slogan: string;
  platformType: 'app' | 'web_app' | 'global';
  reclameAqui: string;
  taxas: {
    acoes: string;
    fiis: string;
    tesouro: string;
    custodia: string;
  };
  destaque: string;
  passos: {
    abertura: string[];
    pix: string[];
    reserva: string[];
    acoesFiis: string[];
    importadorB3: string[];
  };
  dicaOuro: string;
  promptNotebookLM: string;
}

const CORRETORAS: CorretoraData[] = [
  {
    id: 'nubank',
    name: 'Nubank (antiga NuInvest)',
    slogan: '100% no celular com zero corretagem',
    platformType: 'app',
    reclameAqui: '7.7 / 10 (Bom)',
    taxas: {
      acoes: 'Taxa Zero (Lote e Fracionário)',
      fiis: 'Taxa Zero',
      tesouro: 'Taxa Zero',
      custodia: 'R$ 0,00'
    },
    destaque: 'Ideal para quem busca simplicidade máxima e não quer mexer em Home Broker no computador. O próprio app já faz o fracionário automaticamente.',
    passos: {
      abertura: [
        'Abra sua conta pelo aplicativo do Nubank no smartphone.',
        'Envie foto do documento (RG ou CNH) e selfie biométrica.',
        'Responda ao questionário de Suitability (Perfil de Investidor) marcando tolerância moderada/arrojada para liberar ações e FIIs.'
      ],
      pix: [
        'Transfira o valor do aporte mensal para a sua conta corrente do Nubank via PIX.',
        'O saldo em conta corrente já é compartilhado instantaneamente com a área de investimentos.'
      ],
      reserva: [
        'No app, toque no ícone de Cifrão ($) no menu inferior e vá em "Investimentos".',
        'Toque em "Investir" ➔ "Renda Fixa" ➔ "Tesouro Direto".',
        'Selecione o "Tesouro Selic" com vencimento mais curto (ex: 2029).',
        'Digite o valor do aporte da reserva e confirme com a senha de 4 dígitos.'
      ],
      acoesFiis: [
        'Na aba de Investimentos, toque na lupa (Buscar) e cole o código do ativo copiado do Norte Invest (ex: HGLG11 ou WEGE3).',
        'Toque no ativo ➔ clique em "Comprar".',
        'Digite a quantidade de cotas. No Nubank, você pode comprar de 1 em 1 ação normalmente (o app gerencia o fracionário nos bastidores).',
        'Confira o resumo e clique em "Confirmar compra" digitando sua senha de 4 dígitos.'
      ],
      importadorB3: [
        'As notas de negociação chegam automaticamente no seu e-mail cadastrado em até 24h úteis.',
        'Para pegar o extrato completo de movimentação, acesse a Área do Investidor da B3 (investidor.b3.com.br) com seu CPF e baixe a planilha oficial .xlsx.'
      ]
    },
    dicaOuro: 'A antiga NuInvest não existe mais como aplicativo separado. Toda a custódia e novas compras são feitas 100% dentro do app roxinho oficial do Nubank.',
    promptNotebookLM: 'Crie um episódio de áudio de 3 minutos, descontraído e extremamente prático, entre dois especialistas da Norte Invest ensinando um investidor iniciante a fazer sua primeira compra no app do Nubank. Expliquem onde fica a aba de investimentos, como comprar Tesouro Selic para a reserva, como pesquisar um FII ou Ação e enfatizem que o aplicativo já cuida do fracionário sem precisar se preocupar com a letra F.'
  },
  {
    id: 'rico',
    name: 'Rico Investimentos',
    slogan: 'App fácil e Home Broker completo (Grupo XP)',
    platformType: 'web_app',
    reclameAqui: '8.1 / 10 (Excelente)',
    taxas: {
      acoes: 'Taxa Zero (Lote e Fracionário)',
      fiis: 'Taxa Zero',
      tesouro: 'Taxa Zero',
      custodia: 'R$ 0,00'
    },
    destaque: 'Melhor equilíbrio entre facilidade no celular e poder de análise no computador. Plataforma segura pertencente ao grupo XP Investimentos.',
    passos: {
      abertura: [
        'Acesse rico.com.vc ou baixe o app "Rico: Investimentos".',
        'Cadastre seus dados e valide a biometria pelo celular.',
        'Após a aprovação (normalmente em até 2 horas úteis), cadastre sua Assinatura Eletrônica (chave de 6 a 8 dígitos para envio de ordens).'
      ],
      pix: [
        'Transfira o valor via PIX utilizando a chave gerada pela Rico ou TED para a agência e conta informadas na tela inicial da sua conta Rico.',
        'Lembre-se: a transferência deve partir de uma conta bancária com o MESMO CPF do titular.'
      ],
      reserva: [
        'No app, vá em "Investir" ➔ "Renda Fixa" ➔ "Tesouro Direto".',
        'Localize o "Tesouro Selic", clique no botão do carrinho (+), digite o valor e confirme com sua Assinatura Eletrônica.'
      ],
      acoesFiis: [
        'No app: Vá em "Investir" ➔ "Ações" ou "Fundos Imobiliários".',
        'Digite o código do ativo. Se for comprar entre 1 e 99 ações, adicione a letra "F" no final (ex: ITUB4F, BBAS3F). FIIs não precisam de F (ex: HGLG11).',
        'Selecione a quantidade de cotas e marque o tipo de ordem como "A Mercado" ou "Melhor Oferta".',
        'Clique em "Comprar" e digite sua Assinatura Eletrônica.'
      ],
      importadorB3: [
        'No portal web da Rico (computador), acesse "Minha Conta" ➔ "Documentos" ➔ "Notas de Negociação".',
        'Selecione o mês desejado e faça o download das notas em PDF, ou baixe a planilha da Área do Investidor B3 para subir no Norte Invest.'
      ]
    },
    dicaOuro: 'Se a corretora der erro de "lote inválido" ao tentar comprar poucas ações, lembre-se da regra de ouro: adicione o "F" no final do código (ex: WEGE3 ➔ WEGE3F).',
    promptNotebookLM: 'Crie um diálogo dinâmico e encorajador explicando como operar na Rico Investimentos. Os apresentadores devem desmistificar o que é o lote fracionário na B3, por que devemos colocar a letra F no final do código da ação quando compramos menos de 100 ações e por que não devemos nos assustar com a tela do Home Broker. Destaque que a Rico é taxa zero para ações, FIIs e Tesouro Direto.'
  },
  {
    id: 'inter',
    name: 'Banco Inter (Inter Invest)',
    slogan: 'Conta digital, Brasil e Exterior em um só app',
    platformType: 'global',
    reclameAqui: '7.4 / 10 (Bom)',
    taxas: {
      acoes: 'Taxa Zero (Lote e Fracionário)',
      fiis: 'Taxa Zero',
      tesouro: 'Taxa Zero',
      custodia: 'R$ 0,00'
    },
    destaque: 'Para quem quer centralizar conta corrente, investimentos no Brasil e conta internacional americana (Global Account) no mesmo aplicativo.',
    passos: {
      abertura: [
        'Abra uma conta gratuita pelo Super App Banco Inter.',
        'Ative a área "Inter Invest" no menu principal e complete o Suitability.',
        'Se desejar investir nos EUA, ative a "Global Account" em poucos cliques.'
      ],
      pix: [
        'O saldo da sua conta corrente do Inter é usado automaticamente para os investimentos no Brasil.',
        'Para investir no exterior, faça o câmbio instantâneo para a Global Account dentro do app.'
      ],
      reserva: [
        'No app, vá em "Investir" ➔ "Tesouro Direto".',
        'Escolha "Tesouro Selic", selecione o valor e confirme a aplicação.'
      ],
      acoesFiis: [
        'Vá em "Investir" ➔ "Ações/FIIs" ➔ "Home Broker".',
        'Digite o ticker (ex: TAEE11 ou XPLG11). O Inter agrupa o lote padrão e o fracionário de forma intuitiva.',
        'Insira a quantidade, escolha ordem limitada no preço atual e clique em "Comprar" autenticando com o i-Safe.'
      ],
      importadorB3: [
        'No app ou no Internet Banking, vá em "Investimentos" ➔ "Relatórios" ➔ "Notas de Corretagem" e baixe o arquivo para sincronizar no Norte Invest.'
      ]
    },
    dicaOuro: 'Com o Inter, você cumpre o tentáculo de Renda Fixa, Ações Brasil, FIIs e o tentáculo Internacional (S&P 500 / Global Account) sem precisar abrir conta em duas instituições.',
    promptNotebookLM: 'Crie uma conversa prática e esclarecedora demonstrando as vantagens de utilizar o Banco Inter para investir no Brasil e no exterior. Expliquem como funciona a Global Account, o câmbio em tempo real e a facilidade de comprar ações e fundos imobiliários com taxa zero na mesma conta corrente.'
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    slogan: 'Solidez de banco de investimentos com atendimento premiado',
    platformType: 'web_app',
    reclameAqui: '8.7 / 10 (Excelente)',
    taxas: {
      acoes: 'Taxa Zero no Fracionário (0,5% no lote padrão)',
      fiis: 'Taxa Zero',
      tesouro: 'Taxa Zero',
      custodia: 'R$ 0,00'
    },
    destaque: 'Maior banco de investimentos da América Latina. Excelente para quem valoriza atendimento humanizado, assessoria de qualidade e ampla oferta de Renda Fixa primária.',
    passos: {
      abertura: [
        'Baixe o app "BTG Pactual Investimentos" e siga o passo a passo com biometria facial.',
        'Defina a senha e ative o token de segurança no app.'
      ],
      pix: [
        'Transfira os recursos via PIX para sua conta BTG Pactual sob a mesma titularidade.'
      ],
      reserva: [
        'Menu "Investir" ➔ "Tesouro Direto" ou "CDBs de Liquidez Diária 100% CDI".',
        'Escolha o ativo de reserva e confirme com o token facial/senha.'
      ],
      acoesFiis: [
        'Menu "Renda Variável" ➔ "Operar".',
        'Busque pelo ticker copiado do Norte Invest.',
        'Preencha quantidade, preço de mercado e confirme a ordem com o token.'
      ],
      importadorB3: [
        'Acesse a área web no computador ➔ "Extratos e Relatórios" ➔ baixe as notas em formato padrão B3.'
      ]
    },
    dicaOuro: 'No BTG Pactual, as compras de FIIs e o mercado fracionário têm taxa zero, permitindo alocar seus aportes mensais de R$ 500 sem nenhum custo de corretagem.',
    promptNotebookLM: 'Crie um podcast objetivo destacando o perfil do BTG Pactual. Mostre por que investidores que buscam segurança institucional máxima e assessoria de ponta optam pelo BTG, explicando como comprar FIIs e Tesouro Selic sem taxa de custódia.'
  },
  {
    id: 'avenue',
    name: 'Avenue Securities (EUA)',
    slogan: 'Dolarização da carteira em Wall Street para brasileiros',
    platformType: 'global',
    reclameAqui: '8.3 / 10 (Excelente)',
    taxas: {
      acoes: 'Taxa Zero (até 10 ordens/mês no plano Premium) ou U$ 1 a U$ 2,50',
      fiis: '— (REITs nos EUA com taxa zero)',
      tesouro: '— (Treasuries nos EUA)',
      custodia: 'U$ 0,00'
    },
    destaque: 'Líder em abertura de contas americanas para brasileiros. Investimento fracionado em dólares a partir de U$ 5,00 e relatórios automáticos de Imposto de Renda em português.',
    passos: {
      abertura: [
        'Acesse avenue.us ou baixe o app Avenue.',
        'Abra a conta com CNH/RG e comprovante de residência brasileiro.',
        'A conta de investimento é sediada nos EUA e assegurada pelo SIPC em até U$ 500.000.'
      ],
      pix: [
        'Transfira em Reais via PIX para a sua conta Avenue.',
        'Na aba "Câmbio", converta Reais para Dólares na modalidade "Investimentos" (com IOF de apenas 0,38%).'
      ],
      reserva: [
        'A reserva de emergência para despesas no Brasil deve permanecer em Tesouro Selic no Brasil. Não envie sua reserva de emergência básica para os EUA!'
      ],
      acoesFiis: [
        'Vá na aba "Investir" ➔ busque o ETF global (ex: VOO, IVV para S&P 500) ou REITs (ex: O - Realty Income).',
        'Você pode comprar por valor monetário (ex: "quero aplicar U$ 50,00") ou por fração de cotas.',
        'Confirme a ordem a mercado durante o horário de Wall Street (11h30 às 18h00 horário de Brasília).'
      ],
      importadorB3: [
        'A Avenue disponibiliza relatórios mensais e o informe completo de rendimentos e bens para o IRPF na aba "Impostos".'
      ]
    },
    dicaOuro: 'Nos EUA não existe lote de 100 ações! Você pode comprar qualquer quantia fracionada (ex: 0,1 cotas de uma empresa de 500 dólares com apenas 50 dólares).',
    promptNotebookLM: 'Crie um áudio de 3 minutos guiando o investidor brasileiro sobre como abrir conta na Avenue, transferir via PIX, converter reais para dólares e comprar frações de empresas americanas. Expliquem a segurança da garantia do SIPC americano e como o informe de IRPF em português resolve todas as dúvidas fiscais.'
  }
];

export function TutorialCorretorasTab() {
  const [selectedCorretoraId, setSelectedCorretoraId] = useState<string>('nubank');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const selected = CORRETORAS.find((c) => c.id === selectedCorretoraId) || CORRETORAS[0]!;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(selected.promptNotebookLM);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Banner Oficial com Aviso de Eletividade */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-[#0c162c] via-[#102042] to-[#0c162c] p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">
                <Landmark className="h-3.5 w-3.5" />
                Módulo Prático Eletivo — Zero Impacto no Certificado
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              Como Comprar Ativos na sua Corretora & Desmistificando a B3
            </h2>
            <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
              Você <strong>não precisa estudar todas as corretoras</strong>. Escolha apenas a plataforma que você já utiliza (ou quer abrir) e siga o passo a passo prático para colocar seu aporte do Método DAVI na tela.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/15 text-sky-400">
            <Building2 className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Cartilha Universal da B3: Os 4 Pilares Inegociáveis */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-white sm:text-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            O que Todo Aluno Precisa Saber Sobre a B3
          </h3>
          <span className="text-xs font-medium text-slate-400">Regras Universais</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Custódia no seu CPF</h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Ações e FIIs ficam registrados no seu CPF na <strong>B3</strong>, e não no balanço da corretora. Se a corretora fechar, seus investimentos continuam 100% seguros e você só transfere a custódia.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
                <Coins className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">O Fracionário e o "F"</h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Para comprar de <strong>1 a 99 ações</strong> na B3, coloque a letra <strong>"F"</strong> no final do código (ex: <code className="text-gold-300 font-mono">ITUB4F</code>). FIIs não precisam de F: negociam de 1 em 1 cota!
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <Clock className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Horário de Pregão</h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Segunda a sexta, das <strong>10h00 às 17h00</strong>. Fora desse horário ou aos fins de semana, sua ordem fica <strong>agendada</strong> para ser executada no próximo dia útil na abertura.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Liquidação em D+1</h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Envie o dinheiro via PIX da sua conta (mesmo CPF). A B3 liquida o ativo financeiramente em <strong>1 dia útil (D+1)</strong> após a compra da ordem.
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Corretoras com Badges */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-white sm:text-lg">
            Selecione a sua Corretora para Ver o Passo a Passo:
          </h3>
          <p className="text-xs text-slate-400">
            Clique na instituição para carregar os detalhes operacionais específicos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {CORRETORAS.map((c) => {
            const isSelected = c.id === selectedCorretoraId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCorretoraId(c.id)}
                className={`flex flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-[#0d1527] hover:border-slate-700 hover:bg-[#111c34]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {c.platformType === 'app' && <Smartphone className="h-4 w-4 text-emerald-400" />}
                    {c.platformType === 'web_app' && <Laptop className="h-4 w-4 text-sky-400" />}
                    {c.platformType === 'global' && <Globe className="h-4 w-4 text-purple-400" />}
                    <span className="text-xs font-bold text-white line-clamp-1">{c.name.split(' ')[0]}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">{c.slogan}</p>
                </div>
                <div className="mt-3 w-full">
                  <span
                    className={`inline-block w-full rounded text-center py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      isSelected ? 'bg-emerald-500 text-obsidian-950 font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ Selecionada' : 'Ver Guia'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Detalhado da Corretora Selecionada */}
      <Card className="border-slate-800 bg-[#0c162c] p-6 space-y-6">
        {/* Cabeçalho da Corretora */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-extrabold text-white">{selected.name}</h3>
              <Badge tone="emerald" className="text-xs font-bold">
                Taxa Zero de Custódia
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-300">{selected.slogan} • Reclame Aqui: <strong className="text-white">{selected.reclameAqui}</strong></p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-obsidian-950 px-4 py-2 text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Corretagem Ações & FIIs</span>
            <span className="text-sm font-extrabold text-emerald-400">{selected.taxas.acoes.split(' ')[0]} {selected.taxas.acoes.split(' ')[1] || 'Zero'}</span>
          </div>
        </div>

        {/* Quadro Informativo */}
        <div className="rounded-xl border border-emerald-500/30 bg-[#081a14] p-4 text-xs text-emerald-200 leading-relaxed">
          <strong className="block mb-1 text-emerald-300 font-bold">Por que esta plataforma é recomendada na Norte Invest:</strong>
          {selected.destaque}
        </div>

        {/* 5 Etapas Práticas */}
        <div className="space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            Passo a Passo de Operação:
          </h4>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* 1. Abertura */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-sky-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-[11px]">1</span>
                Abertura de Conta & Documentos
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selected.passos.abertura.map((p, i) => (
                  <li key={i} className="leading-relaxed">{p}</li>
                ))}
              </ul>
            </div>

            {/* 2. PIX */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px]">2</span>
                Transferência via PIX
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selected.passos.pix.map((p, i) => (
                  <li key={i} className="leading-relaxed">{p}</li>
                ))}
              </ul>
            </div>

            {/* 3. Reserva */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-gold-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/20 text-[11px]">3</span>
                Comprando a Reserva (Tesouro Selic)
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selected.passos.reserva.map((p, i) => (
                  <li key={i} className="leading-relaxed">{p}</li>
                ))}
              </ul>
            </div>

            {/* 4. Ações e FIIs */}
            <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-purple-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[11px]">4</span>
                Comprando Ações e FIIs do Método DAVI
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selected.passos.acoesFiis.map((p, i) => (
                  <li key={i} className="leading-relaxed">{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. Importador B3 */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
              <span>5. Como Sincronizar com o Importador B3 da Norte Invest:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {selected.passos.importadorB3.map((p, i) => (
                <li key={i} className="leading-relaxed">{p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dica de Ouro */}
        <div className="flex items-start gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-xs text-gold-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-gold-400 mt-0.5" />
          <div>
            <strong className="block text-gold-300 font-bold mb-0.5">Dica de Ouro do Aluno:</strong>
            <p className="leading-relaxed">{selected.dicaOuro}</p>
          </div>
        </div>

        {/* Prompt para NotebookLM */}
        <div className="rounded-xl border border-slate-800 bg-obsidian-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Headphones className="h-4 w-4 text-sky-400" />
              <span>Prompt para Áudio / Podcast no Google NotebookLM:</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="text-xs border-sky-500/40 text-sky-300"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              {copiedPrompt ? 'Copiado!' : 'Copiar Prompt'}
            </Button>
          </div>
          <p className="text-xs text-slate-400 italic bg-[#080d1a] p-3 rounded-lg border border-slate-800/80 leading-relaxed">
            "{selected.promptNotebookLM}"
          </p>
        </div>
      </Card>

      {/* Checklist dos 5 Minutos do Home Broker */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          O Checklist dos 5 Minutos do Home Broker
        </h3>
        <p className="text-xs text-slate-300">
          Siga esta sequência mental todos os meses no dia do seu aporte para não perder tempo nem cometer erros operacionais:
        </p>

        <div className="grid gap-2.5 sm:grid-cols-5 text-xs">
          <div className="rounded-xl border border-slate-800/80 bg-[#111c34] p-3">
            <strong className="block text-emerald-400 font-bold mb-1">1º Minuto</strong>
            <p className="text-slate-200">Abra o Norte Invest em <strong>/onde-aportar</strong> e gere sua sugestão.</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#111c34] p-3">
            <strong className="block text-emerald-400 font-bold mb-1">2º Minuto</strong>
            <p className="text-slate-200">Clique em <strong>Copiar Ticker</strong> no ativo recomendado.</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#111c34] p-3">
            <strong className="block text-emerald-400 font-bold mb-1">3º Minuto</strong>
            <p className="text-slate-200">Abra a corretora, cole o código (coloque <strong>F</strong> se for ação &lt; 100).</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#111c34] p-3">
            <strong className="block text-emerald-400 font-bold mb-1">4º Minuto</strong>
            <p className="text-slate-200">Selecione ordem <strong>A Mercado</strong>, digite a senha e confirme.</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-[#111c34] p-3">
            <strong className="block text-emerald-400 font-bold mb-1">5º Minuto</strong>
            <p className="text-slate-200">Volte ao app e clique em <strong>Confirmar Hoje</strong>. Parabéns!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
