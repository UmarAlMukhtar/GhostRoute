import { chooseDemoEndpoint } from './helpers';
import { expect, test } from '@playwright/test';
import { demoSteps } from '../../src/lib/map/demo';
test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
});
test('guided presentation uses real routes and one-click reset', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demo');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Start guided demo', exact: true })
    .click();
  const guide = page.getByRole('region', { name: 'Guided demo' });
  for (let step = 0; step < demoSteps.length; step++) {
    await expect(guide.getByRole('heading')).toHaveText(demoSteps[step].title);
    if (step === 1 || step === 7)
      await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
    if (step === 2) {
      await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
      await expect(page.getByTestId('map')).toHaveAttribute(
        'data-alternative',
        'true',
      );
      const resetBox = await page
        .getByRole('button', { name: 'Reset demo', exact: true })
        .boundingBox();
      const panelBox = await page
        .getByRole('complementary', { name: 'Simulation panel' })
        .boundingBox();
      expect(resetBox!.y + resetBox!.height).toBeLessThanOrEqual(
        panelBox!.y + panelBox!.height,
      );
      await page.screenshot({
        path: info.outputPath('demo-hospital.png'),
        fullPage: true,
      });
    }
    if (step === 5) {
      await expect(page.getByTestId('blocked-count')).toHaveText('27');
      await expect(page.getByTestId('updated-distance')).toHaveText('1.73 km');
    }
    if (step === 6) {
      await expect(page.getByTestId('updated-distance')).toHaveText(
        'Unavailable',
      );
      await expect(page.getByTestId('map')).toHaveAttribute(
        'data-alternative',
        'false',
      );
    }
    if (step < 7)
      await guide
        .getByRole('button', { name: demoSteps[step].next, exact: true })
        .click();
  }
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(guide.getByRole('heading')).toHaveText(demoSteps[0].title);
  await expect(page.getByTestId('route-distance')).toHaveCount(0);
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-hazards',
    'false',
  );
  await page.getByRole('button', { name: 'Exit Demo Mode' }).click();
  await expect(guide).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('keyboard walkthrough, manual handoff and reduced motion', async ({
  page,
}) => {
  await page.goto('/demo');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to routing controls' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#route-controls')).toBeFocused();
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  const entry = page.getByRole('button', {
    name: 'Start guided demo',
    exact: true,
  });
  await entry.focus();
  await page.keyboard.press('Enter');
  const next = page.getByRole('button', {
    name: 'Load Hospital Road route',
    exact: true,
  });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
  ).toBe(true);
  await chooseDemoEndpoint(page, 'destination', '271145615');
  await expect(page.getByRole('region', { name: 'Guided demo' })).toHaveCount(
    0,
  );
  await expect(page.getByTestId('updated-distance')).toHaveText('0.0 m');
  await chooseDemoEndpoint(page, 'origin', '1906667447');
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
});
test('rapid switching, repeated reset, viewport resize and refresh', async ({
  page,
}, info) => {
  await page.goto('/demo');
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page.getByRole('button', { name: 'Start simulation' }).click();
  const start = Date.now();
  for (let i = 0; i < 10; i++) {
    await page
      .getByLabel('Flood scenario', { exact: true })
      .selectOption('unavailable');
    await page
      .getByLabel('Flood scenario', { exact: true })
      .selectOption('expanding');
    await page.getByRole('button', { name: 'Next stage' }).click();
    await page.getByRole('button', { name: 'Next stage' }).click();
    await expect(page.getByTestId('updated-distance')).toHaveText('1.73 km');
    await page
      .getByRole('button', { name: 'Reset simulation', exact: true })
      .click();
    await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
    await page
      .getByRole('button', { name: 'Demo scenarios', exact: true })
      .click();
    await page.getByRole('button', { name: 'Start simulation' }).click();
  }
  console.log(
    JSON.stringify({
      project: info.project.name,
      tenScenarioCyclesMs: Date.now() - start,
      includes:
        'Playwright actions, scrolling and assertions; not engine-only latency',
    }),
  );
  await page.setViewportSize({ width: 320, height: 640 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByTestId('updated-distance').scrollIntoViewIfNeeded();
  await page.setViewportSize({ width: 640, height: 450 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByTestId('route-distance')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Start simulation' }),
  ).toBeDisabled();
});
test('slow local assets recover and production worker assets are served', async ({
  page,
  request,
}, info) => {
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/data/ernakulam/*', async (r) => {
    await hold;
    await r.continue();
  });
  await page.goto('/demo');
  await expect(
    page.getByText('Preparing GhostRoute map', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Loading and validating local roads…'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Demo scenarios', exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath('map-preparing.png'),
    fullPage: true,
  });
  release();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await expect(
    page.getByText('Local roads · basemap unavailable'),
  ).toBeVisible();
  for (const path of [
    '/data/ernakulam/dataset.json',
    '/data/ernakulam/graph.json',
    '/data/ernakulam/roads.geojson',
    '/vendor/maplibre/6.13.0/maplibre-gl-worker.mjs',
    '/vendor/maplibre/6.13.0/maplibre-gl-shared.mjs',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Start guided demo', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Load Hospital Road route', exact: true })
    .click();
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
});
