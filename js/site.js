/* seaFOX – Seitenlogik. Vanilla JS, keine Bibliothek, keine Netzwerkanfragen außer lokalen Medien.
   Bewegung gibt es nur dort, wo sie etwas erklärt:
   - Abschnittsköpfe blenden einmal ein
   - Tablet, dessen Bildschirm dem Text folgt (Überblenden zwischen ECHTEN Aufnahmen, nichts wird verformt)
   - Erklärgrafiken, die kurz laufen und dann stehen bleiben (viz.js)
   Im Lesebereich läuft nichts endlos. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var capture = root.classList.contains('capture');
  var still = function () { return reduce.matches || capture; };
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in window;
  var param = function (k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; };

  /* ---------- Loader: Ping, bis die Schriften da sind (höchstens 2 s) ---------- */
  var done = false;
  function ready() { if (done) return; done = true; root.classList.add('is-ready'); var l = $('#loader'); if (l) l.setAttribute('aria-hidden', 'true'); }
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  fontsReady.then(function () { setTimeout(ready, still() ? 0 : 300); });
  setTimeout(ready, 2000);

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

  /* ---------- Abschnittsköpfe blenden einmal ein (kein Punkt, kein Ping, kein Halo) ---------- */
  var heads = $$('.head');
  if (hasIO && !capture) {
    var hio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        hio.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    heads.forEach(function (el) { hio.observe(el); });
  } else { heads.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- Tablets: Wechsel zwischen echten Aufnahmen ---------- */
  function show(device, i, capEl) {
    var imgs = $$('.device__screen img', device);
    imgs.forEach(function (im, k) { if (k === i) im.loading = 'eager'; im.classList.toggle('is-active', k === i); });
    device._i = i;
    var cap = imgs[i] && imgs[i].getAttribute('data-cap');
    if (capEl && cap) capEl.innerHTML = cap;      // Bildunterschrift (Herkunft der Aufnahme) wechselt mit
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
    if (heroDevice && y < vh) {           // Tablet richtet sich beim ersten Scrollen auf
      var hp = y / vh;
      heroDevice.style.transform = 'rotateX(' + (5 - hp * 5).toFixed(2) + 'deg) rotateY(' + (-7 + hp * 7).toFixed(2) + 'deg)';
    }
    if (scrolly && dashDevice && window.innerWidth > 960) {     // steigt auf und dreht sich um wenige Grad
      var r = scrolly.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)));
      var enter = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.7)));
      dashDevice.style.transform = 'translate3d(0,' + ((1 - enter) * 60).toFixed(1) + 'px,0) rotateY(' + (5 - p * 10).toFixed(2) + 'deg)';
    } else if (dashDevice) { dashDevice.style.transform = ''; }
  }

  /* ---------- Videos: Quellen erst bei Bedarf; kein Autoplay bei reduzierter Bewegung ---------- */
  function arm(v) { if (v._armed) return; v._armed = true; $$('source[data-src]', v).forEach(function (s) { s.src = s.getAttribute('data-src'); }); v.load(); }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  var heroLoop = $('#heroLoop'), film = $('#heroFilm');
  if (heroLoop && !still()) {
    var startHero = function () { arm(heroLoop); play(heroLoop); };
    if (document.readyState === 'complete') startHero(); else window.addEventListener('load', startHero);
    if (hasIO) new IntersectionObserver(function (es) { if (!heroLoop._armed || reduce.matches) return; if (es[0].isIntersecting) play(heroLoop); else heroLoop.pause(); }, { threshold: 0.05 }).observe(heroLoop);
  }
  if (film) {         // der Film startet nur auf Wunsch (Bedienelemente des Browsers)
    ['pointerdown', 'focus', 'play', 'keydown'].forEach(function (ev) { film.addEventListener(ev, function () { arm(film); }, { once: true }); });
    if (hasIO) new IntersectionObserver(function (es) { if (es[0].isIntersecting) arm(film); else if (!film.paused) film.pause(); }, { threshold: 0.2 }).observe(film);
  }
  $$('video[data-inview]').forEach(function (v) {     // B-Roll: läuft einmal durch und bleibt stehen
    v.addEventListener('playing', function () { v.classList.add('is-playing'); });
    if (!hasIO || still()) return;
    var played = false;
    new IntersectionObserver(function (es) { if (es[0].isIntersecting && !played) { played = true; arm(v); play(v); } }, { threshold: 0.5 }).observe(v);
  });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) $$('video').forEach(function (v) { v.pause(); }); });

  /* ---------- Filmkorn aus einem Shader (nicht ins Bildmaterial eingebrannt), als Standbild je Tafel ---------- */
  (function grain() {
    var targets = $$('canvas.grain'); if (!targets.length) return;
    var src = document.createElement('canvas'); src.width = src.height = 256;
    var gl = null; try { gl = src.getContext('webgl', { preserveDrawingBuffer: true }); } catch (e) {}
    var hide = function () { targets.forEach(function (c) { c.style.display = 'none'; }); };
    if (!gl) { hide(); return; }
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;float h(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}' +
      'void main(){vec2 c=gl_FragCoord.xy;float n=(h(c)+h(c*1.7+3.1)+h(c*.61+7.7))/3.;gl_FragColor=vec4(vec3(n),1.);}'));
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { hide(); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    function paint(c) {
      var w = Math.round(c.clientWidth / 1.5), h = Math.round(c.clientHeight / 1.5); if (!w || !h) return;
      c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = x.createPattern(src, 'repeat'); x.fillRect(0, 0, w, h);
    }
    if (hasIO) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { paint(e.target); io.unobserve(e.target); } }); }, { rootMargin: '200px' });
      targets.forEach(function (c) { io.observe(c); }); } else targets.forEach(paint);
  })();

  /* ---------- Beta-Formular: sendet nichts, öffnet nur einen lokalen E-Mail-Entwurf ---------- */
  var form = $('#betaForm');
  if (form) {
    var BETA_ADDRESS = ''; // Platzhalter – vor Veröffentlichung durch den Betreiber auszufüllen
    if (BETA_ADDRESS) { var ph = $('#betaPh'); if (ph) ph.hidden = true; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
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
