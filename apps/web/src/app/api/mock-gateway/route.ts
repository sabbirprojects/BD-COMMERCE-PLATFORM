import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get('provider') || 'bkash'
  const paymentId = searchParams.get('payment_id') || ''
  const cartId = searchParams.get('cart_id') || ''
  const amount = searchParams.get('amount') || '0'
  const isBkash = provider === 'bkash'

  const brandColor = isBkash ? '#D12053' : '#F7941D'
  const brandName = isBkash ? 'bKash Direct Merchant Gateway' : 'Nagad DFS Merchant Gateway'
  const brandNameBn = isBkash ? 'বিকাশ অনলাইন পেমেন্ট' : 'নগদ অনলাইন পেমেন্ট'

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brandName} — Simulation Sandbox</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); width: 100%; max-width: 440px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: ${brandColor}; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .header p { font-size: 13px; opacity: 0.9; }
    .body { padding: 24px; }
    .amount-box { background: #f1f5f9; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; }
    .amount-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .amount-val { font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
    .meta-label { color: #64748b; }
    .meta-val { font-family: monospace; font-weight: 600; color: #1e293b; }
    .notice { margin-top: 16px; padding: 12px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 12px; color: #1e40af; line-height: 1.4; }
    .actions { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
    button { width: 100%; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: opacity 0.2s; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-pay { background: ${brandColor}; color: #ffffff; }
    .btn-cancel { background: #f1f5f9; color: #475569; }
    .btn-cancel:hover { background: #e2e8f0; }
    #status-msg { margin-top: 12px; font-size: 13px; text-align: center; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${brandName}</h1>
      <p>${brandNameBn} (Sandbox Simulator)</p>
    </div>
    <div class="body">
      <div class="amount-box">
        <div class="amount-label">Payable Amount / প্রদেয় মোট</div>
        <div class="amount-val">৳${Number(amount).toLocaleString('en-BD')}</div>
      </div>

      <div class="meta-row">
        <span class="meta-label">Merchant</span>
        <span class="meta-val">BD Commerce Platform Ltd</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Payment ID</span>
        <span class="meta-val">${paymentId.slice(0, 20)}...</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Cart Ref</span>
        <span class="meta-val">${cartId.slice(0, 16)}...</span>
      </div>

      <div class="notice">
        <strong>Zero-Orphan Sandbox:</strong> No order has been created yet. Confirming payment will verify signature, amount, and currency server-to-server before capturing the order.
      </div>

      <div class="actions">
        <button id="btn-confirm" class="btn-pay" onclick="handlePayment('success')">
          Confirm Payment / নিশ্চিত করুন
        </button>
        <button id="btn-cancel" class="btn-cancel" onclick="handlePayment('cancel')">
          Cancel & Return to Cart / বাতিল করুন
        </button>
      </div>

      <div id="status-msg"></div>
    </div>
  </div>

  <script>
    async function handlePayment(action) {
      const btnConfirm = document.getElementById('btn-confirm');
      const btnCancel = document.getElementById('btn-cancel');
      const statusMsg = document.getElementById('status-msg');

      btnConfirm.disabled = true;
      btnCancel.disabled = true;
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#3b82f6';
      statusMsg.textContent = action === 'success' ? 'Verifying payment with gateway...' : 'Cancelling payment session...';

      const medusaUrl = 'http://localhost:9000';
      const endpoint = '${provider}' === 'nagad' ? '/hooks/nagad/callback' : '/hooks/bkash/callback';

      try {
        const res = await fetch(medusaUrl + endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_id: '${paymentId}',
            payment_ref_id: '${paymentId}',
            cart_id: '${cartId}',
            status: action,
            trx_id: 'trx_${provider}_' + Date.now(),
            amount: ${Number(amount)},
            currency: 'BDT'
          })
        });

        const data = await res.json();

        if (action === 'cancel' || !res.ok) {
          window.location.href = data.redirect_url || '/checkout?payment_error=cancelled';
        } else if (data.success && data.order_id) {
          window.location.href = '/en/orders/' + data.order_id;
        } else {
          window.location.href = data.redirect_url || '/checkout';
        }
      } catch (err) {
        statusMsg.style.color = '#ef4444';
        statusMsg.textContent = 'Gateway error: ' + err.message;
        setTimeout(() => {
          window.location.href = '/checkout?payment_error=cancelled';
        }, 1500);
      }
    }
  </script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
