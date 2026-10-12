/* seaFOX – in Code gezeichnete Datenvisualisierungen (Canvas 2D).
   Alle Werte sind Beispielwerte aus Formeln, keine Messungen – so steht es auch an jeder Grafik.
   Jede Grafik läuft 12 s, sobald sie ins Bild kommt, und bleibt dann stehen; ein Klick startet sie erneut.
   Bei „Bewegung reduzieren“ gibt es nur ein Standbild. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var C = { cyan: '#64d9ff', cyanSoft: '#9debff', gold: '#e6c887', coral: '#ff6b5f', em: '#47e0a0', port: '#ff5a5f', stb: '#3ddc97',
    text: '#eaf7ff', t2: '#b3c6d3', t3: '#8fa5b5', hair: 'rgba(191,239,255,0.16)', hair2: 'rgba(191,239,255,0.32)' };
  var DISP = '"Orbitron", system-ui, sans-serif', BODY = '"Electrolize", system-ui, sans-serif';
  var TAU = Math.PI * 2;

  function rad(deg) { return (deg - 90) * Math.PI / 180; }
  function txt(c, s, x, y, size, color, align, fam, weight) {
    c.font = (weight || 500) + ' ' + size + 'px ' + (fam || DISP); c.fillStyle = color; c.textAlign = align || 'center'; c.textBaseline = 'middle';
    c.fillText(s, x, y);
  }
  function fmt(v, d) { return v.toFixed(d).replace('.', ','); }

  var draw = {
    /* ---- Windanzeige ---- */
    wind: function (c, W, H, t) {
      var cx = W / 2, cy = H / 2, R = W * 0.36;
      var awa = 38 + 9 * Math.sin(t * 0.31) + 4 * Math.sin(t * 0.83 + 1);
      var aws = 13.6 + 1.6 * Math.sin(t * 0.27 + 2) + 0.6 * Math.sin(t * 1.1);
      var twa = awa + 14 + 2 * Math.sin(t * 0.2);
      c.lineCap = 'round';
      // Skala
      for (var a = 0; a < 360; a += 10) {
        var big = a % 30 === 0, r1 = R, r2 = R - (big ? W * 0.035 : W * 0.018);
        c.strokeStyle = big ? C.hair2 : C.hair; c.lineWidth = big ? 2 : 1;
        c.beginPath(); c.moveTo(cx + Math.cos(rad(a)) * r1, cy + Math.sin(rad(a)) * r1); c.lineTo(cx + Math.cos(rad(a)) * r2, cy + Math.sin(rad(a)) * r2); c.stroke();
      }
      // Sektoren hart am Wind: Backbord rot, Steuerbord grün
      c.lineWidth = W * 0.014;
      c.strokeStyle = C.port; c.beginPath(); c.arc(cx, cy, R + W * 0.03, rad(-60), rad(-20)); c.stroke();
      c.strokeStyle = C.stb; c.beginPath(); c.arc(cx, cy, R + W * 0.03, rad(20), rad(60)); c.stroke();
      // Bootsumriss
      c.strokeStyle = C.hair2; c.lineWidth = 2; c.beginPath();
      c.moveTo(cx, cy - R * 0.5); c.bezierCurveTo(cx + R * 0.24, cy - R * 0.2, cx + R * 0.2, cy + R * 0.3, cx + R * 0.13, cy + R * 0.48);
      c.lineTo(cx - R * 0.13, cy + R * 0.48); c.bezierCurveTo(cx - R * 0.2, cy + R * 0.3, cx - R * 0.24, cy - R * 0.2, cx, cy - R * 0.5); c.stroke();
      // Zeiger wahrer Wind (gold) und scheinbarer Wind (cyan)
      function needle(deg, col, len, wid) {
        var a = rad(deg), ox = Math.cos(a), oy = Math.sin(a);
        c.fillStyle = col; c.beginPath();
        c.moveTo(cx + ox * (R - W * 0.05), cy + oy * (R - W * 0.05));
        c.lineTo(cx + ox * (R + len) - oy * wid, cy + oy * (R + len) + ox * wid);
        c.lineTo(cx + ox * (R + len) + oy * wid, cy + oy * (R + len) - ox * wid); c.closePath(); c.fill();
      }
      needle(twa, C.gold, W * 0.07, W * 0.018);
      needle(awa, C.cyan, W * 0.085, W * 0.024);
      txt(c, fmt(aws, 1), cx, cy - H * 0.02, W * 0.085, C.text, 'center', DISP, 600);
      txt(c, 'KN  AWS', cx, cy + H * 0.05, W * 0.024, C.t3);
      txt(c, 'AWA ' + Math.round(awa) + '°', W * 0.2, H * 0.92, W * 0.032, C.cyan);
      txt(c, 'TWA ' + Math.round(twa) + '°', W * 0.8, H * 0.92, W * 0.032, C.gold);
    },

    /* ---- Tiefenspur ---- */
    depth: function (c, W, H, t) {
      var L = W * 0.1, R = W * 0.9, T = H * 0.24, B = H * 0.84, maxD = 20, alarm = 4;
      function prof(x) { return 9 + 5.5 * Math.sin(x * 0.45) + 2.2 * Math.sin(x * 1.3 + 1.2) + 0.5 * Math.sin(x * 4.1); }
      function y(d) { return T + (B - T) * Math.min(1, Math.max(0, d / maxD)); }
      c.lineWidth = 1; c.strokeStyle = C.hair;
      for (var d = 0; d <= maxD; d += 5) {
        c.beginPath(); c.moveTo(L, y(d)); c.lineTo(R, y(d)); c.stroke();
        txt(c, d + ' m', L - W * 0.015, y(d), W * 0.022, C.t3, 'right', BODY, 400);
      }
      var n = 160, pts = [];
      for (var i = 0; i <= n; i++) { var x = L + (R - L) * i / n; pts.push([x, y(prof(t * 0.5 + i * 0.06))]); }
      var g = c.createLinearGradient(0, T, 0, B); g.addColorStop(0, 'rgba(70,217,208,0.30)'); g.addColorStop(1, 'rgba(10,43,82,0.05)');
      c.fillStyle = g; c.beginPath(); c.moveTo(L, B); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(R, B); c.closePath(); c.fill();
      c.strokeStyle = C.cyan; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
      pts.forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
      c.setLineDash([8, 8]); c.strokeStyle = C.coral; c.lineWidth = 2; c.beginPath(); c.moveTo(L, y(alarm)); c.lineTo(R, y(alarm)); c.stroke(); c.setLineDash([]);
      txt(c, 'ALARM ' + alarm + ',0 m', R, y(alarm) - H * 0.025, W * 0.022, C.coral, 'right');
      var last = pts[n], cur = prof(t * 0.5 + n * 0.06);
      c.fillStyle = C.text; c.beginPath(); c.arc(last[0], last[1], 6, 0, TAU); c.fill();
      txt(c, 'TIEFE', L, H * 0.09, W * 0.024, C.t3, 'left');
      txt(c, fmt(cur, 1) + ' m', L, H * 0.155, W * 0.07, C.text, 'left', DISP, 600);
    },

    /* ---- AIS mit CPA ---- */
    ais: function (c, W, H, t) {
      var cx = W / 2, cy = H / 2, R = W * 0.42, k = R / 3; // 3 sm Radius
      c.strokeStyle = C.hair; c.lineWidth = 1;
      for (var r = 1; r <= 3; r++) { c.beginPath(); c.arc(cx, cy, k * r, 0, TAU); c.stroke(); txt(c, r + ' sm', cx + 6, cy - k * r + 14, W * 0.02, C.t3, 'left', BODY, 400); }
      c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
      // eigenes Schiff: Kurs 000, 6 kn
      var own = { vx: 0, vy: 6 };
      var cyc = 46, tt = t % cyc, T = tt / 60 * 0.9 + 0.02; // Stunden (gerafft)
      var targets = [
        { x: 2.4, y: 2.2, vx: -7.5, vy: -2.5, name: 'A' },
        { x: -2.2, y: -0.6, vx: 2.0, vy: 7.5, name: 'B' },
        { x: -1.0, y: 2.6, vx: 1.2, vy: 4.0, name: 'C' }
      ];
      function px(x, y) { return [cx + x * k, cy - y * k]; }
      var worst = null;
      targets.forEach(function (g) {
        var rx = g.x + (g.vx - own.vx) * T, ry = g.y + (g.vy - own.vy) * T; // relative Position
        var rvx = g.vx - own.vx, rvy = g.vy - own.vy, v2 = rvx * rvx + rvy * rvy;
        var tcpa = -(rx * rvx + ry * rvy) / v2, cxp = rx + rvx * tcpa, cyp = ry + rvy * tcpa, cpa = Math.sqrt(cxp * cxp + cyp * cyp);
        g.r = [rx, ry]; g.tcpa = tcpa; g.cpa = cpa; g.cp = [cxp, cyp];
        if (tcpa > 0 && (!worst || cpa < worst.cpa)) worst = g;
      });
      targets.forEach(function (g) {
        if (Math.hypot(g.r[0], g.r[1]) > 3.05) return;
        var p = px(g.r[0], g.r[1]), hot = g === worst && g.cpa < 0.5 && g.tcpa > 0, col = hot ? C.coral : C.t2;
        // Kursvektor (6 min)
        var e = px(g.r[0] + g.vx * 0.1, g.r[1] + g.vy * 0.1);
        c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(e[0], e[1]); c.stroke();
        var a = Math.atan2(-(g.vy), g.vx) + Math.PI / 2;
        c.save(); c.translate(p[0], p[1]); c.rotate(a); c.fillStyle = 'rgba(6,16,24,0.9)'; c.strokeStyle = col; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(0, -15); c.lineTo(9, 11); c.lineTo(-9, 11); c.closePath(); c.fill(); c.stroke(); c.restore();
        if (g === worst && g.tcpa > 0) {
          var q = px(g.cp[0], g.cp[1]);
          c.setLineDash([6, 7]); c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(q[0], q[1]); c.stroke(); c.setLineDash([]);
          c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fillStyle = col; c.fill();
        }
      });
      // eigenes Schiff
      c.fillStyle = C.text; c.beginPath(); c.moveTo(cx, cy - 16); c.lineTo(cx + 9, cy + 11); c.lineTo(cx - 9, cy + 11); c.closePath(); c.fill();
      c.strokeStyle = C.cyan; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy - 16); c.lineTo(cx, cy - 16 - 0.6 * k); c.stroke();
      if (worst) {
        var hot2 = worst.cpa < 0.5;
        txt(c, 'CPA ' + fmt(worst.cpa, 2) + ' sm', W * 0.06, H * 0.07, W * 0.034, hot2 ? C.coral : C.text, 'left', DISP, 600);
        txt(c, 'TCPA ' + Math.max(0, Math.round(worst.tcpa * 60)) + ' min', W * 0.06, H * 0.125, W * 0.028, C.t2, 'left');
      }
    },

    /* ---- Ankerkreis ---- */
    anchor: function (c, W, H, t) {
      var cx = W / 2, cy = H * 0.52, R = W * 0.34, scope = 30;
      c.strokeStyle = C.hair; c.lineWidth = 1;
      [0.33, 0.66].forEach(function (f) { c.beginPath(); c.arc(cx, cy, R * f, 0, TAU); c.stroke(); });
      c.fillStyle = 'rgba(100,217,255,0.05)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
      c.strokeStyle = C.cyan; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      function pos(s) { var a = 0.9 * Math.sin(s * 0.17) + 0.35 * Math.sin(s * 0.41 + 1) + 0.6, r = 0.62 + 0.14 * Math.sin(s * 0.29 + 2) + 0.05 * Math.sin(s * 1.3);
        return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r, a, r]; }
      c.lineWidth = 2; c.lineJoin = 'round';
      for (var i = 120; i > 0; i--) {
        var a0 = pos(t - i * 0.5), a1 = pos(t - (i - 1) * 0.5);
        c.strokeStyle = 'rgba(100,217,255,' + (0.5 * (1 - i / 120)) + ')'; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke();
      }
      var p = pos(t);
      c.setLineDash([4, 6]); c.strokeStyle = C.hair2; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(p[0], p[1]); c.stroke(); c.setLineDash([]);
      // Anker
      c.strokeStyle = C.text; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, 7, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(cx, cy + 7); c.lineTo(cx, cy + 22); c.moveTo(cx - 10, cy + 15); c.quadraticCurveTo(cx, cy + 28, cx + 10, cy + 15); c.stroke();
      // Boot (zeigt zum Anker)
      c.save(); c.translate(p[0], p[1]); c.rotate(p[2] - Math.PI / 2); c.fillStyle = C.text;
      c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(10, -4, 7, 14); c.lineTo(-7, 14); c.quadraticCurveTo(-10, -4, 0, -18); c.fill(); c.restore();
      var dist = p[3] * scope;
      txt(c, 'DISTANZ', W * 0.06, H * 0.07, W * 0.024, C.t3, 'left');
      txt(c, fmt(dist, 1) + ' m', W * 0.06, H * 0.13, W * 0.06, C.text, 'left', DISP, 600);
      txt(c, 'RADIUS ' + scope + ' m', W * 0.94, H * 0.07, W * 0.024, C.t3, 'right');
      txt(c, 'IM KREIS', W * 0.94, H * 0.125, W * 0.03, C.cyan, 'right', DISP, 600);
    },

    /* ---- Zwei Fahrten, eine Strecke (Idee) ---- */
    scans: function (c, W, H, t) {
      var L = W * 0.07, R = W * 0.95, T = H * 0.2, B = H * 0.86, maxD = 12;
      function y(d) { return T + (B - T) * d / maxD; }
      function a(x) { return 5 + 2.4 * Math.sin(x * 2.1) + 1.2 * Math.sin(x * 5.3 + 1) + 0.4 * Math.sin(x * 13); }
      function b(x) { return a(x) + 0.9 * Math.exp(-Math.pow((x - 1.9) * 2.2, 2)) - 0.7 * Math.exp(-Math.pow((x - 3.3) * 2.6, 2)); }
      c.strokeStyle = C.hair; c.lineWidth = 1;
      for (var d = 0; d <= maxD; d += 3) { c.beginPath(); c.moveTo(L, y(d)); c.lineTo(R, y(d)); c.stroke(); txt(c, d + ' m', L - 10, y(d), H * 0.036, C.t3, 'right', BODY, 400); }
      var n = 220, prog = Math.min(1, Math.max(0, (t % 1000) * 0.14));
      function path(fn, upto) { c.beginPath(); for (var i = 0; i <= n * upto; i++) { var x = i / n * 4.6, X = L + (R - L) * i / n; if (i) c.lineTo(X, y(fn(x))); else c.moveTo(X, y(fn(x))); } }
      // Differenzfläche
      c.fillStyle = 'rgba(230,200,135,0.16)'; c.beginPath();
      var m = Math.floor(n * prog);
      for (var i = 0; i <= m; i++) { c.lineTo(L + (R - L) * i / n, y(a(i / n * 4.6))); }
      for (var j = m; j >= 0; j--) { c.lineTo(L + (R - L) * j / n, y(b(j / n * 4.6))); }
      c.closePath(); c.fill();
      c.lineJoin = 'round';
      c.strokeStyle = C.t3; c.lineWidth = 2.5; c.setLineDash([2, 7]); c.lineCap = 'round'; path(a, 1); c.stroke(); c.setLineDash([]);
      c.strokeStyle = C.cyan; c.lineWidth = 3; path(b, prog); c.stroke();
      if (prog < 1) { var X = L + (R - L) * prog; c.strokeStyle = 'rgba(100,217,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(X, T - 8); c.lineTo(X, B); c.stroke(); }
      txt(c, 'FAHRT 1, FRÜHER', L, H * 0.09, H * 0.04, C.t3, 'left');
      txt(c, 'FAHRT 2, HEUTE', L + W * 0.3, H * 0.09, H * 0.04, C.cyan, 'left');
      txt(c, 'UNTERSCHIED', L + W * 0.58, H * 0.09, H * 0.04, C.gold, 'left');
    }
  };

  var RUN = 12;   // Sekunden Laufzeit je Grafik
  var items = [];
  [].forEach.call(document.querySelectorAll('canvas[data-viz]'), function (cv) {
    var fn = draw[cv.getAttribute('data-viz')]; if (!fn) return;
    var it = { cv: cv, ctx: cv.getContext('2d'), fn: fn, visible: false, t: 0, left: 0, seen: false };
    cv.title = 'Illustration mit Beispielwerten. Klicken, um sie erneut abzuspielen.';
    cv.addEventListener('click', function () { if (reduce.matches) return; it.t = 0; it.left = RUN; kick(); });
    items.push(it);
  });
  if (!items.length) return;

  function render(it) {
    var c = it.ctx, W = it.cv.width, H = it.cv.height;
    c.clearRect(0, 0, W, H); c.save(); it.fn(c, W, H, it.t); c.restore();
  }
  var running = false, last = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var any = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.visible && it.left > 0) { it.t += dt; it.left -= dt; render(it); any = true; }
    }
    if (any && !reduce.matches && !document.hidden) requestAnimationFrame(frame); else running = false;
  }
  function kick() { if (!running && !reduce.matches) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function stills() { items.forEach(function (it) { if (!it.seen || reduce.matches) { it.t = 9; render(it); } }); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { items.forEach(function (it) {
        if (it.cv !== e.target) return;
        it.visible = e.isIntersecting;
        if (e.isIntersecting && !it.seen && !reduce.matches) { it.seen = true; it.t = 0; it.left = RUN; }
      }); });
      kick();
    }, { threshold: 0.5 });
    items.forEach(function (it) { io.observe(it.cv); });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(stills); else stills();
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) stills(); });
})();
