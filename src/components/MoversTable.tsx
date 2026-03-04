"use client";

import { StockMover } from "@/lib/types";

interface MoversTableProps {
  title: string;
  data: StockMover[];
  type: "gainers" | "losers";
  onSelectStock?: (symbol: string) => void;
}

export default function MoversTable({ title, data, type, onSelectStock }: MoversTableProps) {
  const isGainer = type === "gainers";

  return (
    <div className="rounded-xl border border-sage/20 bg-eerie p-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`h-2 w-2 rounded-full ${
            isGainer ? "bg-moss-light" : "bg-red-400"
          }`}
        />
        <h3 className="text-base font-semibold text-ivory">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sage/10 text-left text-xs font-medium uppercase tracking-wider text-sage/60">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">Symbol</th>
              <th className="hidden pb-3 pr-4 sm:table-cell">Name</th>
              <th className="pb-3 pr-4 text-right">Price</th>
              <th className="pb-3 pr-4 text-right">Change</th>
              <th className="pb-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {data.map((stock, index) => (
              <tr
                key={stock.symbol}
                onClick={() => onSelectStock?.(stock.symbol)}
                className={`border-b border-sage/5 transition-colors hover:bg-sage/5 ${
                  onSelectStock ? "cursor-pointer" : ""
                }`}
              >
                <td className="py-3 pr-4 text-sage/40">{index + 1}</td>
                <td className="py-3 pr-4 font-medium text-ivory">
                  {stock.symbol}
                </td>
                <td className="hidden py-3 pr-4 text-sage sm:table-cell">
                  {stock.name}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-ivory">
                  ${stock.price.toFixed(2)}
                </td>
                <td className="py-3 pr-4 text-right">
                  <span
                    className={`font-mono text-sm ${
                      isGainer ? "text-moss-light" : "text-red-400"
                    }`}
                  >
                    {isGainer ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3 text-right text-sage/60">{stock.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
