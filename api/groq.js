export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔑 Multiple Groq API Keys (from Vercel env)
  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
  ].filter(Boolean); // remove empty

  if (keys.length === 0) {
    return res.status(500).json({ error: "No API keys configured" });
  }

  let lastError = null;

  // 🔁 Try each key until success
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + key
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();

      // ✅ Success → return immediately
      if (response.ok && data?.choices) {
        return res.status(200).json(data);
      }

      // ❌ API returned error
      console.log(`Key ${i + 1} failed:`, data?.error || "Unknown error");
      lastError = data;

    } catch (err) {
      console.log(`Key ${i + 1} crashed:`, err.message);
      lastError = err;
    }
  }

  // ❌ All keys failed
  return res.status(500).json({
    error: "All API keys failed",
    details: lastError?.error || lastError?.message || "Unknown issue"
  });
}
