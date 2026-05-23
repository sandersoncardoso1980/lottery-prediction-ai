import { describe, expect, it } from "vitest";
import {
  parseLotteryData,
  calculateLotteryStats,
  generateStatisticalPrediction,
  validateLotteryData,
} from "./lottery-analysis";

describe("Lottery Analysis", () => {
  describe("parseLotteryData", () => {
    it("should parse valid Lotofácil data", () => {
      const data = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      ];

      const draws = parseLotteryData(data, "lotofacil");

      expect(draws).toHaveLength(2);
      expect(draws[0]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it("should parse valid Mega Sena data", () => {
      const data = [
        [1, 2, 3, 4, 5, 6],
        [10, 20, 30, 40, 50, 60],
      ];

      const draws = parseLotteryData(data, "megasena");

      expect(draws).toHaveLength(2);
      expect(draws[0]).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should filter out invalid rows", () => {
      const data = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [1, 2, 3], // Invalid - too few numbers
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      ];

      const draws = parseLotteryData(data, "lotofacil");

      expect(draws).toHaveLength(2);
    });

    it("should filter out numbers outside valid range", () => {
      const data = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 26], // 26 is invalid for Lotofácil
      ];

      const draws = parseLotteryData(data, "lotofacil");

      expect(draws).toHaveLength(0);
    });
  });

  describe("calculateLotteryStats", () => {
    it("should calculate statistics correctly", () => {
      const draws = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17],
      ];

      const stats = calculateLotteryStats(draws, "lotofacil");

      expect(stats.totalDraws).toBe(3);
      expect(stats.hotNumbers).toContain(1);
      expect(stats.hotNumbers).toContain(2);
      expect(stats.mostFrequentNumber).toBe(1);
      expect(stats.topPairs.length).toBeGreaterThan(0);
    });

    it("should identify hot and cold numbers", () => {
      const draws = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      ];

      const stats = calculateLotteryStats(draws, "lotofacil");

      expect(stats.hotNumbers.slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(stats.coldNumbers).toContain(25);
    });

    it("should calculate distribution correctly", () => {
      const draws = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      ];

      const stats = calculateLotteryStats(draws, "lotofacil");

      expect(stats.distribution.low).toBeGreaterThan(0);
      expect(stats.distribution.low + stats.distribution.mid + stats.distribution.high).toBe(15);
    });
  });

  describe("generateStatisticalPrediction", () => {
    it("should generate valid predictions for Lotofácil", () => {
      const draws = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      ];

      const stats = calculateLotteryStats(draws, "lotofacil");
      const prediction = generateStatisticalPrediction(stats, "lotofacil");

      expect(prediction).toHaveLength(15);
      expect(new Set(prediction).size).toBe(15); // All unique
      expect(prediction.every((n) => n >= 1 && n <= 25)).toBe(true);
    });

    it("should generate valid predictions for Mega Sena", () => {
      const draws = [
        [1, 2, 3, 4, 5, 6],
        [10, 20, 30, 40, 50, 60],
      ];

      const stats = calculateLotteryStats(draws, "megasena");
      const prediction = generateStatisticalPrediction(stats, "megasena");

      expect(prediction).toHaveLength(6);
      expect(new Set(prediction).size).toBe(6);
      expect(prediction.every((n) => n >= 1 && n <= 60)).toBe(true);
    });

    it("should include hot numbers in prediction", () => {
      const draws = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      ];

      const stats = calculateLotteryStats(draws, "lotofacil");
      const prediction = generateStatisticalPrediction(stats, "lotofacil");

      const hotInPrediction = stats.hotNumbers.slice(0, 5).filter((n) => prediction.includes(n));
      expect(hotInPrediction.length).toBeGreaterThan(0);
    });
  });

  describe("validateLotteryData", () => {
    it("should validate correct Lotofácil data", () => {
      const data = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      ];

      expect(validateLotteryData(data, "lotofacil")).toBe(true);
    });

    it("should reject invalid data", () => {
      const data = [
        [1, 2, 3], // Too few numbers
      ];

      expect(validateLotteryData(data, "lotofacil")).toBe(false);
    });

    it("should reject non-array data", () => {
      expect(validateLotteryData("invalid", "lotofacil")).toBe(false);
    });

    it("should reject data with numbers out of range", () => {
      const data = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 26], // 26 > 25
      ];

      expect(validateLotteryData(data, "lotofacil")).toBe(false);
    });
  });
});
