import React, { useEffect } from "react";
import styles from "./AdminPage.module.css";

function AdminPage() {
  useEffect(() => {
    document.title = "Yönetim — Bankacı";
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "noindex, nofollow");
  }, []);

  const sections = [
    "Genel Bakış",
    "Kullanıcılar",
    "Premium",
    "Feed",
    "Analitik",
    "Kampanyalar",
  ];

  return (
    <div className={styles.adminShell}>
      <aside>
        <a className={styles.brand} href="/">
          <img src="/icon.png" alt="" />
          <span>Bankacı</span>
        </a>
        <nav aria-label="Yönetim bölümleri">
          {sections.map((item, index) => (
            <span className={index === 0 ? styles.active : ""} key={item}>
              {item}
            </span>
          ))}
        </nav>
        <small>Yönetim v0.1</small>
      </aside>

      <main>
        <header>
          <div>
            <span>Yönetim</span>
            <h1>Genel Bakış</h1>
          </div>
          <a href="/">Siteye dön</a>
        </header>

        <section className={styles.emptyPanel}>
          <div className={styles.emptyIcon}>B</div>
          <h2>Yönetim alanı hazırlanıyor</h2>
          <p>
            Kullanıcılar, Premium durumları, feed yönetimi ve anonim raporlar
            ileride burada tablolar halinde yer alacak.
          </p>
          <span>Henüz veri bağlantısı yok</span>
        </section>
      </main>
    </div>
  );
}

export default AdminPage;
