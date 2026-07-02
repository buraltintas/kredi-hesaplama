import styles from "../App.module.css";
import {
  PLAN_TYPE_LABELS,
  formatCurrency,
  formatCustomPaymentsSummary,
  formatDate,
  formatPercent,
  getFirstIncreasedInstallmentAmount,
  getInterestOnlyEffectiveInstallmentInfo,
  getInterestOnlyPeriodInstallmentAmount,
} from "../loanEngine";
import Metric from "./Metric";

const getHeroContent = (result) => {
  const isCustomPayment = result.planType === "customPayment";
  const isIncreasingInstallment = result.planType === "increasingInstallment";
  const isInterestOnly = result.planType === "interestOnly";
  const isEqualPrincipal = result.planType === "equalPrincipal";

  if (isCustomPayment) {
    return {
      label: "Özel Ödeme Planı",
      value: `${result.input.customPayments?.length ?? 0} özel ödeme`,
      subValue: `Son taksit ${formatCurrency(result.lastInstallmentAmount ?? 0)}`,
    };
  }

  if (isIncreasingInstallment) {
    return {
      label: "İlk Taksit / Son Taksit",
      value: `${formatCurrency(
        result.firstInstallmentAmount ?? result.firstInstallment
      )} / ${formatCurrency(result.lastInstallmentAmount ?? result.firstInstallment)}`,
      subValue: `${result.installmentIncreaseStartNo ?? 1}-${
        result.installmentIncreaseEndNo ?? result.input.term
      }. taksit arası, her ${
        result.installmentIncreaseFrequencyMonths ?? 12
      } ayda bir %${result.installmentIncreaseRatePercent ?? 0} artış`,
    };
  }

  if (isInterestOnly) {
    return {
      label: "Sonraki Dönem Taksiti",
      value: formatCurrency(result.postInterestOnlyInstallmentAmount ?? 0),
      subValue: `${result.interestOnlyInstallmentCount ?? 0} anapara ödemesiz taksit`,
    };
  }

  if (isEqualPrincipal) {
    return {
      label: "İlk Taksit / Son Taksit",
      value: `${formatCurrency(
        result.firstInstallmentAmount ?? result.firstInstallment
      )} / ${formatCurrency(result.lastInstallmentAmount ?? result.firstInstallment)}`,
      subValue: `Aylık anapara ${formatCurrency(result.monthlyPrincipalAmount ?? 0)}`,
    };
  }

  return {
    label: "Aylık Taksit",
    value: formatCurrency(result.standardInstallment),
    subValue: `İlk taksit ${formatCurrency(result.firstInstallment)}`,
  };
};

