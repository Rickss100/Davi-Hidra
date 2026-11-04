import { formatBRL, formatPercent } from '@/lib/money';

export type AiUserIntent =
  | 'SETTINGS_ACCESSIBILITY'
  | 'WHERE_TO_INVEST'
  | 'OBJECTIVES_ALLOCATION'
  | 'RADAR_FILTERS'
  | 'EMERGENCY_RESERVE'
  | 'PASSIVE_INCOME_DIVIDENDS'
  | 'TRANSACTIONS_HISTORY'
  | 'PORTFOLIO_ANALYSIS'
  | 'METHODOLOGY_PHILOSOPHY'
  | 'TUTORIAL_COURSES'
  | 'ADMIN_PANEL'
  | 'GREETINGS'
  | 'GENERAL_HELP';

export interface PortfolioAiContext {
  userName: string;
  totalEquityBrl: number;
  totalInvestedBrl: number;
  totalProfitBrl: number;
  totalProfitPercent: number;
  last12MonthsIncomeBrl: number;
  yieldOnCostPercent: number;
  emergencyReserveCompletedPercent: number;
  emergencyReserveStatus: string;
  underweightCategoryName: string;
  underweightCategoryDistance: number;
  topHoldings: string;
  usdToBrl?: number;
  selicRate?: number;
}

/**
 * Normaliza o texto removendo acentos, pontuação e convertendo para minúsculas
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Classificador semântico de intenções em linguagem natural (PT-BR)
 */
export function detectAiIntent(rawMessage: string): AiUserIntent {
  const text = normalizeText(rawMessage);

  // 1. Configurações, Acessibilidade, Cores, Temas, Lupa, Zoom, 2FA, Senha
  if (
    /configura|engrenagem|acessibil|paleta|tema|modo claro|titanio|escuro|obsidian|alto contraste|daltonis|deuteranopia|protanopia|tritanopia|lupa|lente|zoom|tamanho (do )?texto|2fa|totp|autenticador|senha/.test(
      text
    )
  ) {
    return 'SETTINGS_ACCESSIBILITY';
  }

  // 2. Onde Aportar, Simulador de Aporte, Rebalanceamento, Motor RDM
  if (
    /onde aportar|simula(r|dor)( de)? aporte|quanto aportar|proximo aporte|motor rdm|rebalance(ar|amento)|distancia da meta|comprar agora|o que comprar|qual ativo comprar/.test(
      text
    )
  ) {
    return 'WHERE_TO_INVEST';
  }

  // 3. Definir Objetivos, Alocação, Porcentagens, Cascata, Metas
  if (
    /definir objetivo|aloca(c|c|ç)(a|a|ã)o|meta(s)? de|porcentagem|percentual|cascata|renda fixa vs variavel|brasil vs eua|brasil vs exterior|stocks vs reits|acoes vs fiis|pesos|definir meta/.test(
      text
    )
  ) {
    return 'OBJECTIVES_ALLOCATION';
  }

  // 4. Radar de Ativos, Filtros Fundamentalistas, Indicadores, Fundamentus, Status Invest
  if (
    /radar|filtro(s)?|filtrar|indicador(es)?|p\/l|pl\b|p\/vp|pvp\b|roe\b|roic\b|margem liquida|divida\/(pl|patrimonio)|divida liquida|fundamentus|status invest|novo mercado|criterio(s)? fundamentalista/.test(
      text
    )
  ) {
    return 'RADAR_FILTERS';
  }

  // 5. Reserva de Emergência, Tesouro Selic, Quantos Meses
  if (
    /reserva( de)? emerg(e|e|ê)ncia|quantos meses|meses de custo|tesouro selic|onde guardar reserva|liquidez diaria/.test(
      text
    )
  ) {
    return 'EMERGENCY_RESERVE';
  }

  // 6. Renda Passiva, Dividendos, Proventos, JCP, Yield on Cost
  if (
    /renda passiva|provento(s)?|dividendo(s)?|jcp|yield on cost|yoc\b|calendario de dividendos|bola de neve|viver de renda/.test(
      text
    )
  ) {
    return 'PASSIVE_INCOME_DIVIDENDS';
  }

  // 7. Histórico de Transações, Lançar Compras, Importar B3
  if (
    /historico|transa(c|c|ç)(a|a|ã)o(es)?|como cadastrar (compra|venda|ativo)|lancar (compra|ordem)|nova transacao|importar b3|planilha b3|nota de corretagem|preco medio/.test(
      text
    )
  ) {
    return 'TRANSACTIONS_HISTORY';
  }

  // 8. Análise da Carteira, Patrimônio, Desempenho, Rentabilidade
  if (
    /minha carteira|meu patrimonio|analise( da)? minha carteira|como esta minha carteira|resumo do patrimonio|meu saldo|quanto tenho investido|meu lucro|rentabilidade|desempenho da carteira/.test(
      text
    )
  ) {
    return 'PORTFOLIO_ANALYSIS';
  }

  // 9. Metodologia MANTFRAI, Michelangelo, Filosofia, Nassim Taleb, Setores BEST
  if (
    /metodo(logia)? mantfrai|o que e mantfrai|quem e michelangelo|michelangelo|antifragil|antifragilidade|taleb|setor(es)? best|estrategia barbell|barbell|filosofia do metodo/.test(
      text
    )
  ) {
    return 'METHODOLOGY_PHILOSOPHY';
  }

  // 10. Tutorial, Aulas, Módulos, Curso
  if (
    /tutorial|aula(s)?|modulo(s)?|onde estudar|assistir aula|curso|conteudo das aulas|30 aulas/.test(
      text
    )
  ) {
    return 'TUTORIAL_COURSES';
  }

  // 11. Painel Admin, Gestão de Usuários
  if (/admin|administra(c|c|ç)(a|a|ã)o|painel admin|gestao de usuario/.test(text)) {
    return 'ADMIN_PANEL';
  }

  // 12. Saudações e Apresentação
  if (
    /^(oi|ola|ola!|olá|bom dia|boa tarde|boa noite|opa|e ai|e ai\?|quem e voce|quem e voce\?|como voce funciona|o que voce faz|ajuda|help)$/.test(
      text
    ) ||
    /^(oi|ola|olá|bom dia|boa tarde|boa noite)\b/.test(text)
  ) {
    return 'GREETINGS';
  }

  return 'GENERAL_HELP';
}

