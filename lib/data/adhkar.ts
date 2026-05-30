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
    arabic:
      "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration:
      "Hasbiyallahu la ilaha illa huwa, 'alayhi tawakkaltu wa huwa rabbul 'arshil 'azim",
    translation:
      "Allah is sufficient for me; there is no deity except Him. On Him I have relied, and He is the Lord of the Great Throne.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 1,
    arabic:
      "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration:
      "Astaghfirullaahal-'Azeema alladhee laa ilaaha illaa Huwal-Hayyul-Qayyoomu wa atoobu ilayh",
    translation:
      "I seek forgiveness from Allah the Magnificent, other than Whom there is no deity, the Ever-Living, the Sustainer of existence, and I repent to Him.",
    targets: { full: 200, shortened: 20 },
  },
  {
    index: 2,
    arabic:
      "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration:
      "La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    translation:
      "There is no deity except Allah alone, with no partner or associate; His is the dominion, His is all praise, and He has power over all things.",
    targets: { full: 100, shortened: 10 },
  },
  {
    index: 3,
    arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ",
    transliteration: "Allahumma salli wa sallim 'ala nabiyyina Muhammad",
    translation:
      "O Allah, send prayers and peace upon our Prophet Muhammad.",
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
