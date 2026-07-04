/**
 * ============================================================
 *  Google Maps Business Scraper — Optimized v2
 *  Stack : puppeteer + fast-csv
 *  Output: ./output/results_<timestamp>.csv
 * ============================================================
 *
 *  OPTIMIZATION NOTES vs v1:
 *  ─────────────────────────
 *  1. Name, rating & address extracted directly from the card
 *     in the list panel — NO clicking or navigation per card.
 *  2. Phone numbers fetched concurrently (CONCURRENCY tabs).
 *  3. Scroll step increased to full panel height for speed.
 *  4. All delays tuned down to sensible minimums.
 *  5. Stealth flags applied via launch args only (no plugin).
 *
 *  SELECTOR MAINTENANCE GUIDE
 *  ──────────────────────────
 *  Google periodically renames its CSS classes (auto-generated
 *  hashes, e.g. "Nv2PK", "fontBodyMedium").
 *  When something stops working:
 *  1. Open Chrome DevTools (F12) on maps.google.com.
 *  2. Perform the same search the scraper does.
 *  3. Right-click the target element → "Inspect".
 *  4. Copy the new selector and update the CONFIG.SELECTORS key.
 *  Prefer [aria-label], [data-*], role= attributes over raw
 *  class names — they tend to survive UI refreshes longer.
 * ============================================================
 */

