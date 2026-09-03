import React, { useEffect, useMemo, useState } from "react";
import styles from "./AdminPage.module.css";
import {
  AsyncState,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  FilterChips,
  LOAN_TYPE_LABELS,
  Pager,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONES,
  RecordCard,
  SearchBar,
  SectionHeader,
  StatCard,
  StatGrid,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  relativeDays,
  useResource,
} from "./ui";

const PAGE_SIZE = 25;

// useDebounced returns `value` after it has stopped changing for `delay` ms, so
// search fields query the API only once the operator pauses typing.
function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---- Overview -------------------------------------------------------------

export function OverviewSection({ request }) {
  const { data, loading, error, reload } = useResource(
    () => request("/v1/admin/overview"),
    [request]
  );
  return (
    <div>
      <SectionHeader
        title="Genel Bakış"
        subtitle="Mevcut verilerden hesaplanan canlı özet."
      />
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data ? <OverviewBody data={data} /> : null}
      </AsyncState>
    </div>
  );
}

function OverviewBody({ data }) {
  return (
    <div className={styles.overviewStack}>
      <div className={styles.groupLabel}>Kullanıcılar</div>
      <StatGrid>
        <StatCard label="Toplam kullanıcı" value={formatNumber(data.users.total)} />
        <StatCard label="Bugün katılan" value={formatNumber(data.users.today)} />
        <StatCard label="Son 7 gün" value={formatNumber(data.users.last7Days)} />
        <StatCard label="Son 30 gün" value={formatNumber(data.users.last30Days)} />
        <StatCard
          label="Son 7 günde aktif"
          value={formatNumber(data.users.activeLast7Days)}
        />
      </StatGrid>

      <div className={styles.groupLabel}>Kredi Talepleri</div>
      <StatGrid>
        <StatCard label="Talep linki" value={formatNumber(data.requestLinks.total)} />
        <StatCard label="Aktif link" value={formatNumber(data.requestLinks.active)} />
        <StatCard label="Toplam talep" value={formatNumber(data.requestLinks.submissions)} />
        <StatCard
          label="Son 24 saat"
          value={formatNumber(data.requestLinks.submissionsLast24Hours)}
        />
        <StatCard
          label="Son 7 gün"
          value={formatNumber(data.requestLinks.submissionsLast7Days)}
        />
      </StatGrid>

      <div className={styles.groupLabel}>Öğle Arası</div>
      <StatGrid>
        <StatCard label="Gönderi" value={formatNumber(data.social.posts)} />
        <StatCard label="Son 24 saat gönderi" value={formatNumber(data.social.postsLast24Hours)} />
        <StatCard label="Yorum" value={formatNumber(data.social.comments)} />
        <StatCard label="Beğeni" value={formatNumber(data.social.likes)} />
      </StatGrid>

      <div className={styles.groupLabel}>Push Cihazları</div>
      <StatGrid>
        <StatCard label="Toplam cihaz" value={formatNumber(data.pushDevices.total)} />
        <StatCard label="iOS" value={formatNumber(data.pushDevices.ios)} />
        <StatCard label="Android" value={formatNumber(data.pushDevices.android)} />
        <StatCard label="Bildirim açık" value={formatNumber(data.pushDevices.enabled)} tone="success" />
        <StatCard label="Üye cihaz" value={formatNumber(data.pushDevices.members)} />
        <StatCard label="Misafir cihaz" value={formatNumber(data.pushDevices.guest)} />
      </StatGrid>
    </div>
  );
}

// ---- Users ----------------------------------------------------------------

