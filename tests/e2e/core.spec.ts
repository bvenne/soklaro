import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('soklaro:language', 'en');
    localStorage.setItem('soklaro:geolocation-default', 'false');
    localStorage.setItem('soklaro:pwa-install-prompt-seen', 'true');
  });
  await page.route(
    /api\.open-meteo\.com|geocoding-api\.open-meteo\.com|commons\.wikimedia\.org/,
    (route) => route.abort(),
  );
});

test('landing page exposes the privacy-first weather flow', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /The weather for your place/ }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Open weather', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Hamburg', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Search places', exact: true }),
  ).toBeVisible();
});

test('network and privacy view lists every default external host', async ({
  page,
}) => {
  await page.goto('/privacy/');
  for (const host of [
    'api.open-meteo.com',
    'geocoding-api.open-meteo.com',
    'nominatim.openstreetmap.org',
    'commons.wikimedia.org',
  ]) {
    await expect(page.getByText(host, { exact: true })).toBeVisible();
  }
});

test('local CSS preserves the two-column details and full-width mobile day periods', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/app');
  await expect(page.locator('.data-pill')).toHaveCount(6);
  const columns = await page
    .locator('.detail-grid')
    .evaluate(
      (grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length,
    );
  expect(columns).toBe(2);
  await page.locator('.day-toggle').first().click();
  const periods = page.locator('.day-forecast').first().locator('.day-period');
  await expect(periods).toHaveCount(4);
  const boxes = await periods.evaluateAll((elements) =>
    elements.map((element) => {
      const { x, y, width } = element.getBoundingClientRect();
      return { x, y, width };
    }),
  );
  for (let index = 1; index < boxes.length; index++) {
    expect(boxes[index].x).toBeCloseTo(boxes[0].x);
    expect(boxes[index].width).toBeCloseTo(boxes[0].width);
    expect(boxes[index].y).toBeGreaterThan(boxes[index - 1].y);
  }
  await expect(page.locator('.hourly small[hidden]').first()).toBeHidden();
});

test('hour tiles stay inside their day while scrolling past midnight', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/app/');
  const hourly = page.locator('.hourly');
  await expect(hourly.locator('.hourly-day').nth(1)).toBeVisible();
  const days = await hourly.evaluate(async (scroller) => {
    const groups = [...scroller.querySelectorAll<HTMLElement>('.hourly-day')];
    scroller.scrollLeft += groups[1].getBoundingClientRect().left
      - scroller.getBoundingClientRect().left - 110;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return groups.map((group) => ({
      headingRight: group.querySelector('.hourly-date')!.getBoundingClientRect().right,
      first: group.querySelector('article')!.getBoundingClientRect().left,
      last: group.querySelector('article:last-child')!.getBoundingClientRect().right,
      right: group.getBoundingClientRect().right,
    }));
  });
  for (let index = 0; index < days.length - 1; index++) {
    expect(days[index].last).toBeLessThanOrEqual(days[index].right + 1);
    expect(days[index].last).toBeLessThan(days[index + 1].first);
    expect(days[index].headingRight).toBeLessThan(days[index + 1].first);
  }
  expect(days[1].first).toBeGreaterThan(0);
  expect(days[1].first).toBeLessThan(393);
});

test('settings controls and both themes work without a CSS framework', async ({
  page,
}) => {
  await page.goto('/app');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const settings = page.locator('.settings-drawer');
  await expect(settings).toBeVisible();
  for (const [label, theme] of [
    ['Light', 'light'],
    ['Dark', 'dark'],
  ] as const) {
    await settings.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.weather-app')).toHaveAttribute(
      'data-theme',
      theme,
    );
    await expect(
      settings.getByRole('button', { name: label, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
