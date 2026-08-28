export interface MonthlyReportPDFData {
  title: string;
  periodLabel: string;
  userName: string;
  userEmail: string;
  currency: string;
  generatedAt: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
  };
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  topTransactions: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
  }>;
}

/**
 * Pure deterministic standard PDF-1.4 Generator
 * Generates an A4 format financial statement with structured typography, tables, and borders
 */
export function generateMonthlyReportPDF(data: MonthlyReportPDFData): Buffer {
  const sanitize = (text: string) =>
    (text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[^\x20-\x7E]/g, " ");

  const formatMoney = (amount: number) => {
    return `${data.currency} ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const streamLines: string[] = [];

  // Helper drawing commands
  const setFillColor = (r: number, g: number, b: number) => {
    streamLines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
  };

  const setStrokeColor = (r: number, g: number, b: number) => {
    streamLines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
  };

  const drawRect = (x: number, y: number, w: number, h: number, fill = true, stroke = false) => {
    streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fill && stroke) {
      streamLines.push("B");
    } else if (fill) {
      streamLines.push("f");
    } else if (stroke) {
      streamLines.push("S");
    }
  };

  const drawText = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    isBold = false,
    color = [30, 41, 59]
  ) => {
    setFillColor(color[0], color[1], color[2]);
    streamLines.push("BT");
    streamLines.push(`/${isBold ? "F2" : "F1"} ${fontSize} Tf`);
    streamLines.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    streamLines.push(`(${sanitize(text)}) Tj`);
    streamLines.push("ET");
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color = [226, 232, 240], width = 1) => {
    setStrokeColor(color[0], color[1], color[2]);
    streamLines.push(`${width} w`);
    streamLines.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m`);
    streamLines.push(`${x2.toFixed(2)} ${y2.toFixed(2)} l`);
    streamLines.push("S");
  };

  // Page Dimensions: A4 = 595.28 x 841.89
  const pageHeight = 841.89;
  const pageWidth = 595.28;
  const marginX = 40;

  // 1. Top Header Banner
  setFillColor(79, 70, 229); // Primary Indigo
  drawRect(marginX, pageHeight - 90, pageWidth - marginX * 2, 50, true, false);

  drawText("FINTRACK FINANCIAL STATEMENT", marginX + 16, pageHeight - 65, 14, true, [255, 255, 255]);
  drawText(`Period: ${data.periodLabel}`, marginX + 16, pageHeight - 80, 10, false, [224, 231, 255]);

  drawText(data.userName, pageWidth - marginX - 180, pageHeight - 65, 10, true, [255, 255, 255]);
  drawText(data.userEmail, pageWidth - marginX - 180, pageHeight - 80, 9, false, [224, 231, 255]);

  // 2. Executive Summary 4-Box Metric Row
  const boxWidth = (pageWidth - marginX * 2 - 24) / 4;
  const boxHeight = 56;
  const boxY = pageHeight - 165;

  const summaryBoxes = [
    { label: "Total Inflows", val: formatMoney(data.summary.totalIncome), color: [16, 185, 129], bg: [236, 253, 245] },
    { label: "Total Outflows", val: formatMoney(data.summary.totalExpenses), color: [244, 63, 94], bg: [255, 241, 242] },
    {
      label: "Net Savings",
      val: formatMoney(data.summary.netSavings),
      color: data.summary.netSavings >= 0 ? [79, 70, 229] : [244, 63, 94],
      bg: [245, 243, 255],
    },
    { label: "Savings Rate", val: `${data.summary.savingsRate}%`, color: [15, 23, 42], bg: [248, 250, 252] },
  ];

  summaryBoxes.forEach((box, i) => {
    const bx = marginX + i * (boxWidth + 8);
    setFillColor(box.bg[0], box.bg[1], box.bg[2]);
    setStrokeColor(226, 232, 240);
    drawRect(bx, boxY, boxWidth, boxHeight, true, true);

    drawText(box.label, bx + 10, boxY + 36, 8, false, [100, 116, 139]);
    drawText(box.val, bx + 10, boxY + 16, 10, true, box.color);
  });

  // 3. Category Breakdown Table
  let currentY = boxY - 30;
  drawText("EXPENSE CATEGORY ALLOCATION", marginX, currentY, 10, true, [15, 23, 42]);
  drawLine(marginX, currentY - 6, pageWidth - marginX, currentY - 6, [203, 213, 225], 1);

  currentY -= 20;
  // Table Header
  setFillColor(241, 245, 249);
  drawRect(marginX, currentY, pageWidth - marginX * 2, 18, true, false);
  drawText("Category", marginX + 8, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Amount", marginX + 240, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Share", pageWidth - marginX - 60, currentY + 5, 8, true, [71, 85, 105]);

  currentY -= 16;
  const displayCats = data.categories.slice(0, 6);
  if (displayCats.length === 0) {
    drawText("No expenses recorded in this period.", marginX + 8, currentY + 4, 8, false, [148, 163, 184]);
    currentY -= 16;
  } else {
    displayCats.forEach((cat) => {
      drawText(cat.name, marginX + 8, currentY + 4, 8, false, [30, 41, 59]);
      drawText(formatMoney(cat.amount), marginX + 240, currentY + 4, 8, true, [30, 41, 59]);
      drawText(`${cat.percentage}%`, pageWidth - marginX - 60, currentY + 4, 8, false, [71, 85, 105]);
      drawLine(marginX, currentY, pageWidth - marginX, currentY, [241, 245, 249], 0.5);
      currentY -= 16;
    });
  }

  // 4. Payment Methods Summary
  currentY -= 12;
  drawText("PAYMENT METHOD DISTRIBUTION", marginX, currentY, 10, true, [15, 23, 42]);
  drawLine(marginX, currentY - 6, pageWidth - marginX, currentY - 6, [203, 213, 225], 1);

  currentY -= 20;
  setFillColor(241, 245, 249);
  drawRect(marginX, currentY, pageWidth - marginX * 2, 18, true, false);
  drawText("Channel / Method", marginX + 8, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Transactions", marginX + 180, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Total Outflow", marginX + 300, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Share", pageWidth - marginX - 60, currentY + 5, 8, true, [71, 85, 105]);

  currentY -= 16;
  const displayMethods = data.paymentMethods.slice(0, 4);
  if (displayMethods.length === 0) {
    drawText("No payment methods recorded.", marginX + 8, currentY + 4, 8, false, [148, 163, 184]);
    currentY -= 16;
  } else {
    displayMethods.forEach((pm) => {
      drawText(pm.method.replace("_", " "), marginX + 8, currentY + 4, 8, false, [30, 41, 59]);
      drawText(`${pm.count} txns`, marginX + 180, currentY + 4, 8, false, [71, 85, 105]);
      drawText(formatMoney(pm.amount), marginX + 300, currentY + 4, 8, true, [30, 41, 59]);
      drawText(`${pm.percentage}%`, pageWidth - marginX - 60, currentY + 4, 8, false, [71, 85, 105]);
      drawLine(marginX, currentY, pageWidth - marginX, currentY, [241, 245, 249], 0.5);
      currentY -= 16;
    });
  }

  // 5. Major Transactions Ledger
  currentY -= 12;
  drawText("MAJOR TRANSACTIONS LEDGER", marginX, currentY, 10, true, [15, 23, 42]);
  drawLine(marginX, currentY - 6, pageWidth - marginX, currentY - 6, [203, 213, 225], 1);

  currentY -= 20;
  setFillColor(241, 245, 249);
  drawRect(marginX, currentY, pageWidth - marginX * 2, 18, true, false);
  drawText("Date", marginX + 8, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Description", marginX + 80, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Category", marginX + 280, currentY + 5, 8, true, [71, 85, 105]);
  drawText("Amount", pageWidth - marginX - 90, currentY + 5, 8, true, [71, 85, 105]);

  currentY -= 16;
  const displayTxns = data.topTransactions.slice(0, 7);
  if (displayTxns.length === 0) {
    drawText("No ledger transactions recorded.", marginX + 8, currentY + 4, 8, false, [148, 163, 184]);
    currentY -= 16;
  } else {
    displayTxns.forEach((txn) => {
      const isIncome = txn.type === "INCOME";
      drawText(txn.date.split("T")[0], marginX + 8, currentY + 4, 8, false, [100, 116, 139]);
      drawText(txn.description.slice(0, 32), marginX + 80, currentY + 4, 8, false, [30, 41, 59]);
      drawText(txn.category, marginX + 280, currentY + 4, 8, false, [71, 85, 105]);
      drawText(
        `${isIncome ? "+" : "-"}${formatMoney(txn.amount)}`,
        pageWidth - marginX - 90,
        currentY + 4,
        8,
        true,
        isIncome ? [16, 185, 129] : [244, 63, 94]
      );
      drawLine(marginX, currentY, pageWidth - marginX, currentY, [241, 245, 249], 0.5);
      currentY -= 16;
    });
  }

  // 6. Footer Disclaimer & Timestamp
  drawLine(marginX, 45, pageWidth - marginX, 45, [203, 213, 225], 0.5);
  drawText(
    "Generated deterministically by FinTrack Personal Finance Platform. Confidential statement.",
    marginX,
    32,
    7,
    false,
    [148, 163, 184]
  );
  drawText(`Generated on: ${data.generatedAt}`, pageWidth - marginX - 180, 32, 7, false, [148, 163, 184]);

  // Construct PDF stream
  const contentStream = streamLines.join("\n");
  const streamLength = Buffer.byteLength(contentStream, "utf-8");

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`;
  objects[4] = `<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream`;
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[6] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let offset = 0;
  const chunks: Buffer[] = [];

  const write = (str: string) => {
    const buf = Buffer.from(str, "utf-8");
    chunks.push(buf);
    offset += buf.length;
  };

  write("%PDF-1.4\n%âãÏÓ\n");

  const xrefOffsets: number[] = [0];
  for (let i = 1; i <= 6; i++) {
    xrefOffsets[i] = offset;
    write(`${i} 0 obj\n${objects[i]}\nendobj\n`);
  }

  const xrefStart = offset;
  write("xref\n0 7\n0000000000 65535 f \n");
  for (let i = 1; i <= 6; i++) {
    write(`${xrefOffsets[i].toString().padStart(10, "0")} 00000 n \n`);
  }

  write(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return Buffer.concat(chunks);
}
