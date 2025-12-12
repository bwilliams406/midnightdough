// Test email functionality - run from browser console
import { sendNewOrderEmails } from './emailService'

export async function sendTestOrderEmail() {
  const testOrder = {
    orderNumber: 'TEST-001',
    customerName: 'Brody Williams',
    customerEmail: 'brodywilliams422@gmail.com',
    items: [
      { productName: 'Moonlight Morsels', quantity: 6, priceEach: 3.75 },
      { productName: 'Midnight Obsidian', quantity: 6, priceEach: 5.00 },
    ],
    subtotal: 52.50,
    discount: 2.63,
    deliveryFee: 4.00,
    tax: 4.11,
    tip: 7.50,
    total: 65.48,
    deliveryAddress: {
      address: '123 Test Street',
      city: 'Murphy',
      state: 'TX',
      zip: '75094',
    },
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  console.log('Sending test order emails...')
  console.log('To customer:', testOrder.customerEmail)
  console.log('To admin: admin@themidnightdough.com')
  
  try {
    await sendNewOrderEmails(testOrder)
    console.log('✅ Test emails sent successfully!')
    return true
  } catch (error) {
    console.error('❌ Error sending test emails:', error)
    return false
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).sendTestOrderEmail = sendTestOrderEmail
}

