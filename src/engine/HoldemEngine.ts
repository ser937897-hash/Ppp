import {
  CalculationReport,
  CATEGORY_NAMES,
  OpponentDetail,
  RANK_NAMES,
  SUIT_SYMBOLS,
} from '../types/poker';

export class HoldemEngine {
  private static preflopPercentile = new Int32Array(52 * 52);
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    interface ComboScore {
      c1: number;
      c2: number;
      score: number;
    }

    const combos: ComboScore[] = [];

    for (let c1 = 0; c1 < 52; c1++) {
      for (let c2 = c1 + 1; c2 < 52; c2++) {
        const r1 = Math.max(Math.floor(c1 / 4), Math.floor(c2 / 4));
        const r2 = Math.min(Math.floor(c1 / 4), Math.floor(c2 / 4));
        const suited = c1 % 4 === c2 % 4;
        const gap = r1 - r2;

        let score = 0;
        if (r1 === r2) {
          // Pocket pairs
          score = 230 + r1 * 29 + (r1 >= 5 ? 55 : 0);
        } else {
          let s = r1 * 22 + r2 * 12;
          if (suited) s += 45;
          switch (gap) {
            case 1:
              s += 25;
              break;
            case 2:
              s += 12;
              break;
            case 3:
              s += 4;
              break;
            default:
              if (gap >= 5) s -= 15;
              break;
          }
          if (r1 === 12) s += 35;
          if (r1 >= 9 && r2 >= 8) s += 25;
          score = s;
        }
        combos.push({ c1, c2, score });
      }
    }

    combos.sort((a, b) => b.score - a.score);

    for (let i = 0; i < combos.length; i++) {
      const pct = Math.floor((i * 100) / combos.length) + 1;
      const combo = combos[i];
      this.preflopPercentile[combo.c1 * 52 + combo.c2] = pct;
      this.preflopPercentile[combo.c2 * 52 + combo.c1] = pct;
    }

