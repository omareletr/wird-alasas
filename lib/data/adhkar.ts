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
    transliteration: "Hasbunallahu wa ni'mal-Wakeel",
    translation:
      "Sufficient for us is Allah, and He is the best disposer of affairs.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 1,
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ",
    transliteration: "Astaghfirullah al-'Azeem",
    translation: "I seek forgiveness from Allah, the Most Great.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 2,
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ",
    transliteration: "La ilaha illallahul-Malikul-Haqqul-Mubeen",
    translation: "There is no deity but Allah, the King, the Clear Truth.",
    targets: { full: 100, shortened: 10 },
  },
  {
    index: 3,
    arabic:
      "اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِهِ وَصَحْبِهِ وَسَلِّمْ",
    transliteration:
      "Allahumma salli 'ala Sayyidina Muhammadin wa 'ala alihi wa sahbihi wa sallim",
    translation:
      "O Allah, send prayers and peace upon our master Muhammad and upon his family and companions.",
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
