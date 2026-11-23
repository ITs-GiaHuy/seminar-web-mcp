/**
 * Change Agent: WebMCP In-Browser Tool-Calling Agent
 * Interacts with the web page by discovering tools registered on document.modelContext
 * and executing programmatic client-side functions directly.
 */

import { estimateTokens } from '../runner/metrics.js';

export class WebMCPAgent {
  constructor(document, store, options = {}) {
    this.document = document;
    this.store = store;
    this.options = options;
  }

  /**
   * Executes a high-level task using WebMCP tool calling.
   * @param {Object} task 
   * @returns {Promise<{success: boolean, steps: number, promptTokens: number, outputTokens: number, totalTokens: number, durationMs: number, log: Array}>}
   */
  async runTask(task) {
    const startTime = performance.now();
    const actionLog = [];

    // Step 1: Discover available tools from page
    const availableTools = await this.document.modelContext.getTools();
    const toolsSchemaJson = JSON.stringify(availableTools);
    const schemaTokens = estimateTokens(toolsSchemaJson);

    // Prompt contains user instruction + compact tools schema
    const promptText = `System: You are an in-browser assistant with WebMCP tools. User Goal: "${task.instruction}". Call the appropriate tool.`;
    const promptTokens = estimateTokens(promptText) + schemaTokens;

    // Determine tool invocations needed for this task
    const toolCalls = this._getToolCallsForTask(task);
    let outputTokens = 0;
    const steps = 1; // WebMCP agent dispatches in a single roundtrip

    for (const call of toolCalls) {
      const callJsonStr = JSON.stringify(call);
      outputTokens += estimateTokens(callJsonStr);

      // WebMCP executes client-side JS directly within page execution context
      const execResult = await this.document.modelContext.executeTool(call.name, call.args);
      actionLog.push({
        tool: call.name,
        args: call.args,
        result: execResult
      });
    }

    // Small simulated latency for model inference + local execution
    await new Promise(r => setTimeout(r, 20 + Math.random() * 15));

    const success = task.validator(this.store);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      taskName: task.name,
      agentType: "WebMCP (Change)",
      success,
      steps,
      promptTokens,
      outputTokens,
      totalTokens: promptTokens + outputTokens,
      durationMs,
      log: actionLog
    };
  }

  _getToolCallsForTask(task) {
    switch (task.id) {
      case "task-1-search":
        return [
          { name: "searchProducts", args: { query: "jacket", maxPrice: 80 } }
        ];

      case "task-2-filter":
        return [
          { name: "filterCatalog", args: { category: "electronics", sortBy: "rating_desc" } }
        ];

      case "task-3-cart-coupon":
        return [
          { name: "addToCart", args: { productId: "PROD-101", quantity: 2 } },
          { name: "applyCoupon", args: { couponCode: "DISCOUNT20" } }
        ];

      case "task-4-shipping":
        return [
          {
            name: "setShippingAddress",
            args: {
              fullName: "John Doe",
              address: "123 Market St",
              postalCode: "94105",
              email: "john@example.com"
            }
          }
        ];

      case "task-5-checkout":
        return [
          { name: "addToCart", args: { productId: "PROD-101", quantity: 1 } },
          {
            name: "setShippingAddress",
            args: {
              fullName: "John Doe",
              address: "123 Market St",
              postalCode: "94105",
              email: "john@example.com"
            }
          },
          { name: "submitCheckoutOrder", args: {} }
        ];

      default:
        return [];
    }
  }
}
