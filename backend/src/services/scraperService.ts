import puppeteer from 'puppeteer';
import prisma from '../utils/prisma';
import { EventEmitter } from 'events';

export const scrapeEmitter = new EventEmitter();

const CONFIG = {
  MAX_RESULTS: 30,
  CONCURRENCY: 6,          // Increased from 3 → 6 parallel phone fetches
  HEADLESS: true,
  VIEWPORT: { width: 1280, height: 800 },
  DELAYS: {
    AFTER_NAV: 1500,       // Reduced from 2000ms
    SCROLL_STEP: 350,      // Reduced from 500ms
    DETAIL_LOAD: 800,      // Reduced from 2000ms — we now use waitForSelector instead
    BETWEEN_BATCH: 200,    // Reduced from 1000ms
  },
  SELECTORS: {
    RESULTS_PANEL: 'div[role="feed"]',
    RESULT_CARDS: '.Nv2PK',
    CARD_LINK: '.Nv2PK a[href*="/maps/place"]',
    CARD_NAME: '.Nv2PK .qBF1Pd',
    CARD_RATING: '.Nv2PK .MW4etd',
    CARD_ADDRESS: '.Nv2PK .W4Efsd:last-child .W4Efsd:last-child span:last-child',
    DETAIL_ADDRESS: 'button[data-item-id="address"] .Io6YTe',
    DETAIL_PHONE: 'button[data-tooltip="Copy phone number"] .Io6YTe',
    END_OF_LIST: 'span.HlvSq',
  },
  // Resources to block for faster page loads
  BLOCKED_RESOURCE_TYPES: ['image', 'media', 'font', 'stylesheet', 'svg+xml'],
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
      '--lang=en-US,en',
      `--window-size=${CONFIG.VIEWPORT.width},${CONFIG.VIEWPORT.height}`,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
}

async function navigateToSearch(page: any, query: string) {
  // Enable resource blocking on main page too (no images/css needed)
  await setupPageInterception(page);
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`;
  // 'domcontentloaded' is faster than 'networkidle0' and still reliable
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await sleep(CONFIG.DELAYS.AFTER_NAV);
  await page.waitForSelector(CONFIG.SELECTORS.RESULTS_PANEL, { timeout: 20_000 });
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

    // Scroll the panel to load more results
    await page.evaluate((panelSel: string) => {
      const panel = document.querySelector(panelSel);
      if (panel) panel.scrollTop += panel.clientHeight;
    }, CONFIG.SELECTORS.RESULTS_PANEL);

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
      
      for (const el of w4Elements) {
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

          let phone = await tab
            .waitForSelector(CONFIG.SELECTORS.DETAIL_PHONE, { timeout: CONFIG.DELAYS.DETAIL_LOAD })
            .then((el: any) => el.evaluate((e: any) => e.innerText.trim()))
            .catch(() => 'N/A');

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
          completed++;

          process.stdout.write(
            `\r[Scraper] 📞 Progress: ${completed}/${recordsWithUrl.length} (${Math.round(completed / recordsWithUrl.length * 100)}%) — Last: ${record.name.substring(0, 30)}`
          );
          scrapeEmitter.emit('log', { type: 'phone', msg: `[${completed}/${recordsWithUrl.length}] ${record.name} → ${record.phone}` });

        } catch {
          record.phone = 'N/A';
          completed++;
        } finally {
          if (tab) await tab.close().catch(() => {});
        }
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

    const validRecords = records.filter((r: any) => r.phone && r.phone !== 'N/A');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`[Scraper] ✅ Complete! ${validRecords.length}/${total} contacts had phone numbers. (${elapsed}s)`);
    console.log(`[Scraper] 💾 Saving ${validRecords.length} contacts to database...`);
    scrapeEmitter.emit('log', { type: 'info', msg: `Extraction done: ${validRecords.length}/${total} have phone numbers. Saving...` });

    const batch = await prisma.scrapeBatch.create({
      data: {
        query,
        contacts: {
          create: validRecords.map((r: any) => ({
            name: r.name,
            phone: r.phone,
            address: r.address,
            rating: r.rating
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
