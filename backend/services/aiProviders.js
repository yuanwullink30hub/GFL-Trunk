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
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { GoogleGenAI } = require('@google/genai');
const Anthropic = require('@anthropic-ai/sdk');

// ─────────────────────────────────────────────────────────────
// Model diagram images (loaded once at startup as base64)
// ─────────────────────────────────────────────────────────────

const IMAGE_DIR = path.join(__dirname, '..', 'prompts', 'images');
const MODEL_IMAGES = ['Cells within Cells png.png', 'Deltawerken png.png', 'TNM wheel PNG.png']
  .reduce((acc, name) => {
    try {
      const filePath = path.join(IMAGE_DIR, name);
      acc.push({ name, base64: fs.readFileSync(filePath).toString('base64'), mimeType: 'image/png' });
    } catch (e) {
      console.warn(`[AI] Model image not found, skipping: ${name}`);
    }
    return acc;
  }, []);

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
  uploadedImages = [],
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
    return callClaudeSDK({ messages, model: selectedModel, maxTokens, temperature, providerConfig, uploadedImages });
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

  // Text-only — inline images alongside thinking mode causes "Error in input stream".
  let contents;
  if (userMsgs.length === 1) {
    contents = [{ role: 'user', parts: [{ text: userMsgs[0].content }] }];
  } else {
    contents = userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  }

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

async function callClaudeSDK({ messages, model, maxTokens, temperature, providerConfig, uploadedImages = [] }) {
  const client = new Anthropic({ apiKey: providerConfig.apiKey });

  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs  = messages.filter(m => m.role !== 'system');

  // Only allow mimeTypes that Claude's vision API accepts
  const VALID_CLAUDE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const userImageBlocks = uploadedImages
    .filter(img => VALID_CLAUDE_TYPES.includes(img.mimeType))
    .map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    }));

  const anthropicMessages = userMsgs.map((m, i) => {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    // Attach model diagram images + user-uploaded images to the first user message
    if (i === 0 && role === 'user') {
      return {
        role,
        content: [
          ...MODEL_IMAGES.map(img => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
          })),
          ...userImageBlocks,
          { type: 'text', text: m.content },
        ],
      };
    }
    return { role, content: m.content };
  });

  // Pass system prompt as plain string — no cache_control since assessments
  // are too infrequent to benefit from Anthropic's 5-minute ephemeral cache.
  // (Cache writes cost 25% more, and with >5 min between requests the cache
  // always expires before the next hit.)

  console.log(`[Claude] Calling model=${model}, maxTokens=${maxTokens}, promptChars=${(systemMsg?.content?.length || 0) + (userMsgs[0]?.content?.length || 0)}`);
  const startTime = Date.now();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemMsg ? { system: systemMsg.content } : {}),
    messages: anthropicMessages,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const text = response.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';

  console.log(`[Claude] Response in ${elapsed}s, stop_reason=${response.stop_reason}, textLen=${text.length}`);

  return {
    analysis: text,
    model,
    provider: 'claude',
    promptTokens: response.usage?.input_tokens || 0,
    completionTokens: response.usage?.output_tokens || 0,
  };
}
