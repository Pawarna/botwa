import puppeteer from 'puppeteer';
import prisma from '../utils/prisma';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export const scrapeEmitter = new EventEmitter();

// Rotate user-agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const CONFIG = {
  MAX_RESULTS: 30,
  CONCURRENCY: 4,
  HEADLESS: true,
  VIEWPORT: { width: 1366, height: 768 },
  DELAYS: {
    AFTER_NAV: 2000,
    SCROLL_STEP: 500,
    DETAIL_LOAD: 3000,
    BETWEEN_BATCH: 500,
  },
  SELECTORS: {
    // Try multiple possible card selectors (Google changes these often)
    RESULT_CARDS_OPTIONS: ['.Nv2PK', '[data-result-index]', '.bfdHYd', 'div[role="feed"] > div > div > a'],
    RESULT_CARDS: '.Nv2PK',
    RESULTS_PANEL: 'div[role="feed"]',
    CARD_LINK: 'a[href*="/maps/place"]',
    CARD_NAME: '.qBF1Pd',
    CARD_RATING: '.MW4etd',
    DETAIL_ADDRESS: 'button[data-item-id="address"] .Io6YTe',
    // Google localises the tooltip ("Copy phone number" vs "Salin nomor telepon"),
    // but the button id always carries the raw number — match on that instead.
    DETAIL_PHONE: 'button[data-item-id^="phone:tel"] .Io6YTe, button[data-item-id^="phone:tel"], button[data-tooltip="Copy phone number"] .Io6YTe',
    DETAIL_WEBSITE: 'a[data-item-id="authority"]',
    END_OF_LIST: 'span.HlvSq',
  },
  BLOCKED_RESOURCE_TYPES: ['image', 'media', 'font'],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Block unnecessary resources on a page to speed up loading */
