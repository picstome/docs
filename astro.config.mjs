// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { helpExport } from './src/integrations/help-export.mjs';

const site = 'https://docs.picstome.com';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Picstome',
      description:
        'Guides for photographers using Picstome: galleries, sharing, client selection, contracts, invoices, payments and branding.',
      logo: {
        light: './src/assets/logo-light.png',
        dark: './src/assets/logo-dark.png',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      customCss: [
        './src/styles/tailwind.css',
        './src/styles/picstome.css',
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/picstome/picstome' },
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
      editLink: {
        baseUrl: 'https://github.com/picstome/docs/edit/main/',
      },
      lastUpdated: true,
      pagination: true,
      head: [
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
          ],
        },
        {
          label: 'Culling',
          translations: { 'es-ES': 'Criba' },
          items: [
            { label: 'How a culling pass works', translations: { 'es-ES': 'Cómo funciona la criba' }, slug: 'culling' },
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
          label: 'Camera and desktop apps',
          translations: { 'es-ES': 'Cámara y apps de escritorio' },
          items: [
            { label: 'Shoot straight to a gallery', translations: { 'es-ES': 'Dispara directo a una galería' }, slug: 'camera/direct-upload' },
            { label: 'Picstome Sync, Rater and Photo Stats', translations: { 'es-ES': 'Picstome Sync, Rater y Photo Stats' }, slug: 'camera/desktop-apps' },
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
            { label: 'Public profile and portfolio', translations: { 'es-ES': 'Perfil público y porfolio' }, slug: 'brand/public-pages' },
            { label: 'Watermark', translations: { 'es-ES': 'Marca de agua' }, slug: 'brand/watermark' },
            { label: 'Tools', translations: { 'es-ES': 'Herramientas' }, slug: 'brand/tools' },
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
          label: 'Service status',
          translations: { 'es-ES': 'Estado del servicio' },
          items: [{ label: 'Is Picstome up?', translations: { 'es-ES': '¿Picstome está funcionando?' }, slug: 'status' }],
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
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
