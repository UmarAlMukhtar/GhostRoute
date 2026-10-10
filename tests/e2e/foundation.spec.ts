import { expect, test } from '@playwright/test';

test('foundation status and disclaimer are visible without page errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'GhostRoute', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText('Development foundation', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Routes are not verified safe/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
