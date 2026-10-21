# Group 14 Deep Research on AI Companies

An interactive dashboard comparing Google, Meta, OpenAI and Anthropic for students and business researchers.

**GitHub Pages address:** https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/

The public dashboard is deployed through GitHub Actions.

## What works on GitHub Pages

- Financial comparisons and chart controls.
- A Stock Performance workspace using Gemini and Google Search for cited quote snapshots, period returns (1D through 5Y), valuation, volume, beta and technical metrics; compare Alphabet (GOOGL), Meta (META) and up to two added listed companies.
- On-demand FY2025 company comparisons using Gemini Google Search grounding, with autocomplete suggestions, cited source links and an option to remove the added company.
- Product and strategy comparisons, with access-route filters.
- A workload-based API cost calculator.
- Agentic research assistant combining BM25 retrieval across reviewed documents and the latest 30 days of collected official AI news with optional Gemini Google Search research.
- Answers validate inline reviewed-source IDs and HTTPS web citations, display supporting links and research steps, and fall back visibly to retrieved evidence if Gemini Search fails.
- A searchable source library with collected news, pricing and collection logs.
- Research-method explanations and a five-minute presentation view.

The website is public. The Gemini key belongs to the viewer, stays in page memory, and is sent only to Google's Gemini API when the research agent is enabled. It is not written to browser storage, the repository or GitHub Pages. Do not commit API keys or add them to GitHub Actions for this version. Source summaries retrieve from reviewed company notes and recent dated news headlines without a key. The Gemini agent receives query-relevant local evidence, performs Google Search, and returns a concise answer with validated local source IDs and HTTPS search citations. Failed search, missing citations or invalid local IDs falls back visibly to retrieved source evidence; generated text with invalid references is withheld. News headlines are discovery leads and are not treated as verified article summaries. Explicit multi-company questions retrieve both named companies even when a single-company filter was selected. The reviewed corpus includes Claude Code and Google Antigravity documentation; product descriptions do not establish a tested winner.

The Overview's **Compare** control accepts custom public or private company names, with common-name suggestions. It sends the company name and the viewer's Gemini key directly to Google's Gemini API, which uses Google Search grounding to research FY2025 revenue, gross margin, gross profit, net income/loss and revenue growth. Results are added to the currently selected factor chart, and Google Search citations are shown below it. Gemini may report a measure as unavailable when it cannot substantiate it. These on-demand results are not independently reviewed or saved; **Remove comparison** restores the baseline chart. Google Search grounding, model access and API billing depend on the viewer's account and key.

The Stock Performance workspace starts with a fixed, Yahoo Finance-cited snapshot for Alphabet (GOOGL) and Meta (META), dated October 20, 2026. It includes each close, daily range/change, 52-week range, session volume, and a daily-close trend over September 21–October 20; the 1M return is calculated from those dated closes. The snapshot is not live, and valuation/technical fields are unavailable in it. Enter a Gemini key and choose Compare Stock to request a fresh Google Search-grounded report, with 1D/1W/1M/3M/6M/1Y/5Y returns, a selected-range dated history, valuation, volume, beta and technical metrics when cited sources report them. The global company selector also filters this workspace: All shows Google and Meta, Google or Meta focuses on that listed company, and OpenAI or Anthropic explains why no listed-stock chart is available. Up to two user-added listed companies can be compared alongside a selected public company. The historical line chart indexes each series to 0% at its first point; missing history is never invented or interpolated. Gemini Search is not a dedicated market-data feed, and results can be delayed, unavailable or incorrectly reported. The key stays in page memory and is sent directly to Google; results are not independently reviewed or saved. Verify linked sources; this research is not investment advice.

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
