import React, { useMemo, useState } from "react";
import styles from "./App.module.css";
import NumberInput from "./components/NumberInput";
import ResultPanel from "./components/ResultPanel";
import Footer from "./Footer";
import { downloadLoanPdf } from "./pdfDownload";
import {
  LOAN_TYPES,
  PLAN_TYPE_LABELS,
  addMonths,
  buildCustomPaymentsFromRows,
  calculateLoan,
  formatCurrency,
  formatDateForInput,
  parseInputDate,
  parseInstallmentIncreaseBoundary,
  parseInstallmentIncreaseFrequencyMonths,
  parseInstallmentIncreaseRatePercent,
  parseInterestOnlyInstallmentCount,
  parseNumericInput,
  startOfLocalDay,
} from "./loanEngine";

const RECENT_CALCULATIONS_KEY = "bankaci-web-recent-calculations";
const CONTACT_PREFS_KEY = "bankaci-web-pdf-contact";
const today = startOfLocalDay(new Date());

const createCustomPaymentRow = () => ({
  id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  installmentNo: "",
  amount: "",
});

const readJson = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const reviveFormDates = (form) => ({
  ...form,
  creditUsageDate: parseInputDate(form.creditUsageDate) ?? today,
  firstInstallmentDate: parseInputDate(form.firstInstallmentDate) ?? addMonths(today, 1),
});

const safeRecentCalculations = () =>
  readJson(RECENT_CALCULATIONS_KEY, []).map((item) => ({
    ...item,
    form: reviveFormDates(item.form),
  }));

const getInitialContactPrefs = () =>
  readJson(CONTACT_PREFS_KEY, {
    includeContactInfo: false,
    fullName: "",
    phone: "",
  });

