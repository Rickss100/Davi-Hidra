/**
 * Brapi.dev API Service
 * Provides real-time and fundamental data for Brazilian stocks and FIIs
 * 
 * Free tier: 4 stocks (PETR4, MGLU3, VALE3, ITUB4) without token
 * Paid tier: 4000+ stocks with API token
 * 
 * Documentation: https://brapi.dev/docs
 */

import fetch from 'node-fetch';

const BRAPI_BASE_URL = 'https://brapi.dev/api';

// Free tier tickers (no token required)
const FREE_TICKERS = ['PETR4', 'MGLU3', 'VALE3', 'ITUB4'];

/**
 * Get real-time quote for a Brazilian asset
 * @param {string} ticker - Asset ticker (e.g., 'PETR4', 'VISC11')
 * @param {string} token - Optional API token for paid tier
 * @returns {Promise<Object>} Quote data with price, change, volume, etc.
 */
export async function getBrapiQuote(ticker, token = null) {
  try {
    // Check if ticker requires token (free tier check) 
    if (!token && !isFreeTicker(ticker)) {
      console.warn(`Ticker ${ticker} requires paid Brapi token. Only ${FREE_TICKERS.join(', ')} are free.`);
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
    
    const url = token 
      ? `${BRAPI_BASE_URL}/quote/${ticker}?token=${token}`
      : `${BRAPI_BASE_URL}/quote/${ticker}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401 && !token) {
        console.warn(`Brapi 401: Ticker ${ticker} needs a paid token. Add token via localStorage.setItem('brapiToken', 'YOUR_TOKEN')`);
        return null;
      }
      throw new Error(`Brapi API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Brapi returns array even for single ticker
    if (data.results && data.results.length > 0) {
      return formatQuoteData(data.results[0]);
    }
    
    throw new Error(`No data found for ticker ${ticker}`);
  } catch (error) {
    console.error(`Error fetching Brapi quote for ${ticker}:`, error);
    return null; // Return null instead of throwing to allow fallback
  }
}

/**
 * Get quotes for multiple tickers in a single request
 * @param {string[]} tickers - Array of tickers
 * @param {string} token - Optional API token
 * @returns {Promise<Object[]>} Array of quote data
 */
export async function getBrapiQuotes(tickers, token = null) {
  try {
    const tickerList = tickers.join(',');
    const url = token
      ? `${BRAPI_BASE_URL}/quote/${tickerList}?token=${token}`
      : `${BRAPI_BASE_URL}/quote/${tickerList}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Brapi API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results) {
      return data.results.map(formatQuoteData);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Brapi quotes:', error);
    throw error;
  }
}

/**
 * Get fundamental data for a ticker
 * @param {string} ticker - Asset ticker
 * @param {string} token - Optional API token
 * @returns {Promise<Object>} Fundamental data (P/L, P/VP, DY, etc.)
 */
export async function getBrapiFundamentals(ticker, token = null) {
  try {
    const url = token
      ? `${BRAPI_BASE_URL}/quote/${ticker}?fundamental=true&token=${token}`
      : `${BRAPI_BASE_URL}/quote/${ticker}?fundamental=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Brapi API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return formatFundamentalData(data.results[0]);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching fundamentals for ${ticker}:`, error);
    return null;
  }
}

/**
 * Get dividend history for a ticker
 * @param {string} ticker - Asset ticker
 * @param {string} token - Optional API token
 * @returns {Promise<Object[]>} Array of dividend payments
 */
export async function getBrapiDividends(ticker, token = null) {
  try {
    const url = token
      ? `${BRAPI_BASE_URL}/quote/${ticker}?dividends=true&token=${token}`
      : `${BRAPI_BASE_URL}/quote/${ticker}?dividends=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Brapi API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0 && data.results[0].dividendsData) {
      return data.results[0].dividendsData.cashDividends || [];
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching dividends for ${ticker}:`, error);
    return [];
  }
}

/**
 * Format quote data to standardized structure
 */
function formatQuoteData(rawData) {
  return {
    ticker: rawData.symbol,
    name: rawData.longName || rawData.shortName,
    price: rawData.regularMarketPrice,
    change: rawData.regularMarketChange,
    changePercent: rawData.regularMarketChangePercent,
    dayHigh: rawData.regularMarketDayHigh,
    dayLow: rawData.regularMarketDayLow,
    volume: rawData.regularMarketVolume,
    marketCap: rawData.marketCap,
    logoUrl: rawData.logourl,
    updatedAt: new Date(rawData.regularMarketTime)
  };
}

/**
 * Format fundamental data
 */
function formatFundamentalData(rawData) {
  const summaryData = rawData.summaryProfile || {};
  const financialData = rawData.financialData || {};
  
  return {
    ticker: rawData.symbol,
    sector: summaryData.sector,
    industry: summaryData.industry,
    description: summaryData.longBusinessSummary,
    
    // Valuation metrics
    priceToEarnings: financialData.currentPrice / financialData.earningsPerShare || null,
    priceToBook: rawData.priceToBook,
    dividendYield: rawData.dividendYield,
    
    // Profitability
    returnOnEquity: financialData.returnOnEquity,
    profitMargin: financialData.profitMargins,
    
    // Debt
    debtToEquity: financialData.debtToEquity,
    
    raw: rawData // Keep full data for advanced analysis
  };
}

/**
 * Check if a ticker is available on free tier
 */
export function isFreeTicker(ticker) {
  return FREE_TICKERS.includes(ticker.toUpperCase());
}

/**
 * Get list of free tier tickers
 */
export function getFreeTickers() {
  return [...FREE_TICKERS];
}
