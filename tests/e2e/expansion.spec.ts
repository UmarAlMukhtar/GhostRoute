import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseMapData } from '../../src/lib/map/data';
import { validatePlaces, filterPlaces } from '../../src/lib/map/places';
import { createFloodEngine } from '../../src/lib/simulation/flood';
import { hazardInputs } from '../../src/lib/simulation/hazards';
const read = (name: string): unknown =>
  JSON.parse(readFileSync(`public/data/ernakulam/${name}`, 'utf8'));
const data = parseMapData(
  read('graph.json'),
  read('roads.geojson'),
  read('demo-paths.json'),
);
const places = validatePlaces(read('places.json'), data);
const a = filterPlaces(places, 'Edappally Market')[0],
  b = filterPlaces(places, 'Vyttila Mobility Hub')[0];
const baseline = data.router.findRoute({
  originNodeId: a.nodeId,
  destinationNodeId: b.nodeId,
});
if (baseline.status !== 'found')
  throw new Error('Cross-region route unavailable');
const engine = createFloodEngine(data.graph);
const center = baseline
  .geometry!.coordinates.slice(20, -20)
  .find((point, index) => {
    if (index % 20) return false;
    const input = hazardInputs([
      {
        source: 'simulation',
        id: 'test',
        kind: 'flood',
        enabled: true,
        center: [point[0], point[1]],
        radiusMeters: 50,
      },
    ]);
    const impact = engine.evaluate(input.zones);
    if (impact.status !== 'ready') return false;
    const route = data.router.findRoute({
      originNodeId: a.nodeId,
      destinationNodeId: b.nodeId,
      blockedSegmentIds: impact.blockedSegmentIds,
      blockedNodeIds: impact.blockedNodeIds,
    });
    return (
      route.status === 'found' && route.distanceMeters > baseline.distanceMeters
    );
  });
if (!center) throw new Error('Need a real cross-region detour fixture');
async function pick(page: Page, coordinate: number[]) {
  const origin = (await page.locator('.map-pin.origin').boundingBox())!,
    destination = (await page.locator('.map-pin.destination').boundingBox())!;
  const mercator = (lat: number) =>
    Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  await page.mouse.click(
    origin.x +
      origin.width / 2 +
      ((coordinate[0] - a.coordinate[0]) /
        (b.coordinate[0] - a.coordinate[0])) *
        (destination.x + destination.width / 2 - origin.x - origin.width / 2),
    origin.y +
      origin.height / 2 +
      ((mercator(coordinate[1]) - mercator(a.coordinate[1])) /
        (mercator(b.coordinate[1]) - mercator(a.coordinate[1]))) *
        (destination.y + destination.height / 2 - origin.y - origin.height / 2),
  );
}
async function search(page: Page, label: string, query: string, name: string) {
  const input = page.getByRole('combobox', { name: label, exact: true });
  await input.fill(query);
  const option = page.getByRole('option').filter({ hasText: name }).first();
  await expect(option).toBeVisible();
  await option.click();
}
test('expanded Edappally–Vyttila navigation, disasters, local deletion, dark theme and dedicated demo', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  const started = Date.now();
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await test.info().attach('load-timing', {
    body: JSON.stringify({ readyMilliseconds: Date.now() - started }),
    contentType: 'application/json',
  });
  await expect(page.getByLabel('Routing mode')).toHaveCount(0);
  await search(page, 'Starting point', 'Edappally Market', a.name);
  await search(page, 'Destination', 'Vyttila Mobility Hub', b.name);
  await expect(page.getByTestId('route-distance')).toContainText('km');
  await page.getByRole('button', { name: 'Find route', exact: true }).click();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-route-visible',
    'true',
  );
  const original = await page.getByTestId('route-distance').textContent();
  await page.screenshot({
    path: info.outputPath('expanded-light.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Simulation', exact: true }).click();
  await page
    .getByRole('button', { name: 'Place flood on map', exact: true })
    .click();
  await pick(page, center);
  await expect(page.getByTestId('custom-blocked')).not.toHaveText('0');
  await expect(page.getByTestId('route-distance')).not.toHaveText(original!);
  await page.getByRole('button', { name: 'Fire', exact: true }).click();
  await page
    .getByRole('button', { name: 'Place fire on map', exact: true })
    .click();
  await pick(page, center);
  await expect(
    page.getByRole('button', { name: 'Fire 2 Enabled' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Remove hazard', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Fire 2 Enabled' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Report Incident', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose report location on map' })
    .click();
  await pick(page, center);
  await page
    .getByLabel('Description', { exact: true })
    .fill('Expanded journey report created in this browser.');
  await page.getByRole('button', { name: 'Save local report' }).click();
  await expect(
    page.getByText('Expanded journey report created in this browser.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Delete report', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancel deletion' }).click();
  await expect(
    page.getByText('Expanded journey report created in this browser.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Delete report', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm deletion' }).click();
  await expect(page.getByText('Local report deleted.')).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Theme', exact: true })
    .selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByTestId('map')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({
    path: info.outputPath('expanded-dark.png'),
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page
    .getByRole('button', { name: 'Report Incident', exact: true })
    .click();
  await expect(page.getByText('1 visible local reports')).toBeVisible();
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Demo scenarios' }).click();
  await page.getByRole('button', { name: 'Start guided demo' }).click();
  await page
    .getByRole('button', { name: 'Load Hospital Road route', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Simulate Hospital Road flood', exact: true })
    .click();
  await expect(page.getByTestId('updated-distance')).toHaveText('1.41 km');
  await page.screenshot({
    path: info.outputPath('demo-dark.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('system theme follows browser preference and persisted manual override', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Theme', { exact: true }).selectOption('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('Theme', { exact: true }).selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('failed local search index preserves coordinate routing', async ({
  page,
}) => {
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort(),
  );
  await page.route('**/data/ernakulam/places.json', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
  await expect(
    page
      .getByText(
        'Local place index unavailable. Use coordinates or map selection; reload to retry.',
      )
      .first(),
  ).toBeVisible();
  await page.getByText('Enter coordinates', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('9.9713489');
  await page.getByLabel('Longitude', { exact: true }).fill('76.28014');
  await page.getByRole('button', { name: 'Set coordinate' }).click();
  await page
    .getByLabel('Endpoint', { exact: true })
    .selectOption('destination');
  await page.getByRole('button', { name: 'Set coordinate' }).click();
  await expect(page.getByTestId('route-distance')).toContainText('0.0 m');
});
