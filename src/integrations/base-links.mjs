import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Add the configured `base` to every root-relative URL in the built HTML.
 *
 * Starlight already prefixes its own navigation, assets and component links with
 * the base. Two things it cannot know about are:
 *
 * - Markdown links written as `](/sharing/selection/)`;
 * - MDX components such as `<LinkCard href="/start/first-gallery/" />`, which are
 *   rendered as plain `<a>` with the attribute untouched.
 *
 * Both matter because the preview lives at `https://picstome.github.io/docs/`
 * while production lives at the domain root. Running this on the *built* HTML,
 * after every integration that needs the original paths (the help snapshot
 * export), covers both cases with one pass.
 */
export function baseLinks({ base = '/', after = [] } = {}) {
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');

  return {
    name: 'picstome-base-links',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // `astro:build:done` hooks run in declaration order; the docs snapshot
        // needs the original root-relative paths, so it must run first.
        for (const integration of after) {
          await integration?.();
        }

        if (!prefix) {
          logger.info('base-links: site served from the root, nothing to rewrite.');
          return;
        }

        let rewritten = 0;
        let files = 0;

        const walk = (directory) => {
          for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const full = join(directory, entry.name);

            if (entry.isDirectory()) {
              if (!['_astro', 'pagefind'].includes(entry.name)) {
                walk(full);
              }
              continue;
            }

            if (!entry.name.endsWith('.html')) {
              continue;
            }

            const html = readFileSync(full, 'utf8');
            const next = html.replace(
              /(\s(?:href|src|poster|action)=")\/(?!\/)([^"]*)"/g,
              (match, attribute, path) => {
                if (path === prefix.slice(1) || path.startsWith(`${prefix.slice(1)}/`)) {
                  return match;
                }
                rewritten += 1;

                return `${attribute}${prefix}/${path}"`;
              },
            );

            if (next !== html) {
              writeFileSync(full, next);
              files += 1;
            }
          }
        };

        walk(dir.pathname);
        logger.info(`base-links: prefixed ${rewritten} URLs with "${prefix}" in ${files} pages.`);
      },
    },
  };
}
