import { Market } from "@/types/domain";

export const CORE_MARKETS: Market[] = ["BTC", "ETH", "NQ", "ES"];

export const MARKET_DESCRIPTIONS: Record<Market, string> = {
  BTC: "Briefing video zilnic pentru momentum crypto si reactii in zone de lichiditate.",
  ETH: "Context video zilnic pentru ETH, cu focus pe rotatii si reactii intraday.",
  NQ: "Analiza video zilnica pentru NQ, structurata pentru sesiunea principala.",
  ES: "Briefing video zilnic pentru ES, orientat spre context clar si executie disciplinata.",
};
