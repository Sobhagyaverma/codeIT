import { aiCoach } from "./api";
import type { AiCoachRequest, AiCoachResponse } from "./types";

/**
 * Streams coach output to the UI.
 * Currently uses the non-streaming /api/ai/coach endpoint and emits one chunk.
 * Replace with SSE/ReadableStream when backend exposes POST /api/ai/stream.
 */
export async function streamAiAction(
  payload: AiCoachRequest,
  onToken: (chunk: string) => void,
  signal?: AbortSignal
): Promise<AiCoachResponse> {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const response = await aiCoach(payload);
  onToken(response.content || "");
  return response;
}
