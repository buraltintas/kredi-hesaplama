import {
  PLAN_TYPE_LABELS,
  calculateLoan,
  formatCurrency,
  roundToCents,
} from "../loanEngine";

const MAX_RECOMMENDATIONS = 3;
const DEFAULT_PROGRESSIVE_RATE_PERCENT = 5;
const DEFAULT_PROGRESSIVE_FREQUENCY_MONTHS = 12;
const MIN_AMOUNT_DIFFERENCE = 100;

const buildComparableBaseInput = (input) => ({
  principal: input.principal,
  term: input.term,
  monthlyInterestRatePercent: input.monthlyInterestRatePercent,
  kkdfRatePercent: input.kkdfRatePercent,
  bsmvRatePercent: input.bsmvRatePercent,
  creditUsageDate: input.creditUsageDate,
  firstInstallmentDate: input.firstInstallmentDate,
  deductFirstInstallmentDelayFromTerm: input.deductFirstInstallmentDelayFromTerm === true,
});

const isProgressivePlan = (planType) =>
  planType === "increasingInstallment" || planType === "decreasingInstallment";

const calculateCandidate = (baseInput, planType) => {
  try {
    const candidateInput = {
      ...baseInput,
      planType,
    };

    if (isProgressivePlan(planType)) {
      if (baseInput.term <= 1) {
        return undefined;
      }

      candidateInput.installmentIncreaseRatePercent = DEFAULT_PROGRESSIVE_RATE_PERCENT;
      candidateInput.installmentIncreaseFrequencyMonths = Math.min(
        DEFAULT_PROGRESSIVE_FREQUENCY_MONTHS,
        baseInput.term
      );
      candidateInput.installmentIncreaseStartNo = 1;
      candidateInput.installmentIncreaseEndNo = baseInput.term;
    }

    return {
      planType,
      result: calculateLoan(candidateInput),
    };
  } catch {
    return undefined;
  }
};

const averageInstallment = (result, count) => {
  const regularRows = result.schedule.filter((item) => !item.isPrepaidInterest);
  const rows = regularRows.slice(0, Math.min(count, regularRows.length));

  if (rows.length === 0) {
    return 0;
  }

  const total = rows.reduce((sum, item) => roundToCents(sum + item.installment), 0);

  return roundToCents(total / rows.length);
};

const getFirstRegularInstallment = (result) =>
  result.schedule.find((item) => !item.isPrepaidInterest)?.installment ?? 0;

const getLastRegularInstallment = (result) => {
  const regularRows = result.schedule.filter((item) => !item.isPrepaidInterest);

  return regularRows[regularRows.length - 1]?.installment ?? 0;
};

const isMeaningfulAmount = (value) => Math.abs(value) >= MIN_AMOUNT_DIFFERENCE;

const buildComparison = (baseline, alternative) => ({
  totalPaymentDifference: roundToCents(alternative.totalPayment - baseline.totalPayment),
  totalInterestDifference: roundToCents(alternative.totalInterest - baseline.totalInterest),
  firstInstallmentDifference: roundToCents(
    getFirstRegularInstallment(alternative) - getFirstRegularInstallment(baseline)
  ),
  firstYearAverageDifference: roundToCents(
    averageInstallment(alternative, 12) - averageInstallment(baseline, 12)
  ),
});

const buildTotalPaymentText = (difference) => {
  if (difference < 0) {
    return `Toplam ödeme farkı: ${formatCurrency(Math.abs(difference))} daha düşük.`;
  }

  if (difference > 0) {
    return `Toplam ödeme farkı: ${formatCurrency(difference)} daha yüksek.`;
  }

  return "Toplam ödeme farkı yok denecek kadar az.";
};

const buildProgressiveAssumptionText = (alternative) => {
  if (!isProgressivePlan(alternative.planType)) {
    return undefined;
  }

  const label = alternative.planType === "increasingInstallment" ? "Artış" : "Azalış";

  return `${label} varsayımı: %${
    alternative.installmentIncreaseRatePercent ?? DEFAULT_PROGRESSIVE_RATE_PERCENT
  }, ${
    alternative.installmentIncreaseFrequencyMonths ?? DEFAULT_PROGRESSIVE_FREQUENCY_MONTHS
  } ayda bir, ${alternative.installmentIncreaseStartNo ?? 1}-${
    alternative.installmentIncreaseEndNo ?? alternative.input.term
  }. taksit aralığında.`;
};

const buildAlternativeDetails = (baseline, alternative, comparison) => {
  const details = [
    buildTotalPaymentText(comparison.totalPaymentDifference),
    `İlk taksit: ${formatCurrency(getFirstRegularInstallment(alternative))}`,
    `Son taksit: ${formatCurrency(getLastRegularInstallment(alternative))}`,
  ];
  const progressiveAssumptionText = buildProgressiveAssumptionText(alternative);

  if (progressiveAssumptionText) {
    details.push(progressiveAssumptionText);
  }

  details.push(
    `Karşılaştırma mevcut ${PLAN_TYPE_LABELS[baseline.planType]} sonucuna göre yapılmıştır.`
  );

  return details;
};

