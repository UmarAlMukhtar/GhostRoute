import { chooseDemoEndpoint } from './helpers';
import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.goto('/demo');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true', {
    timeout: 60000,
  });
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
});
test('Hospital flood reroutes real roads, renders overlays and resets', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().includes('net::ERR_FAILED')
    )
      errors.push(message.text());
  });
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await expect(page.getByTestId('blocked-count')).toHaveText('5');
  await expect(page.getByTestId('original-distance')).toHaveText('944.3 m');
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
  await expect(page.getByTestId('distance-change')).toContainText(
    '+466.8 m · +49.4%',
  );
  for (const layer of ['hazards', 'blocked-roads', 'alternative'])
    await expect(page.getByTestId('map')).toHaveAttribute(
      `data-${layer}`,
      'true',
    );
  await page.getByTestId('distance-change').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('hospital-flood.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Reset simulation', exact: true })
    .click();
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-hazards',
    'false',
  );
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-alternative',
    'false',
  );
  await expect(page.getByTestId('blocked-count')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('nested stages, endpoint changes, unavailable destination and replay', async ({
  page,
}, info) => {
  await page
    .getByLabel('Flood scenario', { exact: true })
    .selectOption('expanding');
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await expect(
    page.getByRole('button', { name: 'Previous stage' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Next stage' }).click();
  await expect(page.getByTestId('blocked-count')).toHaveText('9');
  await page.getByRole('button', { name: 'Next stage' }).click();
  await expect(page.getByTestId('blocked-count')).toHaveText('27');
  await expect(page.getByTestId('updated-distance')).toHaveText('1.73 km');
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeDisabled();
  await page.getByTestId('distance-change').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-alternative',
    'true',
  );
  await page.screenshot({
    path: info.outputPath('expanding-flood.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Previous stage' }).click();
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
  await page
    .getByLabel('Flood scenario', { exact: true })
    .selectOption('unavailable');
  await expect(page.getByTestId('blocked-count')).toHaveText('21');
  await expect(page.getByTestId('simulation-availability')).toHaveText(
    'No available route',
  );
  await expect(page.getByTestId('updated-distance')).toHaveText('Unavailable');
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-alternative',
    'false',
  );
  await page.getByTestId('updated-distance').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('unavailable-flood.png'),
    fullPage: true,
  });
  await chooseDemoEndpoint(page, 'destination', '271145615');
  await expect(page.getByTestId('updated-distance')).toHaveText('0.0 m');
  await chooseDemoEndpoint(page, 'origin', '1906667447');
  await expect(page.getByTestId('simulation-availability')).toHaveText(
    'No available route',
  );
  await page
    .getByRole('button', { name: 'Close side panel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Reset route', exact: true }).click();
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Reset simulation', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Reset simulation', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Start simulation' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Close side panel', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page
    .getByLabel('Flood scenario', { exact: true })
    .selectOption('hospital');
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
});
