// Генератор сайта: data/*.json → docs/*.html, sitemap.xml, robots.txt, 404.html
// Запуск: node build/build.js   (HTML руками не правится — только данные, шаблоны здесь, css/js в docs/)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const C = require('../data/company.json');
const PROJECTS = require('../data/projects.json');
const IMAGES = require('../data/images.json');
// Стоковое фото для фона первого экрана (не работа клиента) — генерирует build/images.js
const STOCK_HERO = { sm: 'img/stock/hero-kitchen-1280.webp', lg: 'img/stock/hero-kitchen-2400.webp' };
const VERSION = Date.now().toString(36);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => C.siteUrl.replace(/\/$/, '') + '/' + p;

// ---------- иконки ----------
const I = {
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z" fill="currentColor"/></svg>',
  tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 4.2 2.9 11.3c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.4-1.6zM9.6 14.7l-.4 4-1.5-4.9 10.4-6.6-8.5 7.5z" fill="currentColor"/></svg>',
  vk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 17.5C6.7 17.5 3.1 13.3 3 6.3h3.1c.1 5.1 2.4 7.3 4.2 7.7V6.3h2.9v4.4c1.8-.2 3.7-2.2 4.3-4.4h2.9c-.5 2.7-2.5 4.7-3.9 5.5 1.4.7 3.7 2.4 4.6 5.7h-3.2c-.7-2.2-2.4-3.9-4.7-4.1v4.1h-.3z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  calc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  // иконки преимуществ
  factory: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 27V13l7 4v-4l7 4v-4l7 4V5h3v22H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 22h3m4 0h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ruler: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="11" width="26" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11v4m5-4v6m5-6v4m5-4v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  draft: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 26h22M7 22V9l6-4h12v17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13 5v6H7m6 0 12 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  ceiling: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 4h26M6 4v24h20V4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16 4v24M6 12h20M12 18v3m8-3v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  scale: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v24m-8 0h16M6 9h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m6 9-4 9a4 4 0 0 0 8 0L6 9zm20 0-4 9a4 4 0 0 0 8 0l-4-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  week: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="6" width="24" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 12h24M10 3v5m12-5v5M9 17h2m4 0h2m4 0h2M9 22h2m4 0h2m4 0h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

// ---------- кнопки связи ----------
const tel = `tel:${C.phone}`;
// Оригинальный значок MAX (взят с max.ru/favicon.svg); путь к картинке зависит от глубины страницы — его задаёт head()
let PAGE_R = '';
const maxIcon = () => `<img class="max-ico" src="${PAGE_R}img/max.svg" width="20" height="20" alt="">`;
function maxBtn(cls, label = 'MAX') {
  if (C.max) return `<a class="${cls}"${label ? '' : ' aria-label="MAX"'} href="${esc(C.max)}" target="_blank" rel="noopener">${maxIcon()}<span>${label}</span></a>`;
  // Ссылки на профиль MAX пока нет: кнопка копирует номер и подсказывает найти нас по нему
  return `<button type="button" class="${cls} js-max"${label ? '' : ' aria-label="MAX"'} data-phone="${esc(C.phoneDisplay)}">${maxIcon()}<span>${label}</span></button>`;
}
const tgBtn = (cls, label = 'Telegram') => `<a class="${cls}"${label ? '' : ' aria-label="Telegram"'} href="${esc(C.telegram)}" target="_blank" rel="noopener">${I.tg}<span>${label}</span></a>`;
const messengers = (cls = 'btn btn--ghost') => `${tgBtn(cls + ' btn--tg')}${maxBtn(cls + ' btn--max')}`;

// ---------- данные-тексты ----------
const ADVANTAGES = [
  ['factory', 'Своё производство', 'Изготавливаем мебель сами, на производстве в Ижевске — без перекупщиков и наценки салона.'],
  ['ruler', 'Бесплатный замер', 'Приезжаем, измеряем помещение, смотрим выводы воды и розетки, советуем по планировке.'],
  ['draft', 'Бесплатный дизайн-проект', 'Показываем, как будет выглядеть мебель, до того как вы что-то оплатили. Вносим правки до утверждения проекта.'],
  ['ceiling', 'Точно по размерам', 'До потолка, в нишу, вокруг короба и под вашу технику — без зазоров и «мёртвых» углов.'],
  ['scale', 'Сравним с чужим расчётом', 'Уже посчитали в другой компании? Пришлите расчёт — посчитаем свой вариант и постараемся предложить выгоднее.'],
  ['week', 'Без выходных', 'Отвечаем на звонки и сообщения каждый день, замер можно назначить на удобный день.'],
];

const STEPS = [
  ['Заявка', 'Звоните, пишите в Telegram или MAX или ответьте на 5 вопросов в расчёте на сайте.'],
  ['Замер — бесплатно', 'Приезжаем в удобный день, снимаем точные размеры, обсуждаем материалы и наполнение.'],
  ['Дизайн-проект — бесплатно', 'Готовим проект и расчёт, вносим правки до утверждения.'],
  ['Договор', 'Фиксируем проект, материалы, стоимость и срок изготовления в договоре.'],
  ['Производство', 'Изготавливаем мебель на своём производстве в Ижевске.'],
  ['Доставка и монтаж', 'Привозим и собираем на месте. Доставку за пределы Ижевска считаем индивидуально.'],
];

const PRICE_FACTORS = [
  ['Размер и форма', 'Длина по стенам, высота (до потолка или с антресолью), прямая, угловая, П-образная или с островом.'],
  ['Фасады', 'Материал и покрытие фасадов: однотонные матовые, под дерево, под камень, с фрезеровкой или без ручек.'],
  ['Столешница и фартук', 'Под дерево, под камень, цельная стеновая панель или плитка — от этого заметно зависит цена.'],
  ['Фурнитура и наполнение', 'Доводчики, выдвижные ящики, сушки, лотки, системы хранения, подсветка.'],
];

const FAQ = [
  ['Сколько стоит кухня или шкаф на заказ?', 'Цена зависит от размеров, материала фасадов, столешницы и фурнитуры, поэтому одной цифры «за метр» мы не называем — она почти всегда меняется после замера. Ответьте на 5 вопросов в расчёте или пришлите фото и размеры в Telegram или MAX — сориентируем по стоимости. Точную цену называем после бесплатного замера.'],
  ['Замер и дизайн-проект правда бесплатные?', 'Да. Выезд замерщика и дизайн-проект ничего не стоят и ни к чему вас не обязывают.'],
  ['У меня уже есть расчёт в другой компании. Посчитаете?', 'Да, присылайте проект или смету в мессенджер. Посчитаем свой вариант с теми же материалами и постараемся предложить выгоднее.'],
  ['Вы работаете только по Ижевску?', 'Нет, по Ижевску и всей Удмуртии. Замер и монтаж за городом согласуем заранее, доставку рассчитываем индивидуально под каждый заказ.'],
  ['Можно сделать мебель под мою технику?', 'Да. Проектируем ниши и колонны под встроенный холодильник, духовой шкаф, СВЧ, посудомоечную машину и вытяжку — под конкретные модели.'],
  ['Сколько времени занимает изготовление?', 'Срок зависит от сложности проекта и выбранных материалов. Мы называем его до заключения договора и фиксируем в договоре.'],
  ['Делаете ли вы мебель не для кухни?', 'Да: шкафы в прихожую и спальню, встроенные шкафы до потолка, мебель в санузел, шкафы и тумбы на балкон и лоджию.'],
];

const KITCHEN_TYPES = ['Прямые и угловые', 'П-образные и с островом', 'Верхние шкафы до потолка', 'Под встроенную технику', 'С подоконником-столешницей', 'Для кухни-гостиной'];
const WARDROBE_TYPES = ['В прихожую и спальню', 'Встроенные в нишу до потолка', 'Распашные с антресолями', 'Мебель в санузел', 'Шкафы и тумбы на балкон', 'Под ваши размеры и наполнение'];

const TOWNS = ['Ижевск', 'Завьялово', 'Воткинск', 'Сарапул', 'Можга', 'Глазов', 'Ува', 'Малая Пурга', 'Игра', 'Якшур-Бодья'];

// ---------- общие блоки ----------
function head({ title, description, canonical, R, ld = [] }) {
  PAGE_R = R;
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(abs(canonical))}">
<meta name="theme-color" content="#03395a">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Draft Mebel — кухни и шкафы на заказ">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(canonical))}">
<meta property="og:image" content="${esc(abs('img/og.jpg'))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}img/apple-touch-icon.png">
<link rel="preload" href="${R}fonts/manrope-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${R}css/style.css?v=${VERSION}">
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>`;
}

function header(R, active) {
  const nav = [
    ['kuhni/', 'Кухни', 'kuhni'],
    ['shkafy/', 'Шкафы', 'shkafy'],
    ['#raboty', 'Работы'],
    ['#etapy', 'Как работаем'],
    ['#voprosy', 'Вопросы'],
    ['#kontakty', 'Контакты'],
  ];
  const local = ['home', 'kuhni', 'shkafy'].includes(active);
  const href = (h) => (h.startsWith('#') ? (local ? h : `${R}${h}`) : `${R}${h}`);
  return `<a class="skip" href="#main">К содержимому</a>
<header class="hdr" id="top">
  <div class="wrap hdr__in">
    <a class="logo" href="${R || './'}" aria-label="Draft Mebel — на главную">
      <img src="${R}img/mark.png" alt="" width="34" height="38">
      <span class="logo__txt"><b>DRAFT MEBEL</b><small>кухни и шкафы на заказ</small></span>
    </a>
    <nav class="nav" id="nav" aria-label="Основное меню">
      ${nav.map(([h, t, k]) => `<a href="${href(h)}"${k && k === active ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      <div class="nav__mob">
        <a class="btn btn--primary" href="${tel}">${I.phone}<span>${C.phoneDisplay}</span></a>
        <div class="nav__mess">${messengers('btn btn--ghost')}</div>
      </div>
    </nav>
    <div class="hdr__cta">
      <div class="hdr__mess">${tgBtn('icon-btn icon-btn--tg', '')}${maxBtn('icon-btn icon-btn--max', '')}</div>
      <a class="hdr__phone" href="${tel}"><b>${C.phoneDisplay}</b><small>${C.hours.toLowerCase()}</small></a>
      <a class="btn btn--primary btn--sm hdr__calc" href="${href('#raschet')}">Рассчитать</a>
      <button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="nav"><span></span></button>
    </div>
  </div>
</header>`;
}

function footer(R, active) {
  const year = new Date().getFullYear();
  const credit = `https://sitomika.ru/?utm_source=${C.creditSlug}&amp;utm_medium=footer&amp;utm_campaign=client-sites`;
  const home = ['home', 'kuhni', 'shkafy'].includes(active) ? '' : R || './';
  return `<footer class="ftr">
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <a class="logo logo--light" href="${R || './'}"><img src="${R}img/mark-white.png" alt="" width="34" height="38"><span class="logo__txt"><b>DRAFT MEBEL</b><small>кухни и шкафы на заказ</small></span></a>
      <p>Проектируем, изготавливаем и устанавливаем корпусную мебель по индивидуальным размерам. ${esc(C.area)}.</p>
    </div>
    <div>
      <h3>Мебель</h3>
      <ul><li><a href="${R}kuhni/">Кухни на заказ</a></li><li><a href="${R}shkafy/">Шкафы на заказ</a></li><li><a href="${home}#raboty">Наши работы</a></li><li><a href="${home}#raschet">Рассчитать стоимость</a></li></ul>
    </div>
    <div>
      <h3>Контакты</h3>
      <ul>
        <li><a href="${tel}">${C.phoneDisplay}</a></li>
        <li><a href="${esc(C.telegram)}" target="_blank" rel="noopener">Telegram</a> · ${C.max ? `<a href="${esc(C.max)}" target="_blank" rel="noopener">MAX</a>` : `<button type="button" class="linklike js-max" data-phone="${esc(C.phoneDisplay)}">MAX</button>`}</li>
        <li>${esc(C.address)}</li>
        <li>${esc(C.hours)}</li>
        ${C.vk ? `<li><a href="${esc(C.vk)}" target="_blank" rel="noopener">Группа ВКонтакте</a></li>` : ''}
      </ul>
    </div>
  </div>
  <div class="wrap ftr__bottom">
    <span>© ${year} Draft Mebel${C.legalConfirmed && C.legalName ? ' · ' + esc(C.legalName) + (C.inn ? ', ИНН ' + esc(C.inn) : '') : ''}</span>
    <span class="ftr__links">
      <a href="${R}politika-konfidentsialnosti/">Политика конфиденциальности</a>
      <a href="${R}soglasie-na-obrabotku/">Согласие на обработку данных</a>
      <a class="footer-credit" href="${credit}" target="_blank" rel="noopener">Разработано в sitomika.ru</a>
    </span>
  </div>
</footer>
<div class="mbar" aria-label="Быстрая связь">
  <a href="${tel}">${I.phone}<span>Позвонить</span></a>
  ${tgBtn('', 'Telegram')}
  ${maxBtn('', 'MAX')}
  <a href="${home}#raschet" class="mbar__calc">${I.calc}<span>Расчёт</span></a>
</div>
<div class="cookie" id="cookie" hidden>
  <p>Сайт использует cookie, чтобы корректно работать, а встроенная Яндекс Карта может устанавливать свои cookie. Подробнее — в <a href="${R}politika-konfidentsialnosti/">политике конфиденциальности</a>.</p>
  <button type="button" class="btn btn--primary btn--sm" id="cookieOk">Понятно</button>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Просмотр фото">
  <button class="lb__close" type="button" aria-label="Закрыть">×</button>
  <button class="lb__nav lb__prev" type="button" aria-label="Предыдущее фото">‹</button>
  <figure class="lb__fig"><img alt=""><figcaption></figcaption></figure>
  <button class="lb__nav lb__next" type="button" aria-label="Следующее фото">›</button>
</div>
<script>window.SITE=${JSON.stringify({ endpoint: C.formEndpoint, phone: C.phoneDisplay, tel: C.phone, telegram: C.telegram, max: C.max })};</script>
<script src="${R}js/main.js?v=${VERSION}" defer></script>
</body>
</html>`;
}

// ---------- карточки работ ----------
function picture(img, alt, R, { sizes = '(max-width: 760px) 100vw, 50vw', eager = false, lazy = true, cls = '' } = {}) {
  return `<img${cls ? ` class="${cls}"` : ''} src="${R}${img.sm}" srcset="${R}${img.sm} 760w, ${R}${img.lg} ${Math.min(1600, img.w)}w" sizes="${sizes}" width="${img.w}" height="${img.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : lazy ? ' loading="lazy" decoding="async"' : ''}>`;
}

function workCard(p, R) {
  const imgs = IMAGES[p.slug];
  const gallery = imgs.map((im, i) => ({ src: R + im.lg, cap: p.photos[i].alt }));
  return `<article class="work" data-cat="${p.category}">
  <button type="button" class="work__img js-gallery" data-gallery="${esc(JSON.stringify(gallery))}" aria-label="Смотреть фото: ${esc(p.title)}">
    ${picture(imgs[0], p.photos[0].alt, R, { sizes: '(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw' })}
    ${imgs.length > 1 ? `<span class="work__count">${imgs.length} фото</span>` : ''}
  </button>
  <div class="work__body">
    <span class="work__cat">${p.category === 'kitchen' ? 'Кухня' : 'Шкаф'}</span>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.text)}</p>
    <ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  </div>
</article>`;
}

// ---------- квиз ----------
function quiz(R, preset = '') {
  const opt = (name, value, label, checked) => `<label class="opt"><input type="radio" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
  return `<section class="sec sec--navy" id="raschet">
  <div class="wrap quiz-wrap">
    <div class="quiz-intro">
      <span class="eyebrow eyebrow--light">Расчёт стоимости</span>
      <h2>Узнайте стоимость за&nbsp;1&nbsp;минуту</h2>
      <p>Ответьте на 5 вопросов — перезвоним или напишем в удобный мессенджер, сориентируем по цене и договоримся о бесплатном замере.</p>
      <ul class="checks checks--light">
        <li>${I.check}Без обязательств и навязчивых звонков</li>
        <li>${I.check}Замер и дизайн-проект — бесплатно</li>
        <li>${I.check}Есть чужой расчёт? Сравним и предложим свой</li>
      </ul>
      <p class="quiz-alt">Удобнее сразу написать? ${messengers('btn btn--light btn--sm')}</p>
    </div>
    <form class="quiz" id="quiz" novalidate data-preset="${preset}">
      <div class="quiz__bar"><span></span></div>
      <p class="quiz__count">Шаг <b>1</b> из 6</p>

      <fieldset class="quiz__step is-active" data-step="1">
        <legend>Что нужно сделать?</legend>
        <div class="opts">
          ${opt('type', 'Кухня', 'Кухню', preset === 'kitchen')}
          ${opt('type', 'Шкаф', 'Шкаф', preset === 'wardrobe')}
          ${opt('type', 'Кухня и шкаф', 'Кухню и шкаф')}
          ${opt('type', 'Другая корпусная мебель', 'Другое')}
        </div>
      </fieldset>

      <fieldset class="quiz__step" data-step="2" data-for="kitchen">
        <legend>Какая форма кухни?</legend>
        <div class="opts opts--3">
          ${opt('shape', 'Прямая', 'Прямая')}
          ${opt('shape', 'Угловая', 'Угловая')}
          ${opt('shape', 'П-образная', 'П-образная')}
          ${opt('shape', 'С островом', 'С островом')}
          ${opt('shape', 'Пока не знаю', 'Пока не знаю')}
        </div>
      </fieldset>

      <fieldset class="quiz__step" data-step="2" data-for="wardrobe">
        <legend>Какой шкаф нужен?</legend>
        <div class="opts opts--3">
          ${opt('wardrobe', 'В прихожую', 'В прихожую')}
          ${opt('wardrobe', 'В спальню', 'В спальню')}
          ${opt('wardrobe', 'Встроенный в нишу', 'Встроенный в нишу')}
          ${opt('wardrobe', 'В санузел', 'В санузел')}
          ${opt('wardrobe', 'На балкон', 'На балкон')}
          ${opt('wardrobe', 'Другое', 'Другое')}
        </div>
      </fieldset>

      <fieldset class="quiz__step" data-step="3">
        <legend>Примерный размер</legend>
        <label class="field"><span>Длина по стенам, метров</span><input type="number" name="size_m" min="0.5" max="30" step="0.1" inputmode="decimal" placeholder="Например, 3.2"></label>
        <label class="chk"><input type="checkbox" name="noSize" value="Не знаю — нужен замер"><span>Не знаю — нужен замер</span></label>
      </fieldset>

      <fieldset class="quiz__step" data-step="4">
        <legend>Когда нужна мебель?</legend>
        <div class="opts">
          ${opt('when', 'В ближайший месяц', 'В ближайший месяц')}
          ${opt('when', 'Через 1–3 месяца', 'Через 1–3 месяца')}
          ${opt('when', 'Идёт ремонт — зависит от него', 'Идёт ремонт')}
          ${opt('when', 'Пока выбираю и сравниваю', 'Пока выбираю')}
        </div>
      </fieldset>

      <fieldset class="quiz__step" data-step="5">
        <legend>Есть ли проект или расчёт от другой компании?</legend>
        <div class="opts">
          ${opt('project', 'Есть расчёт другой компании', 'Да, есть расчёт')}
          ${opt('project', 'Есть свой эскиз или фото-пример', 'Есть эскиз или фото')}
          ${opt('project', 'Нет, нужен проект с нуля', 'Нет, нужен проект')}
        </div>
        <p class="quiz__hint">Расчёт или эскиз можно будет прислать в Telegram или MAX после заявки.</p>
      </fieldset>

      <fieldset class="quiz__step" data-step="6">
        <legend>Куда прислать расчёт?</legend>
        <div class="fields">
          <label class="field"><span>Имя</span><input type="text" name="client_name" autocomplete="name" maxlength="60" placeholder="Как к вам обращаться"></label>
          <label class="field"><span>Телефон *</span><input type="tel" name="phone" autocomplete="tel" required maxlength="20" placeholder="+7 ___ ___-__-__"></label>
        </div>
        <p class="field__label">Как удобнее связаться?</p>
        <div class="opts opts--3 opts--sm">
          ${opt('contact', 'Звонок', 'Звонок', true)}
          ${opt('contact', 'Telegram', 'Telegram')}
          ${opt('contact', 'MAX', 'MAX')}
        </div>
        <label class="hp" aria-hidden="true">Не заполняйте это поле<input type="text" name="company_site" tabindex="-1" autocomplete="off"></label>
        <label class="chk chk--consent"><input type="checkbox" name="consent" value="да" required><span>Даю <a href="${R}soglasie-na-obrabotku/" target="_blank">согласие на обработку персональных данных</a> и принимаю <a href="${R}politika-konfidentsialnosti/" target="_blank">политику конфиденциальности</a></span></label>
        <p class="quiz__err" role="alert"></p>
      </fieldset>

      <div class="quiz__done" hidden>
        <div class="quiz__done-ok" hidden>
          <h3>Спасибо, заявка отправлена!</h3>
          <p>Свяжемся с вами в ближайшее время. Если есть расчёт другой компании, эскиз или фото помещения — пришлите их в мессенджер, так посчитаем точнее.</p>
        </div>
        <div class="quiz__done-fail" hidden>
          <h3>Почти готово — осталось связаться</h3>
          <p>Заявка не ушла автоматически. Позвоните или напишите нам — ответы уже собраны, их можно скопировать и отправить одним сообщением.</p>
          <pre class="quiz__summary"></pre>
          <button type="button" class="btn btn--ghost btn--sm js-copy-summary">Скопировать ответы</button>
        </div>
        <div class="quiz__done-act"><a class="btn btn--primary" href="${tel}">${I.phone}<span>${C.phoneDisplay}</span></a>${messengers('btn btn--ghost')}</div>
      </div>

      <div class="quiz__nav">
        <button type="button" class="btn btn--ghost quiz__back" hidden>Назад</button>
        <button type="button" class="btn btn--primary quiz__next">Далее ${I.arrow}</button>
        <button type="submit" class="btn btn--primary quiz__submit" hidden>Получить расчёт</button>
      </div>
    </form>
  </div>
</section>`;
}

// ---------- секции ----------
function secCompare() {
  return `<section class="compare">
  <div class="wrap compare__in">
    <div class="compare__ico">${I.scale.replace('viewBox="0 0 32 32"', 'viewBox="0 0 32 32" width="40" height="40"')}</div>
    <div class="compare__txt">
      <h2>Уже есть расчёт в другой компании?</h2>
      <p>Пришлите его нам — посчитаем ту же мебель на своём производстве и постараемся предложить выгоднее. Без перекупщиков и наценки салона.</p>
    </div>
    <div class="compare__act">${messengers('btn btn--light')}</div>
  </div>
</section>`;
}

function secAdvantages() {
  return `<section class="sec" id="pochemu">
  <div class="wrap">
    <div class="sec__head"><span class="eyebrow">Почему Draft Mebel</span><h2>Мебель от производителя — с заботой о деталях</h2></div>
    <div class="adv">
      ${ADVANTAGES.map(([ic, t, d]) => `<div class="adv__item"><span class="adv__ico">${I[ic]}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>`;
}

function secSteps(R) {
  return `<section class="sec sec--alt" id="etapy">
  <div class="wrap">
    <div class="sec__head"><span class="eyebrow">Как работаем</span><h2>От заявки до готовой мебели — 6&nbsp;шагов</h2></div>
    <ol class="steps">
      ${STEPS.map(([t, d], i) => `<li><span class="steps__n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
    </ol>
  </div>
</section>`;
}

function secPrice(R, home) {
  return `<section class="sec" id="cena">
  <div class="wrap price">
    <div class="price__txt">
      <span class="eyebrow">Честно о цене</span>
      <h2>От чего зависит стоимость</h2>
      <p>Мы не пишем «кухня от N рублей за метр»: в реальности цена почти всегда отличается от рекламной. Точную стоимость называем после бесплатного замера и фиксируем в договоре.</p>
      <a class="btn btn--primary" href="${home}#raschet">${I.calc}<span>Рассчитать мою мебель</span></a>
    </div>
    <dl class="price__list">
      ${PRICE_FACTORS.map(([t, d], i) => `<div><dt><span>${i + 1}</span>${t}</dt><dd>${d}</dd></div>`).join('')}
    </dl>
  </div>
</section>`;
}

function secFaq(items = FAQ) {
  return `<section class="sec sec--alt" id="voprosy">
  <div class="wrap faq-wrap">
    <div class="sec__head"><span class="eyebrow">Вопросы и ответы</span><h2>Частые вопросы</h2><p>Не нашли ответ? Напишите нам — ответим без выходных.</p><div class="faq-mess">${messengers('btn btn--ghost btn--sm')}</div></div>
    <div class="faq">
      ${items.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    </div>
  </div>
</section>`;
}

function secContacts() {
  const { lat, lon } = C.geo;
  return `<section class="sec" id="kontakty">
  <div class="wrap contacts">
    <div class="contacts__info">
      <span class="eyebrow">Контакты</span>
      <h2>Приезжайте или напишите</h2>
      <ul class="contacts__list">
        <li>${I.phone}<div><small>Телефон</small><a href="${tel}">${C.phoneDisplay}</a></div></li>
        <li>${I.pin}<div><small>Адрес производства</small>${esc(C.address)}</div></li>
        <li>${I.clock}<div><small>Режим работы</small>${esc(C.hours)}</div></li>
      </ul>
      <div class="contacts__btns">${messengers('btn btn--ghost')}</div>
      <div class="geo">
        <h3>Работаем по Ижевску и всей Удмуртии</h3>
        <ul class="geo__list">${TOWNS.map((t) => `<li>${t}</li>`).join('')}<li>и другие населённые пункты</li></ul>
      </div>
    </div>
    <div class="contacts__map">
      <iframe title="Draft Mebel на карте: ${esc(C.address)}" src="https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&amp;z=15&amp;pt=${lon}%2C${lat}%2Cpm2dbm" loading="lazy" allowfullscreen></iframe>
    </div>
  </div>
</section>`;
}

function ldBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: 'Draft Mebel',
    alternateName: C.nameRu,
    description: 'Кухни и шкафы на заказ в Ижевске и Удмуртии: бесплатный замер и дизайн-проект, своё производство.',
    url: C.siteUrl,
    image: abs('img/og.jpg'),
    logo: abs('img/logo.png'),
    telephone: C.phone,
    address: { '@type': 'PostalAddress', streetAddress: C.street, addressLocality: C.city, addressRegion: C.region, postalCode: C.postalCode, addressCountry: 'RU' },
    geo: { '@type': 'GeoCoordinates', latitude: C.geo.lat, longitude: C.geo.lon },
    areaServed: [{ '@type': 'City', name: 'Ижевск' }, { '@type': 'AdministrativeArea', name: 'Удмуртская Республика' }],

    sameAs: [C.vk].filter(Boolean),
  };
}
const ldFaq = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const ldCrumbs = (name, p) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Главная', item: C.siteUrl }, { '@type': 'ListItem', position: 2, name, item: abs(p) }] });

// ---------- страницы ----------
function pageHome() {
  const R = '';
  const hero = IMAGES['kuhnya-gostinaya-orekh'][0];
  const works = PROJECTS;
  const nK = PROJECTS.filter((p) => p.category === 'kitchen').length;
  const nW = PROJECTS.filter((p) => p.category === 'wardrobe').length;
  const kImg = IMAGES['kuhnya-bezhevaya-dub'][0];
  const wImg = IMAGES['shkaf-v-prikhozhuyu'][0];
  return `${head({
    title: 'Кухни и шкафы на заказ в Ижевске — Draft Mebel, своё производство',
    description: 'Кухни и шкафы на заказ в Ижевске и Удмуртии от производителя. Бесплатный замер и дизайн-проект, точно по вашим размерам. Пришлите чужой расчёт — предложим выгоднее. ☎ ' + C.phoneDisplay,
    canonical: '', R, ld: [ldBusiness(), ldFaq(FAQ)],
  })}
<body class="home">
${header(R, 'home')}
<main id="main">
<section class="hero hero--bg">
  <div class="hero__bg" aria-hidden="true">
    <!-- СТОК: фон первого экрана — не работа клиента (Unsplash, Cat Han, см. stock/README.md). Работы клиента — только в data/projects.json -->
    <img src="${R}${STOCK_HERO.sm}" srcset="${R}${STOCK_HERO.sm} 1280w, ${R}${STOCK_HERO.lg} 2400w" sizes="100vw" width="2400" height="1600" alt="" fetchpriority="high">
  </div>
  <div class="wrap hero__in">
    <div class="hero__txt">
      <span class="eyebrow">${I.pin} Своё производство · Ижевск и Удмуртия</span>
      <h1>Кухни и шкафы на&nbsp;заказ <span>в Ижевске</span></h1>
      <p class="hero__lead">Проектируем, изготавливаем на своём производстве в Ижевске и устанавливаем корпусную мебель — точно под вашу квартиру, технику и бюджет.</p>
      <ul class="checks hero__checks">
        <li>${I.check}<span><b>Бесплатный</b> замер</span></li>
        <li>${I.check}<span><b>Бесплатный</b> дизайн-проект</span></li>
        <li>${I.check}<span><b>Своё</b> производство</span></li>
        <li>${I.check}<span>Работаем <b>без выходных</b></span></li>
      </ul>
      <div class="hero__cta">
        <a class="btn btn--primary btn--lg" href="#raschet">${I.calc}<span>Рассчитать стоимость</span></a>
        <a class="btn btn--ghost btn--lg" href="${tel}">${I.phone}<span>${C.phoneDisplay}</span></a>
      </div>
      <p class="hero__mess">или напишите: ${tgBtn('chip chip--tg')}${maxBtn('chip chip--max')}</p>
    </div>
    <a class="hero__work" href="#raboty">
      ${picture(hero, 'Кухня-гостиная: светлые фасады и колонна пеналов цвета ореха', R, { sizes: '160px', lazy: false })}
      <span><b>Это наша работа</b>Кухня-гостиная: орех и светлые фасады<em>Смотреть все работы ${I.arrow}</em></span>
    </a>
  </div>
</section>

${secCompare()}

<section class="sec" id="mebel">
  <div class="wrap">
    <div class="sec__head"><span class="eyebrow">Что мы делаем</span><h2>Только корпусная мебель — и только под заказ</h2><p>Не продаём готовые модули со склада: каждый проект рассчитываем под конкретное помещение.</p></div>
    <div class="dirs">
      <a class="dir" href="kuhni/">
        <div class="dir__img">${picture(kImg, 'Бежевая угловая кухня на заказ с дубовой столешницей', R, { sizes: '(max-width: 760px) 100vw, 50vw' })}</div>
        <div class="dir__body"><h3>Кухни на заказ</h3><ul class="checks">${KITCHEN_TYPES.map((t) => `<li>${I.check}${t}</li>`).join('')}</ul><span class="dir__more">Подробнее о кухнях ${I.arrow}</span></div>
      </a>
      <a class="dir" href="shkafy/">
        <div class="dir__img">${picture(wImg, 'Встроенный шкаф до потолка в прихожей', R, { sizes: '(max-width: 760px) 100vw, 50vw' })}</div>
        <div class="dir__body"><h3>Шкафы на заказ</h3><ul class="checks">${WARDROBE_TYPES.map((t) => `<li>${I.check}${t}</li>`).join('')}</ul><span class="dir__more">Подробнее о шкафах ${I.arrow}</span></div>
      </a>
    </div>
  </div>
</section>

<section class="sec sec--alt" id="raboty">
  <div class="wrap">
    <div class="sec__head sec__head--row">
      <div><span class="eyebrow">Наши работы</span><h2>Реальные объекты, а&nbsp;не&nbsp;картинки из каталога</h2><p>Фото сняты на наших объектах сразу после монтажа. Нажмите на карточку, чтобы посмотреть все снимки.</p></div>
      <div class="filter" role="group" aria-label="Фильтр работ">
        <button type="button" class="is-on" data-f="all">Все <sup>${works.length}</sup></button>
        <button type="button" data-f="kitchen">Кухни <sup>${nK}</sup></button>
        <button type="button" data-f="wardrobe">Шкафы <sup>${nW}</sup></button>
      </div>
    </div>
    <div class="works">${works.map((p) => workCard(p, R)).join('')}</div>
  </div>
</section>

${secAdvantages()}
${quiz(R)}
${secSteps(R)}
${secPrice(R, '')}
${secFaq()}
${secContacts()}
</main>
${footer(R, 'home')}`;
}

function pageCategory(kind) {
  const R = '../';
  const isK = kind === 'kitchen';
  const slug = isK ? 'kuhni/' : 'shkafy/';
  const items = PROJECTS.filter((p) => p.category === kind);
  const heroP = isK ? 'kuhnya-belaya-uglovaya' : 'shkaf-v-prikhozhuyu';
  const heroImg = IMAGES[heroP][0];
  const faq = isK ? [FAQ[0], FAQ[4], FAQ[2], FAQ[1], FAQ[5], FAQ[3]] : [FAQ[0], FAQ[6], FAQ[2], FAQ[1], FAQ[5], FAQ[3]];
  const t = isK
    ? {
        title: 'Кухни на заказ в Ижевске по индивидуальным размерам — Draft Mebel',
        desc: 'Кухни на заказ в Ижевске и Удмуртии от производителя: прямые, угловые, П-образные, с островом, до потолка, под встроенную технику. Бесплатный замер и дизайн-проект. ☎ ' + C.phoneDisplay,
        h1: 'Кухни на заказ в Ижевске',
        lead: 'Делаем кухни точно по размерам помещения: верхние шкафы до потолка, колонны под встроенную технику, подоконник-столешница, остров. Своё производство, бесплатный замер и дизайн-проект.',
        types: KITCHEN_TYPES,
        name: 'Кухни на заказ',
        inside: ['Сушки для посуды и лотки для приборов', 'Выдвижные ящики вместо полок', 'Ниши под встроенную посудомойку, духовой шкаф и СВЧ', 'Встроенная вытяжка и подсветка рабочей зоны', 'Ручки-профили или фасады без ручек', 'Столешница-подоконник и продолжение под окном'],
        insideH: 'Продумываем не только фасады',
      }
    : {
        title: 'Шкафы на заказ в Ижевске: встроенные, в прихожую, в санузел — Draft Mebel',
        desc: 'Шкафы на заказ в Ижевске и Удмуртии от производителя: встроенные до потолка, в прихожую и спальню, в санузел, на балкон. Бесплатный замер и дизайн-проект. ☎ ' + C.phoneDisplay,
        h1: 'Шкафы на заказ в Ижевске',
        lead: 'Встроенные и распашные шкафы от пола до потолка — в прихожую, спальню, санузел и на балкон. Используем каждый сантиметр ниши, делаем наполнение под ваши вещи.',
        types: WARDROBE_TYPES,
        name: 'Шкафы на заказ',
        inside: ['Антресоли до самого потолка', 'Полки, штанги и ящики под ваши вещи', 'Ниша для обуви внизу', 'Подсветка ниш и полок', 'Встраивание вокруг коробов, инсталляций и труб', 'Фасады в тон дверям и полу'],
        insideH: 'Наполнение — под ваши вещи',
      };
  return `${head({ title: t.title, description: t.desc, canonical: slug, R, ld: [ldCrumbs(t.name, slug), ldFaq(faq)] })}
<body>
${header(R, isK ? 'kuhni' : 'shkafy')}
<main id="main">
<section class="phero">
  <div class="wrap phero__in">
    <div class="phero__txt">
      <nav class="crumbs" aria-label="Хлебные крошки"><a href="../">Главная</a><span>/</span>${t.name}</nav>
      <h1>${t.h1}</h1>
      <p class="hero__lead">${t.lead}</p>
      <ul class="checks hero__checks">
        <li>${I.check}<span><b>Бесплатный</b> замер</span></li>
        <li>${I.check}<span><b>Бесплатный</b> дизайн-проект</span></li>
        <li>${I.check}<span><b>Своё</b> производство</span></li>
        <li>${I.check}<span>Ижевск и <b>вся Удмуртия</b></span></li>
      </ul>
      <div class="hero__cta">
        <a class="btn btn--primary btn--lg" href="#raschet">${I.calc}<span>Рассчитать стоимость</span></a>
        <a class="btn btn--ghost btn--lg" href="${tel}">${I.phone}<span>${C.phoneDisplay}</span></a>
      </div>
    </div>
    <div class="phero__media">${picture(heroImg, PROJECTS.find((p) => p.slug === heroP).photos[0].alt, R, { sizes: '(max-width: 900px) 100vw, 45vw', eager: true })}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap two">
    <div>
      <span class="eyebrow">Что делаем</span>
      <h2>${isK ? 'Кухни любой планировки' : 'Шкафы под любую нишу'}</h2>
      <ul class="checks checks--grid">${t.types.map((x) => `<li>${I.check}${x}</li>`).join('')}</ul>
    </div>
    <div class="card-soft">
      <h3>${t.insideH}</h3>
      <ul class="checks">${t.inside.map((x) => `<li>${I.check}${x}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="sec sec--alt" id="raboty">
  <div class="wrap">
    <div class="sec__head"><span class="eyebrow">Наши работы</span><h2>${isK ? 'Кухни, которые мы сделали' : 'Шкафы, которые мы сделали'}</h2><p>Наши реальные объекты, снятые после монтажа. Нажмите на фото, чтобы открыть галерею.</p></div>
    <div class="works">${items.map((p) => workCard(p, R)).join('')}</div>
    <p class="works__more">${isK ? 'Нужен ещё и шкаф? <a href="../shkafy/">Смотрите наши шкафы</a>' : 'Нужна ещё и кухня? <a href="../kuhni/">Смотрите наши кухни</a>'} — при заказе комплекта замер и проект делаем за один выезд.</p>
  </div>
</section>

${secCompare()}
${quiz(R, kind)}
${secSteps(R)}
${secPrice(R, '../')}
${secFaq(faq)}
${secContacts()}
</main>
${footer(R, isK ? 'kuhni' : 'shkafy')}`;
}

function pageLegal(kind) {
  const R = '../';
  const op = `${C.legalName || 'Draft Mebel'}${C.inn ? ` (ИНН ${C.inn})` : ''}`;
  const date = '13 октября 2026 г.';
  const contactsLine = `телефон ${C.phoneDisplay}${C.email ? `, e-mail ${C.email}` : ''}, адрес: ${C.address}`;
  let title, h1, body, slug;
  if (kind === 'privacy') {
    slug = 'politika-konfidentsialnosti/';
    title = 'Политика конфиденциальности — Draft Mebel';
    h1 = 'Политика в отношении обработки персональных данных';
    body = `
<p class="muted">Редакция от ${date}</p>
<h2>1. Общие положения</h2>
<p>1.1. Настоящая политика составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, которые принимает ${esc(op)} (далее — Оператор).</p>
<p>1.2. Политика применяется ко всей информации, которую Оператор может получить о посетителях сайта ${esc(C.siteUrl)} (далее — Сайт).</p>
<p>1.3. Контакты Оператора: ${esc(contactsLine)}.</p>
<h2>2. Какие данные мы обрабатываем</h2>
<p>2.1. Имя (по желанию пользователя) и номер телефона, которые пользователь указывает в форме расчёта стоимости.</p>
<p>2.2. Ответы на вопросы формы: вид мебели, форма и примерный размер, желаемые сроки, наличие проекта, удобный способ связи.</p>
<p>2.3. Технические данные, которые автоматически передаются при посещении Сайта: cookie, IP-адрес, сведения о браузере. Сайт не использует сервисы веб-аналитики и рекламные счётчики.</p>
<h2>3. Цели обработки</h2>
<p>3.1. Связаться с пользователем по его заявке, рассчитать стоимость мебели, договориться о замере.</p>
<p>3.2. Подготовить и заключить договор на изготовление мебели, если пользователь этого захочет.</p>
<p>3.3. Обеспечить корректную работу Сайта.</p>
<h2>4. Правовые основания</h2>
<p>4.1. Персональные данные из формы обрабатываются на основании согласия пользователя, которое он даёт, отмечая соответствующее поле перед отправкой формы. Текст согласия размещён на странице <a href="../soglasie-na-obrabotku/">«Согласие на обработку персональных данных»</a>.</p>
<h2>5. Порядок обработки</h2>
<p>5.1. Оператор обрабатывает данные с использованием средств автоматизации и без них: сбор, запись, систематизация, хранение, уточнение, использование, удаление, уничтожение.</p>
<p>5.2. Оператор не продаёт персональные данные и не передаёт их третьим лицам, кроме случаев, предусмотренных законодательством РФ.</p>
<p>5.3. Данные хранятся до достижения целей обработки, но не дольше одного года с последнего обращения пользователя, если между сторонами не заключён договор. После этого данные удаляются.</p>
<p>5.4. Оператор принимает правовые, организационные и технические меры для защиты данных от неправомерного доступа, изменения, распространения и уничтожения.</p>
<h2>6. Cookie и сторонние сервисы</h2>
<p>6.1. Сайт использует cookie и локальное хранилище браузера, чтобы корректно работать (например, запомнить, что пользователь закрыл уведомление о cookie).</p>
<p>6.2. На Сайт встроена Яндекс Карта (ООО «Яндекс»). Она может устанавливать собственные cookie по правилам Яндекса. Пользователь может отключить cookie в настройках браузера — Сайт при этом продолжит работать.</p>
<h2>7. Права пользователя</h2>
<p>7.1. Пользователь вправе получить сведения об обработке своих данных, потребовать их уточнения, блокирования или удаления, а также отозвать согласие на обработку.</p>
<p>7.2. Для этого достаточно обратиться к Оператору по контактам из п. 1.3. Оператор ответит в сроки, установленные 152-ФЗ.</p>
<h2>8. Заключительные положения</h2>
<p>8.1. Оператор может изменять политику. Новая редакция действует с момента публикации на Сайте.</p>`;
  } else {
    slug = 'soglasie-na-obrabotku/';
    title = 'Согласие на обработку персональных данных — Draft Mebel';
    h1 = 'Согласие на обработку персональных данных';
    body = `
<p class="muted">Редакция от ${date}</p>
<p>Отправляя форму на сайте ${esc(C.siteUrl)}, я свободно, своей волей и в своём интересе даю согласие ${esc(op)}, адрес: ${esc(C.address)} (далее — Оператор), на обработку моих персональных данных на следующих условиях.</p>
<h2>1. Перечень данных</h2>
<p>Имя, номер телефона, а также сведения, которые я указал в форме: вид мебели, форма и размер, желаемые сроки, наличие проекта, удобный способ связи.</p>
<h2>2. Цели обработки</h2>
<p>Связаться со мной по заявке, рассчитать стоимость мебели, согласовать замер, подготовить и заключить договор.</p>
<h2>3. Действия с данными</h2>
<p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), использование, блокирование, удаление, уничтожение — с использованием средств автоматизации и без них.</p>
<h2>4. Срок действия и отзыв</h2>
<p>Согласие действует до достижения целей обработки, но не дольше одного года с моего последнего обращения, если не заключён договор. Я могу отозвать согласие в любой момент, сообщив об этом Оператору: ${esc(contactsLine)}.</p>
<h2>5. Подтверждение</h2>
<p>Я подтверждаю, что ознакомился с <a href="../politika-konfidentsialnosti/">политикой конфиденциальности</a> Оператора, и что указанные мной данные принадлежат мне.</p>`;
  }
  return `${head({ title, description: h1 + ' — Draft Mebel, кухни и шкафы на заказ в Ижевске.', canonical: slug, R })}
<body>
${header(R, '')}
<main id="main" class="legal">
  <div class="wrap wrap--narrow">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="../">Главная</a><span>/</span>${kind === 'privacy' ? 'Политика конфиденциальности' : 'Согласие на обработку'}</nav>
    <h1>${h1}</h1>
    ${body}
  </div>
</main>
${footer(R, '')}`;
}

function page404() {
  const R = C.siteUrl;
  return `${head({ title: 'Страница не найдена — Draft Mebel', description: 'Такой страницы нет. Перейдите на главную Draft Mebel — кухни и шкафы на заказ в Ижевске.', canonical: '404.html', R })}
<body>
${header(R, '')}
<main id="main" class="nf">
  <div class="wrap wrap--narrow">
    <p class="nf__code">404</p>
    <h1>Такой страницы нет</h1>
    <p>Возможно, ссылка устарела. Посмотрите наши кухни и шкафы или сразу рассчитайте стоимость.</p>
    <div class="hero__cta"><a class="btn btn--primary" href="${R}">На главную</a><a class="btn btn--ghost" href="${R}kuhni/">Кухни</a><a class="btn btn--ghost" href="${R}shkafy/">Шкафы</a></div>
  </div>
</main>
${footer(R, '')}`;
}

// ---------- запись ----------
function write(rel, html) {
  const f = path.join(DOCS, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html.replace(/\n{3,}/g, '\n\n'));
}

write('index.html', pageHome());
write('kuhni/index.html', pageCategory('kitchen'));
write('shkafy/index.html', pageCategory('wardrobe'));
write('politika-konfidentsialnosti/index.html', pageLegal('privacy'));
write('soglasie-na-obrabotku/index.html', pageLegal('consent'));
write('404.html', page404());

const urls = ['', 'kuhni/', 'shkafy/', 'politika-konfidentsialnosti/', 'soglasie-na-obrabotku/'];
const today = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${today}</lastmod><priority>${u === '' ? '1.0' : u.includes('politika') || u.includes('soglasie') ? '0.2' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
// Фавикон — знак-уголок из логотипа, упрощённый до векторной формы
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#03395a"/><path d="M14 22h30v26l-8 7V30H14z" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M14 22l8-7h22v7M44 15v7" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>`);
console.log('Готово: 6 страниц, sitemap.xml, robots.txt');
