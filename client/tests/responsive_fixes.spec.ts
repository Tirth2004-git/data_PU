import { test, expect } from '@playwright/test';

test.describe('Responsive Fixes Verification (Issue 1 & Issue 2)', () => {
  // Test Issue 1: Dashboard "Acceptable" / Average CGPA status badge containment
  test('Issue 1: Average CGPA status badge is completely inside the card without overflowing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main');
    await page.waitForSelector('text=Average CGPA');

    // Find the Average CGPA card
    const avgCard = page.locator('div.card-print:has-text("Average CGPA")').first();
    await expect(avgCard).toBeVisible();

    const cardBox = await avgCard.boundingBox();
    expect(cardBox).not.toBeNull();

    // Find the status badge (e.g., "Acceptable" or "Sub-par")
    const badge = avgCard.locator('span.rounded-full').first();
    await expect(badge).toBeVisible();

    const badgeBox = await badge.boundingBox();
    expect(badgeBox).not.toBeNull();

    // Verify badge is strictly inside the card horizontally
    expect(badgeBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);

    // Verify badge is strictly inside the card vertically
    expect(badgeBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
    expect(badgeBox!.y + badgeBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1);

    // Verify icon is also inside the card and doesn't collide
    const icon = avgCard.locator('svg').first();
    if (await icon.isVisible()) {
      const iconBox = await icon.boundingBox();
      expect(iconBox!.x + iconBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    }
  });

  // Test Issue 2: Student Details circular CGPA indicator containment & perfect circle
  test('Issue 2: Cumulative CGPA progress ring is perfectly circular and text is completely contained', async ({ page }) => {
    await page.goto('/students/2303031080006', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-actions');

    const cgpaCard = page.locator('div:has-text("Cumulative CGPA")').filter({ has: page.locator('svg circle') }).first();
    await expect(cgpaCard).toBeVisible();

    // Locate the circular progress indicator SVG and number
    const ringContainer = cgpaCard.locator('div.relative.inline-flex').first();
    await expect(ringContainer).toBeVisible();

    const ringBox = await ringContainer.boundingBox();
    expect(ringBox).not.toBeNull();

    // 1. Verify perfectly circular (equal width and height within 1px)
    expect(Math.abs(ringBox!.width - ringBox!.height)).toBeLessThanOrEqual(1);

    // 2. Verify number text is completely contained inside the ring with safe padding
    const numberText = ringContainer.locator('span.font-mono').first();
    await expect(numberText).toBeVisible();

    const textBox = await numberText.boundingBox();
    expect(textBox).not.toBeNull();

    // Text horizontal containment with safe margin from border
    expect(textBox!.x).toBeGreaterThanOrEqual(ringBox!.x + 4);
    expect(textBox!.x + textBox!.width).toBeLessThanOrEqual(ringBox!.x + ringBox!.width - 4);

    // Text vertical containment with safe margin from border
    expect(textBox!.y).toBeGreaterThanOrEqual(ringBox!.y + 4);
    expect(textBox!.y + textBox!.height).toBeLessThanOrEqual(ringBox!.y + ringBox!.height - 4);
  });
});
