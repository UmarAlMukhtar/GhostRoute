import type { Page } from '@playwright/test';
export async function chooseDemoEndpoint(
  page: Page,
  role: 'origin' | 'destination',
  nodeId: string,
) {
  const mobile = page.viewportSize()!.width < 760;
  const sidePanel = page.getByRole('button', { name: 'Close side panel' });
  const wasOpen = await sidePanel.isVisible();
  if (mobile && wasOpen) await sidePanel.click();
  const details = page.locator('details.demo-endpoints');
  if ((await details.getAttribute('open')) === null)
    await details.getByText('Demo endpoint shortcuts', { exact: true }).click();
  await page
    .getByLabel(
      role === 'origin' ? 'Demo starting point' : 'Demo destination',
      { exact: true },
    )
    .selectOption(nodeId);
  if (mobile && wasOpen)
    await page.getByRole('button', { name: 'Demo scenarios' }).click();
}
