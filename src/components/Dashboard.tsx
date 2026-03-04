"use client";

import { useState } from "react";
import SPChart from "./SPChart";
import MoversTable from "./MoversTable";
import { ChartDataPoint, StockMover } from "@/lib/types";

interface DashboardProps {
  initialChartData: ChartDataPoint[];
  gainers: StockMover[];
  losers: StockMover[];
}

export default function Dashboard({ initialChartData, gainers, losers }: DashboardProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  return (
    <>
      <div className="mt-6">
        <SPChart
          initialData={initialChartData}
          selectedSymbol={selectedSymbol}
          onSymbolChange={setSelectedSymbol}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MoversTable
          title="Top 10 Daily Gainers"
          data={gainers}
          type="gainers"
          onSelectStock={setSelectedSymbol}
        />
        <MoversTable
          title="Top 10 Daily Losers"
          data={losers}
          type="losers"
          onSelectStock={setSelectedSymbol}
        />
      </div>
    </>
  );
}
