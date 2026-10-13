// Фото клиента (_source/) → WebP для сайта (docs/img/), плюс логотип и иконки.
// Запуск: node build/images.js   (готовые файлы пропускаются; чтобы пересобрать — удалить docs/img)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, '_source');
const OUT = path.join(ROOT, 'docs', 'img');
const projects = require('../data/projects.json');

const SIZES = { lg: 1600, sm: 760 };
const NAVY = { r: 3, g: 57, b: 90 };

// Кадрирование задаётся долями: [левый, верхний, правый, нижний] край оставляемой области
async function cropped(file, crop) {
  const img = sharp(path.join(SRC, file)).rotate();
  if (!crop) return img.toBuffer();
  const { width, height } = await sharp(path.join(SRC, file)).metadata();
  const [l, t, r, b] = crop;
  return img.extract({
    left: Math.round(l * width), top: Math.round(t * height),
    width: Math.round((r - l) * width), height: Math.round((b - t) * height),
  }).toBuffer();
}

async function makeLogo() {
  // Яркость → прозрачность: светлый фон уходит, штрихи остаются нужного цвета
  const { data, info } = await sharp(path.join(SRC, 'logo.jpg')).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  const paint = (c) => {
    const out = Buffer.alloc(px * 4);
    for (let i = 0; i < px; i++) {
      const v = data[i];
      const a = v > 215 ? 0 : v < 110 ? 255 : Math.round((215 - v) * 255 / 105);
      out[i * 4] = c.r; out[i * 4 + 1] = c.g; out[i * 4 + 2] = c.b; out[i * 4 + 3] = a;
    }
    return out;
  };
  const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
  fs.mkdirSync(OUT, { recursive: true });
  // Знак (уголок) — верхняя часть исходника, над надписью
  const mark = { left: 280, top: 140, width: 440, height: 480 };
  const markOf = async (c) => sharp(await sharp(paint(c), raw).extract(mark).png().toBuffer()).trim();
  await (await markOf(NAVY)).png().toFile(path.join(OUT, 'mark.png'));
  await (await markOf({ r: 255, g: 255, b: 255 })).png().toFile(path.join(OUT, 'mark-white.png'));
  // Полный логотип (знак + надпись) — для политики и OG
  await sharp(paint(NAVY), raw).trim().png().toFile(path.join(OUT, 'logo.png'));
  // Иконка для iOS: белый знак на тёмно-синем
  const m = await (await markOf({ r: 255, g: 255, b: 255 })).resize(116, 116, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#03395a' } })
    .composite([{ input: m, top: 32, left: 32 }]).png().toFile(path.join(OUT, 'apple-touch-icon.png'));
}

async function makeOg() {
  // Картинка для превью ссылок 1200×630: фото кухни + плашка
  const dest = path.join(OUT, 'og.jpg');
  if (fs.existsSync(dest)) return;
  const photo = await sharp(path.join(SRC, '742c72bb-5d6d-494d-a01d-4ee2213cba9e.jpg')).resize(1200, 630, { fit: 'cover' }).toBuffer();
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#021f33" stop-opacity=".92"/><stop offset=".75" stop-color="#021f33" stop-opacity=".72"/><stop offset="1" stop-color="#021f33" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="70" y="250" font-family="Arial, sans-serif" font-size="66" font-weight="700" fill="#fff">Кухни и шкафы</text>
    <text x="70" y="330" font-family="Arial, sans-serif" font-size="66" font-weight="700" fill="#fff">на заказ в Ижевске</text>
    <text x="70" y="400" font-family="Arial, sans-serif" font-size="30" fill="#d9c3a5">Бесплатный замер и дизайн-проект · своё производство</text>
    <text x="70" y="540" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="6" fill="#fff">DRAFT MEBEL</text>
  </svg>`);
  await sharp(photo).composite([{ input: svg }]).jpeg({ quality: 82 }).toFile(dest);
}

// СТОК: фоны параллакс-блоков. Это не работы клиента — источники и лицензии в stock/README.md
const STOCK = {
  'hero-kitchen': 'unsplash-VgyN_CWXQVM.jpg', // первый экран
  'why-kitchen': 'unsplash-AgHJm3uKr4U.jpg', // «Почему Draft Mebel»
  'steps-wardrobe': 'unsplash-SseNV6Ycb1c.jpg', // «Как работаем»
};
async function makeStockHero() {
  const dir = path.join(OUT, 'stock');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, file] of Object.entries(STOCK)) {
    const src = path.join(ROOT, 'stock', file);
    for (const w of [1280, 2400]) {
      const dest = path.join(dir, `${name}-${w}.webp`);
      if (!fs.existsSync(dest)) await sharp(src).rotate().resize({ width: w }).webp({ quality: w > 2000 ? 68 : 72, effort: 5 }).toFile(dest);
    }
  }
}

async function main() {
  await makeLogo();
  await makeStockHero();
  await makeOg();
  const manifest = {};
  for (const p of projects) {
    const dir = path.join(OUT, 'w', p.slug);
    fs.mkdirSync(dir, { recursive: true });
    manifest[p.slug] = [];
    for (let i = 0; i < p.photos.length; i++) {
      const ph = p.photos[i];
      const name = String(i + 1).padStart(2, '0');
      const buf = await cropped(ph.file, ph.crop);
      const meta = await sharp(buf).metadata();
      const entry = { w: meta.width, h: meta.height };
      for (const [key, w] of Object.entries(SIZES)) {
        const dest = path.join(dir, `${name}-${key}.webp`);
        if (!fs.existsSync(dest)) {
          await sharp(buf).resize({ width: w, withoutEnlargement: true })
            .webp({ quality: key === 'lg' ? 76 : 70, effort: 5 }).toFile(dest);
        }
        entry[key] = `img/w/${p.slug}/${name}-${key}.webp`;
      }
      manifest[p.slug].push(entry);
    }
    console.log(p.slug, p.photos.length);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'images.json'), JSON.stringify(manifest, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
