import { ChartDataPoint, StockMover, TimeRange } from "./types";
import { fetchChartData, fetchTopMovers } from "./alpha-vantage";

export const SP500_COMPANIES = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "BRK.B", name: "Berkshire Hathaway" },
  { symbol: "LLY", name: "Eli Lilly & Co." },
  { symbol: "TSM", name: "Taiwan Semiconductor" },
  { symbol: "AVGO", name: "Broadcom Inc." },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "UNH", name: "UnitedHealth Group" },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "NVO", name: "Novo Nordisk" },
  { symbol: "WMT", name: "Walmart Inc." },
  { symbol: "XOM", name: "Exxon Mobil" },
  { symbol: "MA", name: "Mastercard Inc." },
  { symbol: "PG", name: "Procter & Gamble" },
  { symbol: "COST", name: "Costco Wholesale" },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "HD", name: "Home Depot Inc." },
  { symbol: "ABBV", name: "AbbVie Inc." },
  { symbol: "MRK", name: "Merck & Co." },
  { symbol: "CRM", name: "Salesforce Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "CVX", name: "Chevron Corp." },
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "KO", name: "Coca-Cola Co." },
];

// --- Fallback simulated data generators ---

function generateSPChartData(range: TimeRange): ChartDataPoint[] {
  const now = new Date();
  const points: ChartDataPoint[] = [];

  let days: number;
  switch (range) {
    case "1D": days = 1; break;
    case "1W": days = 7; break;
    case "1M": days = 30; break;
    case "3M": days = 90; break;
    case "6M": days = 180; break;
    case "1Y": days = 365; break;
    case "ALL": days = 365 * 5; break;
    case "YTD": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      break;
    }
    default: days = 90;
  }

  const baseValue = 5200;
  const volatility = 0.008;
  let currentValue = baseValue - days * 0.5;
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let pseudoRandom = seed;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    pseudoRandom = (pseudoRandom * 1103515245 + 12345) & 0x7fffffff;
    const randomFactor = (pseudoRandom / 0x7fffffff - 0.48) * volatility;
    currentValue = currentValue * (1 + randomFactor);

    points.push({
      time: date.toISOString().split("T")[0],
      value: Math.round(currentValue * 100) / 100,
    });
  }
  return points;
}

function generateStockChartData(symbol: string, range: TimeRange): ChartDataPoint[] {
  const now = new Date();
  const points: ChartDataPoint[] = [];

  let days: number;
  switch (range) {
    case "1D": days = 1; break;
    case "1W": days = 7; break;
    case "1M": days = 30; break;
    case "3M": days = 90; break;
    case "6M": days = 180; break;
    case "1Y": days = 365; break;
    case "ALL": days = 365 * 5; break;
    case "YTD": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      days = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      break;
    }
    default: days = 90;
  }

  let symbolSeed = 0;
  for (let i = 0; i < symbol.length; i++) {
    symbolSeed = symbolSeed * 31 + symbol.charCodeAt(i);
  }
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let pseudoRandom = (symbolSeed * 7919 + dateSeed) & 0x7fffffff;

  const nextRandom = () => {
    pseudoRandom = (pseudoRandom * 1103515245 + 12345) & 0x7fffffff;
    return pseudoRandom / 0x7fffffff;
  };

  const basePrice = 50 + (Math.abs(symbolSeed) % 550);
  const volatility = 0.01;
  let currentValue = basePrice - days * 0.02;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const randomFactor = (nextRandom() - 0.48) * volatility;
    currentValue = currentValue * (1 + randomFactor);

    points.push({
      time: date.toISOString().split("T")[0],
      value: Math.round(currentValue * 100) / 100,
    });
  }
  return points;
}

function generateMovers(): { gainers: StockMover[]; losers: StockMover[] } {
  const seed = new Date();
  const daySeed = seed.getFullYear() * 10000 + (seed.getMonth() + 1) * 100 + seed.getDate();
  let pseudoRandom = daySeed;

  const nextRandom = () => {
    pseudoRandom = (pseudoRandom * 1103515245 + 12345) & 0x7fffffff;
    return pseudoRandom / 0x7fffffff;
  };

  const shuffled = [...SP500_COMPANIES].sort(() => nextRandom() - 0.5);

  const gainers: StockMover[] = shuffled.slice(0, 10).map((company) => {
    const price = 100 + nextRandom() * 400;
    const changePercent = 1 + nextRandom() * 8;
    const change = (price * changePercent) / 100;
    const vol = Math.floor(nextRandom() * 50 + 5);
    return {
      symbol: company.symbol,
      name: company.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: `${vol.toFixed(1)}M`,
    };
  });

  const losers: StockMover[] = shuffled.slice(10, 20).map((company) => {
    const price = 100 + nextRandom() * 400;
    const changePercent = -(1 + nextRandom() * 8);
    const change = (price * changePercent) / 100;
    const vol = Math.floor(nextRandom() * 50 + 5);
    return {
      symbol: company.symbol,
      name: company.name,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: `${vol.toFixed(1)}M`,
    };
  });

  gainers.sort((a, b) => b.changePercent - a.changePercent);
  losers.sort((a, b) => a.changePercent - b.changePercent);

  return { gainers, losers };
}

// --- Public API: tries Alpha Vantage first, falls back to simulated data ---

export async function getMarketData(range: TimeRange, symbol?: string) {
  let chart: ChartDataPoint[];
  let gainers: StockMover[];
  let losers: StockMover[];

  // Fetch chart data
  try {
    chart = await fetchChartData(range, symbol);
  } catch (err) {
    console.warn("Alpha Vantage chart fetch failed, using simulated data:", err);
    chart = symbol
      ? generateStockChartData(symbol, range)
      : generateSPChartData(range);
  }

  // Fetch top movers
  try {
    const movers = await fetchTopMovers();
    gainers = movers.gainers;
    losers = movers.losers;
  } catch (err) {
    console.warn("Alpha Vantage movers fetch failed, using simulated data:", err);
    const movers = generateMovers();
    gainers = movers.gainers;
    losers = movers.losers;
  }

  return {
    chart,
    gainers,
    losers,
    lastUpdated: new Date().toISOString(),
  };
}
