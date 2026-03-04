import { ChartDataPoint, StockMover, TimeRange } from "./types";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";
const BASE_URL = "https://www.alphavantage.co/query";

// In-memory cache to minimize API calls (25/day free tier)
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

const HOUR = 60 * 60 * 1000;

interface AlphaVantageDailyResponse {
  "Meta Data"?: Record<string, string>;
  "Time Series (Daily)"?: Record<string, {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  }>;
  Note?: string;
  Information?: string;
}

interface AlphaVantageIntradayResponse {
  "Meta Data"?: Record<string, string>;
  [key: string]: unknown;
  Note?: string;
  Information?: string;
}

interface AlphaVantageMoversResponse {
  top_gainers?: Array<{
    ticker: string;
    price: string;
    change_amount: string;
    change_percentage: string;
    volume: string;
  }>;
  top_losers?: Array<{
    ticker: string;
    price: string;
    change_amount: string;
    change_percentage: string;
    volume: string;
  }>;
  Note?: string;
  Information?: string;
}

async function fetchFromAV(params: Record<string, string>): Promise<unknown> {
  const url = new URL(BASE_URL);
  url.searchParams.set("apikey", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Alpha Vantage HTTP ${res.status}`);
  return res.json();
}

function getRangeDays(range: TimeRange): number {
  const now = new Date();
  switch (range) {
    case "1D": return 1;
    case "1W": return 7;
    case "1M": return 30;
    case "3M": return 90;
    case "6M": return 180;
    case "1Y": return 365;
    case "ALL": return 365 * 20;
    case "YTD": {
      const start = new Date(now.getFullYear(), 0, 1);
      return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    default: return 90;
  }
}

export async function fetchChartData(
  range: TimeRange,
  symbol?: string
): Promise<ChartDataPoint[]> {
  const ticker = symbol || "SPY";
  const cacheKey = `chart:${ticker}`;

  // For 1D, use intraday
  if (range === "1D") {
    return fetchIntradayData(ticker);
  }

  // Use cached full daily data if available
  let allPoints = getCached<ChartDataPoint[]>(cacheKey);

  if (!allPoints) {
    const data = (await fetchFromAV({
      function: "TIME_SERIES_DAILY",
      symbol: ticker,
      outputsize: "full",
    })) as AlphaVantageDailyResponse;

    if (data.Note || data.Information) {
      throw new Error(data.Note || data.Information || "API limit reached");
    }

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) throw new Error("No time series data returned");

    allPoints = Object.entries(timeSeries)
      .map(([date, values]) => ({
        time: date,
        value: parseFloat(values["4. close"]),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // Cache full daily data for 4 hours
    setCache(cacheKey, allPoints, 4 * HOUR);
  }

  // Slice to requested range
  const days = getRangeDays(range);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return allPoints.filter((p) => p.time >= cutoffStr);
}

async function fetchIntradayData(ticker: string): Promise<ChartDataPoint[]> {
  const cacheKey = `intraday:${ticker}`;
  const cached = getCached<ChartDataPoint[]>(cacheKey);
  if (cached) return cached;

  const data = (await fetchFromAV({
    function: "TIME_SERIES_INTRADAY",
    symbol: ticker,
    interval: "5min",
  })) as AlphaVantageIntradayResponse;

  if (data.Note || data.Information) {
    throw new Error(data.Note || data.Information || "API limit reached");
  }

  const timeSeriesKey = Object.keys(data).find((k) => k.startsWith("Time Series"));
  if (!timeSeriesKey) throw new Error("No intraday data returned");

  const timeSeries = data[timeSeriesKey] as Record<string, Record<string, string>>;

  const points = Object.entries(timeSeries)
    .map(([datetime, values]) => ({
      time: datetime,
      value: parseFloat(values["4. close"]),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Cache intraday for 30 minutes
  setCache(cacheKey, points, 30 * 60 * 1000);

  return points;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

export async function fetchTopMovers(): Promise<{
  gainers: StockMover[];
  losers: StockMover[];
}> {
  const cacheKey = "topmovers";
  const cached = getCached<{ gainers: StockMover[]; losers: StockMover[] }>(cacheKey);
  if (cached) return cached;

  const data = (await fetchFromAV({
    function: "TOP_GAINERS_LOSERS",
  })) as AlphaVantageMoversResponse;

  if (data.Note || data.Information) {
    throw new Error(data.Note || data.Information || "API limit reached");
  }

  const mapMover = (item: {
    ticker: string;
    price: string;
    change_amount: string;
    change_percentage: string;
    volume: string;
  }): StockMover => {
    const changePercent = parseFloat(item.change_percentage.replace("%", ""));
    return {
      symbol: item.ticker,
      name: item.ticker,
      price: parseFloat(item.price),
      change: parseFloat(item.change_amount),
      changePercent,
      volume: formatVolume(parseInt(item.volume, 10)),
    };
  };

  const gainers = (data.top_gainers || []).slice(0, 10).map(mapMover);
  const losers = (data.top_losers || []).slice(0, 10).map(mapMover);

  const result = { gainers, losers };
  // Cache movers for 4 hours
  setCache(cacheKey, result, 4 * HOUR);
  return result;
}
