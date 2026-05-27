# Staples Link Validation — GitHub Actions

## Setup

### 1. Add BrowserStack secrets to your GitHub repo
Go to **Settings → Secrets and variables → Actions** and add:
- `BROWSERSTACK_USERNAME` — your BrowserStack username
- `BROWSERSTACK_ACCESS_KEY` — your BrowserStack access key

### 2. Trigger the workflow
Go to **Actions → Staples Link Validation → Run workflow**

Paste your CSV content in the input box. Supported formats:

```
source_url,expected_destination_url
https://www.staples.com/party-supplies/cat_SC350593?ivid=Pg:B;Pl:HP;...,Pg:B;Pl:HP;...
https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;...,https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;...
```

The `expected_destination_url` column accepts:
- **Bare ivid string** — e.g. `Pg:B;Pl:HP;Pt:B;Cmp:...` (compared against the destination URL ivid param)
- **Full URL** — e.g. `https://www.staples.com/...?ivid=...` (ivid extracted and compared)

### 3. View results
After the run completes:
- **BrowserStack Automate build link** — shown in the workflow summary
- **HTML report** — download `link-validation-html-report` artifact
- **JSON report** — download `link-validation-json-report` artifact

## Local run
```bash
cd staples/node-js-playwright-browserstack
npx browserstack-node-sdk playwright test tests/staples_link_validation.test.js --config=./playwright.config.js
```
