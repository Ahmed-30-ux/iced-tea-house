"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportsData } from "@/lib/reports";

const HEADER_COLOR: [number, number, number] = [184, 134, 11]; // #b8860b
const ACCENT_COLOR: [number, number, number] = [212, 162, 76]; // #d4a24c
const LIGHT_BG: [number, number, number] = [255, 251, 235]; // warm cream

function addBranding(doc: jsPDF, title: string, rangeLabel: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...HEADER_COLOR);
  doc.text("ICED TEA HOUSE", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(title, 14, 25);

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(rangeLabel, 14, 30);

  doc.setDrawColor(...ACCENT_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, 33, 196, 33);

  return 37; // Y position after header
}

function addCurrencyRow(doc: jsPDF, y: number, label: string, value: string) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(label, 14, y);
  doc.setFont("helvetica", "bold");
  doc.text(value, 120, y);
  return y + 6;
}

export function exportReportToPdf(data: ReportsData, tab: string, rangeLabel: string) {
  const doc = new jsPDF();
  const { salesReport, profitReport, productPerformance, inventoryReport, expenseReport, purchaseReport, customerReport, financialReport } = data;

  switch (tab) {
    case "sales": {
      let y = addBranding(doc, "Sales Report", rangeLabel);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...HEADER_COLOR);
      doc.text("Summary", 14, y);
      y += 7;
      y = addCurrencyRow(doc, y, "Gross Revenue", `$${salesReport.revenue.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Net Sales", `$${salesReport.netSales.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Refunds", `$${salesReport.refunds.toFixed(2)}`);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...HEADER_COLOR);
      doc.text("Daily Performance", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Day", "Orders", "Sales", "Profit"]],
        body: salesReport.salesByDay.map((d) => [d.label, String(d.orders), `$${d.sales.toFixed(2)}`, `$${d.profit.toFixed(2)}`]),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...HEADER_COLOR);
      doc.text("Revenue by Product", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Product", "Units", "Revenue", "Profit"]],
        body: salesReport.productPerformance.map((p) => [p.name, String(p.units), `$${p.revenue.toFixed(2)}`, `$${p.profit.toFixed(2)}`]),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });
      break;
    }

    case "profit": {
      let y = addBranding(doc, "Profit Report", rangeLabel);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...HEADER_COLOR);
      doc.text("Profit Breakdown", 14, y);
      y += 7;
      y = addCurrencyRow(doc, y, "Revenue", `$${profitReport.revenue.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Cost of Goods Sold", `$${profitReport.cogs.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Gross Profit", `$${profitReport.grossProfit.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Operating Expenses", `$${profitReport.expenses.toFixed(2)}`);
      y += 2;

      doc.setDrawColor(...ACCENT_COLOR);
      doc.setLineWidth(0.3);
      doc.line(14, y, 120, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...HEADER_COLOR);
      doc.text(`Net Profit: $${profitReport.netProfit.toFixed(2)}`, 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Net Margin: ${profitReport.margin}%`, 14, y);
      break;
    }

    case "products": {
      let y = addBranding(doc, "Product Performance", rangeLabel);

      autoTable(doc, {
        startY: y,
        head: [["Product", "Units", "Avg Price", "Revenue", "Profit", "Margin"]],
        body: productPerformance.map((p) => [
          p.name,
          String(p.units),
          `$${p.avgPrice.toFixed(2)}`,
          `$${p.revenue.toFixed(2)}`,
          `$${p.profit.toFixed(2)}`,
          `${p.margin}%`,
        ]),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });
      break;
    }

    case "inventory": {
      let y = addBranding(doc, "Inventory Report", rangeLabel);

      autoTable(doc, {
        startY: y,
        head: [["Product", "Incoming", "Outgoing", "Net Movement"]],
        body: inventoryReport.rows.map((r) => [r.name, `+${r.in}`, `-${r.out}`, String(r.in - r.out)]),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });
      break;
    }

    case "expenses": {
      let y = addBranding(doc, "Expense Report", rangeLabel);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${expenseReport.count} expenses · Total: $${expenseReport.total.toFixed(2)}`, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Category", "Amount", "% of Total"]],
        body: expenseReport.rows.map((r) => {
          const pct = expenseReport.total > 0 ? ((r.amount / expenseReport.total) * 100).toFixed(1) : "0";
          return [r.category, `$${r.amount.toFixed(2)}`, `${pct}%`];
        }),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });
      break;
    }

    case "purchases": {
      let y = addBranding(doc, "Purchase Report", rangeLabel);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`${purchaseReport.count} purchases · Total: $${purchaseReport.total.toFixed(2)}`, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Purchase #", "Supplier", "Units", "Total", "Status"]],
        body: purchaseReport.rows.map((p) => [p.purchaseNumber, p.supplier, String(p.itemCount), `$${p.totalCost.toFixed(2)}`, p.status]),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });
      break;
    }

    case "customers": {
      let y = addBranding(doc, "Customer Report", rangeLabel);

      autoTable(doc, {
        startY: y,
        head: [["Customer", "Orders", "Total Spent"]],
        body: customerReport.map((c) => [c.name, String(c.orders), `$${c.spent.toFixed(2)}`]),
        headStyles: { fillColor: HEADER_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        styles: { fontSize: 9 },
      });
      break;
    }

    case "financial": {
      let y = addBranding(doc, "Financial Report", rangeLabel);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...HEADER_COLOR);
      doc.text("Financial Summary", 14, y);
      y += 7;
      y = addCurrencyRow(doc, y, "Revenue", `$${financialReport.revenue.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Refunds", `$${financialReport.refunds.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Net Sales", `$${financialReport.netSales.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Cost of Goods Sold", `$${financialReport.cogs.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Gross Profit", `$${financialReport.grossProfit.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Operating Expenses", `$${financialReport.expensesTotal.toFixed(2)}`);
      y = addCurrencyRow(doc, y, "Purchases", `$${financialReport.purchasesTotal.toFixed(2)}`);
      y += 2;

      doc.setDrawColor(...ACCENT_COLOR);
      doc.setLineWidth(0.3);
      doc.line(14, y, 120, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...HEADER_COLOR);
      doc.text(`Net Profit: $${financialReport.netProfit.toFixed(2)}`, 14, y);
      break;
    }

    default: {
      let y = addBranding(doc, "Report", rangeLabel);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Select a report tab to view data.", 14, y);
    }
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Iced Tea House · Page ${i} of ${pageCount}`, 14, 287);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 196, 287, { align: "right" });
  }

  doc.save(`iced-tea-house-${tab}-report.pdf`);
}
