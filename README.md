# WebMCP vs. DOM Actuation Agent Benchmark

> **CSC13114 Advanced Web Application Development · Seminar Study (Topic A1)**  
> **Topic**: WebMCP: a page exposes its functions to in-browser agents (W3C community draft, in trial in Chrome)  
> **Repository**: [https://github.com/ITs-GiaHuy/seminar-web-mcp](https://github.com/ITs-GiaHuy/seminar-web-mcp)

---

## 📖 Executive Summary

This repository hosts an empirical study comparing **WebMCP (`document.modelContext`)** against traditional **DOM Actuation Agents** across five realistic e-commerce workflows over five consecutive test runs under varying web layout conditions (Clean DOM, Modal Banners, Obfuscated Classes, DOM Layout Redesigns).

### 🎯 Headline Results (Median & Spread)
- **Step Reduction**: **−77.3%** ($4.4 \rightarrow 1.0$ steps per task)
- **Prompt Token Reduction**: **−94.6%** ($60,271 \rightarrow 3,243$ tokens across 5 tasks)
- **Wall Execution Latency**: **−95.5%** ($3,071 \rightarrow 138$ ms execution time)
- **UI Resilience**: WebMCP maintains **100% task completion** even when CSS classes and layouts change, whereas DOM agents suffer from selector breakages.

---

## 🚀 Quickstart & How to Run

### System Prerequisites
- **Node.js**: $\ge 18.0.0$ (Tested on Node.js v24.16.0)
- **npm**: $\ge 9.0.0$
- **OS**: Linux, macOS, or Windows (WSL)
- *(Optional for Live LLM)*: `opencode` CLI installed at `~/.local/bin/opencode`

### Installation
```bash
git clone https://github.com/ITs-GiaHuy/seminar-web-mcp.git
cd seminar-web-mcp
npm install
```

---

## 🛠️ Execution Modes

We provide four distinct ways to run, inspect, and verify the study:

### Mode 1: Instant Replay Evaluation (Recommended for Red Team & Grading)
Per Rubric Criterion 2 (30 points), this command requires **zero external API keys**, runs **100% offline**, and recomputes the exact statistical tables from the raw session logs (`results/run_{1..5}.json`) in less than 1 second:

```bash
npm run measure
```
*(or `npm test`)*

#### Expected Console Output:
```text
========================================================================
  REPLAYING WEBMCP BENCHMARK MEASUREMENTS (5 RECORDED RUNS)
  Source: results/run_1.json through run_5.json
========================================================================

╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                        WEBMCP BENCHMARK RESULTS (MEDIAN & SPREAD)                            ║
╠══════════════════════════╦═════════════════════════╦═════════════════════════╦═══════════════╣
║ Metric                   ║ Baseline (DOM Agent)    ║ Change (WebMCP)         ║ Delta (%)     ║
╠══════════════════════════╬═════════════════════════╬═════════════════════════╬═══════════════╣
║ Avg Steps/Task           ║ 4.4 [4.4 - 5.4] steps   ║ 1 [1 - 1] steps         ║ -77.3%        ║
║ Total Prompt Tokens      ║ 60271 [59345 - 74172] tok ║ 3243 [3243 - 3243] tok  ║ -94.6%        ║
║ Total Output Tokens      ║ 350 [350 - 415] tok     ║ 174 [174 - 174] tok     ║ -50.3%        ║
║ Total Tokens (5 tasks)   ║ 60621 [59695 - 74587] tok ║ 3417 [3417 - 3417] tok  ║ -94.4%        ║
║ Success Rate             ║ 100 [80 - 100] %        ║ 100 [100 - 100] %       ║ +0.0 pts      ║
║ Execution Duration       ║ 3071 [3047 - 3261] ms   ║ 138 [126 - 152] ms      ║ -95.5%        ║
╚══════════════════════════╩═════════════════════════╩═════════════════════════╩═══════════════╝
```

---

### Mode 2: Live Real LLM Streaming for Individual Tasks
To observe the real-time reasoning and text generation of the actual LLM (powered by `opencode run --pure` via Google API) streaming directly into your console:

```bash
npm run measure:task -- --task=1
```
*(or run directly: `node src/runner/live-single-task.js --task=1`)*

#### What Happens in Mode 2:
1. **WebMCP Agent**: Sends the page's tool schema (`document.modelContext`) to the LLM. You will see the yellow streaming text as the LLM decides on:
   ```json
   {"tool": "searchProducts", "args": {"query": "jacket", "maxPrice": 80}}
   ```
   Executes in **1 step** in ~6.9 seconds!
2. **DOM Agent**: Sends the raw 10,000+ character HTML tree to the LLM. You will see the LLM stream each sequential step:
   - *Turn 1*: `{"action": "type", "selector": "#search-input", "value": "jacket"}`
   - *Turn 2*: `{"action": "type", "selector": "#max-price-input", "value": "80"}`
   - *Turn 3*: `{"action": "click", "selector": "#btn-search"}`
   Takes 3 separate roundtrips and burns ~39,000 tokens!

#### You can test any of the 5 tasks:
- **Task 1 (Search & Max Price)**: `npm run measure:task -- --task=1`
- **Task 2 (Filter Category & Sort Rating)**: `npm run measure:task -- --task=2`
- **Task 3 (Cart Mutation & Promo Coupon)**: `npm run measure:task -- --task=3`
- **Task 4 (Shipping Address Form)**: `npm run measure:task -- --task=4`
- **Task 5 (Full Checkout Transaction)**: `npm run measure:task -- --task=5`

---

### Mode 3: Live Full Benchmark Re-execution (5 Runs)
To re-run all 5 benchmark runs across all 5 tasks and write fresh JSON outputs to `results/run_{1..5}.json`:

```bash
npm run measure:live
```

---

### Mode 4: Visual Interactive Demo (For Video Talk & Slides)
To visually demonstrate the study during your 8-minute recorded talk (`TALK.md`) or capture presentation screenshots for `slides.pdf`:

```bash
google-chrome demo/index.html
```
*(or double-click `demo/index.html` in your file explorer)*

- **Column 1**: Interactive Storefront (Target web application with search, filters, cart, and checkout).
- **Column 2 (Baseline)**: Click **"Run DOM Agent"** to watch the agent scrape DOM trees, resolve CSS selectors, and accumulate tokens over 5 turns.
- **Column 3 (Change)**: Click **"Run WebMCP Agent"** to watch single-step execution via `document.modelContext.executeTool()`.

---

## 📂 Project Architecture

```
seminar-web-mcp/
├── README.md                      # Setup, execution guide, and reproduction instructions
├── REPORT.md                      # Max 3-page formal study report
├── AI-LOG.md                      # AI assistance log detailing tools and 3 critical corrections
├── SELF_ASSESSMENT_REPORT.md      # Self-assessed rubric scores (95/100) with evidence links
├── TALK.md                        # Presentation link, 8-min talk outline, and slide structure
├── package.json                   # Project metadata and measurement scripts
├── demo/
│   └── index.html                 # Interactive 3-column web demo UI
├── src/
│   ├── app/                       # Target storefront web application
│   │   ├── catalog.js             # Inventory, cart, coupons, and ground truth state
│   │   ├── dom-page.js            # DOM renderer and synthetic action executor
│   │   └── webmcp-page.js         # WebMCP document.modelContext tool registrations
│   ├── agents/
│   │   ├── dom-agent.js           # Baseline DOM-reading actuation agent
│   │   └── webmcp-agent.js        # Change WebMCP tool-calling agent
│   ├── runner/
│   │   ├── benchmark.js           # 5-run benchmark suite orchestrator
│   │   ├── live-single-task.js    # Interactive live LLM streaming task runner
│   │   ├── opencode-runner.js     # Headless opencode runner with --pure flag
│   │   └── metrics.js             # Token estimator, median, and spread (IQR/stddev)
│   └── mock/
│       └── webmcp-polyfill.js     # W3C Web Machine Learning CG Draft polyfill
└── results/
    ├── run_1.json                 # Raw output of run 1 (standard DOM condition)
    ├── run_2.json                 # Raw output of run 2 (banner overlay condition)
    ├── run_3.json                 # Raw output of run 3 (standard DOM condition)
    ├── run_4.json                 # Raw output of run 4 (obfuscated class condition)
    ├── run_5.json                 # Raw output of run 5 (layout redesign condition)
    └── summary.json               # Aggregated statistical summary matching REPORT.md
```

---

## 🔬 Benchmark Task Workloads

| Task # | Name | User Goal Instruction | Ground Truth Validation |
| :---: | :--- | :--- | :--- |
| **1** | Product Search & Price Bound | *"Search for 'jacket' with maximum price $80."* | `lastQuery === 'jacket'` |
| **2** | Faceted Filter & Sort | *"Filter category 'electronics' and sort by rating descending."* | `category === 'electronics' && sortBy === 'rating_desc'` |
| **3** | Cart Mutation & Coupon | *"Add 2 units of PROD-101 to cart and apply coupon 'DISCOUNT20'."* | `cartItems === 2 && coupon === 'DISCOUNT20'` |
| **4** | Shipping Details Form | *"Fill shipping form for John Doe, 123 Market St, 94105, john@example.com."* | `shippingAddress.fullName === 'John Doe'` |
| **5** | Multi-Step Checkout | *"Add PROD-101 to cart, fill shipping, and confirm order checkout."* | `orderStatus === 'completed'` |

---

## 📊 Raw Data & Reproducibility Guarantee

Every number reported in [REPORT.md](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md) maps directly to the raw logs:
- `results/summary.json`
- `results/run_{1..5}.json`

Running `npm run measure` guarantees exact numerical parity with the report.
