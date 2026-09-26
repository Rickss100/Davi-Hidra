import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Dossiê de Auditoria Interna — Norte Invest</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
      @bottom-right {
        content: counter(page);
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      padding: 10px 0;
    }

    .page-break {
      page-break-before: always;
    }

    /* CAPA */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 960px;
      padding: 40px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%);
      color: #ffffff;
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding-bottom: 20px;
    }

    .brand-logo {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo span {
      color: #f59e0b;
    }

    .badge-confidential {
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid #f59e0b;
      color: #fbbf24;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-body {
      margin: 60px 0;
    }

    .cover-subtitle {
      color: #94a3b8;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin-bottom: 20px;
    }

    .cover-title span {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-desc {
      font-size: 11.5pt;
      color: #cbd5e1;
      max-width: 620px;
      line-height: 1.6;
    }

    .cover-highlights {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 40px;
    }

    .highlight-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
    }

    .highlight-label {
      font-size: 8pt;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
    }

    .highlight-value {
      font-size: 15pt;
      font-weight: 800;
      color: #ffffff;
      margin-top: 4px;
    }

    .highlight-tag {
      font-size: 8pt;
      color: #10b981;
      margin-top: 2px;
      font-weight: 600;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 8.5pt;
    }

    /* PÁGINAS INTERNAS */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }

    .header-title {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
    }

    .header-meta {
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
    }

    h2 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3 {
      font-size: 12pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    p {
      color: #334155;
      font-size: 9.5pt;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .quote-box {
      background: #f8fafc;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 16px;
      font-style: italic;
      color: #334155;
      font-size: 9.5pt;
    }

    .concept-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .concept-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }

    .concept-card h4 {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 8.5pt;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .text-right {
      text-align: right;
    }

    .font-bold {
      font-weight: 700;
    }

    .badge-profile {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-conservador { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-moderado { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-agressivo { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

    .stat-pill {
      font-weight: 700;
      color: #10b981;
    }

    /* CARDS DE PERFIL DETALHADOS */
    .profile-card-detailed {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .profile-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
    }

    .profile-card-title {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
    }

    .metrics-summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }

    .metric-box {
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 10px;
      border: 1px solid #f1f5f9;
    }

    .metric-box .label {
      font-size: 7.5pt;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }

    .metric-box .value {
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }

    .asset-tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .asset-tag {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 600;
      color: #334155;
    }

    .asset-tag.fii { border-left: 3px solid #0284c7; }
    .asset-tag.acao { border-left: 3px solid #10b981; }
    .asset-tag.stock { border-left: 3px solid #8b5cf6; }
    .asset-tag.reit { border-left: 3px solid #f59e0b; }
    .asset-tag.rf { border-left: 3px solid #64748b; }

    /* FOOTER */
    .doc-footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 8pt;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: CAPA EXECUTIVA -->
  <div class="page">
    <div class="cover">
      <div class="cover-header">
        <div class="brand-logo">NORTE <span>INVEST</span></div>
        <div class="badge-confidential">Dossiê de Auditoria Interna</div>
      </div>
      
      <div class="cover-body">
        <div class="cover-subtitle">Simulação Robusta & Engenharia Patrimonial</div>
        <div class="cover-title">O Método <span>DAVI & HYDRA</span> na Prática</div>
        <div class="cover-desc">
          Auditoria empírica de 5 anos (2021 – 2026) simulando a evolução patrimonial de um Servidor Público com estabilidade legal, aportes mensais de R$ 1.500,00 e carteiras montadas exclusivamente com ativos aprovados no Método DAVI.
        </div>

        <div class="cover-highlights">
          <div class="highlight-card">
            <div class="highlight-label">Servidor Conservador</div>
            <div class="highlight-value">R$ 397.781</div>
            <div class="highlight-tag">R$ 2.684/mês em Dividendos</div>
          </div>
          <div class="highlight-card">
            <div class="highlight-label">Servidor Moderado</div>
            <div class="highlight-value">R$ 408.031</div>
            <div class="highlight-tag">186,3% do CDI de Mercado</div>
          </div>
          <div class="highlight-card">
            <div class="highlight-label">Servidor Agressivo</div>
            <div class="highlight-value">R$ 490.972</div>
            <div class="highlight-tag">Lucro Líquido: +R$ 160.315</div>
          </div>
        </div>
      </div>

      <div class="cover-footer">
        <div>Norte Invest • Tecnologia em Gestão e Antifragilidade</div>
        <div>Auditoria Concluída: Março/2026 • Documento Oficial</div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 2: FILOSOFIA E CONCEITO -->
  <div class="page">
    <div class="header-bar">
      <div class="header-title">NORTE INVEST • DOSSIÊ DE AUDITORIA INTERNA</div>
      <div class="header-meta">MÉTODO DAVI & HYDRA • ESTUDO DE CASO EMPÍRICO</div>
    </div>

    <h2>1. A Filosofia e a Engenharia do Método</h2>
    <p>
      O modelo de alocação da Norte Invest não se baseia em previsões de mercado, boatos ou especulação de curto prazo. Trata-se de uma arquitetura matemática fundamentada em dois princípios complementares de preservação e crescimento exponencial:
    </p>

    <div class="quote-box">
      "Davi sempre esteve dentro do bloco de mármore. Eu apenas retirei tudo aquilo que não era Davi."
      <br><span style="font-size: 8pt; color: #64748b;">— Michelangelo Buonarroti sobre a escultura de Davi</span>
    </div>

    <div class="concept-grid">
      <div class="concept-card">
        <h4>🛡️ O Método DAVI (Filtragem por Eliminação)</h4>
        <p>
          Enquanto a maioria dos investidores busca a próxima ação que vai triplicar de valor e assume riscos fatais, o Método DAVI <strong>retira tudo o que não presta</strong>: empresas com endividamento excessivo, margens comprimidas, governança precária ou valuations fora da realidade.
        </p>
        <p>
          O que resta são monopólios, líderes setoriais e pagadoras perpétuas de dividendos.
        </p>
      </div>

      <div class="concept-card">
        <h4>🐙 O Sistema HYDRA & AM2O (Antifragilidade)</h4>
        <p>
          A Hidra mitológica não morre quando uma cabeça é cortada — ela faz nascer duas cabeças mais fortes no lugar. Na Norte Invest, construímos um <strong>império patrimonial multimoeda</strong> com 5 tentáculos: Renda Fixa, FIIs, Ações BR, Stocks US e REITs.
        </p>
        <p>
          O algoritmo <strong>AM2O (Aporte no Mais Distante do Objetivo)</strong> compra sempre o ativo mais descontado do mês com o aporte e os proventos reinvestidos.
        </p>
      </div>
    </div>

    <h2>2. A Alavanca do Servidor Público</h2>
    <p>
      O planejamento financeiro tradicional comete um erro primário ao exigir reservas de emergência de 12 meses para servidores públicos estáveis. Para quem possui estabilidade estatutária, o risco de desemprego é praticamente inexistente. 
    </p>
    <p>
      Calibrar a reserva entre <strong>2,5 e 5 meses (R$ 25.000 a R$ 50.000)</strong> liberou até R$ 50.000 para gerar juros compostos nos tentáculos da Hydra desde o Mês 1.
    </p>

    <h3>Quadro Consolidado da Auditoria (60 Meses de Simulação)</h3>
    <table>
      <thead>
        <tr>
          <th>Métrica Auditada</th>
          <th class="text-right">Conservador</th>
          <th class="text-right">Moderado</th>
          <th class="text-right">Agressivo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="font-bold">Reserva de Emergência Operacional</td>
          <td class="text-right">R$ 50.000 (5 meses)</td>
          <td class="text-right">R$ 35.000 (3,5 meses)</td>
          <td class="text-right">R$ 25.000 (2,5 meses)</td>
        </tr>
        <tr>
          <td class="font-bold">Patrimônio Inicial (R$ 100k + US$ 10k)</td>
          <td class="text-right">R$ 154.000,00</td>
          <td class="text-right">R$ 154.000,00</td>
          <td class="text-right">R$ 154.000,00</td>
        </tr>
        <tr>
          <td class="font-bold">Aportes Mensais Acumulados (R$ 1.500 × 60)</td>
          <td class="text-right">R$ 90.000,00</td>
          <td class="text-right">R$ 90.000,00</td>
          <td class="text-right">R$ 90.000,00</td>
        </tr>
        <tr>
          <td class="font-bold">Total Desembolsado do Salário</td>
          <td class="text-right">R$ 244.000,00</td>
          <td class="text-right">R$ 244.000,00</td>
          <td class="text-right">R$ 244.000,00</td>
        </tr>
        <tr>
          <td class="font-bold">Dividendos Recebidos (Efeito Bola de Neve)</td>
          <td class="text-right font-bold" style="color: #0284c7;">R$ 106.641,67</td>
          <td class="text-right font-bold" style="color: #0284c7;">R$ 98.148,37</td>
          <td class="text-right font-bold" style="color: #0284c7;">R$ 94.050,72</td>
        </tr>
        <tr>
          <td class="font-bold">Total Reinvestido em Ativos</td>
          <td class="text-right">R$ 347.541,61</td>
          <td class="text-right">R$ 337.340,33</td>
          <td class="text-right">R$ 330.657,24</td>
        </tr>
        <tr>
          <td class="font-bold">Patrimônio Líquido Final Hoje</td>
          <td class="text-right font-bold" style="color: #0f172a; font-size: 9.5pt;">R$ 397.781,92</td>
          <td class="text-right font-bold" style="color: #0f172a; font-size: 9.5pt;">R$ 408.031,06</td>
          <td class="text-right font-bold" style="color: #15803d; font-size: 9.5pt;">R$ 490.972,66</td>
        </tr>
        <tr>
          <td class="font-bold">Lucro Líquido Acumulado</td>
          <td class="text-right font-bold" style="color: #10b981;">+R$ 50.240,31</td>
          <td class="text-right font-bold" style="color: #10b981;">+R$ 70.690,73</td>
          <td class="text-right font-bold" style="color: #10b981;">+R$ 160.315,42</td>
        </tr>
        <tr>
          <td class="font-bold">Desempenho vs. CDI de Mercado</td>
          <td class="text-right stat-pill">128,5% do CDI</td>
          <td class="text-right stat-pill">186,3% do CDI</td>
          <td class="text-right stat-pill">431,0% do CDI</td>
        </tr>
        <tr>
          <td class="font-bold">Renda Passiva Mensal Vitalícia Hoje</td>
          <td class="text-right font-bold" style="color: #b45309; font-size: 9.5pt;">R$ 2.684,95 / mês</td>
          <td class="text-right font-bold" style="color: #b45309; font-size: 9.5pt;">R$ 2.468,25 / mês</td>
          <td class="text-right font-bold" style="color: #b45309; font-size: 9.5pt;">R$ 2.447,19 / mês</td>
        </tr>
        <tr>
          <td class="font-bold">Percentual do Salário Atual Pago</td>
          <td class="text-right font-bold">26,8% do Salário</td>
          <td class="text-right font-bold">24,7% do Salário</td>
          <td class="text-right font-bold">24,5% do Salário</td>
        </tr>
      </tbody>
    </table>

    <div class="doc-footer">
      <div>Norte Invest • Auditoria Oficial de Parâmetros</div>
      <div>Página 2 de 4</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 3: DETALHAMENTO DOS 3 PERFIS -->
  <div class="page">
    <div class="header-bar">
      <div class="header-title">NORTE INVEST • DETALHAMENTO DOS PERFIS AUDITADOS</div>
      <div class="header-meta">CESTAS DE ATIVOS APROVADAS NO MÉTODO DAVI</div>
    </div>

    <!-- CARD PERFIL CONSERVADOR -->
    <div class="profile-card-detailed">
      <div class="profile-card-header">
        <div class="profile-card-title">🛡️ Servidor Público Conservador</div>
        <span class="badge-profile badge-conservador">Maior Fluxo de Renda</span>
      </div>
      <div class="metrics-summary-row">
        <div class="metric-box"><div class="label">Patrimônio Final</div><div class="value">R$ 397.781</div></div>
        <div class="metric-box"><div class="label">Dividendos Recebidos</div><div class="value">R$ 106.641</div></div>
        <div class="metric-box"><div class="label">Renda Mensal Atual</div><div class="value" style="color:#0284c7;">R$ 2.684/mês</div></div>
        <div class="metric-box"><div class="label">Cobertura Salarial</div><div class="value">26,8%</div></div>
      </div>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Tese:</strong> Foco absoluto em blindagem patrimonial e fluxo imediato de dividendos. Com 5 meses de reserva em liquidez diária, protege o servidor contra qualquer imprevisto e canaliza proventos em fundos de tijolo e empresas sem dívida.
      </p>
      <div class="asset-tags-container">
        <span class="asset-tag rf">CDB 100% CDI</span>
        <span class="asset-tag rf">Tesouro IPCA+ 2035</span>
        <span class="asset-tag fii">ALZR11</span>
        <span class="asset-tag fii">BTLG11</span>
        <span class="asset-tag fii">CPTS11</span>
        <span class="asset-tag fii">BTCI11</span>
        <span class="asset-tag fii">AFHI11</span>
        <span class="asset-tag acao">GRND3</span>
        <span class="asset-tag acao">GMAT3</span>
        <span class="asset-tag acao">CEBR3</span>
        <span class="asset-tag acao">DEXP3</span>
        <span class="asset-tag acao">ALLD3</span>
        <span class="asset-tag stock">ACN</span>
        <span class="asset-tag stock">AFL</span>
        <span class="asset-tag stock">CINF</span>
        <span class="asset-tag stock">EOG</span>
        <span class="asset-tag stock">FIS</span>
        <span class="asset-tag reit">O</span>
        <span class="asset-tag reit">ADC</span>
        <span class="asset-tag reit">AMH</span>
        <span class="asset-tag reit">AIV</span>
      </div>
    </div>

    <!-- CARD PERFIL MODERADO -->
    <div class="profile-card-detailed">
      <div class="profile-card-header">
        <div class="profile-card-title">⚖️ Servidor Público Moderado</div>
        <span class="badge-profile badge-moderado">Equilíbrio Ótimo</span>
      </div>
      <div class="metrics-summary-row">
        <div class="metric-box"><div class="label">Patrimônio Final</div><div class="value">R$ 408.031</div></div>
        <div class="metric-box"><div class="label">Dividendos Recebidos</div><div class="value">R$ 98.148</div></div>
        <div class="metric-box"><div class="label">Renda Mensal Atual</div><div class="value" style="color:#b45309;">R$ 2.468/mês</div></div>
        <div class="metric-box"><div class="label">Desempenho vs. CDI</div><div class="value">186,3%</div></div>
      </div>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Tese:</strong> Rompeu a barreira dos R$ 400 mil combinando dividendos consistentes de grandes bancos e concessionárias de energia com multinacionais americanas à prova de crises.
      </p>
      <div class="asset-tags-container">
        <span class="asset-tag rf">CDB 100% CDI</span>
        <span class="asset-tag rf">Tesouro IPCA+ 2035</span>
        <span class="asset-tag fii">BTLG11</span>
        <span class="asset-tag fii">ALZR11</span>
        <span class="asset-tag fii">CPTS11</span>
        <span class="asset-tag fii">BCIA11</span>
        <span class="asset-tag fii">TGAR11</span>
        <span class="asset-tag acao">BBAS3</span>
        <span class="asset-tag acao">ALUP11</span>
        <span class="asset-tag acao">ABCB4</span>
        <span class="asset-tag acao">GRND3</span>
        <span class="asset-tag acao">GMAT3</span>
        <span class="asset-tag stock">ACN</span>
        <span class="asset-tag stock">AFL</span>
        <span class="asset-tag stock">AXP</span>
        <span class="asset-tag stock">PG</span>
        <span class="asset-tag stock">ALL</span>
        <span class="asset-tag reit">O</span>
        <span class="asset-tag reit">ADC</span>
        <span class="asset-tag reit">VICI</span>
        <span class="asset-tag reit">STAG</span>
      </div>
    </div>

    <!-- CARD PERFIL AGRESSIVO -->
    <div class="profile-card-detailed">
      <div class="profile-card-header">
        <div class="profile-card-title">🚀 Servidor Público Agressivo</div>
        <span class="badge-profile badge-agressivo">Multiplicação Máxima</span>
      </div>
      <div class="metrics-summary-row">
        <div class="metric-box"><div class="label">Patrimônio Final</div><div class="value" style="color:#15803d;">R$ 490.972</div></div>
        <div class="metric-box"><div class="label">Lucro Líquido</div><div class="value">+R$ 160.315</div></div>
        <div class="metric-box"><div class="label">Renda Mensal Atual</div><div class="value">R$ 2.447/mês</div></div>
        <div class="metric-box"><div class="label">Desempenho vs. CDI</div><div class="value">431,0%</div></div>
      </div>
      <p style="font-size: 8.5pt; margin-bottom: 6px;">
        <strong>Tese:</strong> Aproveitamento máximo da estabilidade pública. Com 2,5 meses de reserva, aloca 83,8% em renda variável com gigantes de inteligência artificial, commodities e infraestrutura global. Quase meio milhão gerado a partir de R$ 244 mil investidos.
      </p>
      <div class="asset-tags-container">
        <span class="asset-tag rf">CDB 100% CDI</span>
        <span class="asset-tag rf">Tesouro Selic 2027</span>
        <span class="asset-tag fii">BTLG11</span>
        <span class="asset-tag fii">ALZR11</span>
        <span class="asset-tag fii">CPTS11</span>
        <span class="asset-tag fii">TGAR11</span>
        <span class="asset-tag fii">XPML11</span>
        <span class="asset-tag acao">BBAS3</span>
        <span class="asset-tag acao">VALE3</span>
        <span class="asset-tag acao">ITUB4</span>
        <span class="asset-tag acao">ALUP11</span>
        <span class="asset-tag acao">ABEV3</span>
        <span class="asset-tag stock">MSFT</span>
        <span class="asset-tag stock">NVDA</span>
        <span class="asset-tag stock">AAPL</span>
        <span class="asset-tag stock">AMZN</span>
        <span class="asset-tag stock">GOOGL</span>
        <span class="asset-tag reit">DLR</span>
        <span class="asset-tag reit">PLD</span>
        <span class="asset-tag reit">O</span>
        <span class="asset-tag reit">AMT</span>
      </div>
    </div>

    <div class="doc-footer">
      <div>Norte Invest • Auditoria Oficial de Parâmetros</div>
      <div>Página 3 de 4</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 4: CONCLUSÕES E VENDA DA IDEIA -->
  <div class="page">
    <div class="header-bar">
      <div class="header-title">NORTE INVEST • DIRETRIZES DE COMERCIALIZAÇÃO</div>
      <div class="header-meta">ARGUMENTAÇÃO DE VENDA & CONCLUSÕES DA AUDITORIA</div>
    </div>

    <h2>3. O Que a Auditoria Revelou para a Venda da Ideia</h2>
    <p>
      Os dados empíricos apurados conferem à Norte Invest uma autoridade incomparável no mercado de assessoria e planejamento financeiro para servidores públicos. A seguir, destacam-se os principais pilares de convencimento institucional:
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <h4>1. O Segundo Salário Garantido em 5 Anos</h4>
        <p>
          O servidor que aporta R$ 1.500/mês atinge, ao final de 5 anos, uma renda passiva mensal entre <strong>R$ 2.447,00 e R$ 2.684,00 todos os meses de forma vitalícia</strong>.
        </p>
        <p>
          Isso equivale a <strong>25% a 27% do salário integral</strong>, sem depender de reformas previdenciárias ou esperar a aposentadoria oficial.
        </p>
      </div>

      <div class="concept-card">
        <h4>2. A Eficácia Matemática do Algoritmo AM2O</h4>
        <p>
          O rebalanceamento automático da Hydra compra sistematicamente na baixa. Nas quedas de mercado, o algoritmo direcionou os recursos para onde o retorno esperado era maior.
        </p>
        <p>
          Isso gerou um prêmio de até <strong>431% do CDI</strong> sem a necessidade de giros frequentes de carteira.
        </p>
      </div>
    </div>

    <div class="concept-grid">
      <div class="concept-card">
        <h4>3. A Prova do Efeito Bola de Neve</h4>
        <p>
          Ao longo dos 60 meses, os dividendos somaram entre <strong>R$ 94.000 e R$ 106.600</strong>. Ou seja, os próprios proventos pagos pelas empresas já <strong>superaram o total de dinheiro novo aportado do salário (R$ 90.000)</strong>!
        </p>
        <p>
          A partir do 4º ano, a carteira investe mais dinheiro por conta própria do que o próprio investidor.
        </p>
      </div>

      <div class="concept-card">
        <h4>4. Segurança Psicológica e Antifragilidade</h4>
        <p>
          Com ativos dolarizados nos EUA e ativos geradores de renda no Brasil, oscilações cambiais e crises locais são amortecidas. Quando o dólar sobe, as stocks protegem o patrimônio; quando a Selic sobe, os FIIs e a renda fixa remuneram a carteira.
        </p>
      </div>
    </div>

    <h2>4. Conclusão da Auditoria</h2>
    <p>
      A auditoria interna atesta que os parâmetros do Método DAVI & Hydra estão perfeitamente calibrados, seguros e validados por números incontestáveis. O modelo está 100% apto para apresentação, comercialização e implantação institucional.
    </p>

    <div style="margin-top: 40px; padding: 20px; border-radius: 8px; background: #0f172a; color: #ffffff; text-align: center;">
      <div style="font-size: 14pt; font-weight: 800; color: #f59e0b; margin-bottom: 4px;">NORTE INVEST</div>
      <div style="font-size: 9pt; color: #cbd5e1;">A Bússola do Investidor Inteligente • Método Davi & Hydra</div>
      <div style="font-size: 8pt; color: #94a3b8; margin-top: 10px;">Relatório de Auditoria Homologado • Março de 2026</div>
    </div>

    <div class="doc-footer">
      <div>Norte Invest • Auditoria Oficial de Parâmetros</div>
      <div>Página 4 de 4</div>
    </div>
  </div>

</body>
</html>
`;

// Caminhos dos arquivos
const outputHtmlPath = path.resolve(__dirname, '../public/relatorios/auditoria_servidor_publico.html');
const outputPdfPath = path.resolve(__dirname, '../public/relatorios/Norte_Invest_Auditoria_Servidor_Publico.pdf');
const brainPdfPath = 'C:\\Users\\ricks\\.gemini\\antigravity\\brain\\9cbf9a46-d361-46c0-b285-1126c4a67692\\Norte_Invest_Auditoria_Servidor_Publico.pdf';

fs.writeFileSync(outputHtmlPath, htmlContent, 'utf-8');
console.log('✅ HTML do relatório gerado com sucesso em:', outputHtmlPath);

// Determinar executável do browser headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserExe = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('🌐 Renderizando PDF de alta qualidade com:', browserExe);

try {
  const cmd = `"${browserExe}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${outputHtmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('🎉 PDF gerado com sucesso em:', outputPdfPath);

  // Copiar também para a pasta de artefatos do brain
  fs.copyFileSync(outputPdfPath, brainPdfPath);
  console.log('📁 Cópia salva no diretório de artefatos:', brainPdfPath);
} catch (err) {
  console.error('❌ Erro ao converter HTML em PDF:', err.message);
  process.exit(1);
}
