// netlify/functions/recipe.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: "Trūksta prompt" }) };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 900,
        messages:   [{ role:"user", content:prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.error?.message || "Anthropic API klaida" }),
      };
    }

    return {
      statusCode: 200,
      headers:    { "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" },
      body:       JSON.stringify(data),
    };
  } catch(e) {
    return { statusCode:500, body: JSON.stringify({ error: e.message }) };
  }
};
