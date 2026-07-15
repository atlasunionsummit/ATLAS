import { db } from '../utils/firebaseAdmin.js';
import { sendBrevoEmail } from '../utils/brevo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { delegate_payload, coupon_code } = req.body;

  if (!delegate_payload) {
    return res.status(400).json({ message: 'Missing delegate payload' });
  }

  try {
    let finalDelegateId = null;

    // 1. Execute Firestore Transaction via Admin SDK
    await db.runTransaction(async (transaction) => {
      if (delegate_payload.is_upgrade) {
        // Handle Upgrade Logic
        const delegateRef = db.collection("delegates").doc(delegate_payload.id);
        transaction.update(delegateRef, {
          is_atlas_plus: true,
          package_name: "Atlas Plus Tier",
          upgrade_timestamp: new Date().toISOString()
        });
        finalDelegateId = delegate_payload.id;
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
        // Update Portfolio Slots
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

        // Create Delegate Record
        const newDelegateId = `AUS-DEL-${Date.now()}`;
        finalDelegateId = newDelegateId;
        const delegateRef = db.collection("delegates").doc(newDelegateId);
        transaction.set(delegateRef, {
          ...delegate_payload,
          id: newDelegateId,
          status: "approved",
          timestamp: new Date().toISOString()
        });

        // Increment Coupon Usage
        if (couponSnap && couponSnap.exists) {
          const currentTimesUsed = couponSnap.data().timesUsed || 0;
          const maxUses = couponSnap.data().maxUses || 9999;
          if (currentTimesUsed < maxUses) {
            transaction.update(couponRef, { timesUsed: currentTimesUsed + 1 });
          }
        }
      }
    });

    // 2. Trigger Welcome / Upgrade Email Natively
    const isAtlasPlus = (delegate_payload.committee && delegate_payload.committee === "Simulation Corps (Premium)") || 
                        delegate_payload.is_atlas_plus || 
                        (delegate_payload.package_name && delegate_payload.package_name.includes("ATLAS PLUS"));

    let templateId = process.env.BREVO_TEMPLATE_ID_WELCOME;
    if (delegate_payload.is_upgrade) {
      templateId = process.env.BREVO_TEMPLATE_ID_ATLAS_PLUS || process.env.BREVO_TEMPLATE_ID_WELCOME;
    } else if (isAtlasPlus) {
      templateId = process.env.BREVO_TEMPLATE_ID_ATLAS_PLUS || process.env.BREVO_TEMPLATE_ID_WELCOME;
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
          ref_id: finalDelegateId
        }
      }).catch(err => console.error("Post-registration email error:", err));
    }

    return res.status(200).json({ success: true, message: 'Registration successful', id: finalDelegateId });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Registration Failed', error: error.message });
  }
}
