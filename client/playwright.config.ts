import { defineConfig } from '@playwright/test';
import path from 'path';

const authFile = path.join(process.cwd(), 'tests', '.auth', 'admin.json');

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    trace: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'iPhone SE (375x667)',
      dependencies: ['setup'],
      use: {
        storageState: authFile,
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'Android Small (360x640)',
      dependencies: ['setup'],
      use: {
        storageState: authFile,
        viewport: { width: 360, height: 640 },
      },
    },
    {
      name: 'iPhone 14 (390x844)',
      dependencies: ['setup'],
      use: {
        storageState: authFile,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Pixel 7 (412x915)',
      dependencies: ['setup'],
      use: {
        storageState: authFile,
        viewport: { width: 412, height: 915 },
      },
    },
    {
      name: 'iPad / Tablet (768x1024)',
      dependencies: ['setup'],
      use: {
        storageState: authFile,
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
});
