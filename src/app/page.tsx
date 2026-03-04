import SPChart from "@/components/SPChart";
import MoversTable from "@/components/MoversTable";
import MarketSummary from "@/components/MarketSummary";
import { getMarketData } from "@/lib/market-data";

export const dynamic = "force-dynamic";

export default function Home() {
  const data = getMarketData("3M");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <MarketSummary lastUpdated={data.lastUpdated} />

      <div className="mt-6">
        <SPChart initialData={data.chart} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MoversTable
          title="Top 10 Daily Gainers"
          data={data.gainers}
          type="gainers"
        />
        <MoversTable
          title="Top 10 Daily Losers"
          data={data.losers}
          type="losers"
        />
      </div>

      <footer className="mt-12 border-t border-sage/20 py-6 text-center text-xs text-eerie/30">
        <p>MyFintel — Financial Intelligence Hub</p>
        <p className="mt-1">
          Market data is simulated. For informational purposes only.
        </p>
      </footer>
    </div>
  );
}
