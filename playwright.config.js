import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);

// in locale usa il Chrome già installato, in CI il Chromium scaricato da Playwright
const browser = isCI ? {} : { channel: 'chrome' };

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'desktop',
            testIgnore: /mobile\.spec\.js/,
            use: { ...devices['Desktop Chrome'], ...browser },
        },
        {
            name: 'mobile',
            testMatch: /mobile\.spec\.js/,
            use: { ...devices['Pixel 7'], ...browser },
        },
    ],
    webServer: {
        command: `npx http-server . -p ${PORT} -c-1 -s`,
        url: `http://127.0.0.1:${PORT}/index.html`,
        reuseExistingServer: !isCI,
    },
});
