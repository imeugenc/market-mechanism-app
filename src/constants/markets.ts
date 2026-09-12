import { Market } from "@/types/domain";

export const CORE_MARKETS: Market[] = ["BTC", "ETH", "NQ", "ES"];

export const MARKET_DESCRIPTIONS: Record<Market, string> = {
  BTC: "Briefing video zilnic pentru momentum crypto și reacții în zone de lichiditate.",
  ETH: "Context video zilnic pentru ETH, cu accent pe rotații și reacții intraday.",
  NQ: "Analiză video zilnică pentru NQ, structurată pentru sesiunea principală.",
  ES: "Briefing video zilnic pentru ES, orientat spre context clar și execuție disciplinată.",
};
