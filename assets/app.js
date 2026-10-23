(function () {
  'use strict';

  var state = { exhibits: [], makers: [], type: 'all', q: '', sort: 'inv' };
  var $ = function (id) { return document.getElementById(id); };
  var TYPE_ORDER = ['Плитка', 'Черепица', 'Кирпич', 'Изразец', 'Гвоздь', 'Другое'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Пути к фото форма пишет как /media/..., а сайт может жить в подпапке, поэтому делаем их относительными.
  function src(p) { return String(p || '').replace(/^\/+/, ''); }
  function baseName(p) { return String(p || '').split('/').pop().replace(/\.md$/i, ''); }
  function makerOf(e) {
    var id = baseName(e.manufacturer);
    if (!id) return null;
    for (var i = 0; i < state.makers.length; i++) if (state.makers[i].id === id) return state.makers[i];
    return null;
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function fmtDate(d) {
    if (!d) return '';
    var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '.' + m[2] + '.' + m[1] : String(d);
  }

  function load(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }

  // Тексты шапки, подвала и контакты редактируются в форме, раздел «Тексты сайта».
  load('data/site.json').then(applySite).catch(function () {});

  function applySite(site) {
    if (!site) return;
    document.querySelectorAll('[data-text]').forEach(function (el) {
      var key = el.getAttribute('data-text');
      if (typeof site[key] === 'string') el.textContent = site[key];
    });
    if (site.title) document.title = site.title;
    $('demo-note').hidden = !site.demo_note;
    var list = (site.contacts || []).filter(function (c) { return c && c.value; });
    $('contacts').hidden = !list.length;
    $('contacts').innerHTML = list.map(function (c) {
      var v = esc(c.value);
      if (c.url && /^https?:/i.test(c.url)) v = '<a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + v + '</a>';
      else if (c.url && /^(mailto|tel):/i.test(c.url)) v = '<a href="' + esc(c.url) + '">' + v + '</a>';
      return '<div><dt>' + esc(c.label) + '</dt><dd>' + v + '</dd></div>';
    }).join('');
  }

  Promise.all([load('data/exhibits.json'), load('data/manufacturers.json')])
    .then(function (res) {
      state.exhibits = (res[0] || []).filter(Boolean);
      state.makers = (res[1] || []).filter(Boolean);
      init();
    })
    .catch(function () {
      $('grid').innerHTML = '';
      $('count').textContent = 'Не удалось загрузить каталог. Обновите страницу через минуту: после добавления экспоната сайт пересобирается.';
    });

  function init() {
    renderTally();
    renderChips();
    renderGrid();
    renderMakers();

    $('q').addEventListener('input', function (e) { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });
    $('sort').addEventListener('change', function (e) { state.sort = e.target.value; renderGrid(); });
    $('reset').addEventListener('click', resetFilters);
    $('sheet').addEventListener('close', function () {
      if (findExhibit(location.hash.slice(1))) {
        history.replaceState(null, '', '#' + currentView());
      }
    });
    $('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) $('sheet').close(); });
    window.addEventListener('hashchange', route);
    initMenu();
    route();
  }

  var view = 'katalog';
  function currentView() { return view; }
  function route() {
    var h = location.hash.replace(/^#/, '');
    var ex = h && findExhibit(h);
    if (h === 'izgotoviteli') setView('izgotoviteli');
    else if (!ex) setView('katalog');
    if (ex) openExhibit(ex, true);
    else if ($('sheet').open) $('sheet').close();
  }
  function setView(v) {
    view = v;
    $('view-katalog').hidden = v !== 'katalog';
    $('view-izgotoviteli').hidden = v !== 'izgotoviteli';
    document.querySelectorAll('[data-view]').forEach(function (t) {
      if (t.dataset.view === v) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
  }
  function findExhibit(id) {
    for (var i = 0; i < state.exhibits.length; i++) if (state.exhibits[i].id === id) return state.exhibits[i];
    return null;
  }

  function renderTally() {
    var objects = {};
    state.exhibits.forEach(function (e) { if (e.address || e.object) objects[(e.address || e.object)] = 1; });
    var n1 = state.exhibits.length, n2 = state.makers.length, n3 = Object.keys(objects).length;
    $('tally').innerHTML =
      '<div><dt>' + plural(n1, 'экспонат', 'экспоната', 'экспонатов') + '</dt><dd>' + n1 + '</dd></div>' +
      '<div><dt>' + plural(n3, 'объект', 'объекта', 'объектов') + '</dt><dd>' + n3 + '</dd></div>' +
      '<div><dt>' + plural(n2, 'изготовитель в справочнике', 'изготовителя в справочнике', 'изготовителей в справочнике') + '</dt><dd>' + n2 + '</dd></div>';
  }

  function renderChips() {
    var counts = {};
    state.exhibits.forEach(function (e) { counts[e.type || 'Другое'] = (counts[e.type || 'Другое'] || 0) + 1; });
    var types = TYPE_ORDER.filter(function (t) { return counts[t]; });
    Object.keys(counts).forEach(function (t) { if (types.indexOf(t) < 0) types.push(t); });
    var html = chip('all', 'Все', state.exhibits.length);
    types.forEach(function (t) { html += chip(t, t, counts[t]); });
    $('type-chips').innerHTML = html;
    $('type-chips').querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () { state.type = b.dataset.type; syncChips(); renderGrid(); });
    });
    syncChips();
  }
  function chip(val, label, n) {
    return '<button type="button" class="chip" data-type="' + esc(val) + '">' + esc(label) + '<span class="n">' + n + '</span></button>';
  }
  function syncChips() {
    $('type-chips').querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === state.type)); });
  }

  function filtered() {
    var list = state.exhibits.filter(function (e) {
      if (state.type !== 'all' && (e.type || 'Другое') !== state.type) return false;
      if (state.q) {
        var m2 = makerOf(e);
        var hay = [e.title, e.inv, e.stamp, e.object, e.address, e.dating, e.material, e.type, m2 && m2.name].join(' ').toLowerCase();
        if (hay.indexOf(state.q) < 0) return false;
      }
      return true;
    });
    var by = {
      inv: function (a, b) { return String(a.inv || '').localeCompare(String(b.inv || ''), 'ru', { numeric: true }); },
      year: function (a, b) { return (a.year || 9999) - (b.year || 9999); },
      added: function (a, b) { return String(b.added || '').localeCompare(String(a.added || '')); }
    };
    return list.sort(by[state.sort] || by.inv);
  }

  function renderGrid() {
    var list = filtered();
    $('count').textContent = list.length === state.exhibits.length
      ? 'Показаны все ' + list.length + ' ' + plural(list.length, 'экспонат', 'экспоната', 'экспонатов')
      : 'Найдено ' + list.length + ' из ' + state.exhibits.length;
    $('empty').hidden = list.length > 0;
    $('grid').innerHTML = list.map(function (e) {
      var ph = (e.photos || []).filter(Boolean);
      // При наведении показываем второе фото (например, тыльную сторону с клеймом).
      var cover = (ph[0] ? '<img src="' + esc(src(ph[0])) + '" alt="" loading="lazy">' : '') +
        (ph[1] ? '<img class="alt" src="' + esc(src(ph[1])) + '" alt="" loading="lazy">' : '') +
        (ph.length > 1 ? '<span class="photo-count">' + ph.length + ' фото</span>' : '');
      return '<li><button type="button" class="card" data-id="' + esc(e.id) + '">' +
        '<div class="card-img">' + cover + '</div>' +
        '<div class="card-text">' +
          '<div class="card-meta"><span class="inv">' + esc(e.inv) + '</span><span>' + esc(e.type) + '</span></div>' +
          '<h3 class="card-title">' + esc(e.title) + '</h3>' +
          '<p class="card-sub">' + esc([e.dating, e.object].filter(Boolean).join(' · ')) + '</p>' +
          (e.stamp ? '<span class="stamp-tag">клеймо: ' + esc(e.stamp) + '</span>' : '') +
        '</div></button></li>';
    }).join('');
    $('grid').querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('click', function () { var ex = findExhibit(c.dataset.id); if (ex) openExhibit(ex); });
    });
  }

  function resetFilters() {
    state.type = 'all'; state.q = '';
    $('q').value = '';
    syncChips(); renderGrid();
  }

  function facts(rows) {
    return '<dl class="facts">' + rows.filter(function (r) { return r[1]; }).map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + esc(r[1]) + '</dd>';
    }).join('') + '</dl>';
  }
  function sourcesHtml(list) {
    list = (list || []).filter(function (s) { return s && (s.title || s.url); });
    if (!list.length) return '';
    return '<div><h4 class="h-small">Источники</h4><ul class="sources">' + list.map(function (s) {
      var t = esc(s.title || s.url);
      return '<li>' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + t + '</a>' : t) + '</li>';
    }).join('') + '</ul></div>';
  }

  function openExhibit(e, fromRoute) {
    var m = makerOf(e);
    var photos = (e.photos || []).filter(Boolean);
    var gallery = '<div class="gallery">' +
      '<div class="gallery-main">' + (photos[0] ? '<img id="main-photo" src="' + esc(src(photos[0])) + '" alt="' + esc(e.title) + '">' : '') + '</div>' +
      (photos.length > 1 ? '<div class="thumbs">' + photos.map(function (p, i) {
        return '<button type="button" data-src="' + esc(src(p)) + '" aria-label="Фото ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '><img src="' + esc(src(p)) + '" alt=""></button>';
      }).join('') + '</div>' : '') + '</div>';

    var makerBlock = '<div class="maker-box"><h4 class="h-small">Изготовитель</h4>' + (m
      ? '<h3>' + esc(m.name) + '</h3>' +
        (m.identified === false ? '<span class="status unsure">Определён предположительно</span>' : '') +
        facts([['Страна', m.country], ['Место', m.city], ['Годы работы', m.years], ['Клейма', m.stamps, 'oxide']]) +
        '<div class="prose">' + (m.body || '') + '</div>' + sourcesHtml(m.sources)
      : '<p class="type">Не установлен. Если удастся определить изготовителя, добавьте его в справочник и выберите в карточке экспоната.</p>') + '</div>';

    $('sheet-body').innerHTML = gallery +
      '<div class="label">' +
        '<div class="label-head">' +
          '<div class="label-top"><span class="inv">' + esc(e.inv) + '</span><button type="button" class="close" id="close">Закрыть</button></div>' +
          '<h2 id="sheet-title">' + esc(e.title) + '</h2>' +
          '<p class="type">' + esc(e.type) + '</p>' +
        '</div>' +
        facts([
          ['Объект', e.object], ['Адрес', e.address], ['Клеймо', e.stamp, 'oxide'], ['Датировка', e.dating],
          ['Материал', e.material], ['Размеры', e.size], ['Поступил', fmtDate(e.added), 'mono']
        ]) +
        (e.body ? '<div class="prose">' + e.body + '</div>' : '') +
        sourcesHtml(e.sources) +
        makerBlock +
      '</div>';

    $('close').addEventListener('click', function () { $('sheet').close(); });
    $('sheet-body').querySelectorAll('.thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $('main-photo').src = b.dataset.src;
        $('sheet-body').querySelectorAll('.thumbs button').forEach(function (x) { x.removeAttribute('aria-current'); });
        b.setAttribute('aria-current', 'true');
      });
    });
    if (!fromRoute) history.replaceState(null, '', '#' + e.id);
    if (!$('sheet').open) $('sheet').showModal();
    $('sheet').scrollTop = 0;
  }

  function initMenu() {
    var menu = $('menu'), burger = $('burger');
    burger.addEventListener('click', function () { menu.showModal(); burger.setAttribute('aria-expanded', 'true'); });
    menu.addEventListener('close', function () { burger.setAttribute('aria-expanded', 'false'); });
    $('menu-close').addEventListener('click', function () { menu.close(); });
    menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });
    menu.querySelectorAll('[data-close]').forEach(function (a) { a.addEventListener('click', function () { menu.close(); }); });
    $('howto-toggle').addEventListener('click', function () {
      var open = $('howto').hidden;
      $('howto').hidden = !open;
      this.setAttribute('aria-expanded', String(open));
    });
  }

  function renderMakers() {
    var list = state.makers.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ru'); });
    $('makers').innerHTML = list.map(function (m) {
      var items = state.exhibits.filter(function (e) { var x = makerOf(e); return x && x.id === m.id; });
      return '<li class="maker"><div class="maker-side">' +
        '<h2>' + esc(m.name) + '</h2>' +
        (m.identified === false ? '<span class="status unsure">Определён предположительно</span>' : '') +
        facts([['Страна', m.country], ['Место', m.city], ['Годы работы', m.years], ['Клейма', m.stamps, 'oxide']]) +
        '</div><div class="prose">' + (m.body || '') + sourcesHtml(m.sources) +
        (items.length ? '<h4 class="h-small" style="margin-top:16px">Экспонаты в музее</h4><ul class="maker-items">' + items.map(function (e) {
          return '<li><button type="button" data-id="' + esc(e.id) + '"><span class="inv">' + esc(e.inv) + '</span>' + esc(e.title) + '</button></li>';
        }).join('') + '</ul>' : '') +
        '</div></li>';
    }).join('');
    $('makers').querySelectorAll('[data-id]').forEach(function (b) {
      b.addEventListener('click', function () { var ex = findExhibit(b.dataset.id); if (ex) openExhibit(ex); });
    });
  }
})();
