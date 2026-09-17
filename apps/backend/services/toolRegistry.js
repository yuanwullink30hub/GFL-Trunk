/**
 * Tool registry — the only way a tool gets server compute (docs/LOCAL_WORKSTATION_CONTRACT.md §7a).
 *
 * A tool is registered with a pure handler: `handler(input) → result`. It receives the JSON input
 * and nothing else — no request, no headers, no IP, no user — so a tool cannot couple its work to a
 * person even by accident. Handlers must not log their input or output and must not store them.
 * If a tool calls a model, it passes no user metadata to the provider.
 *
 *   registerTool({ id: 'dream-journal', handler: async ({ text }) => ({ reflection }) })
 */
const TOOL_ID = /^[a-z0-9][a-z0-9-]{1,40}$/;
const tools = new Map();

function registerTool({ id, handler, maxInputBytes = 64 * 1024 }) {
  if (!TOOL_ID.test(String(id || ''))) throw new Error(`Invalid tool id: ${id}`);
  if (typeof handler !== 'function') throw new Error(`Tool ${id} needs a handler`);
  if (tools.has(id)) throw new Error(`Tool ${id} is already registered`);
  tools.set(id, { id, handler, maxInputBytes });
}

const getTool = (id) => tools.get(String(id || '')) || null;
const listTools = () => [...tools.keys()];

// Built-in: proves the chain (ticket → gateway → handler) end to end. Returns nothing about anyone.
registerTool({ id: 'ping', handler: async () => ({ ok: true }) });

module.exports = { registerTool, getTool, listTools };
