const config = {
  testDir: './',
  testMatch: 'tests/staples_link_validation.test.js',

  /* Generous timeout for BrowserStack remote browsers */
  timeout: 120 * 1000,
  expect: {
    timeout: 30000,
  },
  /* tests in parallel */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'line',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chrome',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
      },
    },
  ],
};

module.exports = config;