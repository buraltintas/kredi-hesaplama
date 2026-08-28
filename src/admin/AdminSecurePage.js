import React, { useCallback, useEffect, useState } from "react";
import styles from "./AdminPage.module.css";
import { api, readStoredToken, writeStoredToken } from "./api";
import { SECTION_COMPONENTS, useSectionList } from "./sections";

// useAdminRequest returns a stable request function bound to the admin token.
// A 401 anywhere means the short-lived admin session lapsed, so it clears the
// session and drops the operator back to the login screen instead of leaving
// dead views on screen.
function useAdminRequest(token, onExpire) {
  return useCallback(
    async (path, options = {}) => {
      try {
        return await api(path, { token, ...options });
      } catch (error) {
        if (error && error.status === 401) onExpire();
        throw error;
      }
    },
    [token, onExpire]
  );
}

function LoginScreen({ onAuthenticated }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/v1/admin/auth/email/code", {
        method: "POST",
        body: { email },
      });
      setStep("code");
    } catch (e) {
      setError(
        e.message === "rate_limited"
          ? "Çok sık kod istendi. Bir süre sonra tekrar deneyin."
          : "Kod gönderilemedi."
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await api("/v1/admin/auth/email/verify", {
        method: "POST",
        body: { email, code },
      });
      const admin = await api("/v1/admin/me", { token: session.token });
      onAuthenticated(session.token, admin);
    } catch {
      setError("Kod geçersiz, süresi dolmuş veya bu e-posta yönetici değil.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.loginShell}>
      <section className={styles.loginCard}>
        <h1>Bankacı Admin</h1>
        <form onSubmit={step === "email" ? requestCode : verify}>
          {step === "email" ? (
            <input
              aria-label="E-posta adresi"
              autoComplete="email"
              autoFocus
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresi"
            />
          ) : (
            <input
              aria-label="6 haneli giriş kodu"
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength="6"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6 haneli giriş kodu"
            />
          )}
          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}
          <button disabled={busy}>
            {busy
              ? "Kontrol ediliyor…"
              : step === "email"
              ? "Kod gönder"
              : "Giriş yap"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AdminSecurePage() {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [section, setSection] = useState("overview");
  const sections = useSectionList();

  useEffect(() => {
    document.title = "Bankacı Admin";
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "noindex, nofollow, noarchive");
  }, []);

  // Restore a stored admin session on load so a refresh on a phone does not force
  // a fresh OTP. The token is re-validated against /v1/admin/me before use.
  useEffect(() => {
    const stored = readStoredToken();
    if (!stored) {
      setRestoring(false);
      return;
    }
    let active = true;
    api("/v1/admin/me", { token: stored })
      .then((me) => {
        if (!active) return;
        setToken(stored);
        setAdmin(me);
      })
      .catch(() => writeStoredToken(null))
      .finally(() => active && setRestoring(false));
    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback((nextToken, nextAdmin) => {
    writeStoredToken(nextToken);
    setToken(nextToken);
    setAdmin(nextAdmin);
  }, []);

  const signOut = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setAdmin(null);
    setSection("overview");
  }, []);

  const request = useAdminRequest(token, signOut);

  if (restoring) {
    return (
      <main className={styles.loginShell}>
        <div className={styles.spinner} aria-hidden="true" />
      </main>
    );
  }

  if (!token || !admin) {
    return <LoginScreen onAuthenticated={authenticate} />;
  }

  const Section = SECTION_COMPONENTS[section] || SECTION_COMPONENTS.overview;

  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/">
          <img src="/icon.png" alt="" />
          <span>Bankacı</span>
        </a>
        <nav className={styles.nav} aria-label="Yönetim bölümleri">
          {sections.map((item) => (
            <button
              key={item.key}
              type="button"
              className={section === item.key ? styles.navActive : styles.navItem}
              aria-current={section === item.key ? "page" : undefined}
              onClick={() => setSection(item.key)}
            >
              <span className={styles.navIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className={styles.logout} onClick={signOut}>
          Çıkış yap
        </button>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <span className={styles.topbarEyebrow}>Yönetim</span>
          <strong className={styles.topbarEmail}>{admin.email}</strong>
        </header>
        <main className={styles.main}>
          <Section request={request} />
        </main>
      </div>
    </div>
  );
}
