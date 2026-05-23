import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  lottery: router({
    analyze: protectedProcedure
      .input(
        (val: unknown) => {
          if (
            typeof val === "object" &&
            val !== null &&
            "fileBuffer" in val &&
            "lotteryType" in val &&
            "groqApiKey" in val
          ) {
            return val as {
              fileBuffer: Buffer;
              lotteryType: "lotofacil" | "megasena";
              groqApiKey: string;
              fileName: string;
            };
          }
          throw new Error("Invalid input");
        }
      )
      .mutation(async ({ ctx, input }) => {
        const { fileBuffer, lotteryType, groqApiKey, fileName } = input;

        try {
          // Import modules here to avoid issues
          const XLSX = await import("xlsx");
          const { parseLotteryData, calculateLotteryStats, generateStatisticalPrediction } = await import(
            "./lottery-analysis"
          );
          const { analyzeWithGroq, validateGroqApiKey } = await import("./groq-client");
          const { saveLotteryAnalysisRecord } = await import("./db");

          // Validate Groq API key
          const isValidKey = await validateGroqApiKey(groqApiKey);
          if (!isValidKey) {
            throw new Error("Invalid Groq API key");
          }

          // Parse Excel file
          const workbook = XLSX.read(fileBuffer, { type: "buffer" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error("No sheets found in Excel file");
          }

          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

          // Parse lottery data
          const draws = parseLotteryData(data, lotteryType);
          if (draws.length === 0) {
            throw new Error("No valid lottery draws found in Excel file");
          }

          // Calculate statistics
          const stats = calculateLotteryStats(draws, lotteryType);
          const statisticalPrediction = generateStatisticalPrediction(stats, lotteryType);

          // Get AI analysis from Groq
          const groqAnalysis = await analyzeWithGroq(
            groqApiKey,
            stats,
            lotteryType,
            statisticalPrediction
          );

          // Save to database
          await saveLotteryAnalysisRecord(
            ctx.user.id,
            lotteryType,
            fileName,
            draws.length,
            JSON.parse(JSON.stringify(stats)),
            {
              statistical: statisticalPrediction,
              ai: groqAnalysis.predictions,
              confidence: groqAnalysis.confidence,
            },
            groqAnalysis.analysis
          );

          return {
            success: true,
            stats,
            predictions: {
              statistical: statisticalPrediction,
              ai: groqAnalysis.predictions,
              confidence: groqAnalysis.confidence,
            },
            analysis: groqAnalysis.analysis,
            reasoning: groqAnalysis.reasoning,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Analysis failed: ${errorMessage}`);
        }
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getLotteryAnalysesByUserId } = await import("./db");

      try {
        const analyses = await getLotteryAnalysesByUserId(ctx.user.id);
        return analyses.map((a) => ({
          ...a,
          analysisData: JSON.parse(a.analysisData),
          predictions: JSON.parse(a.predictions),
        }));
      } catch (error) {
        console.error("Error fetching history:", error);
        return [];
      }
    }),

    getAnalysis: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val) {
          return val as { id: number };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ ctx, input }) => {
        const { getLotteryAnalysisRecordById } = await import("./db");

        try {
          const analysis = await getLotteryAnalysisRecordById(input.id);
          if (!analysis || analysis.userId !== ctx.user.id) {
            throw new Error("Analysis not found");
          }

          return {
            ...analysis,
            analysisData: JSON.parse(analysis.analysisData),
            predictions: JSON.parse(analysis.predictions),
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to get analysis: ${errorMessage}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
