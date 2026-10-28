import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { wrapKorean } from "./korean-wrap.js";

export function createServer() {
  const server = new McpServer({ name: "korean-wrap-mcp", version: "0.1.0" });
  server.registerTool("wrap_korean_text", {
    title: "Korean phrase-aware line wrapping / 한국어 의미 단위 줄바꿈",
    description: "Wrap a Korean headline at spaces using punctuation and Korean phrase heuristics. Preserves words; normalizes whitespace. Width is approximate display columns, NOT pixels (Hangul=2, Latin=1). Local and deterministic; no LLM or external API. Check fits: false means the width/line limit cannot be met without splitting a word. Review ambiguous phrasing editorially.",
    inputSchema: z.object({
      text: z.string().min(1).max(1000).refine(value => value.trim().length > 0 && value.trim().split(/\s+/u).length <= 80, "Use 1–80 words"),
      maxWidth: z.number().int().min(4).max(200).default(30).describe("Display columns per line; Hangul usually counts as 2. Default 30."),
      maxLines: z.number().int().min(1).max(3).default(3).describe("Maximum lines. Short text stays on one line; default 3."),
    }),
    outputSchema: z.object({
      lines: z.array(z.string()), text: z.string(), widths: z.array(z.number()), fits: z.boolean(),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ text, maxWidth, maxLines }) => {
    const result = wrapKorean(text, { maxWidth, maxLines });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
  });
  return server;
}
