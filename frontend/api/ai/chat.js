export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Missing or invalid messages payload" });
  }

  try {
    // Read secure API key from environment
    // Use GROQ_API_KEY (non-public) or fallback to REACT_APP_GROQ_API_KEY if that's all that exists.
    const apiKey = process.env.GROQ_API_KEY || process.env.REACT_APP_GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: "Server misconfiguration: Missing Groq API Key" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("AI Chat Error:", err);
    return res.status(500).json({ message: "Failed to process chat request", error: err.message });
  }
}
