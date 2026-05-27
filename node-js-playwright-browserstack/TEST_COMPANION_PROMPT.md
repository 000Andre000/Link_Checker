# Test Companion Prompt — Staples Link Validation Setup

Copy and paste the prompt below into Test Companion to regenerate this exact setup from scratch.

---

## Prompt to send to Test Companion

```
I need you to create an end-to-end link validation test for a website using Playwright and BrowserStack Automate.

Here is the use case:

We have a spreadsheet (CSV) that is our source of truth for web asset links. Every week we test assets on staples.com to ensure their click-through links match this data.

The CSV has two columns:
- source_url: the full URL including tracking parameters (ivid) that the asset links to
- expected_destination_url: either a full URL OR just the bare ivid string to validate against

The test should:
1. Read all rows from sample.csv
2. For each row:
   a. Start at https://www.staples.com (homepage) so the Back button works
   b. Navigate to the source_url
   c. Capture: HTTP status code, page title, load time, actual destination URL
   d. Compare the ivid parameter in the actual destination URL against the expected_destination_url column
      - If expected_destination_url starts with "http": extract its ivid and compare
      - If expected_destination_url is a bare string: treat it as the ivid value directly
      - Fallback: base-path comparison if no ivid present
   e. Press the browser Back button and capture the URL after going back
   f. Write results to a timestamped log folder after every test

3. Generate two log files per run in logs/link-checker-csv-<timestamp>/:
   - results.json with fields: url, source, ok, httpStatus, pageTitle, loadTimeMs, beforeUrl, destinationUrl, afterUrl, expectedDestination, urlMatched, errors[]
   - results.html with a styled table showing: #, Source, URL, Status, HTTP, Page Title, Load Time, Before URL, Destination URL, After URL (after Back), URL Match vs CSV, Errors

4. Run on BrowserStack Automate using the browserstack-node-sdk (Windows 10 / Chrome 120)

5. Create a GitHub Actions workflow (.github/workflows/staples-link-validation.yml) that:
   - Triggers manually (workflow_dispatch) with a csv_content text input
   - Writes the CSV input to sample.csv
   - Injects BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY from GitHub secrets into browserstack.yml at runtime
   - Runs the tests via the SDK
   - Uploads results.html and results.json as artifacts (retained 30 days)
   - Posts the BrowserStack Automate build URL + pass/fail summary table in the workflow summary

The project uses Node.js + Playwright (@playwright/test) + browserstack-node-sdk.
The test file should go in tests/staples_link_validation.test.js.
Use CommonJS (require/module.exports) syntax.
Add a realistic user-agent and --disable-http2 launch arg to avoid HTTP/2 protocol errors on staples.com.

Sample CSV rows to use:
source_url,expected_destination_url
https://www.staples.com/party-supplies/cat_SC350593?ivid=Pg:B;Pl:HP;Pt:B;Cmp:Cam_TopDeals_Pro_5OffPartySupplies_P_HP_SLOT_2_SEQ_2_Cat_Breakroom_Asset_4BY_P3W3-W4,Pg:B;Pl:HP;Pt:B;Cmp:Cam_TopDeals_Pro_5OffPartySupplies_P_HP_SLOT_2_SEQ_2_Cat_Breakroom_Asset_4BY_P3W3-W4
https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;Pt:B;Cmp:Cam_Graduation_Pro_GradGifts_P_HP_SLOT_1_SEQ_3_Cat_All_Asset_Sliver_P3W2-W4,https://www.staples.com/gift-shop/cat_SC1699?ivid=Pg:B;Pl:HP;Pt:B;Cmp:Cam_Graduation_Pro_GradGifts_P_HP_SLOT_1_SEQ_3_Cat_All_Asset_Sliver_P3W2-W4
https://www.staples.com/printer-ink-cartridges-toner-finder/cat_SC43?ivid=Pg:B;Pl:LP;Pt:B;Cmp:Cam_TopDeals_Pro_15BIPInkandToner_HP_SLOT_1_SEQ_6_Cat_Tech_Asset_4BY_P3W3-W4,Pg:B;Pl:LP;Pt:B;Cmp:Cam_TopDeals_Pro_15BIPInkandToner_HP_SLOT_1_SEQ_6_Cat_Tech_Asset_4BY_P3W3-W4
https://www.staples.com/hp-17-3-fhd-laptop-intel-core-i3-n305-8gb-ram-512gb-ssd-9-5-hours-battery-windows-11-home/product_24631637?IPID=NGAM;12283680&ivid=Pg:B;Pl:HP;Pt:B;Cmp:Cam_TopDeals_Pro_399.99HPLaptopSMN_P_HP_SLOT_4_SEQ_6_Cat_Tech_Asset_4BY_P3W3-W4,https://www.staples.com/hp-17-3-fhd-laptop-intel-core-i3-n305-8gb-ram-512gb-ssd-9-5-hours-battery-windows-11-home/product_24631637?IPID=NGAM;12283680&ivid=Pg:B;Pl:HP;Pt:B;Cmp:Cam_TopDeals_Pro_399.99HPLaptopSMN_P_HP_SLOT_4_SEQ_6_Cat_Tech_Asset_4BY_P3W3-W4
https://www.staples.com/deals/printer-deals/BI3001697?ivid=Pg:B;Pl:HP;Pt:B;Cmp:Cam_TopDeals_Pro_PrinterDeals_P_HP_SLOT_5_SEQ_6_Cat_Tech_Asset_4BY_P3W3-W4,Pg:B;Pl:HP;Pt:B;Cmp:Cam_TopDeals_Pro_PrinterDeals_P_HP_SLOT_5_SEQ_6_Cat_Tech_Asset_4BY_P3W3-W4
```

---

## What Test Companion will generate

- `tests/staples_link_validation.test.js` — CSV-driven Playwright test
- `sample.csv` — source-of-truth URL spreadsheet
- `.github/workflows/staples-link-validation.yml` — GitHub Actions workflow
- `README.md` — setup and usage documentation
- `logs/link-checker-csv-<timestamp>/results.html` + `results.json` — generated on each run
