import { test, expect, Page } from '@playwright/test';

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

test.describe('Navigation', () => {
  test('navbar is visible with Dashboard and Claims links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('navbar')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-claims')).toBeVisible();
  });

  test('clicking Claims nav link switches to claims page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-claims').click();
    await expect(page.getByTestId('claims')).toBeVisible();
  });

  test('clicking Dashboard nav link switches back to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-claims').click();
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });
});

test.describe('Policy Dashboard', () => {
  const addPolicyExpiringSoon = async (page: Page, holderName: string) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 15);

    await page.getByTestId('add-policy-btn').click();
    await page.getByTestId('input-holder-name').fill(holderName);
    await page.getByTestId('input-plan-name').fill('Renewal Coverage Plan');
    await page.getByTestId('input-coverage-amount').fill('123000');
    await page.getByTestId('select-policy-status').selectOption('active');
    await page.getByTestId('input-start-date').fill(formatDate(startDate));
    await page.getByTestId('input-end-date').fill(formatDate(endDate));
    await page.getByTestId('save-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).not.toBeVisible();
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('dashboard loads with policy tabs and stat cards', async ({ page }) => {
    await expect(page.getByTestId('policy-tabs')).toBeVisible();
    await expect(page.getByTestId('stats-row')).toBeVisible();
    await expect(page.getByTestId('stat-total-claims')).toBeVisible();
    await expect(page.getByTestId('stat-pending')).toBeVisible();
    await expect(page.getByTestId('stat-approved')).toBeVisible();
    await expect(page.getByTestId('stat-total-amount')).toBeVisible();
  });

  test('Add Policy button opens the policy modal', async ({ page }) => {
    await page.getByTestId('add-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).toBeVisible();
  });

  test('policy modal closes when Cancel is clicked', async ({ page }) => {
    await page.getByTestId('add-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).toBeVisible();
    await page.getByTestId('cancel-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).not.toBeVisible();
  });

  test('policy modal closes when overlay is clicked', async ({ page }) => {
    await page.getByTestId('add-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).toBeVisible();
    await page.getByTestId('modal-overlay').click({ position: { x: 5, y: 5 } });
    await expect(page.getByTestId('policy-modal')).not.toBeVisible();
  });

  test('saving policy without required fields keeps the modal open', async ({ page }) => {
    await page.getByTestId('add-policy-btn').click();
    await page.getByTestId('save-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).toBeVisible();
  });

  test('can add a new policy through the form', async ({ page }) => {
    await page.getByTestId('add-policy-btn').click();
    await page.getByTestId('input-holder-name').fill('Jane Doe');
    await page.getByTestId('input-plan-name').fill('Gold Plan');
    await page.getByTestId('input-coverage-amount').fill('50000');
    await page.getByTestId('select-policy-status').selectOption('active');
    await page.getByTestId('input-start-date').fill('2026-01-01');
    await page.getByTestId('input-end-date').fill('2026-12-31');
    await page.getByTestId('save-policy-btn').click();
    await expect(page.getByTestId('policy-modal')).not.toBeVisible();
  });

  test('recent claims table is visible when a policy is selected', async ({ page }) => {
    await expect(page.getByTestId('recent-claims-table')).toBeVisible();
  });

  test('shows renewal reminder banner for policies expiring within 30 days and selects policy', async ({ page }) => {
    const holderName = `QA Renewal Select ${Date.now()}`;
    await addPolicyExpiringSoon(page, holderName);

    const renewalBanner = page.getByTestId('renewal-reminder-banner');
    await expect(renewalBanner).toBeVisible();

    const renewalLink = renewalBanner.getByRole('link', { name: new RegExp(holderName) });
    await expect(renewalLink).toBeVisible();
    await renewalLink.click();

    await expect(page.getByTestId('policy-card')).toContainText(holderName);
  });

  test('renewal reminder banner can be dismissed', async ({ page }) => {
    const holderName = `QA Renewal Dismiss ${Date.now()}`;
    await addPolicyExpiringSoon(page, holderName);

    await expect(page.getByTestId('renewal-reminder-banner')).toBeVisible();
    await page.getByTestId('dismiss-renewal-banner-btn').click();
    await expect(page.getByTestId('renewal-reminder-banner')).not.toBeVisible();
  });
});
