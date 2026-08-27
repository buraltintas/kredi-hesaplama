import React, { useEffect, useState } from "react";
import styles from "./AdminPage.module.css";

const API_URL = (process.env.REACT_APP_BANKACI_API_URL || "https://api.bankaci.app").replace(/\/$/, "");
async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body && body.error ? body.error : "request_failed");
  return body;
}

const SECTIONS = [
  { key: "overview", label: "Genel Bakış" },
  { key: "users", label: "Kullanıcılar" },
  { key: "notifications", label: "Bildirimler" },
  { key: "analytics", label: "Analitik" },
];

const SECTION_TITLES = {
  overview: "Genel Bakış",
  users: "Kullanıcılar",
  notifications: "Bildirimler",
  analytics: "Analitik",
};

function BroadcastForm({ token }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const send = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSent(false);
    try {
      await api("/v1/admin/notifications", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      setSent(true);
      setTitle("");
      setBody("");
    } catch (e) {
      const map = {
        invalid_title: "Başlık 1–120 karakter olmalı.",
        invalid_body: "Açıklama 1–400 karakter olmalı.",
        notifications_unavailable: "Bildirim servisi şu anda kullanılamıyor.",
        unauthorized: "Oturum süresi doldu, yeniden giriş yapın.",
      };
      setError(map[e.message] || "Duyuru gönderilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.panel}>
      <h2>Push duyurusu gönder</h2>
      <p className={styles.panelHint}>
        Başlık ve açıklamayla bildirim izni veren tüm cihazlara ulaşır.
        Yönlendirme yoktur; dokununca yalnızca uygulama açılır.
      </p>
      <form className={styles.form} onSubmit={send}>
        <label className={styles.field}>
          <span>Başlık</span>
          <input
            maxLength={120}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Uygulamamızın 2. yılı kutlu olsun 🎉"
          />
        </label>
        <label className={styles.field}>
          <span>Açıklama</span>
          <textarea
            maxLength={400}
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Kısa bir mesaj yazın."
          />
        </label>
        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        {sent ? <div className={styles.success} role="status">Duyuru gönderildi.</div> : null}
        <button disabled={busy || !title.trim() || !body.trim()}>
          {busy ? "Gönderiliyor…" : "Duyuruyu gönder"}
        </button>
      </form>
    </section>
  );
}

export default function AdminSecurePage() {
  const [step, setStep] = useState("email"); const [email, setEmail] = useState(""); const [code, setCode] = useState("");
  const [token, setToken] = useState(null); const [admin, setAdmin] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [section, setSection] = useState("overview");
  useEffect(() => { document.title = "Bankacı Admin"; const robots = document.querySelector('meta[name="robots"]'); if (robots) robots.setAttribute("content", "noindex, nofollow, noarchive"); }, []);
  const requestCode = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { await api("/v1/admin/auth/email/code", { method: "POST", body: JSON.stringify({ email }) }); setStep("code"); } catch (e) { setError(e.message === "rate_limited" ? "Çok sık kod istendi. Bir süre sonra tekrar deneyin." : "Kod gönderilemedi."); } finally { setBusy(false); } };
  const verify = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const session = await api("/v1/admin/auth/email/verify", { method: "POST", body: JSON.stringify({ email, code }) }); const me = await api("/v1/admin/me", { headers: { Authorization: `Bearer ${session.token}` } }); setToken(session.token); setAdmin(me); document.title = "Yönetim — Bankacı"; } catch { setError("Kod geçersiz, süresi dolmuş veya bu e-posta yönetici değil."); } finally { setBusy(false); } };
  if (!token || !admin) return <main className={styles.loginShell}><section className={styles.loginCard}><h1>Bankacı Admin</h1><form onSubmit={step === "email" ? requestCode : verify}>{step === "email" ? <input aria-label="E-posta adresi" autoComplete="email" autoFocus type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta adresi"/> : <input aria-label="6 haneli giriş kodu" autoComplete="one-time-code" autoFocus inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="6 haneli giriş kodu"/>}{error ? <div className={styles.error} role="alert">{error}</div> : null}<button disabled={busy}>{busy ? "Kontrol ediliyor…" : step === "email" ? "Kod gönder" : "Giriş yap"}</button></form></section></main>;
  return (
    <div className={styles.adminShell}>
      <aside>
        <a className={styles.brand} href="/"><img src="/icon.png" alt="" /><span>Bankacı</span></a>
        <nav>
          {SECTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={section === item.key ? styles.active : undefined}
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className={styles.logout} onClick={() => { setToken(null); setAdmin(null); setCode(""); setStep("email"); setSection("overview"); }}>Çıkış yap</button>
      </aside>
      <main>
        <header><div><span>Yönetim</span><h1>{SECTION_TITLES[section]}</h1></div><strong>{admin.email}</strong></header>
        {section === "notifications" ? (
          <BroadcastForm token={token} />
        ) : (
          <section className={styles.emptyPanel}>
            <div className={styles.emptyIcon}>B</div>
            <h2>Güvenli yönetim oturumu açık</h2>
            <p>Kullanıcı ve anonim raporlama araçları bu yetkili oturum üzerinden sunulacak.</p>
          </section>
        )}
      </main>
    </div>
  );
}
