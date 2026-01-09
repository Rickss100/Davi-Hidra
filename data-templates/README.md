# Templates CSV - Importação de Dados

Este diretório contém templates CSV para importação de dados no sistema DAVI & HYDRA.

## 📋 Arquivos Disponíveis

### 1. `assets.csv` - Cadastro de Ativos

Cadastro básico de ativos (ações, FIIs, stocks, REITs).

**Colunas:**

- `code`: Ticker do ativo (ex: PETR4, AAPL)
- `name`: Nome completo da empresa
- `type`: Tipo do ativo (`acao`, `fii`, `stock`, `reit`)
- `market`: Mercado (`BR` ou `US`)
- `sector`: Setor de atuação

### 2. `transactions.csv` - Transações

Histórico de compras e vendas.

**Colunas:**

- `date`: Data da transação (formato: YYYY-MM-DD)
- `code`: Código do ativo
- `type`: Tipo (`buy` ou `sell`)
- `quantity`: Quantidade de ações/cotas
- `price`: Preço unitário
- `total_value`: Valor total da operação
- `category`: Categoria (`acoes`, `fiis`, `stocks`, `reits`)
- `notes`: Observações (opcional)

### 3. `fundamentals.csv` - Dados Fundamentalistas

Indicadores fundamentalistas dos ativos.

**Colunas:**

- `code`: Código do ativo
- `market_cap`: Valor de mercado
- `pe_ratio`: P/L (Preço/Lucro)
- `pb_ratio`: P/VP (Preço/Valor Patrimonial)
- `dividend_yield`: Dividend Yield (%)
- `roe`: ROE (Return on Equity) (%)
- `roa`: ROA (Return on Assets) (%)
- `debt_to_equity`: Dívida/Patrimônio
- `current_ratio`: Liquidez Corrente
- `updated_at`: Data da atualização

### 4. `prices.csv` - Cotações Históricas

Histórico de preços diários (OHLCV).

**Colunas:**

- `code`: Código do ativo
- `date`: Data (YYYY-MM-DD)
- `open`: Preço de abertura
- `high`: Preço máximo
- `low`: Preço mínimo
- `close`: Preço de fechamento
- `volume`: Volume negociado

## 🔧 Como Usar

### Para Editar (Usuário)

1. Abra o arquivo CSV no Excel, Google Sheets ou editor de texto
2. Edite os dados mantendo o formato das colunas
3. Salve o arquivo
4. Importe no app usando a funcionalidade de importação

### Para Processar (IA/API)

```javascript
// Exemplo de leitura
const fs = require("fs");
const csv = require("csv-parser");

fs.createReadStream("assets.csv")
  .pipe(csv())
  .on("data", (row) => {
    console.log(row);
  });
```

## ⚠️ Regras Importantes

1. **Não altere os nomes das colunas** (primeira linha)
2. **Formato de datas**: YYYY-MM-DD (ex: 2026-01-07)
3. **Números decimais**: Use ponto como separador (ex: 35.50)
4. **Campos vazios**: Deixe em branco se não tiver o dado
5. **Codificação**: UTF-8 (para acentos funcionarem)

## 📥 Importação no App

A importação será feita através da interface do aplicativo:

1. Menu → Configurações → Importar Dados
2. Selecione o tipo de dado (Ativos, Transações, etc)
3. Escolha o arquivo CSV
4. Revise os dados antes de confirmar
5. Clique em "Importar"

Os dados serão validados e inseridos no banco SQLite local.