const createEqualPrincipalRecommendation = (baseline, alternative) => {
  const comparison = buildComparison(baseline, alternative);
  const firstDifference = comparison.firstInstallmentDifference;
  const totalDifference = comparison.totalPaymentDifference;

  if (totalDifference < -MIN_AMOUNT_DIFFERENCE) {
    return {
      id: "equal-principal-lower-total",
      planType: "equalPrincipal",
      title: "Eşit anapara alternatifi",
      message: `Eşit anapara planında toplam ödemeniz ${formatCurrency(
        Math.abs(totalDifference)
      )} daha düşük olabilir.`,
      details: buildAlternativeDetails(baseline, alternative, comparison),
      impact: "lowerTotalPayment",
      comparison,
      score: 100000 + Math.abs(totalDifference),
    };
  }

  if (isMeaningfulAmount(firstDifference)) {
    return {
      id: "equal-principal-structure",
      planType: "equalPrincipal",
      title: "Azalan taksit yapısı",
      message:
        "Eşit anapara planında ilk taksit daha yüksek, sonraki taksitler ise dönem dönem azalır.",
      details: buildAlternativeDetails(baseline, alternative, comparison),
      impact: "paymentStructure",
      comparison,
      score: 30000 + Math.abs(firstDifference),
    };
  }

  return undefined;
};

const createIncreasingInstallmentRecommendation = (baseline, alternative) => {
  const comparison = buildComparison(baseline, alternative);
  const firstYearDifference = comparison.firstYearAverageDifference;
  const totalDifference = comparison.totalPaymentDifference;

  if (firstYearDifference < -MIN_AMOUNT_DIFFERENCE) {
    const totalText =
      totalDifference > MIN_AMOUNT_DIFFERENCE
        ? `; ancak toplam ödemeniz ${formatCurrency(totalDifference)} artar`
        : totalDifference < -MIN_AMOUNT_DIFFERENCE
        ? ` ve toplam ödemeniz ${formatCurrency(Math.abs(totalDifference))} düşer`
        : "";

    return {
      id: "increasing-installment-lower-initial",
      planType: "increasingInstallment",
      title: "Artan taksitli alternatif",
      message: `Artan taksitli planda ilk 12 ay ortalama taksitiniz yaklaşık ${formatCurrency(
        Math.abs(firstYearDifference)
      )} daha düşük olabilir${totalText}.`,
      details: buildAlternativeDetails(baseline, alternative, comparison),
      impact: "lowerInitialInstallment",
      comparison,
      score: 80000 + Math.abs(firstYearDifference),
    };
  }

  return undefined;
};

const createDecreasingInstallmentRecommendation = (baseline, alternative) => {
  const comparison = buildComparison(baseline, alternative);
  const firstDifference = comparison.firstInstallmentDifference;
  const lastInstallment = getLastRegularInstallment(alternative);
  const baselineLastInstallment = getLastRegularInstallment(baseline);
  const lastDifference = roundToCents(lastInstallment - baselineLastInstallment);

  if (
    firstDifference > MIN_AMOUNT_DIFFERENCE &&
    lastDifference < -MIN_AMOUNT_DIFFERENCE
  ) {
    return {
      id: "decreasing-installment-structure",
      planType: "decreasingInstallment",
      title: "Azalan taksitli alternatif",
      message:
        "Azalan taksitli planda ilk taksit daha yüksek, sonraki taksitler ise giderek daha düşük olur.",
      details: buildAlternativeDetails(baseline, alternative, comparison),
      impact: "paymentStructure",
      comparison,
      score: 35000 + Math.abs(lastDifference),
    };
  }

  if (comparison.totalPaymentDifference < -MIN_AMOUNT_DIFFERENCE) {
    return {
      id: "decreasing-installment-lower-total",
      planType: "decreasingInstallment",
      title: "Azalan taksitli alternatif",
      message: `Azalan taksitli planda toplam ödemeniz ${formatCurrency(
        Math.abs(comparison.totalPaymentDifference)
      )} daha düşük olabilir.`,
      details: buildAlternativeDetails(baseline, alternative, comparison),
      impact: "lowerTotalPayment",
      comparison,
      score: 90000 + Math.abs(comparison.totalPaymentDifference),
    };
  }

  return undefined;
};

const createStandardRecommendation = (baseline, alternative) => {
  if (baseline.planType === "standard") {
    return undefined;
  }

  const comparison = buildComparison(baseline, alternative);
  const firstDifference = comparison.firstInstallmentDifference;

  if (
    !isMeaningfulAmount(firstDifference) &&
    !isMeaningfulAmount(comparison.totalPaymentDifference)
  ) {
    return undefined;
  }

  return {
    id: "standard-balanced-installment",
    planType: "standard",
    title: "Standart plan karşılaştırması",
    message:
      "Standart sabit taksitli plan, mevcut plana göre daha dengeli bir aylık ödeme sunabilir.",
    details: buildAlternativeDetails(baseline, alternative, comparison),
    impact: "balancedInstallment",
    comparison,
    score: 50000 + Math.abs(firstDifference),
  };
};

const createRecommendation = (baseline, candidate) => {
  if (candidate.planType === baseline.planType) {
    return undefined;
  }

  if (candidate.planType === "standard") {
    return createStandardRecommendation(baseline, candidate.result);
  }

  if (candidate.planType === "equalPrincipal") {
    return createEqualPrincipalRecommendation(baseline, candidate.result);
  }

  if (candidate.planType === "increasingInstallment") {
    return createIncreasingInstallmentRecommendation(baseline, candidate.result);
  }

  if (candidate.planType === "decreasingInstallment") {
    return createDecreasingInstallmentRecommendation(baseline, candidate.result);
  }

  return undefined;
};

export const getPaymentPlanRecommendations = (baseline) => {
  const baseInput = buildComparableBaseInput(baseline.input);
  const candidatePlanTypes = [
    "standard",
    "equalPrincipal",
    "increasingInstallment",
    "decreasingInstallment",
  ];
  const recommendations = candidatePlanTypes
    .map((planType) => calculateCandidate(baseInput, planType))
    .filter(Boolean)
    .map((candidate) => createRecommendation(baseline, candidate))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECOMMENDATIONS);

  return recommendations.map(({ score: _score, ...recommendation }) => recommendation);
};
