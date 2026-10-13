// Проверка готового сайта: локальный сервер + Chrome (playwright-core).
// Запуск: node build/check.js [папка для скриншотов]
// Проверяет: ошибки консоли, горизонтальный скролл, битые внутренние ссылки и картинки,
// ссылку sitomika в подвале, квиз, фильтр, галерею, cookie-баннер. Снимает скриншоты.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const DOCS = path.join(__dirname, '..', 'docs');
const SHOTS = process.argv[2] || path.join(__dirname, '..', '.shots');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DOCS, p);
  if (!f.startsWith(DOCS) || !fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(DOCS, '404.html'))); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});

const PAGES = ['/', '/kuhni/', '/shkafy/', '/politika-konfidentsialnosti/', '/soglasie-na-obrabotku/', '/nет-такой/'];
const problems = [];
const bad = (m) => { problems.push(m); console.log('  ✗', m); };

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });

  for (const vp of [{ w: 1440, h: 900 }, { w: 1440, h: 768 }, { w: 375, h: 812 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/yandex|mc\.yandex|favicon/i.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const u of PAGES) {
      errors.length = 0;
      await page.goto(base + encodeURI(u), { waitUntil: 'load' });
      const name = (u === '/' ? 'home' : u.replace(/\//g, '').replace(/[^a-z-]/gi, '') || '404') + `-${vp.w}x${vp.h}`;
      await page.screenshot({ path: path.join(SHOTS, name + '-fold.png') });
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (sw > 0) bad(`${u} @${vp.w}: горизонтальный скролл ${sw}px`);
      if (vp.h === 900 || vp.w === 375) {
        // прокрутить, чтобы подгрузились lazy-картинки, затем снять страницу целиком
        await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
        await page.waitForTimeout(400);
        const loaded = await page.waitForFunction(() => [...document.images].filter((i) => i.getAttribute('src')).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).then(() => true).catch(() => false);
        if (!loaded) bad(`${u} @${vp.w}: не все картинки загрузились после прокрутки`);
        await page.screenshot({ path: path.join(SHOTS, name + '-full.png'), fullPage: true });
      }
      const credit = await page.$$eval('a.footer-credit', (a) => a.map((x) => x.href));
      if (credit.length !== 1 || !/sitomika\.ru\/\?utm_source=draft-mebel&utm_medium=footer&utm_campaign=client-sites/.test(credit[0])) bad(`${u}: нет корректной ссылки sitomika`);
      if (errors.length && !u.startsWith('/n')) bad(`${u} @${vp.w}: ошибки консоли: ${errors.join(' | ')}`);
      if (vp.w === 1440 && vp.h === 900 && !u.startsWith('/n')) {
        const links = await page.$$eval('a[href], img[src], link[href], script[src]', (els) => els.map((e) => e.href || e.src).filter((h) => h && h.startsWith(location.origin)));
        for (const l of [...new Set(links)]) {
          const r = await page.request.get(l.split('#')[0]);
          if (r.status() !== 200) bad(`${u}: битая ссылка ${l} → ${r.status()}`);
        }
        const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map((i) => i.src));
        if (broken.length) bad(`${u}: не загрузились картинки ${broken.join(', ')}`);
      }
    }
    await ctx.close();
  }

  // Интерактив на главной (десктоп)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + '/');
  if (!(await page.isVisible('#cookie'))) bad('cookie-баннер не показан');
  await page.click('#cookieOk');
  await page.reload();
  if (await page.isVisible('#cookie')) bad('cookie-баннер не запомнил закрытие');
  // фильтр
  await page.click('.filter [data-f="wardrobe"]');
  const vis = await page.$$eval('.works .work', (w) => w.filter((x) => !x.hidden).map((x) => x.dataset.cat));
  if (!vis.length || vis.some((c) => c !== 'wardrobe')) bad('фильтр «Шкафы» работает неверно');
  await page.click('.filter [data-f="all"]');
  // галерея
  await page.click('.works .work:nth-child(2) .js-gallery');
  if (!(await page.isVisible('#lb'))) bad('галерея не открылась');
  await page.keyboard.press('ArrowRight');
  const cap = await page.textContent('#lb figcaption');
  if (!/2 \/ 5/.test(cap)) bad('стрелка в галерее не листает: ' + cap);
  await page.screenshot({ path: path.join(SHOTS, 'lightbox.png') });
  await page.keyboard.press('Escape');
  if (await page.isVisible('#lb')) bad('галерея не закрылась по Esc');
  // квиз: кухня → угловая → размер → срок → проект → контакты
  await page.locator('#raschet').scrollIntoViewIfNeeded();
  await page.click('.quiz .opt:has(input[value="Кухня"])');
  await page.waitForTimeout(400);
  await page.click('.quiz [data-for="kitchen"] .opt:has(input[value="Угловая"])');
  await page.waitForTimeout(400);
  await page.click('.quiz__next');
  if (!(await page.isVisible('[data-step="3"]'))) bad('квиз: шаг размера пропущен без ответа');
  await page.fill('input[name="size_m"]', '3.4');
  await page.click('.quiz__next');
  await page.click('.quiz .opt:has(input[value="Через 1–3 месяца"])');
  await page.waitForTimeout(400);
  await page.click('.quiz .opt:has(input[value="Есть расчёт другой компании"])');
  await page.waitForTimeout(400);
  if (await page.isChecked('input[name="consent"]')) bad('галочка согласия стоит по умолчанию');
  await page.fill('input[name="client_name"]', 'Тест');
  await page.fill('input[name="phone"]', '+7 900 000-00-00');
  await page.click('.quiz__submit');
  if (!/согласие/i.test(await page.textContent('.quiz__err'))) bad('квиз отправился без согласия');
  await page.check('input[name="consent"]');
  await page.screenshot({ path: path.join(SHOTS, 'quiz-step6.png') });
  await page.click('.quiz__submit');
  await page.waitForTimeout(500);
  const sum = await page.textContent('.quiz__summary').catch(() => '');
  if (!/Угловая/.test(sum) || !/3\.4 м/.test(sum)) bad('квиз: итог собран неверно: ' + sum);
  await page.locator('#raschet').screenshot({ path: path.join(SHOTS, 'quiz-done.png') });
  // карта: дождаться, что виджет нарисовал плитки
  await page.locator('#kontakty').scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  await page.locator('.contacts__map').screenshot({ path: path.join(SHOTS, 'map.png') });
  // мобильное меню
  const m = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await m.newPage();
  await mp.goto(base + '/');
  await mp.click('.burger');
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: path.join(SHOTS, 'menu-375.png') });
  if (!(await mp.isVisible('.nav__mob'))) bad('мобильное меню не открылось');

  await browser.close();
  server.close();
  console.log(problems.length ? `\nПроблем: ${problems.length}` : '\nВсё чисто');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(2); });