/**
 * Gera resposta determinística inteligente e especializada por intenção
 */
export function generateLocalAiResponse(
  rawMessage: string,
  context: PortfolioAiContext
): string {
  const intent = detectAiIntent(rawMessage);

  switch (intent) {
    case 'SETTINGS_ACCESSIBILITY':
      return [
        'A aba de **Configurações & Acessibilidade** pode ser acessada de duas maneiras:',
        '',
        '1. **Pelo ícone de Engrenagem (⚙️)**: localizado no canto superior direito do cabeçalho de qualquer página;',
        '2. **Pelo Menu Lateral**: no rodapé da barra lateral esquerda, clicando no botão **Acessibilidade & Cores** (com selo WCAG).',
        '',
        'Nessa central você pode:',
        '• **Alternar entre 6 Temas Visuais**: Dark Obsidian (padrão sóbrio), Alto Contraste AAA (preto puro com amarelo neon), Titânio Suave (modo claro moderno com fundo pérola) e 3 perfis de daltonismo (Deuteranopia, Protanopia e Tritanopia);',
        '• **Ajustar Tamanho de Fonte & Zoom**: redimensionar fontes e aplicar zoom de interface de 100% até 150%;',
        '• **Ativar a Lupa no Mouse**: lente óptica flutuante de 1.5x para ampliação cirúrgica de valores e cotações;',
        '• **Gerenciar Segurança**: ativar e resetar seu 2FA TOTP por QR Code e alterar sua senha de acesso.'
      ].join('\n');

    case 'WHERE_TO_INVEST': {
      const underweight = context.underweightCategoryName || 'Renda Fixa';
      const distance = formatPercent(context.underweightCategoryDistance || 0);

      return [
        'O simulador **Onde Aportar** fica no menu lateral esquerdo sob a rota `/onde-aportar`.',
        '',
        '**Como funciona o Motor RDM (Aporte no Mais Distante do Objetivo):**',
        '• Você nunca precisa vender ativos ou girar patrimônio para rebalancear a carteira (evitando impostos e taxas);',
        '• Ao digitar o valor do seu aporte mensal (ex: R$ 1.000,00), o algoritmo calcula automaticamente qual classe e quais ativos estão com maior déficit em relação à sua meta.',
        '',
        `💡 **Situação Atual da sua Carteira (${context.userName}):**`,
        `A classe atualmente mais descontada e prioritária para novos aportes é **${underweight}**, com distância de **${distance}** em relação à meta. Acesse o menu Onde Aportar para simular o valor exato a comprar.`
      ].join('\n');
    }

    case 'OBJECTIVES_ALLOCATION':
      return [
        'A aba **Definir Objetivos** fica no menu lateral esquerdo na rota `/definir-objetivos`.',
        '',
        '**Estrutura de Alocação em Cascata da Metodologia MANTFRAI:**',
        '• **1º Nível**: Renda Fixa (%) vs Renda Variável (%) = soma 100%;',
        '• **2º Nível**: Dentro da Renda Variável, Brasil (%) vs Exterior EUA (%) = soma 100%;',
        '• **3º Nível (Brasil)**: Ações (%) vs Fundos Imobiliários FIIs (%) = soma 100%;',
        '• **4º Nível (Exterior)**: Stocks (%) vs REITs (%) = soma 100%.',
        '',
        'O sistema calcula os pesos finais na carteira total automaticamente. Você também pode escolher seus ativos favoritos no **Radar de Ativos** para compor cada grupo.'
      ].join('\n');

    case 'RADAR_FILTERS':
      return [
        'O **Radar de Ativos** fica no menu lateral esquerdo na rota `/radar`.',
        '',
        '**Principais Indicadores Fundamentalistas do Filtro MFS:**',
        '• **P/L (Preço sobre Lucro)**: quanto menor, mais barato você paga pelos lucros anuais da empresa;',
        '• **P/VP (Preço sobre Valor Patrimonial)**: mede o preço da ação em relação ao patrimônio líquido contábil;',
        '• **ROE & ROIC**: medem a rentabilidade e a eficiência da gestão em multiplicar o capital investido;',
        '• **Dívida Líquida / PL**: avalia a alavancagem financeira (empresas seguras mantêm dívida sob controle);',
        '• **Governança Novo Mercado (NM)**: proteção máxima com 100% de Tag Along e ações exclusivamente ON.',
        '',
        '🔗 **Bases Oficiais Conectadas:** ao clicar em qualquer ticker na tabela, você é direcionado diretamente para a análise fundamentalista no **Fundamentus** (para Ações) ou **Status Invest** (para FIIs e REITs).'
      ].join('\n');

    case 'EMERGENCY_RESERVE': {
      const completion = formatPercent(context.emergencyReserveCompletedPercent);
      return [
        'O painel da **Reserva de Emergência** fica no menu lateral em `/reserva-emergencia`.',
        '',
        '**Pilares da Reserva no Método Antifrágil:**',
        '• **Tamanho Ideal**: de 6 a 12 meses do seu custo de vida mensal;',
        '• **Onde Alocar**: Renda Fixa Soberana pós-fixada (Tesouro Selic) ou CDBs com liquidez diária (D+0) de bancos de primeira linha;',
        '• **Objetivo Antifrágil**: atua como a ponta hiperconservadora do Barbell de Nassim Taleb, blindando você emocionalmente contra a necessidade de vender ações no fundo durante crises de mercado.',
        '',
        `📊 **Status da sua Reserva (${context.userName}):** sua reserva encontra-se **${completion}** concluída (Status: **${context.emergencyReserveStatus}**).`
      ].join('\n');
    }

    case 'PASSIVE_INCOME_DIVIDENDS': {
      const income12m = formatBRL(context.last12MonthsIncomeBrl);
      const yoc = formatPercent(context.yieldOnCostPercent);

      return [
        'A aba de **Renda Passiva** fica no menu lateral em `/renda-passiva`.',
        '',
        '**Conceitos e Acompanhamento de Proventos:**',
        '• **Yield on Cost (YoC)**: mede o dividendo recebido dividido pelo preço médio que você realmente pagou pelas cotas (aumenta exponencialmente ao longo dos anos com empresas de dividendos crescentes);',
        '• **Calendário e Heatmap**: exibe a distribuição mensal de dividendos e JCP por ativo;',
        '• **Efeito Bola de Neve**: reinvestir 100% dos proventos recebidos nos ativos mais descontados apontados pelo simulador Onde Aportar acelera os juros compostos.',
        '',
        `💰 **Seus Indicadores:** nos últimos 12 meses você recebeu **${income12m}** em proventos, com um Yield on Cost de **${yoc}**.`
      ].join('\n');
    }

    case 'TRANSACTIONS_HISTORY':
      return [
        'O gerenciamento de transações fica na aba **Histórico** (`/historico`).',
        '',
        '**Como Lançar Suas Operações:**',
        '1. **Lançamento Manual**: clique no botão **Nova Transação** no canto superior da tela `/historico`, selecione o ativo (ticker), data, quantidade comprada e preço unitário;',
        '2. **Importador B3 Automatizado**: você pode arrastar sua planilha de negociação oficial da Área do Investidor B3 (formato Excel `.xlsx`), que o sistema cadastra todas as compras e atualiza seu preço médio e quantidades sob custódia instantaneamente.'
      ].join('\n');

    case 'PORTFOLIO_ANALYSIS': {
      const equity = formatBRL(context.totalEquityBrl);
      const invested = formatBRL(context.totalInvestedBrl);
      const profit = formatBRL(context.totalProfitBrl);
      const profitPct = formatPercent(context.totalProfitPercent);
      const income12m = formatBRL(context.last12MonthsIncomeBrl);
      const yoc = formatPercent(context.yieldOnCostPercent);
      const underweight = context.underweightCategoryName || 'Renda Fixa';
      const distance = formatPercent(context.underweightCategoryDistance || 0);

      return [
        `📊 **Diagnóstico Consolidado da Carteira de ${context.userName}:**`,
        '',
        `• **Patrimônio Total**: ${equity}`,
        `• **Capital Investido**: ${invested}`,
        `• **Resultado Acumulado**: ${profit} (${profitPct})`,
        `• **Renda Passiva (12M)**: ${income12m} (Yield on Cost de ${yoc})`,
        `• **Reserva de Emergência**: ${formatPercent(context.emergencyReserveCompletedPercent)} concluída (${context.emergencyReserveStatus})`,
        `• **Maiores Ativos**: ${context.topHoldings || 'Nenhum ativo cadastrado'}`,
        '',
        `💡 **Direcionamento Estratégico:** a classe mais distante da sua meta atualmente é **${underweight}** (distância de **${distance}**). Utilize o menu **Onde Aportar** para balancear sem pagar taxas.`
      ].join('\n');
    }

    case 'METHODOLOGY_PHILOSOPHY':
      return [
        'A **Metodologia MANTFRAI (Método Antifrágil de Investimento)** baseia-se em 3 pilares fundamentais:',
        '',
        '1. **A Filosofia de Michelangelo (Via Negativa)**: Michelangelo dizia que a estátua de Davi já estava dentro do bloco de mármore; ele apenas retirou tudo o que não era Davi. No mercado, você enriquece não adivinhando o futuro, mas eliminando o que não presta: empresas endividadas, promessas especulativas, opções binárias e taxas de administração predatórias.',
        '2. **Estratégia Barbell de Nassim Taleb**: alocação bipolar antifrágil. De um lado, uma ponta hipersegura com liquidez imediata (Tesouro Selic para a Reserva de Emergência); do outro, empresas perenes de alta lucratividade (Setores BEST: Bancos, Energia, Saneamento, Seguros e Telecomunicações) e monopólios globais nos EUA.',
        '3. **Motor RDM (Rebalanceamento por Aporte)**: o tempo e os dividendos trabalham para você. Você aporta todo mês exclusivamente no ativo mais descontado da sua meta, comprando sempre na baixa e colhendo renda passiva crescente.'
      ].join('\n');

    case 'TUTORIAL_COURSES':
      return [
        'As **30 Aulas da Metodologia MANTFRAI** estão disponíveis no menu lateral em **Tutorial & Método** (`/tutorial`).',
        '',
        'Elas estão estruturadas em 6 módulos progressivos:',
        '• **Módulo 1**: Mentalidade Antifrágil & Filosofia de Michelangelo;',
        '• **Módulo 2**: Blindagem Financeira & Reserva de Emergência;',
        '• **Módulo 3**: Filtro MFS & Seleção de Empresas Perenes (Setores BEST);',
        '• **Módulo 4**: Fundos Imobiliários (FIIs) & Renda Imobiliária Mensal;',
        '• **Módulo 5**: Diversificação Global (Stocks & REITs nos EUA);',
        '• **Módulo 6**: Rotina Mensal de Aportes & Viver de Renda.',
        '',
        'Cada aula possui exemplos práticos, checklists de validação e guias passo a passo integrados ao aplicativo.'
      ].join('\n');

    case 'ADMIN_PANEL':
      return [
        'O **Painel Admin** fica acessível no menu lateral esquerdo na rota `/admin` para usuários com permissão administrativa.',
        '',
        'Funcionalidades do Painel Admin:',
        '• Gestão e listagem de usuários cadastrados;',
        '• Controle de planos de assinatura e limites de carteira;',
        '• Redefinição e auditoria de 2FA TOTP;',
        '• Visualização de logs de auditoria e conformidade regulatória CVM.'
      ].join('\n');

    case 'GREETINGS':
      return [
        `Olá, **${context.userName}**! Sou a **MANTFRAI AI**, sua assistente e estrategista inteligente no Método Antifrágil de Investimento.`,
        '',
        'Posso ajudar você em diversas áreas do aplicativo:',
        '• ⚙️ **Interface & Ajustes**: "Onde fica a aba de configuração?" ou "Como mudar para modo claro?"',
        '• 🧭 **Estratégia de Aportes**: "Como funciona o Onde Aportar?" ou "Onde devo aportar hoje?"',
        '• 📊 **Diagnóstico**: "Como está minha carteira?" ou "Qual meu Yield on Cost?"',
        '• 🛡️ **Metodologia**: "O que são setores BEST?" ou "Qual a regra da Reserva de Emergência?"',
        '• 🔍 **Seleção de Ativos**: "Como usar os filtros do Radar?"',
        '',
        'Como posso orientar sua jornada de independência financeira hoje?'
      ].join('\n');

    case 'GENERAL_HELP':
    default:
      return [
        `Olá, **${context.userName}**! Entendi sua pergunta sobre: *"${rawMessage.slice(0, 80)}"*.`,
        '',
        'Para navegar com máxima facilidade pelo sistema:',
        '• **Ajustes & Acessibilidade**: clique na engrenagem (⚙️) no canto superior direito ou no rodapé do menu lateral para trocar temas de cores, ajustar fontes e ativar a lupa.',
        '• **Simular Aportes**: acesse o menu **Onde Aportar** (`/onde-aportar`) para ver onde investir seus recursos com precisão.',
        '• **Filtrar Ações & FIIs**: acesse o **Radar de Ativos** (`/radar`) para analisar empresas com links para Fundamentus e Status Invest.',
        '• **Aulas do Método**: acesse **Tutorial & Método** (`/tutorial`) para revisar as 30 aulas da metodologia.',
        '',
        'Se quiser detalhes específicos, pode me perguntar diretamente (ex: *"Como alterar minha senha?"*, *"Como funciona o Motor RDM?"* ou *"Analise meu patrimônio"*).'
      ].join('\n');
  }
}

