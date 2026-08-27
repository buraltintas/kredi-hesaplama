import React, { useEffect, useMemo, useState } from "react";
import styles from "./RequestPage.module.css";

const API_URL = (process.env.REACT_APP_BANKACI_API_URL || "https://api.bankaci.app").replace(/\/$/, "");
const loanTypes = [
  ["consumer", "İhtiyaç / Taşıt Kredisi"],
  ["housing", "Konut Kredisi"],
  ["commercial", "Ticari Kredi"],
];

const digits = (value) => value.replace(/\D/g, "");
const whatsappUrl = (phone) => `https://wa.me/${digits(phone)}`;

function RequestFooter() {
  return <footer className={styles.footer}>
    <a className={styles.footerBrand} href="https://bankaci.app" aria-label="Bankacı Premium ana sayfa">
      <img src="/icon.png" alt="" />
      <span><strong>Bankacı Premium</strong><small>bankaci.app</small></span>
    </a>
  </footer>;
}

function RequestState({ children }) {
  return <main className={styles.statePage}>
    <div className={styles.stateContent}>{children}</div>
    <RequestFooter />
  </main>;
}

function RequestPage({ requestId }) {
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", loanType: "consumer", amount: "", termMonths: "", notes: "", consent: false });

  useEffect(() => {
    document.title = "Kredi Talep Formu";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex,nofollow,noarchive";
    fetch(`${API_URL}/v1/public/request-links/${encodeURIComponent(requestId)}`, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      })
      .then((payload) => {
        setLink(payload);
        document.title = `${payload.banker.displayName} | Kredi Talep Formu`;
        setForm((current) => ({ ...current, loanType: payload.defaultLoanType || "consumer" }));
      })
      .catch(() => setError("Bu talep bağlantısı şu anda kullanıma kapalı olabilir."))
      .finally(() => setLoading(false));
  }, [requestId]);

  const whatsapp = useMemo(() => link?.banker?.phone ? whatsappUrl(link.banker.phone) : "", [link]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.consent) { setError("Talebinizi iletmek için veri aktarım onayını işaretleyin."); return; }
    setBusy(true);
    try {
      const documentUrls = [];
      for (const file of files) {
        const body = new FormData();
        body.append("document", file);
        const response = await fetch(`${API_URL}/v1/public/request-links/${encodeURIComponent(requestId)}/documents`, { method: "POST", body });
        if (!response.ok) throw new Error("document");
        const payload = await response.json();
        documentUrls.push(payload.objectName);
      }
      const response = await fetch(`${API_URL}/v1/public/request-links/${encodeURIComponent(requestId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, email: form.email.trim() || null, termMonths: Number(form.termMonths), documentUrls }),
      });
      if (!response.ok) throw new Error("submit");
      setSubmitted(true);
    } catch (reason) {
      setError(reason.message === "document" ? "Belge yüklenemedi. PDF, JPG veya PNG biçiminde ve 6 MB'dan küçük dosyalar seçin." : "Talep iletilemedi. Bilgileri ve bağlantınızı kontrol edip tekrar deneyin.");
    } finally { setBusy(false); }
  };

  if (loading) return <RequestState><div className={styles.loadingMark}><span /><span /><span /></div><h1>Talep formu hazırlanıyor</h1><p>Bağlantı ve iletişim bilgileri güvenli şekilde yükleniyor.</p></RequestState>;
  if (error && !link) return <RequestState><div className={styles.errorMark}>!</div><h1>Bağlantı kullanılamıyor</h1><p>{error}</p></RequestState>;
  if (submitted) return <RequestState><div className={styles.success}>✓</div><h1>Talebiniz iletildi</h1><p>{link.banker.displayName}, talebiniz hakkında sizinle iletişime geçebilir.</p>{whatsapp && <a className={styles.whatsapp} href={whatsapp} target="_blank" rel="noreferrer">WhatsApp’tan görüş</a>}</RequestState>;

  return <main className={styles.page}>
    <section className={styles.hero}>
      <h1>{link.label}</h1>
      <div className={styles.banker}>
        {link.banker.avatarUrl ? <img src={link.banker.avatarUrl} alt="" /> : <div className={styles.avatar}>{link.banker.displayName.slice(0, 1).toUpperCase()}</div>}
        <div><strong>{link.banker.displayName}</strong><span>{[link.banker.bankName, link.banker.jobTitle].filter(Boolean).join(" · ") || "Kredi danışmanı"}</span></div>
      </div>
      <div className={styles.contactRow}><a href={`tel:${link.banker.phone}`}>Ara</a>{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}{link.banker.email && <a href={`mailto:${link.banker.email}`}>E-posta</a>}</div>
    </section>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.notice}><strong>Bilgilendirme</strong><p>Bu formdaki iletişim ve talep bilgileriniz yukarıda bilgileri bulunan kişiye iletilir. Talebi alan kişi sizinle talebiniz hakkında iletişime geçebilir ve bağımsız veri sorumlusu olarak hareket eder.</p></div>
      <label>Ad soyad<input required minLength="2" maxLength="120" autoComplete="name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></label>
      <div className={styles.grid}><label>Telefon<input required inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label><label>E-posta <small>(isteğe bağlı)</small><input type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label></div>
      <label>Kredi türü<select value={form.loanType} onChange={(e) => update("loanType", e.target.value)}>{loanTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div className={styles.grid}><label>Talep edilen tutar (TL)<input required min="1" max="1000000000" step="0.01" type="number" inputMode="decimal" value={form.amount} onChange={(e) => update("amount", e.target.value)} /></label><label>Vade (ay)<input required min="1" max="360" type="number" inputMode="numeric" value={form.termMonths} onChange={(e) => update("termMonths", e.target.value)} /></label></div>
      <label>Not <small>(isteğe bağlı)</small><textarea maxLength="2000" rows="4" value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
      <label>Belgeler <small>(isteğe bağlı, en fazla 5 dosya)</small><input type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} /><span className={styles.hint}>PDF, JPG veya PNG · Dosya başına en fazla 6 MB</span></label>
      <label className={styles.consent}><input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} /><span>Girdiğim bilgilerin ve eklediğim belgelerin talep değerlendirmesi ve benimle iletişim kurulması amacıyla form sahibine iletilmesini kabul ediyorum.</span></label>
      {error && <div className={styles.error}>{error}</div>}
      <button disabled={busy} type="submit">{busy ? "Talebiniz iletiliyor…" : "Talebi ilet"}</button>
      <p className={styles.privacy}>İletişim verileri anonim istatistiklere dahil edilmez. Kredi türü, tutar ve vade gibi kişisel kimlik içermeyen özetler hizmet istatistiklerinde kullanılabilir. <a href="/privacy" target="_blank">Gizlilik politikasını inceleyin.</a></p>
    </form>
    <RequestFooter />
  </main>;
}

export default RequestPage;
