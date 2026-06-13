import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { userMiddleware } from "@/lib/auth.middleware";
import {
  analyzeDayServer,
  analyzeMealServer,
  analyzeWeekServer,
  readPrescriptionServer,
  chatAssistantServer,
  dietRecommendationsServer,
} from "@/lib/gemini.server";

export const analyzeMealFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ meal: z.string(), diabetesType: z.string() }))
  .handler(async ({ data }) => analyzeMealServer(data.meal, data.diabetesType));

export const analyzeDayFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(
    z.object({
      name: z.string(),
      diabetesType: z.string(),
      fasting: z.number().nullable(),
      meals: z.array(z.object({ description: z.string(), glycemicLevel: z.string() })),
      symptoms: z.array(z.string()),
      medsTaken: z.boolean(),
    }),
  )
  .handler(async ({ data }) => analyzeDayServer(data));

export const analyzeWeekFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ week: z.array(z.unknown()) }))
  .handler(async ({ data }) => analyzeWeekServer(data.week));

export const readPrescriptionFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(z.object({ base64: z.string(), mimeType: z.string() }))
  .handler(async ({ data }) => readPrescriptionServer(data.base64, data.mimeType));

export const chatAssistantFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(
    z.object({
      message: z.string(),
      diabetesType: z.string(),
      name: z.string(),
      recentGlucose: z.number().nullable(),
      history: z.array(z.object({ role: z.string(), content: z.string() })),
    }),
  )
  .handler(async ({ data }) => chatAssistantServer(data));

export const dietRecommendationsFn = createServerFn({ method: "POST" })
  .middleware([userMiddleware])
  .validator(
    z.object({
      name: z.string(),
      diabetesType: z.string(),
      age: z.string(),
      avgGlucose: z.number().nullable(),
    }),
  )
  .handler(async ({ data }) => dietRecommendationsServer(data));
