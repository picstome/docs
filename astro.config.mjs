// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { helpExport } from './src/integrations/help-export.mjs';
import { baseLinks } from './src/integrations/base-links.mjs';

// Production canonical URL. The GitHub Pages preview overrides both values with
// DOCS_SITE / DOCS_BASE so canonical links, hreflang and internal links point at
// the preview instead of the (not yet live) production domain.
const site = process.env.DOCS_SITE ?? 'https://docs.picstome.com';
const base = process.env.DOCS_BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // The old paths were live for a few hours; keep them working.
  redirects: {
    '/camera/direct-upload': '/galleries/direct-upload',
    '/es/camera/direct-upload': '/es/galleries/direct-upload',
    '/camera/desktop-apps': '/apps/rater',
    '/es/camera/desktop-apps': '/es/apps/rater',
    '/brand/tools': '/apps/calculator',
    '/es/brand/tools': '/es/apps/calculator',
    '/apps/tools': '/apps/calculator',
    '/es/apps/tools': '/es/apps/calculator',
    '/brand/public-pages': '/brand/public-profile',
    '/es/brand/public-pages': '/es/brand/public-profile',
    '/apps/rater-and-photo-stats': '/apps/rater',
    '/es/apps/rater-and-photo-stats': '/es/apps/rater',
  },
  integrations: [
    starlight({
      title: 'Picstome',
      description:
        'Guides for photographers using Picstome: galleries, sharing, client selection, contracts, invoices, payments and branding.',
      logo: {
        light: './src/assets/logo-light.png',
        dark: './src/assets/logo-white.png',
        alt: 'Picstome',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      components: {
        Header: './src/components/starlight/Header.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
      },
      customCss: [
        './src/styles/tailwind.css',
        './src/styles/picstome.css',
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en-US',
        },
        es: {
          label: 'Español',
          lang: 'es-ES',
        },
      },
      lastUpdated: true,
      pagination: true,
      head: [
        {
          tag: 'script',
          content: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MVGGDKVQ');`,
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#316d61' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.bunny.net' },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap',
          },
        },
      ],
      sidebar: [
        {
          label: 'Getting started',
          translations: { 'es-ES': 'Primeros pasos' },
          items: [
            { label: 'What Picstome does', translations: { 'es-ES': 'Qué hace Picstome' }, slug: 'start/what-picstome-does' },
            { label: 'Your first gallery', translations: { 'es-ES': 'Tu primera galería' }, slug: 'start/first-gallery' },
            { label: 'Plans and storage', translations: { 'es-ES': 'Planes y almacenamiento' }, slug: 'start/plans-and-storage' },
          ],
        },
        {
          label: 'Galleries',
          translations: { 'es-ES': 'Galerías' },
          items: [
            { label: 'Uploading photos', translations: { 'es-ES': 'Subir fotos' }, slug: 'galleries/uploading' },
            { label: 'Original size or optimized', translations: { 'es-ES': 'Tamaño original u optimizado' }, slug: 'galleries/original-size' },
            { label: 'File versions', translations: { 'es-ES': 'Versiones de archivo' }, slug: 'galleries/file-versions' },
            { label: 'Shoot straight to a gallery', translations: { 'es-ES': 'Disparar directo a una galería' }, slug: 'galleries/direct-upload' },
          ],
        },
        {
          label: 'Culling',
          translations: { 'es-ES': 'Selección (culling)' },
          items: [
            { label: 'How a culling pass works', translations: { 'es-ES': 'Cómo funciona la selección' }, slug: 'culling' },
            { label: 'Rate and heart', translations: { 'es-ES': 'Valorar y marcar' }, slug: 'culling/rating' },
            { label: 'Archive a photo', translations: { 'es-ES': 'Archivar una foto' }, slug: 'culling/archiving' },
          ],
        },
        {
          label: 'Sharing with clients',
          translations: { 'es-ES': 'Compartir con clientes' },
          items: [
            { label: 'Overview', translations: { 'es-ES': 'Resumen' }, slug: 'sharing' },
            { label: 'The client link', translations: { 'es-ES': 'El enlace para tu cliente' }, slug: 'sharing/client-link' },
            { label: 'Favorites and the selection limit', translations: { 'es-ES': 'Favoritos y el límite de selección' }, slug: 'sharing/selection' },
            { label: 'Comments and annotations', translations: { 'es-ES': 'Comentarios y anotaciones' }, slug: 'sharing/comments' },
            { label: 'Downloads', translations: { 'es-ES': 'Descargas' }, slug: 'sharing/downloads' },
          ],
        },
        {
          label: 'Clients and contracts',
          translations: { 'es-ES': 'Clientes y contratos' },
          items: [
            { label: 'Client records', translations: { 'es-ES': 'Fichas de clientes' }, slug: 'business/clients' },
            { label: 'Templates and signatures', translations: { 'es-ES': 'Plantillas y firmas' }, slug: 'business/contracts' },
          ],
        },
        {
          label: 'Invoices and payments',
          translations: { 'es-ES': 'Facturas y pagos' },
          items: [
            { label: 'Invoices in a nutshell', translations: { 'es-ES': 'Facturas en resumen' }, slug: 'money/invoices' },
            { label: 'VAT, exemptions and corrective invoices', translations: { 'es-ES': 'IVA, exenciones y rectificativas' }, slug: 'money/vat' },
            { label: 'Getting paid with Stripe', translations: { 'es-ES': 'Cobrar con Stripe' }, slug: 'money/stripe' },
          ],
        },
        {
          label: 'Your brand',
          translations: { 'es-ES': 'Tu marca' },
          items: [
            { label: 'Public profile', translations: { 'es-ES': 'Perfil público' }, slug: 'brand/public-profile' },
            { label: 'Portfolio', translations: { 'es-ES': 'Porfolio' }, slug: 'brand/portfolio' },
            { label: 'Watermark', translations: { 'es-ES': 'Marca de agua' }, slug: 'brand/watermark' },
          ],
        },
        {
          label: 'Tools and apps',
          translations: { 'es-ES': 'Herramientas y apps' },
          items: [
            { label: 'Session price calculator', translations: { 'es-ES': 'Calculadora de precios' }, slug: 'apps/calculator' },
            { label: 'Black screen', translations: { 'es-ES': 'Pantalla negra' }, slug: 'apps/black-screen' },
            { label: 'Rater', translations: { 'es-ES': 'Rater' }, slug: 'apps/rater' },
            { label: 'Photo Stats', translations: { 'es-ES': 'Photo Stats' }, slug: 'apps/photo-stats' },
          ],
        },
        {
          label: 'Self-hosting',
          translations: { 'es-ES': 'Instalación propia' },
          items: [
            { label: 'Run Picstome on your own server', translations: { 'es-ES': 'Instala Picstome en tu servidor' }, slug: 'self-hosting' },
          ],
        },
        {
          label: 'Help and status',
          translations: { 'es-ES': 'Ayuda y estado' },
          items: [
            { label: 'Is Picstome up?', translations: { 'es-ES': '¿Picstome está funcionando?' }, slug: 'status' },
            { label: 'Contact and bug reports', translations: { 'es-ES': 'Contacto e incidencias' }, slug: 'support' },
          ],
        },
      ],
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', es: 'es-ES' },
      },
    }),
    helpExport(),
    baseLinks({ base }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
