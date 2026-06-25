import apiClient from "@/lib/apiClient";

const PAYMENT_LABELS = {
  cash: "Cash",
  card: "Card",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  bank_transfer: "Bank Transfer",
};

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  let words = '';
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    words += numberToWords(crores) + ' Crore ';
    num %= 10000000;
  }

  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    words += numberToWords(lakhs) + ' Lakh ';
    num %= 100000;
  }

  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    words += numberToWords(thousands) + ' Thousand ';
    num %= 1000;
  }

  const hundreds = Math.floor(num / 100);
  if (hundreds > 0) {
    words += ones[hundreds] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + ' ';
    num = 0;
  }

  if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim();
}

export async function printReceipt(sale) {
  let shopData = {
    name: "Mobile Shop POS",
    description: "Your Trusted Phone Store",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    tax_id: "",
    logo_url: null,
  };

  try {
    const response = await apiClient.get("/shop/");
    shopData = { ...shopData, ...response.data };
    if (shopData.logo_url && !shopData.logo_url.startsWith('http')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const baseUrl = apiUrl.replace('/api/v1', '');
      shopData.logo_url = `${baseUrl}${shopData.logo_url}`;
    }
  } catch (error) {
    console.warn("Failed to fetch shop settings, using defaults", error);
  }

  const items = sale.items ?? [];
  const total = Number(sale.total ?? sale.total_amount ?? 0);
  const payment = PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method ?? "—";
  const totalWords = numberToWords(Math.floor(total));

  // Khata/Payment information
  const khata = sale.khata;
  const paidAmount = khata ? Number(khata.paid_amount) : total;
  const remainingAmount = khata ? Number(khata.remaining_amount) : 0;
  const hasKhata = khata && remainingAmount > 0;
  const isPaid = !hasKhata;

  const itemRows = items.map((item, i) => `
    <tr>
      <td style="text-align: center; padding: 8px 4px;">${i + 1}</td>
      <td style="padding: 8px 4px;">${esc(item.item_name ?? item.name ?? "—")}</td>
      <td style="text-align: center; padding: 8px 4px;">${item.quantity}</td>
      <td style="text-align: right; padding: 8px 4px;">${Number(item.unit_price).toLocaleString()}</td>
      <td style="text-align: right; padding: 8px 4px;">${(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cash Memo — ${esc(sale.invoice_number ?? sale.id)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #000;
    }
    .container {
      width: 100%;
      border: 2px solid #000;
      padding: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .logo-section {
      width: 80px;
      text-align: center;
    }
    .logo-section img {
      max-width: 70px;
      max-height: 70px;
      object-fit: contain;
    }
    .center-section {
      flex: 1;
      text-align: center;
      padding: 0 20px;
    }
    .invoice-type {
      font-size: 16pt;
      font-weight: bold;
      color: #0000ff;
      margin-bottom: 8px;
      text-decoration: underline;
    }
    .shop-name {
      font-size: 20pt;
      font-weight: bold;
      color: #0000ff;
      margin-bottom: 2px;
    }
    .shop-address {
      font-size: 8pt;
      color: #0000ff;
      margin-bottom: 4px;
    }
    .shop-desc {
      font-size: 9pt;
      color: #0000ff;
      font-weight: bold;
      background: #e0e0e0;
      padding: 4px 8px;
      margin-bottom: 4px;
    }
    .right-section {
      text-align: right;
      width: 100px;
    }
    .phone-label {
      font-size: 9pt;
      color: #0000ff;
      font-weight: bold;
    }
    .phone-number {
      font-size: 11pt;
      color: #0000ff;
      font-weight: bold;
    }
    .customer-section {
      margin-bottom: 12px;
      border-bottom: 1px solid #000;
      padding-bottom: 8px;
      display: flex;
      gap: 20px;
    }
    .customer-row {
      flex: 1;
      font-size: 10pt;
    }
    .customer-row label {
      font-weight: bold;
      display: block;
      margin-bottom: 2px;
    }
    .customer-row .value {
      font-weight: bold;
      display: block;
      margin-bottom: 2px;
      color: #0000ff;
      min-height: 16px;
    }
    .customer-row .dots {
      border-bottom: 1px dotted #000;
      min-height: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    th {
      border: 1px solid #000;
      padding: 6px 4px;
      text-align: left;
      background: #f0f0f0;
      font-weight: bold;
    }
    td {
      border: 1px solid #000;
      padding: 6px 4px;
    }
    .total-row {
      font-weight: bold;
      background: #e0e0e0;
    }
    .rupees-words {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #000;
      font-size: 10pt;
    }
    .rupees-label {
      font-weight: bold;
    }
    .footer-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      min-height: 60px;
    }
    .terms {
      flex: 1;
      font-size: 9pt;
      padding-right: 20px;
    }
    .signature {
      text-align: right;
      font-size: 9pt;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 30px;
      padding-top: 4px;
      font-weight: bold;
      color: #0000ff;
    }
    .thank-you {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      color: #0000ff;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${shopData.logo_url ? `<img src="${esc(shopData.logo_url)}" alt="Logo">` : ''}
      </div>

      <div class="center-section">
        <div class="invoice-type">Cash Memo</div>
        <div class="shop-name">${esc(shopData.name)}</div>
        <div class="shop-address">
          ${shopData.address ? `${esc(shopData.address)} :: ` : ''}
          ${shopData.city ? `${esc(shopData.city)} :: ` : ''}
          ${shopData.country ? `${esc(shopData.country)}` : ''}
          ${shopData.tax_id ? ` :: ${esc(shopData.tax_id)}` : ''}
        </div>
        <div class="shop-desc">${esc(shopData.description ?? "")}</div>
      </div>

      <div class="right-section">
        ${shopData.phone ? `
          <div class="phone-label">Mob :</div>
          <div class="phone-number">${esc(shopData.phone)}</div>
        ` : ''}
        ${shopData.email ? `
          <div style="font-size: 8pt; margin-top: 4px;">${esc(shopData.email)}</div>
        ` : ''}
      </div>
    </div>

    <!-- Customer Info -->
    <div class="customer-section">
      <div class="customer-row">
        <label>Name</label>
        <div class="value">${esc(sale.customer_name ?? "Walk-in")}</div>
        <div class="dots"></div>
      </div>
      <div class="customer-row">
        <label>Mob</label>
        <div class="value">${esc(sale.customer_phone ?? "")}</div>
        <div class="dots"></div>
      </div>
      <div class="customer-row">
        <label>Date</label>
        <div class="value">${fmtDate(sale.created_at)}</div>
        <div class="dots"></div>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">S.No</th>
          <th style="width: 50%;">Description</th>
          <th style="width: 10%;">Qty</th>
          <th style="width: 17.5%;">Rate</th>
          <th style="width: 17.5%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No items</td></tr>'}
        <tr class="total-row">
          <td colspan="4" style="text-align: right; padding: 8px 4px;">Total -</td>
          <td style="text-align: right; padding: 8px 4px;">${total.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <!-- Payment Details Section -->
    <div style="border: 2px solid #0000ff; margin-bottom: 12px; padding: 10px; background: ${isPaid ? '#e8f5e9' : '#fff3e0'}; border-radius: 3px;">
      <div style="font-weight: bold; color: #0000ff; margin-bottom: 8px; text-align: center;">PAYMENT DETAILS</div>
      <table style="width: 100%; font-size: 10pt; margin-bottom: 8px;">
        <tr style="border-bottom: 1px dashed #000;">
          <td style="padding: 4px; font-weight: bold;">Total Amount</td>
          <td style="text-align: right; padding: 4px; font-weight: bold;">PKR ${total.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px dashed #000;">
          <td style="padding: 4px; color: #008000;">Paid Amount</td>
          <td style="text-align: right; padding: 4px; color: #008000; font-weight: bold;">PKR ${paidAmount.toLocaleString()}</td>
        </tr>
        <tr style="background: ${hasKhata ? '#fff3cd' : '#c8e6c9'}; border: 1px solid ${hasKhata ? '#ffc107' : '#4caf50'};">
          <td style="padding: 4px; color: ${hasKhata ? '#ff6600' : '#2e7d32'}; font-weight: bold;">Remaining Amount</td>
          <td style="text-align: right; padding: 4px; color: ${hasKhata ? '#ff6600' : '#2e7d32'}; font-weight: bold;">PKR ${remainingAmount.toLocaleString()}</td>
        </tr>
      </table>
      <div style="text-align: center; font-size: 9pt; color: #0000ff; font-weight: bold;">
        Status: ${hasKhata ? 'KHATA PENDING' : 'PAID'}
      </div>
    </div>

    <!-- Rupees in Words -->
    <div class="rupees-words">
      <span class="rupees-label">Rupees In Words:</span> ${totalWords} Rupees Only
    </div>

    <!-- Footer -->
    <div class="footer-section">
      <div class="signature">
        <div style="font-weight: bold;">Signature - ${esc(shopData.name)}</div>
      </div>
    </div>

    <!-- Thank You -->
    <div class="thank-you">Thank You</div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
  if (!win) {
    alert("Pop-ups are blocked. Allow pop-ups for this site to print bills.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}
