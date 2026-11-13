/**
 * Insert (or refresh) the screenshots and the video of every documented article.
 *
 * The captures are generated from the application with `demo/capture.mjs`, then
 * copied here. This script only wires them into the MDX sources:
 *
 * - English article -> `src/assets/screens/{slug}.webp`
 * - Spanish article -> `src/assets/screens/{slug}-es.webp`
 * - Video           -> `public/videos/{id}.webm` + `.webp` poster
 *
 * Two markers delimit the generated block, so re-running after a regeneration
 * is safe:
 *
 *     {/* media:start *\/}
 *     ...
 *     {/* media:end *\/}
 *
 * Usage: node scripts/screens.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SCREENS = 'src/assets/screens';
const START = '{/* media:start */}';
const END = '{/* media:end */}';

/**
 * One entry per article that has media.
 *
 * `alt` describes what the screen shows, not "screenshot of". `caption` explains
 * what to look at. `video` is the slug in `public/videos/`.
 */
const MEDIA = {
  culling: {
    en: {
      alt: 'A gallery in the panel with six wedding photos, star ratings in the corner of each thumbnail and the Photos, Favorites and Comments tabs',
      caption: 'The gallery grid is where a culling pass starts: every photo can be opened, rated and filtered from here.',
    },
    es: {
      alt: 'Una galería del panel con seis fotos de boda, las estrellas de valoración en la esquina de cada miniatura y las pestañas Fotos, Favoritos y Comentarios',
      caption: 'La cuadrícula de la galería es donde empieza la criba: desde aquí se abre, valora y filtra cada foto.',
    },
  },
  'culling/rating': {
    en: {
      alt: 'Gallery grid with photos rated from one to five stars and a rating filter next to the sort control',
      caption: 'Stars live on the thumbnail, and the filter on the right shows only the rating you pick.',
    },
    es: {
      alt: 'Cuadrícula de galería con fotos valoradas de una a cinco estrellas y un filtro por valoración junto al control de orden',
      caption: 'Las estrellas van en la miniatura, y el filtro de la derecha deja solo la valoración que elijas.',
    },
  },
  'culling/archiving': {
    en: {
      alt: 'Gallery grid with the photos tab active and the archive action available in the viewer',
      caption: 'Archiving removes a photo from the client view without deleting the file.',
    },
    es: {
      alt: 'Cuadrícula de galería con la pestaña de fotos activa y la acción de archivar disponible en el visor',
      caption: 'Archivar quita una foto de la vista del cliente sin borrar el archivo.',
    },
  },
  sharing: {
    en: {
      alt: 'The Share tab of a gallery with the password, selection limit, download and watermark switches',
      caption: 'Each switch in the Share tab controls one thing the client can do.',
    },
    es: {
      alt: 'La pestaña Compartir de una galería con los interruptores de contraseña, límite de selección, descarga y marca de agua',
      caption: 'Cada interruptor de la pestaña Compartir controla una cosa que puede hacer el cliente.',
    },
  },
  'sharing/selection': {
    en: {
      alt: 'The Favorites tab showing 4 of 40 selected photos and the Export favorites button',
      caption: 'The Favorites tab is where the client selection becomes a list of file names.',
      video: 'selection',
      videoCaption: 'The client opens the link, hearts two photos and the counter moves from 2 to 4 out of 40.',
    },
    es: {
      alt: 'La pestaña Favoritos mostrando 4 de 40 fotos seleccionadas y el botón de Exportar favoritos',
      caption: 'La pestaña Favoritos es donde la selección del cliente se convierte en una lista de archivos.',
      video: 'selection-es',
      videoCaption: 'El cliente abre el enlace, marca dos fotos con el corazón y el contador pasa de 2 a 4 de 40.',
    },
  },
  'sharing/client-link': {
    en: {
      alt: 'A shared gallery opened as a client sees it, with the studio logo, the gallery name and the photos',
      caption: 'No account, no app: the link opens a page with your branding and the photos.',
    },
    es: {
      alt: 'Una galería compartida abierta como la ve el cliente, con el logo del estudio, el nombre de la galería y las fotos',
      caption: 'Sin cuenta y sin app: el enlace abre una página con tu marca y las fotos.',
    },
  },
  'sharing/comments': {
    en: {
      alt: 'The Comments tab of a gallery with a client comment and a pin on the photo',
      caption: 'A comment stays next to the photo, and the pin points at the exact spot.',
    },
    es: {
      alt: 'La pestaña Comentarios de una galería con un comentario del cliente y una chincheta en la foto',
      caption: 'El comentario se queda junto a la foto, y la chincheta señala el punto exacto.',
    },
  },
  'sharing/downloads': {
    en: {
      alt: 'The Share tab with the download switch enabled and the gallery download entry',
      caption: 'Downloads are a switch: when it is off, the client has no download button at all.',
    },
    es: {
      alt: 'La pestaña Compartir con el interruptor de descarga activo y la entrada de descarga de la galería',
      caption: 'Las descargas son un interruptor: si está apagado, el cliente no tiene botón de descarga.',
    },
  },
};

/** Every article source, both locales. */
function articles(dir, isSpanish = false) {
  const found = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      found.push(...articles(full, isSpanish || entry.name === 'es'));
      continue;
    }

    if (/\.mdx?$/.test(entry.name)) {
      found.push({ file: full, isSpanish });
    }
  }

  return found;
}

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\/*]/g, '\\$&');
const blockPattern = new RegExp(`${escape(START)}[\\s\\S]*?${escape(END)}`);

let updated = 0;
let skipped = 0;

for (const { file, isSpanish } of articles('src/content/docs')) {
  const raw = readFileSync(file, 'utf8');
  const slug = file
    .replace(/^src\/content\/docs\//, '')
    .replace(/^es\//, '')
    .replace(/\.mdx?$/, '')
    // `culling/index.mdx` is the overview article of the section.
    .replace(/\/index$/, '');

  const media = MEDIA[slug]?.[isSpanish ? 'es' : 'en'];
  const asset = `${slug.replace(/\//g, '-')}${isSpanish ? '-es' : ''}.webp`;

  if (!media || !existsSync(join(SCREENS, asset))) {
    skipped += 1;
    continue;
  }

  const parts = [
    `<Screenshot src={screenshot} alt="${media.alt}" caption="${media.caption}" />`,
  ];

  if (media.video) {
    parts.push(
      [
        `<Video`,
        `  slug="${media.video}"`,
        `  alt="${media.videoCaption ?? media.alt}"`,
        `  caption="${media.videoCaption ?? media.caption}"`,
        `/>`,
      ].join('\n'),
    );
  }

  const block = [START, ...parts, END].join('\n');
  const imports = [
    `import screenshot from '@assets/screens/${asset}';`,
    `import Screenshot from '@components/Screenshot.astro';`,
    ...(media.video ? [`import Video from '@components/Video.astro';`] : []),
  ].join('\n');

  let next;

  if (raw.includes(START)) {
    next = raw.replace(blockPattern, block);
  } else {
    const anchor = raw.indexOf('/>', raw.indexOf('<HelpMeta')) + 2;
    next = `${raw.slice(0, anchor)}\n\n${imports}\n\n${block}\n${raw.slice(anchor)}`;
  }

  // Keep the imports current even when the block already existed.
  for (const line of imports.split('\n')) {
    if (!next.includes(line)) {
      next = next.replace(START, `${START}\n${line}`);
    }
  }

  if (next !== raw) {
    writeFileSync(file, next);
    updated += 1;
  }
}

console.log(`Updated ${updated} articles, skipped ${skipped}.`);
