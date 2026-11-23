https://github.com/ITs-GiaHuy/seminar-web-mcp

# WebMCP: Exposing Client-Side Page Functions to In-Browser Agents

**Course**: CSC13114 · Advanced Web Application Development (23KTPM1)  
**Topic**: A1 — WebMCP: A page exposes its functions to in-browser agents (W3C community draft, in trial in Chrome)  
**Authors**: Seminar Study Team  

---

## 1. The Question

> **Research Question**: Does exposing client-side web application functions directly to in-browser agents via WebMCP (`document.modelContext`) instead of requiring the agent to parse and actuate the DOM reduce average steps per task by at least 70% and total prompt token consumption by at least 90%, while eliminating selector-fragility failures across realistic multi-step web workflows; and what latency, developer implementation complexity, and browser compatibility costs does it impose?

---

## 2. Experimental Setup

The benchmark is executed on a self-contained local testbed mimicking an interactive e-commerce platform across five representative end-user workflows:
- **Task 1 (Search & Lookup)**: Search catalog for keyword `"jacket"` bounded by maximum price `$80`.
- **Task 2 (Faceted Filtering & Sorting)**: Filter category `"electronics"` and sort descending by user rating.
- **Task 3 (State Mutation & Coupons)**: Add 2 units of `"PROD-101"` to cart and apply discount coupon `"DISCOUNT20"`.
- **Task 4 (Form Autofill & Validation)**: Fill structured shipping address for `"John Doe"`, postal code `"94105"`, email `"john@example.com"`.
- **Task 5 (Multi-Step Transaction)**: Add item to cart, complete shipping details, and finalize order checkout.

### System & Environment Specifications
- **Operating System**: Linux devx 7.0.0-43-generic #43-Ubuntu SMP PREEMPT_DYNAMIC x86_64
- **Runtime**: Node.js v24.16.0 (npm v11.13.0)
- **Browser Reference**: Google Chrome 157.0.8103.50 (WebMCP Origin Trial milestone)
- **Standard Reference**: W3C Web Machine Learning Community Group WebMCP Draft Specification (read November 2026)
- **Repetition**: 5 full test runs ($5 \text{ runs} \times 5 \text{ tasks} = 25 \text{ task executions per agent}$), subject to environmental variants (standard DOM, promotional modal banner overlay, class obfuscation, and DOM layout redesign).

---

## 3. Baseline and Change (What was Held Fixed)

- **What was Held Strictly Fixed**:
  - The underlying web application state, inventory catalog (10 items), business validation rules, and ground-truth validators.
  - The 5 user task instructions and target goals.
  - The local machine, CPU load, and network isolation (localhost execution).
  - The tokenization tokenizer model calibration (~3.8 characters per token).

- **The Baseline (DOM Actuation Agent)**:
  The agent interacts with the application as traditional autonomous web assistants (e.g., Browser-Use, Stagehand) do: extracting serialized HTML/accessibility DOM trees at every interaction turn, submitting the full page structure to the model context, generating JSON actions (`click`, `type`, `select`), and dispatching synthetic events onto CSS selectors.

- **The Change (WebMCP `document.modelContext`)**:
  The application declares typed tool definitions directly in client-side JavaScript via `document.modelContext.registerTool({ name, description, inputSchema, execute, annotations })`. The in-browser agent queries `document.modelContext.getTools()`, consumes only compact JSON Schema declarations, and dispatches semantic function calls directly inside the page's execution context.

---

## 4. Quantitative Results

All numbers below represent the **median and spread [min – max]** calculated across all 5 recorded runs from `results/run_1.json` through `results/run_5.json` and summarized in `results/summary.json`.

| Metric | Baseline (DOM Actuation) | Change (WebMCP) | Delta (%) |
| :--- | :--- | :--- | :--- |
| **Avg Steps / Task** | **4.4** [4.4 – 5.4] steps | **1.0** [1.0 – 1.0] step | **−77.3%** |
| **Total Prompt Tokens (5 tasks)** | **60,271** [59,345 – 74,172] tok | **3,243** [3,243 – 3,243] tok | **−94.6%** |
| **Total Output Tokens (5 tasks)** | **350** [350 – 415] tok | **174** [174 – 174] tok | **−50.3%** |
| **Total Tokens Consumed** | **60,621** [59,695 – 74,587] tok | **3,417** [3,417 – 3,417] tok | **−94.4%** |
| **Task Success Rate** | **100%** [80% – 100%] | **100%** [100% – 100%] | **+0.0 pts (median)** / **+20 pts (run 5)** |
| **Total Execution Duration** | **3,071** [3,047 – 3,261] ms | **138** [126 – 152] ms | **−95.5%** |

