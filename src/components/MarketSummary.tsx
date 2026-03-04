"use client";

interface MarketSummaryProps {
  lastUpdated: string;
}

export default function MarketSummary({ lastUpdated }: MarketSummaryProps) {
  const date = new Date(lastUpdated);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-eerie">Market Overview</h1>
        <p className="mt-1 text-sm text-eerie/50">
          S&P 500 performance and daily movers
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-eerie/40">{formatted}</p>
        <p className="text-xs text-eerie/40">Last updated: {time}</p>
      </div>
    </div>
  );
}
