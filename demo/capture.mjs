#!/usr/bin/env node

/**
 * Generate every screenshot the documentation uses.
 *
 * Lives in the docs repository on purpose: the application repo stays untouched.
 * It only needs a running Picstome with the demo data:
 *
 *     php artisan tinker /workspace/projects/picstome-docs/demo/seed.php
 *     node demo/capture.mjs                     # everything, both locales
 *     node demo/capture.mjs --lang es           # one locale
 *     node demo/capture.mjs --only selection    # one article
 *     node demo/capture.mjs --video             # also record the clips
 *
 * Two kinds of output per article:
 *
 * - a **full capture** of the panel area, to show the screen in context;
 * - a **detail crop** (`.detail`) when a single control carries the point of the
 *   article: the stars, the share switches, the download button. The crop keeps
 *   the surrounding box so the reader can recognise where it lives.
 *
 * Files land in `src/assets/screens/{slug}.webp` for English and
 * `{slug}-es.webp` for Spanish. The articles import them through
 * `scripts/screens.mjs`.
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

const STATE_PATH = join(ROOT, 'demo/state.json');
const state = existsSync(STATE_PATH) ? JSON.parse(readFileSync(STATE_PATH, 'utf8')) : null;
const DEMO_GALLERY = 'Boda de Lucía y Marc';

const log = (message) => process.stdout.write(`${message}\n`);

/**
 * Every capture the articles need.
 *
 * - `path` is a route path; `{gallery}` is the demo gallery id.
 * - `tab` clicks one of the gallery tabs before shooting.
 * - `open` clicks a button by its accessible name (the Share dialog, the
 *   download panel) so the screenshot shows the thing the article explains.
 * - `clicks` runs a short sequence of clicks before shooting (the invoice
 *   wizard, for example).
 * - `crop` crops the main shot around a selector instead of the whole panel.
 * - `client` captures the viewport as a visitor sees it, for public pages.
 * - `file` overrides the output name for a second shot of the same article.
 * - `detail` names a selector that is cropped around, stored as `{slug}.detail`.
 * - `wait` is the settle time for Livewire.
 */
const SECTIONS = [
  // --- Getting started -----------------------------------------------------
  { article: 'start/what-picstome-does', path: '/dashboard', wait: 1400 },
  { article: 'start/first-gallery', path: '/galleries', wait: 1200 },
  { article: 'start/plans-and-storage', path: '/dashboard', wait: 1400 },

  // --- Galleries -----------------------------------------------------------
  { article: 'galleries/uploading', path: '/galleries', wait: 1200, open: { name: /create gallery|crear galería/i }, detail: null },
  { article: 'galleries/original-size', path: '/galleries/{gallery}', wait: 2600 },
  {
    // Versions live in the photo viewer dock, not in a gallery tab: the capture
    // opens the photo the seeder gave a previous version to, then the Versions
    // button, which opens the comparison modal.
    article: 'galleries/file-versions',
    path: '/galleries/{gallery}/photos/{photo}',
    wait: 2600,
    open: { selector: '[data-photo-versions]' },
  },

  // --- Culling -------------------------------------------------------------
  { article: 'culling', path: '/galleries/{gallery}', wait: 2600 },
  { article: 'culling/rating', path: '/galleries/{gallery}', wait: 2600, detail: '[data-gallery-filter-bar]' },
  { article: 'culling/archiving', path: '/galleries/{gallery}', wait: 2600 },

  // --- Sharing -------------------------------------------------------------
  { article: 'sharing', path: '/galleries/{gallery}', wait: 2400, openShare: true },
  { article: 'sharing/client-link', path: '/galleries/{gallery}', wait: 2400, openShare: true },
  { article: 'sharing/selection', path: '/galleries/{gallery}', wait: 2600, tab: /favorit/i },
  { article: 'sharing/comments', path: '/galleries/{gallery}', wait: 2600, tab: /comment/i },
  {
    article: 'sharing/downloads',
    path: '/galleries/{gallery}',
    wait: 2400,
    openShare: true,
  },

  // --- Camera and apps -----------------------------------------------------
  { article: 'galleries/direct-upload', path: '/galleries', wait: 1200, open: { name: /connect camera|conectar cámara/i }, waitAfter: 1600 },
  {
    // The Rater article is about the export favorites modal: that is where the
    // "Rate my images" button hands the favorites to the desktop app.
    article: 'apps/rater',
    path: '/galleries/{gallery}',
    wait: 2400,
    tab: /favorit/i,
    open: { selector: '[data-test="export-favorites"], button[aria-label*="favorit" i] ~ *, [x-on\\:click*="favorite-list"]' },
  },

  // --- Business ------------------------------------------------------------
  { article: 'business/clients', path: '/customers', wait: 1200 },
  { article: 'business/contracts', path: '/contracts', wait: 1200 },

  // --- Money ---------------------------------------------------------------
  { article: 'money/invoices', path: '/invoices', wait: 1200 },
  {
    // The draft opens on step 2 because it already has a client; Continue takes
    // it to the review step, where the number and the Issue button live.
    article: 'money/invoices',
    file: 'money-invoices-create',
    path: '/invoices/create?invoice={draft_invoice}',
    wait: 2000,
    height: 1500,
    clicks: [{ name: /continue|continuar/i }],
  },
  {
    article: 'money/invoices',
    file: 'money-invoices-show',
    path: '/invoices/{issued_invoice}',
    wait: 1800,
    height: 1500,
    maskHost: 'https://app.picstome.com',
  },
  { article: 'money/vat', path: '/invoices/settings', wait: 1600 },
  { article: 'money/stripe', path: '/payments', wait: 1400 },

  // --- Brand ---------------------------------------------------------------
  { article: 'brand/public-profile', path: '/public-profile', wait: 1400, height: 1600, crop: 'main section' },
  {
    article: 'brand/public-profile',
    file: 'brand-public-profile-public',
    path: '/@{handle}',
    wait: 1800,
    client: true,
  },
  { article: 'brand/portfolio', path: '/portfolio', wait: 1400, height: 1200, crop: 'main > div' },
  {
    article: 'brand/portfolio',
    file: 'brand-portfolio-public',
    path: '/@{handle}/portfolio',
    wait: 1800,
    client: true,
  },
  { article: 'brand/watermark', path: '/branding/watermark', wait: 1400 },

  // --- Tools ---------------------------------------------------------------
  { article: 'apps/calculator', path: '/tools/calculator', wait: 1400, height: 1500, detail: 'main aside' },
  { article: 'apps/black-screen', path: '/tools/black-screen', wait: 1400, crop: 'main > div' },
];

