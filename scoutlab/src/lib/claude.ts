import Anthropic from "@anthropic-ai/sdk";
import type { ReportType, ReportTone } from "../types";
import { buildPrompt } from "./prompts";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY as string,
  dangerouslyAllowBrowser: true,
});

export interface ReportFormData {
  type: ReportType;
  title: string;
  team?: string;
  rival?: string;
  playerName?: string;
  position?: string;
  competition: string;
  date?: string;
  sources: string[];
  extra_notes: string;
  tone: ReportTone;
}

export async function generateReport(data: ReportFormData): Promise<string> {
  const prompt = buildPrompt(data);
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  return (message.content[0] as { text: string }).text;
}