export function UsersSection({ request }) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => setPage(1), [search]);

  const { data, loading, error, reload } = useResource(
    () =>
      request("/v1/admin/users", {
        params: { search, page, pageSize: PAGE_SIZE, sort: "created_desc" },
      }),
    [request, search, page]
  );

  return (
    <div>
      <SectionHeader
        title="Kullanıcılar"
        subtitle="E-posta, ad veya kullanıcı kimliğiyle arayın."
      />
      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Kullanıcı ara"
      />
      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data && data.items.length === 0}
        emptyText="Eşleşen kullanıcı yok."
      >
        {data ? (
          <>
            <div className={styles.recordList}>
              {data.items.map((user) => (
                <RecordCard
                  key={user.id}
                  title={user.displayName || "(isimsiz)"}
                  subtitle={user.email}
                  fields={[
                    { label: "Kayıt", value: formatDate(user.createdAt) },
                    { label: "Son görülme", value: relativeDays(user.lastSeenAt) },
                    { label: "Banka", value: user.bankName || "—" },
                    { label: "Cihaz", value: formatNumber(user.deviceCount) },
                    { label: "Link", value: formatNumber(user.linkCount) },
                    { label: "Gönderi", value: formatNumber(user.postCount) },
                  ]}
                  onOpen={() => setSelectedId(user.id)}
                />
              ))}
            </div>
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onPage={setPage}
            />
          </>
        ) : null}
      </AsyncState>
      {selectedId ? (
        <UserDetailOverlay
          request={request}
          userId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function UserDetailOverlay({ request, userId, onClose }) {
  const { data, loading, error, reload } = useResource(
    () => request(`/v1/admin/users/${encodeURIComponent(userId)}`),
    [request, userId]
  );
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.overlaySheet} onClick={(event) => event.stopPropagation()}>
        <div className={styles.overlayHeader}>
          <strong>Kullanıcı detayı</strong>
          <button type="button" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className={styles.overlayBody}>
          <AsyncState loading={loading} error={error} onRetry={reload}>
            {data ? <UserDetailBody data={data} /> : null}
          </AsyncState>
        </div>
      </div>
    </div>
  );
}

