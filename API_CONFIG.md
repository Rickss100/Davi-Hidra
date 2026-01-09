# API Configuration Guide

## Overview

This application uses external APIs to fetch real-time market data. Here's how to configure them.

---

## Brapi.dev (Brazilian Stocks & FIIs)

### Free Tier

No token required for these 4 tickers:

- **PETR4** (Petrobras)
- **MGLU3** (Magazine Luiza)
- **VALE3** (Vale)
- **ITUB4** (Itaú)

### Paid Tier (Recommended)

For access to 4000+ tickers (R$ ~50/month):

1. Sign up at [https://brapi.dev](https://brapi.dev)
2. Get your API token
3. In the browser console, run:
   ```javascript
   localStorage.setItem("brapiToken", "YOUR_TOKEN_HERE");
   ```
4. Refresh the page

---

## Alpha Vantage (US Stocks & REITs)

### Free Tier

- 500 requests/day
- 5 requests/minute

### API Key

**Current Key**: `PZ3GKDI728V7SE4S`

### Configuration

1. Get a free key at [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. In the browser console, run:
   ```javascript
   localStorage.setItem("alphaVantageKey", "PZ3GKDI728V7SE4S");
   ```
3. Refresh the page

### Available Endpoints

| Endpoint         | Function             | Data                                     |
| ---------------- | -------------------- | ---------------------------------------- |
| OVERVIEW         | Company fundamentals | P/E, P/B, ROE, ROA, EPS, Div Yield, Beta |
| INCOME_STATEMENT | Financial statements | Revenue, Net Income, EBITDA              |
| BALANCE_SHEET    | Assets & Liabilities | Total Assets, Total Debt, Equity         |
| CASH_FLOW        | Cash flows           | Operating CF, FCF, CapEx                 |
| EARNINGS         | Earnings data        | EPS quarterly/annual                     |

**Note**: Alpha Vantage provides data for US markets. For Brazilian stocks (B3), use Brapi.

---

## BACEN (Economic Indicators)

No configuration needed! The Banco Central API is completely free and unlimited.

---

## Verification

To check if your keys are configured, run in the console:

```javascript
console.log(
  "Brapi Token:",
  localStorage.getItem("brapiToken") || "Not set (using free tier)"
);
console.log(
  "Alpha Vantage Key:",
  localStorage.getItem("alphaVantageKey") || "Not set (using demo)"
);
```

---

## Troubleshooting

### "401 Unauthorized" error

- You're trying to access a ticker not in the free tier without a token
- Solution: Add a Brapi token or use only free tickers

### "API call frequency limit reached"

- Alpha Vantage free tier limit hit
- Solution: Wait 1 minute or upgrade to paid plan

### Prices not updating

1. Check browser console for errors
2. Verify API keys are set correctly
3. Ensure you have internet connection
4. Try clicking "Atualizar Cotações" again

---

## Recommended Free Tier Setup

If you want to test without paying:

1. **Brazilian market**: Use only PETR4, MGLU3, VALE3, ITUB4
2. **US market**: Get free Alpha Vantage key
3. **Economic data**: Works automatically (BACEN is free)

This gives you a fully functional system at zero cost!
