import { RequestTier } from "@/types/domain";

export const REQUEST_TIERS: Array<{
  tier: RequestTier;
  title: string;
  description: string;
  deliveryLabel: string;
  turnaround: string;
}> = [
  {
    tier: 2,
    title: "Analiză rapidă",
    description: "Citire rapidă a direcției și nivelul care contează cel mai mult.",
    deliveryLabel: "Răspuns text",
    turnaround: "Maxim 8 ore",
  },
  {
    tier: 5,
    title: "Analiză video personalizată",
    description: "Analiză video personalizată, livrată clar și concis pentru activul solicitat.",
    deliveryLabel: "Video personalizat",
    turnaround: "Maxim 8 ore",
  },
  {
    tier: 10,
    title: "Analiză video premium",
    description: "Analiză video premium, cu mai mult context, structură și profunzime.",
    deliveryLabel: "Video premium",
    turnaround: "Maxim 8 ore",
  },
];
