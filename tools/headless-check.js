const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = process.argv[2] || process.env.URL || 'http://localhost:3000';
  console.log('Headless check loading', url);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  const requestFailures = [];
  const responses = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    console.log('PAGE LOG>', msg.type(), text);
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error('PAGE ERROR>', err.message);
  });

  page.on('requestfailed', req => {
    const f = req.failure() || {};
    requestFailures.push({ url: req.url(), errorText: f.errorText || String(f) });
    console.error('REQUEST FAILED>', req.url(), f.errorText || f);
  });

  page.on('response', resp => {
    responses.push({ url: resp.url(), status: resp.status() });
    console.log('RESPONSE', resp.status(), resp.url());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.error('GOTO ERROR>', e.message);
  }

  // wait a bit for dynamic rendering (compatible across Puppeteer versions)
  await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(r => setTimeout(r, 1000)));

  const html = await page.content();
  try {
    await page.screenshot({ path: 'headless-screenshot.png', fullPage: true });
    console.log('Saved headless-screenshot.png');
  } catch (e) {
    console.error('Screenshot failed:', e.message);
  }

  // Save a short HTML snapshot
  fs.writeFileSync('headless-snapshot.html', html);
  console.log('Saved headless-snapshot.html (full page HTML)');

  const result = { consoleMessages, pageErrors, requestFailures, responses };
  console.log('RESULT_JSON_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('RESULT_JSON_END');

  await browser.close();

  const hadErrors = pageErrors.length || requestFailures.length;
  process.exit(hadErrors ? 2 : 0);
})();
