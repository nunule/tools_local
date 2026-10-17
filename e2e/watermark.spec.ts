import { test, expect } from '@playwright/test';

test.describe('Local Image Watermark Studio E2E', () => {
  test('should load application and allow loading sample image', async ({ page }) => {
    await page.goto('/');

    // Verify title and local privacy badge
    await expect(page).toHaveTitle(/Toolbit/);
    await expect(page.getByText('100% 本地离线')).toBeVisible();

    // Click sample image loader
    const sampleBtn = page.getByRole('button', { name: /一键试用样例图|加载样例图/i }).first();
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    // Verify canvas appears and image info is displayed
    await expect(page.getByText(/sample_document\.png/i)).toBeVisible();
    await expect(page.getByText(/1200 × 800/i)).toBeVisible();

    // Switch to Presets tab and apply confidential template
    await page.getByRole('button', { name: '预设' }).click();
    await expect(page.getByText('防盗用全屏平铺')).toBeVisible();
  });
});
