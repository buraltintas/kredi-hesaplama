import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PLAN_TYPE_LABELS,
  formatCurrency,
  formatCustomPaymentsSummary,
  formatDate,
  formatDateForFileName,
  formatPercent,
  getFirstIncreasedInstallmentAmount,
  getInterestOnlyEffectiveInstallmentInfo,
  getInterestOnlyPeriodInstallmentAmount,
} from "./loanEngine";

const PDF_FONT_NAME = "BankaciPdf";
const PDF_FONT_URL = `${process.env.PUBLIC_URL || ""}/fonts/SpaceMono-Regular.ttf`;

let pdfFontReady = false;

const createShortId = () => Math.random().toString(36).slice(2, 8);

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return window.btoa(binary);
};

const registerPdfFont = async (doc) => {
  if (pdfFontReady) {
    doc.setFont(PDF_FONT_NAME, "normal");
    return;
  }

  const response = await fetch(PDF_FONT_URL);

  if (!response.ok) {
    throw new Error("PDF font dosyası yüklenemedi.");
  }

  const fontBase64 = arrayBufferToBase64(await response.arrayBuffer());

  doc.addFileToVFS("SpaceMono-Regular.ttf", fontBase64);
  doc.addFont("SpaceMono-Regular.ttf", PDF_FONT_NAME, "normal");
  doc.addFont("SpaceMono-Regular.ttf", PDF_FONT_NAME, "bold");
  pdfFontReady = true;
  doc.setFont(PDF_FONT_NAME, "normal");
};

export const createLoanPdfFileName = (result, id = createShortId()) => {
  const principal = Math.round(result.input.principal).toString().replace(/\D/g, "");
  const creditUsageDate = formatDateForFileName(result.input.creditUsageDate);
  const firstInstallmentDate = formatDateForFileName(result.input.firstInstallmentDate);

  return [
    "kredi-odeme-plani",
    `${principal}tl`,
    `${result.input.term}ay`,
    `kullanim-${creditUsageDate}`,
    `ilk-${firstInstallmentDate}`,
    id,
  ].join("-") + ".pdf";
};

const getSummaryRows = (result) => {
  const rows = [
    ["Kredi kullanım tarihi", formatDate(result.input.creditUsageDate)],
    ["İlk taksit tarihi", formatDate(result.input.firstInstallmentDate)],
    ["Kredi tutarı", formatCurrency(result.input.principal)],
    ["Vade", `${result.input.term} ay`],
    ["Ödeme planı tipi", PLAN_TYPE_LABELS[result.planType]],
    [
      result.planType === "prepaidInterest" ? "Baz aylık faiz oranı" : "Aylık faiz oranı",
      formatPercent(result.input.monthlyInterestRatePercent),
    ],
    ["KKDF / BSMV", `%${result.input.kkdfRatePercent} / %${result.input.bsmvRatePercent}`],
  ];

  if (result.planType === "prepaidInterest") {
    rows.push(
      ["İndirimli faiz oranı", formatPercent((result.discountedMonthlyRate ?? 0) * 100, 3, 3)],
      ["0. taksit peşin faiz", formatCurrency(result.realizedPrepaidInterest ?? 0)]
    );
  }

  if (result.planType === "equalPrincipal") {
    rows.push(
      ["Aylık anapara", formatCurrency(result.monthlyPrincipalAmount ?? 0)],
      ["İlk taksit", formatCurrency(result.firstInstallmentAmount ?? result.firstInstallment)],
      ["Son taksit", formatCurrency(result.lastInstallmentAmount ?? 0)]
    );
  }

  if (result.planType === "customPayment") {
    rows.push(
      ["Özel ödeme sayısı", `${result.input.customPayments?.length ?? 0}`],
      ["Son taksit", formatCurrency(result.lastInstallmentAmount ?? 0)]
    );
  }

  if (result.planType === "interestOnly") {
    rows.push(
      ["Anapara ödemesiz taksit sayısı", `${result.interestOnlyInstallmentCount ?? 0}`],
      ["Anapara ödemesiz dönem taksiti", formatCurrency(getInterestOnlyPeriodInstallmentAmount(result))],
      ["Sonraki dönem taksiti", formatCurrency(result.postInterestOnlyInstallmentAmount ?? 0)],
      ["Son taksit", formatCurrency(result.lastInstallmentAmount ?? 0)]
    );
  }

  if (result.planType === "increasingInstallment") {
    rows.push(
      ["Taksit artış oranı", formatPercent(result.installmentIncreaseRatePercent ?? 0)],
      ["Artış sıklığı", `${result.installmentIncreaseFrequencyMonths ?? 12} ay`],
      ["Artış başlangıç taksiti", `${result.installmentIncreaseStartNo ?? 1}. taksit`],
      ["Artış bitiş taksiti", `${result.installmentIncreaseEndNo ?? result.input.term}. taksit`],
      ["İlk taksit", formatCurrency(result.firstInstallmentAmount ?? result.firstInstallment)],
      ["İlk artış sonrası taksit", formatCurrency(getFirstIncreasedInstallmentAmount(result))],
      ["Son taksit", formatCurrency(result.lastInstallmentAmount ?? 0)]
    );
  }

  rows.push(
    ...(result.deductedDelayMonths > 0
      ? [["Ödeme planı taksit sayısı", `${result.effectiveInstallmentCount} ay`]]
      : []),
    ["İlk taksit tutarı", formatCurrency(result.firstInstallment)],
    ["Toplam ödeme", formatCurrency(result.totalPayment)],
    ["Toplam faiz / KKDF / BSMV", `${formatCurrency(result.totalInterest)} / ${formatCurrency(result.totalKkdf)} / ${formatCurrency(result.totalBsmv)}`]
  );

  return rows;
};