/** Client-facing pages: captured whole, no sidebar. */
const CLIENT_PAGES = [
  { article: 'sharing/client-link', full: true },
];

/** The clips, one per flow where motion explains more than a paragraph. */
const VIDEOS = [
  { id: 'selection', article: 'sharing/selection' },
];

async function login(page, locale) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  if (page.url().includes('/login')) {
    // Login defaults to the emailed link; switch to the password form first.
    const passwordMode = page.getByText(/log in with password|iniciar sesión con contraseña/i).first();
    if (await passwordMode.count()) {
      await passwordMode.click();
      await page.locator('input[type=password]').waitFor({ timeout: 10_000 });
    }

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

async function demoGallery() {
  if (state?.galleries?.[DEMO_GALLERY]?.id) {
    const gallery = state.galleries[DEMO_GALLERY];

    return {
      id: gallery.id,
      photo: gallery.versioned_photo_id ?? null,
      shareUrl: gallery.share_url ? new URL(new URL(gallery.share_url).pathname, BASE).toString() : null,
    };
  }

  throw new Error('demo/state.json is missing: run demo/seed.php first.');
}

/** Click a tab or a button by accessible name, tolerating a missing element. */
async function clickIfPresent(page, matcher) {
  const target = page.getByRole('button', { name: matcher }).first();

  if (await target.count()) {
    await target.click().catch(() => {});
    return true;
  }

  const link = page.getByRole('link', { name: matcher }).first();

  if (await link.count()) {
    await link.click().catch(() => {});
    return true;
  }

  return false;
}

/**
 * Screenshot the panel area, trimmed to its real content height.
 *
 * At article width a full browser window leaves a large empty band below the
 * content, and the sidebar would shrink the interface until the labels are
 * unreadable. Cropping to `<main>` solves both.
 */
async function shootPanel(page, file) {
  const main = page.locator('main').first();
  const box = await main.boundingBox().catch(() => null);

  if (!box) {
    await page.screenshot({ path: file, type: 'webp', quality: 90 });
    return;
  }

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
      height: Math.max(260, Math.min(box.height, contentBottom - box.y + 24)),
    },
  });
}

