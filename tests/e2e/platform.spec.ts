import { chooseDemoEndpoint } from './helpers';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { validateGraph } from '../../src/lib/geo/validate';
import { createRouter } from '../../src/lib/routing/shortest-path';
const graph = validateGraph(
  JSON.parse(readFileSync('public/data/ernakulam/graph.json', 'utf8')),
);
const route = createRouter(graph).findRoute({
  originNodeId: '271145615',
  destinationNodeId: '1906667447',
});
if (route.status !== 'found') throw new Error('Fixture must route');
const origin = route.origin.coordinate,
  destination = route.destination.coordinate;
const road = route.edgeIds
  .map((id) => graph.edges[id])
  .find((edge) => edge.lengthMeters > 60)!;
const roadPoint: [number, number] = [
  (road.geometry.coordinates[0][0] + road.geometry.coordinates.at(-1)![0]) / 2,
  (road.geometry.coordinates[0][1] + road.geometry.coordinates.at(-1)![1]) / 2,
];
// A north-up Mercator map projects longitude and Mercator latitude linearly. Use visible
// endpoint markers to click actual WGS84 test coordinates, without a test-only map API.
async function clickCoordinate(page: Page, coordinate: [number, number]) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const a = (await page.locator('.map-pin.origin').boundingBox())!;
  const b = (await page.locator('.map-pin.destination').boundingBox())!;
  const mercator = (lat: number) =>
    Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const x =
    a.x +
    a.width / 2 +
    ((coordinate[0] - origin[0]) / (destination[0] - origin[0])) *
      (b.x + b.width / 2 - a.x - a.width / 2);
  const y =
    a.y +
    a.height / 2 +
    ((mercator(coordinate[1]) - mercator(origin[1])) /
      (mercator(destination[1]) - mercator(origin[1]))) *
      (b.y + b.height / 2 - a.y - a.height / 2);
  await page.mouse.click(x, y);
}
test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await page.goto('/');
  await expect(page.getByTestId('map')).toHaveAttribute('data-ready', 'true');
});
test('custom multi-hazard routing and separate persistent local report', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.getByText('Enter coordinates', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill(String(origin[1]));
  await page.getByLabel('Longitude', { exact: true }).fill(String(origin[0]));
  await page
    .getByRole('button', { name: 'Set coordinate', exact: true })
    .click();
  await page
    .getByLabel('Endpoint', { exact: true })
    .selectOption('destination');
  await page
    .getByLabel('Latitude', { exact: true })
    .fill(String(destination[1]));
  await page
    .getByLabel('Longitude', { exact: true })
    .fill(String(destination[0]));
  await page
    .getByRole('button', { name: 'Set coordinate', exact: true })
    .click();
  await expect(page.getByTestId('route-distance')).toContainText('944.3 m');
  await page.getByRole('button', { name: 'Simulate', exact: true }).click();
  await page.getByLabel('New hazard radius').fill('20');
  await page
    .getByRole('button', { name: 'Place flood on map', exact: true })
    .click();
  await clickCoordinate(page, [76.2806, 9.9714]);
  await expect(
    page.getByRole('button', { name: 'Flood 1 Enabled' }),
  ).toBeVisible();
  await expect(page.getByTestId('custom-blocked')).not.toHaveText('0');
  await expect(page.getByTestId('map')).toHaveAttribute('data-hazards', 'true');
  await page.getByLabel('Affected radius').fill('30');
  await page.getByRole('button', { name: 'Move hazard', exact: true }).click();
  await clickCoordinate(page, [76.2807, 9.9714]);
  await page.getByLabel('Affected radius').fill('20');
  await page.getByRole('button', { name: 'Landslide', exact: true }).click();
  await page
    .getByRole('button', { name: 'Place landslide on map', exact: true })
    .click();
  await clickCoordinate(page, roadPoint);
  await expect(
    page.getByRole('button', { name: 'Landslide 2 Enabled' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Roadblock / accident', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Click a road to block', exact: true })
    .click();
  await clickCoordinate(page, roadPoint);
  await expect(
    page.getByRole('button', { name: 'Roadblock / accident 3 Enabled' }),
  ).toBeVisible();
  await expect(page.getByTestId('map')).toHaveAttribute(
    'data-blocked-roads',
    'true',
  );
  await page
    .getByRole('button', { name: 'Remove hazard', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Roadblock / accident 3 Enabled' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Fire', exact: true }).click();
  await page
    .getByRole('button', { name: 'Place fire on map', exact: true })
    .click();
  await clickCoordinate(page, roadPoint);
  await expect(
    page.getByRole('button', { name: 'Fire 3 Enabled' }),
  ).toBeVisible();
  await page.getByLabel('Enable this hazard').uncheck();
  await expect(
    page.getByRole('button', { name: 'Fire 3 Disabled' }),
  ).toBeVisible();
  await page
    .getByRole('region', { name: 'Route comparison' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath('multi-hazard.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Reports', exact: true }).click();
  await page
    .getByRole('button', { name: 'Report Incident', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose report location on map' })
    .click();
  await clickCoordinate(page, roadPoint);
  await page
    .getByLabel('Description', { exact: true })
    .fill('Observed obstruction; browser demonstration report.');
  await page.getByRole('button', { name: 'Save local report' }).click();
  await expect(
    page.getByText('Observed obstruction; browser demonstration report.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '! Flooded road Unverified' }),
  ).toBeVisible();
  await expect(page.getByTestId('map')).toHaveAttribute('data-reports', 'true');
  await page.screenshot({
    path: info.outputPath('local-report.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: '! Other obstruction Unverified' })
    .click();
  await clickCoordinate(page, roadPoint);
  await expect(
    page.getByText('Observed obstruction; browser demonstration report.'),
  ).toBeVisible();
  await page.getByLabel('Filter type', { exact: true }).selectOption('Fire');
  await expect(page.getByText('0 visible local reports')).toBeVisible();
  await page.getByLabel('Filter type', { exact: true }).selectOption('');
  await page
    .getByLabel('Filter status', { exact: true })
    .selectOption('Verified');
  await expect(page.getByText('0 visible local reports')).toBeVisible();
  await page.getByLabel('Filter status', { exact: true }).selectOption('');
  await page
    .getByLabel('Routing mode', { exact: true })
    .selectOption('incidents');
  await expect(page.getByTestId('custom-blocked')).toHaveText('0');
  await page
    .getByLabel('Explore unverified reports as hypothetical road closures')
    .check();
  await expect(page.getByTestId('custom-blocked')).toHaveText('1');
  await page.getByRole('button', { name: 'Simulate', exact: true }).click();
  await page
    .getByRole('button', { name: 'Clear simulated hazards', exact: true })
    .click();
  await expect(page.getByTestId('custom-blocked')).toHaveText('0');
  await page.reload();
  await page.getByRole('button', { name: 'Reports', exact: true }).click();
  await page.getByRole('button', { name: '! Flooded road Unverified' }).click();
  await expect(
    page.getByText('Observed obstruction; browser demonstration report.'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test('swap, marker drag, current location and out-of-region coordinates', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: origin[1], longitude: origin[0] });
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(
    page.getByLabel('Demo starting point', { exact: true }),
  ).toHaveValue('271145615');
  await chooseDemoEndpoint(page, 'destination', '1906667447');
  await page.getByRole('button', { name: 'Swap endpoints' }).click();
  await expect(
    page.getByLabel('Demo starting point', { exact: true }),
  ).toHaveValue('1906667447');
  await expect(
    page.getByLabel('Demo destination', { exact: true }),
  ).toHaveValue('271145615');
  if (infoMobile(page))
    await page
      .getByRole('button', { name: /Route available/ })
      .first()
      .click();
  const marker = page.locator('.map-pin.origin');
  const box = (await marker.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 8, box.y + box.height / 2 + 8, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.getByText(/A snapped/)).toBeVisible();
  await page.getByText('Enter coordinates', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('0');
  await page.getByLabel('Longitude', { exact: true }).fill('0');
  await page
    .getByRole('button', { name: 'Set coordinate', exact: true })
    .click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'outside the supported' }),
  ).toBeVisible();
});
function infoMobile(page: Page) {
  return page.viewportSize()!.width < 760;
}
