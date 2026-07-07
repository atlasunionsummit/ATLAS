import { db } from '../utils/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { customer_details, order_id, order_meta, delegate_payload, coupon_code } = req.body;

  try {
    // --- SERVER-SIDE PRICE VALIDATION ---
    let expectedPrice = 0;
    
    // Fetch base pricing
    const settingsDoc = await db.collection('settings').doc('config').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : { regular_price: 1999, special_regular_price: 2499 };
    
    // Check if special committee
    const specialCommittees = ["Formula 1 Strategy Summit", "Operation Red", "Vaidya Council", "IPL (Indian Premier League)", "IPL Auction"];
    const isSpecial = delegate_payload.committee && specialCommittees.some(c => delegate_payload.committee.includes(c));
    
    // Determine base prices based on special or regular
    const baseMUNPriceRegular = isSpecial ? (settings.special_regular_price ?? 2499) : (settings.regular_price ?? 1999);
    const baseMUNPriceEarlyBird = isSpecial ? (settings.special_early_bird_price ?? (baseMUNPriceRegular - 500)) : (settings.early_bird_price ?? 1799);
    
    // Determine which package the user selected
    const isEarlyBird = delegate_payload.package_name && delegate_payload.package_name.includes("Early Bird");
    const baseMUNPrice = isEarlyBird ? baseMUNPriceEarlyBird : baseMUNPriceRegular;

    // Determine base package price based on category
    if (delegate_payload.is_upgrade) {
      expectedPrice = settings.atlas_plus_price ?? 999;
    } else if (delegate_payload.package_category === "Model United Nations") {
      expectedPrice = baseMUNPrice;
    } else if (delegate_payload.package_category === "School delegation") {
      const discount = settings.school_discount ?? 100;
      expectedPrice = baseMUNPrice - discount;
    } else if (delegate_payload.package_category === "For festival") {
      expectedPrice = settings.festival_price ?? 1099;
    } else if (delegate_payload.package_category === "For concert") {
      expectedPrice = settings.concert_price ?? 999;
    }

    // Add Atlas Plus Addon (only if not an upgrade itself)
    if (delegate_payload.is_atlas_plus && !delegate_payload.is_upgrade) {
      expectedPrice += (settings.atlas_plus_price ?? 999);
    }

    // Apply Discount Code if valid
    if (coupon_code) {
      const codeDoc = await db.collection('discount_codes').doc(coupon_code).get();
      if (codeDoc.exists) {
        const codeData = codeDoc.data();
        const timesUsed = codeData.timesUsed || 0;
        const maxUses = codeData.maxUses || 9999;
        
        if (timesUsed < maxUses) {
          // Check if applies to category
          if (codeData.appliesTo === "All Categories" || codeData.appliesTo === delegate_payload.package_category) {
            const discountAmount = Math.floor(expectedPrice * (Number(codeData.percentage) / 100));
            expectedPrice -= discountAmount;
          }
        }
      }
    }

    // Ensure price doesn't drop below minimum
    if (expectedPrice <= 0) {
      return res.status(400).json({ message: "Invalid package category or pricing calculation resulted in 0." });
    }

    // --- CREATE CASHFREE ORDER ---
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-environment': process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION'
      },
      body: JSON.stringify({
        order_amount: expectedPrice, // SECURE: Use server-calculated price
        order_currency: 'INR',
        customer_details: {
          customer_id: customer_details.customer_id,
          customer_phone: customer_details.customer_phone,
          customer_email: customer_details.customer_email,
          customer_name: customer_details.customer_name
        },
        order_meta: order_meta
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cashfree Error:', data);
      return res.status(response.status).json(data);
    }

    // --- SECURITY: Store validated payload server-side ---
    // This prevents payload tampering at the /verify step.
    // verify.js will retrieve this trusted payload instead of trusting the client.
    const cfOrderId = data.cf_order_id || data.order_id || order_id;
    await db.collection('pending_orders').doc(cfOrderId).set({
      delegate_payload: delegate_payload,
      coupon_code: coupon_code || null,
      expected_price: expectedPrice,
      order_id: cfOrderId,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
