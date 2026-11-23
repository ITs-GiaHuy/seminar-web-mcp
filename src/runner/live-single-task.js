/**
 * Live LLM Interactive Task Runner
 * Streams real-time LLM reasoning and outputs from opencode for individual tasks.
 * Usage: node src/runner/live-single-task.js --task=1
 */

import { spawn } from 'child_process';
import { BENCHMARK_TASKS } from './benchmark.js';
import { StoreState } from '../app/catalog.js';
import { DOMPageView } from '../app/dom-page.js';
import { installWebMCP } from '../mock/webmcp-polyfill.js';
import { registerStoreWebMCPTools } from '../app/webmcp-page.js';
import { estimateTokens } from './metrics.js';

const OPENCODE_PATH = '/home/giahuy/.local/bin/opencode';

/**
 * Spawns opencode and streams tokens in real time to the terminal console.
 */
function callLLMWithLiveStream(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write('\x1b[36m[Connecting to real LLM via opencode...]\x1b[0m\n');
    
    const startTime = performance.now();
    const args = ['run', '--pure', '--format', 'json', '--auto', prompt];

    const proc = spawn(OPENCODE_PATH, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let fullText = '';
    let tokenStats = { input: 0, output: 0, total: 0 };
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line.trim());
          if (evt.type === 'text' && evt.part && evt.part.text) {
            fullText += evt.part.text;
            process.stdout.write('\x1b[33m' + evt.part.text + '\x1b[0m');
          }
          if (evt.type === 'step_finish' && evt.part && evt.part.tokens) {
            tokenStats = {
              input: evt.part.tokens.input || 0,
              output: evt.part.tokens.output || 0,
              total: evt.part.tokens.total || 0
            };
          }
        } catch {
          // ignore non-JSON logging
        }
      }
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      process.stdout.write('\n');
      const durationMs = Math.round(performance.now() - startTime);
      if (code !== 0 && !fullText) {
        return reject(new Error(`opencode exited with code ${code}: ${errorOutput}`));
      }
      resolve({
        text: fullText,
        tokens: tokenStats,
        durationMs
      });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function runLiveWebMCPAgent(task) {
  console.log(`\n========================================================================`);
  console.log(`  1. RUNNING WEBMCP AGENT (CHANGE) WITH LIVE REAL LLM`);
  console.log(`========================================================================`);

  const store = new StoreState();
  const mockDoc = { document: {} };
  installWebMCP(mockDoc);
  registerStoreWebMCPTools(mockDoc.document, store);

  const availableTools = await mockDoc.document.modelContext.getTools();
  const toolsSchemaJson = JSON.stringify(availableTools, null, 2);

  console.log(`[Step 1] Discovered ${availableTools.length} tools via document.modelContext.getTools()`);
  console.log(`[Step 2] Sending compact JSON Schema (${estimateTokens(toolsSchemaJson)} tokens) to LLM...`);

  const prompt = `You are an in-browser AI assistant interacting with a webpage via WebMCP (document.modelContext).
The page exposes the following tools with JSON schemas:
${toolsSchemaJson}

User Goal: "${task.instruction}"

Select the tool to execute. If multiple tools are needed, list them.
Output ONLY a valid JSON object or array of objects with format:
{"tool": "toolName", "args": {...}}
Do not include any explanation or markdown formatting.`;

  console.log(`\n--- LLM Live Streaming Response (Yellow text) ---`);
  const llmResult = await callLLMWithLiveStream(prompt);

  console.log(`\n[Step 3] Parsing LLM output and executing tool on document.modelContext:`);
  let toolCalls = [];
  const cleanedText = llmResult.text.trim();
  const match = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    toolCalls = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    throw new Error(`LLM did not return valid JSON: ${cleanedText}`);
  }

  for (const call of toolCalls) {
    const toolName = call.tool || call.name;
    const toolArgs = call.args || {};
    console.log(`  -> Calling document.modelContext.executeTool("${toolName}", ${JSON.stringify(toolArgs)})`);
    const result = await mockDoc.document.modelContext.executeTool(toolName, toolArgs);
    console.log(`  -> Page Execution Result:`, JSON.stringify(result));
  }

  const success = task.validator(store);
  console.log(`\n✅ WebMCP Result: Success = ${success} | Steps = 1 | Total Duration = ${llmResult.durationMs}ms`);
  console.log(`📊 LLM Tokens: Input = ${llmResult.tokens.input} | Output = ${llmResult.tokens.output} | Total = ${llmResult.tokens.total}`);
  return { success, durationMs: llmResult.durationMs, tokens: llmResult.tokens };
}

