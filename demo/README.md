# Demo dataset and captures

The screenshots and clips in the documentation are generated from a real
Picstome install with a deterministic dataset. Nothing in this folder is built
into the public site; it is the machinery that produces the media.

## 1. Seed the demo studio

Requires a running Picstome (the app repo) with a configured photo disk.

```bash
cd /path/to/picstome
php artisan tinker /workspace/projects/picstome-docs/demo/seed.php
```

What it creates, and refreshes on every run:

| Section | Rows |
| --- | --- |
| Account | `docs@picstome.test` / `password`, studio `Estudio Norte`, handle `estudionorte` (or `estudionorte2` if taken) |
| Galleries | `Boda de Lucía y Marc` (shared, 40-photo selection limit, ratings, one pinned comment), `Retrato de estudio — Marta` (shared, watermarked, 5-photo limit), `Boda en la sierra` (public portfolio) |
| Clients | Lucía Ferrer (individual), Marc Vidal (individual), Agencia Bruma (company) |
| Photoshoots | One per delivered gallery |
| Contracts | One template, one draft, one signed |
| Invoices | Settings with fiscal data, one draft and one issued |

The photos come from `demo/photos/` (see `SOURCES.md`), are uploaded to the
configured S3 disk under `docs-demo/` and get a WebP grid thumbnail. The seed
never touches files outside the bucket and the demo rows: it refuses to run in
production.

It also writes `demo/state.json` with the ids and public links the capture script
needs. That file is git-ignored: the ids belong to your local database.

## 2. Capture screenshots

```bash
cd /workspace/projects/picstome-docs
node demo/capture.mjs                  # both languages, all sections
node demo/capture.mjs --lang es        # one language
node demo/capture.mjs --only selection # one article
```

Options:

| Flag | Default | Meaning |
| --- | --- | --- |
| `--url` | `http://127.0.0.1:8123` | Base URL of the running app |
| `--lang` | `en,es` | Comma-separated locales |
| `--only` | all | Section id or article slug |
| `--docs` | repo root | Unused placeholder for future export |

Outputs:

- `src/assets/screens/{slug}.webp` and `{slug}-es.webp`
- `{file}.webp` for extra shots of the same article (the invoice wizard and
  detail, the public profile and portfolio pages)
- `{slug}.detail.webp` when the article has a `detail` selector (a tighter crop
  of the one control it talks about)
- public pages declared with `client: true` are captured as a visitor sees them,
  without the panel crop

## 3. Wire the media into the articles

```bash
node scripts/screens.mjs
```

It rewrites the `{/* media:start */} … {/* media:end */}` block of every article
that has media, with the alt text and caption declared in `scripts/screens.mjs`.

## Known gaps in the application

Two screens still render untranslated labels inside the Spanish interface,
because the strings live in the browser (file input) or in the calculator seed
data. They are not documentation bugs, but they show up in the captures:

- the native file input (`Choose File` / `No file chosen`) on *Marca → Marca de agua*;
- the default calculator rows (`Self-Employment Quota`, …).

Once the app translates those, regenerate with `node demo/capture.mjs`.

## Notes

- The capture crops to the panel `<main>`: at article width the sidebar would
  make the interface unreadable. Client-facing pages are captured whole.
- The pointer is parked in a corner before shooting so no tooltip is left open.
- The clip hearts two photos that are **not** already favourites and checks the
  counter after every click, so a stale demo dataset does not produce a clip
  where the counter goes down.
- Spanish and English captures differ: the interface language is a user setting,
  so the script switches it through *Settings → Appearance* like a person would.
