import { sendBrevoEmail } from '../utils/brevo.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { email, name, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  
  const templateId = process.env.BREVO_TEMPLATE_ID_OTP;
  if (!templateId) {
    return res.status(500).json({ message: "OTP Template ID not configured" });
  }

  try {
    const result = await sendBrevoEmail({
      toEmail: email,
      toName: name,
      templateId,
      params: { OTP: otp }
    });
    
    if (result.success) {
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } else {
      return res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    return res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
}
