#!/usr/bin/env node

/**
 * Generate the screenshots and the short clip for the documentation.
 *
 * Lives in the docs repository on purpose: the application repo stays untouched.
 * It only needs a running Picstome with the demo data:
 *
 *     php artisan tinker /workspace/projects/picstome-docs/demo/seed.php
 *     node demo/capture.mjs                    # everything
 *     node demo/capture.mjs --lang es          # one locale
 *     node demo/capture.mjs --only selection   # one section
 *     node demo/capture.mjs --video            # also record the clip
 *
 * Where outputs go:
 *
 * - screens -> `src/assets/screens/{slug}.webp` (English) and
 *   `src/assets/screens/{slug}-es.webp` (Spanish), ready for the articles;
 * - video   -> `public/videos/{slug}.webm` plus a `.webp` poster.
 *
 * The script crops to the panel `<main>` so the screenshots read well inside an
 * article column, and it parks the pointer in a corner to avoid stray tooltips.
 */

import { chromium } from 'playwright';
import { mkdirSync, copyFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOT_DIR = join(ROOT, 'src/assets/screens');
const VIDEO_DIR = join(ROOT, 'public/videos');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const BASE = value('url', process.env.DOCS_BASE_URL ?? 'http://127.0.0.1:8123');
const LOCALES = value('lang', 'en,es').split(',').map((locale) => locale.trim()).filter(Boolean);
const ONLY = value('only', null);
const RECORD_VIDEO = flag('video');
const EMAIL = process.env.DOCS_EMAIL ?? 'docs@picstome.test';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'password';

/**
 * Gallery ids and public link written by `demo/seed.php`.
 *
 * Using the state file keeps the capture script aligned with whatever ids the
 * local database assigned: the demo does not assume ULIDs.
 */
const STATE_PATH = join(ROOT, 'demo/state.json');
const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, 'utf8')) : null;
const DEMO_GALLERY = 'Boda de Lucía y Marc';

/** Rewrite the absolute URLs written by the seeder to the local base. */
const local = (url) => (url ? new URL(new URL(url).pathname, BASE).toString() : null);

/**
 * One entry per documented article that needs a capture.
 *
 * `path` is a route path. `{gallery}` is replaced with the id of the demo
 * gallery found on the Galleries screen. `crop: false` keeps the whole window
 * for client-facing pages (which have no sidebar).
 */
const SECTIONS = [
  { id: 'culling', path: '/galleries/{gallery}', article: 'culling', action: 'tab:photos', wait: 2200 },
  { id: 'culling-rating', path: '/galleries/{gallery}', article: 'culling/rating', action: 'tab:photos', wait: 2200 },
  { id: 'culling-archiving', path: '/galleries/{gallery}', article: 'culling/archiving', action: 'tab:photos', wait: 2200 },
  { id: 'sharing', path: '/galleries/{gallery}', article: 'sharing', action: 'tab:share', wait: 2400 },
  { id: 'selection', path: '/galleries/{gallery}', article: 'sharing/selection', action: 'tab:favorites', wait: 2400 },
  { id: 'client-link', path: '/galleries/{gallery}', article: 'sharing/client-link', action: 'tab:share', wait: 2400 },
  { id: 'comments', path: '/galleries/{gallery}', article: 'sharing/comments', action: 'tab:comments', wait: 2400 },
  { id: 'downloads', path: '/galleries/{gallery}', article: 'sharing/downloads', action: 'tab:share', wait: 2400 },
];

/** Client-facing page: the same gallery opened through its public link. */
const CLIENT_PAGE = { article: 'sharing/client-link', crop: false };

/** The one clip for the pilot page. */
const VIDEO = { id: 'selection', article: 'sharing/selection' };

const log = (message) => process.stdout.write(`${message}\n`);

async function login(page, locale) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  if (page.url().includes('/login')) {
    await page.fill('input[type=email]', EMAIL);
    await page.fill('input[type=password]', PASSWORD);
    await Promise.all([
      page.waitForURL('**/dashboard**', { timeout: 30_000 }).catch(() => {}),
      page.click('button[type=submit]'),
    ]);
  }

  // The interface language is a user setting, not a URL segment.
  await page.goto(`${BASE}/settings/appearance`, { waitUntil: 'networkidle' });
  const label = page.locator(`label:has-text("${locale === 'es' ? 'Español' : 'English'}")`).first();

  if (await label.count()) {
    await label.click();
    await page.locator('button[type=submit]').first().click();
    await page.waitForTimeout(1500);
  }

  log(`  logged in (${locale})`);
}

/**
 * Find the demo gallery the articles talk about.
 *
 * The Galleries screen lists every gallery, so the link is picked by its name
 * (`demo/seed.php` creates it) instead of "the first one", which could be the
 * portfolio gallery.
 */
async function demoGallery(page) {
  // Fast path: the seeder already told us the id of the gallery the articles use.
  if (state?.galleries?.[DEMO_GALLERY]?.id) {
    return { href: `/galleries/${state.galleries[DEMO_GALLERY].id}`, shareUrl: local(state.galleries[DEMO_GALLERY].share_url) };
  }

  await page.goto(`${BASE}/galleries`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  const named = page.locator('main a[href*="/galleries/"]', { hasText: DEMO_GALLERY }).first();

  if (await named.count()) {
    return { href: await named.getAttribute('href'), shareUrl: null };
  }

  const link = page.locator('main a[href*="/galleries/"]').first();
  if (!(await link.count())) {
    throw new Error('No gallery found: did you run demo/seed.php?');
  }

  return { href: await link.getAttribute('href'), shareUrl: null };
}

async function openTab(page, name) {
  const labels = {
    photos: /^(fotos|photos)$/i,
    share: /^(compartir|share)$/i,
    favorites: /favorit/i,
    comments: /comentario|comment/i,
  };

  const button = page.getByRole('button', { name: labels[name] ?? name }).first();

  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(1300);
  }
}