async function runLiveDOMAgent(task) {
  console.log(`\n========================================================================`);
  console.log(`  2. RUNNING DOM ACTUATION AGENT (BASELINE) WITH LIVE REAL LLM`);
  console.log(`========================================================================`);

  const store = new StoreState();
  const view = new DOMPageView(store);
  let steps = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalDuration = 0;

  const actionHistory = [];

  for (let turn = 1; turn <= 4; turn++) {
    steps++;
    console.log(`\n[Turn ${turn}] Extracting full HTML DOM snapshot...`);
    const currentDom = view.renderHTML();
    console.log(`  -> DOM Tree Size: ${currentDom.length} chars (~${estimateTokens(currentDom)} tokens)`);
    console.log(`  -> Submitting DOM snapshot to real LLM...`);

    const prompt = `You are a web automation agent interacting with a webpage.
Current Page HTML:
${currentDom}

User Goal: "${task.instruction}"
Completed Actions: ${JSON.stringify(actionHistory)}
Next Action Turn: ${turn}

Output ONLY valid JSON for the next single action in format:
{"action": "click"|"type"|"select", "selector": "#element-id", "value": "optional string"}
If the goal is already fully complete, output: {"action": "done"}
Do not include explanations or markdown formatting.`;

    console.log(`\n--- LLM Live Streaming Response (Yellow text) ---`);
    const llmResult = await callLLMWithLiveStream(prompt);
    totalInputTokens += llmResult.tokens.input;
    totalOutputTokens += llmResult.tokens.output;
    totalDuration += llmResult.durationMs;

    const cleanedText = llmResult.text.trim();
    const match = cleanedText.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn(`  -> Could not parse JSON action, stopping turn loop.`);
      break;
    }

    const action = JSON.parse(match[0]);
    if (action.action === "done") {
      console.log(`  -> LLM indicated task is complete.`);
      break;
    }

    console.log(`\n[Turn ${turn}] Executing synthetic DOM action: ${JSON.stringify(action)}`);
    const execResult = view.executeAction(action);
    console.log(`  -> Action Result:`, JSON.stringify(execResult));
    actionHistory.push(action);

    if (task.validator(store)) {
      console.log(`  -> Ground truth validator passed! Task finished early.`);
      break;
    }
  }

  const success = task.validator(store);
  console.log(`\n✅ DOM Agent Result: Success = ${success} | Total Steps = ${steps} | Total Duration = ${totalDuration}ms`);
  console.log(`📊 Accumulated LLM Tokens: Input = ${totalInputTokens} | Output = ${totalOutputTokens} | Total = ${totalInputTokens + totalOutputTokens}`);
  return { success, steps, durationMs: totalDuration, tokens: { input: totalInputTokens, output: totalOutputTokens, total: totalInputTokens + totalOutputTokens } };
}

// Main execution
const args = process.argv.slice(2);
const taskArg = args.find(a => a.startsWith('--task='))?.split('=')[1] || '1';
const taskIndex = Math.max(1, Math.min(5, parseInt(taskArg, 10))) - 1;
const task = BENCHMARK_TASKS[taskIndex];

console.log(`\n########################################################################`);
console.log(`  LIVE REAL-TIME LLM BENCHMARK: TASK ${taskIndex + 1} - ${task.name}`);
console.log(`  Goal: "${task.instruction}"`);
console.log(`########################################################################`);

const mcpRes = await runLiveWebMCPAgent(task);
const domRes = await runLiveDOMAgent(task);

console.log(`\n========================================================================`);
console.log(`  HEAD-TO-HEAD COMPARISON FOR TASK ${taskIndex + 1} (REAL LLM INFERENCE)`);
console.log(`========================================================================`);
console.log(`WebMCP Agent : Steps: 1    | Tokens: ${mcpRes.tokens.total} | Duration: ${mcpRes.durationMs}ms`);
console.log(`DOM Agent    : Steps: ${domRes.steps}    | Tokens: ${domRes.tokens.total} | Duration: ${domRes.durationMs}ms`);
const tokenSaved = (((domRes.tokens.total - mcpRes.tokens.total) / domRes.tokens.total) * 100).toFixed(1);
console.log(`🚀 Token Savings with WebMCP: -${tokenSaved}%`);
console.log(`========================================================================\n`);
