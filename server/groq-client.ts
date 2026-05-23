/**
 * Groq API Client for Lottery Analysis
 * Handles communication with Groq API for AI-powered predictions
 */

import { LotteryStats } from "./lottery-analysis";

export interface GroqAnalysisResponse {
  analysis: string;
  predictions: number[];
  confidence: number;
  reasoning: string;
}

/**
 * Call Groq API for lottery analysis
 * @param apiKey - User's Groq API key
 * @param stats - Statistical analysis of lottery data
 * @param lotteryType - Type of lottery (lotofacil or megasena)
 * @param previousPrediction - Statistical prediction to enhance
 */
export async function analyzeWithGroq(
  apiKey: string,
  stats: LotteryStats,
  lotteryType: "lotofacil" | "megasena",
  previousPrediction: number[]
): Promise<GroqAnalysisResponse> {
  const lotteryName = lotteryType === "lotofacil" ? "Lotofácil" : "Mega Sena";

  const prompt = `You are an expert lottery analyst. Analyze the following lottery data and provide predictions for the next draw.

Lottery Type: ${lotteryName}
Total Draws Analyzed: ${stats.totalDraws}

STATISTICAL ANALYSIS:
- Most Frequent Numbers: ${stats.hotNumbers.join(", ")}
- Least Frequent Numbers (Cold): ${stats.coldNumbers.join(", ")}
- Average Number Frequency: ${stats.averageFrequency.toFixed(2)}
- Most Frequent Number: ${stats.mostFrequentNumber}
- Least Frequent Number: ${stats.leastFrequentNumber}

TOP NUMBER PAIRS (appear together frequently):
${stats.topPairs
  .slice(0, 10)
  .map((p) => `- ${p.pair[0]} & ${p.pair[1]}: ${p.frequency} times`)
  .join("\n")}

NUMBER DISTRIBUTION:
- Low Range (1-${Math.floor(stats.distribution.low / stats.totalDraws)}): ${stats.distribution.low} occurrences
- Mid Range: ${stats.distribution.mid} occurrences
- High Range: ${stats.distribution.high} occurrences

INITIAL STATISTICAL PREDICTION: ${previousPrediction.join(", ")}

Based on this analysis, provide:
1. A detailed analysis of the patterns you observe
2. Your prediction for the next ${lotteryType === "lotofacil" ? "15" : "6"} numbers (in ascending order)
3. Your confidence level (0-100)
4. Brief reasoning for your prediction

Format your response as JSON with the following structure:
{
  "analysis": "detailed analysis text",
  "predictions": [list of numbers],
  "confidence": number between 0 and 100,
  "reasoning": "brief reasoning"
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Groq API");
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Groq response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      analysis: parsed.analysis || "",
      predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 50,
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to analyze with Groq: ${errorMessage}`);
  }
}

/**
 * Validate Groq API key by making a test request
 */
export async function validateGroqApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
