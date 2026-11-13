/**
 * Insert (or refresh) the screenshots and videos of every documented article.
 *
 * The captures are generated from the application with `demo/capture.mjs`, then
 * copied here. This script only wires them into the MDX sources:
 *
 * - English article -> `src/assets/screens/{slug}.webp`
 * - Spanish article -> `src/assets/screens/{slug}-es.webp`
 * - Optional detail -> `{slug}.detail.webp`, cropped around one control
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
 * One entry per article, per locale.
 *
 * `alt` says what the screen shows (never "screenshot of"). `caption` says what
 * to look at. `detail` adds a second, tighter image of the control the article
 * is about, with its own accessible description.
 */
const MEDIA = {
  'start/what-picstome-does': {
    en: {
      alt: 'The Picstome dashboard with the setup checklist, the account summary and the storage bar',
      caption: 'The dashboard is the only entry point you need: checklist, counts and storage.',
    },
    es: {
      alt: 'El panel de Picstome con la lista de configuración, el resumen de la cuenta y la barra de almacenamiento',
      caption: 'El panel es el único punto de entrada que necesitas: lista de tareas, recuentos y almacenamiento.',
    },
  },
  'start/first-gallery': {
    en: {
      alt: 'The Galleries screen with the create gallery and connect camera buttons above the gallery grid',
      caption: 'Every delivery starts here. Create the gallery, then upload or connect the camera.',
    },
    es: {
      alt: 'La pantalla de Galerías con los botones de crear galería y conectar cámara encima de la cuadrícula',
      caption: 'Cada entrega empieza aquí. Crea la galería y luego sube o conecta la cámara.',
    },
  },
  'start/plans-and-storage': {
    en: {
      alt: 'The dashboard account summary with the storage used and the gallery count',
      caption: 'Storage and the monthly counters live in the dashboard, and the sidebar always shows the bar.',
    },
    es: {
      alt: 'El resumen de la cuenta del panel con el almacenamiento usado y el número de galerías',
      caption: 'El almacenamiento y los contadores mensuales están en el panel, y la barra siempre se ve en la barra lateral.',
    },
  },
  'galleries/uploading': {
    en: {
      alt: 'The Galleries screen with the create gallery dialog and the upload buttons',
      caption: 'Upload from the gallery itself or from the camera. Both end up in the same place.',
    },
    es: {
      alt: 'La pantalla de Galerías con el diálogo de crear galería y los botones de subida',
      caption: 'Sube desde la galería o desde la cámara. Las dos vías acaban en el mismo sitio.',
    },
  },
  'galleries/original-size': {
    en: {
      alt: 'A gallery header showing the photo count, the rated count and the total storage',
      caption: 'The header states what the gallery occupies and when it expires.',
    },
    es: {
      alt: 'La cabecera de una galería con el número de fotos, las valoradas y el almacenamiento total',
      caption: 'La cabecera indica cuánto ocupa la galería y cuándo caduca.',
    },
  },
  'galleries/file-versions': {
    en: {
      alt: 'The version comparison dialog with the current file on the left and the previous version on the right',
      caption: 'Old and new side by side, with a zoom that moves both panes together.',
    },
    es: {
      alt: 'El diálogo de comparar versiones con el archivo actual a la izquierda y la versión anterior a la derecha',
      caption: 'Antigua y nueva lado a lado, con un zoom que mueve los dos paneles a la vez.',
    },
  },
  culling: {
    en: {
      alt: 'A gallery in the panel with six wedding photos, star ratings on each thumbnail and the Photos, Favorites and Comments tabs',
      caption: 'The gallery grid is where a culling pass starts: every photo can be opened, rated and filtered from here.',
    },
    es: {
      alt: 'Una galería del panel con seis fotos de boda, las estrellas en cada miniatura y las pestañas Fotos, Favoritos y Comentarios',
      caption: 'La cuadrícula de la galería es donde empieza la selección: desde aquí se abre, valora y filtra cada foto.',
    },
  },
  'culling/rating': {
    en: {
      alt: 'Gallery grid with photos rated from one to five stars and the rating filter in the toolbar',
      caption: 'Stars live on the thumbnail; the filter shows only the rating you pick.',
      detailAlt: 'The rating filter and the sort control in the gallery toolbar',
      detailCaption: 'The star filter is exact: three stars shows only three-star photos.',
    },
    es: {
      alt: 'Cuadrícula de galería con fotos valoradas de una a cinco estrellas y el filtro por valoración en la barra',
      caption: 'Las estrellas van en la miniatura; el filtro deja solo la valoración que elijas.',
      detailAlt: 'El filtro por valoración y el control de orden en la barra de la galería',
      detailCaption: 'El filtro de estrellas es exacto: tres estrellas muestra solo fotos de tres estrellas.',
    },
  },
  'culling/archiving': {
    en: {
      alt: 'The gallery tabs with the Archived tab available next to Photos',
      caption: 'Archived photos leave the client view and keep their files; the tab is the way back.',
    },
    es: {
      alt: 'Las pestañas de la galería con la pestaña Archivadas junto a Fotos',
      caption: 'Las fotos archivadas salen de la vista del cliente y conservan sus archivos; la pestaña es el camino de vuelta.',
    },
  },
  sharing: {
    en: {
      alt: 'The Share gallery dialog with the watermark, download, selection, password, description and comments switches',
      caption: 'Each switch in the Share dialog controls one thing the client can do.',
    },
    es: {
      alt: 'El diálogo Compartir galería con los interruptores de marca de agua, descarga, selección, contraseña, descripción y comentarios',
      caption: 'Cada interruptor del diálogo Compartir controla una cosa que puede hacer el cliente.',
    },
  },
  'sharing/client-link': {
    en: {
      alt: 'A shared gallery opened as a client sees it, with the studio name, the gallery title and the photos',
      caption: 'No account, no app: the link opens a page with your branding and the photos.',
    },
    es: {
      alt: 'Una galería compartida abierta como la ve el cliente, con el nombre del estudio, el título y las fotos',
      caption: 'Sin cuenta y sin app: el enlace abre una página con tu marca y las fotos.',
    },
  },
  'sharing/selection': {
    en: {
      alt: 'The Favorites tab showing 4 of 40 selected photos and the Export favorites button',
      caption: 'The Favorites tab is where the client selection becomes a list of file names.',
    },
    es: {
      alt: 'La pestaña Favoritos mostrando 4 de 40 fotos seleccionadas y el botón de Exportar favoritos',
      caption: 'La pestaña Favoritos es donde la selección del cliente se convierte en una lista de archivos.',
    },
  },
  'sharing/comments': {
    en: {
      alt: 'The Comments tab of a gallery with a client comment and the pin counter on the photo',
      caption: 'A comment stays next to the photo, and the pin points at the exact spot.',
    },
    es: {
      alt: 'La pestaña Comentarios de una galería con un comentario del cliente y el contador de chinchetas en la foto',
      caption: 'El comentario se queda junto a la foto, y la chincheta señala el punto exacto.',
    },
  },
  'sharing/downloads': {
    en: {
      alt: 'The Share dialog with the download switch enabled',
      caption: 'Downloads are a switch: when it is off, the client has no download button at all.',
    },
    es: {
      alt: 'El diálogo Compartir con el interruptor de descarga activo',
      caption: 'Las descargas son un interruptor: si está apagado, el cliente no tiene botón de descarga.',
    },
  },
  'galleries/direct-upload': {
    en: {
      alt: 'The Connect camera dialog with the FTP and SFTP host, user and password',
      caption: 'Copy these values into the camera once; the gallery fills up as you shoot.',
    },
    es: {
      alt: 'El diálogo de conectar cámara con el host, el usuario y la contraseña de FTP y SFTP',
      caption: 'Copia estos datos en la cámara una vez; la galería se llena mientras disparas.',
    },
  },
  'apps/rater-and-photo-stats': {
    en: {
      alt: 'The export favorites dialog with the App tab selected and the Rate my images button',
      caption: 'Picstome hands the favorites to the Rater from here: one button, no login.',
    },
    es: {
      alt: 'El diálogo de exportar favoritos con la pestaña App seleccionada y el botón Calificar mis imágenes',
      caption: 'Picstome le pasa las favoritas al Rater desde aquí: un botón y sin iniciar sesión.',
    },
  },
  'business/clients': {
    en: {
      alt: 'The Customers list with three client records',
      caption: 'A customer groups galleries, contracts and invoices, and holds the fiscal data.',
    },
    es: {
      alt: 'La lista de Clientes con tres fichas',
      caption: 'Un cliente agrupa galerías, contratos y facturas, y guarda los datos fiscales.',
    },
  },
  'business/contracts': {
    en: {
      alt: 'The Contracts list with the contract state next to the templates entry',
      caption: 'A sent contract keeps its own copy of the template text.',
    },
    es: {
      alt: 'La lista de Contratos con el estado del contrato junto a la entrada de plantillas',
      caption: 'Un contrato enviado guarda su propia copia del texto de la plantilla.',
    },
  },
  'money/invoices': {
    en: {
      alt: 'The Invoices list with the numbering, status and totals per invoice',
      caption: 'Drafts take no number; issuing assigns one and produces the PDF.',
    },
    es: {
      alt: 'La lista de Facturas con la numeración, el estado y los totales',
      caption: 'Los borradores no consumen número; al emitir se asigna uno y se genera el PDF.',
    },
  },
  'money/vat': {
    en: {
      alt: 'Invoice settings with the fiscal data, the VAT rate and the rectification series',
      caption: 'The VAT rate and the rectification series are configured once, per studio.',
    },
    es: {
      alt: 'Ajustes de facturación con los datos fiscales, el tipo de IVA y la serie de rectificativas',
      caption: 'El tipo de IVA y la serie de rectificativas se configuran una vez, por estudio.',
    },
  },
  'money/stripe': {
    en: {
      alt: 'The Payments screen with the Stripe Connect state',
      caption: 'Stripe Connect shows what is missing before you can take card payments.',
    },
    es: {
      alt: 'La pantalla de Pagos con el estado de Stripe Connect',
      caption: 'Stripe Connect indica qué falta antes de poder aceptar pagos con tarjeta.',
    },
  },
  'brand/public-pages': {
    en: {
      alt: 'The Portfolio screen with the galleries published on the public page',
      caption: 'The portfolio is curated: only the galleries you add appear publicly.',
    },
    es: {
      alt: 'La pantalla de Portfolio con las galerías publicadas en la página pública',
      caption: 'El portfolio es curado: solo aparecen públicamente las galerías que añades.',
    },
  },
  'brand/watermark': {
    en: {
      alt: 'Watermark settings with the type, position, size and opacity',
      caption: 'The watermark is burned into the delivered copy, never into your originals.',
    },
    es: {
      alt: 'Ajustes de marca de agua con el tipo, la posición, el tamaño y la opacidad',
      caption: 'La marca de agua se graba en la copia entregada, nunca en tus originales.',
    },
  },
  'apps/tools': {
    en: {
      alt: 'The session price calculator with fixed costs, session costs and the resulting hourly rate',
      caption: 'The calculator shows the effective hourly rate behind every price.',
    },
    es: {
      alt: 'La calculadora de precios de sesión con costes fijos, costes por sesión y la tarifa horaria resultante',
      caption: 'La calculadora enseña la tarifa horaria real detrás de cada precio.',
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
    .replace(/\/index$/, '');

  const media = MEDIA[slug]?.[isSpanish ? 'es' : 'en'];
  const asset = `${slug.replace(/\//g, '-')}${isSpanish ? '-es' : ''}.webp`;
  const detailAsset = `${slug.replace(/\//g, '-')}${isSpanish ? '-es' : ''}.detail.webp`;

  if (!media || !existsSync(join(SCREENS, asset))) {
    skipped += 1;
    continue;
  }

  const parts = [
    `<Screenshot src={screenshot} alt="${media.alt}" caption="${media.caption}" />`,
  ];

  if (media.detailAlt && existsSync(join(SCREENS, detailAsset))) {
    parts.push(
      `<Screenshot src={detail} alt="${media.detailAlt}" caption="${media.detailCaption}" />`,
    );
  }

  const block = [START, ...parts, END].join('\n');
  const imports = [
    `import screenshot from '@assets/screens/${asset}';`,
    ...(media.detailAlt && existsSync(join(SCREENS, detailAsset))
      ? [`import detail from '@assets/screens/${detailAsset}';`]
      : []),
    `import Screenshot from '@components/Screenshot.astro';`,
  ].join('\n');

  // The imports this script owns are exactly the ones it may add: the screens
  // and, when the article has a clip, the Video component. `Screenshot` is owned
  // too, because every article with media uses it. Strip them all first, then
  // add back the current set, so re-running never duplicates a line.
  const managed =
    /^import (?:screenshot|detail) from '@assets\/screens\/[^']+';\n|^import Screenshot from '@components\/Screenshot\.astro';\n|^import Video from '@components\/Video\.astro';\n/gm;

  let next = raw.replace(managed, '');

  if (next.includes(START)) {
    next = next.replace(blockPattern, `${imports}\n\n${block}`);
  } else {
    const anchor = next.indexOf('/>', next.indexOf('<HelpMeta')) + 2;
    next = `${next.slice(0, anchor)}\n\n${imports}\n\n${block}\n${next.slice(anchor)}`;
  }

  // Tidy any double blank lines left behind by the rewrite.
  next = next.replace(/\n{3,}/g, '\n\n');

  if (next !== raw) {
    writeFileSync(file, next);
    updated += 1;
  }
}

console.log(`Updated ${updated} articles, skipped ${skipped}.`);
