import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveRequestPath(urlPath) {
  const cleanPath = decodeURIComponent((urlPath || "/").split("?")[0]);
  const relativePath = cleanPath.replace(/^\/+/, "");
  const candidatePath = path.join(distDir, relativePath);

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return { filePath: candidatePath, isFallback: false };
  }

  if (existsSync(candidatePath) && statSync(candidatePath).isDirectory()) {
    const indexPath = path.join(candidatePath, "index.html");
    if (existsSync(indexPath)) {
      return { filePath: indexPath, isFallback: false };
    }
  }

  const htmlPath = `${candidatePath}.html`;
  if (existsSync(htmlPath)) {
    return { filePath: htmlPath, isFallback: false };
  }

  const dynamicRoutes = [
    [/^markets\/[^/]+$/, "markets/[market].html"],
    [/^market\/[^/]+$/, "market/[market].html"],
    [/^bias\/[^/]+$/, "bias/[id].html"],
    [/^review\/[^/]+$/, "review/[id].html"],
    [/^analysis\/[^/]+$/, "analysis/[id].html"],
    [/^altcoin\/[^/]+$/, "altcoin/[id].html"],
    [/^member\/[^/]+$/, "member/[id].html"],
  ];
  const dynamicMatch = dynamicRoutes.find(([pattern]) => pattern.test(relativePath));
  if (dynamicMatch) {
    return { filePath: path.join(distDir, dynamicMatch[1]), isFallback: false };
  }

  return { filePath: path.join(distDir, "index.html"), isFallback: true };
}

const server = http.createServer(async (req, res) => {
  const { filePath, isFallback } = resolveRequestPath(req.url || "/");

  if (!existsSync(filePath)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("dist/index.html is missing. Run `npm run build:web` first.");
    return;
  }

  const extension = path.extname(filePath);
  const contentType = contentTypes[extension] || "application/octet-stream";

  if (isFallback && extension === ".html") {
    const html = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
    res.end(html);
    return;
  }

  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static web preview with SPA fallback running at http://127.0.0.1:${port}`);
});
