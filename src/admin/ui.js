import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./AdminPage.module.css";

// ---- Formatting -----------------------------------------------------------

const numberFormat = new Intl.NumberFormat("tr-TR");
const currencyFormat = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export const formatNumber = (value) =>
  value === null || value === undefined ? "—" : numberFormat.format(value);

export const formatCurrency = (value) => {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric === null || numeric === undefined || Number.isNaN(numeric)) {
    return "—";
  }
  return currencyFormat.format(numeric);
};

export const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const relativeDays = (value) => {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  return `${Math.floor(months / 12)} yıl önce`;
};

export const PREMIUM_LABELS = {
  free: "Ücretsiz",
  active: "Premium",
  lifetime: "Yaşam boyu",
  expired: "Süresi doldu",
};

export const PREMIUM_TONES = {
  free: "neutral",
  active: "success",
  lifetime: "brand",
  expired: "danger",
};

export const LOAN_TYPE_LABELS = {
  consumer: "İhtiyaç",
  vehicle: "Taşıt",
  housing: "Konut",
  commercial: "Ticari",
};

export const REQUEST_STATUS_LABELS = {
  new: "Yeni",
  contacted: "Görüşüldü",
  closed: "Kapandı",
};

export const REQUEST_STATUS_TONES = {
  new: "brand",
  contacted: "warning",
  closed: "neutral",
};

export const CONTENT_STATUS_LABELS = {
  published: "Yayında",
  hidden: "Gizli",
  deleted: "Silindi",
};

export const CONTENT_STATUS_TONES = {
  published: "success",
  hidden: "warning",
  deleted: "danger",
};

// ---- Data hook ------------------------------------------------------------

// useResource loads data whenever `deps` change, exposing loading/error state
// and a manual reload. The fetcher receives an AbortSignal-free promise; a ref
// guards against setting state after unmount or a superseded request.
export function useResource(fetcher, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    Promise.resolve()
      .then(fetcher)
      .then((data) => {
        if (id === requestId.current) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (id === requestId.current)
          setState({ data: null, loading: false, error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  return { ...state, reload: load };
}

export function friendlyError(error) {
  if (error && error.status === 401) return "Oturum süresi doldu. Yeniden giriş yapın.";
  if (error && error.status === 403) return "Bu veriye erişim yetkiniz yok.";
  return "Veri yüklenemedi. Tekrar deneyin.";
}

// ---- Primitives -----------------------------------------------------------

export function Badge({ tone = "neutral", children }) {
  return <span className={`${styles.badge} ${styles[`tone_${tone}`]}`}>{children}</span>;
}

export function StatCard({ label, value, hint, tone }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={`${styles.statValue} ${tone ? styles[`stat_${tone}`] : ""}`}>
        {value}
      </strong>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </div>
  );
}

export function StatGrid({ children }) {
  return <div className={styles.statGrid}>{children}</div>;
}

export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle ? <p className={styles.sectionSubtitle}>{subtitle}</p> : null}
      </div>
      {children ? <div className={styles.sectionActions}>{children}</div> : null}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder, onSubmit }) {
  return (
    <form
      className={styles.searchBar}
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmit) onSubmit();
      }}
    >
      <input
        type="search"
        inputMode="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </form>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <div className={styles.filterChips} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={value === option.value ? styles.chipActive : styles.chip}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// RecordCard renders one record as a stacked card: a title row with badges, then
// label/value fields. It reads identically on a phone and a desktop, which is
// what makes the whole panel usable from a small screen.
export function RecordCard({ title, subtitle, badges, fields, onOpen, openLabel }) {
  return (
    <article className={styles.recordCard}>
      <div className={styles.recordTop}>
        <div className={styles.recordHeading}>
          <strong className={styles.recordTitle}>{title}</strong>
          {subtitle ? <span className={styles.recordSubtitle}>{subtitle}</span> : null}
        </div>
        {badges && badges.length ? (
          <div className={styles.recordBadges}>
            {badges.map((badge, index) => (
              <Badge key={index} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {fields && fields.length ? (
        <dl className={styles.fieldList}>
          {fields.map((field) => (
            <div key={field.label} className={styles.field}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {onOpen ? (
        <button type="button" className={styles.recordOpen} onClick={onOpen}>
          {openLabel || "Detay"}
        </button>
      ) : null}
    </article>
  );
}

export function Pager({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  if (total === 0) return null;
  return (
    <div className={styles.pager}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ‹ Önceki
      </button>
      <span>
        {page} / {totalPages} · {formatNumber(total)} kayıt
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Sonraki ›
      </button>
    </div>
  );
}

export function AsyncState({ loading, error, empty, emptyText, onRetry, children }) {
  if (loading) {
    return (
      <div className={styles.stateBox}>
        <div className={styles.spinner} aria-hidden="true" />
        <span>Yükleniyor…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.stateError}>{friendlyError(error)}</span>
        {onRetry ? (
          <button type="button" className={styles.retryButton} onClick={onRetry}>
            Tekrar dene
          </button>
        ) : null}
      </div>
    );
  }
  if (empty) {
    return (
      <div className={styles.stateBox}>
        <span>{emptyText || "Kayıt bulunamadı."}</span>
      </div>
    );
  }
  return children;
}
