import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { validateGraph } from '../../src/lib/geo/validate';
import { createRouter } from '../../src/lib/routing/shortest-path';
import { formatDistance } from '../../src/lib/map/selection';
import { createFloodEngine } from '../../src/lib/simulation/flood';
import { scenarios } from '../../src/lib/simulation/scenarios';
const graph = validateGraph(
    JSON.parse(readFileSync('public/data/ernakulam/graph.json', 'utf8')),
  ),
  router = createRouter(graph);
test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
});
test('coverage, offline defaults, keyboard routes, swapping and clearing', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const geocoding: string[] = [];
  page.on('request', (r) => {
    if (/nominatim|geocod|overpass/.test(r.url())) geocoding.push(r.url());
  });
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-demo-boundary',
    'true',
  );
  await expect(page.locator('.demo-area-map-label')).toBeVisible();
  await page
    .getByRole('button', { name: 'View Demo Area', exact: true })
    .click();
  const start = page.getByRole('combobox', {
    name: 'Starting point',
    exact: true,
  });
  const end = page.getByRole('combobox', { name: 'Destination', exact: true });
  await expect(start).toBeEnabled();
  await start.focus();
  await expect(
    page.getByText('Popular places in Ernakulam', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(7);
  await page.screenshot({
    path: info.outputPath('popular-places.png'),
    fullPage: true,
  });
  await page.waitForTimeout(220);
  await start.press('ArrowDown');
  await start.press('Enter');
  await expect(start).toHaveValue('Marine Drive');
  await end.fill('MG Road — Jos Junction');
  await page.waitForTimeout(220);
  await end.press('ArrowDown');
  await end.press('Enter');
  await expect(end).toHaveValue('MG Road — Jos Junction');
  const expected = router.findRoute({
    originNodeId: '7016742693',
    destinationNodeId: '1906667447',
  });
  if (expected.status !== 'found') throw new Error('Fixture must route');
  await expect(page.getByTestId('route-distance')).toContainText(
    formatDistance(expected.distanceMeters),
  );
  await page
    .getByRole('button', { name: 'View Demo Area', exact: true })
    .click();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-demo-boundary',
    'true',
  );
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'true',
  );
  await page.screenshot({
    path: info.outputPath('coverage-route.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Swap endpoints', exact: true })
    .click();
  await expect(start).toHaveValue('MG Road — Jos Junction');
  await expect(end).toHaveValue('Marine Drive');
  await page
    .getByRole('button', { name: 'Clear starting point', exact: true })
    .click();
  await expect(start).toHaveValue('');
  await expect(end).toHaveValue('Marine Drive');
  await expect(page.getByTestId('route-distance')).toHaveCount(0);
  await expect(
    page.getByText('Popular places in Ernakulam', { exact: true }),
  ).toBeVisible();
  await start.fill('Aluva outside this catalog');
  await expect(page.getByText(/No matching local places/)).toBeVisible();
  await start.fill('');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(7);
  await start.press('ArrowUp');
  await start.press('Enter');
  await expect(start).toHaveValue('High Court Junction');
  await start.fill('unfinished query');
  await page.getByRole('button', { name: 'Reset route', exact: true }).click();
  await expect(start).toHaveValue('');
  await expect(end).toHaveValue('');
  expect(geocoding).toEqual([]);
  expect(errors).toEqual([]);
});
test('mouse and touch suggestions fit the sheet and remain usable during simulation', async ({
  page,
}, info) => {
  await page.goto('/demo');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByRole('button', { name: 'Try the Hospital Road demo' })
    .click();
  await page
    .getByRole('button', { name: 'Demo scenarios', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Start simulation', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Close side panel', exact: true })
    .click();
  const input = page.getByRole('combobox', {
    name: 'Starting point',
    exact: true,
  });
  await input.fill('General Hospital');
  const option = page.getByRole('option', {
    name: /General Hospital Ernakulam/,
  });
  await expect(option).toBeVisible();
  const optionBox = await option.boundingBox(),
    panelBox = await page
      .getByRole('complementary', { name: 'Routing controls' })
      .boundingBox();
  expect(optionBox!.x).toBeGreaterThanOrEqual(panelBox!.x);
  expect(optionBox!.x + optionBox!.width).toBeLessThanOrEqual(
    panelBox!.x + panelBox!.width,
  );
  if (info.project.name === 'mobile-chromium') await option.tap();
  else await option.click();
  await expect(input).toHaveValue('General Hospital Ernakulam — main entrance');
  const impact = createFloodEngine(graph).evaluate(scenarios[0].steps[1]);
  if (impact.status !== 'ready') throw new Error('Invalid fixture');
  const expected = router.findRoute({
    originNodeId: '271145617',
    destinationNodeId: '1906667447',
    blockedSegmentIds: impact.blockedSegmentIds,
    blockedNodeIds: impact.blockedNodeIds,
  });
  if (expected.status !== 'found') throw new Error('Fixture must route');
  await expect(page.getByTestId('route-distance')).toContainText(
    formatDistance(expected.distanceMeters),
  );
  await page
    .getByRole('button', { name: 'View Demo Area', exact: true })
    .click();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-demo-boundary',
    'true',
  );
  await expect(page.getByTestId('map')).toHaveAttribute('data-hazards', 'true');
  await page
    .getByRole('combobox', { name: 'Destination', exact: true })
    .fill('Ernakulam South Railway Station');
  await expect(
    page.getByRole('option', { name: /Ernakulam South Railway Station/ }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('search-during-simulation.png'),
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
