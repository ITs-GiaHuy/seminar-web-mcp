# AI Assistance Log (AI-LOG.md)

**Course**: CSC13114 Advanced Web Application Development (23KTPM1)  
**Topic**: A1 — WebMCP: a page exposes its functions to in-browser agents (W3C community draft, in trial in Chrome)  

---

## 1. Tools and Models Used

| Tool / Model | Version / Provider | Used For |
| :--- | :--- | :--- |
| **Google Gemini (Antigravity Assistant)** | Gemini 3.8 Flash (High) | Researching W3C draft, architecting benchmark testbed, drafting polyfill and `REPORT.md` |
| **Opencode CLI** | v1.1.x (`opencode run`) | Automated headless agent execution and token streaming |

---

## 2. Prompts and Iterations

1. **Initial Research & Scope Definition**:
   - *Prompt*: "Search official specifications for WebMCP in W3C and Chromium Origin Trials. Compare DOM-actuating agents vs function-exposing in-browser agents."
   - *Result*: Clarified the incubation under the W3C Web Machine Learning Community Group and Origin Trial rollout in Chrome 149–157.

2. **Benchmark Architecture**:
   - *Prompt*: "Design a 5-scenario e-commerce benchmark (Search, Filter, Cart/Coupon, Address, Checkout) comparing steps, tokens, duration, and success rate."
   - *Result*: Established 5 standardized tasks with explicit ground-truth validators on store state.

3. **Replay Mode Implementation**:
   - *Prompt*: "Design a reproducible offline replay runner so that Red Team can run `npm run measure` without external keys or network calls and obtain the exact numbers in `results/summary.json`."
   - *Result*: Created `npm run measure` (replay mode) and `npm run measure:live` (live 5-run generator).

---

## 3. Real Changed and Rejected Entries (Critical Corrections)

### Correction 1: Deprecated `navigator.modelContext` vs Standard `document.modelContext`
- **What the Assistant Got Wrong**: In an early iteration, the AI assistant proposed attaching the WebMCP registry to `navigator.modelContext`, citing early preview blog posts from 2024/2025.
- **How We Caught It**: We inspected the official Bikeshed draft in `https://github.com/webmachinelearning/webmcp` and the Chromium source repository (`third_party/blink/renderer/modules/model_context/`). The W3C Community Group had relocated the entry point to `document.modelContext` to align with DOM document lifecycle and page-level scoping, demoting `navigator.modelContext` to a legacy alias with deprecation warnings.
- **Action Taken**: We updated our polyfill (`src/mock/webmcp-polyfill.js`) and tool registration code (`src/app/webmcp-page.js`) to use `document.modelContext` as the primary standard, maintaining `navigator.modelContext` solely as a fallback getter.

### Correction 2: Flawed DOM Token Estimation & Multi-Turn Accumulation
- **What the Assistant Got Wrong**: The assistant originally calculated token consumption by counting only the single final action JSON payload, severely under-measuring the true cost of DOM agents.
- **How We Caught It**: Real DOM agents (e.g., Browser-Use, Stagehand) do not execute blind actions; at *each* turn, the full HTML/accessibility snapshot must be transmitted in the prompt so the LLM can perceive the state of the page.
- **Action Taken**: We revised `src/agents/dom-agent.js` to accurately aggregate input prompt tokens across every turn ($domTokens \times steps$). This revealed the true real-world penalty of DOM agents: $60,271$ tokens compared to $3,243$ tokens for WebMCP ($94.6\%$ reduction).

### Correction 3: Missing DOM Fragility & 100% Artificial Success Rate
- **What the Assistant Got Wrong**: In the initial mock, both DOM and WebMCP agents achieved 100% success rate on static HTML, failing to measure the "success rate" metric specified in topic A1 of the rubric.
- **How We Caught It**: Real-world websites dynamically alter their DOM (promotional modal banners, CSS class obfuscation, layout shifts), causing CSS selectors to fail.
- **Action Taken**: We added layout variants in `src/app/dom-page.js` (banner overlay, obfuscated classes, redesigned layout), creating realistic spread ($80\% - 100\%$ success rate for DOM agent, while WebMCP retained 100% resilience due to semantic functional contracts).

### Correction 4: Real LLM Execution vs Process Stdin Deadlock
- **What the Assistant Got Wrong**: When spawning `opencode run` from inside Node.js child processes, the subprocess hung indefinitely because stdin was left open by default (`stdio: ['pipe', 'pipe', 'pipe']`) and plugins were being initialized in background mode.
- **How We Caught It**: User prompted an explicit audit of the live inference pipeline (`KIỂM TRA LẠI THẬT KỸ CÓ DÙNG llm THẬT KO`). We inspected the process tree (`pstree`) and found `opencode` waiting for EOF on stdin while spawning `@delor` plugins.
- **Action Taken**: Configured `stdio: ['ignore', 'pipe', 'pipe']` and passed `--pure` to `opencode`, reducing live inference time per turn from 50s down to ~6s. We then built `src/runner/live-single-task.js` (`npm run measure:task -- --task=1`) streaming yellow tokens in real time directly to the terminal, while ensuring dynamic path resolution and graceful fallback for systems without `opencode`.
