#!/usr/bin/env node
/**
 * reader-mcp: lightweight URL→markdown MCP server
 * Tools: crawling_exa (URL to clean LLM-ready markdown)
 * SSRF: blocks RFC-1918, loopback, link-local AFTER DNS resolution
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import dns from "node:dns/promises";
import net from "node:net";

// Catch any unhandled promise rejections to prevent silent crashes.
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`[reader-mcp] unhandledRejection: ${reason}\n`);
});

// ── SSRF guard ───────────────────────────────────────────────────────────────
const BLOCKED_CIDRS = [
  { addr: "127.0.0.0", bits: 8 },
  { addr: "::1", bits: 128 },
  { addr: "10.0.0.0", bits: 8 },
  { addr: "172.16.0.0", bits: 12 },
  { addr: "192.168.0.0", bits: 16 },
  { addr: "169.254.0.0", bits: 16 },
  { addr: "fe80::", bits: 10 },
  { addr: "fc00::", bits: 7 },
  { addr: "224.0.0.0", bits: 4 },
  { addr: "ff00::", bits: 8 },
];

function ipToBigInt(ip) {
  if (net.isIPv4(ip)) {
    return ip
      .split(".")
      .reduce((acc, oct) => (acc << 8n) | BigInt(parseInt(oct, 10)), 0n);
  }
  const full = expandIPv6(ip);
  return full
    .split(":")
    .reduce((acc, group) => (acc << 16n) | BigInt(parseInt(group, 16)), 0n);
}

function expandIPv6(ip) {
  if (ip.includes("::")) {
    const [left, right] = ip.split("::");
    const leftParts = left ? left.split(":") : [];
    const rightParts = right ? right.split(":") : [];
    const missing = 8 - leftParts.length - rightParts.length;
    const mid = Array(missing).fill("0");
    return [...leftParts, ...mid, ...rightParts]
      .map((g) => g.padStart(4, "0"))
      .join(":");
  }
  return ip
    .split(":")
    .map((g) => g.padStart(4, "0"))
    .join(":");
}

function isBlockedIp(ip) {
  const ipBig = ipToBigInt(ip);
  const isV4 = net.isIPv4(ip);
  for (const { addr, bits } of BLOCKED_CIDRS) {
    const isBlockV4 = net.isIPv4(addr);
    if (isV4 !== isBlockV4) continue;
    const maskBits = isV4 ? 32n : 128n;
    const shift = maskBits - BigInt(bits);
    const addrBig = ipToBigInt(addr);
    if ((ipBig >> shift) === (addrBig >> shift)) return true;
  }
  return false;
}

async function assertPublicUrl(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error(`Invalid URL: ${urlStr}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Protocol not allowed: ${parsed.protocol}`);
  }
  const hostname = parsed.hostname;
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error(`SSRF: blocked IP address ${hostname}`);
    return;
  }
  let addrs;
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch (e) {
    throw new Error(`DNS resolution failed for ${hostname}: ${e.message}`);
  }
  for (const { address } of addrs) {
    if (isBlockedIp(address)) {
      throw new Error(`SSRF: ${hostname} resolves to blocked address ${address}`);
    }
  }
}

// ── Fetch with size cap ───────────────────────────────────────────────────────
const MAX_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT = 10_000;

async function fetchWithCap(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "reader-mcp/1.0 (url-to-markdown)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error(`Response exceeds 2MB size cap`);
      }
      chunks.push(value);
    }
    const contentType = res.headers.get("content-type") ?? "";
    const body = Buffer.concat(chunks).toString("utf-8");
    return { body, contentType, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

// ── HTML → Markdown pipeline ──────────────────────────────────────────────────
const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
td.remove(["script", "style", "noscript", "iframe", "nav", "footer", "aside"]);

function htmlToMarkdown(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document, { keepClasses: false });
  const article = reader.parse();
  if (article?.content) {
    const title = article.title ? `# ${article.title}\n\n` : "";
    return title + td.turndown(article.content);
  }
  return td.turndown(dom.window.document.body.innerHTML);
}

// ── MCP server ────────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "reader-mcp",
  version: "1.0.0",
});

server.tool(
  "crawling_exa",
  "Fetch one or more URLs and return clean, LLM-ready markdown. Uses Mozilla Readability for article extraction. Does NOT render JavaScript. Blocked: private IPs, localhost, RFC-1918 ranges (SSRF protection).",
  {
    urls: z
      .array(z.string().url())
      .min(1)
      .max(5)
      .describe("Array of URLs to fetch and convert to markdown. Max 5 per call."),
    maxCharacters: z
      .number()
      .int()
      .min(500)
      .max(50000)
      .default(3000)
      .describe("Maximum characters to return per URL (default: 3000)."),
  },
  async ({ urls, maxCharacters }) => {
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        await assertPublicUrl(url);
        const { body, contentType, finalUrl } = await fetchWithCap(url);
        if (finalUrl !== url) await assertPublicUrl(finalUrl);
        let markdown;
        if (contentType.includes("text/html")) {
          markdown = htmlToMarkdown(body, finalUrl);
        } else if (contentType.includes("text/") || contentType.includes("json")) {
          markdown = "```\n" + body + "\n```";
        } else {
          throw new Error(`Unsupported content-type: ${contentType}`);
        }
        const truncated =
          markdown.length > maxCharacters
            ? markdown.slice(0, maxCharacters) +
              "\n\n[...truncated at " +
              maxCharacters +
              " characters]"
            : markdown;
        return { url, markdown: truncated, characters: truncated.length };
      })
    );
    const output = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { url: urls[i], error: r.reason?.message ?? String(r.reason) }
    );
    return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