async function capture(page, { article, locale, gallery, shareUrl, action, wait = 1600, crop = true }) {
  const slug = article.replace(/\//g, '-');
  const file = join(SHOT_DIR, `${slug}${locale === 'es' ? '-es' : ''}.webp`);

  const url = shareUrl ?? `${BASE}/galleries/${gallery}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);

  if (action?.startsWith('tab:')) {
    await openTab(page, action.slice(4));
  }

  // Never leave a tooltip open from the previous click.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(250);

  if (crop) {
    const main = page.locator('main').first();
    const box = await main.boundingBox().catch(() => null);

    if (box) {
      const contentBottom = await page.evaluate(() => {
        let bottom = 0;
        for (const node of document.querySelectorAll('main *')) {
          const rect = node.getBoundingClientRect();
          if (rect.height > 0 && rect.width > 0) {
            bottom = Math.max(bottom, rect.bottom + window.scrollY);
          }
        }
        return bottom;
      });

      await page.screenshot({
        path: file,
        type: 'webp',
        quality: 90,
        clip: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: Math.max(260, Math.min(box.height, contentBottom - box.y + 20)),
        },
      });

      log(`  ${locale}: ${file.replace(ROOT + '/', '')}`);
      return;
    }
  }

  await page.screenshot({ path: file, type: 'webp', quality: 90 });
  log(`  ${locale}: ${file.replace(ROOT + '/', '')}`);
}

/**
 * Record the pilot clip: the client opens the shared gallery, hearts two photos
 * and the counter moves. `recordVideo` writes a WebM with no audio.
 */
async function recordClip(browser, locale, shareUrl) {
  mkdirSync(VIDEO_DIR, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    locale: locale === 'es' ? 'es-ES' : 'en-US',
    timezoneId: 'Europe/Madrid',
  });

  const page = await context.newPage();
  await page.goto(shareUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  // Scroll the gallery so the photo grid is centred: the hearts live on the
  // tiles, and the first screen is the cover and the tabs.
  await page.mouse.move(640, 400);
  for (let step = 0; step < 4; step += 1) {
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(320);
  }

  await page.waitForTimeout(900);

  // Heart two photos that are not favourites yet.
  //
  // The demo gallery arrives with four of six photos already favourited, and the
  // order on screen depends on the sort, so the clip cannot assume which tiles
  // are free. It clicks, reads the counter in the tab, and undoes the click when
  // the counter went down. That keeps the clip correct even when the demo data
  // is not freshly seeded.
  const counter = async () => {
    const label = await page
      .locator('button[aria-label*="favorit" i]')
      .first()
      .getAttribute('aria-label')
      .catch(() => null);
    const match = /(\d+)/.exec(label ?? '');
    return match ? Number(match[1]) : null;
  };

  const hearts = page.locator('button[aria-label="Favorite"]');
  const visible = [];

  for (let index = 0; index < (await hearts.count()); index += 1) {
    const heart = hearts.nth(index);
    const box = await heart.boundingBox().catch(() => null);

    if (box && box.width > 0) {
      visible.push(heart);
    }
  }

  // The demo gallery is delivered with its first four photos favourited, and the
  // grid is sorted by name, so the free tiles are the last ones. Starting there
  // keeps the clip short; the counter check below still guards against a
  // re-seeded demo where the order changed.
  const candidates = [...visible].reverse();
  let added = 0;

  for (const heart of candidates.slice(0, 4)) {
    if (added >= 2) {
      break;
    }

    const before = await counter();

    await heart.scrollIntoViewIfNeeded().catch(() => {});
    await heart.hover({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    await heart.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1100);

    const after = await counter();

    if (before !== null && after !== null && after > before) {
      added += 1;
      continue;
    }

    // Already a favourite: the click removed it, so put it back and try another.
    await heart.click({ force: true }).catch(() => {});
    await page.waitForTimeout(900);
  }

  await page.waitForTimeout(1400);

  const recorded = await page.video()?.path();
  await context.close();

  if (!recorded || !existsSync(recorded)) {
    log('  ⚠️  no video recorded');
    return;
  }

  copyFileSync(recorded, join(VIDEO_DIR, `${VIDEO.id}${locale === 'es' ? '-es' : ''}.webm`));
  rmSync(recorded, { force: true });
  log(`  video: ${VIDEO.id}${locale === 'es' ? '-es' : ''}.webm`);
}

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true });
  mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    timezoneId: 'Europe/Madrid',
  });
  const page = await context.newPage();

  const sections = ONLY && ONLY !== 'video'
    ? SECTIONS.filter((section) => section.id === ONLY || section.article === ONLY)
    : ONLY === 'video'
      ? []
      : SECTIONS;

  for (const locale of LOCALES) {
    log(`\n${locale.toUpperCase()}`);
    await login(page, locale);

    const { href, shareUrl: sharedFromState } = await demoGallery(page);
    const gallery = href.split('/galleries/')[1]?.split('?')[0]?.split('/')[0];
    const shareUrl = sharedFromState ?? new URL(href, BASE).toString();
    log(`  gallery ${gallery} · ${shareUrl}`);

    for (const section of sections) {
      await capture(page, { ...section, locale, gallery, shareUrl: null });
    }

    if (!ONLY) {
      await capture(page, { ...CLIENT_PAGE, locale, shareUrl });
    }

    if (RECORD_VIDEO) {
      await recordClip(browser, locale, shareUrl);
    }
  }

  await browser.close();
  log('\nDone.');
  log(`Screens: ${SHOT_DIR}`);
  if (RECORD_VIDEO) {
    log(`Video:   ${VIDEO_DIR}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
