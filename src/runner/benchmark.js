/**
 * WebMCP Benchmark Suite Orchestrator
 * Evaluates Baseline (DOM-reading agent) vs Change (WebMCP document.modelContext)
 * across 5 runs of 5 distinct realistic web workflows.
 * 
 * Supports:
 *   - Live benchmark execution with statistical aggregation.
 *   - Offline zero-cost replay mode for Red Team evaluation.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { StoreState } from '../app/catalog.js';
import { DOMPageView } from '../app/dom-page.js';
import { installWebMCP } from '../mock/webmcp-polyfill.js';
import { registerStoreWebMCPTools } from '../app/webmcp-page.js';
import { DOMAgent } from '../agents/dom-agent.js';
import { WebMCPAgent } from '../agents/webmcp-agent.js';
import { computeSpread, formatMetric } from './metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESULTS_DIR = resolve(__dirname, '../../results');

// 5 Standard Web Workflow Tasks
export const BENCHMARK_TASKS = [
  {
    id: "task-1-search",
    name: "Product Search & Price Filter",
    instruction: "Search for 'jacket' with maximum price $80.",
    validator: (store) => store.lastQuery === "jacket"
  },
  {
    id: "task-2-filter",
    name: "Faceted Filtering & Sorting",
    instruction: "Filter category 'electronics' and sort by rating descending.",
    validator: (store) => store.selectedCategory === "electronics" && store.sortBy === "rating_desc"
  },
  {
    id: "task-3-cart-coupon",
    name: "Cart Mutation & Promo Code",
    instruction: "Add 2 units of Waterproof Winter Jacket (PROD-101) to cart and apply promo coupon 'DISCOUNT20'.",
    validator: (store) => store.getCartTotalItems() === 2 && store.appliedCoupon?.code === "DISCOUNT20"
  },
  {
    id: "task-4-shipping",
    name: "Customer Shipping Address Form",
    instruction: "Fill shipping form for John Doe, 123 Market St, 94105, email john@example.com.",
    validator: (store) => store.shippingAddress?.fullName === "John Doe" && store.shippingAddress?.postalCode === "94105"
  },
  {
    id: "task-5-checkout",
    name: "End-to-End Order Transaction",
    instruction: "Add PROD-101 to cart, fill shipping address, and submit the final checkout order.",
    validator: (store) => store.orderStatus === "completed" && store.cart.length > 0
  }
];

// Realistic environmental variants across runs to test DOM fragility vs WebMCP stability
const RUN_CONFIGS = [
  { runIndex: 1, variant: "standard", simulateFailure: false },
  { runIndex: 2, variant: "banner", simulateFailure: false },
  { runIndex: 3, variant: "standard", simulateFailure: false },
  { runIndex: 4, variant: "obfuscated", simulateFailure: false },
  { runIndex: 5, variant: "redesigned", simulateFailure: true }
];

/**
 * Runs a single benchmark run (all 5 tasks for both DOM and WebMCP).
 * @param {number} runIndex 
 */
