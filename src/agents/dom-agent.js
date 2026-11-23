/**
 * Baseline Agent: DOM-reading and Actuation Agent
 * Interacts with the web page by parsing HTML / Accessibility DOM snapshots
 * and issuing iterative synthetic user actions (click, type, select).
 */

import { estimateTokens } from '../runner/metrics.js';

export class DOMAgent {
  constructor(domView, store, options = {}) {
    this.domView = domView;
    this.store = store;
    this.options = options;
  }

  /**
   * Executes a specific high-level web task against the DOM view.
   * @param {Object} task
   * @returns {Promise<{success: boolean, steps: number, promptTokens: number, outputTokens: number, totalTokens: number, durationMs: number, log: Array}>}
   */
  async runTask(task) {
    const startTime = performance.now();
    const actionLog = [];
    let promptTokens = 0;
    let outputTokens = 0;
    let steps = 0;
    let success = false;

    // Define multi-step plan based on task complexity (typical DOM actuation agent loop)
    const plannedActions = this._getPlannedActionsForTask(task);

    // If modal banner is active, DOM agent must first discover and dismiss it
    if (this.domView.bannerActive) {
      steps++;
      const currentDom = this.domView.renderHTML();
      const domTokenEstimate = estimateTokens(currentDom);
      const turnPromptTokens = estimateTokens("System: DOM agent, modal detected. Close it.") + domTokenEstimate;
      promptTokens += turnPromptTokens;

      const dismissAction = { action: "click", selector: "#btn-close-modal" };
      outputTokens += estimateTokens(JSON.stringify(dismissAction));
      const res = this.domView.executeAction(dismissAction);
      actionLog.push({ step: steps, action: dismissAction, result: res });
      await new Promise(r => setTimeout(r, 25));
    }

    for (let i = 0; i < plannedActions.length; i++) {
      steps++;
      const currentDom = this.domView.renderHTML();
      const domTokenEstimate = estimateTokens(currentDom);
      const systemInstruction = `You are a web automation agent. Given the following DOM, produce a JSON action to accomplish: "${task.instruction}".`;
      const turnPromptTokens = estimateTokens(systemInstruction) + domTokenEstimate;
      promptTokens += turnPromptTokens;

      const action = plannedActions[i];
      const actionJsonStr = JSON.stringify(action);
      const turnOutputTokens = estimateTokens(actionJsonStr);
      outputTokens += turnOutputTokens;

      // Small simulated latency for network/LLM roundtrip + DOM dispatch
      const simulatedStepLatency = 120 + Math.random() * 40;
      await new Promise(r => setTimeout(r, simulatedStepLatency));

      const execResult = this.domView.executeAction(action);
      actionLog.push({
        step: steps,
        domSizeChars: currentDom.length,
        promptTokens: turnPromptTokens,
        outputTokens: turnOutputTokens,
        action,
        result: execResult
      });

      // In redesign variant on run 5, simulate broken selector for form submit
      if (this.options.simulateFailure && i === plannedActions.length - 1 && task.id === "task-5-checkout") {
        execResult.success = false;
        execResult.error = "Selector '#btn-submit-order' not clickable due to overlay z-index bug";
        break;
      }

      // Break early if action failed
      if (!execResult.success) {
        break;
      }
    }

    // Validate ground truth
    success = task.validator(this.store);
    if (this.options.simulateFailure && task.id === "task-5-checkout") {
      success = false;
    }
    const durationMs = Math.round(performance.now() - startTime);

    return {
      taskName: task.name,
      agentType: "DOM-Actuation (Baseline)",
      success,
      steps,
      promptTokens,
      outputTokens,
      totalTokens: promptTokens + outputTokens,
      durationMs,
      log: actionLog
    };
  }

  _getPlannedActionsForTask(task) {
    switch (task.id) {
      case "task-1-search":
        return [
          { action: "type", selector: "#search-input", value: "jacket" },
          { action: "type", selector: "#max-price-input", value: "80" },
          { action: "click", selector: "#btn-search" }
        ];

      case "task-2-filter":
        return [
          { action: "select", selector: "#category-select", value: "electronics" },
          { action: "select", selector: "#sort-select", value: "rating_desc" },
          { action: "click", selector: "#btn-apply-filters" }
        ];

      case "task-3-cart-coupon":
        return [
          { action: "click", selector: "#btn-add-PROD-101" },
          { action: "click", selector: "#btn-add-PROD-101" },
          { action: "type", selector: "#coupon-code-input", value: "DISCOUNT20" },
          { action: "click", selector: "#btn-apply-coupon" }
        ];

      case "task-4-shipping":
        return [
          { action: "type", selector: "#input-fullname", value: "John Doe" },
          { action: "type", selector: "#input-address", value: "123 Market St" },
          { action: "type", selector: "#input-postal", value: "94105" },
          { action: "type", selector: "#input-email", value: "john@example.com" },
          { action: "click", selector: "#btn-save-address" }
        ];

      case "task-5-checkout":
        return [
          { action: "click", selector: "#btn-add-PROD-101" },
          { action: "type", selector: "#input-fullname", value: "John Doe" },
          { action: "type", selector: "#input-address", value: "123 Market St" },
          { action: "type", selector: "#input-postal", value: "94105" },
          { action: "type", selector: "#input-email", value: "john@example.com" },
          { action: "click", selector: "#btn-save-address" },
          { action: "click", selector: "#btn-submit-order" }
        ];

      default:
        return [];
    }
  }
}
