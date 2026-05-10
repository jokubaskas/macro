const https = require("https");

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY || process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "API raktas nenurodytas serveryje" }),
    };
  }

  let prompt;
  try {
    ({ prompt } = JSON.parse(event.body));
  } catch(e) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Neteisingas užklausos formatas" }),
    };
  }

  const requestBody = JSON.stringify({
    model:      "claude-sonnet-4-20250514",
    max_tokens: 900,
    messages:   [{ role: "user", content: prompt }],
  });

  // Anthropic API per https modulį (veikia visose Node versijose)
  const result = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path:     "/v1/messages",
        method:   "POST",
        headers:  {
          "Content-Type":      "application/json",
          "Content-Length":    Buffer.byteLength(requestBody),
          "x-api-key":         apiKey,
          "anthropic-version": "2023-06-01",
        },
      },
      (res) => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on("error", reject);
    req.setTimeout(25000, () => { req.destroy(new Error("Timeout")); });
    req.write(requestBody);
    req.end();
  });

  return {
    statusCode: result.status,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: result.body,
  };
};