const drawText = (doc, text, x, y, options = {}) => {
  const {
    color = [20, 33, 61],
    fontSize = 10,
    fontStyle = "normal",
    maxWidth,
  } = options;

  doc.setTextColor(...color);
  doc.setFont(PDF_FONT_NAME, fontStyle);
  doc.setFontSize(fontSize);

  const lines = maxWidth ? doc.splitTextToSize(text, maxWidth) : [text];
  doc.text(lines, x, y);

  return y + lines.length * fontSize * 1.28;
};

const drawSummaryBoxes = (doc, rows, startY) => {
  const margin = 32;
  const gap = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - margin * 2 - gap) / 2;
  const boxHeight = 42;
  let y = startY;

  rows.forEach(([label, value], index) => {
    const column = index % 2;
    const x = margin + column * (boxWidth + gap);

    if (column === 0 && index !== 0) {
      y += boxHeight + 8;
    }

    doc.setDrawColor(216, 225, 234);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxWidth, boxHeight, 5, 5, "FD");

    drawText(doc, label, x + 8, y + 13, {
      color: [96, 112, 131],
      fontSize: 7.5,
      fontStyle: "bold",
      maxWidth: boxWidth - 16,
    });
    drawText(doc, value, x + 8, y + 29, {
      color: [20, 33, 61],
      fontSize: 8.5,
      fontStyle: "bold",
      maxWidth: boxWidth - 16,
    });
  });

  return y + boxHeight + 14;
};

const drawNotice = (doc, title, body, y, options = {}) => {
  const margin = 32;
  const pageWidth = doc.internal.pageSize.getWidth();
  const width = pageWidth - margin * 2;
  const bodyLines = doc.splitTextToSize(body, width - 24);
  const height = Math.max(42, 24 + bodyLines.length * 10);

  if (y + height > doc.internal.pageSize.getHeight() - 32) {
    doc.addPage();
    y = 32;
  }

  doc.setDrawColor(...(options.borderColor || [255, 232, 163]));
  doc.setFillColor(...(options.fillColor || [255, 248, 232]));
  doc.roundedRect(margin, y, width, height, 5, 5, "FD");
  doc.setFillColor(...(options.accentColor || [230, 119, 0]));
  doc.rect(margin, y, 3, height, "F");

  drawText(doc, title, margin + 12, y + 14, {
    color: [8, 61, 119],
    fontSize: 8,
    fontStyle: "bold",
    maxWidth: width - 24,
  });
  drawText(doc, bodyLines.join("\n"), margin + 12, y + 28, {
    color: [20, 33, 61],
    fontSize: 8,
    maxWidth: width - 24,
  });

  return y + height + 12;
};

const drawHeader = (doc) => {
  let y = 36;

  y = drawText(doc, "Kredi Ödeme Planı", 32, y, {
    color: [8, 61, 119],
    fontSize: 19,
    fontStyle: "bold",
  });
  y = drawText(
    doc,
    "Bu hesaplama bilgilendirme amaçlıdır. Bankaların nihai hesaplama yöntemleri, masraf ve ödeme planı uygulamaları farklılık gösterebilir.",
    32,
    y + 2,
    {
      color: [96, 112, 131],
      fontSize: 8,
      maxWidth: doc.internal.pageSize.getWidth() - 64,
    }
  );

  return y + 12;
};

