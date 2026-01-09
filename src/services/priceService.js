// Mock service to simulate fetching current prices
// In a real app, this would call an external finance API

export const priceService = {
    // Returns a map of ticker -> newPrice
    fetchLatestPrices: async (currentHoldings) => {
        // currentHoldings: array of asset objects or list of tickers
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newPrices = {};
        
        // Helper to vary price slightly
        const randomize = (basePrice) => {
            if (!basePrice) return (Math.random() * 50) + 10; // Fallback
            const variation = (Math.random() * 0.10) - 0.05; // +/- 5%
            return basePrice * (1 + variation);
        };

        // Extract all unique tickers from holdings categories
        const categories = ['acoes', 'fiis', 'stocks', 'reits'];
        
        categories.forEach(cat => {
            if (currentHoldings[cat]) {
                currentHoldings[cat].forEach(asset => {
                    if (asset.code) {
                        // Use current price if available, else average price, else random
                        const base = asset.currentPrice || asset.averagePrice || 100;
                        newPrices[asset.code] = randomize(base);
                    }
                });
            }
        });

        // Also handle if a flat list of tickers is passed (optional, for robustness)
        if (Array.isArray(currentHoldings)) {
             currentHoldings.forEach(ticker => {
                 newPrices[ticker] = randomize(100);
             });
        }

        return newPrices;
    }
};
