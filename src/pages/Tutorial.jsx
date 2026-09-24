import { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  PiggyBank, 
  Briefcase, 
  Search, 
  History, 
  BarChart3, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Headphones
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Tutorial.css';

const FULL_MANUAL_TEXT = `# DAVI & HYDRA — O GUIA DEFINITIVO DO INVESTIDOR INTELIGENTE
## Metodologia de Investimentos, Filosofia Patrimonial e Manual Oficial do Aplicativo

### PARTE 1: A FILOSOFIA & O MÉTODO DE INVESTIMENTO

1. O que é o Método DAVI?
- D — Defesa: Antes de rentabilidade, proteção com Reserva de Emergência dimensionada.
- A — Alocação de Ativos: Mais de 90% dos retornos de longo prazo vêm da proporção entre classes (Ações, FIIs, Renda Fixa e Mercado Global).
- V — Valor & Fundamentos: Tornar-se sócio de negócios com lucros consistentes, boa governança e dividendos reais.
- I — Independência Financeira: Viver de renda passiva crescente que cubra com folga o custo de vida.

2. O Algoritmo HYDRA e a Regra AM2O:
- AM2O significa "Aporte no Mais Distante do Objetivo".
- Em vez de adivinhar o mercado, você aporta naquilo que ficou para trás, comprando automaticamente na baixa e reequilibrando a carteira sem precisar vender nada.

3. Pirâmide Patrimonial:
- Reserva de Emergência (3 a 12 meses de custo de vida em liquidez diária)
- Renda Fixa Estratégica (Proteção da inflação via IPCA+)
- Ações & FIIs no Brasil (Crescimento de patrimônio e renda mensal isenta)
- Stocks & REITs Globais (Dolarização e proteção geográfica)

4. A Bola de Neve dos Proventos:
- Reinvestir 100% dos dividendos no início para atingir o "Ponto Mágico", onde os dividendos passam a comprar novas cotas sozinhos.

### PARTE 2: MANUAL PRÁTICO DO APLICATIVO

1. Minha Carteira (/carteira): Registro de aportes e acompanhamento por classe.
2. Definir Objetivos (/definir-objetivos): Calibração de percentuais macro e alvos por ativo.
3. Onde Aportar (/onde-aportar): Motor matemático que indica onde investir o dinheiro do mês.
4. Reserva de Emergência (/reserva-emergencia): Assistente de perfil (CLT, Autônomo, Servidor).
5. Renda Passiva (/renda-passiva): Acompanhamento de proventos e simulador de futuro.
6. Radar de Ativos (/radar): Busca e filtros fundamentalistas (P/L, DY, P/VP).
7. Histórico (/historico): Auditoria e controle de todas as compras e vendas.
8. Resumo (/resumo): Rentabilidade consolidada contra S&P 500, Ibovespa, CDI, IPCA e IFIX.`;

const Tutorial = () => {
  const [activeTab, setActiveTab] = useState('metodo');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const { success } = useToast();

  const handleCopyManual = () => {
    navigator.clipboard.writeText(FULL_MANUAL_TEXT);
    setCopied(true);
    success('Manual completo copiado para a área de transferência! Pronto para colar no NotebookLM.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadManual = () => {
    const element = document.createElement('a');
    const file = new Blob([FULL_MANUAL_TEXT], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'MANUAL_DAVI_HYDRA.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    success('Download do arquivo MANUAL_DAVI_HYDRA.md concluído!');
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Preciso de muito dinheiro para começar a investir com o DAVI & HYDRA?',
      a: 'Não! Você pode começar com quantias a partir de R$ 30 a R$ 100. Títulos do Tesouro Direto e cotas de Fundos Imobiliários e Ações fracionárias permitem construir patrimônio com qualquer orçamento mensal.'
    },
    {
      q: 'Com que frequência devo realizar aportes no aplicativo?',
      a: 'A recomendação de ouro é aportar mensalmente, logo após receber sua renda. Alimente a tela "Onde Aportar" com o valor poupado do mês e siga a indicação matemática da Hydra para manter a carteira equilibrada.'
    },
    {
      q: 'O que fazer quando uma ação ou FII da minha carteira cair de preço?',
      a: 'Se os fundamentos da empresa ou fundo continuarem sólidos (lucros consistentes, boa gestão e baixo endividamento), a queda de preço é uma oportunidade de desconto. O algoritmo AM2O indicará o aporte nessa classe para rebaixar seu preço médio com inteligência.'
    },
    {
      q: 'Como o método protege meus investimentos contra crises e inflação?',
      a: 'Através da diversificação em 4 frentes: Reserva de Emergência para liquidez imediata, Renda Fixa IPCA+ contra inflação, Ações e FIIs que repassam preços nos lucros e aluguéis, e ativos internacionais dolarizados (Stocks e REITs) contra o risco-país.'
    },
    {
      q: 'Meus dados e histórico ficam salvos se eu fechar o navegador?',
      a: 'Sim! Toda a aplicação está integrada ao Turso Cloud (banco de dados em nuvem permanente). Todos os seus cadastros, metas e histórico de compras estão salvos de forma definitiva.'
    }
  ];

  return (
    <div className="tutorial-page">
      {/* Header */}
      <div className="tutorial-header">
        <div className="tutorial-title-area">
          <div className="tutorial-icon-badge">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1>Central de Aprendizado & Tutorial</h1>
            <p>Aprenda primeiro a metodologia do Investidor Inteligente e, em seguida, domine cada recurso do aplicativo.</p>
          </div>
        </div>

        <div className="tutorial-header-actions">
          <button className="btn-tutorial-action secondary" onClick={handleDownloadManual} title="Baixar arquivo Markdown do manual">
            <Download size={16} />
            <span>Baixar Manual (.md)</span>
          </button>
          <button className="btn-tutorial-action primary" onClick={handleCopyManual} title="Copiar texto completo para o Google NotebookLM">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copiado!' : 'Copiar para NotebookLM'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tutorial-tabs">
        <button 
          className={`tutorial-tab-btn ${activeTab === 'metodo' ? 'active' : ''}`}
          onClick={() => setActiveTab('metodo')}
        >
          <BookOpen size={18} />
          <span>1. O Método & Filosofia</span>
        </button>

        <button 
          className={`tutorial-tab-btn ${activeTab === 'app' ? 'active' : ''}`}
          onClick={() => setActiveTab('app')}
        >
          <Layers size={18} />
          <span>2. Manual do Aplicativo</span>
        </button>

        <button 
          className={`tutorial-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <HelpCircle size={18} />
          <span>3. Perguntas Frequentes (FAQ)</span>
        </button>

        <button 
          className={`tutorial-tab-btn ${activeTab === 'notebooklm' ? 'active' : ''}`}
          onClick={() => setActiveTab('notebooklm')}
        >
          <Headphones size={18} />
          <span>4. Gerar Podcast (NotebookLM)</span>
        </button>
      </div>

      {/* TAB 1: METODOLOGIA */}
      {activeTab === 'metodo' && (
        <div className="tutorial-tab-content">
          <div className="tutorial-banner">
            <div className="banner-text">
              <h2>A Tríade da Riqueza Duradoura: Disciplina, Método e Tempo</h2>
              <p>
                O DAVI & HYDRA não é uma ferramenta de apostas ou especulação. É um sistema desenhado para eliminar a emoção humana e transformar poupança mensal regular em um fluxo crescente de liberdade financeira.
              </p>
            </div>
            <Sparkles size={48} color="#10b981" />
          </div>

          <div className="tutorial-grid">
            <div className="tutorial-card">
              <span className="card-badge green">Pilar D</span>
              <h3><ShieldCheck size={20} color="#10b981" /> Defesa Patrimonial</h3>
              <p>
                Nenhum castelo resiste sem fundações sólidas. Antes de almejar grandes rentabilidades em ações, o investidor inteligente constrói sua <strong>Reserva de Emergência</strong> em ativos de liquidez diária.
              </p>
              <div className="tutorial-highlight-box">
                Garante que imprevistos de saúde ou trabalho nunca forcem você a vender ativos com prejuízo na baixa.
              </div>
            </div>

            <div className="tutorial-card">
              <span className="card-badge blue">Pilar A</span>
              <h3><PieChart size={20} color="#38bdf8" /> Alocação Estratégica</h3>
              <p>
                Estudos comprovam que mais de 90% do retorno de uma carteira depende da proporção entre classes de ativos (Ações, FIIs, Renda Fixa e Exterior), e não da tentativa de acertar a próxima ação da moda.
              </p>
              <div className="tutorial-highlight-box">
                Você define suas porcentagens ideais e deixa o sistema controlar o rebalanceamento automático.
              </div>
            </div>

            <div className="tutorial-card">
              <span className="card-badge purple">Pilar V</span>
              <h3><TrendingUp size={20} color="#c084fc" /> Valor & Fundamentos</h3>
              <p>
                Compramos frações de empresas e imóveis reais. Focamos em companhias lucrativas, com histórico de pagamento de dividendos e governança impecável.
              </p>
              <div className="tutorial-highlight-box">
                Preço é o que você paga; Valor é o que você recebe. Seja sócio de bons negócios no longo prazo.
              </div>
            </div>

            <div className="tutorial-card">
              <span className="card-badge amber">Pilar I</span>
              <h3><DollarSign size={20} color="#fbbf24" /> Independência Financeira</h3>
              <p>
                O destino final é atingir o <em>Ponto Mágico</em>: o momento em que os proventos mensais dos seus Fundos Imobiliários e Ações pagam todas as suas contas, tornando o trabalho uma opção, e não uma obrigação.
              </p>
              <div className="tutorial-highlight-box">
                Cada cota comprada é um funcionário trabalhando 24 horas por dia para gerar renda passiva para você.
              </div>
            </div>
          </div>

          <div className="tutorial-card" style={{ marginBottom: '30px' }}>
            <span className="card-badge green">O Algoritmo Hydra</span>
            <h3 style={{ fontSize: '20px' }}>A Metodologia AM2O: Por que nunca tentamos adivinhar o mercado?</h3>
            <p style={{ fontSize: '15px' }}>
              <strong>AM2O</strong> significa <em>"Aporte no Mais Distante do Objetivo"</em>. A cada mês, o mercado estará em uma fase diferente: às vezes ações brasileiras caem, enquanto o dólar sobe; em outros momentos, os fundos imobiliários ficam baratos enquanto a renda fixa recua.
            </p>
            <p style={{ fontSize: '15px' }}>
              Em vez de tentar prever o futuro (o que ninguém consegue com consistência), você abre o aplicativo, informa o valor disponível para investir e a Hydra aponta matematicamente para o ativo que mais se distanciou da sua meta ideal.
            </p>
            <div className="tutorial-highlight-box" style={{ fontSize: '14px', lineHeight: '1.7' }}>
              🎯 <strong>Resultado Prático:</strong> Você sempre comprará na baixa com desconto, evitará comprar no topo da euforia e nunca precisará vender ativos para rebalancear, economizando impostos e taxas de corretagem!
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL DO APLICATIVO */}
      {activeTab === 'app' && (
        <div className="tutorial-tab-content">
          <div className="tutorial-banner">
            <div className="banner-text">
              <h2>Guia Passo a Passo: Dominando as Telas do DAVI & HYDRA</h2>
              <p>
                Veja abaixo exatamente como utilizar cada funcionalidade do sistema no seu dia a dia de investidor.
              </p>
            </div>
            <Layers size={48} color="#38bdf8" />
          </div>

          <div className="tutorial-grid">
            <div className="tutorial-card">
              <h3><Briefcase size={20} color="#10b981" /> 1. Carteira (`/carteira`)</h3>
              <p>
                O centro de controle onde você cadastra suas movimentações. Use o formulário superior para registrar compras e vendas informando a categoria, o ticker (código), quantidade e preço.
              </p>
              <div className="tutorial-highlight-box">
                Dica: O campo de ativo possui autocompletar com mais de 1.500 ativos pré-carregados (B3 e Globais).
              </div>
            </div>

            <div className="tutorial-card">
              <h3><TrendingUp size={20} color="#38bdf8" /> 2. Onde Aportar (`/onde-aportar`)</h3>
              <p>
                No dia do seu aporte mensal, entre nesta tela e digite o valor que deseja investir. A Hydra cruza sua carteira atual com seus objetivos e entrega a recomendação exata de compras para o mês.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Você pode escolher em quantos ativos dividir seu aporte (ex: focar em 1, 2 ou 3 compras).
              </div>
            </div>

            <div className="tutorial-card">
              <h3><PieChart size={20} color="#c084fc" /> 3. Definir Objetivos (`/definir-objetivos`)</h3>
              <p>
                Aqui você ensina ao sistema suas metas ideais. Defina o percentual macro (ex: 40% Ações, 30% FIIs, 15% Stocks, 15% Renda Fixa) e utilize o <strong>Assistente Guiado</strong> para calibrar pesos por ativo.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Clique no botão verde superior para abrir o assistente passo a passo a qualquer momento.
              </div>
            </div>

            <div className="tutorial-card">
              <h3><PiggyBank size={20} color="#fbbf24" /> 4. Reserva de Emergência (`/reserva-emergencia`)</h3>
              <p>
                Calculadora interativa baseada no seu custo de vida mensal e na sua profissão (Servidor: 6 meses; CLT: 8 meses; Autônomo: 12 meses). Acompanhe o percentual já concluído com títulos de liquidez diária.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Cadastre títulos como TESOURO_SELIC_2029 ou CDB_LIQ_DIARIA na sua Carteira para alimentar a barra.
              </div>
            </div>

            <div className="tutorial-card">
              <h3><DollarSign size={20} color="#10b981" /> 5. Renda Passiva (`/renda-passiva`)</h3>
              <p>
                Monitore sua renda média mensal, seu Dividend Yield e acompanhe a evolução dos proventos recebidos. Utilize o <strong>Simulador de Futuro</strong> para projetar seu patrimônio daqui a 5, 10 ou 20 anos.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Veja o poder dos juros compostos simulando o reinvestimento integral dos seus dividendos.
              </div>
            </div>

            <div className="tutorial-card">
              <h3><Search size={20} color="#38bdf8" /> 6. Radar de Ativos (`/radar`)</h3>
              <p>
                Uma central fundamentalista com centenas de ativos. Filtre por múltiplos de valorização e saúde financeira como <strong>P/L</strong>, <strong>Dividend Yield (DY)</strong> e <strong>P/VP</strong> para selecionar novos ativos.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Use a busca rápida para encontrar qualquer empresa ou fundo imobiliário em segundos.
              </div>
            </div>

            <div className="tutorial-card">
              <h3><History size={20} color="#c084fc" /> 7. Histórico de Transações (`/historico`)</h3>
              <p>
                O livro contábil da sua carteira. Acompanhe a lista cronológica de todas as suas compras e vendas, visualize totais investidos e filtre por ticker com facilidade.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Errou uma digitação? Basta clicar no ícone de lixeira para excluir a ordem e recalcular a carteira.
              </div>
            </div>

            <div className="tutorial-card">
              <h3><BarChart3 size={20} color="#fbbf24" /> 8. Resumo da Carteira (`/resumo`)</h3>
              <p>
                A visão executiva de desempenho. Veja seu patrimônio total, lucro histórico e o gráfico interativo de rentabilidade contra os maiores benchmarks: <strong>S&P 500</strong>, <strong>Ibovespa</strong>, <strong>CDI/Selic</strong>, <strong>IPCA</strong> e <strong>IFIX</strong>.
              </p>
              <div className="tutorial-highlight-box">
                Dica: Compare a evolução do seu patrimônio contra a inflação para ter certeza do aumento do seu poder de compra.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FAQ */}
      {activeTab === 'faq' && (
        <div className="tutorial-tab-content">
          <div className="tutorial-banner">
            <div className="banner-text">
              <h2>Perguntas Frequentes (FAQ do Investidor)</h2>
              <p>
                Respostas diretas e esclarecedoras para as dúvidas mais comuns de quem está trilhando o caminho da liberdade financeira.
              </p>
            </div>
            <HelpCircle size={48} color="#fbbf24" />
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="faq-item"
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  {openFaq === index ? <ChevronUp size={18} color="#10b981" /> : <ChevronDown size={18} color="#94a3b8" />}
                </div>
                {openFaq === index && (
                  <div className="faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTEBOOK LM */}
      {activeTab === 'notebooklm' && (
        <div className="tutorial-tab-content">
          <div className="tutorial-banner">
            <div className="banner-text">
              <h2>Transforme este Manual em um Podcast e Assistente de Áudio com o NotebookLM</h2>
              <p>
                O Google NotebookLM é uma inteligência artificial gratuita capaz de ler nosso manual e transformá-lo em uma conversa de rádio/podcast empolgante em áudio hiper-realista.
              </p>
            </div>
            <Headphones size={48} color="#10b981" />
          </div>

          <div className="tutorial-grid">
            <div className="tutorial-card">
              <span className="card-badge green">Passo 1</span>
              <h3>Copie o Manual Oficial</h3>
              <p>
                Clique no botão superior verde <strong>"Copiar para NotebookLM"</strong> ou baixe o arquivo <code>MANUAL_DAVI_HYDRA.md</code> clicando em <strong>"Baixar Manual"</strong>.
              </p>
            </div>

            <div className="tutorial-card">
              <span className="card-badge blue">Passo 2</span>
              <h3>Abra o Google NotebookLM</h3>
              <p>
                Acesse <a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>notebooklm.google.com</a> com sua conta Google e crie um novo caderno chamado <strong>DAVI & HYDRA</strong>.
              </p>
            </div>

            <div className="tutorial-card">
              <span className="card-badge purple">Passo 3</span>
              <h3>Cole o Texto como Fonte</h3>
              <p>
                Adicione uma nova Fonte (Source), escolha <em>"Copied text"</em> (Texto colado) e cole o manual copiado aqui, ou faça o upload direto do arquivo <code>.md</code>.
              </p>
            </div>

            <div className="tutorial-card">
              <span className="card-badge amber">Passo 4</span>
              <h3>Gere o Podcast em Áudio</h3>
              <p>
                No menu lateral do NotebookLM, clique no botão <strong>"Generate"</strong> em <em>Audio Overview</em>. Em poucos minutos, você terá um podcast completo para ouvir e compartilhar!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutorial;
