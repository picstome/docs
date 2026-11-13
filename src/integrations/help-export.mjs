import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { load } from 'cheerio';

const SITE = 'https://docs.picstome.com';
const LOCALES = ['en', 'es'];

/**
 * Rewrite a route path into the public URL for a locale.
 * Starlight keeps the default locale at the root and prefixes the others.
 */
function localeUrl(locale, slug) {
  const clean = slug.replace(/^\/+|\/+$/g, '');
  const path = locale === 'en' ? `/${clean}` : `/es/${clean}`;
  return SITE + path.replace(/\/+$/, '') + '/';
}

/** Strip Starlight chrome from the built article so the flyout gets only content. */
function extractArticle($) {
  const main = $('main .sl-markdown-content').first();
  if (!main.length) {
    return null;
  }

  // Drop the metadata block the app reads, plus anchors, scripts and styles that
  // make no sense inside a modal.
  main.find('[data-help-meta], .sl-anchor-link, script, style, .sl-hidden, link').remove();

  return main;
}

/**
 * Make every URL absolute: the flyout lives inside the app, so a relative
 * `/es/galleries/...` would resolve against app.picstome.com instead of the docs.
 */
function absolutize($, root, locale, slug) {
  const base = localeUrl(locale, slug);

  root.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) {
      return;
    }
    try {
      $(el).attr('href', new URL(href, base).toString());
    } catch {
      $(el).attr('href', base);
    }
  });

  root.find('img[src], source[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (!src || /^https?:/.test(src)) {
      return;
    }
    try {
      $(el).attr('src', new URL(src, base).toString());
    } catch {
      $(el).removeAttr('src');
    }
  });

  // `srcset` in the docs points at Astro-optimized images; keep them absolute too.
  root.find('img[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (!srcset) {
      return;
    }
    const absolute = srcset
      .split(',')
      .map((candidate) => {
        const [url, descriptor] = candidate.trim().split(/\s+/);
        try {
          const resolved = new URL(url, base).toString();
          return descriptor ? `${resolved} ${descriptor}` : resolved;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .join(', ');
    $(el).attr('srcset', absolute);
  });

  // Remaining media is lazy by default inside the modal.
  root.find('img').attr('loading', 'lazy');

  return root;
}

/** Walk dist/ and collect the built HTML files that belong to the docs collection. */
function builtPages(distDir) {
  const pages = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const info = statSync(full);
      if (info.isDirectory()) {
        // Skip generated assets, pagefind and the status page assets.
        if (['_astro', 'pagefind', 'api'].includes(entry)) {
          continue;
        }
        walk(full);
        continue;
      }
      if (entry === 'index.html') {
        pages.push(full);
      }
    }
  };

  walk(distDir);
  return pages;
}

/** Detect locale + slug from the dist path. */
function parseRoute(distDir, file) {
  const rel = relative(distDir, file).split(sep);
  rel.pop(); // index.html
  const slug = rel.join('/') || 'index';

  if (slug === 'es' || slug.startsWith('es/')) {
    return { locale: 'es', slug: slug.replace(/^es\/?/, '') || 'index' };
  }

  return { locale: 'en', slug };
}

/**
 * Astro integration: after a successful build, emit
 * `dist/api/help-{en,es}.json` — the snapshot the Laravel app commits and
 * serves inside the help flyout.
 *
 * The source is the *built HTML*, not the Markdown, so what the modal shows is
 * literally the published page: no second Markdown renderer to keep in sync.
 */
export function helpExport() {
  const run = async ({ dir, logger }) => {
        const distDir = dir.pathname;
        const payload = { en: {}, es: {} };
        let exported = 0;

        for (const file of builtPages(distDir)) {
          const { locale, slug } = parseRoute(distDir, file);
          if (!LOCALES.includes(locale)) {
            continue;
          }

          const html = readFileSync(file, 'utf8');
          const $ = load(html);

          // Read the machine-readable contract *before* stripping the metadata
          // block from the article body.
          const section = $('[data-help-section]').first().attr('data-help-section');
          const summary = $('[data-help-summary]').first().attr('data-help-summary');
          const hidden = $('[data-help-hidden]').first().attr('data-help-hidden') === 'true';
          const appRoutes = ($('[data-help-routes]').first().attr('data-help-routes') ?? '')
            .split(',')
            .map((route) => route.trim())
            .filter(Boolean);

          const article = extractArticle($);
          if (!article) {
            continue;
          }

          const title = $('h1').first().text().trim();
          const description = $('meta[name="description"]').attr('content') ?? '';

          absolutize($, article, locale, slug);

          const entry = {
            slug: slug === 'index' ? '' : slug,
            title,
            description,
            summary: summary ?? '',
            html: article.html()?.trim() ?? '',
            url: localeUrl(locale, slug),
            locale,
            appRoutes,
            updated: new Date().toISOString().slice(0, 10),
          };

          if (section && !hidden) {
            payload[locale][section] = entry;
            exported += 1;
          }

          // Every built page also lands in the compact index used by the docs site
          // itself for “related articles” and by the app for the “read more” link.
          payload[locale][`page:${entry.slug}`] = { ...entry, html: undefined };
        }

        const apiDir = join(distDir, 'api');
        mkdirSync(apiDir, { recursive: true });

        for (const locale of LOCALES) {
          writeFileSync(join(apiDir, `help-${locale}.json`), JSON.stringify(payload[locale], null, 2));
        }

        logger.info(
          `Exportadas ${exported} secciones de ayuda para el panel (${LOCALES.join(', ')}).`
        );
  };

  return {
    name: 'picstome-help-export',
    hooks: {
      'astro:build:done': run,
    },
    // Reused by the base-links pass, which must run after it.
    run,
  };
}
