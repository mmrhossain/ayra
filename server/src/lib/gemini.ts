import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.ts";

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

const globalForGemini = globalThis as unknown as {
  gemini: GoogleGenAI | null | undefined;
};

export function getGemini(): GoogleGenAI | null {
  if (globalForGemini.gemini !== undefined) {
    return globalForGemini.gemini;
  }

  if (!env.GEMINI_API_KEY) {
    globalForGemini.gemini = null;
    return null;
  }

  globalForGemini.gemini = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  return globalForGemini.gemini;
}