function App() {
  const contactPrefs = useMemo(getInitialContactPrefs, []);
  const [loanType, setLoanType] = useState("Bireysel İhtiyaç/Taşıt Kredisi");
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [kkdf, setKkdf] = useState("15");
  const [bsmv, setBsmv] = useState("15");
  const [planType, setPlanType] = useState("standard");
  const [prepaidInterestAmount, setPrepaidInterestAmount] = useState("");
  const [interestOnlyInstallmentCount, setInterestOnlyInstallmentCount] = useState("");
  const [installmentIncreaseRatePercent, setInstallmentIncreaseRatePercent] = useState("");
  const [installmentIncreaseFrequencyMonths, setInstallmentIncreaseFrequencyMonths] =
    useState("12");
  const [installmentIncreaseStartNo, setInstallmentIncreaseStartNo] = useState("1");
  const [installmentIncreaseEndNo, setInstallmentIncreaseEndNo] = useState("");
  const [customPaymentRows, setCustomPaymentRows] = useState([createCustomPaymentRow()]);
  const [creditUsageDate, setCreditUsageDate] = useState(today);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(addMonths(today, 1));
  const [deductFirstInstallmentDelayFromTerm, setDeductFirstInstallmentDelayFromTerm] =
    useState(false);
  const [includeContactInfo, setIncludeContactInfo] = useState(
    contactPrefs.includeContactInfo
  );
  const [contactFullName, setContactFullName] = useState(contactPrefs.fullName);
  const [contactPhone, setContactPhone] = useState(contactPrefs.phone);
  const [recentCalculations, setRecentCalculations] = useState(safeRecentCalculations);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");

  const clearResult = () => {
    setResult(null);
    setFormError("");
    setIsScheduleOpen(false);
  };

  const saveContactPrefs = (next) => {
    window.localStorage.setItem(CONTACT_PREFS_KEY, JSON.stringify(next));
  };

  const updateRecentCalculations = (form, nextResult) => {
    const summary = {
      principal: nextResult.input.principal,
      term: nextResult.input.term,
      planType: nextResult.planType,
      standardInstallment: nextResult.standardInstallment,
      firstInstallment: nextResult.firstInstallment,
      firstInstallmentAmount: nextResult.firstInstallmentAmount,
      lastInstallmentAmount: nextResult.lastInstallmentAmount,
      automaticInstallmentAmount: nextResult.automaticInstallmentAmount,
      customPaymentCount: nextResult.input.customPayments?.length,
      postInterestOnlyInstallmentAmount: nextResult.postInterestOnlyInstallmentAmount,
      interestOnlyInstallmentCount: nextResult.interestOnlyInstallmentCount,
      installmentIncreaseRatePercent: nextResult.installmentIncreaseRatePercent,
      installmentIncreaseFrequencyMonths: nextResult.installmentIncreaseFrequencyMonths,
      installmentIncreaseStartNo: nextResult.installmentIncreaseStartNo,
      installmentIncreaseEndNo: nextResult.installmentIncreaseEndNo,
      deductFirstInstallmentDelayFromTerm: nextResult.deductFirstInstallmentDelayFromTerm,
      deductedDelayMonths: nextResult.deductedDelayMonths,
      realizedPrepaidInterest: nextResult.realizedPrepaidInterest,
    };
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      form: {
        ...form,
        creditUsageDate: formatDateForInput(form.creditUsageDate),
        firstInstallmentDate: formatDateForInput(form.firstInstallmentDate),
      },
      summary,
    };
    const next = [record, ...recentCalculations].slice(0, 20);

    setRecentCalculations(next.map((item) => ({ ...item, form: reviveFormDates(item.form) })));
    window.localStorage.setItem(RECENT_CALCULATIONS_KEY, JSON.stringify(next));
  };

  const buildFormSnapshot = () => ({
    loanType,
    amount,
    interestRate,
    bsmv,
    kkdf,
    term,
    planType,
    prepaidInterestAmount,
    interestOnlyInstallmentCount,
    installmentIncreaseRatePercent,
    installmentIncreaseFrequencyMonths,
    installmentIncreaseStartNo,
    installmentIncreaseEndNo,
    deductFirstInstallmentDelayFromTerm,
    customPayments: customPaymentRows.map(({ installmentNo, amount: paymentAmount }) => ({
      installmentNo,
      amount: paymentAmount,
    })),
    creditUsageDate,
    firstInstallmentDate,
  });

  const applyFormSnapshot = (formSnapshot) => {
    setLoanType(formSnapshot.loanType);
    setAmount(formSnapshot.amount);
    setInterestRate(formSnapshot.interestRate);
    setBsmv(formSnapshot.bsmv);
    setKkdf(formSnapshot.kkdf);
    setTerm(formSnapshot.term);
    setPlanType(formSnapshot.planType ?? "standard");
    setPrepaidInterestAmount(formSnapshot.prepaidInterestAmount ?? "");
    setInterestOnlyInstallmentCount(formSnapshot.interestOnlyInstallmentCount ?? "");
    setInstallmentIncreaseRatePercent(formSnapshot.installmentIncreaseRatePercent ?? "");
    setInstallmentIncreaseFrequencyMonths(
      formSnapshot.installmentIncreaseFrequencyMonths ?? "12"
    );
    setInstallmentIncreaseStartNo(formSnapshot.installmentIncreaseStartNo ?? "1");
    setInstallmentIncreaseEndNo(formSnapshot.installmentIncreaseEndNo ?? "");
    setDeductFirstInstallmentDelayFromTerm(
      formSnapshot.deductFirstInstallmentDelayFromTerm === true
    );
    setCustomPaymentRows(
      formSnapshot.customPayments?.length
        ? formSnapshot.customPayments.map((payment) => ({
            id: createCustomPaymentRow().id,
            installmentNo: payment.installmentNo,
            amount: payment.amount,
          }))
        : [createCustomPaymentRow()]
    );
    setCreditUsageDate(formSnapshot.creditUsageDate);
    setFirstInstallmentDate(formSnapshot.firstInstallmentDate);
    setFormError("");
  };

  const buildLoanInput = () => {
    const principal = parseNumericInput(amount, "money");
    const monthlyRate = parseNumericInput(interestRate, "decimal");
    const kkdfRate = parseNumericInput(kkdf, "decimal");
    const bsmvRate = parseNumericInput(bsmv, "decimal");
    const termCount = parseNumericInput(term, "integer");
    const prepaidInterest = parseNumericInput(prepaidInterestAmount, "money");

    if (!principal.isValid || !principal.value || principal.value <= 0) {
      throw new Error("Lütfen geçerli bir kredi tutarı girin.");
    }

    if (!termCount.isValid || !termCount.value) {
      throw new Error("Vade pozitif tam sayı olmalıdır.");
    }

    if (!monthlyRate.isValid || monthlyRate.value === null) {
      throw new Error("Lütfen geçerli bir faiz oranı girin.");
    }

    if (
      !kkdfRate.isValid ||
      kkdfRate.value === null ||
      !bsmvRate.isValid ||
      bsmvRate.value === null
    ) {
      throw new Error("KKDF ve BSMV oranları geçerli olmalıdır.");
    }

    if (planType === "prepaidInterest") {
      if (!prepaidInterest.isValid || !prepaidInterest.value || prepaidInterest.value <= 0) {
        throw new Error("Lütfen geçerli bir peşin faiz tutarı girin.");
      }

      if (prepaidInterest.value >= principal.value) {
        throw new Error("Peşin faiz tutarı kredi tutarından küçük olmalıdır.");
      }
    }

    return {
      principal: principal.value,
      term: termCount.value,
      monthlyInterestRatePercent: monthlyRate.value,
      kkdfRatePercent: kkdfRate.value,
      bsmvRatePercent: bsmvRate.value,
      creditUsageDate,
      firstInstallmentDate,
      deductFirstInstallmentDelayFromTerm,
      planType,
      prepaidInterestAmount: planType === "prepaidInterest" ? prepaidInterest.value : undefined,
      interestOnlyInstallmentCount:
        planType === "interestOnly"
          ? parseInterestOnlyInstallmentCount(interestOnlyInstallmentCount, termCount.value)
          : undefined,
      installmentIncreaseRatePercent:
        planType === "increasingInstallment"
          ? parseInstallmentIncreaseRatePercent(installmentIncreaseRatePercent)
          : undefined,
      installmentIncreaseFrequencyMonths:
        planType === "increasingInstallment"
          ? parseInstallmentIncreaseFrequencyMonths(
              installmentIncreaseFrequencyMonths,
              termCount.value
            )
          : undefined,
      installmentIncreaseStartNo:
        planType === "increasingInstallment"
          ? parseInstallmentIncreaseBoundary(
              installmentIncreaseStartNo,
              termCount.value,
              "başlangıç"
            )
          : undefined,
      installmentIncreaseEndNo:
        planType === "increasingInstallment"
          ? parseInstallmentIncreaseBoundary(
              installmentIncreaseEndNo || String(termCount.value),
              termCount.value,
              "bitiş"
            )
          : undefined,
      customPayments:
        planType === "customPayment"
          ? buildCustomPaymentsFromRows(
              customPaymentRows.map(({ installmentNo, amount: paymentAmount }) => ({
                installmentNo,
                amount: paymentAmount,
              })),
              termCount.value
            )
          : undefined,
    };
  };

  const handleLoanTypeChange = (type) => {
    setLoanType(type);
    setBsmv(LOAN_TYPES[type].bsmv.toString());
    setKkdf(LOAN_TYPES[type].kkdf.toString());
    clearResult();
  };

  const handleCalculate = (event) => {
    event.preventDefault();

    try {
      const formSnapshot = buildFormSnapshot();
      const nextResult = calculateLoan(buildLoanInput());

      setResult(nextResult);
      setFormError("");
      setIsScheduleOpen(false);
      updateRecentCalculations(formSnapshot, nextResult);
    } catch (error) {
      setResult(null);
      setFormError(error instanceof Error ? error.message : "Hesaplama sırasında bir hata oluştu.");
    }
  };

  const handleDownloadPdf = async (targetResult = result) => {
    if (!targetResult) {
      return;
    }

    if (includeContactInfo && (!contactFullName.trim() || !contactPhone.trim())) {
      setFormError("PDF için isim soyisim ve telefon numarası girin.");
      return;
    }

    try {
      await downloadLoanPdf(
        targetResult,
        includeContactInfo
          ? {
              fullName: contactFullName.trim(),
              phone: contactPhone.trim(),
            }
          : undefined
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "PDF oluşturulurken bir hata oluştu."
      );
    }
  };

  const handleCreditUsageDateChange = (value) => {
    const nextDate = parseInputDate(value);

    if (!nextDate) {
      return;
    }

    setCreditUsageDate(nextDate);

    if (firstInstallmentDate < nextDate) {
      setFirstInstallmentDate(addMonths(nextDate, 1));
    }

    clearResult();
  };

  const handleFirstInstallmentDateChange = (value) => {
    const nextDate = parseInputDate(value);

    if (!nextDate) {
      return;
    }

    setFirstInstallmentDate(nextDate);
    clearResult();
  };

  const openRecentCalculation = (recentCalculation) => {
    try {
      const form = reviveFormDates(recentCalculation.form);
      applyFormSnapshot(form);
      const nextResult = calculateLoan({
        principal: recentCalculation.summary.principal,
        term: recentCalculation.summary.term,
        monthlyInterestRatePercent: Number(form.interestRate.replace(",", ".")),
        kkdfRatePercent: Number(form.kkdf.replace(",", ".")),
        bsmvRatePercent: Number(form.bsmv.replace(",", ".")),
        creditUsageDate: form.creditUsageDate,
        firstInstallmentDate: form.firstInstallmentDate,
        deductFirstInstallmentDelayFromTerm:
          form.deductFirstInstallmentDelayFromTerm === true,
        planType: form.planType ?? "standard",
        prepaidInterestAmount:
          form.planType === "prepaidInterest"
            ? parseNumericInput(form.prepaidInterestAmount ?? "", "money").value
            : undefined,
        interestOnlyInstallmentCount:
          form.planType === "interestOnly"
            ? parseInterestOnlyInstallmentCount(
                form.interestOnlyInstallmentCount ?? "",
                recentCalculation.summary.term
              )
            : undefined,
        installmentIncreaseRatePercent:
          form.planType === "increasingInstallment"
            ? parseInstallmentIncreaseRatePercent(form.installmentIncreaseRatePercent ?? "")
            : undefined,
        installmentIncreaseFrequencyMonths:
          form.planType === "increasingInstallment"
            ? parseInstallmentIncreaseFrequencyMonths(
                form.installmentIncreaseFrequencyMonths ?? "12",
                recentCalculation.summary.term
              )
            : undefined,
        installmentIncreaseStartNo:
          form.planType === "increasingInstallment"
            ? parseInstallmentIncreaseBoundary(
                form.installmentIncreaseStartNo ?? "1",
                recentCalculation.summary.term,
                "başlangıç"
              )
            : undefined,
        installmentIncreaseEndNo:
          form.planType === "increasingInstallment"
            ? parseInstallmentIncreaseBoundary(
                form.installmentIncreaseEndNo ?? String(recentCalculation.summary.term),
                recentCalculation.summary.term,
                "bitiş"
              )
            : undefined,
        customPayments:
          form.planType === "customPayment"
            ? buildCustomPaymentsFromRows(form.customPayments ?? [], recentCalculation.summary.term)
            : undefined,
      });

      setResult(nextResult);
      setIsScheduleOpen(false);
      setFormError("");
    } catch {
      setFormError("Bu hesaplama tekrar açılamadı. Lütfen yeniden hesaplayın.");
    }
  };

  const deleteRecentCalculation = (id) => {
    const next = recentCalculations.filter((item) => item.id !== id);

    setRecentCalculations(next);
    window.localStorage.setItem(
      RECENT_CALCULATIONS_KEY,
      JSON.stringify(
        next.map((item) => ({
          ...item,
          form: {
            ...item.form,
            creditUsageDate: formatDateForInput(item.form.creditUsageDate),
            firstInstallmentDate: formatDateForInput(item.form.firstInstallmentDate),
          },
        }))
      )
    );
  };

  const getRecentInstallmentSummary = (recentCalculation) => {
    const recentPlanType = recentCalculation.form.planType ?? "standard";

    if (recentPlanType === "customPayment") {
      return `${recentCalculation.summary.customPaymentCount ?? 0} özel ödeme`;
    }

    if (["equalPrincipal", "increasingInstallment"].includes(recentPlanType)) {
      return `İlk / Son ${formatCurrency(
        recentCalculation.summary.firstInstallmentAmount ??
          recentCalculation.summary.firstInstallment
      )} / ${formatCurrency(
        recentCalculation.summary.lastInstallmentAmount ??
          recentCalculation.summary.firstInstallment
      )}`;
    }

    if (recentPlanType === "interestOnly") {
      return `Sonraki dönem ${formatCurrency(
        recentCalculation.summary.postInterestOnlyInstallmentAmount ?? 0
      )}`;
    }

    return `Aylık ${formatCurrency(recentCalculation.summary.standardInstallment)}`;
  };

  const handleContactToggle = () => {
    const next = {
      includeContactInfo: !includeContactInfo,
      fullName: contactFullName,
      phone: contactPhone,
    };

    setIncludeContactInfo(next.includeContactInfo);
    saveContactPrefs(next);
  };

  return (
    <div className={styles.appShell}>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <span>Bankacı</span>
            <h1>Kredi Hesaplama</h1>
          </div>
          <p>
            Standart, peşin faizli, eşit anapara, balon/özel ödeme, anapara
            ödemesiz ve artan taksitli planlar.
          </p>
        </header>

        <form className={styles.layout} onSubmit={handleCalculate}>
          <section className={styles.formStack}>
            <div className={styles.card}>
              <h2>Kredi Bilgileri</h2>

              <div className={styles.field}>
                <span>Kredi Tipi</span>
                <div className={styles.segmentGroup}>
                  {Object.keys(LOAN_TYPES).map((type) => (
                    <button
                      key={type}
                      className={loanType === type ? styles.segmentSelected : ""}
                      type="button"
                      onClick={() => handleLoanTypeChange(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.twoColumn}>
                <NumberInput
                  label="Kredi Tutarı (TL)"
                  mode="money"
                  value={amount}
                  onChange={(value) => {
                    setAmount(value);
                    clearResult();
                  }}
                  placeholder="ör: 125.000"
                />
                <NumberInput
                  label="Vade (Ay)"
                  mode="integer"
                  value={term}
                  onChange={(value) => {
                    setTerm(value);
                    clearResult();
                  }}
                  placeholder="ör: 12"
                />
              </div>

              <NumberInput
                label="Aylık Faiz Oranı (%)"
                value={interestRate}
                onChange={(value) => {
                  setInterestRate(value);
                  clearResult();
                }}
                placeholder="ör: 3,49"
              />

              <div className={styles.twoColumn}>
                <NumberInput
                  label="KKDF (%)"
                  value={kkdf}
                  disabled={loanType !== "Özel"}
                  onChange={(value) => {
                    setKkdf(value);
                    clearResult();
                  }}
                />
                <NumberInput
                  label="BSMV (%)"
                  value={bsmv}
                  disabled={loanType !== "Özel"}
                  onChange={(value) => {
                    setBsmv(value);
                    clearResult();
                  }}
                />
              </div>

              <div className={styles.field}>
                <span>Ödeme Planı Tipi</span>
                <div className={styles.planGrid}>
                  {Object.entries(PLAN_TYPE_LABELS).map(([type, label]) => (
                    <button
                      key={type}
                      className={planType === type ? styles.segmentSelected : ""}
                      type="button"
                      onClick={() => {
                        setPlanType(type);
                        clearResult();
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {planType === "prepaidInterest" ? (
                <NumberInput
                  label="Peşin Faiz Tutarı (TL)"
                  mode="money"
                  value={prepaidInterestAmount}
                  onChange={(value) => {
                    setPrepaidInterestAmount(value);
                    clearResult();
                  }}
                  placeholder="ör: 50.000"
                />
              ) : null}

              {planType === "interestOnly" ? (
                <NumberInput
                  label="Anapara Ödemesiz Taksit Sayısı"
                  mode="integer"
                  value={interestOnlyInstallmentCount}
                  onChange={(value) => {
                    setInterestOnlyInstallmentCount(value);
                    clearResult();
                  }}
                  placeholder="ör: 6"
                />
              ) : null}

              {planType === "increasingInstallment" ? (
                <>
                  <div className={styles.twoColumn}>
                    <NumberInput
                      label="Taksit Artış Oranı (%)"
                      value={installmentIncreaseRatePercent}
                      onChange={(value) => {
                        setInstallmentIncreaseRatePercent(value);
                        clearResult();
                      }}
                      placeholder="ör: 5"
                    />
                    <NumberInput
                      label="Artış Sıklığı (Ay)"
                      mode="integer"
                      value={installmentIncreaseFrequencyMonths}
                      onChange={(value) => {
                        setInstallmentIncreaseFrequencyMonths(value);
                        clearResult();
                      }}
                      placeholder="ör: 12"
                    />
                  </div>
                  <div className={styles.twoColumn}>
                    <NumberInput
                      label="Artış Başlangıç Taksiti"
                      mode="integer"
                      value={installmentIncreaseStartNo}
                      onChange={(value) => {
                        setInstallmentIncreaseStartNo(value);
                        clearResult();
                      }}
                      placeholder="ör: 1"
                    />
                    <NumberInput
                      label="Artış Bitiş Taksiti"
                      mode="integer"
                      value={installmentIncreaseEndNo}
                      onChange={(value) => {
                        setInstallmentIncreaseEndNo(value);
                        clearResult();
                      }}
                      placeholder="ör: 60"
                    />
                  </div>
                </>
              ) : null}

              {planType === "customPayment" ? (
                <div className={styles.customPayments}>
                  <div className={styles.inlineHeader}>
                    <h3>Özel Ödemeler</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPaymentRows((rows) => [...rows, createCustomPaymentRow()]);
                        clearResult();
                      }}
                    >
                      Satır Ekle
                    </button>
                  </div>
                  {customPaymentRows.map((row) => (
                    <div className={styles.customPaymentRow} key={row.id}>
                      <NumberInput
                        label="Taksit No"
                        mode="integer"
                        value={row.installmentNo}
                        onChange={(value) => {
                          setCustomPaymentRows((rows) =>
                            rows.map((item) =>
                              item.id === row.id ? { ...item, installmentNo: value } : item
                            )
                          );
                          clearResult();
                        }}
                        placeholder="ör: 6"
                      />
                      <NumberInput
                        label="Tutar"
                        mode="money"
                        value={row.amount}
                        onChange={(value) => {
                          setCustomPaymentRows((rows) =>
                            rows.map((item) =>
                              item.id === row.id ? { ...item, amount: value } : item
                            )
                          );
                          clearResult();
                        }}
                        placeholder="ör: 50.000"
                      />
                      <button
                        className={styles.iconButton}
                        disabled={customPaymentRows.length === 1}
                        type="button"
                        title="Satırı sil"
                        onClick={() => {
                          setCustomPaymentRows((rows) =>
                            rows.length > 1 ? rows.filter((item) => item.id !== row.id) : rows
                          );
                          clearResult();
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={styles.card}>
              <h2>Tarih Bilgileri</h2>
              <div className={styles.twoColumn}>
                <label className={styles.field}>
                  <span>Kredi Kullanım Tarihi</span>
                  <input
                    type="date"
                    value={formatDateForInput(creditUsageDate)}
                    onChange={(event) => handleCreditUsageDateChange(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>İlk Taksit Tarihi</span>
                  <input
                    min={formatDateForInput(creditUsageDate)}
                    type="date"
                    value={formatDateForInput(firstInstallmentDate)}
                    onChange={(event) => handleFirstInstallmentDateChange(event.target.value)}
                  />
                </label>
              </div>
              <button
                className={styles.contactToggle}
                type="button"
                onClick={() => {
                  setDeductFirstInstallmentDelayFromTerm((value) => !value);
                  clearResult();
                }}
              >
                <span>
                  <strong>İlk taksit ertelemesini vadeden düş</strong>
                  <small>Normal ilk taksit tarihinden sonraki ertelemeyi ödeme planı taksit sayısından düşer.</small>
                </span>
                <b>{deductFirstInstallmentDelayFromTerm ? "Açık" : "Kapalı"}</b>
              </button>
            </div>

            <div className={styles.card}>
              <button className={styles.contactToggle} type="button" onClick={handleContactToggle}>
                <span>
                  <strong>PDF İletişim Bilgisi</strong>
                  <small>İstenirse PDF çıktısına iletişim bilgisi eklenir.</small>
                </span>
                <b>{includeContactInfo ? "Açık" : "Kapalı"}</b>
              </button>
              {includeContactInfo ? (
                <div className={styles.twoColumn}>
                  <label className={styles.field}>
                    <span>İsim Soyisim</span>
                    <input
                      value={contactFullName}
                      placeholder="ör: Ad Soyad"
                      onChange={(event) => {
                        const fullName = event.target.value;
                        setContactFullName(fullName);
                        saveContactPrefs({
                          includeContactInfo,
                          fullName,
                          phone: contactPhone,
                        });
                      }}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Telefon No</span>
                    <input
                      value={contactPhone}
                      placeholder="ör: 05xx xxx xx xx"
                      onChange={(event) => {
                        const phone = event.target.value.replace(/[^0-9+() -]/g, "");
                        setContactPhone(phone);
                        saveContactPrefs({
                          includeContactInfo,
                          fullName: contactFullName,
                          phone,
                        });
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            {recentCalculations.length ? (
              <div className={styles.card}>
                <button
                  className={styles.recentToggle}
                  type="button"
                  onClick={() => setIsRecentOpen((value) => !value)}
                >
                  <span>
                    <strong>Son 20 Hesaplama</strong>
                    <small>Eski hesaplamaları tekrar açıp PDF indirebilirsiniz.</small>
                  </span>
                  <b>{isRecentOpen ? "Kapat" : "Aç"}</b>
                </button>
                {isRecentOpen ? (
                  <div className={styles.recentList}>
                    {recentCalculations.map((recentCalculation) => (
                      <article className={styles.recentItem} key={recentCalculation.id}>
                        <div>
                          <strong>
                            {formatCurrency(recentCalculation.summary.principal)} ·{" "}
                            {recentCalculation.summary.term} ay
                          </strong>
                          <span>
                            {getRecentInstallmentSummary(recentCalculation)} · %
                            {recentCalculation.form.interestRate} faiz
                          </span>
                          <span>{PLAN_TYPE_LABELS[recentCalculation.form.planType ?? "standard"]}</span>
                          <small>
                            {new Date(recentCalculation.createdAt).toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                        <div className={styles.recentActions}>
                          <button type="button" onClick={() => openRecentCalculation(recentCalculation)}>
                            Görüntüle
                          </button>
                          <button type="button" onClick={() => deleteRecentCalculation(recentCalculation.id)}>
                            Sil
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {formError ? <div className={styles.errorBox}>{formError}</div> : null}

            <button className={styles.calculateButton} type="submit">
              Hesapla
            </button>
          </section>

          <aside className={styles.resultColumn}>
            {result ? (
              <ResultPanel
                result={result}
                onDownloadPdf={() => handleDownloadPdf(result)}
                isScheduleOpen={isScheduleOpen}
                onToggleSchedule={() => setIsScheduleOpen((value) => !value)}
              />
            ) : (
              <div className={styles.emptyState}>
                <strong>Henüz hesaplama yok</strong>
                <span>Kredi bilgilerini girip hesapladığınızda özet ve ödeme planı burada görünür.</span>
              </div>
            )}
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default App;
