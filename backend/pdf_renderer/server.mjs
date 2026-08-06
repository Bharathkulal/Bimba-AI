/**
 * Bimba AI — Playwright PDF Renderer Microservice
 * 
 * Architecture:
 *  - A persistent HTTP server on port 5174 (alongside Python backend on 8000)
 *  - Single Playwright browser instance reused across requests (pool of 1 browser, N pages)
 *  - Each POST /render-pdf request:
 *      1. Opens a new blank page in the shared browser
 *      2. Sets content to the HTML rendered from the template + data
 *      3. Calls page.pdf() → real PDF with selectable text
 *      4. Closes the page, returns base64-encoded PDF bytes
 * 
 * Retry/resilience:
 *  - 3 retries with 1s backoff if browser.newPage() fails
 *  - 30s timeout per render request
 *  - Graceful shutdown on SIGTERM/SIGINT
 */

import http from 'http';
import { chromium } from 'playwright';
import { renderAtsDynamic } from './templates/ats_dynamic.mjs';

const PORT = 5174;
const RENDER_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;


// ─── Browser Pool ────────────────────────────────────────────────────────────
let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  console.log('[pdf-renderer] Launching Chromium browser...');
  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  browser.on('disconnected', () => {
    console.warn('[pdf-renderer] Browser disconnected — will re-launch on next request.');
    browser = null;
  });
  console.log('[pdf-renderer] Browser ready.');
  return browser;
}

async function renderPdf(template, data, fontFamily = 'Inter', fontSize = '11pt', customConfig = {}) {
  const html = renderAtsDynamic(data, template, {
    fontFamily,
    fontSize,
    ...customConfig
  });

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let page = null;
    try {
      const br = await getBrowser();
      page = await br.newPage();

      await page.setContent(html, { waitUntil: 'networkidle', timeout: RENDER_TIMEOUT_MS });

      // Wait for Tailwind CDN to fully apply styles
      await page.waitForTimeout(500);

      const pdfBytes = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.4in', bottom: '0.4in', left: '0.45in', right: '0.45in' },
      });

      return pdfBytes;
    } catch (err) {
      lastError = err;
      console.error(`[pdf-renderer] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    } finally {
      if (page) {
        try { await page.close(); } catch (_) {}
      }
    }
  }
  throw lastError;
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', browserReady: !!(browser && browser.isConnected()) }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/render-pdf') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const { 
      template = 'harvard', 
      data = {}, 
      fontFamily = 'Inter', 
      fontSize = '11pt',
      accentColor,
      spacing,
      margins,
      layout,
      headerStyle,
      dividerStyle,
      enabledSections
    } = payload;

    try {
      const pdfBytes = await renderPdf(template, data, fontFamily, fontSize, {
        accentColor,
        spacing,
        margins,
        layout,
        headerStyle,
        dividerStyle,
        enabledSections
      });
      const base64 = Buffer.from(pdfBytes).toString('base64');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, pdf_base64: base64 }));
    } catch (err) {
      console.error('[pdf-renderer] Render failed:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  // Pre-warm browser on startup
  try {
    await getBrowser();
  } catch (err) {
    console.error('[pdf-renderer] FATAL: Could not launch Chromium:', err.message);
    console.error('[pdf-renderer] Run: npx playwright install chromium');
    process.exit(1);
  }

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[pdf-renderer] Listening on http://127.0.0.1:${PORT}`);
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`[pdf-renderer] ${signal} received — shutting down gracefully.`);
  server.close();
  if (browser) {
    try { await browser.close(); } catch (_) {}
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
