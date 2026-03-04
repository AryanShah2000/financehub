import { NextRequest, NextResponse } from "next/server";
import { getMarketData } from "@/lib/market-data";
import { TimeRange } from "@/lib/types";

const VALID_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "YTD"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const range = (searchParams.get("range") || "3M") as TimeRange;

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json(
      { error: "Invalid range. Use: " + VALID_RANGES.join(", ") },
      { status: 400 }
    );
  }

  const data = getMarketData(range);
  return NextResponse.json(data);
}
