import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authDir = path.join(process.cwd(), 'tests', '.auth');
const authFile = path.join(authDir, 'admin.json');

setup('authenticate', async ({ page }) => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'ozatirth52@gmail.com');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || '');
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  await expect(page.locator('h1')).toBeVisible();

  await page.context().storageState({ path: authFile });
});
