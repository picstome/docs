import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

/**
 * `help` is the contract shared with the Picstome app.
 *
 * Every article that should be reachable from the in-app help flyout declares
 * its section id here; `scripts/verify.mjs` guarantees that the same id exists
 * in both languages and that the generated JSON snapshot the app downloads
 * never references a missing page.
 */
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        help: z
          .object({
            /** Stable id used by `<x-help-button section="..." />` in the app. */
            section: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)*$/),
            /** One or two sentences shown above the fold inside the flyout. */
            summary: z.string().min(10),
            /** Named Laravel routes where the help button is rendered. */
            appRoutes: z.array(z.string()).default([]),
            /** Optional short video slug, resolved to /videos/{slug}.webm. */
            video: z.string().optional(),
            /** Hide from the in-app flyout while keeping the public page. */
            appHidden: z.boolean().default(false),
          })
          .optional(),
      }),
    }),
  }),
};
