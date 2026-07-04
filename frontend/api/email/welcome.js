import { sendBrevoEmail } from '../utils/brevo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { delegate_payload } = req.body;
  if (!delegate_payload || !delegate_payload.email) {
    return res.status(400).json({ message: "Missing delegate payload or email" });
  }
  
  const templateId = process.env.BREVO_TEMPLATE_ID_WELCOME;
  if (!templateId) {
    return res.status(500).json({ message: "Welcome Template ID not configured" });
  }

  try {
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
    return res.status(500).json({ message: "Failed to send Welcome email", error: err.message });
  }
}
