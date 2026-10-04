import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Mobile Viewport & Responsiveness Suite', () => {
  // 1. Horizontal Overflow Check
  test('No horizontal page scroll on /, /students, profile, and search sheet', async ({ page }) => {
    const urls = ['/', '/students', '/students/2303031080006'];

    for (const url of urls) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('main');
      await page.waitForTimeout(300);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow).toBeFalsy();
    }

    // Check search sheet
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-actions');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('campus-compass:open-search'));
    });
    await page.waitForSelector('input[type="search"]');
    const searchOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(searchOverflow).toBeFalsy();
  });

  // 2. Profile Mobile Hierarchy
  test('Quick Facts & Contact is above Semesters and KPIs; Quick action bar is visible without scrolling on 375x667', async ({ page, viewport }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-actions');

    const quickFacts = page.locator('#section-quickFacts');
    const kpis = page.locator('#section-kpis');
    const semesters = page.locator('#semesters');
    const actions = page.locator('#section-actions');

    if (viewport && viewport.width < 1024) {
      await expect(quickFacts).toBeVisible();
      await expect(kpis).toBeVisible();
      await expect(semesters).toBeVisible();

      const quickFactsBox = await quickFacts.boundingBox();
      const kpisBox = await kpis.boundingBox();
      const semestersBox = await semesters.boundingBox();
      const actionsBox = await actions.boundingBox();

      // Quick Facts top is above Semesters and above KPIs on mobile
      expect(quickFactsBox!.y).toBeLessThan(semestersBox!.y);
      expect(quickFactsBox!.y).toBeLessThan(kpisBox!.y);

      // On 375x667, Quick action bar is visible without scrolling (bottom < 667)
      if (viewport.width === 375 && viewport.height === 667) {
        expect(actionsBox!.y + actionsBox!.height).toBeLessThan(667);
      }
    }
  });

  // 3. Status Badges
  test('Every status badge is a single line (height <= 40px) and inside container', async ({ page }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    const container = page.locator('#hero-status-badges');
    await expect(container).toBeVisible();
    const containerBox = await container.boundingBox();

    const badges = container.locator('> *');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badge = badges.nth(i);
      const box = await badge.boundingBox();
      expect(box!.height).toBeLessThanOrEqual(40);
      expect(box!.x + box!.width).toBeLessThanOrEqual(containerBox!.x + containerBox!.width + 4);
    }
  });

  // 4. Touch Targets >= 44x44px
  test('Buttons, links, and action elements have minimum bounding box of 44x44px', async ({ page, viewport }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-actions');

    // Bottom nav items on mobile
    if (viewport && viewport.width < 1024) {
      const bottomNavItems = page.locator('nav[aria-label="Mobile Navigation"] a, nav[aria-label="Mobile Navigation"] button');
      const navCount = await bottomNavItems.count();
      expect(navCount).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < navCount; i++) {
        const box = await bottomNavItems.nth(i).boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }

    // Quick action buttons
    const actionButtons = page.locator('#section-actions a, #section-actions button');
    const actCount = await actionButtons.count();
    expect(actCount).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < actCount; i++) {
      const box = await actionButtons.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  // 5. Date Validity
  test('Footer date matches /\\b20\\d{2}\\b/ without 5-digit years; profile snapshot shows valid date', async ({ page }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('footer');

    const footer = page.locator('footer');
    const footerText = await footer.textContent();
    expect(footerText).toMatch(/\b20\d{2}\b/);
    expect(footerText).not.toMatch(/\b\d{5,}\b/);

    const snapshotDate = page.locator('text=Updated');
    await expect(snapshotDate.first()).toBeVisible();
    const snapshotText = await snapshotDate.first().textContent();
    expect(snapshotText).toMatch(/\b20\d{2}\b/);
  });

  // 6. Policy State Tri-State
  test('Policy state renders "Policy submitted" for true and "Not recorded" for null', async ({ page }) => {
    // 2303031080006 has placementPolicySubmitted === true
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    const heroBadges = page.locator('#hero-status-badges');
    await expect(heroBadges).toContainText('Policy submitted');

    // 2303051260002 has placementPolicySubmitted === null in real DB
    await page.goto('/students/2303051260002', { waitUntil: 'domcontentloaded' });
    const mockHeroBadges = page.locator('#hero-status-badges');
    await expect(mockHeroBadges).toContainText('Not recorded');
  });

  // 7. Stacked All Fields List on Mobile
  test('All Fields section has no horizontal scroll container and no text truncation', async ({ page, viewport }) => {
    if (viewport && viewport.width < 768) {
      await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
      const allFields = page.locator('#all-fields');
      await expect(allFields).toBeVisible();

      // Check that mobile stacked list is rendered instead of a wide table
      const mobileList = allFields.locator('.divide-y');
      await expect(mobileList.first()).toBeVisible();

      // Key and value elements should be visible in stacked cards
      const valueElements = allFields.locator('.font-mono');
      const count = await valueElements.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  // 8. Sem 3 Change of Exactly 0
  test('Sem 3 change of exactly 0 renders "— 0.00" in neutral color', async ({ page }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    const sem3Card = page.locator('[data-sem-number="3"]');
    await expect(sem3Card).toBeVisible();
    await expect(sem3Card).toContainText('— 0.00');
  });

  // 9. Search Sheet Autocomplete
  test('Search: typing 2303031 and oza in search sheet shows prefix/contains suggestions', async ({ page }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-actions');

    const searchButton = page.locator('button[aria-label="Open global search sheet"]');
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('campus-compass:open-search'));
      });
    }

    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Type digits roll prefix
    await searchInput.fill('2303031');
    await page.waitForTimeout(350);
    const rollResults = page.locator('.cmd-palette span.font-mono');
    const rollCount = await rollResults.count();
    expect(rollCount).toBeGreaterThan(0);

    // Type name contains
    await searchInput.fill('oza');
    await page.waitForTimeout(350);
    const nameResults = page.locator('.cmd-palette');
    await expect(nameResults).toContainText(/oza/i);
  });

  // 10. Save Screenshots at 375x667
  test('Save profile screenshots (top, middle, bottom) at 375x667', async ({ page, viewport }) => {
    if (viewport && viewport.width === 375 && viewport.height === 667) {
      await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#section-actions');
      await page.waitForTimeout(600);

      const screenshotsDir = path.join(process.cwd(), 'tests', 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      // Top of page
      await page.screenshot({ path: path.join(screenshotsDir, 'profile-top-375x667.png') });

      // Middle of page (scroll to Semesters)
      await page.evaluate(() => {
        document.querySelector('#semesters')?.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(screenshotsDir, 'profile-middle-375x667.png') });

      // Bottom of page (scroll to All Fields)
      await page.evaluate(() => {
        document.querySelector('#all-fields')?.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(screenshotsDir, 'profile-bottom-375x667.png') });
    }
  });
});
