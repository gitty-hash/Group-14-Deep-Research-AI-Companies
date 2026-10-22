# AI Strategy Observatory

An interactive research dashboard for comparing Google, Meta, OpenAI and Anthropic across business performance, products, model access, API costs, public-stock data and cited AI-industry research.

**Live dashboard:** [gitty-hash.github.io/Group-14-Deep-Research-AI-Companies](https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/)

The project is designed as a research and presentation tool: it brings comparable metrics and source links into one interface while distinguishing reviewed facts, reported estimates and on-demand AI-generated research.

## Run the live dashboard ? for recruiters, professors and reviewers

No download, installation or access to the author's Gemini account is needed.

1. Open the [live dashboard](https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/). Explore the reviewed company data, charts, dated stock snapshots, model cost calculator, source library and Word/Excel exports immediately; these do not need a key.
2. To use live Gemini features, create or select **your own Gemini API key** in [Google AI Studio](https://aistudio.google.com/app/apikey). Sign in with your Google account. See Google's [API-key instructions](https://ai.google.dev/gemini-api/docs/api-key) for project setup.
3. Select **Gemini API key** in the dashboard header. Paste the key into the masked field and select **Use key for this tab**. The header changes to **Gemini key: added**. This means the key is present; Google checks it when a research request is made.
4. In **Research assistant**, enable **Use Gemini agent with Google Search and retrieved source documents**, enter a question and submit. The floating robot's Gemini option uses the same key. **Overview ? Compare** and **Stock Performance ? Compare Stock** also use it.
5. To replace or remove it, reopen the header button and use the entry field or **Clear key**. Reloading or closing the page also clears it. Each browser tab starts without a key.

Your requests use **your own Google project's quota and any applicable charges**, never the author's key. Availability depends on your account's model and Google Search access, regional availability, quota and billing configuration; a Google AI Studio key does not guarantee free usage or access to every model. See Google's [billing documentation](https://ai.google.dev/gemini-api/docs/billing/).

**Troubleshooting:** If asked for a key, add it using the header button. For HTTP 400/401/403, check the copied key, project permissions and model access in Google AI Studio. HTTP 429 indicates a quota or rate limit; check your project or retry later. If the research service cannot be reached, reload or retry later. Reviewed source search and preloaded data remain available without Gemini.

## Project at a glance

- **Research question:** How do the four companies differ in business performance, product strategy, distribution and economics?
- **Interface:** Static, responsive dashboard with interactive charts, company filters and a searchable source library.
- **Data:** Reviewed FY2025 company financials, selected model and pricing information, dated stock snapshots, and periodically collected official company news and pricing pages.
- **Research assistant:** A floating animated robot chat launcher plus the full research tab, using local BM25 retrieval over reviewed documents and recent news, with optional Gemini generation and Google Search grounding using each visitor's own UI-entered key.
- **Deployment:** GitHub Pages dashboard with a public Sites-hosted Gemini API backend. Local development uses `server.mjs`; both deployments require the visitor to enter their key in the UI.
- **Runtime:** Node.js 22 or newer for building, tests and collection. No npm dependency installation is required.

### How the application is put together

The browser dashboard is built with HTML, CSS and JavaScript, and renders its comparisons and charts in the page. Reviewed company information and collected updates are served as JSON files from `docs/`. Node.js scripts assemble the static site, validate the application, and collect approved public-source updates. The research assistant ranks source notes locally with BM25; Gemini calls through a visitor-key API proxy add Google Search research and citation checks. Each visitor enters their own key in the dashboard. The browser keeps it in memory and sends it in a request header to the proxy, which forwards it to Google. Neither the local server nor the public backend supplies a shared credential. GitHub Actions runs the build, tests, data collection and deployment.

## Guided dashboard walkthrough

Open the [live dashboard](https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/) and follow these steps to understand the main features.

### 1. Compare company business performance

1. Open **Overview**.
2. Use the company filter to view **All companies**, **Google**, **Meta**, **OpenAI** or **Anthropic**.
3. Select a business-performance measure to update the chart and comparison table.
4. Review the source links and basis notes shown with the figures.
5. Select **Compare** to research another public or private company. Enter its name, then submit. Remove the added comparison to return to the reviewed baseline.

The baseline uses FY2025 annual financial information. Alphabet and Meta figures are based on company filings; private-company figures use attributed reporting. A custom comparison is produced on demand, is not independently reviewed or saved, and may leave figures unavailable when Gemini cannot substantiate them.

### 2. Explore products and strategy

1. Open **Products and strategy**.
2. Use the access-route filter to compare selected hosted API and open-weight offerings.
3. Review each entry's intended use, distribution approach, business context and citations.

The catalogue is intentionally selected rather than exhaustive. Vendor capability descriptions are not independent product tests or a quality ranking.

### 3. Estimate model API costs

1. Open **Model cost explorer**.
2. Set the requests per month, input tokens and output tokens for a representative workload.
3. Toggle Meta Contributor mode if you want to include its lower-cost option, which permits submitted content to be used for training.
4. Compare the estimates and inspect the pricing-basis notes and source links.

The calculator applies one workload to the selected model catalogue. It estimates token charges, not quality or total cost of ownership. It excludes items such as taxes, retries, tools/search, long-context premiums, caching or batch discounts, and self-hosting operations.

### 4. Review Stock Performance

1. Open **Stock Performance**. Alphabet (GOOGL) and Meta (META) are shown by default.
2. Select **1D**, **1W**, **1M**, **3M**, **6M**, **1Y** or **5Y** to change the dated price-history chart.
3. Review the market-capitalization and trailing-P/E comparison charts, quote cards, historical returns and linked sources.
4. To add listed companies, enter a company name or ticker and choose **Add company**. Up to two additional companies can be included.
5. Choose **Compare Stock** to request a cited Google Search-grounded report for the selected companies and range.

The default Google and Meta chart series are a fixed Yahoo Finance snapshot dated October 20, 2026: 15-minute samples for 1D, daily samples for 1W/1M, weekly samples for 3M/6M/1Y, and monthly samples for 5Y. The snapshot's market capitalization and trailing P/E values were checked before the October 21 market open. These are historical values, not live quotes. The line chart indexes each stock to 0% at the first point so different share prices can be compared. The snapshot does not include every technical indicator. Gemini Search is not a dedicated market-data feed; on-demand results can be delayed, sparse or incorrect. Verify the citations; this is not investment advice.

The global company filter also applies to this view. **All** displays Google and Meta; **Google** or **Meta** focuses on that listed company. OpenAI and Anthropic are private companies and do not have exchange-listed shares.

### 5. Ask the research assistant

1. Open **Research assistant**, or select the floating robot button in the bottom-right corner from any dashboard tab for a quick chat. The robot performs four short reactions—wave, bounce, curious head tilt and cheer—with matching eye and mouth expressions on successive hover or click interactions.
2. Enter a question about the companies, their strategy, products, financials or recent AI-industry developments.
3. Search the reviewed source collection, or enable Gemini web research for a generated answer grounded in retrieved evidence and Google Search. Add your own key with **Gemini API key** in the header, then tick the Gemini option. Both checkboxes remain selectable; without a key, source retrieval still works and the interface explains how to add one.
4. Follow the inline evidence references and source links. Expand the research steps to inspect how evidence was retrieved; choose **Open full Research assistant** for the complete research view.

Retrieval combines reviewed company materials with recent collected official news. News headlines are discovery leads, not independently verified article summaries. If Gemini Search fails or produces missing or invalid citations, the interface falls back to retrieved evidence; generated text with invalid local references is withheld. Asking about multiple named companies retrieves evidence for each, even when a company filter is selected.

### 6. Inspect sources and collection status

1. Open **Source library** to search the reviewed documents used across the dashboard: financial comparisons, product and strategy notes, API pricing, and the preloaded Google and Meta stock snapshot.
2. Review collection timestamps and any failed-source notes to understand how current the published news and pricing data are.
3. Current news collection and Gemini Search citations appear alongside their related updates or answers; use those links and the library links to check claims against their original context.

### 7. Export a report or workbook

1. Select **Export data** in the dashboard header.
2. Choose **Word report (.docx)** for a formatted research summary or **Excel workbook (.xlsx)** for separate, filterable data sheets.
3. The Word report includes the research overview, company comparisons, model pricing, available stock summary, insights, published news and cited sources. The workbook includes those data categories plus stock measures and dated price history.

Exports are generated in the browser from the currently loaded published snapshot and include any current company or stock comparison. Values that are unavailable stay blank or are identified as unavailable. Financial, pricing and market-data caveats remain part of the exported material; exports do not independently verify research claims.

## Data, definitions and research limitations

### Financial comparison

The baseline comparison covers FY2025 revenue, gross margin, gross profit, net income or loss, and revenue growth. These are company-wide results, not AI-only revenue or AI-only research spending. Revenue growth compares 2025 with 2024; Anthropic uses its reported rounded rate.

- Gross profit is revenue less cost of revenue for Alphabet, Meta and OpenAI. Anthropic's gross profit is estimated from reported revenue and an approximate implied margin; it is not a disclosed gross-profit line item.
- Gross-margin calculations use reported revenue and cost-of-revenue classifications for Alphabet, Meta and OpenAI. Anthropic's approximately 40% figure is a reported implied estimate. Different cost classifications mean this is not a fully standardized profitability ranking.
- Net income/loss uses consolidated results for Alphabet and Meta, the loss attributable to OpenAI after noncontrolling interests, and Anthropic's reported GAAP net loss.
- OpenAI and Anthropic losses include substantial noncash financing charges and should not be interpreted as cash burn.
- Private-company data uses attributed reporting and was not independently confirmed against private-company source documents.

Financial inputs are manually reviewed. The automated news and pricing collector does not overwrite them.

### Scheduled and manual updates

The GitHub Actions workflow builds and tests the site, checks official company news and supported API pricing sources, saves the published update record, and deploys GitHub Pages. It runs on relevant pushes to `main`, can be started manually, and is scheduled daily at **15:00 UTC**. Scheduled workflow times are best effort and may be delayed.

The collector checks four official news sources and six supported API pricing pages. It records timestamps, results, errors and content hashes; if an extraction fails, previously collected information is retained where possible. A successful fetch does not independently verify a publisher's claims. Newly collected news does not automatically become part of the reviewed answer corpus.

The dashboard's **Reload published data** button loads the already-published JSON snapshot. It does not start a new collection run. To run the collection locally, use `node scripts/refresh-data.mjs` from the repository root; this needs network access and updates `docs/data/updates.json`.

## Run the project locally

### Prerequisites

- Git
- Node.js 22 or newer
- A web browser

### Setup

1. Clone the repository and enter its folder:

   ```sh
   git clone https://github.com/gitty-hash/Group-14-Deep-Research-AI-Companies.git
   cd Group-14-Deep-Research-AI-Companies
   ```

2. Build the dashboard and start the local server. No package installation is required:

   ```sh
   node build.mjs
   node server.mjs
   ```

3. Open [http://127.0.0.1:8787](http://127.0.0.1:8787). For Gemini features, select **Gemini API key** in the header and enter your own key, exactly as on the live dashboard. No Gemini key belongs in `.env`, repository files or GitHub Actions secrets. `.env.example` contains only the optional `PORT` setting.
4. Run validation from another terminal:

   ```sh
   node test.mjs
   node server.test.mjs
   node api-routing.test.mjs
   node export.test.mjs
   ```

A plain static server can display snapshots and local source search. Use `node server.mjs` for local Gemini requests. To refresh published news and pricing locally, run `node scripts/refresh-data.mjs`; this uses public sources and needs no Gemini key.

## Deployment

The GitHub Pages workflow builds and tests the dashboard, collects public-source updates and publishes `docs/`. The public dashboard sends Gemini requests to [the hosted Gemini API proxy](https://group14-observatory-gemini-api.frostystoat7.chatgpt.site), whose origin is declared in `runtime-config.json`. This configuration contains no credential. Localhost uses its own `server.mjs` proxy.

The backend source is maintained in the sibling `gemini-api-sites` checkout and its Sites source repository. It accepts browser requests from `https://gitty-hash.github.io`, permits the `x-gemini-api-key` request header, and enforces request-size and per-client burst limits. **Every Gemini request must include the visitor's key.** Missing or malformed keys are rejected before contacting Google. The backend ignores any legacy `GEMINI_API_KEY` environment value; the owner's hosted secret has been removed. `/api/config` reports `keyMode: "visitor"` and never returns a key.

When forking or hosting at another origin, deploy the backend too, configure its `ALLOWED_ORIGIN` to your Pages origin, and update `runtime-config.json` to your backend's HTTPS origin. Never add a shared key to the backend. GitHub Pages serves static files and cannot run `server.mjs` itself.

## Gemini key handling and privacy

- The masked entry field is available from every dashboard tab and from both research settings panels.
- The key stays in a JavaScript closure in the current tab, separate from dashboard data. The application does not write it to local/session storage, cookies, a database, repository files, exports or application logs. The input is emptied after use or dismissal.
- When the visitor requests Gemini research, their key is sent over HTTPS in `x-gemini-api-key` to the research proxy, then in Google's `x-goog-api-key` header to Google. The proxy handles the key transiently; it is not a direct browser-to-Google connection. It does not place the key in URLs or prompt/request bodies, and redacts the key if an upstream response echoes it.
- **Clear key**, reloading and closing the page remove the application's in-memory key. A key is not shared with another tab or visitor. Requests already sent to Google may still finish after clearing the key.
- The research assistant, floating chat, company comparison and stock comparison all use the visitor's current key. There is no fallback to the website owner's credential. Backend availability alone cannot enable generation, and the dashboard refuses legacy services that do not advertise visitor-key support.
- Google processes prompts and retrieved evidence under the visitor's account and applicable [Gemini API terms](https://ai.google.dev/gemini-api/terms). Treat keys as secrets and use a trusted browser/device. Key validity, model access, quota, billing and Google Search availability are checked by Google at request time.

The automated tests mock Google requests and verify key clearing/replacement, isolation between visitors, missing-key rejection even with a legacy owner environment value, CORS, legacy-backend rejection, and exclusion from public data and exports. No real visitor key is needed to run tests.

## Repository map

| Path | Purpose |
| --- | --- |
| `template.html` | Dashboard layout, styles, navigation, charts and browser interactions |
| `seed.mjs` | Reviewed company data, source library, baseline model and pricing catalogue |
| `stock-history.json` | Fixed dated GOOGL and META close series for the seven chart ranges |
| `stock-snapshot.mjs` | Builds the preloaded stock metrics, returns and citations |
| `pages-api.js` | Browser data access, same-origin research requests and response validation |
| `server.mjs` | Local static server and visitor-key Gemini proxy; `.env` supplies optional port only |
| `.env.example` | Optional local port template; Gemini keys are entered only in the UI |
| `server.test.mjs` | Server routing, private credentials, error and access checks |
| `runtime-config.json` | Public hosted API origin; never contains a credential |
| `api-routing.test.mjs` | Hosted/local visitor-key routing, clearing and legacy-backend rejection |
| `rag-core.js` | BM25 retrieval, evidence selection, Gemini prompts and citation validation |
| `office-export.js` | Browser-generated Word reports and Excel workbooks |
| `export.test.mjs` | Office package, data, escaping and credential-exclusion checks |
| `collector.mjs` | Official news and API-pricing collection and parsing |
| `scripts/refresh-data.mjs` | Runs collection and writes `docs/data/updates.json` |
| `build.mjs` | Builds the static GitHub Pages site and JSON data under `docs/` |
| `test.mjs` | Checks retrieval, citations, data validation, charts, calculations and collection behavior |
| `.github/workflows/pages.yml` | Build, test, scheduled/manual collection and GitHub Pages deployment |
| `docs/` | Generated static site published by GitHub Pages; rebuild instead of hand-editing generated files |

## Known limitations

- Public-market snapshots are dated and should not be treated as live quotes. Google Search grounding is not a dedicated market-data service.
- Unavailable data is left unavailable rather than estimated. Technical indicators are not present in the default fixed stock snapshot.
- Gemini-generated comparisons and research answers are on-demand outputs, not independently reviewed research. Always check citations and original sources.
- The product catalogue is selected, not exhaustive; vendor claims are not independent benchmarks.
- The cost calculator estimates token charges under stated assumptions and does not compare model quality or total operating costs.
- Public-company financials include non-AI business lines. Private-company figures rely on attributed reporting and may use different reporting bases.
