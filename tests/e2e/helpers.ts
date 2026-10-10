import type { Page } from '@playwright/test';
export async function chooseDemoEndpoint(
  page: Page,
  role: 'origin' | 'destination',
  nodeId: string,
) {
  const details = page.locator('details.demo-endpoints');
  if ((await details.getAttribute('open')) === null)
    await details.getByText('Demo endpoint shortcuts', { exact: true }).click();
  await page
    .getByLabel(
      role === 'origin' ? 'Demo starting point' : 'Demo destination',
      { exact: true },
    )
    .selectOption(nodeId);
}
