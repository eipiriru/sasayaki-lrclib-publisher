import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishToLrclib } from "./server-proxy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/lrclib-publisher.html")) {
    const file = fs.readFileSync(path.join(__dirname, "lrclib-publisher.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(file);
  }

  if (req.method === "POST" && req.url === "/api/lrclib-publish") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const { status, result } = await publishToLrclib(payload);
        res.writeHead(status, result == null ? {} : { "Content-Type": "application/json" });
        res.end(result == null ? "" : JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Server aktif: http://localhost:${PORT}`);
});
