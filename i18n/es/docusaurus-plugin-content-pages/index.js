import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import styles from "@site/src/pages/index.module.css";

export default function Home() {
  return (
    <Layout
      title="Picstome"
      description="Crea galerías y contratos para tus clientes GRATIS"
    >
      <header className={clsx("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">Picstome</h1>
          <p className="hero__subtitle">
            Crea galerías y contratos para tus clientes GRATIS
          </p>
          <div className={styles.buttons}>
            <a
              className="button button--primary button--lg"
              href="/docs/install"
            >
              🚀 Instalación (Próximamente)
            </a>
            <a
              className="button button--secondary button--lg"
              href="https://github.com/picstome/picstome"
            >
              ⭐ Ver en GitHub
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.featuresSection}>
          <div className="container">
            <h2 className={styles.featuresTitle}>Características</h2>
            <div className="row">
              {features.map((feature, idx) => (
                <Feature key={idx} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

const features = [
  {
    title: "📸 Gestión de Galerías",
    description:
      "Crea galerías, sube imágenes en versiones originales o redimensionadas, y compártelas de forma segura con tus clientes.",
  },
  {
    title: "📝 Gestión de Contratos",
    description:
      "Genera contratos, maneja firmas en línea y administra todo el ciclo de vida del contrato con facilidad.",
  },
  {
    title: "👥 Relación con Clientes",
    description:
      "¡Próximamente! - CRM completo con perfiles de clientes, seguimiento de actividades e integraciones con terceros.",
  },
  {
    title: "🚀 Fácil Implementación",
    description:
      "Solución autohospedada con requisitos mínimos (2 núcleos, 512MB RAM, 10GB SSD).",
  },
  {
    title: "🔒 Seguro y Privado",
    description:
      "Tú controlas tus datos con opciones flexibles de almacenamiento incluyendo almacenamiento local e integración con S3.",
  },
  {
    title: "🌍 Multilingüe",
    description:
      "Soporte para múltiples idiomas y traduce tu interfaz para llegar a una audiencia global.",
  },
];

function Feature({ title, description }) {
  return (
    <div className="col col--4">
      <div className={styles.featureCard}>
        <div className={styles.featureHeader}>
          <h3>{title}</h3>
        </div>
        <div className={styles.featureBody}>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}
