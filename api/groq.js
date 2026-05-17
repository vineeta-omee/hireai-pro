export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
  ].filter(Boolean);

  if (keys.length === 0) {
    return res.status(500).json({ error: "No API keys configured" });
  }

  const payload =
    typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + key
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      const data = await response.json();

      if (response.ok && data?.choices) {
        return res.status(200).json(data);
      }

      lastError = data;
    } catch (err) {
      lastError = err;
    }
  }

  return res.status(200).json({
    choices: [
      {
        message: {
          content: "❌ AI temporarily unavailable. Please try again."
        }
      }
    ]
  });
}
