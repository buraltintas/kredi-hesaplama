import React, { useEffect } from "react";
import styles from "./LandingPage.module.css";

const APP_STORE_URL =
  "https://apps.apple.com/tr/app/bankac%C4%B1-kredi-hesaplama/id6742378996?l=tr";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.xewor.bankacikredihesaplama";

const currentFeatures = [
  {
    number: "01",
    title: "Kredi hesaplama",
    text: "Farklı ödeme planları, detaylı taksit dökümleri ve müşteriye hazır PDF çıktıları.",
  },
  {
    number: "02",
    title: "Mevduat getirisi",
    text: "Brüt ve net getiriyi, stopaj etkisini ve vade sonu tutarını hızlıca karşılaştırın.",
  },
  {
    number: "03",
    title: "Konut kredisi devri",
    text: "Mevcut krediyle yeni finansman senaryosunu tek akışta değerlendirin.",
  },
  {
    number: "04",
    title: "Paylaşılabilir sonuçlar",
    text: "Hesaplamayı anlaşılır bir özet veya PDF olarak müşterinizle paylaşın.",
  },
  {
    number: "05",
    title: "7 farklı ödeme planı",
    text: "Sabit taksitli, peşin faizli, eşit anaparalı, özel veya balon ödemeli, anapara ödemesiz, artan ve azalan taksitli planlar.",
  },
  {
    number: "06",
    title: "Akıllı plan önerileri",
    text: "Alternatif ödeme planlarını taksit yapısı, toplam ödeme ve faiz farklarıyla karşılaştırarak uygun seçenekleri öne çıkarır.",
  },
];

const roadmap = [
  "Ticari bankacılık araçları: spot ve rotatif kredi, dönemsel ödeme ve iskonto hesaplamaları",
  "Bankaların kredi ve mevduat kampanyaları",
  "Kişiye özel yapay zekâ destekli ödeme planı",
  "Bankacılar için profesyonel paylaşım akışı",
  "Ana ekrandan hızlı hesaplama widget'ları",
  "Paylaşılabilir kredi talep formları",
  "Hesap ve Premium erişimini cihazlar arasında kullanma",
];

const marqueeItems = [
  "Hızlı kredi hesaplama",
  "Standart sabit taksitli plan",
  "Peşin faiz ödemeli plan",
  "Eşit anapara ödemeli plan",
  "Özel ve balon ödeme planı",
  "Anapara ödemesiz dönemli plan",
  "Artan taksitli plan",
  "Azalan taksitli plan",
  "Akıllı ödeme planı önerileri",
  "Detaylı taksit tablosu",
  "Konut kredisi devir hesaplama",
  "Mevduat getirisi hesaplama",
  "PDF ödeme planı",
  "Kolay sonuç paylaşımı",
  "Premium reklamsız deneyim",
  "iOS ve Android",
];

function StoreButtons() {
  return (
    <div className={styles.storeButtons}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Bankacı'yı App Store'dan indirin"
      >
        <span className={styles.storeIcon}></span>
        <span><small>App Store’dan</small><strong>İndirin</strong></span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Bankacı'yı Google Play'den indirin"
      >
        <span className={styles.playIcon} aria-hidden="true" />
        <span><small>Google Play’den</small><strong>İndirin</strong></span>
      </a>
    </div>
  );
}

