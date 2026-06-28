import { createAzure, type AzureOpenAIProvider } from "@ai-sdk/azure";
import { generateText, streamText, type LanguageModel, type Prompt } from "ai";

import { getEnv, isAzureConfigured } from "@/lib/env";
import { ConfigurationError, UpstreamError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/resilience";

/**
 * Azure OpenAI access for MediaOS.
 *
 * - Chat / reasoning / copy runs through the Vercel AI SDK (`generateChat`,
 *   `streamChat`) so the Operator agent gets first-class tool-calling + streaming.
 * - Image generation (gpt-image) runs through a typed REST helper (`generateImage`)
 *   so we control sizes/quality explicitly and stay resilient.
 *
 * Every entry point is guarded by `isAzureConfigured()` and wrapped in
 * retry + timeout, throwing the typed errors from `@/lib/errors` so the agent
 * and UI can degrade gracefully when credentials are absent.
 */

// SERVER ONLY: this module reads `AZURE_OPENAI_API_KEY`. Never import it from a
// Client Component.

let provider: AzureOpenAIProvider | null = null;

function getAzureProvider(): AzureOpenAIProvider {
  if (!isAzureConfigured()) {
    throw new ConfigurationError("azure", "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.");
  }
  if (provider) return provider;

  const env = getEnv();
  const endpoint = env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");

  provider = createAzure({
    // Classic Azure deployment URLs: {endpoint}/openai/deployments/{deployment}{path}?api-version=...
    baseURL: `${endpoint}/openai`,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion: env.AZURE_OPENAI_API_VERSION,
    useDeploymentBasedUrls: true,
  });
  return provider;
}

/** Returns the configured GPT-4o (or override) chat model for tool-calling loops. */
export function getChatModel(deployment?: string): LanguageModel {
  const env = getEnv();
  return getAzureProvider()(deployment ?? env.AZURE_OPENAI_GPT4O_DEPLOYMENT);
}

type ChatMessages = NonNullable<Prompt["messages"]>;

export interface ChatRequest {
  /** System prompt. Prepended as a system message. */
  system?: string;
  /** Single-turn user prompt. Appended as a user message. */
  prompt?: string;
  /** Multi-turn message history (model messages). */
  messages?: ChatMessages;
  temperature?: number;
  maxOutputTokens?: number;
  /** Override the chat deployment (defaults to the GPT-4o deployment). */
  deployment?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
}

/** Builds a normalized message array so we never hit the prompt/messages union. */
function buildMessages(req: ChatRequest): ChatMessages {
  const messages: ChatMessages = [];
  if (req.system) messages.push({ role: "system", content: req.system });
  if (req.messages?.length) messages.push(...req.messages);
  if (req.prompt) messages.push({ role: "user", content: req.prompt });
  return messages;
}

/**
 * Non-streaming text generation with retry + timeout. Use for analysis,
 * synthesis, and structured single-shot generation.
 */
export async function generateChat(req: ChatRequest): Promise<{ text: string }> {
  const model = getChatModel(req.deployment);
  const messages = buildMessages(req);

  const result = await withRetry(
    (signal) =>
      generateText({
        model,
        messages,
        temperature: req.temperature,
        maxOutputTokens: req.maxOutputTokens,
        maxRetries: 0, // resilience handled here
        abortSignal: signal,
      }),
    {
      signal: req.signal,
      timeoutMs: req.timeoutMs ?? 60000,
      retries: req.retries ?? 2,
      label: "azure.generateChat",
      onRetry: (error, attempt, delayMs) => logger.warn("Retrying Azure chat generation", { attempt, delayMs, error: String(error) }),
    },
  );

  return { text: result.text };
}

/**
 * Streaming text generation. Returns the AI SDK stream result so callers can
 * pipe to a UI message stream (agent runtime) or consume `textStream`. Streaming
 * retries are delegated to the SDK (`maxRetries`) since mid-stream retry is unsafe.
 */
export function streamChat(req: ChatRequest) {
  if (!isAzureConfigured()) {
    throw new ConfigurationError("azure", "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.");
  }
  const model = getChatModel(req.deployment);
  const messages = buildMessages(req);

  return streamText({
    model,
    messages,
    temperature: req.temperature,
    maxOutputTokens: req.maxOutputTokens,
    maxRetries: req.retries ?? 2,
    abortSignal: req.signal,
  });
}

/** Sizes supported by Azure gpt-image deployments. */
export type AzureImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";
export type AzureImageQuality = "low" | "medium" | "high" | "auto";

export interface GenerateImageRequest {
  prompt: string;
  size?: AzureImageSize;
  quality?: AzureImageQuality;
  /** Number of images to generate. Default 1. */
  n?: number;
  /** Override the image deployment (defaults to the configured image deployment). */
  deployment?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
}

export interface GeneratedImage {
  /** Base64-encoded image bytes (no data: prefix). */
  b64: string;
  mimeType: string;
  size: AzureImageSize;
  revisedPrompt?: string;
}

interface AzureImageApiResponse {
  data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
  error?: { message?: string; code?: string };
}

/**
 * Generates images via the Azure OpenAI images REST API (gpt-image). Returns
 * base64 bytes so callers can upload to Supabase Storage. Wrapped in
 * retry + timeout with typed errors.
 */
export async function generateImage(req: GenerateImageRequest): Promise<GeneratedImage[]> {
  if (!isAzureConfigured()) {
    throw new ConfigurationError("azure", "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.");
  }

  const env = getEnv();
  const endpoint = env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
  const deployment = req.deployment ?? env.AZURE_OPENAI_IMAGE_DEPLOYMENT;
  const size: AzureImageSize = req.size ?? "1024x1024";
  const url = `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/images/generations?api-version=${encodeURIComponent(env.AZURE_OPENAI_API_VERSION)}`;

  const body = {
    prompt: req.prompt,
    n: req.n ?? 1,
    size,
    quality: req.quality ?? "high",
    output_format: "png",
  };

  return withRetry(
    async (signal) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": env.AZURE_OPENAI_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new UpstreamError(`Azure image generation failed (${response.status})`, {
          service: "azure",
          status: response.status,
          context: { detail: detail.slice(0, 500) },
        });
      }

      const json = (await response.json()) as AzureImageApiResponse;
      const items = json.data ?? [];
      if (items.length === 0) {
        throw new UpstreamError("Azure image generation returned no images", { service: "azure", status: response.status });
      }

      return items
        .filter((item): item is { b64_json: string; revised_prompt?: string } => typeof item.b64_json === "string")
        .map((item) => ({
          b64: item.b64_json,
          mimeType: "image/png",
          size,
          revisedPrompt: item.revised_prompt,
        }));
    },
    {
      signal: req.signal,
      timeoutMs: req.timeoutMs ?? 120000,
      retries: req.retries ?? 1,
      label: "azure.generateImage",
      onRetry: (error, attempt, delayMs) => logger.warn("Retrying Azure image generation", { attempt, delayMs, error: String(error) }),
    },
  );
}
