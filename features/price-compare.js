/**
 * features/price-compare.js — SmartProcure Future Phase
 * Phase 2: Market Price Comparison (e.g., vs Makro prices)
 * 
 * STATUS: Skeleton / Commented out in index.html
 * This file is NOT active in MVP. Uncomment the <script> tag in index.html to enable.
 */

/**
 * Fetches current market price for a given ingredient from an external API.
 * Future integration: Makro API, LINE Shopping, or scraping service.
 * 
 * @param {string} ingredientName - Name of the ingredient to look up
 * @param {string} [source='makro'] - Data source identifier
 * @returns {Promise<{name: string, marketPricePerKg: number, source: string, fetchedAt: string}>}
 */
async function fetchMakroPrice(ingredientName, source = 'makro') {
  console.log(`[PRICE-COMPARE] Fetching market price for: "${ingredientName}" from source: ${source}`);
  
  // TODO Phase 2: Replace with actual API call
  // const response = await fetch(`https://api.pakarang-supply.com/market-price?name=${encodeURIComponent(ingredientName)}`);
  // const data = await response.json();

  // Simulated placeholder return
  const mockPrice = Math.floor(Math.random() * 200 + 50); // 50–250 ฿/kg
  const result = {
    name:            ingredientName,
    marketPricePerKg: mockPrice,
    source:          source,
    fetchedAt:       new Date().toISOString(),
  };
  console.log('[PRICE-COMPARE] Result (mock):', result);
  return result;
}

/**
 * Compares SmartProcure recommended prices vs market prices for all items.
 * Future: Renders a comparison table in the dashboard UI.
 * 
 * @param {Array} items - Current ingredient list from DB
 * @returns {Promise<Array<{name, ourPrice, marketPrice, savingPerKg, savingPercent}>>}
 */
async function compareAllPrices(items) {
  console.log('[PRICE-COMPARE] Starting full price comparison for', items.length, 'items...');

  const comparisons = await Promise.all(items.map(async (item) => {
    const market = await fetchMakroPrice(item.name);
    const saving = market.marketPricePerKg - item.pricePerKg;
    return {
      name:          item.name,
      ourPrice:      item.pricePerKg,
      marketPrice:   market.marketPricePerKg,
      savingPerKg:   saving,
      savingPercent: ((saving / market.marketPricePerKg) * 100).toFixed(1),
    };
  }));

  console.log('[PRICE-COMPARE] Comparison complete:', comparisons);
  return comparisons;
}

/**
 * Future: Renders the cost-saving comparison table into the dashboard.
 * Will be triggered after the main order grid is rendered.
 */
function renderCostSavingDisplay(comparisons) {
  console.log('[PRICE-COMPARE] renderCostSavingDisplay() — TODO: Render comparison UI to #cost-saving-section');
  // TODO Phase 2: Build and inject HTML comparison table
  // const section = document.getElementById('cost-saving-section');
  // section.innerHTML = buildComparisonHTML(comparisons);
}
