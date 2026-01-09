/**
 * Banco Central do Brasil API Service
 * Provides economic indicators: IPCA, Selic, CDI
 * 
 * Free tier: Unlimited (official government API)
 * Documentation: https://dadosabertos.bcb.gov.br/
 */

import fetch from 'node-fetch';

const BACEN_BASE_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

// Series IDs for economic indicators
const SERIES_IDS = {
  SELIC: 11,            // Taxa Selic (%)
  IPCA: 433,            // IPCA mensal (%)
  IPCA_12M: 13522,      // IPCA acumulado 12 meses (%)
  CDI: 12,              // CDI diário (%)
  CDI_MONTHLY: 4391,    // CDI mensal (%)
  IGPM: 189,            // IGP-M (%)
  DOLAR_PTAX: 1         // Dólar Ptax (R$)
};

/**
 * Get economic indicator data
 * @param {string} indicator - Indicator name ('SELIC', 'IPCA', 'CDI', etc.)
 * @param {string} startDate - Start date in DD/MM/YYYY format
 * @param {string} endDate - End date in DD/MM/YYYY format
 * @returns {Promise<Object[]>} Array of data points with date and value
 */
export async function getBacenIndicator(indicator, startDate = null, endDate = null) {
  const seriesId = SERIES_IDS[indicator.toUpperCase()];
  
  if (!seriesId) {
    throw new Error(`Unknown indicator: ${indicator}. Available: ${Object.keys(SERIES_IDS).join(', ')}`);
  }
  
  try {
    let url = `${BACEN_BASE_URL}.${seriesId}/dados?formato=json`;
    
    if (startDate) {
      url += `&dataInicial=${startDate}`;
    }
    
    if (endDate) {
      url += `&dataFinal=${endDate}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`BACEN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map(item => ({
      date: parseDate(item.data), // Convert DD/MM/YYYY to Date object
      value: parseFloat(item.valor),
      indicator
    }));
  } catch (error) {
    console.error(`Error fetching BACEN data for ${indicator}:`, error);
    throw error;
  }
}

/**
 * Get latest value for an indicator
 * @param {string} indicator - Indicator name
 * @returns {Promise<Object>} Latest data point
 */
export async function getLatestBacenIndicator(indicator) {
  // Since March 26, 2025, BACEN API requires date filters
  // Get last 30 days to ensure we get the latest value
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // Last 90 days to be safe
  
  const data = await getBacenIndicator(
    indicator,
    formatBacenDate(startDate),
    formatBacenDate(endDate)
  );
  
  if (data.length === 0) {
    return null;
  }
  
  // Return most recent (last item)
  return data[data.length - 1];
}

/**
 * Get Selic rate (current and historical)
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object[]>} Selic data
 */
export async function getSelic(startDate = null, endDate = null) {
  return getBacenIndicator('SELIC', startDate, endDate);
}

/**
 * Get IPCA (monthly inflation)
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object[]>} IPCA data
 */
export async function getIPCA(startDate = null, endDate = null) {
  return getBacenIndicator('IPCA', startDate, endDate);
}

/**
 * Get IPCA accumulated over 12 months
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object[]>} IPCA 12M data
 */
export async function getIPCA12M(startDate = null, endDate = null) {
  return getBacenIndicator('IPCA_12M', startDate, endDate);
}

/**
 * Get CDI rate
 * @param {string} startDate - Optional start date
 * @param {string} endDate - Optional end date
 * @returns {Promise<Object[]>} CDI data
 */
export async function getCDI(startDate = null, endDate = null) {
  return getBacenIndicator('CDI', startDate, endDate);
}

/**
 * Get current economic snapshot (latest values for all indicators)
 * @returns {Promise<Object>} Object with current values
 */
export async function getEconomicSnapshot() {
  try {
    const [selic, ipca, ipca12m, cdi] = await Promise.all([
      getLatestBacenIndicator('SELIC'),
      getLatestBacenIndicator('IPCA'),
      getLatestBacenIndicator('IPCA_12M'),
      getLatestBacenIndicator('CDI')
    ]);
    
    return {
      selic: selic?.value || null,
      ipca: ipca?.value || null,
      ipca12m: ipca12m?.value || null,
      cdi: cdi?.value || null,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error fetching economic snapshot:', error);
    return null;
  }
}

/**
 * Parse BACEN date format (DD/MM/YYYY) to Date object
 */
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return new Date(year, parseInt(month) - 1, day);
}

/**
 * Format date to BACEN format (DD/MM/YYYY)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatBacenDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get date range for last N months
 * @param {number} months - Number of months
 * @returns {Object} Object with startDate and endDate in BACEN format
 */
export function getLastNMonths(months) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return {
    startDate: formatBacenDate(startDate),
    endDate: formatBacenDate(endDate)
  };
}
