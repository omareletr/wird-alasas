import type { DhikrIndex } from "@/lib/storage/schema";

export interface DhikrEntry {
  index: DhikrIndex;
  arabic: string;
  transliteration: string;
  translation: string;
  /** Base targets for full and shortened modes */
  targets: { full: number; shortened: number };
}

export const ADHKAR: DhikrEntry[] = [
  {
    index: 0,
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "Ḥasbuna -'llāhu wa ni'ma -'l - wakīl",
    translation: "God is all we need. What an excellent Guardian is God.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 1,
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ",
    transliteration: "Astaghfiru -'Llāha -'l - 'Aẓīm",
    translation: "I ask the forgiveness of God in His glory.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 2,
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ",
    transliteration: "Lā ilāha illā - Llāhu - 'l - Maliku - 'l - Ḥaqqu -'l - Mubīn",
    translation:
      "There is no God but God, the King, the Real, the Manifestly Apparent.",
    targets: { full: 100, shortened: 10 },
  },
  {
    index: 3,
    arabic:
      "اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِهِ وَصَحْبِهِ وَسَلِّمْ",
    transliteration:
      "Allāhumma, salli 'alā sayyidinā Muḥammadin wa 'alā ālihi wa ṣaḥbihi wa sallim",
    translation:
      "God, extol our noble lord Muhammad, his following, and his Companions and envelope them in perfect peace.",
    targets: { full: 100, shortened: 10 },
  },
];

/** Returns the target count for a dhikr entry given the active mode. */
export function getTarget(
  entry: DhikrEntry,
  mode: "full" | "shortened"
): number {
  return entry.targets[mode];
}
