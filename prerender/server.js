"use strict";

const express = require("express");
const puppeteer = require("puppeteer");

const PORT = parseInt(process.env.PORT || "3000", 10);
const MAX_CONCURRENCY = Math.max(1, parseInt(process.env.MAX_CONCURRENCY || "2", 10));
const MAX_WAIT_MS = parseInt(process.env.MAX_WAIT_MS || "12000", 10);
const SETTLE_MS = parseInt(process.env.SETTLE_MS || "1000", 10);
const CACHE_S_MAXAGE = parseInt(process.env.CACHE_S_MAXAGE || "3600", 10);

// Optional Chromium host-resolver rules (e.g. "MAP localhost 172.17.0.1" in dev
// so the headless browser can reach host-published ports through the docker0
// gateway, keeping the page origin on localhost for CORS).
const HOST_RESOLVER_RULES = (process.env.HOST_RESOLVER_RULES || "").trim();

// Optional in-flight request rewrite — used in dev where the SPA bundle calls
// the API at http://localhost:20050 (host-only). Rewrite those to the internal
// api service so the headless browser can reach them from inside the network.
const API_REWRITE_FROM = (process.env.API_REWRITE_FROM || "").trim();
const API_REWRITE_TO = (process.env.API_REWRITE_TO || "").trim();

// Internal frontend origin (rendered by headless Chromium — bypasses the CDN
// so we always snapshot a fresh SPA, never a cached shell) and the public
// origin (rewritten into the HTML so canonical/og:url are correct for SEO).
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "http://frontend:23050").replace(/\/+$/, "");
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://htashop.com").replace(/\/+$/, "");

// Paths we are willing to render for crawlers. Everything else falls through
// to the normal SPA (auth, checkout, account, cart, …). Comma-separated regexes.
// Keep in sync with PRERENDER_WHITELIST in docker-compose.yml and
// docker-swarm.yml, and the is_prerenderable ACL in deploy/config/haproxy.cfg.
const WHITELIST = (
  process.env.PRERENDER_WHITELIST ||
  "^/$, ^/products(/.*)?$, ^/policies(/.*)?$, ^/(blogs|news|events|announcements|press-releases|promotions|updates|showcases|guides|newsletters)(/.*)?$, ^/contact$, ^/feedback$"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((pattern) => new RegExp(pattern));

// A realistic desktop Chrome UA — never a bot UA, so HAProxy serves the SPA
// to this renderer (no routing loop back into the prerender backend).
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let active = 0;

async function withConcurrency(task) {
  while (active >= MAX_CONCURRENCY) {
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  active += 1;
  try {
    return await task();
  } finally {
    active -= 1;
  }
}

async function render(pathWithQuery) {
  const target = `${FRONTEND_ORIGIN}${pathWithQuery}`;
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      ...(HOST_RESOLVER_RULES ? [`--host-resolver-rules=${HOST_RESOLVER_RULES}`] : []),
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(BROWSER_UA);
    await page.setViewport({ width: 1440, height: 900 });
    await page.setJavaScriptEnabled(true);

    // Rewrite API calls made from the SPA (dev only — production bundles use
    // the public api.htashop.com URL which is reachable directly).
    if (API_REWRITE_FROM && API_REWRITE_TO) {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const url = request.url();
        if (url.startsWith(API_REWRITE_FROM)) {
          request.continue({ url: API_REWRITE_TO + url.slice(API_REWRITE_FROM.length) });
        } else {
          request.continue();
        }
      });
    }

    const response = await page
      .goto(target, { waitUntil: "networkidle2", timeout: MAX_WAIT_MS })
      .catch(() => null);

    // Let late async rendering (fonts, images, react-query hydration) settle
    // before snapshotting the DOM.
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

    let html = await page.content();
    const status = response ? response.status() : 200;

    // Rewrite the internal origin to the public one so canonical links,
    // og:url, and JSON-LD URLs are correct in the snapshot.
    if (PUBLIC_ORIGIN !== FRONTEND_ORIGIN) {
      html = html.split(FRONTEND_ORIGIN).join(PUBLIC_ORIGIN);
    }

    return { html, status };
  } finally {
    await browser.close();
  }
}

const app = express();
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "htashop-prerender" });
});

app.get("*", async (req, res) => {
  // Determine the path (+ query) to render:
  //  - ?url=… for direct testing / integrations
  //  - otherwise the original request path forwarded by HAProxy
  let pathWithQuery;
  const explicit = req.query.url;
  try {
    if (explicit) {
      const parsed = new URL(String(explicit));
      pathWithQuery = parsed.pathname + parsed.search;
    } else {
      pathWithQuery = req.originalUrl;
    }
  } catch {
    return res.status(400).type("text/plain").send("Bad request");
  }

  const pathname = pathWithQuery.split("?")[0];
  if (!WHITELIST.some((re) => re.test(pathname))) {
    return res.status(404).type("text/plain").send("Not found");
  }

  try {
    const { html, status } = await withConcurrency(() => render(pathWithQuery));
    res
      .status(status)
      .type("text/html; charset=utf-8")
      .set("Cache-Control", `public, s-maxage=${CACHE_S_MAXAGE}, max-age=600`)
      .set("Vary", "User-Agent")
      .send(html);
  } catch (err) {
    console.error("[prerender] render failed:", err.message);
    res.status(502).set("Cache-Control", "no-store").type("text/plain").send("Prerender failed");
  }
});

app.listen(PORT, () => {
  console.log(`[prerender] listening on :${PORT} (concurrency ${MAX_CONCURRENCY})`);
});
