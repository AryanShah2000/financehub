"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createChart, IChartApi, LineStyle, LineSeries } from "lightweight-charts";
import { ChartDataPoint, TimeRange } from "@/lib/types";
import { SP500_COMPANIES } from "@/lib/market-data";

const TIME_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "YTD", "ALL"];

interface SPChartProps {
  initialData: ChartDataPoint[];
  selectedSymbol: string | null;
  onSymbolChange: (symbol: string | null) => void;
}

export default function SPChart({ initialData, selectedSymbol, onSymbolChange }: SPChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>("3M");
  const [chartData, setChartData] = useState<ChartDataPoint[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return SP500_COMPANIES.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const selectedCompany = useMemo(() => {
    if (!selectedSymbol) return null;
    return SP500_COMPANIES.find((c) => c.symbol === selectedSymbol) || null;
  }, [selectedSymbol]);

  const displayName = selectedCompany ? selectedCompany.name : "S&P 500";
  const displaySymbol = selectedSymbol || "SPX";

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const firstValue = chartData.length > 0 ? chartData[0].value : 0;
  const change = latestValue - firstValue;
  const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data when symbol or range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ range: activeRange });
        if (selectedSymbol) params.set("symbol", selectedSymbol);
        const res = await fetch(`/api/market?${params}`);
        const data = await res.json();
        setChartData(data.chart);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSymbol, activeRange]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#1B1B1B" },
        textColor: "#C4C5BA",
        fontFamily: "Arial, Helvetica, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(196, 197, 186, 0.08)" },
        horzLines: { color: "rgba(196, 197, 186, 0.08)" },
      },
      crosshair: {
        vertLine: {
          color: "#595F39",
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "#595F39",
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: "rgba(196, 197, 186, 0.2)",
      },
      timeScale: {
        borderColor: "rgba(196, 197, 186, 0.2)",
        timeVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: isPositive ? "#595F39" : "#9B2D2D",
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: isPositive ? "#595F39" : "#9B2D2D",
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    lineSeries.setData(
      chartData.map((d) => ({ time: d.time, value: d.value }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData, isPositive]);

  const handleRangeChange = (range: TimeRange) => {
    setActiveRange(range);
  };

  const handleSelectCompany = (symbol: string) => {
    onSymbolChange(symbol);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleClearSymbol = () => {
    onSymbolChange(null);
    setSearchQuery("");
  };

  return (
    <div className="rounded-xl border border-sage/20 bg-eerie p-6">
      {/* Search bar */}
      <div className="mb-4" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setShowDropdown(true);
            }}
            placeholder="Search by company name or ticker..."
            className="w-full rounded-lg border border-sage/20 bg-eerie px-4 py-2.5 text-sm text-ivory placeholder-sage/40 outline-none transition-colors focus:border-moss"
          />
          {selectedSymbol && (
            <button
              onClick={handleClearSymbol}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sage/60 hover:text-ivory text-xs"
            >
              Clear
            </button>
          )}
          {showDropdown && filteredCompanies.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-sage/20 bg-eerie shadow-lg">
              {filteredCompanies.map((company) => (
                <button
                  key={company.symbol}
                  onClick={() => handleSelectCompany(company.symbol)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-sage/10 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="font-medium text-ivory">{company.symbol}</span>
                  <span className="text-sage/60">{company.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ivory">{displayName}</h2>
            <span className="rounded bg-moss/20 px-2 py-0.5 text-xs font-medium text-moss-light">
              {displaySymbol}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-ivory">
              {selectedSymbol ? "$" : ""}
              {latestValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              className={`text-sm font-medium ${
                isPositive ? "text-moss-light" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(2)} ({isPositive ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg bg-eerie border border-sage/20 p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              disabled={loading}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeRange === range
                  ? "bg-moss text-ivory"
                  : "text-sage hover:bg-sage/10 hover:text-ivory"
              } disabled:opacity-50`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-eerie/80">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-moss" />
          </div>
        )}
        <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
      </div>
    </div>
  );
}