/**
 * Constrói o System Prompt executivo para envio ao Google Gemini
 */
export function buildGeminiPrompt(
  rawMessage: string,
  context: PortfolioAiContext
): string {
  const equity = formatBRL(context.totalEquityBrl);
  const invested = formatBRL(context.totalInvestedBrl);
  const profit = formatBRL(context.totalProfitBrl);
  const profitPct = formatPercent(context.totalProfitPercent);
  const income12m = formatBRL(context.last12MonthsIncomeBrl);
  const yoc = formatPercent(context.yieldOnCostPercent);
  const underweight = context.underweightCategoryName || 'Renda Fixa';
  const distance = formatPercent(context.underweightCategoryDistance || 0);

  return `Você é a MANTFRAI AI, assistente e estrategista inteligente da plataforma MANTFRAI (Método Antifrágil de Investimento).
Sua missão é responder à dúvida do usuário de forma acolhedora, precisa, executiva e contextualizada em Português Brasileiro (PT-BR).

REGRAS CRÍTICAS DE COMPORTAMENTO:
1. Responda DIRETAMENTE à pergunta do usuário. Nunca devolva um resumo financeiro padronizado se a pergunta for sobre configurações, navegação, dúvidas conceituais, filtros ou tutoriais.
2. Se o usuário perguntar sobre configurações, cores, temas, 2FA, senha ou lupa, explique que o acesso fica no ícone de engrenagem (⚙️) no topo direito ou no rodapé da barra lateral esquerda em "Acessibilidade & Cores", "Segurança 2FA" ou "Alterar Minha Senha".
3. Se perguntar sobre "Onde Aportar", explique o algoritmo Motor RDM na tela /onde-aportar e sugira a classe prioritária da carteira dele (${underweight}, distância ${distance}).
4. Se perguntar sobre o "Radar de Ativos", explique a tela /radar e os indicadores fundamentalistas (P/L, P/VP, ROE, etc.) com links externos para Fundamentus e Status Invest.
5. Se perguntar sobre sua carteira ou patrimônio, utilize os dados reais abaixo.
6. Use markdown limpo (negrito, tópicos com marcadores •), parágrafos bem espaçados e mantenha a resposta entre 2 e 4 parágrafos objetivos.

DADOS REAIS DO INVESTIDOR AUTENTICADO:
- Nome: ${context.userName}
- Patrimônio Total: ${equity}
- Valor Investido: ${invested}
- Lucro Acumulado: ${profit} (${profitPct})
- Renda Passiva 12 Meses: ${income12m} (Yield on Cost: ${yoc})
- Reserva de Emergência: ${formatPercent(context.emergencyReserveCompletedPercent)} (${context.emergencyReserveStatus})
- Classe mais descontada em relação à meta: ${underweight} (déficit de ${distance})
- Maiores Ativos em Custódia: ${context.topHoldings || 'Nenhum ativo'}

PERGUNTA DO INVESTIDOR:
"${rawMessage}"`;
}
