/**
 * WebMCP Polyfill conforming to W3C Web Machine Learning Community Group Draft
 * Specification: Web Model Context Protocol (WebMCP)
 * Reference: https://github.com/webmachinelearning/webmcp
 * 
 * Provides `document.modelContext` (and legacy navigator.modelContext alias)
 * for registering and executing in-browser agent tools.
 */

class ModelContext {
  constructor() {
    /** @type {Map<string, {name: string, description: string, inputSchema: object, execute: Function, annotations?: object}>} */
    this._tools = new Map();
  }

  /**
   * Registers a client-side tool callable by in-browser agents.
   * @param {Object} toolDef
   * @param {string} toolDef.name - Unique name of the tool
   * @param {string} toolDef.description - Natural language description for the LLM
   * @param {Object} toolDef.inputSchema - JSON Schema for arguments
   * @param {Function} toolDef.execute - Async callback executing the tool
   * @param {Object} [toolDef.annotations] - Safety hints (e.g. readOnlyHint: boolean)
   */
  async registerTool(toolDef) {
    if (!toolDef || typeof toolDef !== 'object') {
      throw new TypeError('Invalid tool definition');
    }
    if (!toolDef.name || typeof toolDef.name !== 'string') {
      throw new TypeError('Tool name must be a non-empty string');
    }
    if (typeof toolDef.execute !== 'function') {
      throw new TypeError(`Tool "${toolDef.name}" must provide an execute function`);
    }

    this._tools.set(toolDef.name, {
      name: toolDef.name,
      description: toolDef.description || '',
      inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
      execute: toolDef.execute,
      annotations: toolDef.annotations || { readOnlyHint: false }
    });

    return true;
  }

  /**
   * Unregisters a previously registered tool.
   * @param {string} name
   */
  async unregisterTool(name) {
    return this._tools.delete(name);
  }

  /**
   * Returns list of tools available for the in-browser agent (excluding the execute callback).
   * @returns {Promise<Array<{name: string, description: string, inputSchema: object, annotations: object}>>}
   */
  async getTools() {
    const list = [];
    for (const [, tool] of this._tools) {
      list.push({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations
      });
    }
    return list;
  }

  /**
   * Executes a registered tool by name with provided arguments.
   * @param {string} name 
   * @param {Object} args 
   * @returns {Promise<any>}
   */
  async executeTool(name, args = {}) {
    const tool = this._tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered on document.modelContext`);
    }
    return await tool.execute(args);
  }

  /**
   * Clear all registered tools
   */
  clear() {
    this._tools.clear();
  }
}

/**
 * Installs the ModelContext polyfill onto a target global/document object
 * @param {Object} targetScope - typically globalThis or window
 */
export function installWebMCP(targetScope = globalThis) {
  const modelContext = new ModelContext();

  if (!targetScope.document) {
    targetScope.document = {};
  }
  targetScope.document.modelContext = modelContext;

  // Backward compatibility alias for early Chrome 149 trial preview (navigator.modelContext)
  if (!targetScope.navigator) {
    targetScope.navigator = {};
  }
  Object.defineProperty(targetScope.navigator, 'modelContext', {
    get() {
      console.warn('[Deprecation] navigator.modelContext is deprecated; use document.modelContext as per W3C Web Machine Learning CG draft.');
      return modelContext;
    },
    configurable: true
  });

  return modelContext;
}

export default ModelContext;
