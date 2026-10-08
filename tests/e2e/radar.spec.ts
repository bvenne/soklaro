import { expect, test, type Page } from '@playwright/test';

const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64',
);

async function mockRadar(page: Page, delayFuture = false) {
  const reference = Math.floor(Date.now() / 300000) * 300000;
  const start = reference - 2 * 3600000,
    end = reference + 2 * 3600000;
  const iso = (time: number) => new Date(time).toISOString();
  const capabilities = `<WMS_Capabilities><Capability><Layer><Name>Niederschlagsradar</Name><Dimension name="time">${iso(start)}/${iso(end)}/PT5M</Dimension><Dimension name="REFERENCE_TIME">${iso(start)}/${iso(reference)}/PT5M</Dimension></Layer></Capability></WMS_Capabilities>`;
  const requests: string[] = [];
  let releaseFuture!: () => void;
  const futureReady = new Promise<void>((resolve) => {
    releaseFuture = resolve;
  });
  await page.route(
    /api\.open-meteo\.com|geocoding-api\.open-meteo\.com|commons\.wikimedia\.org|tile\.openstreetmap\.org/,
    (route) => route.abort(),
  );
  await page.route('https://maps.dwd.de/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.href);
    if (url.searchParams.get('request') === 'GetCapabilities') {
      await route.fulfill({
        status: 200,
        contentType: 'text/xml',
        body: capabilities,
      });
    } else {
      const time = Date.parse(url.searchParams.get('time') ?? '');
      if (delayFuture && time > reference + 30 * 60000) await futureReady;
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: pixel,
      });
    }
  });
  return { requests, reference, releaseFuture };
}

async function waitForRadar(page: Page) {
  await expect(page.locator('.leaflet-image-layer')).toHaveCount(1);
  await expect(page.locator('.radar-map-status')).not.toHaveClass(/is-loading/);
}

test('loads radar only on demand and reuses images and layer-specific metadata', async ({
  page,
}) => {
  const { requests } = await mockRadar(page);
  await page.goto('/app');
  await expect(page.locator('.radar-trigger')).toBeVisible();
  expect(requests).toEqual([]);
  await page.locator('.radar-trigger').click();
  await waitForRadar(page);
  expect(
    requests.filter((url) => url.includes('GetCapabilities')),
  ).toHaveLength(1);
  expect(requests[0]).toContain('/dwd/Niederschlagsradar/ows?');
  const initialTime = await page.locator('.radar-map-status').innerText();
  const initialRequest = requests.find(
    (url) => new URL(url).searchParams.get('request') === 'GetMap',
  )!;
  await page.locator('.radar-playback-options button').last().click();
  await expect(page.locator('.radar-map-status')).not.toHaveText(initialTime);
  await waitForRadar(page);
  await page.locator('.radar-playback-options button').first().click();
  await expect(page.locator('.radar-map-status')).toHaveText(initialTime);
  expect(requests.filter((url) => url === initialRequest)).toHaveLength(1);
  await page.locator('.radar-header button').click();
  const count = requests.length;
  await page.waitForTimeout(300);
  expect(requests).toHaveLength(count);
  await page.locator('.radar-trigger').click();
  await waitForRadar(page);
  expect(
    requests.filter((url) => url.includes('GetCapabilities')),
  ).toHaveLength(1);
});

test('keeps the displayed frame and timestamp together until a slow forecast finishes', async ({
  page,
}) => {
  const { reference, releaseFuture } = await mockRadar(page, true);
  await page.goto('/app');
  await page.locator('.radar-trigger').click();
  await waitForRadar(page);
  const before = await page.locator('.leaflet-image-layer').getAttribute('src');
  const label = await page
    .locator('.radar-map-status>span')
    .first()
    .innerText();
  await page.locator('.radar-range input').evaluate(
    (element, target) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(element, String(target));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    },
    reference + 60 * 60000,
  );
  await expect(page.locator('.radar-map-status')).toHaveClass(/is-loading/);
  await expect(page.locator('.leaflet-image-layer')).toHaveAttribute(
    'src',
    before!,
  );
  await expect(page.locator('.radar-map-status>span').first()).toHaveText(
    label,
  );
  releaseFuture();
  await expect(page.locator('.radar-map-status>span').first()).not.toHaveText(
    label,
  );
  await waitForRadar(page);
  await expect(page.locator('.leaflet-image-layer')).not.toHaveAttribute(
    'src',
    before!,
  );
});

test('recovers from an image error through refresh instead of remaining stuck loading', async ({
  page,
}) => {
  await mockRadar(page);
  let fail = true;
  await page.route(
    /maps\.dwd\.de\/geoserver\/ows\?.*request=GetMap/,
    async (route) => {
      if (fail)
        await route.fulfill({
          status: 503,
          contentType: 'text/plain',
          body: 'Unavailable',
        });
      else await route.fallback();
    },
  );
  await page.goto('/app');
  await page.locator('.radar-trigger').click();
  await expect(page.locator('.radar-map-status')).not.toHaveClass(/is-loading/);
  await expect(page.locator('.leaflet-image-layer')).toHaveCount(0);
  fail = false;
  await page.locator('.radar-controls>button').last().click();
  await waitForRadar(page);
});

test('renders green and yellow source rain as blue while keeping dry and no-data pixels distinct', async ({
  page,
}) => {
  const { requests } = await mockRadar(page);
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#019934';
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = '#ffff01';
    context.fillRect(1, 0, 1, 1);
    context.fillStyle = '#7d7d7d';
    context.globalAlpha = 0.3;
    context.fillRect(2, 0, 1, 1);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.route(/maps\.dwd\.de\/geoserver\/ows\?.*request=GetMap/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(fixture, 'base64'),
    }),
  );
  await page.goto('/app');
  await page.locator('.radar-trigger').click();
  await waitForRadar(page);
  const pixels = await page
    .locator('.leaflet-image-layer')
    .evaluate((element) => {
      const image = element as HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return [...context.getImageData(0, 0, canvas.width, canvas.height).data];
    });
  expect(pixels.slice(0, 4)).toEqual([140, 204, 255, 255]);
  expect(pixels.slice(4, 8)).toEqual([35, 126, 218, 255]);
  expect(Math.abs(pixels[8] - pixels[10])).toBeLessThanOrEqual(1);
  expect(pixels[11]).toBeGreaterThan(70);
  expect(pixels[11]).toBeLessThan(80);
  expect(pixels[15]).toBe(0);
  await page.locator('.radar-notes summary').click();
  await expect(page.locator('.radar-blue-legend li')).toHaveCount(15);
  expect(requests.some((url) => url.includes('GetLegendGraphic'))).toBe(false);
});
