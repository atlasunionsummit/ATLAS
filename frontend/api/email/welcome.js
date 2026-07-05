import { db } from '../utils/firebaseAdmin.js';
import { sendBrevoEmail } from '../utils/brevo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { delegate_payload } = req.body;
  
  // Security Check: Ensure payload and registration_id are present
  if (!delegate_payload || !delegate_payload.email || !delegate_payload.registration_id) {
    return res.status(400).json({ message: "Missing required payload or registration_id" });
  }
  
  try {
    // SECURITY: Validate that the registration actually exists in the database 
    // and matches the requested email. This prevents the endpoint from being used as an Open Relay.
    const regDoc = await db.collection('registrations').doc(delegate_payload.registration_id).get();
    
    if (!regDoc.exists) {
      console.warn(`Attempted welcome email for non-existent registration: ${delegate_payload.registration_id}`);
      return res.status(403).json({ message: "Forbidden: Registration does not exist." });
    }

    const regData = regDoc.data();
    if (regData.email.toLowerCase() !== delegate_payload.email.toLowerCase()) {
      console.warn(`Email mismatch for registration ${delegate_payload.registration_id}. DB: ${regData.email}, Req: ${delegate_payload.email}`);
      return res.status(403).json({ message: "Forbidden: Email mismatch." });
    }

    const templateId = process.env.BREVO_TEMPLATE_ID_WELCOME;
    if (!templateId) {
      return res.status(500).json({ message: "Welcome Template ID not configured" });
    }

    const result = await sendBrevoEmail({
      toEmail: delegate_payload.email,
      toName: delegate_payload.full_name || delegate_payload.nickname || "Delegate",
      templateId,
      params: {
        name: delegate_payload.full_name || delegate_payload.nickname,
        committee: delegate_payload.committee,
        portfolio: delegate_payload.portfolio || delegate_payload.portfolio_country || "Pending Assignment"
      }
    });
    
    if (result.success) {
      return res.status(200).json({ success: true, message: "Welcome email sent successfully" });
    } else {
      return res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    console.error("Welcome email error:", err);
    return res.status(500).json({ message: "Failed to process welcome email", error: err.message });
  }
}
