import { readFileSync } from 'node:fs';
import { createRouter } from '../../src/lib/routing/shortest-path';
import { validateGraph } from '../../src/lib/geo/validate';
import { formatDistance } from '../../src/lib/map/selection';
import { expect, test } from '@playwright/test';
const graph = JSON.parse(
  readFileSync('public/data/ernakulam/graph.json', 'utf8'),
);
const fixture = JSON.parse(
  readFileSync('public/data/ernakulam/demo-paths.json', 'utf8'),
);

test.beforeEach(async ({ page }) => {
  // No public tile traffic in automation; exercise the real local map fallback.
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
});

test('real map, Hospital Road route, reset and responsive controls', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'GhostRoute.' }),
  ).toBeVisible();
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await expect(
    page.getByText('Local roads · basemap unavailable'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Find route', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await expect(page.getByLabel('Starting point', { exact: true })).toHaveValue(
    fixture.origin.nodeId,
  );
  await expect(page.getByLabel('Destination', { exact: true })).toHaveValue(
    fixture.destination.nodeId,
  );
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
  await expect(page.getByText('21 traversed road segments')).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'origin marker', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'destination marker', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Routes are not verified safe/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'true',
  );
  await page.screenshot({
    path: testInfo.outputPath('route.png'),
    fullPage: true,
  });
  if (testInfo.project.name === 'mobile-chromium') {
    const sheet = page.getByRole('button', {
      name: '944.3 m · Route available',
      exact: true,
    });
    await sheet.click();
    await expect(sheet).toHaveAttribute('aria-expanded', 'false');
    await expect(
      page.getByRole('button', { name: 'Recalculate route', exact: true }),
    ).not.toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('route-collapsed.png'),
      fullPage: true,
    });
    await sheet.click();
  }
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByTestId('route-distance')).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: 'origin marker', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Find route', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'About GhostRoute' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('named selections and real map clicks snap endpoints', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByLabel('Starting point', { exact: true })
    .selectOption(fixture.origin.nodeId);
  await page
    .getByLabel('Destination', { exact: true })
    .selectOption(fixture.destination.nodeId);
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
  await page
    .getByRole('button', { name: 'Select origin on map', exact: true })
    .click();
  await page.getByRole('img', { name: 'origin marker', exact: true }).click();
  await expect(page.getByText(/A snapped/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Select destination on map', exact: true })
    .click();
  await page
    .getByRole('img', { name: 'destination marker', exact: true })
    .click();
  await expect(page.getByText(/B snapped/)).toBeVisible();
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  const expected = createRouter(validateGraph(graph)).findRoute({
    originNodeId: await page
      .getByLabel('Starting point', { exact: true })
      .inputValue(),
    destinationNodeId: await page
      .getByLabel('Destination', { exact: true })
      .inputValue(),
  });
  expect(expected.status).toBe('found');
  if (expected.status === 'found')
    await expect(page.getByTestId('route-distance')).toContainText(
      formatDistance(expected.distanceMeters),
    );
});

test('disconnected real node yields no route', async ({ page }) => {
  const disconnected = graph.nodes[fixture.disconnectedNodeId];
  await page.route('**/demo-paths.json', (route) =>
    route.fulfill({
      json: {
        ...fixture,
        destination: {
          nodeId: disconnected.id,
          coordinate: disconnected.coordinate,
          label: 'Disconnected test node',
        },
      },
    }),
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'No available route' }),
  ).toBeVisible();
  await expect(page.getByTestId('route-distance')).toHaveCount(0);
});

test('invalid dataset is actionable and retries successfully', async ({
  page,
}) => {
  await page.route('**/graph.json', (route) =>
    route.fulfill({ json: { version: 'broken' } }),
  );
  await page.goto('/');
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'could not be loaded or validated' }),
  ).toBeVisible();
  await page.unroute('**/graph.json');
  await page.getByRole('button', { name: 'Retry data loading' }).click();
  await expect(
    page.getByRole('button', { name: 'Try the Hospital Road demo' }),
  ).toBeVisible();
});

test('out-of-range map click reports snapping failure', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByRole('button', { name: 'Select origin on map', exact: true })
    .click();
  const zoomOut = page.getByRole('button', { name: 'Zoom out', exact: true });
  for (let i = 0; i < 6 && (await zoomOut.isEnabled()); i++)
    await zoomOut.click();
  const canvas = page.getByRole('region', {
    name: 'Interactive Ernakulam road map',
  });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await canvas.click({
    position: {
      x: box!.width - (box!.width >= 1200 ? 420 : 90),
      y: Math.min(220, box!.height / 2),
    },
  });
  await expect(
    page.getByRole('alert').filter({
      hasText: /too far from the road network|outside the supported/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Find route', exact: true }),
  ).toBeDisabled();
});

test('WebGL unavailable keeps named routing usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(
    page.getByRole('alert').filter({ hasText: 'WebGL map unavailable' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
});

test('identical endpoints show zero distance without a line', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByLabel('Starting point', { exact: true })
    .selectOption(fixture.origin.nodeId);
  await page
    .getByLabel('Destination', { exact: true })
    .selectOption(fixture.origin.nodeId);
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('route-distance')).toContainText('0.0 m');
  await expect(
    page.getByText('Both points are the same road node. No travel is needed.'),
  ).toBeVisible();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'false',
  );
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'true',
  );
  await expect(
    page.getByRole('img', { name: 'origin marker', exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole('img', { name: 'destination marker', exact: true }),
  ).toBeInViewport();
});

test('viewport changes preserve visible route and narrow reflow', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'true',
  );
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 360, height: 800 },
    { width: 640, height: 450 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await expect(
      page.getByRole('img', { name: 'origin marker', exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole('img', { name: 'destination marker', exact: true }),
    ).toBeInViewport();
  }
});