const ResultPanel = ({ result, onDownloadPdf, isScheduleOpen, onToggleSchedule }) => {
  const hero = getHeroContent(result);
  const hasBrokenPeriod = result.brokenPeriod.diffDays !== 0;
  const isPrepaidInterest = result.planType === "prepaidInterest";
  const isEqualPrincipal = result.planType === "equalPrincipal";
  const isCustomPayment = result.planType === "customPayment";
  const isInterestOnly = result.planType === "interestOnly";
  const isIncreasingInstallment = result.planType === "increasingInstallment";
  const interestOnlyInfo = getInterestOnlyEffectiveInstallmentInfo(result);

  return (
    <section className={styles.resultStack}>
      <div className={styles.resultCard}>
        <div className={styles.heroResult}>
          <span>{hero.label}</span>
          <strong>{hero.value}</strong>
          <small>{hero.subValue}</small>
        </div>

        <div className={styles.metricsGrid}>
          <Metric label="Kredi Tutarı" value={formatCurrency(result.input.principal)} highlighted />
          <Metric label="Vade" value={`${result.input.term} ay`} />
          {result.deductedDelayMonths > 0 ? (
            <Metric
              label="Ödeme Planı Taksit Sayısı"
              value={`${result.effectiveInstallmentCount} ay`}
            />
          ) : null}
          {result.planType !== "standard" ? (
            <Metric label="Plan Tipi" value={PLAN_TYPE_LABELS[result.planType]} />
          ) : null}
          <Metric
            label={isPrepaidInterest ? "Baz Aylık Faiz Oranı" : "Aylık Faiz Oranı"}
            value={formatPercent(result.input.monthlyInterestRatePercent)}
          />
          {isPrepaidInterest ? (
            <>
              <Metric
                label="İndirimli Faiz Oranı"
                value={formatPercent((result.discountedMonthlyRate ?? 0) * 100, 3, 3)}
              />
              <Metric
                label="0. Taksit Peşin Faiz"
                value={formatCurrency(result.realizedPrepaidInterest ?? 0)}
              />
            </>
          ) : null}
          {isEqualPrincipal ? (
            <>
              <Metric label="Aylık Anapara" value={formatCurrency(result.monthlyPrincipalAmount ?? 0)} />
              <Metric label="İlk Taksit" value={formatCurrency(result.firstInstallmentAmount ?? 0)} />
              <Metric label="Son Taksit" value={formatCurrency(result.lastInstallmentAmount ?? 0)} />
            </>
          ) : null}
          {isCustomPayment ? (
            <>
              <Metric label="Özel Ödeme Sayısı" value={`${result.input.customPayments?.length ?? 0}`} />
              <Metric label="Son Taksit" value={formatCurrency(result.lastInstallmentAmount ?? 0)} />
            </>
          ) : null}
          {isInterestOnly ? (
            <>
              <Metric label="Anapara Ödemesiz Taksit Sayısı" value={`${result.interestOnlyInstallmentCount ?? 0}`} />
              <Metric label="Anapara Ödemesiz Dönem Taksiti" value={formatCurrency(getInterestOnlyPeriodInstallmentAmount(result))} />
              <Metric label="Sonraki Dönem Taksiti" value={formatCurrency(result.postInterestOnlyInstallmentAmount ?? 0)} />
              <Metric label="Son Taksit" value={formatCurrency(result.lastInstallmentAmount ?? 0)} />
            </>
          ) : null}
          {isIncreasingInstallment ? (
            <>
              <Metric label="Taksit Artış Oranı" value={formatPercent(result.installmentIncreaseRatePercent ?? 0)} />
              <Metric label="Artış Sıklığı" value={`${result.installmentIncreaseFrequencyMonths ?? 12} ay`} />
              <Metric label="Artış Başlangıç Taksiti" value={`${result.installmentIncreaseStartNo ?? 1}. taksit`} />
              <Metric label="Artış Bitiş Taksiti" value={`${result.installmentIncreaseEndNo ?? result.input.term}. taksit`} />
              <Metric label="İlk Taksit" value={formatCurrency(result.firstInstallmentAmount ?? result.firstInstallment)} />
              <Metric label="İlk Artış Sonrası Taksit" value={formatCurrency(getFirstIncreasedInstallmentAmount(result))} />
              <Metric label="Son Taksit" value={formatCurrency(result.lastInstallmentAmount ?? 0)} />
            </>
          ) : null}
          <Metric label="Toplam Faiz" value={formatCurrency(result.totalInterest)} />
          <Metric label="Toplam BSMV" value={formatCurrency(result.totalBsmv)} />
          <Metric label="Toplam KKDF" value={formatCurrency(result.totalKkdf)} />
          <Metric label="Toplam Ödeme" value={formatCurrency(result.totalPayment)} />
        </div>

        <div className={styles.dateStrip}>
          <div>
            <span>Kullanım</span>
            <strong>{formatDate(result.input.creditUsageDate)}</strong>
          </div>
          <div>
            <span>İlk Taksit</span>
            <strong>{formatDate(result.input.firstInstallmentDate)}</strong>
          </div>
        </div>

        {hasBrokenPeriod ? (
          <div className={styles.noteBox}>
            <strong>Kırık dönem farkı sadece 1. taksite yansıtıldı.</strong>
            <span>
              Gün farkı {result.brokenPeriod.diffDays}; faiz{" "}
              {formatCurrency(result.brokenPeriod.interestDiff)}, KKDF{" "}
              {formatCurrency(result.brokenPeriod.kkdfDiff)}, BSMV{" "}
              {formatCurrency(result.brokenPeriod.bsmvDiff)}.
            </span>
          </div>
        ) : null}

        {interestOnlyInfo ? (
          <div className={styles.noteBox}>
            <strong>Taksit sayısı bilgilendirmesi</strong>
            <span>{interestOnlyInfo}</span>
          </div>
        ) : null}

        {result.infoMessages?.length ? (
          <div className={styles.noteBox}>
            <strong>Taksit sayısı bilgilendirmesi</strong>
            {result.infoMessages.map((message) => (
              <span key={message}>{message}</span>
            ))}
          </div>
        ) : null}

        {isCustomPayment && result.input.customPayments?.length ? (
          <div className={styles.noteBox}>
            <strong>Özel Ödemeler</strong>
            <span>{formatCustomPaymentsSummary(result.input.customPayments)}</span>
          </div>
        ) : null}

        <button className={styles.pdfButton} type="button" onClick={onDownloadPdf}>
          PDF İndir
        </button>
      </div>

      <div className={styles.scheduleCard}>
        <button className={styles.scheduleToggle} type="button" onClick={onToggleSchedule}>
          <span>
            <strong>Ödeme Planı</strong>
            <small>{result.schedule.length} taksit detaylı amortisman tablosu</small>
          </span>
          <b>{isScheduleOpen ? "Kapat" : "Aç"}</b>
        </button>

        {isScheduleOpen ? (
          <div className={styles.scheduleWrap}>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tarih</th>
                  <th>Anapara</th>
                  <th>Faiz</th>
                  <th>KKDF</th>
                  <th>BSMV</th>
                  <th>Taksit</th>
                  <th>Kalan</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((item) => (
                  <tr key={`${item.installmentNumber}-${item.date.toISOString()}`}>
                    <td>
                      {item.installmentNumber === 0
                        ? "0."
                        : `${item.installmentNumber}.`}
                      {item.isCustomPayment ? " Özel" : ""}
                      {item.isInterestOnly ? " Faiz" : ""}
                    </td>
                    <td>{formatDate(item.date)}</td>
                    <td>{formatCurrency(item.principal)}</td>
                    <td>{formatCurrency(item.interest)}</td>
                    <td>{formatCurrency(item.kkdf)}</td>
                    <td>{formatCurrency(item.bsmv)}</td>
                    <td>{formatCurrency(item.installment)}</td>
                    <td>{formatCurrency(item.remainingPrincipal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ResultPanel;
