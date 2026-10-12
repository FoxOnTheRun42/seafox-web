/* seaFOX v2 — Lotkarte: one fixed WebGL field of depth contours behind the page.
   Uniforms are driven by scroll (site.js): depth offset, bearing sweep (Sensorik), anchor ring (Sicherheit).
   Illustration only, no measured data. Pauses when hidden; one still frame under reduced motion. */
(function () {
  'use strict';
  var canvas = document.getElementById('field');
  var api = { ok: false, set: function () {}, wake: function () {} };
  window.seaField = api;
  if (!canvas) return;

  var gl = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) }); } catch (e) {}
  if (!gl || !gl.getExtension('OES_standard_derivatives')) { canvas.style.display = 'none'; return; }

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;',
    'uniform vec2 uRes; uniform float uT, uScroll, uSweep, uRing, uCalm; uniform vec2 uFocus;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p+7.1;a*=.5;}return v;}',
    'float iso(float f,float w){float d=abs(fract(f-.5)-.5)/max(fwidth(f),1e-5);return 1.-smoothstep(w-.6,w+.6,d);}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y;',
    '  vec2 p=vec2((uv.x-.5)*asp,uv.y-.5);',
    '  vec2 q=p*1.15+vec2(.0,-uScroll*.22);',
    '  q+=.06*vec2(sin(uT*.05+q.y*1.3),cos(uT*.04+q.x*1.1));',
    '  float h=fbm(q+vec2(3.7,1.9));',
    '  float minor=iso(h*22.,.75), major=iso(h*4.4,1.05);',
    '  float depth=clamp(uScroll*.06,0.,1.);',
    '  vec3 deep=mix(vec3(.016,.036,.052),vec3(.008,.02,.03),depth);',
    '  vec3 col=deep+vec3(.0,.022,.032)*smoothstep(.35,.8,h);',
    // slow light from above, like sun through water
    '  float ca=fbm(p*2.4+vec2(uT*.03,-uT*.02)+h); col+=vec3(.012,.03,.04)*smoothstep(.5,.85,ca)*(1.-depth*.6);',
    '  vec3 ink=vec3(.39,.85,1.);',
    '  float la=minor*.06+major*.13;',
    // bearing sweep: lights the contours it passes, afterglow behind it
    '  vec2 d=vec2((uv.x-uFocus.x)*asp,uv.y-uFocus.y); float r=length(d);',
    '  float ang=atan(d.y,d.x)/6.2831853;',
    '  float beam=fract(ang+uT*.07); float glow=pow(beam,7.);',
    '  float reach=smoothstep(1.25,.1,r);',
    '  la+=uSweep*reach*glow*(minor*.36+major*.42);',
    '  col+=ink*uSweep*reach*(glow*.035+pow(beam,90.)*.22);',
    '  float rings=iso(r*5.,.7)*smoothstep(1.1,.2,r); col+=ink*uSweep*rings*.05;',
    // anchor ring: swing circle and a boat riding on its chain
    '  float R=.36; float ring=1.-smoothstep(.0,1.5,abs(r-R)/max(fwidth(r),1e-5));',
    '  float th=1.5708+.75*sin(uT*.17)+.12*sin(uT*.53); vec2 b=R*.82*vec2(cos(th),sin(th));',
    '  vec2 pa=d, ba=b; float hh=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); float dl=length(pa-ba*hh);',
    '  float chain=1.-smoothstep(.0,1.4,dl/max(fwidth(dl),1e-5));',
    '  float boat=1.-smoothstep(.006,.009,length(d-b));',
    '  float dash=step(.5,fract(ang*72.));',
    '  col+=ink*uRing*(ring*dash*.34+chain*.13+boat*.8);',
    '  col+=ink*la*(1.-uCalm*.55);',
    '  float vig=smoothstep(1.25,.25,length(p*vec2(.9,1.15))); col*=mix(.55,1.,vig);',
    '  col+=(hash(gl_FragCoord.xy+uT)-.5)*.012;',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch (e) { canvas.style.display = 'none'; return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uT', 'uScroll', 'uSweep', 'uRing', 'uCalm', 'uFocus'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var quality = 1, slow = 0;
  var target = { scroll: 0, sweep: 0, ring: 0, calm: 0, fx: .5, fy: .5, visible: true };
  var cur = { scroll: 0, sweep: 0, ring: 0, calm: 0, fx: .5, fy: .5 };
  var raf = 0, last = 0, t = 0, idle = true;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    var w = Math.max(2, Math.round(canvas.clientWidth * dpr)), h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  function draw() {
    resize();
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uScroll, cur.scroll);
    gl.uniform1f(U.uSweep, cur.sweep);
    gl.uniform1f(U.uRing, cur.ring);
    gl.uniform1f(U.uCalm, cur.calm);
    gl.uniform2f(U.uFocus, cur.fx, 1 - cur.fy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(now) {
    raf = 0;
    var dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (dt > .028) { if (++slow > 50 && quality > .7) { quality -= .15; slow = 0; } } else if (slow > 0) slow--;
    t += dt;
    var k = 1 - Math.pow(.0015, dt);
    cur.scroll += (target.scroll - cur.scroll) * Math.min(1, k * 1.6);
    cur.sweep += (target.sweep - cur.sweep) * k * .6;
    cur.ring += (target.ring - cur.ring) * k * .6;
    cur.calm += (target.calm - cur.calm) * k;
    cur.fx += (target.fx - cur.fx) * k; cur.fy += (target.fy - cur.fy) * k;
    draw();
    schedule();
  }
  function schedule() {
    if (raf) return;
    if (document.hidden || !target.visible || reduce.matches) { idle = true; return; }
    if (idle) { last = performance.now(); idle = false; }
    raf = requestAnimationFrame(frame);
  }
  function still() {            // reduced motion: a single composed frame
    for (var k in cur) cur[k] = target[k];
    t = 12; draw();
  }

  api.ok = true;
  api.set = function (o) {
    for (var k in o) target[k] = o[k];
    if (reduce.matches) still(); else schedule();
  };
  api.wake = schedule;
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('resize', function () { if (reduce.matches) still(); else schedule(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); canvas.classList.remove('on'); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) still(); else schedule(); });

  canvas.classList.add('on');
  if (reduce.matches) still(); else schedule();
})();
