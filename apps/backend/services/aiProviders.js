/**
 * Garden For Life — Multi-Provider AI Service
 *
 * Unified interface for OpenAI (ChatGPT), Anthropic Claude, and xAI (Grok).
 * OpenAI / Grok use their REST APIs (OpenAI-compatible format).
 *
 * Usage:
 *   const { callAI, getAvailableProviders } = require('./aiProviders');
 *   const result = await callAI({ provider: 'claude', messages, ... });
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const Anthropic = require('@anthropic-ai/sdk');

// ─────────────────────────────────────────────────────────────
// Model diagram images (loaded once at startup as base64)
// ─────────────────────────────────────────────────────────────

const IMAGE_DIR = path.join(__dirname, '..', 'prompts', 'images');
const MODEL_IMAGES = require('../engine/geometryReference')
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
 * @param {string} opts.provider   – 'openai' | 'claude' | 'grok'
 * @param {string} [opts.model]    – override default model
 * @param {Array}  opts.messages   – [{ role: 'system'|'user', content: string }]
 * @param {number} [opts.maxTokens=2048]
 * @param {number} [opts.temperature=0.7]
 * @returns {Promise<{ analysis: string, model: string, provider: string, promptTokens: number, completionTokens: number }>}
 */
async function callAI({
  provider = config.ai.defaultProvider || 'claude',
  model,
  messages,
  maxTokens = 2048,
  temperature = 0.7,
  uploadedImages = [],
  cachedContext = null,
  referenceDocs = [],
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
    return callClaudeSDK({ messages, model: selectedModel, maxTokens, temperature, providerConfig, uploadedImages, cachedContext, referenceDocs });
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
// Anthropic Claude — @anthropic-ai/sdk
// ─────────────────────────────────────────────────────────────

async function callClaudeSDK({ messages, model, maxTokens, temperature, providerConfig, uploadedImages = [], cachedContext = null, referenceDocs = [] }) {
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
    // Attach the cached corpus block FIRST (static prefix → prompt cache), then the
    // model diagram images + user-uploaded images, then the per-user payload text.
    if (i === 0 && role === 'user') {
      return {
        role,
        content: [
          // Cached corpus: cache_control here marks a breakpoint so the system prompt
          // (v4) + this corpus block are cached. Per-user content after it is not.
          ...(cachedContext
            ? [{ type: 'text', text: cachedContext, cache_control: { type: 'ephemeral' } }]
            : []),
          // Static reference documents (e.g. the line-type lookup table) shipped as their own
          // labelled blocks. They sit inside the cached prefix (static → cheap on repeat calls).
          ...referenceDocs.map(doc => ({
            type: 'text',
            text: `═══ REFERENTIEDOCUMENT: ${doc.name} ═══\n${doc.text}`,
            cache_control: { type: 'ephemeral' },
          })),
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

  // The system prompt (v4) + the cachedContext corpus form the cached prefix when
  // cachedContext is supplied (cache_control on the corpus block above). With the
  // ~156k-token corpus this is worth the 25% write cost: repeat assessments inside
  // the cache window read the prefix ~90% cheaper. Without cachedContext, no cache.

  // Sampling parameters return a 400 on the current models (Fable 5/5.1, Mythos, Opus 5, Sonnet 5,
  // Opus 4.7/4.8 — they manage sampling internally), so `temperature` only goes to older models.
  const currentGen = /^claude-(fable|mythos|opus-5|sonnet-5|opus-4-[78])/.test(model);
  const supportsTemperature = typeof temperature === 'number' && !currentGen;
  // Effort (output_config.effort) sets thinking depth and overall token spend; sent where supported.
  const supportsEffort = currentGen || /^claude-(opus-4-[56]|sonnet-4-6)/.test(model);
  // Fable models think on every request and the thinking counts against max_tokens, so a report
  // budget sized for visible text alone (the platform asks 30k) would truncate. Output is billed
  // only for tokens actually generated, so the higher ceiling costs nothing by itself. 75k: at 64k a
  // v6.2.7 report on high effort hit the ceiling and was truncated (2026-09-18); the model allows 128k.
  const alwaysThinks = /^claude-(fable|mythos)/.test(model);
  const maxOutput = alwaysThinks ? Math.max(maxTokens, 75000) : maxTokens;
  // Fable 5.1 / Opus 5 run safety classifiers that can decline a request (HTTP 200, stop_reason
  // "refusal"). Server-side fallbacks re-run a declined request on Anthropic's recommended fallback
  // model inside the same call ("default" routes by refusal category).
  const useFallbacks = /^claude-(fable-5-1|opus-5)$/.test(model);

  console.log(`[Claude] Calling model=${model}, maxTokens=${maxOutput}, promptChars=${(systemMsg?.content?.length || 0) + (userMsgs[0]?.content?.length || 0)}`);
  const startTime = Date.now();

  // Stream via the SDK helper and collect the full message with .finalMessage(). Streaming
  // sidesteps the SDK's non-streaming 10-minute guard (max_tokens > ~21,333 would otherwise
  // throw "Streaming is required…"), so the full report can have a large max_tokens.
  // The beta namespace carries the fallbacks header; same Message shape as create().
  const stream = client.beta.messages.stream({
    model,
    max_tokens: maxOutput,
    ...(supportsTemperature ? { temperature } : {}),
    ...(supportsEffort && providerConfig.effort ? { output_config: { effort: providerConfig.effort } } : {}),
    ...(useFallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    ...(systemMsg ? { system: systemMsg.content } : {}),
    messages: anthropicMessages,
  });
  const response = await stream.finalMessage();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const servedBy = response.model || model;
  const fellBack = (response.usage?.iterations || []).some(i => i.type === 'fallback_message');

  // A refusal arrives as a normal response: check stop_reason before reading content. A mid-stream
  // refusal carries partial output, which must not be treated as a report.
  if (response.stop_reason === 'refusal') {
    const category = response.stop_details?.category ?? 'unspecified';
    console.warn(`[Claude] ${model} request declined after ${elapsed}s (category ${category}${fellBack ? `, fallback ${servedBy} declined too` : ''})`);
    throw new Error(`The AI model declined this request (refusal category: ${category}).`);
  }

  const text = response.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';

  console.log(`[Claude] Response in ${elapsed}s, model=${servedBy}${fellBack ? ` (fallback after ${model} declined)` : ''}, effort=${supportsEffort ? providerConfig.effort || 'default' : 'n/a'}, stop_reason=${response.stop_reason}, textLen=${text.length}`);
  if (response.stop_reason === 'max_tokens') {
    console.warn(`[Claude] ⚠ output hit max_tokens=${maxOutput} — the report is truncated`);
  }

  return {
    analysis: text,
    model: servedBy,
    provider: 'claude',
    promptTokens: response.usage?.input_tokens || 0,
    completionTokens: response.usage?.output_tokens || 0,
  };
}
