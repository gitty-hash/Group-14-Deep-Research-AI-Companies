# AI Strategy Observatory — Dashboard Feature Report

**Project:** Interactive research dashboard comparing Google, Meta, OpenAI and Anthropic  
**Live dashboard:** https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/

## Purpose

The dashboard brings company financials, selected AI products, API pricing, public-stock snapshots and cited research into one place. Its goal is to make comparisons easier to explore while showing where figures come from and where evidence has limitations.

## Tabs and features

### 1. Overview

- Compare the four companies across five FY2025 measures: revenue, gross margin, gross profit, net income or loss, and revenue growth.
- Switch between comparison metrics and filter by company.
- Review the data basis and source references for each measure.
- Use **Compare** to add an on-demand public or private company comparison researched with Gemini and Google Search.

### 2. Products and strategy

- Browse a selected catalogue of AI models and products.
- Filter products by access route, including hosted API and open-weight options.
- Compare intended use, distribution and strategy context, with links to supporting sources.

### 3. Model cost explorer

- Estimate token costs using an editable workload: monthly requests, input tokens and output tokens.
- Compare selected model prices and inspect their pricing sources.
- Include Meta Contributor pricing as an option, noting its training-use trade-off.

### 4. Stock Performance

- View Alphabet (GOOGL) and Meta (META) by default.
- Switch the historical line chart across **1D, 1W, 1M, 3M, 6M, 1Y and 5Y**.
- Compare historical price movement, market capitalization and trailing P/E; review quote metrics and linked sources.
- Add up to two listed companies and use **Compare Stock** for an on-demand Gemini and Google Search-grounded report.

### 5. Research assistant

- Search reviewed company research and recent collected official-news headlines using local BM25 retrieval.
- Optionally provide a personal Gemini API key to combine retrieved evidence with Google Search research.
- Review inline source references, supporting documents, search citations and research steps.
- The assistant reports evidence gaps and falls back to retrieved material when generated citations are missing or invalid.

### 6. Source library

- Search and filter reviewed documents used throughout the dashboard, including financial reporting, product and strategy sources, pricing documentation and the default GOOGL/META stock snapshot.
- Review official publisher updates and collection-health results, including timestamps and failed-source status.
- Follow links to check claims in their original context.

## Shared interactions

- The company filter applies across relevant views.
- Charts and comparison tables update as the user changes metrics, companies or stock ranges.
- Sources are linked near the data they support; missing values are not silently estimated.
- Published news and pricing snapshots can be reloaded from the dashboard. Collection and deployment are handled separately by GitHub Actions.

## Data and interpretation notes

- FY2025 company financials are company-wide and are not measures of AI-only revenue or spending. Private-company figures use attributed reporting; some values are calculated or estimated and are identified as such.
- Default Google and Meta stock histories are fixed Yahoo Finance snapshots dated October 20, 2026. They are historical, not live quotes. Market capitalization and P/E values are fixed snapshot values as well.
- Gemini Search is not a dedicated market-data feed. On-demand results may be delayed, incomplete or incorrect; check the provided citations.
- The product catalogue is selective, and vendor capability statements are not independent benchmarks.
- The cost calculator estimates token charges under stated assumptions; it does not establish equivalent model quality or total operating cost.
- Research and stock data are for exploration, not investment advice.

## Technology and operation

The dashboard is a static HTML/CSS/JavaScript site generated with Node.js and published to GitHub Pages by GitHub Actions. Reviewed research and snapshots are delivered as JSON. The optional research agent uses local BM25 retrieval, Gemini and Google Search grounding with citation validation. A viewer supplies their own Gemini key; the public site does not provide a shared key.
