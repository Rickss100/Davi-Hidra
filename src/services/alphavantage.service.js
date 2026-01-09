/**
 * Alpha Vantage API Service
 * Provides real-time and historical data for US stocks and REITs
 * 
 * Free tier: 500 requests/day, 5 requests/minute
 * Documentation: https://www.alphavantage.co/documentation/
 */

import fetch from 'node-fetch';

const AV_BASE_URL = 'https://www.alphavantage.co/query';

// Store API key (you'll need to get a free key from alphavantage.co)
let API_KEY = 'demo'; // Replace with actual key

/**
 * Set Alpha Vantage API key
 * @param {string} key - API key
 */
export function setAlphaVantageKey(key) {
  API_KEY = key;
}

/**
 * Get real-time quote for a US stock/REIT
 * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'VNQ')
 * @returns {Promise<Object>} Quote data
 */
export async function getAVQuote(symbol) {
  try {
    const url = `${AV_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API limit or error messages
    if (data['Note']) {
      throw new Error('API call frequency limit reached. Please wait.');
    }
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    const quote = data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error(`No data found for symbol ${symbol}`);
    }
    
    return formatAVQuote(quote, symbol);
  } catch (error) {
    console.error(`Error fetching Alpha Vantage quote for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get intraday data (for charts)
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Time interval ('1min', '5min', '15min', '30min', '60min')
 * @returns {Promise<Object[]>} Array of time-series data points
 */
export async function getAVIntraday(symbol, interval = '5min') {
  try {
    const url = `${AV_BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Note'] || data['Error Message']) {
      throw new Error(data['Note'] || data['Error Message']);
    }
    
    const timeSeriesKey = `Time Series (${interval})`;
    const timeSeries = data[timeSeriesKey];
    
    if (!timeSeries) {
      return [];
    }
    
    // Convert to array format
    return Object.entries(timeSeries).map(([timestamp, values]) => ({
      timestamp: new Date(timestamp),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    }));
  } catch (error) {
    console.error(`Error fetching intraday data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get daily historical data
 * @param {string} symbol - Stock symbol
 * @param {boolean} compact - If true, returns last 100 data points; if false, returns full history (20+ years)
 * @returns {Promise<Object[]>} Array of daily data points
 */
export async function getAVDaily(symbol, compact = true) {
  try {
    const outputSize = compact ? 'compact' : 'full';
    const url = `${AV_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Note'] || data['Error Message']) {
      throw new Error(data['Note'] || data['Error Message']);
    }
    
    const timeSeries = data['Time Series (Daily)'];
    
    if (!timeSeries) {
      return [];
    }
    
    return Object.entries(timeSeries).map(([date, values]) => ({
      date: new Date(date),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    }));
  } catch (error) {
    console.error(`Error fetching daily data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get company overview (fundamentals)
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Company fundamental data
 */
export async function getAVOverview(symbol) {
  try {
    const url = `${AV_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Note'] || data['Error Message']) {
      throw new Error(data['Note'] || data['Error Message']);
    }
    
    return formatAVOverview(data);
  } catch (error) {
    console.error(`Error fetching overview for ${symbol}:`, error);
    return null;
  }
}

/**
 * Format quote data
 */
function formatAVQuote(quote, symbol) {
  return {
    ticker: symbol,
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    dayHigh: parseFloat(quote['03. high']),
    dayLow: parseFloat(quote['04. low']),
    volume: parseInt(quote['06. volume']),
    previousClose: parseFloat(quote['08. previous close']),
    updatedAt: new Date(quote['07. latest trading day'])
  };
}

/**
 * Format overview data
 */
function formatAVOverview(data) {
  return {
    ticker: data.Symbol,
    name: data.Name,
    description: data.Description,
    sector: data.Sector,
    industry: data.Industry,
    marketCap: parseInt(data.MarketCapitalization) || 0,
    
    // Valuation
    pe: parseFloat(data.PERatio) || null,
    pb: parseFloat(data.PriceToBookRatio) || null,
    dividendYield: parseFloat(data.DividendYield) || 0,
    
    // Profitability
    profitMargin: parseFloat(data.ProfitMargin) || null,
    roe: parseFloat(data.ReturnOnEquityTTM) || null,
    
    // Growth
    revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM) || null,
    quarterlyRevenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY) || null,
    
    // Financials
    bookValue: parseFloat(data.BookValue) || null,
    eps: parseFloat(data.EPS) || null,
    
    raw: data
  };
}

/**
 * Rate limiter helper - ensures we don't exceed 5 requests/minute
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 12000; // 12 seconds between requests (5 per minute)

export async function rateLimitedRequest(requestFn) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  return requestFn();
}
