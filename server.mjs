import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publishToLrclib, validatePublishPayload } from "./server-proxy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const STATIC_FILES = new Map([
  ["/", ["public/index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["public/index.html", "text/html; charset=utf-8"]],
  ["/lrclib-publisher.html", ["public/index.html", "text/html; charset=utf-8"]],
  ["/favicon.ico", ["public/favicon.ico", "image/x-icon"]],
  ["/favicon-32.png", ["public/favicon-32.png", "image/png"]],
  ["/apple-touch-icon.png", ["public/apple-touch-icon.png", "image/png"]],
  ["/logo.png", ["public/logo.png", "image/png"]]
]);

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  if ((req.method === "GET" || req.method === "HEAD") && STATIC_FILES.has(pathname)) {
    const [relativePath, contentType] = STATIC_FILES.get(pathname);
    const filePath = path.join(__dirname, relativePath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Cache-Control": contentType.startsWith("image/") ? "public, max-age=86400" : "no-cache"
    });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(filePath).pipe(res);
  }

  if (req.method === "POST" && pathname === "/api/lrclib-publish") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const validationError = validatePublishPayload(payload);
        if (validationError) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: validationError }));
        }
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

  if (pathname === "/api/lrclib-publish") {
    res.writeHead(405, { "Allow": "POST", "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Server aktif: http://localhost:${PORT}`);
});
