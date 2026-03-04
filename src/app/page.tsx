import Dashboard from "@/components/Dashboard";
import MarketSummary from "@/components/MarketSummary";
import { getMarketData } from "@/lib/market-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getMarketData("3M");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <MarketSummary lastUpdated={data.lastUpdated} />

      <Dashboard
        initialChartData={data.chart}
        gainers={data.gainers}
        losers={data.losers}
      />

      <footer className="mt-12 border-t border-sage/20 py-6 text-center text-xs text-eerie/30">
        <p>MyFintel — Financial Intelligence Hub</p>
        <p className="mt-1">
          Market data is simulated. For informational purposes only.
        </p>
      </footer>
    </div>
  );
}
