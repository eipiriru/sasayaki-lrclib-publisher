import { publishToLrclib } from "../../server-proxy.mjs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const { status, result } = await publishToLrclib(payload);
    return new Response(result == null ? null : JSON.stringify(result), {
      status,
      headers: result == null ? {} : { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
