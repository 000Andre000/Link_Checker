# Staples Link Validation — Playwright + BrowserStack Automate

End-to-end automated link validation for Staples.com web assets. Reads source URLs and expected destination URLs from a CSV, navigates each link, validates the `ivid` tracking parameter, captures page title and HTTP status, navigates back, and generates timestamped HTML + JSON reports.

---

## Repository Structure

```
Link_Checker/                              ← git root
├── .github/
│   └── workflows/
│       └── staples-link-validation.yml   ← GitHub Actions workflow
├── sample.csv                             ← Source-of-truth URL spreadsheet
├── README.md
└── node-js-playwright-browserstack/
    ├── browserstack.yml                   ← BrowserStack platform config
    ├── package.json
    ├── playwright.config.js               ← Playwright config (120s timeout)
    └── tests/
        └── staples_link_validation.test.js ← Main test file
```

---

## CSV Format

`sample.csv` lives at the repo root. Two columns:

```csv
source_url,expected_destination_url
https://www.staples.com/party-supplies/cat_SC350593?ivid=Pg:B;Pl:HP;...,Pg:B;Pl:HP;...
https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;...,https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;...
```

The `expected_destination_url` column accepts:
- **Bare ivid string** — compared directly against the destination URL's `ivid` param
- **Full URL** — `ivid` is extracted and compared
- **No ivid** — falls back to base-path comparison

---

## How It Works

For each CSV row the test:
1. Navigates to `https://www.staples.com` (homepage) as the starting point
2. Navigates to the `source_url` (simulating a click-through asset)
3. Captures: HTTP status, page title, load time, actual destination URL
4. Validates the `ivid` parameter against `expected_destination_url`
5. Presses the browser Back button and captures the return URL
6. Writes results to a timestamped log folder

---

## GitHub Actions (Automated)

### Setup (one-time)

1. Go to **Settings → Secrets and variables → Actions** and add:
   - `BROWSERSTACK_USERNAME`
   - `BROWSERSTACK_ACCESS_KEY`
2. Go to **Settings → Pages** → Source: **gh-pages** branch → **/ (root)** → Save

### Triggering the Workflow

The workflow runs automatically when `sample.csv` is updated (push). You can also trigger it manually:

**Actions → Staples Link Validation → Run workflow**

### What You Get After Each Run

| Output | Where |
|--------|-------|
| BrowserStack Automate build link | Workflow summary |
| Live HTML report (all runs) | `https://000andre000.github.io/Link_Checker/` |
| HTML report artifact | `link-validation-html-report` (30-day retention) |
| JSON report artifact | `link-validation-json-report` (30-day retention) |
| Pass/Fail summary table | Workflow summary |

---

## Report Columns

| Column | Description |
|--------|-------------|
| # | Row number |
| Source | Always `csv` |
| URL (Source) | The source URL from the CSV |
| Status | ✓ OK / ✗ FAIL |
| HTTP | HTTP response status code |
| Page Title | Title of the destination page |
| Load Time | Navigation time in ms |
| Before URL | `staples.com` homepage (starting point) |
| Destination URL | Actual URL after navigation |
| After URL (after Back) | URL after pressing browser Back |
| URL Match vs CSV | ✓ Match / ✗ Mismatch of `ivid` param |
| Errors | Any errors encountered |

---

## Local Run

```bash
cd node-js-playwright-browserstack
npm install
npx browserstack-node-sdk playwright test tests/staples_link_validation.test.js --config=./playwright.config.js
```

Logs are written to `node-js-playwright-browserstack/logs/link-checker-csv-<timestamp>/`.

---

## BrowserStack Configuration

Edit `node-js-playwright-browserstack/browserstack.yml` to change the target platform:

```yaml
platforms:
  - os: Windows
    osVersion: 10
    browserName: Chrome
    browserVersion: 120.0
```

---

## Updating the CSV Weekly

1. Open `sample.csv` in the GitHub UI (pencil icon) or push via git
2. Update the URLs
3. Commit — the workflow triggers automatically and results appear in the Actions tab