/** Crop an open dialog: the whole modal box plus a little breathing room. */
async function shootDialog(page, file) {
  const dialog = page.locator('[role="dialog"], .tsui-modal, [data-modal]').first();

  if ((await dialog.count()) && (await dialog.isVisible().catch(() => false))) {
    const box = await dialog.boundingBox().catch(() => null);

    if (box && box.width > 200) {
      const margin = 24;
      const viewport = page.viewportSize();

      await page.screenshot({
        path: file,
        type: 'webp',
        quality: 90,
        clip: {
          x: Math.max(0, box.x - margin),
          y: Math.max(0, box.y - margin),
          width: Math.min(viewport.width - Math.max(0, box.x - margin), box.width + margin * 2),
          height: Math.min(viewport.height - Math.max(0, box.y - margin), box.height + margin * 2),
        },
      });

      return;
    }
  }

  await shootPanel(page, file);
}

/** Crop tightly around one element, keeping a margin so it stays recognisable. */
async function shootDetail(page, selector, file) {
  const element = page.locator(selector).first();

  if (!(await element.count())) {
    return false;
  }

  await element.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);

  const box = await element.boundingBox().catch(() => null);

  if (!box || box.width < 40 || box.height < 20) {
    return false;
  }

  const margin = 28;
  const viewport = page.viewportSize();

  await page.screenshot({
    path: file,
    type: 'webp',
    quality: 92,
    clip: {
      x: Math.max(0, box.x - margin),
      y: Math.max(0, box.y - margin),
      width: Math.min(viewport.width - Math.max(0, box.x - margin), box.width + margin * 2),
      height: Math.min(viewport.height - Math.max(0, box.y - margin), box.height + margin * 2),
    },
  });

  return true;
}

/**
 * Open the Share settings dialog.
 *
 * A shared gallery puts "Stop sharing" (which disables sharing when clicked) next
 * to a chevron that opens a menu with "Share settings". This helper only ever
 * clicks the chevron and the menu item, never the destructive button, so taking
 * screenshots cannot change the demo data.
 */
async function openShareSettings(page) {
  const menuItem = page
    .getByText(/share settings|configuraciones de compartición|ajustes de compartir|configurar compartir/i)
    .first();
  const chevron = page.locator('button:has(svg)').filter({ has: page.locator('svg') });

  // Shared gallery: the chevron sits right next to "Stop sharing".
  const stopSharing = page.getByText(/stop sharing|dejar de compartir/i).first();

  if (await stopSharing.count()) {
    // The chevron is the small square button that follows the label.
    const toggle = page.locator('button.-ms-px, button[class*="rounded-s-none"]').first();

    if (await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(800);
    }

    if (await menuItem.count()) {
      await menuItem.click();
      await page.waitForTimeout(1600);
      return true;
    }
  }

  // Not shared yet: a plain "Share" button opens the same dialog.
  const direct = page.getByRole('button', { name: /^share$|^compartir$/i }).first();

  if (await direct.count()) {
    await direct.click();
    await page.waitForTimeout(1600);
    return true;
  }

  return false;
}

