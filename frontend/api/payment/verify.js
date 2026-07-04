import { initializeApp } from "firebase/app";
import { getFirestore, doc, runTransaction, increment } from "firebase/firestore";
import { sendBrevoEmail } from '../utils/brevo.js';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAseJWjdl-_264T6RlZjVsqRtP-71l6z-M",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "atlasunionsummit-9ac21.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "atlasunionsummit-9ac21",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "atlasunionsummit-9ac21.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "286476979504",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:286476979504:web:7588da332bfe13a16c4cf5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { order_id, delegate_payload, coupon_code } = req.body;

  try {
    // 1. Verify with Cashfree
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

    // 2. Execute Firestore Transaction
    await runTransaction(db, async (transaction) => {
      // 2a. Lock Portfolio Slot
      // Note: This assumes a 'portfolios' collection exists with portfolio_id as key.
      // If we don't have a portfolio collection natively, we will update a global counter document.
      // For phase 4 UNSC double delegation schema, we check slotsFilled and maxSlots.
      const portfolioId = delegate_payload.portfolio || delegate_payload.portfolio_country;
      if (portfolioId) {
        const portfolioRef = doc(db, "portfolios", portfolioId);
        const portfolioSnap = await transaction.get(portfolioRef);
        
        let maxSlots = 1;
        if (delegate_payload.committee.includes("IPL")) maxSlots = 3;
        if (delegate_payload.committee.includes("UNSC")) maxSlots = 2;

        if (!portfolioSnap.exists()) {
          // Initialize if it doesn't exist
          transaction.set(portfolioRef, { slotsFilled: 1, maxSlots: maxSlots });
        } else {
          const currentFilled = portfolioSnap.data().slotsFilled || 0;
          if (currentFilled >= maxSlots) {
            throw new Error("Portfolio slot already taken.");
          }
          transaction.update(portfolioRef, { slotsFilled: currentFilled + 1 });
        }
      }

      // 2b. Create Delegate Record
      const newDelegateId = `AUS-DEL-${Date.now()}`;
      const delegateRef = doc(db, "delegates", newDelegateId);
      transaction.set(delegateRef, {
        ...delegate_payload,
        id: newDelegateId,
        payment_order_id: order_id,
        status: "approved",
        timestamp: new Date().toISOString()
      });

      // 2c. Increment Coupon Usage
      if (coupon_code) {
        // Querying inside transaction can be tricky with Web SDK if we don't have the doc ID.
        // We will assume the coupon ID is the code string for simplicity.
        const couponRef = doc(db, "discount_codes", coupon_code);
        const couponSnap = await transaction.get(couponRef);
        if (couponSnap.exists()) {
          const currentTimesUsed = couponSnap.data().timesUsed || 0;
          const maxUses = couponSnap.data().maxUses || 9999;
          if (currentTimesUsed < maxUses) {
            transaction.update(couponRef, { timesUsed: currentTimesUsed + 1 });
          }
        }
      }
    });

    // 3. Trigger Brevo Email
    const isAtlasPlus = delegate_payload.committee === "Simulation Corps (Premium)" || 
                        delegate_payload.is_atlas_plus || 
                        (delegate_payload.package_name && delegate_payload.package_name.includes("ATLAS PLUS"));

    let templateId = process.env.BREVO_TEMPLATE_ID_PAYMENT;
    if (isAtlasPlus) {
      templateId = process.env.BREVO_TEMPLATE_ID_ATLAS_PLUS || process.env.BREVO_TEMPLATE_ID_PAYMENT;
    }

    if (templateId) {
      // We don't await this so it doesn't block the response to Cashfree/Client
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
