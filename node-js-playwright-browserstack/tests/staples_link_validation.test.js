const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Staples.com Link & Destination Validation
 *
 * Reads source_url + expected_destination_url from sample.csv.
 * For each row:
 *   1. Capture beforeUrl (current page URL before navigation)
 *   2. Navigate to source_url, measure load time, capture HTTP status & page title
 *   3. Validate actual destination URL base matches expected_destination_url base
 *   4. Navigate back, capture afterBackUrl
 *
 * Logs: link-checker-csv-<timestamp>.json + .html written to staples/ root
 */

test.use({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  launchOptions: {
    args: ['--disable-http2'],
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const [header, ...rows] = lines;
  const keys = header.split(',');
  return rows.map(row => {
    const commaIdx = row.indexOf(',');
    const values = [row.slice(0, commaIdx), row.slice(commaIdx + 1)];
    return Object.fromEntries(keys.map((k, i) => [k.trim(), (values[i] || '').trim()]));
  });
}

function makeTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function writeJsonLog(filePath, summary, records, generatedAt) {
  const out = { summary, records, generatedAt };
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2), 'utf-8');
}

function writeHtmlLog(filePath, summary, records, ts) {
  const rows = records.map((r, i) => {
    const bg = i % 2 === 0 ? '#f9f9f9' : '#fff';
    const statusHtml = r.ok
      ? `<span style="color:green;font-weight:bold">&#10003; OK</span>`
      : `<span style="color:red;font-weight:bold">&#10007; FAIL</span>`;
    const urlMatchHtml = r.urlMatched
      ? `<span style="color:green;font-weight:bold">&#10003; Match</span>`
      : `<span style="color:red;font-weight:bold">&#10007; Mismatch</span>`;
    const errorsHtml = r.errors.length === 0
      ? `<span style="color:green">None</span>`
      : r.errors.map(e => escHtml(e)).join('<br>');
    return `
    <tr style="background:${bg}">
      <td>${i + 1}</td>
      <td>${escHtml(r.source)}</td>
      <td style="word-break:break-all"><a href="${escHtml(r.url)}" target="_blank">${escHtml(r.url)}</a></td>
      <td>${statusHtml}</td>
      <td>${r.httpStatus}</td>
      <td>${escHtml(r.pageTitle)}</td>
      <td>${r.loadTimeMs} ms</td>
      <td style="word-break:break-all">${escHtml(r.beforeUrl)}</td>
      <td style="word-break:break-all">${escHtml(r.destinationUrl)}</td>
      <td style="word-break:break-all">${escHtml(r.afterUrl)}</td>
      <td>${urlMatchHtml}<br><small style="color:#555">${escHtml(r.expectedDestination)}</small></td>
      <td style="color:${r.errors.length ? 'red' : 'green'};word-break:break-all">${errorsHtml}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Link Checker Report — csv — ${ts}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:20px}
    h1{color:#333}
    .summary{background:#eef;padding:12px;border-radius:6px;margin-bottom:20px}
    .summary span{margin-right:20px;font-weight:bold}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th{background:#333;color:#fff;padding:8px;text-align:left}
    td{padding:6px 8px;border-bottom:1px solid #ddd;vertical-align:top}
    a{color:#0066cc}
  </style>
</head>
<body>
  <h1>Link Checker Report</h1>
  <div class="summary">
    <span>Generated: ${new Date().toUTCString()}</span>
    <span>Mode: csv</span>
    <span>Total: ${summary.total}</span>
    <span style="color:green">Passed: ${summary.passed}</span>
    <span style="color:red">Failed: ${summary.failed}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Source</th><th>URL (Source)</th><th>Status</th><th>HTTP</th>
        <th>Page Title</th><th>Load Time</th><th>Before URL</th><th>Destination URL</th><th>After URL (after Back)</th><th>URL Match vs CSV</th><th>Errors</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(filePath, html, 'utf-8');
}

// ── Setup ─────────────────────────────────────────────────────────────────────

// Support both local layout (../../sample.csv) and CI layout (../sample.csv or ./sample.csv)
const CSV_PATH = (() => {
  const candidates = [
    path.resolve(__dirname, '../sample.csv'),
    path.resolve(__dirname, '../../sample.csv'),
    path.resolve(__dirname, 'sample.csv'),
  ];
  return candidates.find(p => fs.existsSync(p)) || candidates[0];
})();
const TS       = makeTimestamp();
// Write logs to <project-root>/logs/ so GitHub Actions can find them
const LOG_DIR  = path.resolve(__dirname, `../logs/link-checker-csv-${TS}`);
fs.mkdirSync(LOG_DIR, { recursive: true });
const JSON_LOG = path.join(LOG_DIR, 'results.json');
const HTML_LOG = path.join(LOG_DIR, 'results.html');

const urlEntries = parseCsv(CSV_PATH);
const records = [];

// ── Tests ─────────────────────────────────────────────────────────────────────

for (const entry of urlEntries) {
  const { source_url, expected_destination_url } = entry;

  test(`Link validation: ${source_url}`, async ({ page }) => {
    const record = {
      url: source_url,
      source: 'csv',
      ok: false,
      httpStatus: null,
      pageTitle: '',
      loadTimeMs: 0,
      beforeUrl: source_url,           // source URL (before click/navigation)
      destinationUrl: '',              // actual URL after navigation (click-through destination)
      afterUrl: '',                    // URL after pressing browser Back
      expectedDestination: expected_destination_url,
      urlMatched: false,
      errors: [],
    };

    // Start from staples homepage so Back button has a real page to return to
    const HOMEPAGE = 'https://www.staples.com';
    await page.goto(HOMEPAGE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    record.beforeUrl = page.url(); // capture actual homepage URL (after any redirects)

    // Intercept response to capture HTTP status of the source URL navigation
    let httpStatus = null;
    page.once('response', resp => {
      if (resp.url().startsWith('https://www.staples.com')) {
        httpStatus = resp.status();
      }
    });

    const t0 = Date.now();
    try {
      await page.goto(source_url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (err) {
      record.errors.push(`Navigation error: ${err.message}`);
    }
    record.loadTimeMs = Date.now() - t0;
    record.httpStatus = httpStatus ?? 0;
    record.pageTitle  = await page.title().catch(() => '');

    // Capture destination URL (after navigation / any redirects)
    record.destinationUrl = page.url();

    // Flexible comparison: expected_destination_url can be either:
    //   (a) a full URL  → extract its ivid param and compare with destination's ivid
    //   (b) a bare ivid string (no "http") → compare directly with destination's ivid
    const extractIvid = url => {
      try { return new URL(url).searchParams.get('ivid') || null; } catch { return null; }
    };
    const isFullUrl       = expected_destination_url.startsWith('http');
    const expectedIvid    = isFullUrl ? extractIvid(expected_destination_url) : expected_destination_url.trim();
    const destinationIvid = extractIvid(record.destinationUrl);

    if (expectedIvid) {
      // ivid-based comparison
      record.urlMatched = expectedIvid === destinationIvid;
      record.ivid = { expected: expectedIvid, actual: destinationIvid };
      if (!record.urlMatched) {
        record.errors.push(`ivid mismatch — expected: "${expectedIvid}" | got: "${destinationIvid}"`);
      }
    } else {
      // Fallback: base-path comparison (no ivid in either side)
      const actualBase   = record.destinationUrl.split('?')[0];
      const expectedBase = expected_destination_url.split('?')[0];
      record.urlMatched  = actualBase === expectedBase;
      if (!record.urlMatched) {
        record.errors.push(`URL mismatch — expected: ${expectedBase} | got: ${actualBase}`);
      }
    }
    if (record.httpStatus && record.httpStatus >= 400) {
      record.errors.push(`HTTP ${record.httpStatus} response`);
    }

    record.ok = record.urlMatched && record.errors.length === 0;

    // Navigate back and capture afterUrl (URL after pressing Back)
    try {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { /* ignore back-nav errors */ }
    record.afterUrl = page.url() || record.beforeUrl;

    // Write logs after every test so partial results are always saved
    records.push(record);
    const passed = records.filter(r => r.ok).length;
    const summary = { mode: 'csv', total: records.length, passed, failed: records.length - passed };
    writeJsonLog(JSON_LOG, summary, records, new Date().toISOString());
    writeHtmlLog(HTML_LOG, summary, records, TS);

    // Assert — failures surface in Playwright output AND are captured in logs
    expect(record.urlMatched, `URL mismatch — expected: ${record.expectedDestination} | got: ${record.afterUrl}`).toBe(true);
    expect(record.errors, `Errors found: ${record.errors.join('; ')}`).toHaveLength(0);
  });
}