const getScheduleRows = (result) =>
  result.schedule.map((item) => [
    item.isPrepaidInterest
      ? "0. Peşin"
      : `${item.installmentNumber}${item.isCustomPayment ? " Özel" : ""}${item.isInterestOnly ? " Faiz" : ""}`,
    formatDate(item.date),
    formatCurrency(item.principal),
    formatCurrency(item.interest),
    formatCurrency(item.kkdf),
    formatCurrency(item.bsmv),
    formatCurrency(item.installment),
    formatCurrency(item.remainingPrincipal),
  ]);

const drawScheduleTable = (doc, result, y) => {
  const margin = 32;

  if (y > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage();
    y = 32;
  }

  drawText(doc, "Ödeme Planı", margin, y, {
    color: [20, 33, 61],
    fontSize: 12,
    fontStyle: "bold",
  });

  autoTable(doc, {
    startY: y + 12,
    margin: { left: margin, right: margin },
    head: [["No", "Tarih", "Anapara", "Faiz", "KKDF", "BSMV", "Taksit", "Kalan"]],
    body: getScheduleRows(result),
    theme: "striped",
    headStyles: {
      fillColor: [8, 61, 119],
      font: PDF_FONT_NAME,
      fontSize: 7,
      fontStyle: "bold",
      halign: "left",
      textColor: [255, 255, 255],
    },
    styles: {
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
      font: PDF_FONT_NAME,
      fontSize: 6.5,
      lineColor: [230, 236, 242],
      lineWidth: 0.25,
      minCellHeight: 13,
      overflow: "linebreak",
      textColor: [20, 33, 61],
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 70 },
      2: { cellWidth: 92 },
      3: { cellWidth: 92 },
      4: { cellWidth: 80 },
      5: { cellWidth: 80 },
      6: { cellWidth: 92 },
      7: { cellWidth: 100 },
    },
  });
};

export const downloadLoanPdf = async (result, contactInfo) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  await registerPdfFont(doc);

  doc.setProperties({
    title: "Kredi Ödeme Planı",
    subject: "Bankacı Kredi Hesaplama",
  });

  let y = drawHeader(doc);
  y = drawSummaryBoxes(doc, getSummaryRows(result), y);

  if (result.brokenPeriod.diffDays !== 0) {
    y = drawNotice(
      doc,
      "Kırık dönem farkı sadece 1. taksite yansıtılmıştır.",
      `Gün farkı: ${result.brokenPeriod.diffDays}\nFaiz farkı: ${formatCurrency(result.brokenPeriod.interestDiff)}\nKKDF farkı: ${formatCurrency(result.brokenPeriod.kkdfDiff)}\nBSMV farkı: ${formatCurrency(result.brokenPeriod.bsmvDiff)}`,
      y
    );
  }

  const interestOnlyInfo = getInterestOnlyEffectiveInstallmentInfo(result);
  if (interestOnlyInfo) {
    y = drawNotice(doc, "Taksit sayısı bilgilendirmesi", interestOnlyInfo, y);
  }

  if (result.infoMessages?.length) {
    y = drawNotice(
      doc,
      "Taksit sayısı bilgilendirmesi",
      result.infoMessages.join("\n"),
      y,
      {
        accentColor: [37, 99, 235],
        borderColor: [191, 219, 254],
        fillColor: [239, 246, 255],
      }
    );
  }

  if (result.planType === "customPayment" && result.input.customPayments?.length) {
    y = drawNotice(
      doc,
      "Özel ödemeler",
      formatCustomPaymentsSummary(result.input.customPayments),
      y
    );
  }

  if (contactInfo?.fullName && contactInfo?.phone) {
    y = drawNotice(
      doc,
      "İletişim bilgileri",
      `İsim Soyisim: ${contactInfo.fullName}\nTelefon: ${contactInfo.phone}`,
      y,
      {
        accentColor: [8, 119, 232],
        borderColor: [216, 225, 234],
        fillColor: [255, 255, 255],
      }
    );
  }

  drawScheduleTable(doc, result, y + 2);
  doc.save(createLoanPdfFileName(result));
};
