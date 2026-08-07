export async function sendBrevoEmail({ toEmail, toName, templateId, params }) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY is missing");
    return { success: false, error: "Missing API Key" };
  }
  
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        to: [{ email: toEmail, name: toName || "Delegate" }],
        templateId: parseInt(templateId, 10),
        params: {
          ...params,
          venue_link: "https://maps.app.goo.gl/HuHURFxchQ26owKm9?g_st=aw"
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Brevo API Error:", errorData);
      throw new Error(`Brevo API Error: ${errorData}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send Brevo email:", error);
    return { success: false, error: error.message };
  }
}