### Key Observations from Raw Logs
1. **Dramatic Token Reduction (−94.6%)**: In the DOM baseline, re-transmitting the DOM snapshot on every intermediate step burns an average of ~12,000 prompt tokens per task ($60,271$ tokens across 5 tasks). WebMCP provides complete task fulfillment with only $3,243$ prompt tokens because JSON schemas describe actions far more concisely than rendering markup.
2. **Step Collapse (−77.3%)**: Tasks requiring 4 to 7 individual DOM actions (typing each input field sequentially, clicking search, scrolling, and clicking submit) collapsed into **1.0 single compound tool call** via WebMCP.
3. **Resilience to Presentation Shifts**: In Run 2 (banner overlay modal) and Run 5 (layout redesign), the DOM baseline suffered latency spikes ($3,261\text{ ms}$) and a task failure ($80\%$ success rate on Run 5) due to click interception. WebMCP maintained a strict $100\%$ success rate across all runs because function execution is completely decoupled from visual CSS and DOM hierarchy.

---

## 5. Findings & Recommendations

### Advantages
- **Drastic Cost & Latency Reduction**: Cutting prompt tokens by $94.4\%$ directly translates to a $\sim 18\times$ reduction in LLM inference costs and eliminates multi-turn agent network latency.
- **Decoupled Architecture**: Developers can refactor UI components, swap CSS frameworks, or introduce modal dialogs without breaking AI browser agents.
- **Shared Session Context**: Because tools run inside the page context (`document.modelContext`), execution automatically inherits logged-in authentication, cookies, and local client state without backend proxy duplication.

### Costs & Trade-Offs
- **Developer Overhead**: Web teams must design, expose, validate, and maintain typed JSON Schema tool definitions alongside their visual components.
- **Browser Coverage**: WebMCP is currently in Origin Trial in Google Chrome (M149–M157). As of late 2026, Mozilla Firefox and Apple Safari do not natively implement `document.modelContext`, necessitating polyfills or server fallbacks.
- **Security & Attack Surface**: Exposing mutating client-side functions (`readOnlyHint: false`) to LLMs introduces risks of indirect prompt injection. Developers must use `consequentialHint: true` to trigger explicit user confirmation dialogs before high-stakes actions (such as financial checkout or data deletion).

### When NOT to Use WebMCP
- **Static, Read-Only Content Sites**: Informational blogs, documentation, and news portals where reading text and standard accessibility trees suffices without functional state mutations.
- **Unauthenticated or Untrusted Page Embeds**: Multi-tenant third-party iframes where tool exposure could enable cross-origin privilege escalation.
- **Highly Fluid UI Exploration**: When an agent's primary purpose is visual UX testing or visual layout inspection rather than transactional execution.

### Limits of This Measurement
- **Synthetic vs. Cloud LLM Latency**: Measurements reflect client-side processing, DOM serialization, and token consumption. Live cloud LLM roundtrips would introduce $500\text{--}1500\text{ ms}$ of network variance per step, which further widens the real-world advantage of WebMCP's 1-step flow.
- **DOM Size Variance**: Real-world enterprise websites (e.g., Amazon, Salesforce) possess DOM trees $5\times$ to $10\times$ larger than our testbed, meaning real-world token savings will exceed the $94.6\%$ observed here.

---

## 6. Sources and Facts

1. **W3C Web Machine Learning Community Group**, *Web Model Context Protocol (WebMCP) Specification (Community Draft)*, GitHub repository: `https://github.com/webmachinelearning/webmcp`, Bikeshed spec draft. Read and verified: November 18, 2026.
2. **Google Chrome Developers**, *Chrome Origin Trials: Model Context API in Chrome 149–157*, Chromium Feature Dashboard: `https://developer.chrome.com/origintrials`. Read and verified: November 20, 2026.
3. **Chromium Source Code**, *Runtime Enabled Features: `WebMCP` and `document.modelContext`*, Chromium Code Search: `https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/model_context/`. Read and verified: November 21, 2026.
4. **Model Context Protocol (MCP) Specification**, *Anthropic / Model Context Protocol Working Group*, `https://modelcontextprotocol.io/specification`. Read and verified: November 19, 2026.
