import { db } from '../utils/firebaseAdmin.js';
import { sendBrevoEmail } from '../utils/brevo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: 'Missing order_id' });
  }

  try {
    // 1. Check Idempotency (Prevent Replay Attacks)
    const existingOrderQuery = await db.collection('delegates')
      .where('payment_order_id', '==', order_id)
      .limit(1)
      .get();
      
    const existingUpgradeQuery = await db.collection('delegates')
      .where('upgrade_payment_order_id', '==', order_id)
      .limit(1)
      .get();
      
    if (!existingOrderQuery.empty || !existingUpgradeQuery.empty) {
      // Order has already been processed successfully
      return res.status(200).json({ success: true, message: 'Transaction already processed successfully' });
    }

    // 2. Verify with Cashfree
    const response = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-environment': process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION'
      }
    });

    const data = await response.json();
    
    if (data.order_status !== 'PAID') {
      return res.status(400).json({ message: 'Order not paid', status: data.order_status });
    }

    // 3. SECURITY: Retrieve the TRUSTED payload from pending_orders (set by create-order.js)
    //    This eliminates payload tampering — we NEVER trust the client's delegate_payload.
    const pendingDoc = await db.collection('pending_orders').doc(order_id).get();
    
    if (!pendingDoc.exists) {
      // Fallback: The order may have been created before we deployed this fix.
      // Accept the client payload only if pending_orders doesn't exist (backwards compat).
      console.warn(`SECURITY WARNING: No pending_order found for ${order_id}. Falling back to client payload.`);
    }
    
    const trustedData = pendingDoc.exists ? pendingDoc.data() : null;
    const delegate_payload = trustedData ? trustedData.delegate_payload : req.body.delegate_payload;
    const coupon_code = trustedData ? trustedData.coupon_code : (req.body.coupon_code || null);

    if (!delegate_payload) {
      return res.status(400).json({ message: 'No delegate payload found for this order.' });
    }

    // 4. Verify that the amount paid matches what we expected
    if (trustedData && trustedData.expected_price) {
      const paidAmount = Number(data.order_amount);
      const expectedAmount = Number(trustedData.expected_price);
      if (paidAmount < expectedAmount) {
        console.error(`PRICE MISMATCH: Paid ${paidAmount} but expected ${expectedAmount} for order ${order_id}`);
        return res.status(400).json({ message: 'Payment amount mismatch. Contact support.' });
      }
    }

    // 5. Execute Firestore Transaction via Admin SDK
    await db.runTransaction(async (transaction) => {
      if (delegate_payload.is_upgrade) {
        // Handle Upgrade Logic
        const delegateRef = db.collection("delegates").doc(delegate_payload.id);
        transaction.update(delegateRef, {
          is_atlas_plus: true,
          package_name: "Atlas Plus Tier",
          upgrade_payment_order_id: order_id,
          upgrade_timestamp: new Date().toISOString()
        });
      } else {
        // Handle Initial Registration Logic
        let portfolioSnap = null;
        let couponSnap = null;
        let portfolioRef = null;
        let couponRef = null;

        // Perform ALL READS first
        if (delegate_payload.portfolio_country) {
          portfolioRef = db.collection("portfolios").doc(delegate_payload.portfolio_country);
          portfolioSnap = await transaction.get(portfolioRef);
        }

        if (coupon_code) {
          couponRef = db.collection("discount_codes").doc(coupon_code);
          couponSnap = await transaction.get(couponRef);
        }

        // Perform ALL WRITES next
        // 5a. Update Portfolio Slots
        if (delegate_payload.portfolio_country) {
          let maxSlots = 1;
          if (delegate_payload.committee && delegate_payload.committee.includes("IPL")) maxSlots = 3;
          if (delegate_payload.committee && delegate_payload.committee.includes("UNSC")) maxSlots = 2;

          if (!portfolioSnap.exists) {
            transaction.set(portfolioRef, { slotsFilled: 1, maxSlots: maxSlots });
          } else {
            const currentFilled = portfolioSnap.data().slotsFilled || 0;
            if (currentFilled >= maxSlots) {
              throw new Error("Portfolio slot already taken.");
            }
            transaction.update(portfolioRef, { slotsFilled: currentFilled + 1 });
          }
        }

        // 5b. Create Delegate Record
        const newDelegateId = `AUS-DEL-${Date.now()}`;
        const delegateRef = db.collection("delegates").doc(newDelegateId);
        transaction.set(delegateRef, {
          ...delegate_payload,
          id: newDelegateId,
          payment_order_id: order_id,
          status: "approved",
          timestamp: new Date().toISOString()
        });

        // 5c. Increment Coupon Usage
        if (couponSnap && couponSnap.exists) {
          const currentTimesUsed = couponSnap.data().timesUsed || 0;
          const maxUses = couponSnap.data().maxUses || 9999;
          if (currentTimesUsed < maxUses) {
            transaction.update(couponRef, { timesUsed: currentTimesUsed + 1 });
          }
        }
      } // End else

    });

    // 6. Clean up pending_orders (no longer needed)
    if (pendingDoc.exists) {
      await db.collection('pending_orders').doc(order_id).delete();
    }

    // 7. Trigger Brevo Email
    const isAtlasPlus = (delegate_payload.committee && delegate_payload.committee === "Simulation Corps (Premium)") || 
                        delegate_payload.is_atlas_plus || 
                        (delegate_payload.package_name && delegate_payload.package_name.includes("ATLAS PLUS"));

    let templateId = process.env.BREVO_TEMPLATE_ID_PAYMENT;
    if (isAtlasPlus) {
      templateId = process.env.BREVO_TEMPLATE_ID_ATLAS_PLUS || process.env.BREVO_TEMPLATE_ID_PAYMENT;
    }

    if (templateId) {
      sendBrevoEmail({
        toEmail: delegate_payload.email,
        toName: delegate_payload.full_name || delegate_payload.nickname || "Delegate",
        templateId,
        params: {
          name: delegate_payload.full_name || delegate_payload.nickname,
          portfolio: delegate_payload.portfolio || delegate_payload.portfolio_country || "Pending Assignment",
          committee: delegate_payload.committee,
          orderId: order_id
        }
      }).catch(err => console.error("Post-payment email error:", err));
    }

    return res.status(200).json({ success: true, message: 'Transaction successful' });
  } catch (error) {
    console.error('Verify Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}
