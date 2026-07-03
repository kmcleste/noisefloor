#!/usr/bin/env node
// Browser-rendered fetch fallback for the weekly research run.
//
// Some publishers return 401/403 to plain scripted requests (the WebFetch tool)
// even for articles that are perfectly public in a browser. This renders the
// page in headless Chromium and prints the readable text so the agent can still
// cite the primary source.
//
// Scope, on purpose: this fetches PUBLIC pages only. It does not log in, solve
// CAPTCHAs, or bypass paywalls / anti-bot walls — no stealth, no evasion. If a
// page still refuses (401/403/challenge), it says so and exits non-zero. The
// agent should then fall back to the search snippet or drop the claim, never
// fabricate. It also honors robots.txt (fail-open on any error) and caps output
// so a single article can't blow up the context window.
//
//   node scripts/fetch.mjs <url>
//
// Requires the `playwright` client on NODE_PATH and a matching Chromium — both
// are provided by the mcr.microsoft.com/playwright container the workflow runs
// in. Keep the pinned version in .github/workflows/research.yml in sync.

import { chromium } from "playwright";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/fetch.mjs <url>");
  process.exit(2);
}

let target;
try {
  target = new URL(url);
  if (!/^https?:$/.test(target.protocol)) throw new Error("only http(s) URLs are allowed");
} catch (e) {
  console.error(`invalid url: ${e.message}`);
  process.exit(2);
}

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MAX_CHARS = 40_000; // keep the agent's context lean
const NAV_TIMEOUT_MS = 25_000;

// Best-effort robots.txt check. Honors an explicit Disallow that matches this
// path under a `User-agent: *` group. Any error (no robots, unreachable, parse
// failure) fails open — we don't block a legitimate single-article read on a
// flaky robots fetch.
async function robotsAllows(u) {
  try {
    const res = await fetch(new URL("/robots.txt", u).href, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return true;
    let appliesToAll = false;
    const disallows = [];
    for (const raw of (await res.text()).split(/\r?\n/)) {
      const line = raw.replace(/#.*/, "").trim();
      if (!line) continue;
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      if (key === "user-agent") appliesToAll = val === "*";
      else if (key === "disallow" && appliesToAll && val) disallows.push(val);
    }
    return !disallows.some((d) => u.pathname.startsWith(d));
  } catch {
    return true;
  }
}

if (!(await robotsAllows(target))) {
  console.error(`robots.txt disallows ${target.pathname} — skipping`);
  process.exit(3);
}

// --no-sandbox: the Playwright container runs as root, where Chromium's
// sandbox can't initialize. Safe here — we only load pages, never execute
// downloaded code.
const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();
  const resp = await page.goto(target.href, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });
  const status = resp ? resp.status() : 0;
  if (status === 401 || status === 403) {
    console.error(`blocked: HTTP ${status} (gated or anti-bot) — not bypassing`);
    process.exit(4);
  }
  await page.waitForTimeout(1200); // let client-rendered content settle

  const title = await page.title();
  const text = await page.evaluate(() => {
    for (const el of document.querySelectorAll(
      "script,style,noscript,nav,footer,header,aside,form",
    )) {
      el.remove();
    }
    const main = document.querySelector("article, main") || document.body;
    return main.innerText;
  });
  const clean = text.replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_CHARS);

  console.log(`URL: ${page.url()}`);
  console.log(`TITLE: ${title}`);
  console.log(`STATUS: ${status}`);
  console.log("---");
  console.log(clean);
} catch (e) {
  console.error(`fetch failed: ${e.message}`);
  process.exit(1);
} finally {
  await browser.close();
}
