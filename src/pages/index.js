import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

export default function Home() {
  return (
    <Layout
      title="Picstome"
      description="Free Open Source Tools for Photographers"
    >
      <header className={clsx("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">Picstome</h1>
          <p className="hero__subtitle">
            Free Open Source Tools for Photographers
          </p>
          <div className={styles.buttons}>
            <a
              className="button button--primary button--lg"
              href="/docs/install"
            >
              🚀 Install (Coming Soon)
            </a>
            <a
              className="button button--secondary button--lg"
              href="https://github.com/picstome/picstome"
            >
              ⭐ View on GitHub
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.featuresSection}>
          <div className="container">
            <h2 className={styles.featuresTitle}>Features</h2>
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
    title: "📸 Gallery Management",
    description:
      "Create galleries, upload images in original or resized versions, and share them securely with your clients.",
  },
  {
    title: "📝 Contract Management",
    description:
      "Generate contracts, handle online signatures, and manage the complete contract lifecycle with ease.",
  },
  {
    title: "👥 Client Relationship",
    description:
      "Coming Soon! - Comprehensive CRM with client profiles, activity tracking, and third-party integrations.",
  },
  {
    title: "🚀 Easy Deployment",
    description:
      "Self-hosted solution with minimal requirements (2 cores, 512MB RAM, 10GB SSD).",
  },
  {
    title: "🔒 Secure & Private",
    description:
      "You control your data with flexible storage options including local storage and S3 integration.",
  },
  {
    title: "🌍 Multilingual",
    description:
      "Support multiple languages and translate your interface to reach a global audience.",
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
