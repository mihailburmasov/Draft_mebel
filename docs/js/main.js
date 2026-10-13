/* Draft Mebel — поведение страниц: меню, фильтр работ, галерея, квиз, cookie, кнопка MAX */
(function () {
  'use strict';
  var SITE = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // ---------- уведомление ----------
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 5200);
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ничего */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  // ---------- шапка и меню ----------
  var hdr = $('.hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('.burger'), nav = $('#nav');
  function closeNav() { if (!nav) return; nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  // ---------- кнопка MAX без ссылки на профиль: копируем номер ----------
  $$('.js-max').forEach(function (b) {
    b.addEventListener('click', function () {
      var ph = b.getAttribute('data-phone') || SITE.phone;
      copy(ph).then(function () { toast('Номер ' + ph + ' скопирован. Откройте MAX и найдите нас по номеру телефона.'); });
    });
  });

  // ---------- фильтр работ ----------
  var filter = $('.filter');
  if (filter) {
    filter.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', filter).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var f = b.getAttribute('data-f');
      $$('.works .work').forEach(function (w) { w.hidden = f !== 'all' && w.getAttribute('data-cat') !== f; });
    });
  }

  // ---------- галерея ----------
  var lb = $('#lb');
  if (lb) {
    var img = $('img', lb), cap = $('figcaption', lb), items = [], idx = 0, opener = null;
    var show = function (i) {
      idx = (i + items.length) % items.length;
      img.src = items[idx].src;
      img.alt = items[idx].cap;
      cap.textContent = items[idx].cap + (items.length > 1 ? ' · ' + (idx + 1) + ' / ' + items.length : '');
    };
    var open = function (list, btn) {
      items = list; opener = btn;
      lb.classList.toggle('is-single', list.length < 2);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      show(0);
      $('.lb__close', lb).focus();
    };
    var close = function () {
      lb.hidden = true; img.src = '';
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };
    $$('.js-gallery').forEach(function (b) {
      b.addEventListener('click', function () {
        try { open(JSON.parse(b.getAttribute('data-gallery')), b); } catch (e) { /* битые данные — молча пропускаем */ }
      });
    });
    $('.lb__close', lb).addEventListener('click', close);
    $('.lb__prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb__next', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  // ---------- квиз ----------
  var form = $('#quiz');
  if (form) {
    var steps = $$('.quiz__step', form);
    var bar = $('.quiz__bar span', form), count = $('.quiz__count', form);
    var back = $('.quiz__back', form), next = $('.quiz__next', form), submit = $('.quiz__submit', form);
    var err = $('.quiz__err', form);
    var pos = 0;

    var val = function (name) { var el = form.querySelector('[name="' + name + '"]:checked'); return el ? el.value : ''; };
    // Порядок шагов зависит от ответа на первый вопрос
    var sequence = function () {
      var t = val('type'), seq = [steps[0]];
      if (t === 'Кухня' || t === 'Кухня и шкаф') seq.push($('[data-for="kitchen"]', form));
      else if (t === 'Шкаф') seq.push($('[data-for="wardrobe"]', form));
      return seq.concat(steps.filter(function (s) { return !s.hasAttribute('data-for') && s !== steps[0]; }));
    };
    var render = function () {
      var seq = sequence();
      steps.forEach(function (s) { s.classList.toggle('is-active', s === seq[pos]); });
      var total = val('type') === 'Другая корпусная мебель' ? seq.length : steps.length - 1;
      bar.style.width = ((pos + 1) / total * 100) + '%';
      count.innerHTML = 'Шаг <b>' + (pos + 1) + '</b> из ' + total;
      back.hidden = pos === 0;
      var last = pos === seq.length - 1;
      next.hidden = last; submit.hidden = !last;
      err.textContent = '';
    };
    var valid = function () {
      var s = sequence()[pos], n = s.getAttribute('data-step');
      if (n === '3') {
        var len = form.size_m.value, ok = form.noSize.checked || (len && +len > 0);
        if (!ok) { toast('Укажите примерную длину или отметьте «Не знаю — нужен замер»'); form.size_m.focus(); }
        return ok;
      }
      if (n === '6') return true;
      var r = $$('input[type="radio"]', s);
      if (r.length && !r.some(function (x) { return x.checked; })) { toast('Выберите один из вариантов'); return false; }
      return true;
    };
    var go = function (d) {
      if (d > 0 && !valid()) return;
      pos = Math.max(0, Math.min(sequence().length - 1, pos + d));
      render();
      var top = form.getBoundingClientRect().top;
      if (top < 0) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    next.addEventListener('click', function () { go(1); });
    back.addEventListener('click', function () { go(-1); });
    // Одиночный выбор сразу переводит на следующий шаг
    $$('.quiz__step:not([data-step="6"]) input[type="radio"]', form).forEach(function (r) {
      r.addEventListener('change', function () { setTimeout(function () { go(1); }, 220); });
    });
    form.noSize.addEventListener('change', function () { if (form.noSize.checked) form.size_m.value = ''; });
    form.size_m.addEventListener('input', function () { if (form.size_m.value) form.noSize.checked = false; });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && submit.hidden) { e.preventDefault(); go(1); }
    });

    var summary = function () {
      var t = val('type');
      var lines = [
        ['Что нужно', t],
        ['Форма кухни', (t === 'Кухня' || t === 'Кухня и шкаф') ? val('shape') : ''],
        ['Шкаф', t === 'Шкаф' ? val('wardrobe') : ''],
        ['Размер', form.noSize.checked ? 'не знаю — нужен замер' : (form.size_m.value ? form.size_m.value + ' м' : '')],
        ['Когда', val('when')],
        ['Проект', val('project')],
        ['Имя', form.client_name.value.trim()],
        ['Телефон', form.phone.value.trim()],
        ['Связаться', val('contact')],
      ];
      return lines.filter(function (l) { return l[1]; });
    };

    var finish = function (ok) {
      form.classList.add('is-done');
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      $('.quiz__done', form).hidden = false;
      $('.quiz__done-ok', form).hidden = !ok;
      $('.quiz__done-fail', form).hidden = ok;
      if (!ok) $('.quiz__summary', form).textContent = summary().map(function (l) { return l[0] + ': ' + l[1]; }).join('\n');
    };
    $('.js-copy-summary', form).addEventListener('click', function () {
      copy('Заявка с сайта Draft Mebel\n' + $('.quiz__summary', form).textContent).then(function () { toast('Ответы скопированы — вставьте их в сообщение.'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var digits = form.phone.value.replace(/\D/g, '');
      form.phone.classList.toggle('is-bad', digits.length < 10);
      if (digits.length < 10) { err.textContent = 'Укажите телефон, чтобы мы могли прислать расчёт.'; form.phone.focus(); return; }
      if (!form.consent.checked) { err.textContent = 'Отметьте согласие на обработку персональных данных.'; return; }
      err.textContent = '';
      // Ловушка для ботов: людям поле не видно
      if (form.company_site.value) { finish(true); return; }
      if (!SITE.endpoint) { finish(false); return; }
      var data = {};
      summary().forEach(function (l) { data[l[0]] = l[1]; });
      data['Согласие на обработку ПДн'] = 'да, ' + new Date().toLocaleString('ru-RU');
      data['Страница'] = location.href;
      data._subject = 'Заявка с сайта Draft Mebel: ' + (val('type') || 'расчёт');
      data._template = 'table';
      data._captcha = 'false';
      submit.disabled = true; submit.textContent = 'Отправляем…';
      fetch(SITE.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.ok ? r.json().catch(function () { return {}; }) : Promise.reject(r.status); })
        .then(function (j) { finish(!(j && (j.success === false || j.success === 'false'))); })
        .catch(function () { finish(false); });
    });

    render();
  }

  // ---------- cookie ----------
  var cookie = $('#cookie');
  if (cookie && !store('dm_cookie_ok')) {
    cookie.hidden = false;
    $('#cookieOk').addEventListener('click', function () { store('dm_cookie_ok', '1'); cookie.hidden = true; });
  }
})();
