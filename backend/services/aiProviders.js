/**
 * Garden For Life — Multi-Provider AI Service
 *
 * Unified interface for OpenAI (ChatGPT), Google Gemini, and xAI (Grok).
 * All three expose chat-completion-style APIs; this module normalises
 * the request/response format so callers don't need to know which provider
 * is in use.
 *
 * Usage:
 *   const { callAI, getAvailableProviders } = require('./aiProviders');
 *   const result = await callAI({ provider: 'openai', messages, ... });
 */
const config = require('../config');

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
    name: 'Google Gemini',
    buildRequest: buildGeminiRequest,
    parseResponse: parseGeminiResponse,
    getUrl: (cfg, model) =>
      `${cfg.baseUrl}/models/${model}:generateContent?key=${cfg.apiKey}`,
    getHeaders: () => ({ 'Content-Type': 'application/json' }),
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
  provider = 'gemini',
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
// Google Gemini — different API shape
// ─────────────────────────────────────────────────────────────

function buildGeminiRequest({ messages, maxTokens, temperature }) {
  // Gemini uses "contents" with "parts", and systemInstruction for system messages
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');

  const body = {
    contents: userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  return body;
}

function parseGeminiResponse(json) {
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = json.usageMetadata || {};
  return {
    analysis: text,
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
  };
}
