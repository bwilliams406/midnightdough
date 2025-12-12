import { onRequest } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import { Resend } from 'resend'

admin.initializeApp()

// Define the Resend API key as a secret
const resendApiKey = defineSecret('RESEND_API_KEY')

const FROM_EMAIL = 'Midnight Dough <hello@themidnightdough.com>'
const ADMIN_EMAIL = 'admin@themidnightdough.com'

// Customer brand styles
const customerStyles = `
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 0; background-color: #f5f5f0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; text-align: center; }
    .logo { font-size: 28px; color: #D4AF37; font-weight: bold; }
    .content { padding: 40px; color: #f5f5f0; }
    .order-number { background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; padding: 12px 24px; border-radius: 8px; display: inline-block; font-family: monospace; font-size: 18px; color: #D4AF37; }
    .total-row { display: flex; justify-content: space-between; padding: 16px 0; font-size: 20px; color: #D4AF37; font-weight: bold; }
    .address-box { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 20px 0; }
    .footer { background: #0f0f1a; padding: 30px; text-align: center; color: rgba(245,245,240,0.5); font-size: 12px; }
    .btn { display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0; }
    h1, h2, h3 { color: #f5f5f0; margin: 0 0 16px 0; }
    p { color: rgba(245,245,240,0.8); line-height: 1.6; margin: 0 0 16px 0; }
  </style>
`