async function capture(page, section, locale, gallery) {
  const slug = section.file ?? section.article.replace(/\//g, '-');
  const suffix = locale === 'es' ? '-es' : '';
  const file = join(SHOT_DIR, `${slug}${suffix}.webp`);
  const detailFile = join(SHOT_DIR, `${slug}${suffix}.detail.webp`);

  const studio = state?.studio ?? {};
  const invoices = state?.invoices ?? {};
  await page.setViewportSize({ width: 1440, height: section.height ?? 900 });

  const path = section.path
    .replace('{gallery}', gallery.id)
    .replace('{photo}', gallery.photo ?? '')
    .replace('{handle}', studio.handle ?? '')
    .replace('{draft_invoice}', invoices.draft?.ulid ?? '')
    .replace('{issued_invoice}', invoices.issued?.ulid ?? '');
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(section.wait ?? 1600);

  if (section.tab) {
    await clickIfPresent(page, section.tab);
    await page.waitForTimeout(1200);
  }

  if (section.maskHost) {
    await page.evaluate((host) => {
      for (const input of document.querySelectorAll('input')) {
        if (/https?:\/\/(127\.0\.0\.1|localhost)/.test(input.value)) {
          input.value = input.value.replace(/^https?:\/\/[^/]+/, host);
        }
      }
    }, section.maskHost);
  }

  for (const click of section.clicks ?? []) {
    if (click.selector) {
      await page.locator(click.selector).first().click().catch(() => {});
    } else {
      await clickIfPresent(page, click.name);
    }
    await page.waitForTimeout(click.wait ?? 1400);
  }

  if (section.client) {
    await page.mouse.move(2, 2);
    await page.waitForTimeout(250);
    await page.screenshot({ path: file, type: 'webp', quality: 90 });
    log(`  ${locale}: ${file.replace(ROOT + '/', '')} (client page)`);
    return;
  }

  if (section.openShare) {
    await openShareSettings(page);
  } else if (section.open?.selector) {
    const target = page.locator(section.open.selector).first();

    if (await target.count()) {
      await target.click().catch(() => {});
      await page.waitForTimeout(section.waitAfter ?? 1800);
    }
  } else if (section.open) {
    await clickIfPresent(page, section.open.name);
    await page.waitForTimeout(section.waitAfter ?? 1400);
  }

  // Never leave a tooltip open from the previous click.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(250);

  if (section.openShare || section.open) {
    // A dialog is open: crop to it so the article shows exactly the switches
    // it talks about, with the page dimmed behind.
    await shootDialog(page, file);
  } else if (section.crop) {
    const cropped = await shootDetail(page, section.crop, file);

    if (! cropped) {
      await shootPanel(page, file);
    }
  } else {
    await shootPanel(page, file);
  }

  log(`  ${locale}: ${file.replace(ROOT + '/', '')}`);

  if (section.detail) {
    const shot = await shootDetail(page, section.detail, detailFile);

    if (shot) {
      log(`  ${locale}: ${detailFile.replace(ROOT + '/', '')} (detail)`);
    }
  }
}

/** Client-facing page, captured whole because it has no sidebar. */
async function captureClient(page, locale, shareUrl) {
  const file = join(SHOT_DIR, `sharing-client-link${locale === 'es' ? '-es' : ''}.webp`);

  await page.goto(shareUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(250);
  await page.screenshot({ path: file, type: 'webp', quality: 90 });
  log(`  ${locale}: ${file.replace(ROOT + '/', '')} (client page)`);
}

/**
 * Record a clip: the client opens the shared gallery, hearts two photos and the
 * counter moves. `recordVideo` writes a WebM with no audio.
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

  await page.mouse.move(640, 400);
  for (let step = 0; step < 4; step += 1) {
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(320);
  }
  await page.waitForTimeout(900);

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

  // The demo gallery arrives with its first photos favorited and the grid is
  // sorted by name, so the free tiles are the last ones. The counter check
  // guards against a re-seeded demo where the order changed.
  let added = 0;

  for (const heart of [...visible].reverse().slice(0, 4)) {
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

  const target = join(VIDEO_DIR, `selection${locale === 'es' ? '-es' : ''}.webm`);
  copyFileSync(recorded, target);
  rmSync(recorded, { force: true });
  log(`  video: ${target.replace(ROOT + '/', '')}`);
}

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true });
  mkdirSync(VIDEO_DIR, { recursive: true });

  const sections = ONLY
    ? SECTIONS.filter((section) => section.article === ONLY || section.article.startsWith(`${ONLY}/`))
    : SECTIONS;

  for (const locale of LOCALES) {
    log(`\n${locale.toUpperCase()}`);
    const browser = await chromium.launch({
      args: [`--lang=${locale === 'es' ? 'es-ES' : 'en-US'}`],
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      locale: locale === 'es' ? 'es-ES' : 'en-US',
      timezoneId: 'Europe/Madrid',
    });
    const page = await context.newPage();
    await login(page, locale);

    const gallery = await demoGallery();
    log(`  gallery ${gallery.id}`);

    for (const section of sections) {
      await capture(page, section, locale, gallery);
    }

    if (!ONLY) {
      for (const clientPage of CLIENT_PAGES) {
        if (gallery.shareUrl) {
          await captureClient(page, locale, gallery.shareUrl);
        }
      }
    }

    if (RECORD_VIDEO && gallery.shareUrl) {
      await recordClip(browser, locale, gallery.shareUrl);
    }

    await context.close();
    await browser.close();
  }
  log('\nDone.');
  log(`Screens: ${SHOT_DIR}`);
  if (RECORD_VIDEO) {
    log(`Videos:  ${VIDEO_DIR}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
