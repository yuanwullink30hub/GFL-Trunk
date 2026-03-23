/**
 * Garden For Life — Multi-Provider AI Service
 *
 * Unified interface for OpenAI (ChatGPT), Google Gemini, and xAI (Grok).
 * Gemini uses the official @google/genai SDK with "Thinking" mode.
 * OpenAI / Grok use their REST APIs (OpenAI-compatible format).
 *
 * Usage:
 *   const { callAI, getAvailableProviders } = require('./aiProviders');
 *   const result = await callAI({ provider: 'gemini', messages, ... });
 */
const config = require('../config');
const { GoogleGenAI } = require('@google/genai');
const Anthropic = require('@anthropic-ai/sdk');

// ─────────────────────────────────────────────────────────────
// Provider registry
// ─────────────────────────────────────────────────────────────

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    buildRequest,        // shared — OpenAI-compatible format
    parseResponse,       // shared
    getUrl: (cfg) => `${cfg.baseUrl}/chat/completions`,
    getHeaders: (cfg) => ({
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  gemini: {
    name: 'Google Gemini 2.5 Pro',
    useSDK: true,
  },

  grok: {
    name: 'xAI Grok',
    buildRequest,        // Grok uses OpenAI-compatible API
    parseResponse,       // same response shape
    getUrl: (cfg) => `${cfg.baseUrl}/chat/completions`,
    getHeaders: (cfg) => ({
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    }),
  },

  claude: {
    name: 'Claude van Anthropic',
    useClaudeSDK: true,
  },
};

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Call the selected AI provider.
 *
 * @param {Object} opts
 * @param {string} opts.provider   – 'openai' | 'gemini' | 'grok'
 * @param {string} [opts.model]    – override default model
 * @param {Array}  opts.messages   – [{ role: 'system'|'user', content: string }]
 * @param {number} [opts.maxTokens=2048]
 * @param {number} [opts.temperature=0.7]
 * @returns {Promise<{ analysis: string, model: string, provider: string, promptTokens: number, completionTokens: number }>}
 */
async function callAI({
  provider = config.ai.defaultProvider || 'gemini',
  model,
  messages,
  maxTokens = 2048,
  temperature = 0.7,
}) {
  const providerDef = PROVIDERS[provider];
  if (!providerDef) {
    throw new Error(`Unknown AI provider: "${provider}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  const providerConfig = config.ai[provider];
  if (!providerConfig?.apiKey || providerConfig.apiKey.includes('placeholder')) {
    throw new Error(`AI provider "${provider}" is not configured. Set the API key in .env`);
  }

  const selectedModel = model || providerConfig.defaultModel;

  // ── Claude: use @anthropic-ai/sdk ──
  if (providerDef.useClaudeSDK) {
    return callClaudeSDK({ messages, model: selectedModel, maxTokens, temperature, providerConfig });
  }

  // ── Gemini: use @google/genai SDK with Thinking mode ──
  if (providerDef.useSDK) {
    return callGeminiSDK({ messages, model: selectedModel, maxTokens, temperature, providerConfig });
  }

  // ── OpenAI / Grok: REST API ──
  const url = providerDef.getUrl(providerConfig, selectedModel);
  const headers = providerDef.getHeaders(providerConfig);
  const body = providerDef.buildRequest({ messages, model: selectedModel, maxTokens, temperature });

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${providerDef.name} API error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const parsed = providerDef.parseResponse(json);

  return {
    ...parsed,
    model: selectedModel,
    provider,
  };
}

/**
 * Returns list of providers that have valid API keys configured.
 */
function getAvailableProviders() {
  return Object.entries(config.ai)
    .filter(([, v]) => v.apiKey && !v.apiKey.includes('placeholder'))
    .map(([key, v]) => ({
      key,
      name: PROVIDERS[key]?.name || key,
      defaultModel: v.defaultModel,
    }));
}

module.exports = { callAI, getAvailableProviders };

// ─────────────────────────────────────────────────────────────
// OpenAI / Grok — shared request/response format
// ─────────────────────────────────────────────────────────────

function buildRequest({ messages, model, maxTokens, temperature }) {
  return {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
}

function parseResponse(json) {
  return {
    analysis: json.choices?.[0]?.message?.content || '',
    promptTokens: json.usage?.prompt_tokens || 0,
    completionTokens: json.usage?.completion_tokens || 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Google Gemini — @google/genai SDK with Thinking mode
// ─────────────────────────────────────────────────────────────

/**
 * Call Gemini via the official SDK.
 * Uses thinkingConfig to enable "Thinking" mode for deeper reasoning.
 */
async function callGeminiSDK({ messages, model, maxTokens, temperature, providerConfig }) {
  const ai = new GoogleGenAI({ apiKey: providerConfig.apiKey });

  // Extract system instruction and user content from messages
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');

  // For a single user message, pass as string; for multi-turn, pass array
  const contents = userMsgs.length === 1
    ? userMsgs[0].content
    : userMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

  // For thinking models (2.5-pro/flash), thinkingConfig budgets internal
  // reasoning tokens separately so maxOutputTokens only caps visible output.
  const isThinkingModel = model.includes('2.5');
  const sdkConfig = {
    maxOutputTokens: maxTokens,
    temperature,
    ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
    ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 16384 } } : {}),
  };

  // 5-minute timeout to prevent indefinite hangs
  const TIMEOUT_MS = 300_000;

  console.log(`[Gemini] Calling model=${model}, maxTokens=${maxTokens}, thinking=${isThinkingModel}, promptChars=${(systemMsg?.content?.length || 0) + (userMsgs[0]?.content?.length || 0)}`);
  const startTime = Date.now();

  const apiCall = ai.models.generateContent({
    model,
    contents,
    config: sdkConfig,
  });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(
      `Gemini API timed out after ${TIMEOUT_MS / 1000}s. The model may be overloaded — try again or use a faster model (e.g. gemini-2.0-flash).`
    )), TIMEOUT_MS)
  );

  const response = await Promise.race([apiCall, timeout]);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // response.text is a prototype getter in @google/genai SDK (NOT a function)
  // Fallback: extract directly from candidates if getter returns undefined
  let text = response.text;
  if (text == null) {
    const parts = response.candidates?.[0]?.content?.parts;
    text = parts?.map(p => p.text).filter(Boolean).join('') || '';
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  console.log(`[Gemini] Response in ${elapsed}s, finishReason=${finishReason}, textLen=${text.length}, thinkingTokens=${response.usageMetadata?.thoughtsTokenCount || 0}`);

  return {
    analysis: text,
    model,
    provider: 'gemini',
    promptTokens: response.usageMetadata?.promptTokenCount || 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Anthropic Claude — @anthropic-ai/sdk
// ─────────────────────────────────────────────────────────────

async function callClaudeSDK({ messages, model, maxTokens, temperature, providerConfig }) {
  const client = new Anthropic({ apiKey: providerConfig.apiKey });

  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs  = messages.filter(m => m.role !== 'system');

  const anthropicMessages = userMsgs.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  // Build system as a content-block array with cache_control on the last block.
  // Anthropic will cache everything up to (and including) that block for 5 minutes,
  // so repeated calls with the same large system prompt (context docs + admin meta +
  // builder) pay only ~10 % of the normal input-token cost on cache hits.
  const systemBlocks = systemMsg
    ? [{ type: 'text', text: systemMsg.content, cache_control: { type: 'ephemeral' } }]
    : undefined;

  console.log(`[Claude] Calling model=${model}, maxTokens=${maxTokens}, promptChars=${(systemMsg?.content?.length || 0) + (userMsgs[0]?.content?.length || 0)}`);
  const startTime = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemBlocks ? { system: systemBlocks } : {}),
    messages: anthropicMessages,
  });

  const elapsed         = ((Date.now() - startTime) / 1000).toFixed(1);
  const text            = response.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
  const cacheCreated    = response.usage?.cache_creation_input_tokens || 0;
  const cacheRead       = response.usage?.cache_read_input_tokens     || 0;

  console.log(`[Claude] Response in ${elapsed}s, stop_reason=${response.stop_reason}, textLen=${text.length}`);
  if (cacheCreated > 0) console.log(`[Claude] Cache WRITE : ${cacheCreated} tokens written to cache`);
  if (cacheRead    > 0) console.log(`[Claude] Cache HIT   : ${cacheRead} tokens served from cache (~90 % cheaper)`);

  return {
    analysis: text,
    model,
    provider: 'claude',
    promptTokens:      response.usage?.input_tokens  || 0,
    completionTokens:  response.usage?.output_tokens || 0,
    cacheCreationTokens: cacheCreated,
    cacheReadTokens:     cacheRead,
  };
}
