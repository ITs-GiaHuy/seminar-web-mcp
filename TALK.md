# Recorded Talk & Presentation Guide (TALK.md)

**Course**: CSC13114 · Advanced Web Application Development (23KTPM1)  
**Topic**: A1 — WebMCP: A page exposes its functions to in-browser agents (W3C community draft, in trial in Chrome)  

---

## 1. Recorded Talk Video Link

- **Video URL**: `https://youtu.be/PLACEHOLDER_VIDEO_LINK` *(or Google Drive unlisted link)*
- **Duration**: **07:35** (Strictly within the 8-minute limit)
- **Language**: Spoken in Vietnamese (with English slides, as permitted by rubric)

---

## 2. Talk Outline & Speaker Breakdown

Every team member presents an active part in the presentation:

### Part 1: The Research Question & Context (00:00 – 02:15) · *Member 1*
- **The Problem with Current Web Agents**: Why DOM scraping, screenshots, and simulated mouse clicks are brittle, slow, and burn tens of thousands of tokens per session.
- **The WebMCP Proposal**: Background on the W3C Web Machine Learning Community Group draft and Chrome Origin Trial (Chrome 149–157).
- **The Research Question**: Stating the exact quantitative research question and what was held strictly fixed.

### Part 2: The Benchmark Demo & Quantitative Results (02:15 – 05:20) · *Member 2*
- **Live Demonstration**: Showing `demo/index.html` running side-by-side:
  - Demonstrating the Baseline DOM Agent struggling through multi-turn DOM scraping and banner interception.
  - Demonstrating the WebMCP Agent completing the task directly in 1 turn via `document.modelContext.executeTool()`.
- **The Headline Numbers (Median & Spread over 5 Runs)**:
  - Steps: $4.4 \rightarrow 1.0$ steps per task (**−77.3%**)
  - Prompt Tokens: $60,271 \rightarrow 3,243$ tokens (**−94.6%**)
  - Execution Duration: $3,071 \rightarrow 138$ ms (**−95.5%**)
  - Success Rate: $100\%$ resilience vs DOM layout breaks.
- **Replay Mode Verification**: Showing `npm run measure` running live in console and matching `results/summary.json`.

### Part 3: Findings, Trade-Offs, and Recommendations (05:20 – 07:35) · *Member 3*
- **Cost Analysis**:
  - Developer implementation complexity (maintaining JSON schemas).
  - Security surface: Indirect prompt injection and the necessity of `consequentialHint: true` human authorization gates.
  - Browser support: Origin Trial in Chrome; lack of native Safari/Firefox support as of late 2026.
- **When NOT to use WebMCP**: Static read-only blogs, untrusted iframes, and exploratory visual testing.
- **Concluding Takeaway**: Why WebMCP represents the natural evolution from "agents pretending to be humans" to "web apps designed for agents".

---

## 3. Slide Deck Overview (`slides.pdf`)

- **Slide 1**: Title, Authors (Student IDs), Topic A1 WebMCP.
- **Slide 2**: The Challenge: Why DOM-Actuating Agents Fail on the Modern Web.
- **Slide 3**: The Solution: WebMCP & `document.modelContext` (W3C Draft / Chrome Trial).
- **Slide 4**: The Research Question & Controlled Experimental Setup.
- **Slide 5**: Benchmark Demo: Side-by-Side Architectural Flow.
- **Slide 6**: Headline Measurements: Steps, Tokens, Duration (Median & Spread Table).
- **Slide 7**: Resilience Analysis: What Happens When the UI Layout Changes?
- **Slide 8**: Costs & Security Trade-Offs: When NOT to Use WebMCP.
- **Slide 9**: Summary & Recommendations for Web Developers.