function LandingPage() {
  useEffect(() => {
    document.title = "Bankacı — Bankacılar için kredi ve mevduat araçları";
  }, []);

  return (
    <div className={styles.siteShell}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Bankacı ana sayfa">
          <img src="/icon.png" alt="" />
          <span>Bankacı</span>
        </a>
        <nav aria-label="Ana menü">
          <a href="#ozellikler">Özellikler</a>
          <a href="#gelecek">Yakında</a>
          <a href="https://burak-altintas.com" target="_blank" rel="noreferrer">İletişim</a>
        </nav>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <h1>Hesaplamadan<br />daha fazlası.</h1>
            <p>
              Kredi, mevduat ve konut kredisi devir hesaplamalarını hızlandıran;
              müşterinizle paylaşabileceğiniz net sonuçlar üreten profesyonel çalışma alanı.
            </p>
            <div id="indir" className={styles.heroActions}>
              <StoreButtons />
              <a className={styles.textLink} href="#ozellikler">
                Neler yapar? <span>↓</span>
              </a>
            </div>
          </div>

          <div className={styles.productStage} aria-label="Bankacı uygulaması özellik önizlemesi">
            <div className={styles.orbitOne} aria-hidden="true" />
            <div className={styles.orbitTwo} aria-hidden="true" />
            <div className={styles.screenshotPair}>
              <figure className={styles.screenPrimary}>
                <img
                  src="/screenshots/kredi-hesaplama.png"
                  alt="Bankacı uygulamasında kredi hesaplama ekranı"
                />
              </figure>
              <figure className={styles.screenResult}>
                <img
                  src="/screenshots/kredi-sonucu.png"
                  alt="Bankacı uygulamasında kredi sonucu, alternatif ödeme planları, paylaşım ve PDF seçenekleri"
                />
              </figure>
              <figure className={styles.screenSecondary}>
                <img
                  src="/screenshots/odeme-planlari.png"
                  alt="Bankacı uygulamasındaki yedi farklı kredi ödeme planı seçeneği"
                />
              </figure>
            </div>
          </div>
        </section>

        <section className={styles.marquee} aria-label="Bankacı özellikleri ve ödeme planları">
          <div className={styles.marqueeTrack}>
            <div className={styles.marqueeGroup}>
              {marqueeItems.map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className={styles.marqueeGroup} aria-hidden="true">
              {marqueeItems.map((item) => <span key={`repeat-${item}`}>{item}</span>)}
            </div>
          </div>
        </section>

        <section className={styles.features} id="ozellikler">
          <div className={styles.sectionIntro}>
            <h2>Görüşme sırasında ihtiyacınız olan araçlar.</h2>
            <p>Sade girişler, hızlı sonuçlar ve müşteriye anlatması kolay çıktılar.</p>
          </div>
          <div className={styles.featureGrid}>
            {currentFeatures.map((feature) => (
              <article key={feature.number}>
                <span>{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.roadmapSection} id="gelecek">
          <div className={styles.roadmapCopy}>
            <h2>Bankacının dijital çalışma alanına dönüşüyor.</h2>
            <p>
              Bankacı; bireysel ve ticari bankacılıkta fırsatları takip ettiğiniz,
              müşteriye özel senaryolar hazırladığınız ve meslektaşlarınızla bağlantı
              kurduğunuz kapsamlı bir çalışma platformuna evriliyor.
            </p>
            <span className={styles.mobileRoadmapBadge}>Yakında</span>
          </div>
          <div className={styles.roadmapList}>
            {roadmap.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
                <i>Yakında</i>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.premiumSection}>
          <div>
            <span className={styles.premiumBadge}>PREMIUM BANKACI</span>
            <h2>Kesintisiz çalışın.<br />Daha fazlasını yapın.</h2>
          </div>
          <p>
            Reklamsız deneyim, gelişmiş hesaplamalar ve yakında gelecek profesyonel
            özellikler Premium Bankacı ile tek yerde.
          </p>
        </section>

        <section className={styles.finalCta}>
          <img src="/icon.png" alt="Bankacı uygulama ikonu" />
          <h2>Bir sonraki müşteri görüşmesine hazır olun.</h2>
          <p>Bankacı’yı ücretsiz indirin. Hesaplamaya saniyeler içinde başlayın.</p>
          <StoreButtons />
        </section>
      </main>

      <footer id="iletisim" className={styles.footer}>
        <div className={styles.brand}>
          <img src="/icon.png" alt="" />
          <span>Bankacı</span>
        </div>
        <p>Bankacılar için pratik finansal araçlar.</p>
        <div>
          <a href="https://burak-altintas.com" target="_blank" rel="noreferrer">İletişim</a>
          <a href="/privacy/">Gizlilik</a>
        </div>
        <small>© {new Date().getFullYear()} Bankacı. Tüm hakları saklıdır.</small>
      </footer>
    </div>
  );
}

export default LandingPage;