import puppeteer from 'puppeteer';
import { createWriteStream } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { format as formatCSV } from 'fast-csv';
import path from 'path';
import inquirer from 'inquirer';
import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG — single source of truth.
//  Edit here when Google changes its UI; no hunting through code is needed.
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // ── Search ────────────────────────────────────────────────────────────────
  DEFAULT_SEARCH_QUERY: 'Coffee shop di Yogyakarta',
  SEARCH_QUERY: '',
  OUTPUT_FORMAT: 'CSV',

  // ── Limits ────────────────────────────────────────────────────────────────
  MAX_RESULTS: 100,
  OUTPUT_DIR: './output',

  // ── Concurrency ───────────────────────────────────────────────────────────
  // Number of tabs opened simultaneously to fetch phone numbers.
  // Higher = faster, but risks triggering rate limits. 3–5 is safe.
  CONCURRENCY: 4,

  // ── Browser ───────────────────────────────────────────────────────────────
  // Set HEADLESS to false during development to watch the browser.
  // Set HEADLESS to true for production runs.
  HEADLESS: true,

  VIEWPORT: { width: 1280, height: 800 },

  // ── Delays (milliseconds) ─────────────────────────────────────────────────
  DELAYS: {
    AFTER_NAV: 3000,  // after initial page load
    SCROLL_STEP: 600,  // between each scroll step
    DETAIL_LOAD: 2500,  // wait for detail panel on phone-fetch tab
    BETWEEN_BATCH: 1000,  // between concurrency batches
  },

  // ── CSS Selectors ─────────────────────────────────────────────────────────
  //
  //  HOW TO UPDATE:
  //  • Open DevTools on maps.google.com with your search active
  //  • Inspect each element type listed below
  //  • Prefer stable attributes: aria-label, data-*, role
  //
  SELECTORS: {
    // Scrollable result list container (left-side panel)
    RESULTS_PANEL: 'div[role="feed"]',

    // Individual business card — confirmed by live DOM inspection
    RESULT_CARDS: '.Nv2PK',

    // Link element inside card that holds the place URL (for phone fetching)
    CARD_LINK: '.Nv2PK a[href*="/maps/place"]',

    // ── Inside a list card (no clicking needed) ──────────────────────────
    // Business name inside the card
    CARD_NAME: '.Nv2PK .qBF1Pd',

    // Rating text inside the card (e.g. "4.5")
    CARD_RATING: '.Nv2PK .MW4etd',

    // Short address / category text inside the card
    CARD_ADDRESS: '.Nv2PK .W4Efsd:last-child .W4Efsd:last-child span:last-child',

    // ── Detail page selectors (only for phone number) ────────────────────
    // Full address on the detail panel (more complete than list card)
    DETAIL_ADDRESS: 'button[data-item-id="address"] .Io6YTe',

    // Phone number
    DETAIL_PHONE: 'button[data-tooltip="Copy phone number"] .Io6YTe',

    // Website link on detail page
    DETAIL_WEBSITE: 'a[data-item-id="authority"]',

    // "You've reached the end of the list" sentinel
    END_OF_LIST: 'span.HlvSq',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString()}]  ${msg}`);

const buildOutputPath = (ext = 'csv') => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const safeQuery = (CONFIG.SEARCH_QUERY || 'results')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return path.join(CONFIG.OUTPUT_DIR, `${safeQuery}_${ts}.${ext}`);
};

// ─────────────────────────────────────────────────────────────────────────────
//  1. Browser init
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Launches a stealth-configured Puppeteer browser.
 * All anti-detection flags applied via launch args (no plugin needed).
 */
async function initBrowser() {
  log('Launching browser…');
  const browser = await puppeteer.launch({
    channel: 'chrome',
    headless: CONFIG.HEADLESS,
    defaultViewport: CONFIG.VIEWPORT,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--lang=en-US,en',
      `--window-size=${CONFIG.VIEWPORT.width},${CONFIG.VIEWPORT.height}`,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  log('Browser ready.');
  return browser;
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. Navigate directly to search results URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Navigates to the pre-formed Google Maps search URL.
 * This skips the homepage entirely and avoids the race condition where
 * the search box hasn't rendered yet when we try to type into it.
 */
async function navigateToSearch(page) {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(CONFIG.SEARCH_QUERY)}?hl=en`;
  log(`Navigating to search results: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90_000 });
  await sleep(CONFIG.DELAYS.AFTER_NAV);

  await page.waitForSelector(CONFIG.SELECTORS.RESULTS_PANEL, { timeout: 20_000 });
  log('Results panel ready.');
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. Scroll panel until end or max results reached
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scrolls the left results panel until one of:
 *   a) End-of-list sentinel is visible
 *   b) Card count >= MAX_RESULTS
 *   c) 3 consecutive scrolls with no new cards (stuck guard)
 *
 * @param {import('puppeteer').Page} page
 * @returns {Promise<number>} total card count
 */
async function scrollUntilDone(page) {
  log('Scrolling to load all results…');
  let previous = 0;
  let stuck = 0;
  const MAX_STUCK = 3;

  while (true) {
    // Check end-of-list sentinel
    const ended = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return !!(el && el.offsetParent !== null);
    }, CONFIG.SELECTORS.END_OF_LIST).catch(() => false);

    if (ended) { log('End-of-list detected.'); break; }

    const count = await page.evaluate(
      (sel) => document.querySelectorAll(sel).length,
      CONFIG.SELECTORS.RESULT_CARDS
    ).catch(() => 0);

    log(`  Cards: ${count}`);

    if (count >= CONFIG.MAX_RESULTS) {
      log(`Reached MAX_RESULTS (${CONFIG.MAX_RESULTS}).`);
      break;
    }

    if (count === previous) {
      stuck++;
      if (stuck >= MAX_STUCK) { log('Scroll stuck — stopping.'); break; }
    } else {
      stuck = 0;
    }
    previous = count;

    // Scroll the panel by its full visible height for maximum speed
    await page.evaluate((panelSel) => {
      const panel = document.querySelector(panelSel);
      if (panel) panel.scrollTop += panel.clientHeight;
    }, CONFIG.SELECTORS.RESULTS_PANEL);

    await sleep(CONFIG.DELAYS.SCROLL_STEP);
  }

  const total = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    CONFIG.SELECTORS.RESULT_CARDS
  ).catch(() => 0);

  log(`Scroll done. ${total} cards loaded.`);
  return Math.min(total, CONFIG.MAX_RESULTS);
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. Fast extraction from list cards (name, rating, address, URL)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the fields that are already visible in the list cards —
 * no clicking or page navigation required.
 * Also captures the place URL for later phone-number fetching.
 *
 * @param {import('puppeteer').Page} page
 * @param {number} limit
 * @returns {Promise<Array<{name, rating, address, url}>>}
 */
async function extractFromCards(page, limit) {
  log(`Extracting data from ${limit} cards…`);

  return page.evaluate(({ cardSel, nameSel, ratingSel, addrSel, linkSel, limit }) => {
    const cards = Array.from(document.querySelectorAll(cardSel)).slice(0, limit);

    return cards.map((card) => {
      const text = (sel) => {
        const el = card.querySelector(sel.replace(cardSel + ' ', '').replace(cardSel, ''));
        return el ? el.innerText.trim() : 'N/A';
      };

      // Name
      const nameEl = card.querySelector('.qBF1Pd');
      const ratingEl = card.querySelector('.MW4etd');
      const linkEl = card.querySelector('a[href*="/maps/place"]');

      // Address: grab last visible text span in the subtitle section
      const addrSpans = card.querySelectorAll('.W4Efsd span[aria-label]');
      let address = 'N/A';
      if (addrSpans.length > 0) {
        address = addrSpans[addrSpans.length - 1].innerText.trim();
      } else {
        // fallback: all text lines after rating line
        const lines = card.innerText.split('\n').filter(Boolean);
        address = lines.length > 2 ? lines.slice(2).join(', ') : 'N/A';
      }

      return {
        name: nameEl ? nameEl.innerText.trim() : 'N/A',
        rating: ratingEl ? ratingEl.innerText.trim() : 'N/A',
        address,
        url: linkEl ? linkEl.href : null,
        phone: 'N/A',  // to be filled later by fetchPhones()
        website: 'N/A',
        email: 'N/A',
      };
    });
  }, {
    cardSel: CONFIG.SELECTORS.RESULT_CARDS,
    nameSel: CONFIG.SELECTORS.CARD_NAME,
    ratingSel: CONFIG.SELECTORS.CARD_RATING,
    addrSel: CONFIG.SELECTORS.CARD_ADDRESS,
    linkSel: CONFIG.SELECTORS.CARD_LINK,
    limit,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  5. Concurrent phone number fetching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens up to CONFIG.CONCURRENCY tabs simultaneously to fetch phone numbers.
 * Falls back gracefully to 'N/A' if the element is missing or times out.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {Array<{name, rating, address, url, phone}>} records
 */
async function fetchPhones(browser, records) {
  log(`Fetching phone numbers with concurrency=${CONFIG.CONCURRENCY}…`);
  const total = records.length;

  for (let i = 0; i < total; i += CONFIG.CONCURRENCY) {
    const batch = records.slice(i, i + CONFIG.CONCURRENCY);
    log(`  Batch ${Math.floor(i / CONFIG.CONCURRENCY) + 1}: cards ${i + 1}–${Math.min(i + CONFIG.CONCURRENCY, total)}`);

    await Promise.all(
      batch.map(async (record) => {
        if (!record.url) return;

        let tab;
        try {
          tab = await browser.newPage();
          await tab.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

          await tab.goto(record.url, {
            waitUntil: 'domcontentloaded',
            timeout: 30_000,
          });

          await sleep(CONFIG.DELAYS.DETAIL_LOAD);

          // Try to get phone number
          const phone = await tab
            .$eval(CONFIG.SELECTORS.DETAIL_PHONE, (el) => el.innerText.trim())
            .catch(() => 'N/A');

          // Try to get website
          const website = await tab
            .$eval(CONFIG.SELECTORS.DETAIL_WEBSITE, (el) => el.href)
            .catch(() => 'N/A');

          // Optionally upgrade address with the detail-page version
          const detailAddr = await tab
            .$eval(CONFIG.SELECTORS.DETAIL_ADDRESS, (el) => el.innerText.trim())
            .catch(() => null);

          record.phone = phone;
          if (website && website !== 'N/A') record.website = website;
          if (detailAddr && detailAddr !== 'N/A') record.address = detailAddr;

          // Attempt to extract email from the website
          if (record.website !== 'N/A') {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 6000);
              const response = await fetch(record.website, { 
                signal: controller.signal, 
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } 
              });
              clearTimeout(timeoutId);
              
              if (response.ok) {
                const text = await response.text();
                // Extract emails via regex
                const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
                if (emails) {
                  const validEmails = emails.filter(e => 
                    !e.endsWith('.png') && !e.endsWith('.jpg') && 
                    !e.endsWith('.webp') && !e.includes('sentry') && 
                    !e.includes('wixpress') && !e.includes('example.com')
                  );
                  if (validEmails.length > 0) {
                    record.email = validEmails[0].toLowerCase();
                  }
                }
              }
            } catch (err) {
              // Ignore fetch errors (timeout, blocked, invalid certs)
            }
          }

          log(`    ✓ ${record.name} | ☎ ${phone} | ✉ ${record.email}`);
        } catch (err) {
          log(`    ✗ ${record.name}: ${err.message.slice(0, 60)}`);
        } finally {
          if (tab) await tab.close().catch(() => { });
        }
      })
    );

    // Small pause between batches to avoid rate limiting
    if (i + CONFIG.CONCURRENCY < total) {
      await sleep(CONFIG.DELAYS.BETWEEN_BATCH);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  6. Save to CSV
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Streams records to a UTF-8 CSV file.
 * Columns: Name, Phone, Address, Rating
 *
 * @param {Array} records
 * @returns {Promise<string>} path of saved file
 */
async function saveData(records) {
  await mkdir(CONFIG.OUTPUT_DIR, { recursive: true });

  if (CONFIG.OUTPUT_FORMAT === 'JSON') {
    const outputPath = buildOutputPath('json');
    log(`Saving ${records.length} records → ${outputPath} [JSON]`);
    await writeFile(outputPath, JSON.stringify(records, null, 2), 'utf8');
    log(`✅ Saved: ${outputPath}`);
    return outputPath;
  }

  if (CONFIG.OUTPUT_FORMAT === 'Excel') {
    const outputPath = buildOutputPath('xlsx');
    log(`Saving ${records.length} records → ${outputPath} [Excel]`);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Scraping Results');
    
    // Define headers
    sheet.columns = [
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Address', key: 'address', width: 60 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Website', key: 'website', width: 40 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'URL', key: 'url', width: 50 }
    ];
    
    // Style headers
    sheet.getRow(1).font = { bold: true };
    
    sheet.addRows(records);
    await workbook.xlsx.writeFile(outputPath);
    log(`✅ Saved: ${outputPath}`);
    return outputPath;
  }

  // Fallback to CSV
  const outputPath = buildOutputPath('csv');
  log(`Saving ${records.length} records → ${outputPath} [CSV]`);
  return new Promise((resolve, reject) => {
    const ws = createWriteStream(outputPath);
    const csv = formatCSV({ headers: true, quoteColumns: true });
    csv.pipe(ws);

    ws.on('finish', () => { log(`✅ Saved: ${outputPath}`); resolve(outputPath); });
    ws.on('error', reject);
    csv.on('error', reject);

    for (const r of records) {
      csv.write({
        Name: r.name ?? 'N/A',
        Phone: r.phone ?? 'N/A',
        Address: r.address ?? 'N/A',
        Email: r.email ?? 'N/A',
        Website: r.website ?? 'N/A',
        Rating: r.rating ?? 'N/A',
        URL: r.url ?? 'N/A',
      });
    }
    csv.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  7. Main orchestration
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // ── Interactive Prompt ─────────────────────────────────────────────────────
  console.clear();
  console.log('🚀 GOOGLE MAPS SCRAPER (Optimized v2)');
  console.log('═══════════════════════════════════════════════\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Apa yang ingin Anda cari di Google Maps?',
      default: CONFIG.DEFAULT_SEARCH_QUERY
    },
    {
      type: 'select',
      name: 'format',
      message: 'Pilih format output file untuk disimpan:',
      choices: ['CSV', 'Excel', 'JSON'],
      default: 'CSV'
    }
  ]);

  // Apply user choices to config
  CONFIG.SEARCH_QUERY = answers.query;
  CONFIG.OUTPUT_FORMAT = answers.format;

  const t0 = Date.now();
  console.log('\n═══════════════════════════════════════════════');
  log(`  Query       : ${CONFIG.SEARCH_QUERY}`);
  log(`  Format      : ${CONFIG.OUTPUT_FORMAT}`);
  log(`  Max results : ${CONFIG.MAX_RESULTS}`);
  log(`  Concurrency : ${CONFIG.CONCURRENCY} tabs`);
  log(`  Mode        : ${CONFIG.HEADLESS ? 'Headless (production)' : 'Visible (debug)'}`);
  log('═══════════════════════════════════════════════');

  let browser;
  try {
    browser = await initBrowser();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    // ── Phase 1: scroll & load cards ────────────────────────────────────────
    await navigateToSearch(page);
    const total = await scrollUntilDone(page);
    const records = await extractFromCards(page, total);

    log(`Phase 1 done: ${records.length} records from card list.`);

    // ── Phase 2: concurrent phone fetching ──────────────────────────────────
    await fetchPhones(browser, records);

    // ── Phase 3: save ────────────────────────────────────────────────────────
    await saveData(records);

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    log('═══════════════════════════════════════════════');
    log(` ✅ Done! ${records.length} records in ${elapsed}s`);
    log('═══════════════════════════════════════════════');
  } catch (err) {
    console.error('[FATAL]', err);
    // Save screenshot + HTML for debugging
    try {
      const pages = await browser?.pages() ?? [];
      if (pages[0]) {
        await pages[0].screenshot({ path: 'error.png' });
        const html = await pages[0].content();
        await import('fs/promises').then(m => m.writeFile('error.html', html));
        log('Saved error.png and error.html for debugging.');
      }
    } catch { }
    process.exitCode = 1;
  } finally {
    await browser?.close();
    log('Browser closed.');
  }
}

main();