    this.initialized = true;
  }

  public static isHandInTopRange(c1: number, c2: number, rangePercent: number): boolean {
    if (!this.initialized) this.initialize();
    if (rangePercent >= 100) return true;
    return this.preflopPercentile[c1 * 52 + c2] <= rangePercent;
  }

  public static getHandPercentile(c1: number, c2: number): number {
    if (!this.initialized) this.initialize();
    return this.preflopPercentile[c1 * 52 + c2];
  }

  public static cardToString(card: number): string {
    if (card < 0 || card > 51) return '';
    const rank = Math.floor(card / 4);
    const suit = card % 4;
    return `${RANK_NAMES[rank]}${SUIT_SYMBOLS[suit]}`;
  }

  public static evaluateCards(cards: number[]): number {
    const rankCounts = new Int32Array(13);
    const suitCounts = new Int32Array(4);
    const suitMasks = new Int32Array(4);
    let rankMask = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const rank = Math.floor(card / 4);
      const suit = card % 4;
      rankCounts[rank]++;
      suitCounts[suit]++;
      const bit = 1 << rank;
      suitMasks[suit] |= bit;
      rankMask |= bit;
    }

    let flushSuit = -1;
    for (let s = 0; s < 4; s++) {
      if (suitCounts[s] >= 5) {
        flushSuit = s;
        break;
      }
    }

    if (flushSuit !== -1) {
      const sfHigh = this.findStraightHighRank(suitMasks[flushSuit]);
      if (sfHigh !== -1) return (8 << 20) | sfHigh;
    }

    let quads = -1;
    let trips1 = -1;
    let trips2 = -1;
    let pair1 = -1;
    let pair2 = -1;

    for (let r = 12; r >= 0; r--) {
      const count = rankCounts[r];
      if (count === 4) {
        quads = r;
      } else if (count === 3) {
        if (trips1 === -1) trips1 = r;
        else trips2 = r;
      } else if (count === 2) {
        if (pair1 === -1) pair1 = r;
        else if (pair2 === -1) pair2 = r;
      }
    }

    if (quads !== -1) {
      const kicker = this.highestKicker(rankMask, quads);
      return (7 << 20) | (quads << 16) | kicker;
    }

    if (trips1 !== -1 && (trips2 !== -1 || pair1 !== -1)) {
      const second = Math.max(trips2, pair1);
      return (6 << 20) | (trips1 << 16) | (second << 12);
    }

    if (flushSuit !== -1) {
      return (5 << 20) | this.keepTopNBits(suitMasks[flushSuit], 5);
    }

    const straightHigh = this.findStraightHighRank(rankMask);
    if (straightHigh !== -1) {
      return (4 << 20) | straightHigh;
    }

    if (trips1 !== -1) {
      const kickers = this.keepTopNBits(rankMask ^ (1 << trips1), 2);
      return (3 << 20) | (trips1 << 16) | kickers;
    }

    if (pair1 !== -1 && pair2 !== -1) {
      const kicker = this.highestKicker(rankMask, pair1, pair2);
      return (2 << 20) | (pair1 << 16) | (pair2 << 12) | kicker;
    }

    if (pair1 !== -1) {
      const kickers = this.keepTopNBits(rankMask ^ (1 << pair1), 3);
      return (1 << 20) | (pair1 << 16) | kickers;
    }

    return this.keepTopNBits(rankMask, 5);
  }

  private static findStraightHighRank(mask: number): number {
    for (let high = 12; high >= 4; high--) {
      const pattern = 0b11111 << (high - 4);
      if ((mask & pattern) === pattern) return high;
    }
    const wheel = (1 << 12) | 0b1111;
    if ((mask & wheel) === wheel) return 3; // 5-high straight
    return -1;
  }

  private static keepTopNBits(mask: number, n: number): number {
    let res = 0;
    let count = 0;
    for (let r = 12; r >= 0; r--) {
      if ((mask & (1 << r)) !== 0) {
        res |= 1 << r;
        if (++count === n) break;
      }
    }
    return res;
  }

  private static highestKicker(mask: number, ex1: number, ex2 = -1): number {
    for (let r = 12; r >= 0; r--) {
      if (r !== ex1 && r !== ex2 && (mask & (1 << r)) !== 0) {
        return r;
      }
    }
    return 0;
  }

  public static getHandCategory(score: number): number {
    return (score >> 20) & 0xf;
  }

  /**
   * Fast Monte Carlo Poker Simulation matching the document
   */
  public static analyzeSituation(
    heroCards: number[],
    boardCards: number[],
    opponentsCount = 1,
    oppRangePercent = 35,
    iterations = 15000,
    knownOpponentsCards: [number | null, number | null][] = []
  ): CalculationReport {
    this.initialize();

    if (heroCards.length < 2) {
      return {
        heroEquityPercent: 0,
        oppEquityPercent: 0,
        tiePercent: 0,
        heroHandName: 'Ожидание карт',
        outsCount: 0,
        nextStreetImprovePercent: 0,
        outCardsList: [],
        oppStrongHandPct: 0,
        oppCategoryBreakdown: [],
        threatLevel: 'НЕИЗВЕСТНО',
        opponentsDetail: [],
      };
    }

    const used = new Uint8Array(52);
    for (const c of heroCards) used[c] = 1;
    for (const c of boardCards) used[c] = 1;

    // Check known cards of opponents
    for (let i = 0; i < opponentsCount; i++) {
      const oppHand = knownOpponentsCards[i];
      if (oppHand) {
        if (oppHand[0] !== null) used[oppHand[0]] = 1;
        if (oppHand[1] !== null) used[oppHand[1]] = 1;
      }
    }

    const remainingDeck: number[] = [];
    for (let c = 0; c < 52; c++) {
      if (!used[c]) remainingDeck.push(c);
    }

    // Generate pool of valid opponent hole pairs matching the range filter
    const validOppPairs: [number, number][] = [];
    for (let i = 0; i < remainingDeck.length; i++) {
      for (let j = i + 1; j < remainingDeck.length; j++) {
        const c1 = remainingDeck[i];
        const c2 = remainingDeck[j];
        if (this.isHandInTopRange(c1, c2, oppRangePercent)) {
          validOppPairs.push([c1, c2]);
        }
      }
    }

    const boardMissing = 5 - boardCards.length;
    let wins = 0;
    let ties = 0;
    const oppCatHistogram = new Int32Array(9);

    const heroFull = new Int32Array(7);
    const oppFull = new Int32Array(7);
    heroFull[0] = heroCards[0];
    heroFull[1] = heroCards[1];
    for (let b = 0; b < boardCards.length; b++) {
      heroFull[2 + b] = boardCards[b];
      oppFull[2 + b] = boardCards[b];
    }

    const remDeckCopy = new Int32Array(remainingDeck);
    const remLen = remDeckCopy.length;
    const oppWins = new Float64Array(opponentsCount);
    const oppTies = new Float64Array(opponentsCount);

    // Prepare known opponent cards lookup
    const hasKnownOppCards = new Array<boolean>(opponentsCount);
    for (let o = 0; o < opponentsCount; o++) {
      const pair = knownOpponentsCards[o];
      hasKnownOppCards[o] = !!(pair && pair[0] !== null && pair[1] !== null);
    }

    // Number of random cards we need to pull from remaining deck per iteration
    // For missing board: boardMissing
    // For each unknown opponent: 2 cards
    let unknownOpponentsCount = 0;
    for (let o = 0; o < opponentsCount; o++) {
      if (!hasKnownOppCards[o]) unknownOpponentsCount++;
    }
    const neededFromDeck = boardMissing + unknownOpponentsCount * 2;
    const validPairsLen = validOppPairs.length;

    for (let iter = 0; iter < iterations; iter++) {
      // Shuffle required random cards from remaining deck
      let drawnCount = 0;
      let k = 0;
      while (drawnCount < neededFromDeck && k < remLen) {
        const randIdx = k + Math.floor(Math.random() * (remLen - k));
        const candidate = remDeckCopy[randIdx];
        remDeckCopy[randIdx] = remDeckCopy[k];
        remDeckCopy[k] = candidate;
        k++;
        drawnCount++;
      }

      // 1. Fill missing board cards
      for (let m = 0; m < boardMissing; m++) {
        heroFull[2 + boardCards.length + m] = remDeckCopy[m];
        oppFull[2 + boardCards.length + m] = remDeckCopy[m];
      }

      const heroCardsArr: number[] = [
        heroFull[0],
        heroFull[1],
        heroFull[2],
        heroFull[3],
        heroFull[4],
        heroFull[5],
        heroFull[6],
      ];
      const heroScore = this.evaluateCards(heroCardsArr);

      let bestOppScore = -1;
      let unknownCursor = boardMissing;
      let primaryOppScore = -1;

      const oppScores: number[] = [];

      for (let o = 0; o < opponentsCount; o++) {
        let oc1: number;
        let oc2: number;

        if (hasKnownOppCards[o]) {
          oc1 = knownOpponentsCards[o]![0]!;
          oc2 = knownOpponentsCards[o]![1]!;
        } else {
          // If first opponent and we have valid pairs from range filter
          if (o === 0 && validPairsLen > 0) {
            const chosenPair = validOppPairs[Math.floor(Math.random() * validPairsLen)];
            oc1 = chosenPair[0];
            oc2 = chosenPair[1];
          } else {
            oc1 = remDeckCopy[unknownCursor++];
            oc2 = remDeckCopy[unknownCursor++];
          }
        }

        oppFull[0] = oc1;
        oppFull[1] = oc2;
        const currentOppScore = this.evaluateCards([
          oppFull[0],
          oppFull[1],
          oppFull[2],
          oppFull[3],
          oppFull[4],
          oppFull[5],
          oppFull[6],
        ]);
        oppScores.push(currentOppScore);

        if (o === 0) primaryOppScore = currentOppScore;
        if (currentOppScore > bestOppScore) {
          bestOppScore = currentOppScore;
        }
      }

      const bestOppCat = Math.min(8, Math.max(0, bestOppScore >> 20));
      oppCatHistogram[bestOppCat]++;

      // Calculate winner of this hand
      let winningScore = heroScore;
      for (let o = 0; o < opponentsCount; o++) {
        if (oppScores[o] > winningScore) {
          winningScore = oppScores[o];
        }
      }

      // Check who tied or won
      let tieCount = 0;
      if (heroScore === winningScore) tieCount++;
      for (let o = 0; o < opponentsCount; o++) {
        if (oppScores[o] === winningScore) tieCount++;
      }

      if (tieCount > 1) {
        if (heroScore === winningScore) ties += 1.0 / tieCount;
        for (let o = 0; o < opponentsCount; o++) {
          if (oppScores[o] === winningScore) oppTies[o] += 1.0 / tieCount;
        }
      } else {
        if (heroScore === winningScore) wins += 1;
        for (let o = 0; o < opponentsCount; o++) {
          if (oppScores[o] === winningScore) oppWins[o] += 1;
        }
      }
    }

    const heroEquity = ((wins + ties) / iterations) * 100.0;
    const oppEquity = Math.max(0, 100.0 - heroEquity);
    const tiePct = (ties / iterations) * 100.0;

    // Detailed per-opponent equity
    const opponentsDetail: OpponentDetail[] = [];
    for (let o = 0; o < opponentsCount; o++) {
      const eq = ((oppWins[o] + oppTies[o]) / iterations) * 100.0;
      const kCards = knownOpponentsCards[o] || [null, null];

      let handName = 'Спектр Топ ' + oppRangePercent + '%';
      if (kCards[0] !== null && kCards[1] !== null) {
        const knownOppCurrent = [kCards[0]!, kCards[1]!, ...boardCards];
        const s = this.evaluateCards(knownOppCurrent);
        const cat = s >> 20;
        handName =
          boardCards.length === 0
            ? `Префлоп (${this.getHandPercentile(kCards[0]!, kCards[1]!)}%)`
            : CATEGORY_NAMES[Math.min(8, Math.max(0, cat))];
      }

      opponentsDetail.push({
        id: o + 1,
        cards: kCards,
        equityPercent: eq,
        currentHandName: handName,
      });
    }

    // Opponent strong hand percentage (Two Pair and above: categories 2..8)
    let strongCount = 0;
    for (let cat = 2; cat <= 8; cat++) {
      strongCount += oppCatHistogram[cat];
    }
    const oppStrongPct = (strongCount / iterations) * 100.0;

    const breakdown: [string, number][] = [];
    for (let cat = 8; cat >= 0; cat--) {
      const pct = (oppCatHistogram[cat] / iterations) * 100.0;
      if (pct >= 1.5) {
        breakdown.push([CATEGORY_NAMES[cat], pct]);
      }
    }

    let threat: 'ВЫСОКАЯ УГРОЗА' | 'СРЕДНЯЯ УГРОЗА' | 'НИЗКАЯ УГРОЗА';
    if (oppEquity >= 60.0 || oppStrongPct >= 45.0) {
      threat = 'ВЫСОКАЯ УГРОЗА';
    } else if (oppEquity >= 42.0 || oppStrongPct >= 25.0) {
      threat = 'СРЕДНЯЯ УГРОЗА';
    } else {
      threat = 'НИЗКАЯ УГРОЗА';
    }

    // Outs calculation for Flop and Turn
    const currentKnown = [...heroCards, ...boardCards];
    const currentScore = this.evaluateCards(currentKnown);
    const currentCategory = currentScore >> 20;

    const handName =
      boardCards.length === 0
        ? `Префлоп (Топ ${this.getHandPercentile(heroCards[0], heroCards[1])}% рук)`
        : CATEGORY_NAMES[Math.min(8, Math.max(0, currentCategory))];

    const outsList: number[] = [];
    if (boardCards.length >= 3 && boardCards.length <= 4) {
      for (const card of remainingDeck) {
        const nextStreetCards = [...currentKnown, card];
        const nextScore = this.evaluateCards(nextStreetCards);
        const nextCat = nextScore >> 20;

        if (
          nextCat > currentCategory &&
          (nextCat >= 2 || nextScore > currentScore + (1 << 16))
        ) {
          outsList.push(card);
        }
      }
    }

    const nextStreetChance =
      remainingDeck.length > 0 && outsList.length > 0
        ? (outsList.length / remainingDeck.length) * 100.0
        : 0;

    return {
      heroEquityPercent: heroEquity,
      oppEquityPercent: oppEquity,
      tiePercent: tiePct,
      heroHandName: handName,
      outsCount: outsList.length,
      nextStreetImprovePercent: nextStreetChance,
      outCardsList: outsList.sort((a, b) => b - a),
      oppStrongHandPct: oppStrongPct,
      oppCategoryBreakdown: breakdown.slice(0, 4),
      threatLevel: threat,
      opponentsDetail,
    };
  }
}
HoldemEngine.initialize();
