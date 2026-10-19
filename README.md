# Group 14 Deep Research on AI Companies

An interactive dashboard comparing Meta and Google for students and business researchers.

**GitHub Pages address:** https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/

The address becomes live after GitHub Pages is enabled and the deployment workflow succeeds.

## What works on GitHub Pages

- Financial comparisons and chart controls.
- Product and strategy comparisons, with access-route filters.
- A workload-based API cost calculator.
- Local BM25 evidence search across eleven reviewed primary sources.
- Gemini RAG using each viewer's own Gemini API key.
- A searchable source library with collected news, pricing and collection logs.
- Research-method explanations and a five-minute presentation view.

The website is public. The Gemini key belongs to the viewer, stays in page memory, and is sent only to Google's Gemini API when generation is enabled. It is not written to browser storage, the repository or GitHub Pages. Do not commit API keys or add them to GitHub Actions for this version. Evidence search requires no key.

## One-time publishing setup

1. Open this repository's **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open **Actions > Update data and deploy GitHub Pages > Run workflow** if no deployment is already running.
4. Wait for a successful run and open the Pages address above.

If repository Actions are disabled, enable them for this repository first. The deployment uses GitHub's built-in token with contents, Pages and identity permissions; it requires no personal access token or Gemini secret.

## Data updates

The workflow runs after relevant pushes, on manual request, and daily at **15:00 UTC / 8:00 a.m. Phoenix time**. GitHub schedules are best effort; they can run late and may stop after inactivity in a public repository. Use the collection timestamp to judge freshness.

The workflow fetches official Google and Meta news feeds and supported API pricing tables. It records collection errors and content hashes, preserves earlier prices or headlines where extraction fails, saves `docs/data/updates.json`, and deploys the resulting site. A successful fetch does not independently verify publisher claims. Newly discovered headlines do not enter the reviewed answer corpus automatically.

**Reload published data** reads the JSON snapshot already published by the workflow. It does not run the collection job from the browser. The open page rechecks that published file every 15 minutes.

Financial charts remain reviewed **Q2 2026** results compared with Q2 2025. Google financials refer to parent Alphabet; these are not standalone AI-revenue or market-share figures. Update `seed.mjs` only after reviewing new original sources.

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
| `pages-api.js` | Browser-side retrieval, data loading and Gemini requests |
| `seed.mjs` | Reviewed facts, sources and baseline prices |
| `collector.mjs` | Official-source collection and parsing |
| `scripts/refresh-data.mjs` | Writes a new published update record |
| `build.mjs` | Builds static files under `docs/` |
| `test.mjs` | Application and collection checks |
| `.github/workflows/pages.yml` | Data refresh and deployment workflow |

## Limits

Gemini calls depend on the viewer's key, quota, model access and account terms. The code checks missing or unknown citation IDs, but readers must still verify generated claims. Model prices do not establish equivalent quality. Estimates exclude search/tools, retries, taxes, caching discounts and self-hosting costs.
