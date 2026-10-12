/* seaFOX – Seitenlogik. Vanilla JS, keine Bibliothek, keine Netzwerkanfragen außer lokalen Medien.
   Bewegung (nur transform und opacity, Kurve und Dauern aus css/site.css):
   - Blöcke blenden beim ersten Erscheinen einmal ein, innerhalb einer Gruppe gestaffelt
   - Tablet, dessen Bildschirm dem Text folgt (Überblenden zwischen ECHTEN Aufnahmen, nichts wird verformt);
     eine schmale Linie neben den Schritten zeigt den Fortschritt
   - Stimmungsbilder in „Für wen“ setzen sich beim Hereinscrollen (Maßstab 1,06 auf 1)
   - Erklärgrafiken, die kurz laufen und dann stehen bleiben (viz.js)
   Im Lesebereich läuft nichts endlos. Bei reduzierter Bewegung und ohne IntersectionObserver steht alles. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var capture = root.classList.contains('capture');
  var still = function () { return reduce.matches || capture; };
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in window;
  // Die Erklärgrafiken (viz.js) zeichnen mit den lokalen Schriften; im Seitentext braucht sie nur noch die Wortmarke.
  try { if (document.fonts && document.fonts.load) { document.fonts.load('12px "Electrolize"'); document.fonts.load('600 12px "Orbitron"'); } } catch (e) {}
  var param = function (k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; };

  /* ---------- Navigation ---------- */
  var nav = $('#nav'), sections = $$('main > section[id]'), navLinks = $$('.nav ul a'), ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0, vh = window.innerHeight;
      if (nav) nav.classList.toggle('is-solid', y > 40);
      var cur = sections[0];
      for (var i = 0; i < sections.length; i++) { if (sections[i].getBoundingClientRect().top < vh * 0.45) cur = sections[i]; }
      navLinks.forEach(function (a) { if (a.getAttribute('href') === '#' + cur.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      choreo(y, vh);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---------- Einblenden beim Scrollen: einmal, gestaffelt je Gruppe ----------
     Der verborgene Zustand hängt an html.reveal; die Klasse wird erst gesetzt, wenn der Beobachter steht. */
  if (hasIO && !still()) {
    try {
      var rv = $$('main > section:not(#hero) .head, .split > *, .plate, .also > *, .trio > div, .two > *, .facts, .road > li, .notice, details.more, .panel__copy, .foot > *');
      rv = rv.filter(function (el) { var d = el.parentNode && el.parentNode.closest('details'); return !d; });   // Aufgeklapptes erscheint sofort
      var rio = new IntersectionObserver(function (es) {
        var n = 0;
        es.forEach(function (e) {
          var above = e.boundingClientRect.bottom < 0;          // schon vorbei (Sprung per Anker): sofort zeigen
          if (!e.isIntersecting && !above) return;
          if (!above) e.target.style.setProperty('--rv-d', (Math.min(n++, 4) * 90) + 'ms');
          e.target.classList.add('is-in');
          rio.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rv.forEach(function (el) { el.classList.add('rv'); rio.observe(el); });
      root.classList.add('reveal');
      if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) rv.forEach(function (el) { el.classList.add('is-in'); }); });
    } catch (e) { root.classList.remove('reveal'); }
  }

  /* ---------- Tablets: Wechsel zwischen echten Aufnahmen ---------- */
  function show(device, i, capEl) {
    var imgs = $$('.device__screen img', device);
    imgs.forEach(function (im, k) { if (k === i) im.loading = 'eager'; im.classList.toggle('is-active', k === i); });
    device._i = i;
    var cap = imgs[i] && imgs[i].getAttribute('data-cap');
    if (!capEl || !cap || capEl._cap === cap) return;
    capEl._cap = cap;                             // Bildunterschrift (Herkunft der Aufnahme) wechselt mit
    clearTimeout(capEl._t);
    if (still()) { capEl.innerHTML = cap; return; }
    capEl.classList.add('is-swapping');           // kurz ausblenden, Text tauschen, einblenden
    capEl._t = setTimeout(function () { capEl.innerHTML = capEl._cap; capEl.classList.remove('is-swapping'); }, 170);
  }
  $$('[data-toggle]').forEach(function (grp) {
    var device = $(grp.getAttribute('data-toggle')), capEl = grp.getAttribute('data-caption') ? $(grp.getAttribute('data-caption')) : null;
    $$('button', grp).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', grp).forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        show(device, +b.getAttribute('data-i'), capEl);
      });
    });
  });

  /* ---------- Dashboard: Tablet bleibt stehen, Bildschirm folgt dem Text ---------- */
  var scrolly = $('#scrolly'), dashDevice = $('#dashDevice'), dashCap = $('#dashCap'), steps = $$('.step'), heroDevice = $('#heroDevice');
  var stepsBox = $('.scrolly__steps'), panels = $$('.panel__media');
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  function setStep(i) {
    steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    if (dashDevice && dashDevice._i !== i) show(dashDevice, i, dashCap);
  }
  if (hasIO && steps.length && !capture) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setStep(+e.target.getAttribute('data-screen')); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { sio.observe(s); });
  }
  function choreo(y, vh) {
    if (still()) return;
    if (scrolly && dashDevice && window.innerWidth > 960) {     // setzt sich beim Hereinscrollen: gleichmäßiger Maßstab, keine Drehung
      var r = scrolly.getBoundingClientRect();
      var enter = clamp01((vh * 0.95 - r.top) / (vh * 0.6)), e3 = 1 - Math.pow(1 - enter, 3);
      dashDevice.style.transform = enter < 1 ? 'translate3d(0,' + ((1 - e3) * 28).toFixed(1) + 'px,0) scale(' + (0.96 + e3 * 0.04).toFixed(4) + ')' : '';
    } else if (dashDevice && dashDevice.style.transform) { dashDevice.style.transform = ''; }
    if (stepsBox) {                                              // Fortschrittslinie neben den Schritten
      var sr = stepsBox.getBoundingClientRect();
      stepsBox.style.setProperty('--p', clamp01((vh * 0.5 - sr.top) / Math.max(1, sr.height)).toFixed(4));
    }
    for (var i = 0; i < panels.length; i++) {                    // Stimmungsbilder setzen sich
      var pr = panels[i].getBoundingClientRect();
      if (pr.bottom < -50 || pr.top > vh + 50) continue;
      var pp = clamp01((vh - pr.top) / (vh * 0.9));
      panels[i].style.setProperty('--pp', (1 - Math.pow(1 - pp, 2)).toFixed(4));
    }
  }
  if (!still()) panels.forEach(function (el) { el.style.setProperty('--pp', '0'); });   // Ausgangslage nur, wenn danach auch bewegt wird

  /* ---------- Videos: Quellen erst bei Bedarf; kein Autoplay bei reduzierter Bewegung ---------- */
  function arm(v) { if (v._armed) return; v._armed = true; $$('source[data-src]', v).forEach(function (s) { s.src = s.getAttribute('data-src'); }); v.load(); }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  var heroLoop = $('#heroLoop');
  if (heroLoop && !still()) {
    var startHero = function () { arm(heroLoop); play(heroLoop); };
    if (document.readyState === 'complete') startHero(); else window.addEventListener('load', startHero);
    if (hasIO) new IntersectionObserver(function (es) { if (!heroLoop._armed || reduce.matches) return; if (es[0].isIntersecting) play(heroLoop); else heroLoop.pause(); }, { threshold: 0.05 }).observe(heroLoop);
  }
  $$('video[data-inview]').forEach(function (v) {     // B-Roll: läuft einmal durch und bleibt stehen
    v.addEventListener('playing', function () { v.classList.add('is-playing'); });
    if (!hasIO || still()) return;
    var played = false;
    new IntersectionObserver(function (es) { if (es[0].isIntersecting && !played) { played = true; arm(v); play(v); } }, { threshold: 0.5 }).observe(v);
  });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) { $$('video').forEach(function (v) { v.pause(); }); panels.forEach(function (el) { el.style.removeProperty('--pp'); }); if (stepsBox) stepsBox.style.removeProperty('--p'); } });

  /* ---------- Beta-Formular: sendet nichts, öffnet nur einen lokalen E-Mail-Entwurf ---------- */
  var form = $('#betaForm');
  if (form) {
    var BETA_ADDRESS = ''; // Kontaktadresse des Betreibers. Solange sie leer ist, bleiben Formular und Einladung verborgen.
    if (BETA_ADDRESS) $$('[data-beta]').forEach(function (el) { el.hidden = false; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!BETA_ADDRESS) return;
      var body = 'Hallo seaFOX-Team,\n\nich interessiere mich für die Beta.\n\nUnterwegs als: ' + $('#betaArt').value + '\nBordnetz: ' + ($('#betaNetz').value || '-') + '\n';
      var a = document.createElement('a');
      a.href = 'mailto:' + BETA_ADDRESS + '?subject=' + encodeURIComponent('seaFOX Beta-Interesse') + '&body=' + encodeURIComponent(body);
      a.click();
    });
  }

  /* ---------- Capture-Modus für die Mockups (?capture=1&only=<id>&step=<n>&sens=<n>&hero=<n>) ---------- */
  if (capture) {
    $$('img').forEach(function (im) { im.loading = 'eager'; im.decoding = 'sync'; if (!im.complete) { var u = im.getAttribute('src'); im.removeAttribute('src'); im.setAttribute('src', u); } });
    var cvh = param('vh'); if (cvh) root.style.setProperty('--vh', (+cvh / 100) + 'px');
    var st = param('step'); if (st !== null) setStep(+st);
    var hs = param('hero'); if (hs !== null && heroDevice) show(heroDevice, +hs);
    var ss = param('sens'); if (ss !== null) show($('#sensDevice'), +ss, $('#sensCap'));
    var half = param('half');                         // Teil der ganzen Seite, ohne die Abstände zu verändern
    var only = param('only') || half;                 // zeigt genau einen Abschnitt (Headless-Chrome kann nicht scrollen)
    if (only) {
      root.classList.add(half ? 'capture-full' : 'capture-only');
      var ids = only.split(',');
      $$('main > section, footer').forEach(function (el) { if (ids.indexOf(el.id || 'footer') < 0) el.setAttribute('data-hide', ''); });
      if (st !== null) steps.forEach(function (s, k) { if (k !== +st) s.setAttribute('data-hide', ''); });
      var part = param('part'); if (part) $$('[data-part]').forEach(function (el) { if (el.getAttribute('data-part') !== part) el.setAttribute('data-hide', ''); });
      if (nav && !half) nav.classList.add('is-solid');
      if (nav && half && half.indexOf('hero') < 0) nav.setAttribute('data-hide', '');
    }
  }

  onScroll();
})();