async function setupPageInterception(page: any) {
  await page.setRequestInterception(true);
  page.on('request', (req: any) => {
    const resType = req.resourceType();
    const url = req.url();

    // Block ads, analytics, images, fonts, css
    if (
      CONFIG.BLOCKED_RESOURCE_TYPES.includes(resType) ||
      url.includes('google-analytics') ||
      url.includes('googletagmanager') ||
      url.includes('doubleclick.net') ||
      url.includes('googlesyndication')
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

async function initBrowser() {
  return await puppeteer.launch({
    channel: 'chrome',
    headless: CONFIG.HEADLESS,
    defaultViewport: CONFIG.VIEWPORT,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--lang=id-ID,id,en-US,en',
      '--disable-web-security',
      `--window-size=${CONFIG.VIEWPORT.width},${CONFIG.VIEWPORT.height}`,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
}

async function saveDebugScreenshot(page: any, label: string) {
  try {
    const dir = path.join(process.cwd(), 'debug_screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${label}_${Date.now()}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`[Scraper] 📸 Debug screenshot: ${file}`);
  } catch { /* ignore */ }
}

// ─── Email extraction ──────────────────────────────────────────────────────
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Junk addresses we never want to save (assets, trackers, placeholders)
const EMAIL_BLOCKLIST = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js', '.woff', '.woff2', '.ico',
  '@2x', 'example.com', 'domain.com', 'yourdomain', 'sentry', 'wixpress', 'w3.org',
  'schema.org', 'googleapis', 'cloudflare', 'wordpress.com', 'noreply', 'no-reply',
];

function normalizeUrl(raw?: string | null): string | null {
  let value = (raw || '').trim();
  if (!value || value === 'N/A') return null;
  if (!/^https?:\/\//i.test(value)) value = 'https://' + value.replace(/^\/+/, '');
  try { return new URL(value).toString(); } catch { return null; }
}

/** Pick the best email out of an HTML document (mailto links win, site domain preferred). */
function pickEmail(html: string, siteHost: string): string | null {
  const candidates: string[] = [];

  const mailto = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
  if (mailto) candidates.push(...mailto.map((m) => m.replace(/^mailto:/i, '')));

  const found = html.match(EMAIL_REGEX);
  if (found) candidates.push(...found);

  const cleaned = Array.from(
    new Set(
      candidates
        .map((e) => e.toLowerCase().replace(/[.,;:)\]}]+$/, ''))
        .filter((e) => {
          const [local, domain] = e.split('@');
          if (!local || !domain || !domain.includes('.') || domain.length < 4) return false;
          return !EMAIL_BLOCKLIST.some((bad) => e.includes(bad));
        })
    )
  );

  if (cleaned.length === 0) return null;

  const host = siteHost.replace(/^www\./, '');
  const matched = cleaned.find((e) => {
    const domain = e.split('@')[1].replace(/^www\./, '');
    return domain === host || host.endsWith(`.${domain}`) || domain.endsWith(`.${host}`);
  });

  return matched || cleaned[0];
}

async function fetchHtml(url: string, timeout = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType && !contentType.includes('html')) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/** Grab the first usable email address from a business website. */
async function fetchEmailFromWebsite(website: string): Promise<string | null> {
  const base = normalizeUrl(website);
  if (!base) return null;

  let origin = '';
  let host = '';
  try {
    const u = new URL(base);
    origin = u.origin;
    host = u.hostname;
  } catch {
    return null;
  }

  const home = await fetchHtml(base);
  if (!home) return null;

  const fromHome = pickEmail(home, host);
  if (fromHome) return fromHome;

  // Common contact pages — only tried when the homepage had nothing
  for (const path of ['/contact', '/contact-us', '/kontak']) {
    const html = await fetchHtml(`${origin}${path}`, 4000);
    if (!html) continue;
    const email = pickEmail(html, host);
    if (email) return email;
  }

  return null;
}

async function navigateToSearch(page: any, query: string) {
  await setupPageInterception(page);

  const ua = getRandomUA();
  await page.setUserAgent(ua);
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });

  // Hide puppeteer automation signals
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'languages', { get: () => ['id-ID', 'id', 'en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });

  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=id`;
  console.log(`[Scraper] 🌐 Navigating to: ${url}`);
  scrapeEmitter.emit('log', { type: 'info', msg: `Navigating to Google Maps...` });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await sleep(CONFIG.DELAYS.AFTER_NAV);

  // Handle Google consent page if present
  const currentUrl = page.url();
  if (currentUrl.includes('consent.google') || currentUrl.includes('accounts.google')) {
    console.log('[Scraper] ⚠️  Google consent page detected — trying to accept...');
    scrapeEmitter.emit('log', { type: 'info', msg: 'Handling Google consent page...' });
    // Try clicking accept button
    const acceptBtn = await page.$('button[aria-label*="Accept"], button[aria-label*="Setuju"], #L2AGLb, .tHlp8d');
    if (acceptBtn) {
      await acceptBtn.click();
      await sleep(2000);
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => {});
    }
  }

  // Try to find result cards using multiple possible selectors
  let foundSelector = '';
  for (const sel of CONFIG.SELECTORS.RESULT_CARDS_OPTIONS) {
    try {
      await page.waitForSelector(sel, { timeout: 12_000 });
      const count = await page.$$eval(sel, (els: Element[]) => els.length);
      if (count > 0) {
        foundSelector = sel;
        console.log(`[Scraper] ✅ Found ${count} cards with selector: ${sel}`);
        scrapeEmitter.emit('log', { type: 'info', msg: `Found result cards (${count}) on page.` });
        break;
      }
    } catch { /* try next */ }
  }

  if (!foundSelector) {
    await saveDebugScreenshot(page, 'no_cards_found');
    const pageTitle = await page.title();
    const bodySnippet = await page.$eval('body', (el: Element) => (el as HTMLElement).innerText.substring(0, 300)).catch(() => '');
    throw new Error(`Could not find result cards. Page title: "${pageTitle}". Body: ${bodySnippet}`);
  }

  // Update CONFIG to use the working selector for this run
  CONFIG.SELECTORS.RESULT_CARDS = foundSelector;
}

async function scrollUntilDone(page: any, limit: number) {
  let previous = 0;
  let stuck = 0;
  const MAX_STUCK = 4;

  console.log(`[Scraper] Scrolling to fetch up to ${limit} result cards...`);
  scrapeEmitter.emit('log', { type: 'info', msg: `Scrolling to fetch up to ${limit} result cards...` });
  while (true) {
    const count = await page.evaluate(
      (sel: string) => document.querySelectorAll(sel).length,
      CONFIG.SELECTORS.RESULT_CARDS
    ).catch(() => 0);

    if (count >= limit) {
      console.log(`[Scraper] ✅ Target reached: ${count} cards loaded.`);
      break;
    }

    // Check if we've hit the natural end of the list
    const endOfList = await page.$(CONFIG.SELECTORS.END_OF_LIST);
    if (endOfList) {
      console.log(`[Scraper] ✅ End of list reached: ${count} cards total.`);
      break;
    }

    if (count === previous) {
      stuck++;
      if (stuck >= MAX_STUCK) {
        console.log(`[Scraper] ⚠️  No new cards loaded after ${MAX_STUCK} attempts. Stopping at ${count}.`);
        break;
      }
    } else {
      stuck = 0;
    }
    previous = count;

    // Scroll the panel to load more results by finding the scrollable parent of the cards
    await page.evaluate((cardSel: string) => {
      const card = document.querySelector(cardSel);
      if (!card) return;
      
      let parent = card.parentElement;
      while (parent && parent !== document.body) {
        if (parent.scrollHeight > parent.clientHeight) {
          parent.scrollTop += parent.clientHeight;
          break;
        }
        parent = parent.parentElement;
      }
    }, CONFIG.SELECTORS.RESULT_CARDS);

    process.stdout.write(`\r[Scraper] 🔄 Cards loaded: ${count}/${limit} `);
    scrapeEmitter.emit('log', { type: 'progress', msg: `Cards loaded: ${count}/${limit}` });
    await sleep(CONFIG.DELAYS.SCROLL_STEP);
  }
  console.log(''); // newline after inline counter

  const total = await page.evaluate(
    (sel: string) => document.querySelectorAll(sel).length,
    CONFIG.SELECTORS.RESULT_CARDS
  ).catch(() => 0);

  return Math.min(total, limit);
}

async function extractFromCards(page: any, limit: number) {
  return page.evaluate(({ cardSel, limit }: any) => {
    const cards = Array.from(document.querySelectorAll(cardSel)).slice(0, limit);
    return cards.map((card: any) => {
      const nameEl = card.querySelector('.qBF1Pd');
      const ratingEl = card.querySelector('.MW4etd');
      const linkEl = card.querySelector('a[href*="/maps/place"]');
      
      // Fix: Improved Address Extraction Logic (Avoids Schedule & Features)
      let finalAddress = 'N/A';
      const w4Elements = Array.from(card.querySelectorAll('.W4Efsd'));
      
      for (const el of w4Elements as Element[]) {
        // Skip parent containers
        if (el.querySelector('.W4Efsd')) continue;
        
        const text = (el as HTMLElement).innerText || '';
        
        // Skip lines containing hours or typical features
        if (text.match(/(Buka|Tutup|Open|Closed|24 jam|AM|PM|Dine-in|Takeaway|Delivery|Bawa pulang|Makan di tempat)/i)) continue;
        
        if (text.includes('·')) {
          const parts = text.split('·');
          // Take everything after the first bullet (e.g. "Category · Address")
          const possibleAddress = parts.slice(1).join('·').trim();
          
          if (possibleAddress.length > 3 && !possibleAddress.includes('★') && !possibleAddress.match(/^\$+$/)) {
            finalAddress = possibleAddress;
            break; // Stop after finding the first valid address
          }
        }
      }

      return {
        name: nameEl ? nameEl.innerText.trim() : 'N/A',
        rating: ratingEl ? ratingEl.innerText.trim() : 'N/A',
        address: finalAddress,
        url: linkEl ? linkEl.href : null,
        phone: 'N/A',
        website: 'N/A',
        email: 'N/A',
      };
    });
  }, { cardSel: CONFIG.SELECTORS.RESULT_CARDS, limit });
}

async function fetchPhones(browser: any, records: any[]) {
  const total = records.length;
  let completed = 0;
  const recordsWithUrl = records.filter(r => r.url);

  console.log(`[Scraper] Starting phone number extraction for ${total} places...`);
  scrapeEmitter.emit('log', { type: 'info', msg: `Extracting phones for ${total} places (concurrency: ${CONFIG.CONCURRENCY})...` });

  for (let i = 0; i < recordsWithUrl.length; i += CONFIG.CONCURRENCY) {
    const batch = recordsWithUrl.slice(i, i + CONFIG.CONCURRENCY);
    console.log(`[Scraper] Processing batch ${i / CONFIG.CONCURRENCY + 1} (items ${i + 1} to ${Math.min(i + CONFIG.CONCURRENCY, total)})`);

    await Promise.all(
      batch.map(async (record) => {
        let tab: any;
        try {
          tab = await browser.newPage();

          // Block resources on detail pages too
          await tab.setRequestInterception(true);
          tab.on('request', (req: any) => {
            const resType = req.resourceType();
            if (CONFIG.BLOCKED_RESOURCE_TYPES.includes(resType) || resType === 'xhr') {
              req.abort();
            } else {
              req.continue();
            }
          });

          await tab.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
          await tab.goto(record.url, { waitUntil: 'domcontentloaded', timeout: 15_000 });

          await tab
            .waitForSelector(CONFIG.SELECTORS.DETAIL_PHONE, { timeout: CONFIG.DELAYS.DETAIL_LOAD })
            .catch(() => null);

          // Prefer the raw number embedded in the button id (localisation-proof),
          // then the visible text, then the legacy English-tooltip selector.
          // Raw number can be '' when the place doesn't list one
          let phone = await tab
            .evaluate(() => {
              const btn: HTMLElement | null = document.querySelector('button[data-item-id^="phone:tel"]');
              const fromId = btn ? (btn.getAttribute('data-item-id') || '').replace(/^phone:tel:/, '') : '';
              const fromText = btn ? (btn.innerText || '').trim() : '';
              const legacy: HTMLElement | null = document.querySelector('button[data-tooltip="Copy phone number"] .Io6YTe');
              const fromLegacy = legacy ? legacy.innerText.trim() : '';
              return fromId || fromText || fromLegacy || '';
            })
            .catch(() => '');

          if (!phone) phone = 'N/A';

          const website = await tab.$eval(CONFIG.SELECTORS.DETAIL_WEBSITE, (el: any) => el.href).catch(() => 'N/A');
          const detailAddr = await tab.$eval(CONFIG.SELECTORS.DETAIL_ADDRESS, (el: any) => el.innerText.trim()).catch(() => null);

          if (website && website !== 'N/A') record.website = website;
          if (detailAddr && detailAddr !== 'N/A') record.address = detailAddr;

          // Clean up phone format
          if (phone !== 'N/A') {
            // Remove all non-numeric characters except +
            let cleanPhone = phone.replace(/[^\d+]/g, '');
            
            // Standardize Indonesian local numbers to +62 format
            if (cleanPhone.startsWith('08')) {
              cleanPhone = '+628' + cleanPhone.slice(2);
            } else if (cleanPhone.startsWith('02') || cleanPhone.startsWith('03') || cleanPhone.startsWith('04') || cleanPhone.startsWith('05') || cleanPhone.startsWith('06') || cleanPhone.startsWith('07') || cleanPhone.startsWith('09')) {
              // Convert other local codes to international, though landlines usually don't have WA
              cleanPhone = '+62' + cleanPhone.slice(1);
            }
            
            // Finalize: remove the '+' so it's ready for Baileys (e.g. 628...)
            cleanPhone = cleanPhone.replace('+', '');
            
            // Basic validation for reasonable WA number length (Indonesia minimal usually ~10 digits)
            if (cleanPhone.length >= 9) {
              phone = cleanPhone;
            } else {
              phone = 'N/A';
            }
          }

          record.phone = phone;
        } catch {
          record.phone = 'N/A';
        } finally {
          if (tab) await tab.close().catch(() => {});
        }

        // Fetch email from the business website (independent of the detail tab)
        if ((!record.email || record.email === 'N/A') && record.website && record.website !== 'N/A') {
          const email = await fetchEmailFromWebsite(record.website);
          if (email) record.email = email;
        }

        completed++;

        process.stdout.write(
          `\r[Scraper] 📞 Progress: ${completed}/${recordsWithUrl.length} (${Math.round(completed / recordsWithUrl.length * 100)}%) — Last: ${record.name.substring(0, 30)}`
        );
        scrapeEmitter.emit('log', { type: 'phone', msg: `[${completed}/${recordsWithUrl.length}] ${record.name} → ☎ ${record.phone} | ✉ ${record.email}` });
      })
    );

    // Small gap between batches to avoid rate limiting
    if (i + CONFIG.CONCURRENCY < recordsWithUrl.length) {
      await sleep(CONFIG.DELAYS.BETWEEN_BATCH);
    }
  }

  console.log(''); // newline after inline counter
}

export const scrapeMaps = async (query: string, limit: number = CONFIG.MAX_RESULTS) => {
  let browser;
  const startTime = Date.now();

  try {
    console.log(`\n[Scraper] ===== Starting Scrape Job =====`);
    console.log(`[Scraper] Query: "${query}" | Limit: ${limit}`);

    browser = await initBrowser();
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    console.log(`[Scraper] Starting scrape for query: "${query}"`);
    scrapeEmitter.emit('log', { type: 'start', msg: `Starting scrape: "${query}" (limit: ${limit})` });
    
    await navigateToSearch(page, query);
    scrapeEmitter.emit('log', { type: 'info', msg: 'Google Maps loaded. Collecting results...' });
    
    console.log(`[Scraper] Navigation complete. Scrolling...`);
    const total = await scrollUntilDone(page, limit);
    
    console.log(`[Scraper] Found ${total} places. Extracting initial data...`);
    scrapeEmitter.emit('log', { type: 'info', msg: `Found ${total} places. Extracting data...` });

    const records = await extractFromCards(page, total);
    
    // Close the main page early — no longer needed
    await page.close().catch(() => {});
    
    await fetchPhones(browser, records);

    // Scrape = collect EVERYTHING. No filtering here — leads get qualified later in the CRM.
    const allRecords = records;
    const withPhone = allRecords.filter((r: any) => r.phone && r.phone !== 'N/A').length;
    const withEmail = allRecords.filter((r: any) => r.email && r.email !== 'N/A').length;
    const withWebsite = allRecords.filter((r: any) => r.website && r.website !== 'N/A').length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[Scraper] ✅ Complete! ${allRecords.length} contacts collected — ${withPhone} phone / ${withEmail} email / ${withWebsite} website. (${elapsed}s)`);
    console.log(`[Scraper] 💾 Saving all ${allRecords.length} contacts to database...`);
    scrapeEmitter.emit('log', { type: 'info', msg: `Extraction done: ${allRecords.length} contacts — ${withPhone} phone / ${withEmail} email / ${withWebsite} website. Saving all of them...` });

    const empty = (v: any) => !v || v === 'N/A' ? null : v;

    const batch = await prisma.scrapeBatch.create({
      data: {
        query,
        contacts: {
          create: allRecords.map((r: any) => ({
            name: r.name,
            phone: r.phone, // kept as-is ('N/A' when the place has no number)
            address: empty(r.address),
            rating: empty(r.rating),
            website: empty(r.website),
            email: empty(r.email),
            mapsUrl: empty(r.url)
          }))
        }
      },
      include: { contacts: true }
    });

    console.log(`[Scraper] ✅ Saved batch [${batch.id.substring(0, 8)}...] — ${batch.contacts.length} contacts.`);
    console.log(`[Scraper] ===== Job Complete in ${elapsed}s =====\n`);
    scrapeEmitter.emit('log', { type: 'done', msg: `Done! Saved ${batch.contacts.length} contacts in ${elapsed}s.` });

    return batch;
  } finally {
    if (browser) await browser.close();
  }
};
