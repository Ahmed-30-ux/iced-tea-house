import nodemailer from "nodemailer";

type ReceiptEmailOptions = {
  to: string;
  orderNumber: string;
  customerName: string;
  items: { productName: string; quantity: number; unitPrice: number; lineTotal: number; instructions?: string | null }[];
  total: number;
  amountPaid: number;
  paymentStatus: string;
  date: string;
  businessName: string;
  orderType?: string;
  isComplimentary?: boolean;
  cardFee?: number;
};

export function generateReceiptHtml(options: ReceiptEmailOptions): string {
  const { orderNumber, customerName, items, total, amountPaid, paymentStatus, date, businessName, orderType, isComplimentary, cardFee } = options;

  const typeLabel = orderType === "DINE_IN" ? "Dine-in" : orderType === "TAKEAWAY" ? "Takeaway" : orderType === "DELIVERY" ? "Delivery" : "";

  const itemsHtml = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${i.productName}${i.instructions ? `<br><span style="font-size:11px;color:#b8860b">&#9998; ${i.instructions}</span>` : ""}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#374151">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151">PKR ${i.unitPrice.toLocaleString()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;font-weight:500">PKR ${i.lineTotal.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const statusColor = paymentStatus === "PAID" ? "#16a34a" : paymentStatus === "PARTIALLY_PAID" ? "#d97706" : "#dc2626";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px">${businessName}</h1>
        <p style="color:#fde68a;margin:8px 0 0;font-size:13px;letter-spacing:0.5px">@icedteahouse</p>
      </div>

      <!-- Receipt Title -->
      <div style="padding:24px 24px 0;text-align:center">
        <h2 style="color:#92400e;margin:0;font-size:18px;text-transform:uppercase;letter-spacing:2px">Order Receipt</h2>
      </div>

      <!-- Order Info -->
      <div style="padding:16px 24px">
        <table style="width:100%;font-size:14px;color:#6b7280">
          <tr>
            <td style="padding:4px 0">Order</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${orderNumber}${typeLabel ? ` · ${typeLabel}` : ""}</td>
          </tr>
          <tr>
            <td style="padding:4px 0">Date</td>
            <td style="padding:4px 0;text-align:right;color:#1f2937">${date}</td>
          </tr>
          <tr>
            <td style="padding:4px 0">Customer</td>
            <td style="padding:4px 0;text-align:right;color:#1f2937">${customerName}</td>
          </tr>
          ${isComplimentary ? `<tr><td style="padding:4px 0"></td><td style="padding:4px 0;text-align:right"><span style="background:#f3e8ff;color:#7c3aed;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">★ PR / COMPLIMENTARY</span></td></tr>` : ""}
        </table>
      </div>

      <div style="margin:0 24px;border-top:1px dashed #d1d5db"></div>

      <!-- Items Table -->
      <div style="padding:16px 24px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:2px solid #e5e7eb">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600">Item</th>
              <th style="padding:8px 12px;text-align:center;color:#6b7280;font-weight:600">Qty</th>
              <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600">Price</th>
              <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <div style="margin:0 24px;border-top:1px dashed #d1d5db"></div>

      <!-- Totals -->
      <div style="padding:16px 24px">
        <table style="width:100%;font-size:14px">
          <tr>
            <td style="padding:4px 0;color:#6b7280">Total</td>
            <td style="padding:4px 0;text-align:right;font-weight:700;color:#1f2937;font-size:18px">PKR ${total.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280">Paid</td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#16a34a">PKR ${amountPaid.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280">Status</td>
            <td style="padding:4px 0;text-align:right">
              <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;background-color:${statusColor}">${paymentStatus.replace("_", " ")}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="background-color:#fef3c7;padding:20px 24px;text-align:center">
        <p style="margin:0;color:#92400e;font-size:13px">Thank you for your order!</p>
        <p style="margin:4px 0 0;color:#b45309;font-size:12px">@icedteahouse</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendReceiptEmail(options: ReceiptEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const { to } = options;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    console.log("[Email] SMTP not configured — receipt generated but not sent");
    console.log("[Email] To:", to);
    console.log("[Email] Subject:", `Receipt for order ${options.orderNumber}`);
    console.log("[Email] HTML length:", generateReceiptHtml(options).length, "chars");
    return { ok: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: `Receipt — ${options.orderNumber}`,
      html: generateReceiptHtml(options),
    });

    return { ok: true };
  } catch (e) {
    console.error("[Email] Failed to send receipt:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email" };
  }
}