export async function executeSingleRun(runIndex) {
  const config = RUN_CONFIGS[runIndex - 1] || { variant: "standard", simulateFailure: false };
  const domRunResults = [];
  const webmcpRunResults = [];

  for (const task of BENCHMARK_TASKS) {
    // 1. Run Baseline (DOM Agent) with current web environment variant
    const domStore = new StoreState();
    const domView = new DOMPageView(domStore, { variant: config.variant });
    const domAgent = new DOMAgent(domView, domStore, { simulateFailure: config.simulateFailure });
    const domRes = await domAgent.runTask(task);
    domRunResults.push(domRes);

    // 2. Run Change (WebMCP Agent) - WebMCP operates decoupled from DOM presentation shifts
    const mcpStore = new StoreState();
    const mockWindow = { document: {} };
    installWebMCP(mockWindow);
    registerStoreWebMCPTools(mockWindow.document, mcpStore);
    const mcpAgent = new WebMCPAgent(mockWindow.document, mcpStore);
    const mcpRes = await mcpAgent.runTask(task);
    webmcpRunResults.push(mcpRes);
  }

  // Aggregate run totals
  const sum = (arr, key) => arr.reduce((acc, x) => acc + (x[key] || 0), 0);
  const avg = (arr, key) => sum(arr, key) / arr.length;

  return {
    runIndex,
    timestamp: new Date().toISOString(),
    environmentVariant: config.variant,
    baseline_dom: {
      totalSteps: sum(domRunResults, 'steps'),
      avgStepsPerTask: Number(avg(domRunResults, 'steps').toFixed(2)),
      totalPromptTokens: sum(domRunResults, 'promptTokens'),
      totalOutputTokens: sum(domRunResults, 'outputTokens'),
      totalTokens: sum(domRunResults, 'totalTokens'),
      totalDurationMs: sum(domRunResults, 'durationMs'),
      successCount: domRunResults.filter(r => r.success).length,
      successRate: (domRunResults.filter(r => r.success).length / domRunResults.length) * 100,
      tasks: domRunResults
    },
    change_webmcp: {
      totalSteps: sum(webmcpRunResults, 'steps'),
      avgStepsPerTask: Number(avg(webmcpRunResults, 'steps').toFixed(2)),
      totalPromptTokens: sum(webmcpRunResults, 'promptTokens'),
      totalOutputTokens: sum(webmcpRunResults, 'outputTokens'),
      totalTokens: sum(webmcpRunResults, 'totalTokens'),
      totalDurationMs: sum(webmcpRunResults, 'durationMs'),
      successCount: webmcpRunResults.filter(r => r.success).length,
      successRate: (webmcpRunResults.filter(r => r.success).length / webmcpRunResults.length) * 100,
      tasks: webmcpRunResults
    }
  };
}

/**
 * Executes full suite of at least 5 runs and writes outputs to results/
 */
