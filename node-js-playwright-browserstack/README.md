# Staples Link Validation — Playwright + BrowserStack Automate

End-to-end automated link validation for Staples.com web assets. Reads source URLs and expected destination URLs from a CSV, navigates each link, validates the `ivid` tracking parameter, captures page title and HTTP status, navigates back, and generates timestamped HTML + JSON reports.

---

## How it works

1. Reads `sample.csv` with two columns: `source_url` and `expected_destination_url`
2. For each row: navigates to the source URL on BrowserStack, validates the `ivid` param matches, captures HTTP status + page title, presses Back
3. Writes `results.html` and `results.json` to a timestamped folder under `logs/`
4. Uploads logs as GitHub Actions artifacts and posts the BrowserStack Automate build link in the workflow summary

---

## CSV format

```csv
source_url,expected_destination_url
https://www.staples.com/party-supplies/cat_SC350593?ivid=Pg:B;Pl:HP;Pt:B;Cmp:...,Pg:B;Pl:HP;Pt:B;Cmp:...
https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;...,https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;...
```

The `expected_destination_url` column accepts:
- **Bare ivid string** — compared directly against the destination URL ivid param
- **Full URL** — ivid is extracted and compared
- **No ivid** — falls back to base-path comparison

---

## Local run

```bash
npm install
npx browserstack-node-sdk playwright test tests/staples_link_validation.test.js --config=./playwright.config.js
```

Logs are written to `../logs/link-checker-csv-<timestamp>/`.

---

## GitHub Actions (automated)

### Setup (one-time)

1. Push this repo to GitHub
2. Go to **Settings → Secrets and variables → Actions** and add:
   - `BROWSERSTACK_USERNAME`
   - `BROWSERSTACK_ACCESS_KEY`
3. Make sure `browserstack.yml` does NOT contain real credentials (the workflow injects them at runtime)

### Running the workflow

1. Go to **Actions → Staples Link Validation → Run workflow**
2. Paste your CSV content (header + rows) into the input box
3. Click **Run workflow**

### What you get after the run

| Output | Where |
|--------|-------|
| BrowserStack Automate build link | Workflow summary |
| HTML report | `link-validation-html-report` artifact |
| JSON report | `link-validation-json-report` artifact |
| Pass/Fail table | Workflow summary |

---

## Report columns

| Column | Description |
|--------|-------------|
| # | Row number |
| Source | Always `csv` |
| URL (Source) | The source URL from the CSV |
| Status | ✓ OK / ✗ FAIL |
| HTTP | HTTP response status code |
| Page Title | Title of the destination page |
| Load Time | Navigation time in ms |
| Before URL | staples.com homepage (starting point) |
| Destination URL | Actual URL after navigation |
| After URL (after Back) | URL after pressing browser Back |
| URL Match vs CSV | ✓ Match / ✗ Mismatch of ivid param |
| Errors | Any errors encountered |

---

## BrowserStack configuration

Edit `browserstack.yml` to change the target platform:

```yaml
platforms:
  - os: Windows
    osVersion: 10
    browserName: Chrome
    browserVersion: 120.0
```

---

## Files

```
node-js-playwright-browserstack/
├── .github/
│   └── workflows/
│       └── staples-link-validation.yml   # GitHub Actions workflow
├── tests/
│   └── staples_link_validation.test.js   # Main test file
├── browserstack.yml                       # BrowserStack platform config
├── playwright.config.js                   # Playwright config
├── package.json
└── sample.csv                             # Source-of-truth URL spreadsheet
```
