/**
 * Check that every internal link points at the right language.
 *
 * Two rules, and they are easy to get wrong by hand:
 *
 * - a Spanish article may only link to `/es/...` (or to an external URL);
 * - an English article may never link to `/es/...`.
 *
 * It covers the three places a link can appear: a Markdown link, the `href` of
 * a component (`LinkCard`, `SectionCard`), and a hero `link:` in the frontmatter.
 *
 * It runs on the **built site** as well: a page under `dist/es/` whose anchor
 * points to a path outside `/es/` is a broken translation, even when both files
 * exist.
 *
 * Usage: node scripts/check-links.mjs        (adds to the build via verify.mjs)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';

const CONTENT = 'src/content/docs';
const DIST = 'dist';
const failures = [];

const isExternal = (url) => /^(https?:|mailto:|tel:|#|\/\/)/.test(url);

/** Every Markdown/MDX file with its locale. */
function sources(dir, isSpanish = false) {
  const found = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      found.push(...sources(full, isSpanish || entry.name === 'es'));
      continue;
    }

    if (/\.mdx?$/.test(entry.name)) {
      found.push({ file: full, isSpanish });
    }
  }

  return found;
}

/* ---------------------------------------------------------------------------
 * 1. Sources
 * ------------------------------------------------------------------------ */

for (const { file, isSpanish } of sources(CONTENT)) {
  const raw = readFileSync(file, 'utf8');
  const rel = file.replace(`${CONTENT}/`, '');

  // Markdown links: [text](/path)
  for (const match of raw.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const url = match[1];

    if (isExternal(url)) {
      continue;
    }

    if (isSpanish && !url.startsWith('/es/')) {
      failures.push(`${rel}: Spanish article links to ${url} (should be /es/${url.replace(/^\//, '')})`);
    }

    if (!isSpanish && url.startsWith('/es/')) {
      failures.push(`${rel}: English article links to ${url} (should be ${url.replace(/^\/es/, '') || '/'})`);
    }
  }

  // Component props: href="/path"
  for (const match of raw.matchAll(/href="(\/[^"]*)"/g)) {
    const url = match[1];

    if (isExternal(url)) {
      continue;
    }

    if (isSpanish && !url.startsWith('/es/')) {
      failures.push(`${rel}: href ${url} in a Spanish article is not under /es/`);
    }

    if (!isSpanish && url.startsWith('/es/')) {
      failures.push(`${rel}: href ${url} in an English article points to Spanish`);
    }
  }

  // Hero actions: `link: /path` in the frontmatter.
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

  for (const match of frontmatter.matchAll(/^\s*-?\s*link:\s*(\/\S+)$/gm)) {
    const url = match[1];

    if (isSpanish && !url.startsWith('/es/')) {
      failures.push(`${rel}: hero link ${url} is not under /es/`);
    }

    if (!isSpanish && url.startsWith('/es/')) {
      failures.push(`${rel}: hero link ${url} points to Spanish`);
    }
  }
}

/* ---------------------------------------------------------------------------
 * 2. Built site
 *
 * Catches links produced by a component or a redirect that the source scan
 * cannot see, and checks that the target page exists at all.
 * ------------------------------------------------------------------------ */

if (existsSync(DIST)) {
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['_astro', 'pagefind', 'api'].includes(entry.name)) {
          walk(full);
        }
        continue;
      }
      if (entry.name.endsWith('.html')) {
        pages.push(full);
      }
    }
  };
  walk(DIST);

  const built = new Set(pages);

  const resolves = (url) => {
    const clean = url.split('#')[0].split('?')[0];
    if (!clean || clean === '/') {
      return built.has(join(DIST, 'index.html'));
    }
    const target = join(DIST, clean.replace(/^\//, ''));
    if (clean.endsWith('/')) {
      return built.has(join(target, 'index.html'));
    }
    return existsSync(target) || built.has(join(target, 'index.html')) || existsSync(`${target}.html`);
  };

  for (const page of pages) {
    const $ = load(readFileSync(page, 'utf8'));
    const isSpanishPage = page.includes(`${DIST}/es/`);
    const route = '/' + page.replace(`${DIST}/`, '').replace(/index\.html$/, '');

    $('main a[href^="/"], nav a[href^="/"], header a[href^="/"]').each((_, element) => {
      const href = $(element).attr('href');

      if (!href || isExternal(href)) {
        return;
      }

      // `/es` without the trailing slash is the locale root that the language
      // switcher and the site title point at; it is correct.
      if (isSpanishPage && href !== '/es' && !href.startsWith('/es/')) {
        failures.push(`${route}: link to ${href} leaves the Spanish site`);
        return;
      }

      if (!isSpanishPage && href.startsWith('/es/')) {
        failures.push(`${route}: English page links to ${href}`);
        return;
      }

      if (!resolves(href)) {
        failures.push(`${route}: broken link to ${href}`);
      }
    });
  }
}

if (failures.length === 0) {
  console.log('Links: every internal link stays in its language and resolves.');
  process.exit(0);
}

console.error(`Links: ${failures.length} problem(s)`);
for (const failure of failures) {
  console.error(`  - ${failure}`);
}
process.exit(1);
