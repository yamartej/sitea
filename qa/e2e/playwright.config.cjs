const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /navigation\.spec\.cjs/,
  timeout: 45000,
  expect: { timeout: 15000 },
  retries: 1,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3001",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  reporter: [["line"], ["junit", { outputFile: "qa/e2e/results.xml" }]],
});
