import { db } from '../utils/firebaseAdmin.js';
import { sendBrevoEmail } from '../utils/brevo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { delegate_payload, email_type } = req.body;
  
  if (!delegate_payload || !delegate_payload.email || !delegate_payload.registration_id || !email_type) {
    return res.status(400).json({ message: "Missing required payload, registration_id, or email_type" });
  }
  
  try {
    // Validate registration exists (check registrations first)
    let regDoc = await db.collection('registrations').doc(delegate_payload.registration_id).get();
    
    // If not found in registrations, check delegates (for automated Cashfree flow)
    if (!regDoc.exists) {
      regDoc = await db.collection('delegates').doc(delegate_payload.registration_id).get();
    }
    
    if (!regDoc.exists) {
      console.warn(`Attempted ${email_type} email for non-existent registration: ${delegate_payload.registration_id}`);
      return res.status(403).json({ message: "Forbidden: Registration does not exist." });
    }

    const regData = regDoc.data();
    if (regData.email.toLowerCase() !== delegate_payload.email.toLowerCase()) {
      return res.status(403).json({ message: "Forbidden: Email mismatch." });
    }
    
    // SPAM PREVENTION: Check if email already sent
    if (regData[`${email_type}_email_sent`]) {
      return res.status(200).json({ success: true, message: "Email already sent" });
    }

    // Determine Template ID based on type
    let templateId;
    switch(email_type) {
      case "WELCOME":
        templateId = process.env.BREVO_TEMPLATE_ID_WELCOME;
        break;
      case "PAYMENT_SUCCESS":
        templateId = process.env.BREVO_TEMPLATE_ID_PAYMENT_SUCCESS;
        break;
      case "ATLAS_PLUS":
        templateId = process.env.BREVO_TEMPLATE_ID_ATLAS_PLUS;
        break;
      default:
        return res.status(400).json({ message: "Invalid email_type" });
    }

    if (!templateId) {
      return res.status(500).json({ message: `${email_type} Template ID not configured` });
    }

    const result = await sendBrevoEmail({
      toEmail: delegate_payload.email,
      toName: delegate_payload.full_name || delegate_payload.nickname || "Delegate",
      templateId,
      params: {
        name: delegate_payload.full_name || delegate_payload.nickname,
        committee: delegate_payload.committee || regData.committee,
        portfolio: delegate_payload.portfolio || delegate_payload.portfolio_country || regData.portfolio_country || "Pending Assignment",
        ref_id: delegate_payload.registration_id
      }
    });
    
    if (result.success) {
      // Mark as sent in DB to prevent spam
      await regDoc.ref.update({
        [`${email_type}_email_sent`]: true
      });
      return res.status(200).json({ success: true, message: `${email_type} email sent successfully` });
    } else {
      return res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    console.error(`${email_type} email error:`, err);
    return res.status(500).json({ message: `Failed to process ${email_type} email`, error: err.message });
  }
}
