(function () {
  'use strict';
  var image = document.getElementById('chart-capture');
  var chartButtons = Array.from(document.querySelectorAll('[data-chart-mode]'));
  var chartCaptures = {
    day: { src: 'v2/assets/screens/87.webp', alt: 'ENC-Kartenaufnahme in Tagfarben mit Tiefenflächen, Lotungen und Seezeichen; Entwicklungsstand Oktober 2026, ohne Bootsdaten.' },
    night: { src: 'v2/assets/screens/90.webp', alt: 'ENC-Kartenaufnahme derselben NOAA-Zelle in Nachtfarben; Entwicklungsstand Oktober 2026, ohne Bootsdaten.' }
  };
  chartButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var capture = chartCaptures[button.dataset.chartMode];
      if (!capture || !image) return;
      chartButtons.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      image.src = capture.src;
      image.alt = capture.alt;
    });
  });
  var video = document.getElementById('hero-film');
  if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.connection && navigator.connection.saveData) return;
  var started = false;
  function setPlayback(visible) {
    if (visible && !document.hidden) {
      if (!started) {
        video.querySelectorAll('source[data-src]').forEach(function (source) { source.src = source.dataset.src; });
        video.load();
        started = true;
      }
      var playback = video.play();
      if (playback && playback.catch) playback.catch(function () {});
    } else video.pause();
  }
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; setPlayback(visible); }, { threshold: 0.05 }).observe(video.closest('.hero'));
  } else setPlayback(true);
  document.addEventListener('visibilitychange', function () { setPlayback(visible); });
})();
