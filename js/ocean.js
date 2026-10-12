/* seaFOX – WebGL-Ebene: bathymetrisches Konturfeld, Kaustik, Sonar-Ping, Tiefenverlauf.
   Handgeschrieben, ohne Bibliothek. Die Ebene bewegt sich nur im Hero und während eines Pings;
   im Lesebereich steht sie still und folgt nur der Scrolltiefe. Pausiert bei verborgenem Tab;
   bei „Bewegung reduzieren“ wird genau ein Standbild gezeichnet. Ohne WebGL greift der CSS-Verlauf. */
(function () {
  'use strict';
  var canvas = document.getElementById('ocean');
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var api = { ping: function () {}, ok: false };
  window.seafoxOcean = api;
  if (!canvas) return;

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) { gl = null; }
  if (!gl) { root.classList.add('no-webgl'); return; }
  var deriv = gl.getExtension('OES_standard_derivatives');

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    deriv ? '#extension GL_OES_standard_derivatives : enable' : '',
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform float uScroll;uniform float uTop;uniform vec2 uPtr;',
    'uniform vec3 uPing;',                       // x,y (0..1, Ursprung unten links), Alter in s
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return s;}',
    // Kaustik: überlagerte, verzerrte Sinusbänder
    'float caustic(vec2 p,float t){vec2 q=p;float c=0.;for(int i=0;i<3;i++){float fi=float(i);',
    ' q+=vec2(sin(q.y*1.7+t*.6+fi*1.3),cos(q.x*1.9-t*.5+fi*2.1))*.35;c+=1./(.35+abs(sin(q.x*3.1+fi)+cos(q.y*2.7-fi)));}',
    ' return pow(c/3.,3.)*.06;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;',
    ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' vec2 q=p*.85+vec2(0.,-uScroll*1.4);',                      // Feld wandert mit der Scrolltiefe
    ' float breathe=.022*sin(uTime*.35)+.015*sin(uTime*.23+q.x*2.);',
    ' float h=fbm(q+vec2(uTime*.006,0.))+breathe;',
    ' float lv=h*24.;',
    deriv ? ' float w=fwidth(lv)*.75;' : ' float w=.06;',
    ' float f=abs(fract(lv)-.5);',
    ' float line=1.-smoothstep(0.,w,f);',
    ' float f5=abs(fract(lv/5.)-.5)*5.;',
    ' float major=1.-smoothstep(0.,w*1.5,f5);',
    // Tiefe: nimmt mit dem Scrollen zu; Farbrampe Aqua -> Abgrund
    ' float depth=clamp(uScroll*.95+(.55-h)*.5+(1.-uv.y)*.12,0.,1.);',
    ' vec3 shallow=vec3(.051,.227,.290);vec3 mid=vec3(.039,.110,.165);vec3 deep=vec3(.016,.047,.094);',
    ' vec3 col=mix(shallow,mid,smoothstep(0.,.45,depth));col=mix(col,deep,smoothstep(.4,1.,depth));',
    ' float ca=caustic(q*3.+h*2.,uTime)*(1.-uTop);',
    ' col+=vec3(.30,.70,.85)*ca*.45;',
    ' vec3 cy=vec3(.392,.851,1.);',
    ' float la=line*.045+major*.10;',
    // Sonar-Ping: Ring läuft vom Ursprung nach außen und hebt die Konturen an
    ' vec2 pp=(uPing.xy*uRes-.5*uRes)/uRes.y;float d=length(p-pp);float r=uPing.z*.55;',
    ' float ring=exp(-pow((d-r)*9.,2.))*exp(-uPing.z*.9)*step(0.,uPing.z);',
    ' la+=ring*(.45*line+.7*major+.06);',
    ' col=mix(col,cy,clamp(la,0.,1.));',
        ' float v=1.-.55*dot(uv-.5,uv-.5)*2.;col*=v;',
    ' col+=(hash(gl_FragCoord.xy+fract(uTime)*91.7)-.5)*.022;',     // Korn im Shader
    // oben (über dem Hero-Video) durchscheinend, weiter unten deckend
    ' float a=mix(.0,1.,smoothstep(0.,1.,uTop));',
    ' float lineA=clamp(la*2.2+ca*1.5,0.,1.);',
    ' float alpha=mix(lineA*.9,1.,a);',
    ' gl_FragColor=vec4(col*alpha,alpha);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s) || 'shader'); }
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch (e) {
    root.classList.add('no-webgl');
    if (window.console) console.warn('seaFOX: WebGL-Ebene deaktiviert –', e.message);
    return;
  }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uTime', 'uScroll', 'uTop', 'uPtr', 'uPing'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.disable(gl.DEPTH_TEST);

  var state = { w: 0, h: 0, scroll: 0, top: 0, px: 0, py: 0, tx: 0, ty: 0, ping: [0.5, 0.5, -1], pingStart: 0, t0: performance.now(), running: false, raf: 0 };

  function resize() {
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    // interne Auflösung begrenzen: reicht für weiche Konturen und hält 60 fps auf Mittelklasse-Laptops
    var scale = Math.min(1, 1500 / Math.max(cw, 1)) * Math.min(window.devicePixelRatio || 1, 1.5);
    if (root.classList.contains('capture')) scale = Math.min(1, 1600 / Math.max(cw, 1));
    var w = Math.max(2, Math.round(cw * scale)), h = Math.max(2, Math.round(ch * scale));
    if (h > 4096) { w = Math.round(w * 4096 / h); h = 4096; }
    if (w !== state.w || h !== state.h) { canvas.width = state.w = w; canvas.height = state.h = h; gl.viewport(0, 0, w, h); }
  }
  function measure() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var y = window.scrollY || window.pageYOffset || 0;
    state.scroll = Math.min(1, Math.max(0, y / max));
    state.top = Math.min(1, y / Math.max(1, window.innerHeight * 0.9));
    if (root.classList.contains('capture-full') || root.classList.contains('capture-only')) { state.scroll = 0.3; state.top = /(only|half)=hero/.test(location.search) ? 0 : 1; }
  }
  function draw(now) {
    var t = (now - state.t0) / 1000;
    state.px += (state.tx - state.px) * 0.06; state.py += (state.ty - state.py) * 0.06;
    gl.uniform2f(U.uRes, state.w, state.h);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uScroll, state.scroll);
    gl.uniform1f(U.uTop, state.top);
    gl.uniform2f(U.uPtr, state.px, state.py);
    gl.uniform3f(U.uPing, state.ping[0], state.ping[1], state.ping[2] < 0 ? -1 : (now - state.pingStart) / 1000);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function active(now) {            // bewegt wird nur im Hero oder solange ein Ping läuft
    return state.top < 1 || (state.ping[2] >= 0 && now - state.pingStart < 3200);
  }
  function loop(now) {
    if (!state.running) return;
    draw(now);
    if (active(now)) state.raf = requestAnimationFrame(loop); else state.running = false;
  }
  function start() { if (state.running || reduce.matches || document.hidden) return; state.running = true; state.raf = requestAnimationFrame(loop); }
  function stop() { state.running = false; cancelAnimationFrame(state.raf); }
  function still() { resize(); measure(); draw(state.t0 + 4000); }

  window.addEventListener('resize', function () { resize(); if (!state.running) still(); }, { passive: true });
  var sp = false;
  window.addEventListener('scroll', function () {
    measure();
    if (state.running || sp) return;
    if (reduce.matches) return;                       // Standbild bleibt stehen
    if (state.top < 1 && !root.classList.contains('capture')) { start(); return; }
    sp = true; requestAnimationFrame(function (now) { sp = false; draw(now); });   // unterhalb des Heros: ein Bild je Scrollschritt
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  var onReduce = function () { if (reduce.matches) { stop(); still(); } else start(); };
  if (reduce.addEventListener) reduce.addEventListener('change', onReduce); else if (reduce.addListener) reduce.addListener(onReduce);
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); root.classList.add('no-webgl'); });

  api.ok = true;
  api.ping = function (clientX, clientY) {
    if (reduce.matches) return;
    state.ping = [clientX / window.innerWidth, 1 - clientY / window.innerHeight, 0];
    state.pingStart = performance.now();
    start();
  };
  api.still = still;

  resize(); measure();
  if (reduce.matches || root.classList.contains('capture')) still(); else start();
})();