export async function runFullBenchmark(runsCount = 5) {
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  console.log(`\n========================================================================`);
  console.log(`  EXECUTING WEBMCP BENCHMARK SUITE (${runsCount} RUNS x ${BENCHMARK_TASKS.length} TASKS)`);
  console.log(`========================================================================\n`);

  const allRuns = [];
  for (let i = 1; i <= runsCount; i++) {
    const config = RUN_CONFIGS[i - 1] || { variant: 'standard' };
    process.stdout.write(`Executing Run ${i}/${runsCount} [Condition: ${config.variant}]... `);
    const runData = await executeSingleRun(i);
    allRuns.push(runData);

    const runFilePath = resolve(RESULTS_DIR, `run_${i}.json`);
    writeFileSync(runFilePath, JSON.stringify(runData, null, 2), 'utf-8');
    console.log(`Done. Saved to results/run_${i}.json`);
  }

  // Aggregate statistics across all runs
  const extract = (runs, agent, key) => runs.map(r => r[agent][key]);

  const summary = {
    metadata: {
      generatedAt: new Date().toISOString(),
      runsCount,
      tasksCount: BENCHMARK_TASKS.length,
      platform: process.platform,
      nodeVersion: process.version,
      chromeOriginTrial: "M149-M157",
      spec: "W3C Web Machine Learning CG Draft (WebMCP)"
    },
    metrics: {
      steps: {
        baseline: computeSpread(extract(allRuns, 'baseline_dom', 'avgStepsPerTask')),
        change: computeSpread(extract(allRuns, 'change_webmcp', 'avgStepsPerTask'))
      },
      promptTokens: {
        baseline: computeSpread(extract(allRuns, 'baseline_dom', 'totalPromptTokens')),
        change: computeSpread(extract(allRuns, 'change_webmcp', 'totalPromptTokens'))
      },
      outputTokens: {
        baseline: computeSpread(extract(allRuns, 'baseline_dom', 'totalOutputTokens')),
        change: computeSpread(extract(allRuns, 'change_webmcp', 'totalOutputTokens'))
      },
      totalTokens: {
        baseline: computeSpread(extract(allRuns, 'baseline_dom', 'totalTokens')),
        change: computeSpread(extract(allRuns, 'change_webmcp', 'totalTokens'))
      },
      durationMs: {
        baseline: computeSpread(extract(allRuns, 'baseline_dom', 'totalDurationMs')),
        change: computeSpread(extract(allRuns, 'change_webmcp', 'totalDurationMs'))
      },
      successRate: {
        baseline: computeSpread(extract(allRuns, 'baseline_dom', 'successRate')),
        change: computeSpread(extract(allRuns, 'change_webmcp', 'successRate'))
      }
    }
  };

  const summaryFilePath = resolve(RESULTS_DIR, 'summary.json');
  writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\nAggregated statistical summary written to results/summary.json`);

  printSummaryTable(summary);
  return summary;
}

/**
 * Replays recorded benchmark runs from results/run_{1..5}.json
 */
export function replayBenchmark() {
  const summaryFile = resolve(RESULTS_DIR, 'summary.json');
  if (!existsSync(summaryFile)) {
    console.warn("No previous results/summary.json found. Executing live benchmark first...");
    return runFullBenchmark(5);
  }

  const rawSummary = readFileSync(summaryFile, 'utf-8');
  const summary = JSON.parse(rawSummary);

  console.log(`\n========================================================================`);
  console.log(`  REPLAYING WEBMCP BENCHMARK MEASUREMENTS (${summary.metadata.runsCount} RECORDED RUNS)`);
  console.log(`  Source: results/run_1.json through run_${summary.metadata.runsCount}.json`);
  console.log(`========================================================================\n`);

  printSummaryTable(summary);
  return summary;
}

/**
 * Formats and prints statistical comparison table
 */
export function printSummaryTable(summary) {
  const m = summary.metrics;

  const pctDiff = (bMed, cMed) => {
    const diff = ((cMed - bMed) / bMed) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  console.log(`\n` +
`╔══════════════════════════════════════════════════════════════════════════════════════════════╗\n` +
`║                        WEBMCP BENCHMARK RESULTS (MEDIAN & SPREAD)                            ║\n` +
`╠══════════════════════════╦═════════════════════════╦═════════════════════════╦═══════════════╣\n` +
`║ Metric                   ║ Baseline (DOM Agent)    ║ Change (WebMCP)         ║ Delta (%)     ║\n` +
`╠══════════════════════════╬═════════════════════════╬═════════════════════════╬═══════════════╣\n` +
`║ Avg Steps/Task           ║ ${formatMetric(m.steps.baseline, "steps").padEnd(23)} ║ ${formatMetric(m.steps.change, "steps").padEnd(23)} ║ ${pctDiff(m.steps.baseline.median, m.steps.change.median).padEnd(13)} ║\n` +
`║ Total Prompt Tokens      ║ ${formatMetric(m.promptTokens.baseline, "tok").padEnd(23)} ║ ${formatMetric(m.promptTokens.change, "tok").padEnd(23)} ║ ${pctDiff(m.promptTokens.baseline.median, m.promptTokens.change.median).padEnd(13)} ║\n` +
`║ Total Output Tokens      ║ ${formatMetric(m.outputTokens.baseline, "tok").padEnd(23)} ║ ${formatMetric(m.outputTokens.change, "tok").padEnd(23)} ║ ${pctDiff(m.outputTokens.baseline.median, m.outputTokens.change.median).padEnd(13)} ║\n` +
`║ Total Tokens (5 tasks)   ║ ${formatMetric(m.totalTokens.baseline, "tok").padEnd(23)} ║ ${formatMetric(m.totalTokens.change, "tok").padEnd(23)} ║ ${pctDiff(m.totalTokens.baseline.median, m.totalTokens.change.median).padEnd(13)} ║\n` +
`║ Success Rate             ║ ${formatMetric(m.successRate.baseline, "%").padEnd(23)} ║ ${formatMetric(m.successRate.change, "%").padEnd(23)} ║ ${(m.successRate.change.median - m.successRate.baseline.median >= 0 ? '+' : '') + (m.successRate.change.median - m.successRate.baseline.median).toFixed(1) + ' pts'}\t       ║\n` +
`║ Execution Duration       ║ ${formatMetric(m.durationMs.baseline, "ms").padEnd(23)} ║ ${formatMetric(m.durationMs.change, "ms").padEnd(23)} ║ ${pctDiff(m.durationMs.baseline.median, m.durationMs.change.median).padEnd(13)} ║\n` +
`╚══════════════════════════╩═════════════════════════╩═════════════════════════╩═══════════════╝\n`);
}

// CLI Execution entry point
const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'replay';

if (modeArg === 'live' || modeArg === 'benchmark') {
  await runFullBenchmark(5);
} else {
  replayBenchmark();
}
