export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

export interface MarketData {
  chart: ChartDataPoint[];
  gainers: StockMover[];
  losers: StockMover[];
  lastUpdated: string;
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";
