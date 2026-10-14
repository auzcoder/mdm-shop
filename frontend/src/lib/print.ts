/**
 * Professional HTML Printing & Export Engine
 * Generates standalone, perfectly styled printable HTML documents for:
 * 1. To‘lov kvitansiyalari (Payment Receipts / Invoices)
 * 2. Nasiya shartnomalari (Installment Contract Agreements)
 * 3. Analitik hisobotlar (Executive Analytical Reports)
 */

import { date, dateTime, sum, formatMonthYearUz } from './format'
import type { Contract, Customer, Device, ReportsAnalytics } from './types'
import type { PaymentRow } from '../hooks/usePayments'

/**
 * Escapes a value before embedding it into printable HTML.
 *
 * Customer names, addresses, device models and transaction references come
 * from operator input and are written into the print window with
 * document.write(). Without escaping, a value like `<img onerror=...>` would
 * execute in the print window (same origin as the panel).
 */
function esc(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Opens a print popup with clean standalone HTML and automatically triggers browser print dialog.
 */
export function printHtml(title: string, bodyContent: string) {
  const printWindow = window.open('', '_blank', 'width=850,height=900,menubar=no,toolbar=no,location=no,status=no')
  if (!printWindow) {
    alert('Brauzeringizda qalqib chiquvchi oynalar (popup) bloklangan. Iltimos, ruxsat bering.')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .receipt-container {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #475569;
      margin: 0;
    }
    .doc-type {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-num {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .info-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12.5px;
    }
    .kv-label {
      color: #64748b;
    }
    .kv-val {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .highlight-title {
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .highlight-amount {
      font-size: 26px;
      font-weight: 800;
      color: #15803d;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12.5px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
    }
    .num-col {
      text-align: right;
      font-family: monospace;
    }
    .footer-signs {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .sign-box {
      border-top: 1px solid #475569;
      padding-top: 6px;
      font-size: 11px;
      color: #64748b;
      margin-top: 40px;
      text-align: center;
    }
    .stamp-box {
      width: 100px;
      height: 100px;
      border: 1px dashed #94a3b8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #94a3b8;
      margin: 0 auto 10px auto;
      text-transform: uppercase;
    }
    .print-btn-bar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #0f172a;
      padding: 8px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
    }
    .print-btn-bar button {
      background: #22c55e;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    @media print {
      .print-btn-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button onclick="window.print()">🖨️ Chop etish (A4)</button>
  </div>
  <div class="receipt-container">
    ${bodyContent}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * 1. Print Official Payment Receipt (Kvitansiya)
 */
export function printPaymentReceipt(payment: PaymentRow) {
  const isPaid = Number(payment.paid_amount) >= Number(payment.amount)
  const paidAtText = payment.paid_at ? dateTime(payment.paid_at) : dateTime(new Date().toISOString())

  const content = `
    <div class="header">
      <div>
        <h1 class="brand-title">◈ QORA DAFTAR</h1>
        <p class="brand-sub">Nasiya Savdo va MDM Qurilma Boshqaruvi Markazi</p>
        <p class="brand-sub" style="margin-top: 2px;">Tel: +998 90 123 45 67 · Toshkent shahar</p>
      </div>
      <div class="doc-type">
        <div class="doc-badge">To‘lov Kvitansiyasi</div>
        <div class="doc-num">#PAY-${String(payment.id).padStart(6, '0')}</div>
        <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">Sana: ${date(payment.due_date)}</div>
      </div>
    </div>

    <!-- Highlight Box -->
    <div class="highlight-box">
      <div>
        <div class="highlight-title">${isPaid ? 'To‘langan summa (Kvitansiya yopilgan)' : 'Qabul qilingan to‘lov'}</div>
        <div class="highlight-amount">${sum(payment.paid_amount || payment.amount)}</div>
      </div>
      <div style="text-align: right;">
        <span style="background: ${isPaid ? '#22c55e' : '#f59e0b'}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 11.5px;">
          ${isPaid ? '✓ TO‘LIQ YAKUNLANDI' : 'QISMAN TO‘LANGAN'}
        </span>
        <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">Vaqti: ${paidAtText}</div>
      </div>
    </div>

    <!-- 2 Column Details -->
    <div class="grid-2">
      <!-- Card 1: Mijoz ma'lumotlari -->
      <div class="info-card">
        <div class="info-title">👤 Mijoz rekvizitlari</div>
        <div class="kv-row">
          <span class="kv-label">F.I.Sh:</span>
          <span class="kv-val">${esc(payment.customer_name || 'Noma‘lum')}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Telefon:</span>
          <span class="kv-val">${esc(payment.customer_phone || '—')}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Shartnoma raqami:</span>
          <span class="kv-val">#CTR-${payment.contract_id}</span>
        </div>
      </div>

      <!-- Card 2: Qurilma ma'lumotlari -->
      <div class="info-card">
        <div class="info-title">📱 Qurilma rekvizitlari</div>
        <div class="kv-row">
          <span class="kv-label">Model:</span>
          <span class="kv-val">${esc(payment.device_model || 'Qurilma #' + payment.device_id)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Platforma:</span>
          <span class="kv-val">${esc(payment.platform?.toUpperCase())}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">To‘lov bosqichi:</span>
          <span class="kv-val">${payment.seq}-oylik to‘lov ${payment.contract_months ? `(jami ${payment.contract_months} oy)` : ''}</span>
        </div>
      </div>
    </div>

    <!-- Payment Breakdown Table -->
    <table>
      <thead>
        <tr>
          <th>T/r</th>
          <th>To‘lov predmeti</th>
          <th>Belgilangan sana</th>
          <th class="num-col">Rejaviy miqdor</th>
          <th class="num-col">To‘langan miqdor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><strong>${esc(payment.device_model || 'Qurilma')} uchun ${payment.seq}-bosqich oylik to‘lovi</strong></td>
          <td>${date(payment.due_date)}</td>
          <td class="num-col">${sum(payment.amount)}</td>
          <td class="num-col" style="font-weight: 700; color: #16a34a;">${sum(payment.paid_amount)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: 700;">
          <td colspan="3" style="text-align: right;">JAMI TO‘LANDI:</td>
          <td colspan="2" class="num-col" style="font-size: 15px; color: #15803d;">${sum(payment.paid_amount)}</td>
        </tr>
      </tfoot>
    </table>

    ${payment.external_ref ? `
      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; font-size: 12px; margin-top: 10px;">
        <strong>To‘lov hujjati / Tranzaksiya kodi:</strong> <span style="font-family: monospace;">${esc(payment.external_ref)}</span>
      </div>
    ` : ''}

    <p style="font-size: 11px; color: #64748b; margin-top: 16px; line-height: 1.4;">
      * Ushbu to‘lov kvitansiyasi elektron tizim orqali avtomatik shakllantirildi. To‘lov qabul qilinganligi MDM serveriga yozildi va hisob-kitobga kiritildi.
    </p>

    <!-- Signatures -->
    <div class="footer-signs">
      <div>
        <div class="stamp-box">M.O‘. / MUHR</div>
        <div class="sign-box">Kassir / Operator imzosi</div>
      </div>
      <div>
        <div style="height: 100px;"></div>
        <div class="sign-box">Mijoz imzosi (${esc(payment.customer_name || 'Qabul qiluvchi')})</div>
      </div>
    </div>
  `

  printHtml(`To'lov Kvitansiyasi #PAY-${payment.id}`, content)
}

/**
 * 2. Print Analytical Report (Hisobot Chop Etish)
 */
export function printReportDocument(reportTitle: string, reportDesc: string, analytics: ReportsAnalytics) {
  const trends = analytics.monthly_trends || []
  const topModels = analytics.top_models || []
  const topCustomers = analytics.top_customers || []

  const content = `
    <div class="header">
      <div>
        <h1 class="brand-title">◈ QORA DAFTAR</h1>
        <p class="brand-sub">Nasiya Boshqaruvi va Analitika Markazi</p>
      </div>
      <div class="doc-type">
        <div class="doc-badge">Tahliliy Hisobot</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Chop etilgan sana: ${dateTime(new Date().toISOString())}</div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">${esc(reportTitle)}</h2>
      <p style="font-size: 12.5px; color: #64748b; margin: 0;">${esc(reportDesc)}</p>
    </div>

    <!-- KPI Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
      <div class="info-card">
        <div class="info-title">Jami Portfel</div>
        <div style="font-size: 16px; font-weight: 800; color: #0ea5e9; font-family: monospace;">${sum(analytics.total_portfolio)}</div>
      </div>
      <div class="info-card">
        <div class="info-title">Jami Tushum</div>
        <div style="font-size: 16px; font-weight: 800; color: #22c55e; font-family: monospace;">${sum(analytics.collected_total)}</div>
      </div>
      <div class="info-card">
        <div class="info-title">Kutilayotgan Qoldiq</div>
        <div style="font-size: 16px; font-weight: 800; color: #f59e0b; font-family: monospace;">${sum(analytics.outstanding_total)}</div>
      </div>
      <div class="info-card">
        <div class="info-title">Kechikkan Qarz</div>
        <div style="font-size: 16px; font-weight: 800; color: #ef4444; font-family: monospace;">${sum(analytics.overdue_total)}</div>
      </div>
    </div>

    <!-- Monthly Cashflow Table -->
    <h3 style="font-size: 14px; font-weight: 700; margin: 20px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
      📈 Oylik tushum va rejalar dinamikasi
    </h3>
    <table>
      <thead>
        <tr>
          <th>Oy / Davr</th>
          <th>Yangi shartnomalar</th>
          <th class="num-col">Rejalashtirilgan summa</th>
          <th class="num-col">Qabul qilingan tushum</th>
          <th class="num-col">Bajarilish foizi</th>
        </tr>
      </thead>
      <tbody>
        ${trends.map(t => {
          const sched = Number(t.scheduled)
          const coll = Number(t.collected)
          const pct = sched > 0 ? Math.min(100, Math.round((coll / sched) * 100)) : 0
          return `
            <tr>
              <td><strong>${formatMonthYearUz(t.month)}</strong></td>
              <td>${t.contract_qty} ta shartnoma</td>
              <td class="num-col">${sum(t.scheduled)}</td>
              <td class="num-col" style="color: #16a34a; font-weight: 700;">${sum(t.collected)}</td>
              <td class="num-col">${pct}%</td>
            </tr>
          `
        }).join('')}
      </tbody>
    </table>

    <!-- Top Models Table -->
    <h3 style="font-size: 14px; font-weight: 700; margin: 24px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
      📱 Eng ko‘p sotilgan modellar (Top 10)
    </h3>
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Model nomi</th>
          <th>Platforma</th>
          <th class="num-col">Nasiyadagi soni</th>
          <th class="num-col">Jami aylanma summasi</th>
        </tr>
      </thead>
      <tbody>
        ${topModels.map((m, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${esc(m.model)}</strong></td>
            <td>${esc(m.platform?.toUpperCase())}</td>
            <td class="num-col">${m.count} ta</td>
            <td class="num-col" style="font-weight: 700; color: #0284c7;">${sum(m.total_sum)}</td>
          </tr>
        `).join('')}
    <!-- Top Customers Table -->
    ${topCustomers.length > 0 ? `
      <h3 style="font-size: 14px; font-weight: 700; margin: 24px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        👥 Eng faol va ishonchli mijozlar (Top 10)
      </h3>
      <table>
        <thead>
          <tr>
            <th>Mijoz F.I.Sh</th>
            <th>Telefon</th>
            <th class="num-col">Qurilmalar soni</th>
            <th class="num-col">Jami shartnoma summasi</th>
            <th class="num-col">To‘langan summa</th>
          </tr>
        </thead>
        <tbody>
          ${topCustomers.map(c => `
            <tr>
              <td><strong>${esc(c.full_name)}</strong></td>
              <td>${esc(c.phone)}</td>
              <td class="num-col">${c.device_count} ta</td>
              <td class="num-col" style="font-weight: 700;">${sum(c.total_amount)}</td>
              <td class="num-col" style="color: #16a34a; font-weight: 700;">${sum(c.paid_amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    <!-- Signatures -->
    <div class="footer-signs" style="margin-top: 40px;">
      <div>
        <div class="sign-box">Bosh Buxgalter / Moliyachi</div>
      </div>
      <div>
        <div class="sign-box">Do‘kon Rahbari imzosi</div>
      </div>
    </div>
  `

  printHtml(reportTitle, content)
}

/**
 * 3. Print Contract Agreement Document (Nasiya Savdo Shartnomasi)
 */
export function printContractDocument(device: Device, customer: Customer | null, contract: Contract) {
  const content = `
    <div class="header">
      <div>
        <h1 class="brand-title">◈ QORA DAFTAR</h1>
        <p class="brand-sub">Nasiya Savdo va Texnika Ta'minoti</p>
      </div>
      <div class="doc-type">
        <div class="doc-badge">Nasiya Savdo Shartnomasi</div>
        <div class="doc-num">#CTR-${String(contract.id).padStart(6, '0')}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Sana: ${date(contract.start_date)}</div>
      </div>
    </div>

    <div style="text-align: center; margin: 16px 0;">
      <h2 style="font-size: 16px; font-weight: 800; margin: 0;">TELEFON VA QURILMANI NASIYA SAVDOSI BO‘YICHA SHARTNOMA</h2>
    </div>

    <!-- 2 Columns: Seller and Buyer -->
    <div class="grid-2">
      <div class="info-card">
        <div class="info-title">1. SOTUVCHI (KORXONA)</div>
        <div class="kv-row">
          <span class="kv-label">Tashkilot:</span>
          <span class="kv-val">"Qora Daftar" MCHJ</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Telefon:</span>
          <span class="kv-val">+998 90 123 45 67</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Manzil:</span>
          <span class="kv-val">Toshkent sh., Chilonzor tumani</span>
        </div>
      </div>

      <div class="info-card">
        <div class="info-title">2. XARIDOR (MIJOZ)</div>
        <div class="kv-row">
          <span class="kv-label">F.I.Sh:</span>
          <span class="kv-val">${esc(customer?.full_name || '—')}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Telefon:</span>
          <span class="kv-val">${esc(customer?.phone || '—')}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Passport / ID:</span>
          <span class="kv-val">${esc(customer?.passport || '—')}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Manzil:</span>
          <span class="kv-val">${esc(customer?.address || '—')}</span>
        </div>
      </div>
    </div>

    <!-- Device Details -->
    <div class="info-card" style="margin-bottom: 20px;">
      <div class="info-title">3. SAVDO OB’YEKTI (QURILMA MA’LUMOTLARI)</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        <div class="kv-row">
          <span class="kv-label">Model:</span>
          <span class="kv-val">${esc(device.model || '—')}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Platforma:</span>
          <span class="kv-val">${esc(device.platform.toUpperCase())}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">IMEI raqami:</span>
          <span class="kv-val">${esc(device.imei || '—')}</span>
        </div>
      </div>
    </div>

    <!-- Contract Financial Terms -->
    <div class="info-card" style="margin-bottom: 20px;">
      <div class="info-title">4. TO‘LOV SHARTLARI VA GRAFIGI</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div class="kv-row">
          <span class="kv-label">Umumiy summa:</span>
          <span class="kv-val">${sum(contract.total_amount)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Boshlang‘ich to‘lov:</span>
          <span class="kv-val">${sum(contract.down_payment)}</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Muddat:</span>
          <span class="kv-val">${contract.months} oy</span>
        </div>
        <div class="kv-row">
          <span class="kv-label">Grace davri:</span>
          <span class="kv-val">${contract.grace_days} kun</span>
        </div>
      </div>
    </div>

    <!-- Payments Schedule Table -->
    ${contract.payments && contract.payments.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>To‘lov muddati</th>
            <th class="num-col">To‘lov summasi</th>
            <th>Holat</th>
          </tr>
        </thead>
        <tbody>
          ${contract.payments.map(p => `
            <tr>
              <td>${p.seq}</td>
              <td>${date(p.due_date)}</td>
              <td class="num-col">${sum(p.amount)}</td>
              <td>${p.status === 'paid' ? '✓ To‘langan' : 'Kutilmoqda'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    <div style="font-size: 11px; color: #475569; margin: 16px 0; line-height: 1.4;">
      <strong>MUHIM QAYD:</strong> Xaridor to‘lovlarni belgilangan jadvalga muvofiq o‘z vaqtida amalga oshirish majburiyatini oladi. 
      To‘lov muddati ${contract.grace_days} kundan ortiq kechiktirilgan taqdirda, qurilma masofaviy MDM xavfsizlik tizimi orqali to‘lov amalga oshirilgunga qadar avtomatik bloklanadi.
    </div>

    <!-- Signatures -->
    <div class="footer-signs">
      <div>
        <div class="stamp-box">M.O‘. / MUHR</div>
        <div class="sign-box">Sotuvchi vakili imzosi</div>
      </div>
      <div>
        <div style="height: 100px;"></div>
        <div class="sign-box">Xaridor: ${esc(customer?.full_name || 'Xaridor imzosi')}</div>
      </div>
    </div>
  `

  printHtml(`Shartnoma #CTR-${contract.id}`, content)
}
