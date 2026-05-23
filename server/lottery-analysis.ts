/**
 * Lottery Analysis Module
 * Provides statistical analysis functions for lottery data
 */

export interface LotteryStats {
  totalDraws: number;
  numberFrequency: Record<number, number>;
  hotNumbers: number[];
  coldNumbers: number[];
  averageFrequency: number;
  mostFrequentNumber: number;
  leastFrequentNumber: number;
  numberPairs: Record<string, number>;
  topPairs: Array<{ pair: [number, number]; frequency: number }>;
  distribution: {
    low: number; // 1-25 for Lotofácil, 1-30 for Mega Sena
    mid: number; // 26-50
    high: number; // 51+
  };
}

export interface LotteryType {
  name: "lotofacil" | "megasena";
  totalNumbers: number;
  numbersPerDraw: number;
  maxNumber: number;
}

const LOTTERY_TYPES: Record<string, LotteryType> = {
  lotofacil: {
    name: "lotofacil",
    totalNumbers: 25,
    numbersPerDraw: 15,
    maxNumber: 25,
  },
  megasena: {
    name: "megasena",
    totalNumbers: 60,
    numbersPerDraw: 6,
    maxNumber: 60,
  },
};

/**
 * Parse Excel data and extract lottery numbers
 * Expects data to be an array of arrays where each row contains numbers
 */
export function parseLotteryData(
  data: (string | number)[][],
  lotteryType: "lotofacil" | "megasena"
): number[][] {
  const draws: number[][] = [];

  for (const row of data) {
    const numbers: number[] = [];

    for (const cell of row) {
      const num = typeof cell === "string" ? parseInt(cell, 10) : cell;

      if (!isNaN(num) && num > 0 && num <= LOTTERY_TYPES[lotteryType].maxNumber) {
        numbers.push(num);
      }
    }

    // Only add if we have the correct number of draws
    if (numbers.length === LOTTERY_TYPES[lotteryType].numbersPerDraw) {
      draws.push(numbers.sort((a, b) => a - b));
    }
  }

  return draws;
}

/**
 * Calculate comprehensive statistics from lottery draws
 */
export function calculateLotteryStats(
  draws: number[][],
  lotteryType: "lotofacil" | "megasena"
): LotteryStats {
  const lottery = LOTTERY_TYPES[lotteryType];
  const numberFrequency: Record<number, number> = {};
  const numberPairs: Record<string, number> = {};

  // Initialize frequency counters
  for (let i = 1; i <= lottery.maxNumber; i++) {
    numberFrequency[i] = 0;
  }

  // Count frequencies and pairs
  for (const draw of draws) {
    for (const num of draw) {
      numberFrequency[num]++;
    }

    // Count pairs
    for (let i = 0; i < draw.length; i++) {
      for (let j = i + 1; j < draw.length; j++) {
        const pair = [draw[i], draw[j]].sort().join("-");
        numberPairs[pair] = (numberPairs[pair] || 0) + 1;
      }
    }
  }

  // Calculate statistics
  const frequencies = Object.values(numberFrequency);
  const averageFrequency = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;

  const sortedByFrequency = Object.entries(numberFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([num]) => parseInt(num, 10));

  const hotNumbers = sortedByFrequency.slice(0, 10);
  const coldNumbers = sortedByFrequency.slice(-10).reverse();

  // Sort pairs by frequency
  const topPairs = Object.entries(numberPairs)
    .map(([pair, frequency]) => ({
      pair: pair.split("-").map(Number) as [number, number],
      frequency,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);

  // Calculate distribution
  const midPoint = Math.floor(lottery.maxNumber / 3);
  const highPoint = Math.floor((lottery.maxNumber * 2) / 3);

  let distribution = { low: 0, mid: 0, high: 0 };

  for (const draw of draws) {
    for (const num of draw) {
      if (num <= midPoint) distribution.low++;
      else if (num <= highPoint) distribution.mid++;
      else distribution.high++;
    }
  }

  return {
    totalDraws: draws.length,
    numberFrequency,
    hotNumbers,
    coldNumbers,
    averageFrequency,
    mostFrequentNumber: sortedByFrequency[0],
    leastFrequentNumber: sortedByFrequency[sortedByFrequency.length - 1],
    numberPairs,
    topPairs,
    distribution,
  };
}

/**
 * Generate initial prediction based on statistics
 */
export function generateStatisticalPrediction(
  stats: LotteryStats,
  lotteryType: "lotofacil" | "megasena"
): number[] {
  const lottery = LOTTERY_TYPES[lotteryType];
  const prediction: Set<number> = new Set();

  // Add hot numbers (40% of prediction)
  const hotCount = Math.floor(lottery.numbersPerDraw * 0.4);
  for (let i = 0; i < hotCount && i < stats.hotNumbers.length; i++) {
    prediction.add(stats.hotNumbers[i]);
  }

  // Add numbers from top pairs (30% of prediction)
  const pairNumbers = new Set<number>();
  for (const { pair } of stats.topPairs.slice(0, 5)) {
    pairNumbers.add(pair[0]);
    pairNumbers.add(pair[1]);
  }

  pairNumbers.forEach((num) => {
    if (prediction.size < Math.floor(lottery.numbersPerDraw * 0.7)) {
      prediction.add(num);
    }
  });

  // Fill remaining with balanced distribution
  const remaining = lottery.numbersPerDraw - prediction.size;
  const midPoint = Math.floor(lottery.maxNumber / 3);
  const highPoint = Math.floor((lottery.maxNumber * 2) / 3);

  const candidates: number[] = [];
  for (let i = 1; i <= lottery.maxNumber; i++) {
    if (!prediction.has(i)) {
      candidates.push(i);
    }
  }

  // Sort by frequency to get balanced numbers
  candidates.sort((a, b) => stats.numberFrequency[b] - stats.numberFrequency[a]);

  for (let i = 0; i < remaining && i < candidates.length; i++) {
    prediction.add(candidates[i]);
  }

  const result: number[] = [];
  prediction.forEach((num) => result.push(num));
  return result.sort((a, b) => a - b);
}

/**
 * Validate lottery data format
 */
export function validateLotteryData(
  data: unknown,
  lotteryType: "lotofacil" | "megasena"
): boolean {
  if (!Array.isArray(data)) return false;

  const lottery = LOTTERY_TYPES[lotteryType];

  for (const row of data) {
    if (!Array.isArray(row)) return false;

    const validNumbers = row.filter((cell) => {
      const num = typeof cell === "string" ? parseInt(cell, 10) : cell;
      return !isNaN(num) && num > 0 && num <= lottery.maxNumber;
    });

    if (validNumbers.length !== lottery.numbersPerDraw) return false;
  }

  return true;
}
