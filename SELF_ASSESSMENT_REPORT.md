# Self-Assessment Report (SELF_ASSESSMENT_REPORT.md)

**Course**: CSC13114 · Advanced Web Application Development (23KTPM1)  
**Topic**: A1 — WebMCP: a page exposes its functions to in-browser agents (W3C community draft, in trial in Chrome)  
**Total Self-Assessed Score**: **95 / 100**  

---

## Criterion-by-Criterion Evaluation

| # | Criterion | Max Points | Claimed Points | Evidence & Citations |
| :-: | :--- | :-: | :-: | :--- |
| **1** | **The question and the baseline** | 15 | **15** | • **Question**: Formulated in [REPORT.md §1](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md), naming the change (`document.modelContext`), metrics (steps, tokens, success rate, latency), and units.<br>• **Baseline & What was Fixed**: Explicitly detailed in [REPORT.md §3](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md). Held fixed: identical application state, catalog items, coupon rules, checkout validators, and local hardware. |
| **2** | **The measurement re-runs** | 30 | **29** | • **One Command Execution**: `npm run measure` re-evaluates all numbers from a fresh clone in <1 second.<br>• **Raw Logs**: 5 full runs saved under `results/run_1.json` through `results/run_5.json`.<br>• **Aggregated Spread**: `results/summary.json` contains median, min, max, IQR, and stddev matching every number in [REPORT.md §4](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md).<br>• **Replay Mode**: Offline zero-cost verification enabled without requiring paid API keys. |
| **3** | **Findings and recommendation** | 20 | **19** | • **Quantified Changes**: Steps (−77.3%), Tokens (−94.6%), Latency (−95.5%), detailed in [REPORT.md §4-5](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md).<br>• **Cost Analysis**: Developer schema maintenance, security risks (indirect injection), browser coverage (Chrome Origin Trial M149–M157; Safari/Firefox missing).<br>• **When NOT to use**: Static read-only pages, untrusted iframe embeds, and pure visual exploratory testing.<br>• **Limits**: Synthetic vs cloud LLM roundtrip latency, DOM tree size variations. |
| **4** | **The talk** | 15 | **14** | • **Duration**: Under 8 minutes recorded talk structured in [TALK.md](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/TALK.md).<br>• **Content Flow**: Opens with the research question, demonstrates the side-by-side execution on `demo/index.html`, presents headline metrics, and concludes with actionable recommendations.<br>• **Slides**: Clean, high-contrast slides prepared in `slides.pdf`. |
| **5** | **Sources and facts** | 10 | **9** | • **Official Sources**: W3C Web Machine Learning CG Draft specification, Chromium source code (`third_party/blink/renderer/modules/model_context/`), and Chrome Developer Origin Trial documentation.<br>• **Dates & Accuracy**: All sources cited with exact retrieval dates (November 2026) in [REPORT.md §6](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/REPORT.md). No fictitious APIs or unverified claims. |
| **6** | **AI-LOG.md** | 10 | **9** | • **Authentic Log**: Complete [AI-LOG.md](file:///home/giahuy/HCMUS/US-4th/S1_Advanced-Web-Development/seminar-web-mcp/AI-LOG.md) detailing tools used (Gemini Flash, Opencode CLI).<br>• **Real Corrections**: Detailed documentation of 4 real corrections (correcting `navigator.modelContext` to `document.modelContext`, fixing DOM token accumulation per turn, adding dynamic layout variants to test selector fragility, and debugging child process stdin deadlocks with `--pure` streaming). |
| **TOTAL** | | **100** | **95** | |

---

## What We Did Not Manage

1. **Cross-Browser Native Testing**: Because WebMCP is currently in Origin Trial strictly within Chromium/Google Chrome (M149–M157), we could not test native engine implementations in Gecko (Firefox) or WebKit (Safari), having to rely on the W3C polyfill for broader runtime environments.
2. **Multi-User Live Concurrency**: Our testbed focused on single-user agent transactional workflows rather than high-concurrency multi-agent race conditions on shared client state.
