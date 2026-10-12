/* seaFOX v2 — scroll-driven staging.
   A  enhance: turn each .scene (static figures) into one sticky stage with ONE rigid tablet
   B  timeline: device pose (3D), screenshot cross-fades, 90° turn for portrait captures, glass light
   C  hero + mood parallax, video play/pause, field uniforms
   D  reveals, nav
   Without this file, or with prefers-reduced-motion, the static composition from the HTML stays. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var field = window.seaField || { set: function () {} };

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var hero = document.querySelector('.hero');
  var heroVideo = document.getElementById('heroVideo');
  var bar = document.querySelector('.bar');

  if (reduce) {
    if (heroVideo) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    field.set({ scroll: 2, sweep: 0, ring: 0 });
    return;                                   // static composition
  }
  doc.classList.add('js');

  /* ───── A  build stages ───── */
  var STEP_VH = 0.9;                          // scroll length per step, in viewport heights
  var scenes = $$('.scene').map(function (el) {
    var head = el.querySelector('.scene__head');
    var list = el.querySelector('.steps');
    var note = el.querySelector('.note');
    var steps = $$('.step', list);

    var stage = document.createElement('div'); stage.className = 'stage';
    var text = document.createElement('div'); text.className = 'stage__text';
    var slot = document.createElement('div'); slot.className = 'stage__slot';
    var rig = document.createElement('div'); rig.className = 'rig';
    var shadow = document.createElement('div'); shadow.className = 'device__shadow';
    var device = document.createElement('div'); device.className = 'device';
    var screen = document.createElement('div'); screen.className = 'device__screen';
    var glare = document.createElement('div'); glare.className = 'device__glare';
    var cap = document.createElement('p'); cap.className = 'cap stage__cap';
    var gauge = document.createElement('span'); gauge.className = 'gauge';

    var shots = steps.map(function (li) {
      var fig = li.querySelector('figure');
      var img = fig.querySelector('img');
      var portrait = li.getAttribute('data-o') === 'p';
      img.removeAttribute('loading');
      if (portrait) img.classList.add('p');
      screen.appendChild(img);
      var caption = fig.querySelector('figcaption').textContent;
      fig.parentNode.removeChild(fig);
      return { li: li, img: img, portrait: portrait, caption: caption, a: -1 };
    });
    screen.appendChild(glare);
    device.appendChild(screen);
    rig.appendChild(shadow); rig.appendChild(device);
    slot.appendChild(rig); slot.appendChild(cap);
    head.classList.add('stage__head');
    text.appendChild(head); list.appendChild(gauge); text.appendChild(list);
    stage.appendChild(text); stage.appendChild(slot);
    var track = document.createElement('div'); track.className = 'track';
    track.appendChild(stage);
    el.insertBefore(track, note || null);
    el.classList.add('scene--live');

    return {
      el: el, track: track, stage: stage, slot: slot, rig: rig, device: device, glare: glare, cap: cap, gauge: gauge, shadow: shadow,
      shots: shots, n: shots.length, hasP: shots.some(function (s) { return s.portrait; }),
      enter: el.getAttribute('data-enter') || 'right', fieldMode: el.getAttribute('data-field') || '',
      active: -1, near: false, pose: null, W: 0, sL: 1, sP: 1, top: 0, height: 0
    };
  });

  var vw = 0, vh = 0;
  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    scenes.forEach(function (s) {
      // one viewport pinned + scroll length for the steps
      s.track.style.height = Math.round(s.stage.offsetHeight + vh * STEP_VH * s.n) + 'px';
      var w = s.slot.clientWidth, h = s.slot.clientHeight - 34;   // caption line below
      var AR = 1 / 0.64;                                        // outer frame w/h
      var wl = Math.min(w * .97, h * AR);
      var wp = s.hasP ? Math.min(h, w * AR) : 0;                   // turned: frame width becomes height
      s.W = Math.round(Math.max(wl, wp));
      s.sL = wl / s.W; s.sP = wp ? wp / s.W : 1;
      s.rig.style.setProperty('--w', s.W + 'px');
      s.compact = vw < 1100;
    });
  }

  /* ───── B  timeline ───── */
  function sceneTarget(s, rect) {
    var span = vh * STEP_VH * s.n;
    var e = clamp(1 - rect.top / vh, 0, 1);                 // 0: scene below the fold · 1: pinned
    var t = clamp(-rect.top / span, 0, 1);                  // progress while pinned
    var x = clamp((-rect.top - span) / (vh * .9), 0, 1);    // leaving

    var f = t * s.n, i = Math.min(s.n - 1, Math.floor(f)), frac = f - i;
    var k = i < s.n - 1 ? smooth(.72, 1, frac) : 0;         // transition to next capture
    var a = s.shots[i], b = s.shots[Math.min(s.n - 1, i + 1)];
    var turn = a.portrait !== b.portrait;
    var o = lerp(a.portrait ? 1 : 0, b.portrait ? 1 : 0, k);

    for (var j = 0; j < s.n; j++) {
      var al = 0;
      // a turn behaves like a real tablet: the old layout rides along, then the new one takes over
      if (j === i) al = turn ? 1 - smooth(.74, .93, k) : 1;
      else if (j === i + 1) al = turn ? smooth(.7, .93, k) : smooth(0, 1, k);
      if (!turn && j === i && k >= 1) al = 0;
      var sh = s.shots[j];
      if (Math.abs(al - sh.a) > .004) { sh.a = al; sh.img.style.opacity = al.toFixed(3); }
    }
    var act = k > .5 ? i + 1 : i;
    if (act !== s.active) {
      s.active = act;
      s.shots.forEach(function (sh, j) { sh.li.classList.toggle('on', j === act); });
      s.cap.textContent = s.shots[act].caption;
    }
    s.gauge.style.transform = 'scaleY(' + clamp((f + .15) / s.n, 0, 1).toFixed(4) + ')';

    var dir = s.enter === 'left' ? -1 : 1;
    var ee = easeOut(smooth(0, 1, e));
    var amp = s.compact ? .7 : 1;
    var p = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sc: 1, op: 1, gl: 0 };
    // arrival: out of the depth, tilted, settling
    if (s.enter === 'below') { p.rx = 52 * (1 - ee); p.ry = -6 * (1 - ee); p.y = vh * .34 * (1 - ee); }
    else { p.ry = dir * -46 * (1 - ee) * amp; p.rx = 16 * (1 - ee); p.x = dir * vw * .16 * (1 - ee); p.y = vh * .14 * (1 - ee); }
    p.z = -520 * (1 - ee);
    p.op = smooth(.08, .5, e);
    // pinned: slow continuous swing, a nod at every capture change
    var nod = Math.sin(Math.PI * k);
    p.ry += dir * lerp(-7, 6, t) * amp + dir * nod * 4;
    p.rx += lerp(4, -2, t) + nod * (turn ? 6 : 2.5);
    p.z += -nod * (turn ? 430 : 40);
    p.rz = -90 * o;
    p.sc = lerp(s.sL, s.sP, o);
    // leaving: tips away upwards
    var xx = x * x;
    p.rx += -34 * xx; p.z += -260 * xx; p.y += -vh * .05 * xx;
    p.gl = (e * .5 + t + x * .4) * 1.5 - 1.1 + nod * .3;    // light travels across the glass
    return p;
  }

  function applyPose(s, p) {
    s.rig.style.transform =
      'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,' + p.z.toFixed(1) + 'px) ' +
      'rotateX(' + p.rx.toFixed(2) + 'deg) rotateY(' + p.ry.toFixed(2) + 'deg) rotateZ(' + p.rz.toFixed(2) + 'deg) ' +
      'scale(' + p.sc.toFixed(4) + ')';
    s.rig.style.opacity = p.op.toFixed(3);
    s.glare.style.transform = 'translate3d(' + (p.gl * 42).toFixed(2) + '%,0,0)';
  }

  /* ───── C  hero, moods, field ───── */
  var heroMedia = hero && hero.querySelector('.hero__media');
  var heroCopy = hero && hero.querySelector('.hero__copy');
  var moods = $$('.mood').map(function (el) {
    return { el: el, media: el.querySelector('.mood__media'), video: el.querySelector('video'), copy: el.querySelector('.mood__copy'), playing: false };
  });
  var plain = $$('.plain');

  var running = false, lastY = -1, lastT = 0, settle = 0, dirDown = false;

  function tick(now) {
    running = false;
    var y = window.pageYOffset;
    var dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    var moving = false;

    // hero: picture drifts slower than the page, copy lifts away
    if (hero && y < vh * 1.1) {
      var hp = clamp(y / vh, 0, 1);
      heroMedia.style.transform = 'translate3d(0,' + (hp * vh * .22).toFixed(1) + 'px,0) scale(' + (1 + hp * .06).toFixed(4) + ')';
      heroCopy.style.transform = 'translate3d(0,' + (-hp * 70).toFixed(1) + 'px,0)';
      heroCopy.style.opacity = (1 - smooth(.15, .6, hp)).toFixed(3);
    }
    if (heroVideo) {
      var want = y < vh * .95 && !document.hidden;
      if (want && heroVideo.paused) { var pr = heroVideo.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else if (!want && !heroVideo.paused) heroVideo.pause();
    }

    // device scenes
    var sweep = 0, ring = 0, fx = .5, fy = .5, calm = 0;
    scenes.forEach(function (s) {
      var rect = s.track.getBoundingClientRect();
      var span = vh * STEP_VH * s.n;
      var near = rect.top < vh * 1.15 && rect.top > -(span + vh * 1.1);
      if (!near) { if (s.near) { s.near = false; s.rig.style.visibility = 'hidden'; } return; }
      if (!s.near) { s.near = true; s.rig.style.visibility = ''; s.pose = null; }
      var tg = sceneTarget(s, rect);
      if (!s.pose) s.pose = tg;
      else {
        var kf = 1 - Math.pow(.0009, dt);       // critically soft follow: inertia without lag
        for (var key in tg) {
          var d = tg[key] - s.pose[key];
          if (Math.abs(d) > (key === 'sc' || key === 'op' || key === 'gl' ? .0005 : .02)) { s.pose[key] += d * kf; moving = true; }
          else s.pose[key] = tg[key];
        }
      }
      applyPose(s, s.pose);
      // which chapter owns the field right now
      var own = smooth(vh * .9, vh * .2, rect.top) * (1 - smooth(span - vh * .1, span + vh * .6, -rect.top));
      if (own > 0) {
        var sr = s.slot.getBoundingClientRect();
        if (s.fieldMode === 'sweep') { sweep = own; fx = (sr.left + sr.width / 2) / vw; fy = (sr.top + sr.height / 2) / vh; }
        if (s.fieldMode === 'ring') { ring = own; fx = (sr.left + sr.width / 2) / vw; fy = (sr.top + sr.height / 2) / vh; }
      }
    });

    // moods: media settles as the panel takes the screen; video only while visible
    var covered = false;
    moods.forEach(function (m) {
      var r = m.el.getBoundingClientRect();
      var vis = r.top < vh && r.bottom > 0;
      if (vis) {
        var mp = clamp(r.top / vh, 0, 1);                       // 1 → entering from below, 0 → pinned
        m.media.style.transform = 'translate3d(0,' + (-mp * vh * .09).toFixed(1) + 'px,0) scale(' + (1.02 + mp * .08).toFixed(4) + ')';
        m.copy.style.transform = 'translate3d(0,' + (mp * 60).toFixed(1) + 'px,0)';
        m.copy.style.opacity = (1 - smooth(.25, .8, mp)).toFixed(3);
        if (r.top <= 1 && r.bottom >= vh - 1) covered = true;
      }
      if (m.video) {
        var play = vis && r.top < vh * .8 && !document.hidden;
        if (play && !m.playing) { m.playing = true; var q = m.video.play(); if (q && q.catch) q.catch(function () { m.playing = false; }); }
        else if (!play && m.playing) { m.playing = false; m.video.pause(); }
      }
    });
    plain.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh * .7 && r.bottom > vh * .3) calm = 1; });

    field.set({ scroll: y / Math.max(1, vh), sweep: sweep, ring: ring, fx: fx, fy: fy, calm: calm, visible: !(covered || y < 4) });

    // top bar: steps aside while reading down, returns on the way up
    if (y !== lastY) {
      dirDown = y > lastY;
      bar.classList.toggle('away', dirDown && y > vh * .6);
      lastY = y; settle = 0;
    } else settle++;
    if (moving || settle < 3) request();
  }
  function request() { if (!running) { running = true; requestAnimationFrame(tick); } }

  /* ───── D  reveals, nav ───── */
  function splitLines(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    var spans = words.map(function (w, i) {
      var s = document.createElement('span'); s.textContent = w + (i < words.length - 1 ? ' ' : ''); s.style.display = 'inline-block'; s.style.whiteSpace = 'pre';
      el.appendChild(s); return s;
    });
    var lines = [], top = null;
    spans.forEach(function (s) { if (top === null || Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; } lines[lines.length - 1].push(s.textContent); });
    el.textContent = '';
    lines.forEach(function (l, i) {
      var o = document.createElement('span'); o.className = 'ln'; o.setAttribute('aria-hidden', 'true');
      var inn = document.createElement('span'); inn.textContent = l.join(''); inn.style.setProperty('--d', (i * .09) + 's');
      o.appendChild(inn); el.appendChild(o);
    });
    return lines.length;
  }
  function restore(el) { var t = el.getAttribute('aria-label'); if (t) { el.textContent = t; el.removeAttribute('aria-label'); } }

  function setupReveals() {
    var groups = [];
    $$('.stage__head, .moods__head, .plain__grid, .hero__copy').forEach(function (g) {
      var h = g.querySelector('h1, h2');
      var rest = $$('.lede, .statement, .facts > div, .btn, .note, p', g).filter(function (n) { var nt = n.closest('.note'); return n !== h && (!nt || nt === n); });
      var n = h ? splitLines(h) : 0;
      rest.forEach(function (r, i) { r.classList.add('rv'); r.style.setProperty('--d', (n * .09 + .12 + i * .08) + 's'); });
      groups.push({ el: g, h: h });
    });
    scenes.forEach(function (s) {
      [s.stage.querySelector('.steps'), s.cap].forEach(function (r) { r.classList.add('rv'); r.style.setProperty('--d', '.4s'); });
    });
    if (!('IntersectionObserver' in window)) { groups.forEach(show); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        groups.forEach(function (g) { if (g.el === en.target) show(g); });
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .01 });
    groups.forEach(function (g) { io.observe(g.el); });
    function show(g) {
      g.el.classList.add('in');
      var scope = g.el.closest('.stage') || g.el;
      $$('.rv', scope).forEach(function (r) { r.classList.add('in'); });
      if (g.h) setTimeout(function () { restore(g.h); }, 2200);   // back to plain text, safe for resize
    }
  }

  function setupNav() {
    var links = $$('.bar nav a');
    var map = links.map(function (a) { return { a: a, el: document.querySelector(a.getAttribute('href')) }; }).filter(function (m) { return m.el; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) map.forEach(function (m) { m.a.classList.toggle('on', m.el === en.target); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach(function (m) { io.observe(m.el); });
  }

  measure();
  scenes.forEach(function (s) { s.shots.forEach(function (sh) { if (sh.img.decode) sh.img.decode().catch(function () {}); }); });
  setupReveals();
  setupNav();
  // anchors resolved before the stages existed: re-apply once the layout is final
  if (location.hash) { var tEl = document.querySelector(location.hash); if (tEl) tEl.scrollIntoView(); }
  request();
  window.addEventListener('scroll', request, { passive: true });
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { measure(); scenes.forEach(function (s) { s.pose = null; }); request(); }, 120); });
  window.addEventListener('load', function () { measure(); request(); });
  document.addEventListener('visibilitychange', request);
})();
