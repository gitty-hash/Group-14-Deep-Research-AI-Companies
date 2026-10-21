# Group 14 Deep Research on AI Companies

An interactive dashboard comparing Google, Meta, OpenAI and Anthropic for students and business researchers.

**GitHub Pages address:** https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/

The public dashboard is deployed through GitHub Actions.

## What works on GitHub Pages

- Financial comparisons and chart controls.
- Product and strategy comparisons, with access-route filters.
- A workload-based API cost calculator.
- Local BM25 retrieval and concise source summaries across 31 reviewed sources.
- Answer-first Gemini RAG using each viewer's own Gemini API key; supporting sources follow the answer.
- A searchable source library with collected news, pricing and collection logs.
- Research-method explanations and a five-minute presentation view.

The website is public. The Gemini key belongs to the viewer, stays in page memory, and is sent only to Google's Gemini API when generation is enabled. It is not written to browser storage, the repository or GitHub Pages. Do not commit API keys or add them to GitHub Actions for this version. Source summaries require no key. Gemini generates two to four short sentences from retrieved notes and supplies structured source references. One format repair is allowed; failed or unavailable generation falls back to relevant source sentences with a visible notice. No unvalidated generated answer is shown. Explicit multi-company questions retrieve both named companies even when a single-company filter was selected. The reviewed corpus includes Claude Code and Google Antigravity documentation; product descriptions do not establish a tested winner.

## One-time publishing setup

1. Open this repository's **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions > Update data and deploy GitHub Pages > Run workflow** if no deployment is already running.
4. Wait for a successful run and open the Pages address above.

If repository Actions are disabled, enable them for this repository first. The deployment uses GitHub's built-in token with contents, Pages and identity permissions; it requires no personal access token or Gemini secret.

## Data updates

The workflow runs after relevant pushes, on manual request, and daily at **15:00 UTC / 8:00 a.m. Phoenix time**. GitHub schedules are best effort; they can run late and may stop after inactivity in a public repository. Use the collection timestamp to judge freshness.

The workflow checks official news for all four companies and six supported API pricing pages (ten source checks in total). It records collection errors and content hashes, preserves earlier prices or headlines where extraction fails, saves `docs/data/updates.json`, and deploys the resulting site. A successful fetch does not independently verify publisher claims. Newly discovered headlines do not enter the reviewed answer corpus automatically.

**Reload published data** reads the JSON snapshot already published by the workflow. It does not run the collection job from the browser. The open page rechecks that published file every 15 minutes.

Financial comparisons use **FY2025 annual revenue, gross margin, gross profit, net income/loss and revenue growth** for all four companies. Alphabet and Meta use SEC annual filings. OpenAI uses reported financial statements (Ed Zitron, corroborated by Ars Technica); Anthropic uses Reuters prospectus reporting, Reuters Breakingviews analysis and Yahoo Finance. The underlying private-company documents were not independently inspected here.

Gross margin is calculated from reported revenue and cost of revenue for Alphabet, Meta and OpenAI. Anthropic’s approximately 40% is a reported implied estimate. The separately reported 33% adjusted OpenAI margin is a different basis and is not used in the chart. Cost classifications differ, so the chart is not a fully standardized profitability ranking. Revenue growth compares 2025 with 2024; Anthropic uses the reported rounded 1,088% rate. Run rates and forecasts are excluded. Company-wide results include businesses beyond AI. Financial inputs are manually reviewed, not replaced by the automated news collector.

Gross profit is revenue less cost of revenue for Alphabet, Meta and OpenAI. Anthropic’s gross profit is an estimate from its reported revenue and approximate implied margin, not a disclosed gross-profit line item. Net income/loss uses consolidated results for Alphabet and Meta, the loss attributable to OpenAI after noncontrolling interests, and Anthropic’s reported GAAP net loss. OpenAI and Anthropic losses include substantial noncash financing charges; they do not measure cash burn. The chart supports positive and negative values around a zero baseline.

The original private Sites deployment and its cloud schedule are independent. They do not publish updates to this repository.

## Local use

Requires Node.js 22 or newer. No npm installation is required.

```sh
node build.mjs
node scripts/refresh-data.mjs
node test.mjs
```

Serve `docs/` with a static HTTP server. Opening `index.html` directly as a file is unsupported because the application loads JSON files through HTTP.

## Files

| File | Role |
| --- | --- |
| `template.html` | Dashboard layout and UI source |
| `pages-api.js` | Browser data loading and calls to the shared RAG engine |
| `rag-core.js` | Shared BM25 retrieval, source summaries, Gemini prompt and citation validation |
| `seed.mjs` | Reviewed facts, sources and baseline prices |
| `collector.mjs` | Official-source collection and parsing |
| `scripts/refresh-data.mjs` | Writes a new published update record |
| `build.mjs` | Builds static files under `docs/` |
| `test.mjs` | Application and collection checks |
| `.github/workflows/pages.yml` | Data refresh and deployment workflow |

## Limits

Gemini calls depend on the viewer's key, quota, model access and account terms. The code checks missing or unknown citation IDs, but readers must still verify generated claims. The selected catalog has 14 model/access entries. Model prices do not establish equivalent quality. The calculator preserves one workload across company filters and limits input to 100,000 tokens per request to stay within the shared standard pricing tier. Estimates exclude long-context premiums, search/tools, retries, taxes, caching or batch discounts and self-hosting costs.
