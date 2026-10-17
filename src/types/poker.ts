export type Suit = 0 | 1 | 2 | 3; // 0 = ♠, 1 = ♥, 2 = ♦, 3 = ♣
export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // 2..A

export interface Card {
  code: number; // 0..51
  rank: Rank;
  suit: Suit;
  rankLabel: string;
  suitSymbol: string;
  suitColor: string;
}

export interface OpponentDetail {
  id: number;
  cards: (number | null)[];
  equityPercent: number;
  currentHandName: string;
}

export interface CalculationReport {
  heroEquityPercent: number;
  oppEquityPercent: number;
  tiePercent: number;
  heroHandName: string;
  outsCount: number;
  nextStreetImprovePercent: number;
  outCardsList: number[];
  oppStrongHandPct: number; // Вероятность 2 пар и старше у соперника
  oppCategoryBreakdown: [string, number][];
  threatLevel: 'ВЫСОКАЯ УГРОЗА' | 'СРЕДНЯЯ УГРОЗА' | 'НИЗКАЯ УГРОЗА' | 'НЕИЗВЕСТНО';
  opponentsDetail?: OpponentDetail[];
}

export interface RangePreset {
  percent: number;
  title: string;
  description: string;
}

export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;
export const RANK_NAMES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

export const SUIT_COLORS = [
  '#ECEFF1', // ♠ White / Silver
  '#FF5252', // ♥ Red
  '#448AFF', // ♦ Blue
  '#69F0AE', // ♣ Green
] as const;

export const CATEGORY_NAMES = [
  'Старшая карта',
  'Одна пара',
  'Две пары',
  'Сет / Трипс',
  'Стрит',
  'Флеш',
  'Фулл-хаус',
  'Каре',
  'Стрит-флеш',
] as const;
