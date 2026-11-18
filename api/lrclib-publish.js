import { publishToLrclib, validatePublishPayload } from "../server-proxy.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

    const validationError = validatePublishPayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const { status, result } = await publishToLrclib(payload);
    if (result == null) return res.status(status).end();
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