// Admin dashboard styles - clean, minimal, data-focused
const adminStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; }
    .header { background: #1e293b; padding: 20px 24px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 14px; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-new { background: #22c55e; color: white; }
    .badge-pending { background: #eab308; color: #1e293b; }
    .badge-progress { background: #8b5cf6; color: white; }
    .badge-done { background: #22c55e; color: white; }
    .badge-cancelled { background: #ef4444; color: white; }
    .content { padding: 24px; }
    .metric-row { display: flex; gap: 16px; margin-bottom: 20px; }
    .metric { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; }
    .metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section-header { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { background: #f8fafc; padding: 12px; border-radius: 6px; }
    .info-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; color: #0f172a; font-weight: 500; margin-top: 2px; }
    .item-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .item-table th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .item-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .item-table .qty { text-align: center; font-weight: 600; }
    .item-table .price { text-align: right; font-weight: 600; color: #0f172a; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #64748b; }
    .summary-row.total { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
    .summary-row.discount { color: #22c55e; }
    .actions { margin-top: 20px; text-align: center; }
    .btn { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; }
    .btn-secondary { background: #f1f5f9; color: #334155; margin-left: 8px; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .timestamp { font-size: 11px; color: #94a3b8; }
    .alert { padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .alert-warning { background: #fef3c7; border: 1px solid #fcd34d; }
    .alert-critical { background: #fee2e2; border: 1px solid #fca5a5; }
    .alert-info { background: #dbeafe; border: 1px solid #93c5fd; }
  </style>
`

interface OrderData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: { productName: string; quantity: number; priceEach: number }[]
  subtotal: number
  discount: number
  deliveryFee: number
  tax: number
  tip: number
  total: number
  deliveryAddress: { address: string; city: string; state: string; zip: string }
  status: string
  createdAt: string
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Order Received',
    processed: 'Order Confirmed',
    in_progress: 'Baking Your Cookies',
    done: 'Delivered',
    cancelled: 'Order Cancelled'
  }
  return labels[status] || status
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'badge-pending',
    processed: 'badge-pending',
    in_progress: 'badge-progress',
    done: 'badge-done',
    cancelled: 'badge-cancelled'
  }
  return classes[status] || 'badge-pending'
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Generate customer order email - warm and branded
function generateCustomerEmail(order: OrderData): string {
  const itemsHtml = order.items.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <span style="color: #f5f5f0;">${item.quantity}× ${item.productName}</span>
      <span style="color: #D4AF37;">${formatCurrency(item.priceEach * item.quantity)}</span>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>${customerStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍪 Midnight Dough</div>
          <p style="color: rgba(245,245,240,0.6); margin-top: 8px;">Handcrafted cookies, delivered with love</p>
        </div>
        <div class="content">
          <h1>Thank You, ${order.customerName}! 🎉</h1>
          <p>Your order has been received and we're already getting excited to bake your cookies.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span class="order-number">${order.orderNumber}</span>
          </div>
          <h2>Order Details</h2>
          ${itemsHtml}
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: rgba(245,245,240,0.7);">
              <span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span>
            </div>
            ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; color: #4ade80;">
              <span>Discount</span><span>-${formatCurrency(order.discount)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: rgba(245,245,240,0.7);">
              <span>Delivery</span><span>${formatCurrency(order.deliveryFee)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; color: rgba(245,245,240,0.7);">
              <span>Tax</span><span>${formatCurrency(order.tax)}</span>
            </div>
            ${order.tip > 0 ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; color: rgba(245,245,240,0.7);">
              <span>Tip</span><span>${formatCurrency(order.tip)}</span>
            </div>` : ''}
            <div class="total-row">
              <span>Total</span><span>${formatCurrency(order.total)}</span>
            </div>
          </div>
          <div class="address-box">
            <h3 style="margin-bottom: 12px;">📍 Delivery Address</h3>
            <p style="margin: 0; color: #f5f5f0;">${order.deliveryAddress.address}</p>
            <p style="margin: 0; color: rgba(245,245,240,0.7);">${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zip}</p>
          </div>
          <p style="text-align: center; color: rgba(245,245,240,0.6);">
            Estimated delivery: <strong style="color: #D4AF37;">~45 minutes</strong>
          </p>
        </div>
        <div class="footer">
          <p>Questions? Reply to this email or visit our website.</p>
          <p style="margin-top: 16px;">© ${new Date().getFullYear()} Midnight Dough. Made with 🍪 in Texas.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate admin order email - clean dashboard style
function generateAdminEmail(order: OrderData): string {
  const totalCookies = order.items.reduce((sum, item) => sum + item.quantity, 0)
  
  const itemsHtml = order.items.map(item => `
    <tr>
      <td>${item.productName}</td>
      <td class="qty">${item.quantity}</td>
      <td class="price">${formatCurrency(item.priceEach * item.quantity)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>${adminStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span class="logo">Midnight Dough Admin</span></td>
              <td align="right"><span class="badge badge-new">NEW ORDER</span></td>
            </tr>
          </table>
        </div>
        
        <div class="content">
          <!-- Key Metrics -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
              <td width="33%" style="padding-right: 8px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${order.orderNumber}</div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">Order #</div>
                </div>
              </td>
              <td width="33%" style="padding: 0 8px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${formatCurrency(order.total)}</div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">Total</div>
                </div>
              </td>
              <td width="33%" style="padding-left: 8px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${totalCookies}</div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">Cookies</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Customer & Delivery Info -->
          <div class="section">
            <div class="section-header">Customer & Delivery</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right: 6px; vertical-align: top;">
                  <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Customer</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 500; margin-top: 2px;">${order.customerName}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${order.customerEmail}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left: 6px; vertical-align: top;">
                  <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Deliver To</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 500; margin-top: 2px;">${order.deliveryAddress.address}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zip}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Order Items -->
          <div class="section">
            <div class="section-header">Order Items</div>
            <table class="item-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Order Summary -->
          <div class="section">
            <div class="section-header">Summary</div>
            <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
            ${order.discount > 0 ? `<div class="summary-row discount"><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
            <div class="summary-row"><span>Delivery</span><span>${formatCurrency(order.deliveryFee)}</span></div>
            <div class="summary-row"><span>Tax</span><span>${formatCurrency(order.tax)}</span></div>
            ${order.tip > 0 ? `<div class="summary-row"><span>Tip</span><span>${formatCurrency(order.tip)}</span></div>` : ''}
            <div class="summary-row total"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <a href="https://midnightdough.com/admin/production" class="btn">Open Dashboard →</a>
          </div>

          <div style="text-align: center; margin-top: 16px;">
            <span class="timestamp">Received: ${formatDateTime(order.createdAt)}</span>
          </div>
        </div>

        <div class="footer">
          Midnight Dough Admin System
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate customer status update email
function generateCustomerStatusEmail(order: OrderData): string {
  const statusMessages: Record<string, { emoji: string; message: string }> = {
    pending: { emoji: '⏳', message: 'Your order has been received and is awaiting confirmation.' },
    processed: { emoji: '✅', message: 'Great news! Your order has been confirmed and queued for baking.' },
    in_progress: { emoji: '👨‍🍳', message: 'Your cookies are in the oven! The aroma is incredible.' },
    done: { emoji: '🚗', message: 'Your cookies have been delivered! Enjoy your midnight treat!' },
    cancelled: { emoji: '❌', message: 'Your order has been cancelled. If you have questions, please contact us.' }
  }
  const status = statusMessages[order.status] || { emoji: '📦', message: 'Your order status has been updated.' }

  return `
    <!DOCTYPE html>
    <html>
    <head>${customerStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍪 Midnight Dough</div>
        </div>
        <div class="content" style="text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">${status.emoji}</div>
          <h1>${getStatusLabel(order.status)}</h1>
          <span class="order-number">${order.orderNumber}</span>
          <p style="margin-top: 30px; font-size: 18px;">${status.message}</p>
          ${order.status === 'done' ? `
            <div style="margin-top: 30px; padding: 30px; background: rgba(212, 175, 55, 0.1); border-radius: 16px;">
              <p style="color: #D4AF37; font-size: 20px; margin: 0;">Thank you for choosing Midnight Dough!</p>
              <p style="color: rgba(245,245,240,0.7); margin: 12px 0 0 0;">We'd love to hear your feedback 💛</p>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Midnight Dough</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate admin status update email - concise dashboard notification
function generateAdminStatusEmail(order: OrderData): string {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    processed: 'Confirmed',
    in_progress: 'In Progress',
    done: 'Completed',
    cancelled: 'Cancelled'
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>${adminStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span class="logo">Midnight Dough Admin</span></td>
              <td align="right"><span class="badge ${getStatusBadgeClass(order.status)}">${statusLabels[order.status] || order.status}</span></td>
            </tr>
          </table>
        </div>
        
        <div class="content">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
              <td width="50%" style="padding-right: 8px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${order.orderNumber}</div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 4px;">Order</div>
                </div>
              </td>
              <td width="50%" style="padding-left: 8px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 20px; font-weight: 700; color: #22c55e;">${formatCurrency(order.total)}</div>
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 4px;">Total</div>
                </div>
              </td>
            </tr>
          </table>

          <div class="section">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right: 6px;">
                  <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Customer</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 500; margin-top: 2px;">${order.customerName}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left: 6px;">
                  <div style="background: #f8fafc; padding: 12px; border-radius: 6px;">
                    <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Delivery</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 500; margin-top: 2px;">${order.deliveryAddress.city}, ${order.deliveryAddress.state}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div class="actions">
            <a href="https://midnightdough.com/admin/production" class="btn">View Order →</a>
          </div>
        </div>

        <div class="footer">
          Status updated: ${formatDateTime(new Date().toISOString())}
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate admin notification email - alerts style
function generateAdminNotificationEmail(title: string, message: string, severity: string): string {
  const severityConfig: Record<string, { badge: string; alertClass: string }> = {
    critical: { badge: '🚨 CRITICAL', alertClass: 'alert-critical' },
    warning: { badge: '⚠️ WARNING', alertClass: 'alert-warning' },
    info: { badge: 'ℹ️ INFO', alertClass: 'alert-info' }
  }
  const config = severityConfig[severity] || severityConfig.info

  return `
    <!DOCTYPE html>
    <html>
    <head>${adminStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span class="logo">Midnight Dough Admin</span></td>
              <td align="right"><span style="color: ${severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#3b82f6'}; font-weight: 600;">${config.badge}</span></td>
            </tr>
          </table>
        </div>
        
        <div class="content">
          <div class="alert ${config.alertClass}">
            <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${title}</div>
            <div style="font-size: 14px; color: #334155;">${message}</div>
          </div>

          <div class="actions">
            <a href="https://midnightdough.com/admin/notifications" class="btn">View in Dashboard</a>
          </div>
        </div>

        <div class="footer">
          Automated alert from Midnight Dough System
        </div>
      </div>
    </body>
    </html>
  `
}

// HTTP function to send new order emails
export const sendOrderEmail = onRequest(
  { secrets: [resendApiKey], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    try {
      const resend = new Resend(resendApiKey.value())
      const order: OrderData = req.body

      // Send to customer
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [order.customerEmail],
        subject: `Order Confirmed - ${order.orderNumber} 🍪`,
        html: generateCustomerEmail(order)
      })

      // Send to admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `📦 New Order ${order.orderNumber} • ${formatCurrency(order.total)}`,
        html: generateAdminEmail(order)
      })

      res.json({ success: true, message: 'Emails sent' })
    } catch (error) {
      console.error('Email error:', error)
      res.status(500).json({ success: false, error: String(error) })
    }
  }
)

// HTTP function to send status update emails
export const sendStatusUpdateEmail = onRequest(
  { secrets: [resendApiKey], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    try {
      const resend = new Resend(resendApiKey.value())
      const order: OrderData = req.body
      const statusLabel = getStatusLabel(order.status)

      // Send to customer
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [order.customerEmail],
        subject: `${statusLabel} - ${order.orderNumber}`,
        html: generateCustomerStatusEmail(order)
      })

      // Send to admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `${order.orderNumber} → ${order.status.toUpperCase()}`,
        html: generateAdminStatusEmail(order)
      })

      res.json({ success: true, message: 'Status update emails sent' })
    } catch (error) {
      console.error('Email error:', error)
      res.status(500).json({ success: false, error: String(error) })
    }
  }
)

// HTTP function to send notification emails (admin only)
export const sendNotificationEmail = onRequest(
  { secrets: [resendApiKey], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    try {
      const resend = new Resend(resendApiKey.value())
      const { title, message, severity } = req.body

      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `${severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️'} ${title}`,
        html: generateAdminNotificationEmail(title, message, severity)
      })

      res.json({ success: true, message: 'Notification email sent' })
    } catch (error) {
      console.error('Email error:', error)
      res.status(500).json({ success: false, error: String(error) })
    }
  }
)

// Firestore trigger - automatically send email when new order is created
export const onOrderCreated = onDocumentCreated(
  { document: 'orders/{orderId}', secrets: [resendApiKey] },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) return

    const order = snapshot.data()
    
    if (!order || !order.customer?.email) {
      console.log('No customer email, skipping')
      return
    }

    const resend = new Resend(resendApiKey.value())

    const orderData: OrderData = {
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      deliveryFee: order.delivery?.fee || 0,
      tax: order.tax || 0,
      tip: order.tip || 0,
      total: order.total || 0,
      deliveryAddress: {
        address: order.delivery?.address || '',
        city: order.delivery?.city || '',
        state: order.delivery?.state || '',
        zip: order.delivery?.zip || ''
      },
      status: order.status || 'pending',
      createdAt: order.createdAt || new Date().toISOString()
    }

    try {
      // Send to customer
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [orderData.customerEmail],
        subject: `Order Confirmed - ${orderData.orderNumber} 🍪`,
        html: generateCustomerEmail(orderData)
      })

      // Send to admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `📦 New Order ${orderData.orderNumber} • ${formatCurrency(orderData.total)}`,
        html: generateAdminEmail(orderData)
      })

      console.log(`Emails sent for order ${orderData.orderNumber}`)
    } catch (error) {
      console.error('Error sending order emails:', error)
    }
  }
)

// Firestore trigger - send email when order status changes
export const onOrderUpdated = onDocumentUpdated(
  { document: 'orders/{orderId}', secrets: [resendApiKey] },
  async (event) => {
    const beforeSnapshot = event.data?.before
    const afterSnapshot = event.data?.after
    
    if (!beforeSnapshot || !afterSnapshot) return

    const before = beforeSnapshot.data()
    const after = afterSnapshot.data()

    // Only send email if status changed
    if (before.status === after.status) {
      return
    }

    if (!after.customer?.email) {
      console.log('No customer email, skipping')
      return
    }

    const resend = new Resend(resendApiKey.value())

    const orderData: OrderData = {
      orderNumber: after.orderNumber,
      customerName: after.customer.name,
      customerEmail: after.customer.email,
      items: after.items || [],
      subtotal: after.subtotal || 0,
      discount: after.discount || 0,
      deliveryFee: after.delivery?.fee || 0,
      tax: after.tax || 0,
      tip: after.tip || 0,
      total: after.total || 0,
      deliveryAddress: {
        address: after.delivery?.address || '',
        city: after.delivery?.city || '',
        state: after.delivery?.state || '',
        zip: after.delivery?.zip || ''
      },
      status: after.status,
      createdAt: after.createdAt || new Date().toISOString()
    }

    const statusLabel = getStatusLabel(orderData.status)

    try {
      // Send to customer
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [orderData.customerEmail],
        subject: `${statusLabel} - ${orderData.orderNumber}`,
        html: generateCustomerStatusEmail(orderData)
      })

      // Send to admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `${orderData.orderNumber} → ${orderData.status.toUpperCase()}`,
        html: generateAdminStatusEmail(orderData)
      })

      console.log(`Status update emails sent for order ${orderData.orderNumber}: ${statusLabel}`)
    } catch (error) {
      console.error('Error sending status update emails:', error)
    }
  }
)