function UserDetailBody({ data }) {
  return (
    <div className={styles.detailStack}>
      <div className={styles.detailIdentity}>
        <strong>{data.displayName || "(isimsiz)"}</strong>
        <span>{data.email}</span>
      </div>

      <div className={styles.detailGroup}>Özet</div>
      <StatGrid>
        <StatCard label="Link" value={formatNumber(data.counts.links)} />
        <StatCard label="Talep" value={formatNumber(data.counts.requests)} />
        <StatCard label="Gönderi" value={formatNumber(data.counts.posts)} />
        <StatCard label="Yorum" value={formatNumber(data.counts.comments)} />
        <StatCard label="Cihaz" value={formatNumber(data.counts.devices)} />
        <StatCard label="Aktif oturum" value={formatNumber(data.counts.activeSessions)} />
      </StatGrid>

      <div className={styles.detailGroup}>Hesap</div>
      <dl className={styles.fieldList}>
        <div className={styles.field}>
          <dt>Kullanıcı kimliği</dt>
          <dd className={styles.mono}>{data.id}</dd>
        </div>
        <div className={styles.field}>
          <dt>Banka / Görev</dt>
          <dd>{[data.bankName, data.jobTitle].filter(Boolean).join(" · ") || "—"}</dd>
        </div>
        <div className={styles.field}>
          <dt>Kayıt tarihi</dt>
          <dd>{formatDateTime(data.createdAt)}</dd>
        </div>
        <div className={styles.field}>
          <dt>Son görülme</dt>
          <dd>{formatDateTime(data.lastSeenAt)}</dd>
        </div>
      </dl>

      {data.links.length ? (
        <>
          <div className={styles.detailGroup}>Talep linkleri</div>
          <div className={styles.recordList}>
            {data.links.map((link) => (
              <RecordCard
                key={link.id}
                title={link.label}
                badges={[
                  {
                    label: link.isActive ? "Aktif" : "Pasif",
                    tone: link.isActive ? "success" : "neutral",
                  },
                ]}
                fields={[
                  { label: "Görüntülenme", value: formatNumber(link.viewCount) },
                  { label: "Talep", value: formatNumber(link.submissionCount) },
                  { label: "Oluşturma", value: formatDate(link.createdAt) },
                ]}
              />
            ))}
          </div>
        </>
      ) : null}

      {data.devices.length ? (
        <>
          <div className={styles.detailGroup}>Push cihazları</div>
          <div className={styles.recordList}>
            {data.devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---- Request links --------------------------------------------------------

export function RequestLinksSection({ request }) {
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useResource(
    () =>
      request("/v1/admin/request-links", {
        params: { page, pageSize: PAGE_SIZE },
      }),
    [request, page]
  );

  return (
    <div>
      <SectionHeader
        title="Talep Linkleri"
        subtitle="En çok talep alan linkler önce."
      />
      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data && data.items.length === 0}
        emptyText="Link bulunamadı."
      >
        {data ? (
          <>
            <div className={styles.recordList}>
              {data.items.map((link) => (
                <RecordCard
                  key={link.id}
                  title={link.label}
                  subtitle={`${link.ownerDisplayName || "(isimsiz)"} · ${link.ownerEmail}`}
                  badges={[
                    {
                      label: link.isActive ? "Aktif" : "Pasif",
                      tone: link.isActive ? "success" : "neutral",
                    },
                  ]}
                  fields={[
                    { label: "Görüntülenme", value: formatNumber(link.viewCount) },
                    { label: "Talep", value: formatNumber(link.submissionCount) },
                    { label: "Son görüntülenme", value: relativeDays(link.lastViewedAt) },
                    { label: "Oluşturma", value: formatDate(link.createdAt) },
                  ]}
                />
              ))}
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}

// ---- Loan requests --------------------------------------------------------

const REQUEST_FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Görüşüldü" },
  { value: "closed", label: "Kapandı" },
];

export function LoanRequestsSection({ request }) {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [status]);

  const { data, loading, error, reload } = useResource(
    () =>
      request("/v1/admin/loan-requests", {
        params: { status: status === "all" ? "" : status, page, pageSize: PAGE_SIZE },
      }),
    [request, status, page]
  );

  return (
    <div>
      <SectionHeader
        title="Kredi Talepleri"
        subtitle="Kişisel bilgiler maskelenmiştir. Tam bilgi yalnızca link sahibindedir."
      />
      <FilterChips options={REQUEST_FILTERS} value={status} onChange={setStatus} />
      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data && data.items.length === 0}
        emptyText="Talep bulunamadı."
      >
        {data ? (
          <>
            <div className={styles.recordList}>
              {data.items.map((item) => (
                <RecordCard
                  key={item.id}
                  title={`${LOAN_TYPE_LABELS[item.loanType] || item.loanType} · ${formatCurrency(item.amount)}`}
                  subtitle={`${item.fullName} · ${item.phone}`}
                  badges={[
                    {
                      label: REQUEST_STATUS_LABELS[item.status],
                      tone: REQUEST_STATUS_TONES[item.status],
                    },
                    ...(item.hasDocuments ? [{ label: "Belge", tone: "brand" }] : []),
                  ]}
                  fields={[
                    { label: "Vade", value: `${item.termMonths} ay` },
                    { label: "Link", value: item.linkLabel },
                    { label: "Bankacı", value: item.ownerEmail },
                    { label: "Tarih", value: formatDateTime(item.createdAt) },
                  ]}
                />
              ))}
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}

// ---- Social ---------------------------------------------------------------

const SOCIAL_TABS = [
  { value: "posts", label: "Gönderiler" },
  { value: "comments", label: "Yorumlar" },
];

export function SocialSection({ request }) {
  const [tab, setTab] = useState("posts");
  return (
    <div>
      <SectionHeader title="Öğle Arası" subtitle="Topluluk gönderileri ve yorumları." />
      <FilterChips options={SOCIAL_TABS} value={tab} onChange={setTab} />
      {tab === "posts" ? (
        <SocialPosts request={request} />
      ) : (
        <SocialComments request={request} />
      )}
    </div>
  );
}

function SocialPosts({ request }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useResource(
    () => request("/v1/admin/social/posts", { params: { page, pageSize: PAGE_SIZE } }),
    [request, page]
  );
  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={reload}
      empty={data && data.items.length === 0}
      emptyText="Gönderi yok."
    >
      {data ? (
        <>
          <div className={styles.recordList}>
            {data.items.map((post) => (
              <RecordCard
                key={post.id}
                title={post.authorName || "(isimsiz)"}
                subtitle={post.authorEmail}
                badges={[
                  {
                    label: CONTENT_STATUS_LABELS[post.status],
                    tone: CONTENT_STATUS_TONES[post.status],
                  },
                  ...(post.hasImage ? [{ label: "Görsel", tone: "brand" }] : []),
                ]}
                fields={[
                  { label: "İçerik", value: post.preview || "—" },
                  { label: "Beğeni", value: formatNumber(post.likeCount) },
                  { label: "Yorum", value: formatNumber(post.commentCount) },
                  { label: "Tarih", value: formatDateTime(post.createdAt) },
                ]}
              />
            ))}
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
        </>
      ) : null}
    </AsyncState>
  );
}

function SocialComments({ request }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useResource(
    () => request("/v1/admin/social/comments", { params: { page, pageSize: PAGE_SIZE } }),
    [request, page]
  );
  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={reload}
      empty={data && data.items.length === 0}
      emptyText="Yorum yok."
    >
      {data ? (
        <>
          <div className={styles.recordList}>
            {data.items.map((comment) => (
              <RecordCard
                key={comment.id}
                title={comment.authorName || "(isimsiz)"}
                badges={[
                  {
                    label: CONTENT_STATUS_LABELS[comment.status],
                    tone: CONTENT_STATUS_TONES[comment.status],
                  },
                ]}
                fields={[
                  { label: "Yorum", value: comment.preview || "—" },
                  { label: "Tarih", value: formatDateTime(comment.createdAt) },
                ]}
              />
            ))}
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
        </>
      ) : null}
    </AsyncState>
  );
}

// ---- Push devices ---------------------------------------------------------

const DEVICE_FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
];

function DeviceCard({ device }) {
  const prefs = [
    device.requestsEnabled ? "Talep" : null,
    device.feedEnabled ? "Öğle Arası" : null,
    device.announcementsEnabled ? "Duyuru" : null,
  ].filter(Boolean);
  return (
    <RecordCard
      title={device.deviceName || "(adsız cihaz)"}
      subtitle={device.userEmail || "Misafir cihaz"}
      badges={[
        { label: device.platform === "ios" ? "iOS" : "Android", tone: "brand" },
        {
          label: device.enabled ? "Açık" : "Kapalı",
          tone: device.enabled ? "success" : "neutral",
        },
        ...(device.stale ? [{ label: "Eski kayıt", tone: "warning" }] : []),
      ]}
      fields={[
        { label: "Token", value: <span className={styles.mono}>{device.tokenMask}</span> },
        { label: "Tercihler", value: prefs.length ? prefs.join(" · ") : "Kapalı" },
        { label: "Son kayıt", value: relativeDays(device.lastRegisteredAt) },
      ]}
    />
  );
}

export function PushDevicesSection({ request }) {
  const [platform, setPlatform] = useState("all");
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [platform]);

  const { data, loading, error, reload } = useResource(
    () =>
      request("/v1/admin/push-devices", {
        params: { platform: platform === "all" ? "" : platform, page, pageSize: PAGE_SIZE },
      }),
    [request, platform, page]
  );

  return (
    <div>
      <SectionHeader
        title="Push Cihazları"
        subtitle="Tam token gösterilmez; yalnızca maskeli biçimi görünür."
      />
      <FilterChips options={DEVICE_FILTERS} value={platform} onChange={setPlatform} />
      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data && data.items.length === 0}
        emptyText="Cihaz bulunamadı."
      >
        {data ? (
          <>
            <div className={styles.recordList}>
              {data.items.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}

// ---- Calculations ---------------------------------------------------------

const CALC_TYPE_LABELS = {
  loan: "Kredi",
  deposit: "Mevduat",
  transfer: "Konut Devri",
};

const calcTypeLabel = (type) => CALC_TYPE_LABELS[type] || type;

// Human-readable variant names, matching the mobile app's own labels. The raw
// variant string stays in the database/API; this only formats it for display.
const LOAN_DOC_LABELS = {
  consumer_vehicle: "İhtiyaç/Taşıt",
  housing: "Konut",
  custom: "Özel",
};
const LOAN_PLAN_LABELS = {
  standard: "Standart Sabit Taksitli",
  prepaidInterest: "Peşin Faiz Ödemeli",
  equalPrincipal: "Eşit Anapara Ödemeli",
  customPayment: "Özel / Balon Ödeme Planı",
  interestOnly: "Anapara Ödemesiz Dönemli Plan",
  increasingInstallment: "Artan Taksitli Plan",
  decreasingInstallment: "Azalan Taksitli Plan",
};
const COMMERCIAL_LABELS = {
  commercial_installment: "Taksitli Ticari Kredi",
  commercial_spot: "Spot Kredi",
  commercial_revolving: "Rotatif / BCH",
  commercial_discount: "Çek / Senet İskonto",
};
const DEPOSIT_LABELS = { term_deposit: "Vadeli Mevduat" };
const TRANSFER_LABELS = {
  payoff: "Kapama tutarını biliyorum",
  estimate: "Tahmini hesapla",
};

const variantLabel = (type, variant) => {
  if (!variant) return "(varyantsız)";
  if (COMMERCIAL_LABELS[variant]) return COMMERCIAL_LABELS[variant];
  if (type === "deposit") return DEPOSIT_LABELS[variant] || variant;
  if (type === "transfer") return TRANSFER_LABELS[variant] || variant;
  if (type === "loan" && variant.includes("/")) {
    const [doc, plan] = variant.split("/");
    return `${LOAN_DOC_LABELS[doc] || doc} · ${LOAN_PLAN_LABELS[plan] || plan}`;
  }
  return variant;
};

// Term unit differs by calculator: deposits are in days, loans/transfers in
// months. Anything null renders as an em dash.
const termLabel = (type, value) => {
  if (value === null || value === undefined) return "—";
  const unit = type === "deposit" ? "gün" : "ay";
  return `${Number(value).toLocaleString("tr-TR")} ${unit}`;
};

const rateLabel = (value) =>
  value === null || value === undefined
    ? "—"
    : `%${Number(value).toLocaleString("tr-TR")}`;

const avgMoney = (value) =>
  value === null || value === undefined ? "—" : formatCurrency(Number(value));

export function CalculationsSection({ request }) {
  const { data, loading, error, reload } = useResource(
    () => request("/v1/admin/calculations"),
    [request]
  );
  return (
    <div>
      <SectionHeader
        title="Hesaplamalar"
        subtitle="Anonim hesaplama olayları. Kimlik içermez; sadece hesaplama rakamları."
      />
      <div className={styles.noticeCard}>
        Bu hesaplamalar 2 Eylül 2026, saat 13:55 itibarıyla raporlanmaya
        başlanmıştır. Daha önceki hesaplamalar kaydedilmemiştir.
      </div>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data ? (
          <>
            <StatGrid>
              <StatCard label="Toplam hesaplama" value={formatNumber(data.totals.total)} />
              <StatCard label="Bugün" value={formatNumber(data.totals.today)} />
              <StatCard label="Son 7 gün" value={formatNumber(data.totals.last7Days)} />
              <StatCard label="Son 30 gün" value={formatNumber(data.totals.last30Days)} />
              <StatCard label="iOS" value={formatNumber(data.totals.ios)} />
              <StatCard label="Android" value={formatNumber(data.totals.android)} />
              <StatCard label="Cihaz (tekil)" value={formatNumber(data.totals.installations)} />
            </StatGrid>

            {data.byType.length ? (
              <>
                <div className={styles.groupLabel}>Türe göre</div>
                <StatGrid>
                  {data.byType.map((row) => (
                    <StatCard
                      key={row.calculatorType}
                      label={calcTypeLabel(row.calculatorType)}
                      value={formatNumber(row.total)}
                      hint={`${formatNumber(row.installations)} cihaz`}
                    />
                  ))}
                </StatGrid>
              </>
            ) : null}

            <div className={styles.groupLabel}>En çok yapılan (ortalamalarla)</div>
            {data.top.length === 0 ? (
              <div className={styles.recordList}>
                <RecordCard title="Kayıt yok" subtitle="Henüz hesaplama olayı yok." />
              </div>
            ) : (
              <div className={styles.recordList}>
                {data.top.map((row, index) => (
                  <RecordCard
                    key={`${row.calculatorType}-${row.variant}-${index}`}
                    title={`${index + 1}. ${variantLabel(row.calculatorType, row.variant)}`}
                    subtitle={calcTypeLabel(row.calculatorType)}
                    badges={[{ label: formatNumber(row.total), tone: "brand" }]}
                    fields={[
                      { label: "Toplam", value: formatNumber(row.total) },
                      { label: "iOS", value: formatNumber(row.ios) },
                      { label: "Android", value: formatNumber(row.android) },
                      { label: "Cihaz", value: formatNumber(row.installations) },
                      { label: "Ort. tutar", value: avgMoney(row.avgPrincipal) },
                      {
                        label: "Ort. vade",
                        value: termLabel(row.calculatorType, row.avgTerm),
                      },
                      { label: "Ort. faiz", value: rateLabel(row.avgRate) },
                      { label: "Ort. sonuç", value: avgMoney(row.avgResultTotal) },
                    ]}
                  />
                ))}
              </div>
            )}

            <RecentCalculations request={request} />
          </>
        ) : null}
      </AsyncState>
    </div>
  );
}

// RecentCalculations is the paginated per-event list plus a CSV export of every
// event (all pages), which opens directly in Excel.
function RecentCalculations({ request }) {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, reload } = useResource(
    () => request("/v1/admin/calculation-events", { params: { page, pageSize: PAGE_SIZE } }),
    [request, page]
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = [];
      let p = 1;
      // Page through everything (max page size) and accumulate.
      for (; p <= 1000; p += 1) {
        const res = await request("/v1/admin/calculation-events", {
          params: { page: p, pageSize: 100 },
        });
        all.push(...res.items);
        if (res.items.length === 0 || p * 100 >= res.total) break;
      }
      const esc = (value) => {
        const s = value === null || value === undefined ? "" : String(value);
        return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = [
        "Tarih", "Tur", "Varyant", "Aciklama", "Tutar", "Vade", "Faiz(%)",
        "Sonuc(Toplam)", "Taksit", "Platform", "Surum",
      ];
      const lines = [header.join(";")];
      for (const e of all) {
        lines.push(
          [
            new Date(e.occurredAt).toLocaleString("tr-TR"),
            calcTypeLabel(e.calculatorType),
            e.variant,
            variantLabel(e.calculatorType, e.variant),
            e.principal ?? "",
            e.term ?? "",
            e.rate ?? "",
            e.resultTotal ?? "",
            e.resultPayment ?? "",
            e.platform,
            e.appVersion,
          ]
            .map(esc)
            .join(";")
        );
      }
      // BOM so Excel reads UTF-8 (Turkish characters) correctly.
      const csv = "﻿" + lines.join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `hesaplamalar-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className={styles.sectionHeader} style={{ marginTop: 22 }}>
        <div>
          <div className={styles.groupLabel} style={{ marginTop: 0 }}>
            Son hesaplamalar
          </div>
        </div>
        <button
          type="button"
          className={styles.retryButton}
          disabled={exporting || !data || data.total === 0}
          onClick={() => void exportCsv()}
        >
          {exporting ? "Hazırlanıyor…" : "Excel'e aktar (tümü)"}
        </button>
      </div>
      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={data && data.items.length === 0}
        emptyText="Henüz hesaplama olayı yok."
      >
        {data ? (
          <>
            <div className={styles.recordList}>
              {data.items.map((e, index) => (
                <RecordCard
                  key={`${e.occurredAt}-${index}`}
                  title={variantLabel(e.calculatorType, e.variant)}
                  subtitle={`${calcTypeLabel(e.calculatorType)} · ${e.platform}`}
                  fields={[
                    { label: "Tutar", value: avgMoney(e.principal) },
                    { label: "Vade", value: termLabel(e.calculatorType, e.term) },
                    { label: "Faiz", value: rateLabel(e.rate) },
                    { label: "Sonuç", value: avgMoney(e.resultTotal) },
                    { label: "Tarih", value: formatDateTime(e.occurredAt) },
                  ]}
                />
              ))}
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
          </>
        ) : null}
      </AsyncState>
    </>
  );
}

// ---- Notification preferences --------------------------------------------

export function PreferencesSection({ request }) {
  const { data, loading, error, reload } = useResource(
    () => request("/v1/admin/notification-preferences"),
    [request]
  );
  const percent = (value) =>
    data && data.enabledDevices > 0
      ? `%${Math.round((value / data.enabledDevices) * 100)}`
      : "—";
  return (
    <div>
      <SectionHeader
        title="Bildirim Tercihleri"
        subtitle="Bildirimi açık cihazlarda kategori bazlı katılım."
      />
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data ? (
          <StatGrid>
            <StatCard label="Bildirim açık cihaz" value={formatNumber(data.enabledDevices)} />
            <StatCard
              label="Talepler"
              value={formatNumber(data.requestsEnabled)}
              hint={percent(data.requestsEnabled)}
            />
            <StatCard
              label="Öğle Arası"
              value={formatNumber(data.feedEnabled)}
              hint={percent(data.feedEnabled)}
            />
            <StatCard
              label="Duyurular"
              value={formatNumber(data.announcementsEnabled)}
              hint={percent(data.announcementsEnabled)}
            />
            <StatCard label="iOS açık" value={formatNumber(data.iosEnabled)} />
            <StatCard label="Android açık" value={formatNumber(data.androidEnabled)} />
          </StatGrid>
        ) : null}
      </AsyncState>
    </div>
  );
}

// ---- Notifications (broadcast) -------------------------------------------

export function NotificationsSection({ request }) {
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
      await request("/v1/admin/notifications", {
        method: "POST",
        body: { title: title.trim(), body: body.trim() },
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
    <div>
      <SectionHeader
        title="Bildirimler"
        subtitle="Bildirim izni veren tüm cihazlara ulaşır. Yönlendirme yoktur; dokununca uygulama açılır."
      />
      <form className={styles.broadcastForm} onSubmit={send}>
        <label className={styles.formField}>
          <span>Başlık</span>
          <input
            maxLength={120}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Uygulamamızın 2. yılı kutlu olsun 🎉"
          />
        </label>
        <label className={styles.formField}>
          <span>Açıklama</span>
          <textarea
            maxLength={400}
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Kısa bir mesaj yazın."
          />
        </label>
        {error ? (
          <div className={styles.formError} role="alert">
            {error}
          </div>
        ) : null}
        {sent ? (
          <div className={styles.formSuccess} role="status">
            Duyuru gönderildi.
          </div>
        ) : null}
        <button disabled={busy || !title.trim() || !body.trim()}>
          {busy ? "Gönderiliyor…" : "Duyuruyu gönder"}
        </button>
      </form>
    </div>
  );
}

export const SECTION_COMPONENTS = {
  overview: OverviewSection,
  users: UsersSection,
  "request-links": RequestLinksSection,
  "loan-requests": LoanRequestsSection,
  social: SocialSection,
  "push-devices": PushDevicesSection,
  calculations: CalculationsSection,
  preferences: PreferencesSection,
  notifications: NotificationsSection,
};

// useMemoizedSections keeps a stable reference for the nav definition.
export function useSectionList() {
  return useMemo(
    () => [
      { key: "overview", label: "Genel Bakış", icon: "◧" },
      { key: "users", label: "Kullanıcılar", icon: "◉" },
      { key: "request-links", label: "Talep Linkleri", icon: "🔗" },
      { key: "loan-requests", label: "Krediler", icon: "₺" },
      { key: "social", label: "Öğle Arası", icon: "◍" },
      { key: "push-devices", label: "Cihazlar", icon: "▤" },
      { key: "calculations", label: "Hesaplamalar", icon: "∑" },
      { key: "preferences", label: "Tercihler", icon: "⚙" },
      { key: "notifications", label: "Bildirimler", icon: "✦" },
    ],
    []
  );
}
