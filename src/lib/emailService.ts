// Email Service for Midnight Dough
// Uses Firebase Cloud Functions for sending branded emails
// Firestore triggers automatically send order/status emails

const FUNCTIONS_BASE_URL = 'https://us-central1-midnightdough-3320c.cloudfunctions.net'

interface OrderEmailData {
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
  deliveryAddress: {
    address: string
    city: string
    state: string
    zip: string
  }
  status: string
  createdAt: string
}

interface NotificationEmailData {
  type: 'low_stock' | 'out_of_stock' | 'product_unavailable' | 'restock_reminder' | 'info'
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
}

// NOTE: Order emails are now handled automatically by Firestore triggers!
// When an order is created in Firestore, the onOrderCreated trigger sends emails.
// When an order status changes, the onOrderUpdated trigger sends emails.
// These functions below are for manual/fallback use only.

export async function sendNewOrderEmails(order: OrderEmailData): Promise<boolean> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/sendOrderEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email send error:', error)
      return false
    }

    console.log(`Order emails sent for ${order.orderNumber}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendOrderStatusUpdateEmails(order: OrderEmailData): Promise<boolean> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/sendStatusUpdateEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Status email send error:', error)
      return false
    }

    console.log(`Status update emails sent for ${order.orderNumber}`)
    return true
  } catch (error) {
    console.error('Status email send error:', error)
    return false
  }
}

export async function sendNotificationEmail(notification: NotificationEmailData): Promise<boolean> {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/sendNotificationEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Notification email send error:', error)
      return false
    }

    console.log(`Notification email sent: ${notification.title}`)
    return true
  } catch (error) {
    console.error('Notification email send error:', error)
    return false
  }
}
