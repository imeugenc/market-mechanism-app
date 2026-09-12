export type PublishedBias = {
  id: string;
  publishedAt: string;
  market: string;
  forecastedBias: "Bullish" | "Bearish" | "Neutral" | "Range";
  confidence: "Low" | "Medium" | "High";
  outcome: "Correct" | "Partially correct" | "Wrong";
  notes: string;
};

// Curated from the owner-provided bias review export. No account or P&L fields are included.
export const recentBiases: PublishedBias[] = [
  {
    id: "bias-2026-09-11",
    publishedAt: "2026-09-11T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Neutral",
    confidence: "Low",
    outcome: "Partially correct",
    notes:
      "Să vină în zonele de interes să fac un TS și apoi să printeze o schimbare de trend. Sunt reținut din cauza știrilor; ambii sunt în zonă bună și au SMT. Pentru intrare bearish vreau distribuție, SMT și divergență.",
  },
  {
    id: "bias-2026-09-10",
    publishedAt: "2026-09-10T12:00:00.000Z",
    market: "ES + NQ",
    forecastedBias: "Neutral",
    confidence: "Low",
    outcome: "Correct",
    notes: "Neutru după părerea mea, cu tente de bearish.",
  },
  {
    id: "bias-2026-09-09",
    publishedAt: "2026-09-09T12:00:00.000Z",
    market: "ES + NQ",
    forecastedBias: "Bearish",
    confidence: "Medium",
    outcome: "Correct",
    notes:
      "Din zona de interes, slăbiciune în preț și un lower low pe 1H, apoi atacarea BOS-ului pe daily. IFVG-ul daily și închiderea sub PML susțin scenariul bearish.",
  },
  {
    id: "bias-2026-09-08",
    publishedAt: "2026-09-08T12:00:00.000Z",
    market: "NQ",
    forecastedBias: "Neutral",
    confidence: "Low",
    outcome: "Correct",
    notes:
      "Bullish pe NQ, dar cu rezervă. Structurile NQ și ES erau necorelate, iar scenariul de range rămânea relevant.",
  },
  {
    id: "bias-2026-09-07",
    publishedAt: "2026-09-07T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Bullish",
    confidence: "Low",
    outcome: "Partially correct",
    notes: "NQ reacumulare și long din zona de interes. ES: MSS pe 1H și long din posibilă zonă de interes cu CRT pe 6H.",
  },
  {
    id: "bias-2026-09-04",
    publishedAt: "2026-09-04T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Bullish",
    confidence: "Low",
    outcome: "Wrong",
    notes: "Scenariul urmărea un higher high, ideal după reacție în BISI pe 4H, cu retest în zona Fibonacci și PDVAH.",
  },
  {
    id: "bias-2026-09-03",
    publishedAt: "2026-09-03T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Bullish",
    confidence: "Medium",
    outcome: "Correct",
    notes: "Reacumulare pe 1H, apoi zona de long. CRT-ul daily închis peste zona de valori susținea continuarea.",
  },
  {
    id: "bias-2026-09-02",
    publishedAt: "2026-09-02T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Bearish",
    confidence: "Medium",
    outcome: "Partially correct",
    notes: "Așteptare în zona de 0.5 protejată pe 1H sau în rezistența zilei anterioare, apoi short.",
  },
  {
    id: "bias-2026-09-01",
    publishedAt: "2026-09-01T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Bullish",
    confidence: "Medium",
    outcome: "Wrong",
    notes:
      "Scenariul bullish cerea preluare de lichiditate internă, reacție în zona 0.5 OB pe 1H sau 4H și confirmare SMT înainte de continuare.",
  },
  {
    id: "bias-2026-08-31",
    publishedAt: "2026-08-31T12:00:00.000Z",
    market: "NQ + ES",
    forecastedBias: "Bullish",
    confidence: "Medium",
    outcome: "Wrong",
    notes:
      "Scenariul principal era bullish din zona de interes long, cu MSS pe 1H și displacement ca semne de confirmare înainte de continuare.",
  },
];

export const recentBiasProcessNote =
  "Ultimele review-uri arată un proces condițional: zonă de interes, corelare NQ/ES și confirmare de structură înainte de o decizie. Când corelarea sau confirmarea lipsește, biasul rămâne neutru ori cu încredere redusă.";
