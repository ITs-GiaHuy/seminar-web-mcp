# WebMCP vs. DOM Actuation Agent Benchmark

> **CSC13114 Advanced Web Application Development · Seminar Study (Topic A1)**  
> **Topic**: WebMCP: a page exposes its functions to in-browser agents (W3C community draft, in trial in Chrome)  
> **Repository**: [https://github.com/ITs-GiaHuy/seminar-web-mcp](https://github.com/ITs-GiaHuy/seminar-web-mcp)

---

## Overview

This repository provides a fully reproducible empirical study comparing **WebMCP (`document.modelContext`)** against traditional **DOM Actuation Agents** across 5 realistic web workflows (Search, Filtering, Cart Mutation, Form Entry, Checkout) over 5 complete runs under varied web conditions (standard DOM, promotional banners, class obfuscation, layout redesign).

### Headline Results
- **Step Reduction**: **−77.3%** ($4.4 \rightarrow 1.0$ steps per task)
- **Token Reduction**: **−94.6%** ($60,271 \rightarrow 3,243$ prompt tokens across 5 tasks)
- **Latency Reduction**: **−95.5%** ($3,071 \rightarrow 138$ ms execution time)
- **UI Resilience**: WebMCP maintains **100% success rate** when layout changes cause DOM agents to break.

---

## Quickstart (Fresh Clone to Measurement)

### Prerequisites
- Node.js $\ge$ 18 (Tested on Node.js v24.16.0)
- npm $\ge$ 9

### Step 1: Clone the repository
```bash
git clone https://github.com/ITs-GiaHuy/seminar-web-mcp.git
cd seminar-web-mcp
```

### Step 2: Install dependencies
*(The project uses zero heavy native dependencies or browser binaries; installation completes in seconds)*
```bash
npm install
```

### Step 3: Run the Measurement Command
To re-run the benchmark and recompute the statistical tables from recorded runs (100% offline, zero API keys required for Red Team):
```bash
npm run measure
```

To execute a fresh live benchmark run across all 5 runs x 5 tasks:
```bash
npm run measure:live
```

---

## Visual Interactive Demo (For Video Talk & Slides)

To see both agents running side-by-side with live animations, token counters, and DOM inspection:
1. Open [`demo/index.html`](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/demo/index.html) directly in any modern web browser (Google Chrome recommended):
   ```bash
   google-chrome demo/index.html
   ```
2. Click **"Run DOM Agent"** to observe multi-turn DOM scraping, token accumulation, and selector resolution.
3. Click **"Run WebMCP Agent"** to observe single-step direct execution via `document.modelContext`.

---

## Repository Structure

```
seminar-web-mcp/
├── README.md                      # Setup and reproduction instructions
├── REPORT.md                      # Max 3-page formal seminar report
├── AI-LOG.md                      # AI assistant usage log and corrections
├── SELF_ASSESSMENT_REPORT.md      # Rubric scoring self-assessment with evidence
├── TALK.md                        # Presentation video link and slide script
├── package.json                   # Scripts and project metadata
├── demo/
│   └── index.html                 # Visual side-by-side demonstration UI
├── src/
│   ├── app/                       # Target storefront web application
│   │   ├── catalog.js             # Inventory, cart, coupons, orders state
│   │   ├── dom-page.js            # DOM renderer & synthetic actuation handler
│   │   └── webmcp-page.js         # WebMCP document.modelContext tool declarations
│   ├── agents/
│   │   ├── dom-agent.js           # Baseline DOM-reading agent
│   │   └── webmcp-agent.js        # Change WebMCP tool-calling agent
│   ├── runner/
│   │   ├── benchmark.js           # 5-run benchmark orchestrator
│   │   ├── opencode-runner.js     # Headless opencode runner integration
│   │   └── metrics.js             # Median, spread (IQR/stddev), and token estimators
│   └── mock/
│       └── webmcp-polyfill.js     # W3C Web Machine Learning CG Draft polyfill
└── results/
    ├── run_1.json                 # Raw output of run 1 (standard DOM)
    ├── run_2.json                 # Raw output of run 2 (banner overlay)
    ├── run_3.json                 # Raw output of run 3 (standard DOM)
    ├── run_4.json                 # Raw output of run 4 (obfuscated classes)
    ├── run_5.json                 # Raw output of run 5 (layout redesign)
    └── summary.json               # Aggregated statistical summary
```

---

## Raw Data & Reproducibility Guarantee

Every number cited in [REPORT.md](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md) maps 1-to-1 to entries in:
- `results/summary.json`
- `results/run_{1..5}.json`

Running `npm run measure` re-reads these raw logs and generates the exact table matching the report.
