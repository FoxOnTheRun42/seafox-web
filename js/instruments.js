/* Browser-only instrument illustration. Example readings; never connects to vessel data. */
(function () {
  'use strict';

  var hosts = document.querySelectorAll('[data-instrument-preview]');
  var themeNames = { day: 'Tag', night: 'Nacht', red: 'Rotlicht' };
  var stateNames = { live: 'Live-Darstellung', stale: 'Veraltet · 42 s', missing: 'Keine Daten' };

  function reading(value, unit) {
    return '<span data-example-value="' + value + '">' + value + '</span>' +
      (unit ? '<span class="ip-unit" data-example-unit>' + unit + '</span>' : '');
  }

  function secondary(label, value, unit) {
    return '<div><dt>' + label + '</dt><dd>' + reading(value, unit) + '</dd></div>';
  }

  function dial() {
    var ticks = '';
    for (var d = 0; d < 360; d += 30) {
      var r = (d - 90) * Math.PI / 180;
      var inner = d % 90 === 0 ? 57 : 61;
      ticks += '<path d="M' + (75 + Math.cos(r) * inner).toFixed(2) + ' ' + (75 + Math.sin(r) * inner).toFixed(2) +
        'L' + (75 + Math.cos(r) * 67).toFixed(2) + ' ' + (75 + Math.sin(r) * 67).toFixed(2) + '"/>';
    }
    return '<svg class="ip-dial" viewBox="0 0 150 150" aria-hidden="true">' +
      '<circle class="ip-dial-rim" cx="75" cy="75" r="64"/>' +
      '<g class="ip-dial-ticks">' + ticks + '</g>' +
      '<path class="ip-port" d="M29.75 29.75A64 64 0 0 1 75 11"/>' +
      '<path class="ip-starboard" d="M75 11A64 64 0 0 1 120.25 29.75"/>' +
      '<path class="ip-boat" d="M75 56C69 64 68 76 69 89L81 89C82 76 81 64 75 56Z"/>' +
      '<path class="ip-needle" transform="rotate(38 75 75)" d="M75 15L70 39L75 34L80 39Z"/>' +
      '</svg>';
  }

  function tileHead(title, status, charging) {
    return '<div class="ip-tile-head"><h4>' + title + '</h4>' +
      '<span class="ip-status' + (charging ? ' ip-charging' : '') + '" data-example-status' +
      (charging ? ' data-default-status="Lädt"' : '') + '>' + status + '</span></div>';
  }

  hosts.forEach(function (host, index) {
    if (host.classList.contains('instrument-preview')) return;
    var stateId = 'instrument-state-' + index;
    host.classList.add('instrument-preview');
    host.setAttribute('data-preview-theme', 'night');
    host.setAttribute('data-preview-state', 'live');
    host.innerHTML =
      '<div class="ip-toolbar">' +
        '<div><h3>Instrumente ausprobieren</h3><p class="ip-label">Illustration mit Beispielwerten</p></div>' +
        '<div class="ip-controls">' +
          '<fieldset class="ip-themes"><legend>Darstellung</legend><div class="ip-switch">' +
            '<button type="button" data-preview-mode="day" aria-pressed="false">Tag</button>' +
            '<button type="button" data-preview-mode="night" aria-pressed="true">Nacht</button>' +
            '<button type="button" data-preview-mode="red" aria-pressed="false">Rotlicht</button>' +
          '</div></fieldset>' +
          '<div class="ip-state-control"><label class="ip-state-label" for="' + stateId + '">Datenzustand</label>' +
            '<select id="' + stateId + '" data-preview-state-select>' +
              '<option value="live">Live (Beispiel)</option><option value="stale">Veraltet</option><option value="missing">Keine Daten</option>' +
            '</select></div>' +
        '</div>' +
      '</div>' +
      '<div class="ip-board">' +
        '<div class="ip-tile">' + tileHead('Batterie', 'Lädt', true) +
          '<div class="ip-primary"><p class="ip-reading">' + reading('78', '%') + '</p></div>' +
          '<div class="ip-bar" aria-hidden="true"><span></span></div>' +
          '<dl class="ip-secondary-values">' + secondary('Leistung', '+142', 'W') + secondary('Spannung', '13,4', 'V') + secondary('Δ Zelle', '8', 'mV') + '</dl>' +
          '<p class="ip-reason" data-empty-reason="Kein Batteriesensor meldet einen Ladezustand."></p>' +
        '</div>' +
        '<div class="ip-tile">' + tileHead('Temperatur', 'Live-Darstellung') +
          '<div class="ip-sensors"><div class="ip-sensor-heading"><span>Sensor</span><span data-example-unit>°C</span></div>' +
            '<dl>' +
              '<div class="ip-sensor-row"><dt>Wasser</dt><dd>' + reading('18,6', '') + '</dd></div>' +
              '<div class="ip-sensor-row"><dt>Kabine</dt><dd>' + reading('22,4', '') + '</dd></div>' +
              '<div class="ip-sensor-row"><dt>Motorraum</dt><dd>' + reading('34,2', '') + '</dd></div>' +
            '</dl>' +
          '</div><p class="ip-reason" data-empty-reason="Kein Temperatursensor meldet einen Wert."></p>' +
        '</div>' +
        '<div class="ip-tile">' + tileHead('Tiefe', 'Live-Darstellung') +
          '<div class="ip-primary"><p class="ip-reading">' + reading('8,4', 'm') + '</p></div>' +
          '<svg class="ip-trace" viewBox="0 0 300 38" preserveAspectRatio="none" aria-hidden="true">' +
            '<path class="ip-baseline" d="M0 30H300"/><path class="ip-trace-line" d="M0 8L15 9L30 8L45 11L60 14L75 13L90 17L105 18L120 16L135 20L150 19L165 21L180 20L195 24L210 23L225 22L240 25L255 23L270 24L285 22L300 23"/>' +
          '</svg>' +
          '<dl class="ip-secondary-values ip-two">' + secondary('Min', '7,8', 'm') + secondary('Max', '10', 'm') + '</dl>' +
          '<p class="ip-reason" data-empty-reason="Kein Tiefenwert empfangen."></p>' +
        '</div>' +
        '<div class="ip-tile">' + tileHead('Wind', 'Live-Darstellung') +
          '<div class="ip-wind-area"><div class="ip-wind-readout"><p class="ip-reading">' + reading('14,6', 'kn') + '</p>' +
            '<p>Scheinbarer Wind</p></div>' + dial() + '</div>' +
          '<dl class="ip-secondary-values ip-two">' + secondary('Winkel Stb', '38', '°') + secondary('Max AWS', '17,2', 'kn') + '</dl>' +
          '<p class="ip-reason" data-empty-reason="Keine Winddaten empfangen."></p>' +
        '</div>' +
      '</div>' +
      '<div class="ip-footer"><p>Beispielwerte · keine Verbindung zum Boot</p><p data-preview-description>Nachtansicht</p></div>' +
      '<p class="ip-announcement" aria-live="polite" aria-atomic="true"></p>';

    var description = host.querySelector('[data-preview-description]');
    var announcement = host.querySelector('.ip-announcement');

    function announce() {
      var mode = host.getAttribute('data-preview-theme');
      var state = host.getAttribute('data-preview-state');
      description.textContent = themeNames[mode] + ' · ' + stateNames[state];
      announcement.textContent = themeNames[mode] + ' ausgewählt. ' +
        (state === 'live' ? 'Live-Darstellung mit Beispielwerten.' :
          state === 'stale' ? 'Beispielwerte als 42 Sekunden veraltet dargestellt.' : 'Fehlende Messwerte dargestellt.');
    }

    host.querySelectorAll('[data-preview-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        host.setAttribute('data-preview-theme', button.getAttribute('data-preview-mode'));
        host.querySelectorAll('[data-preview-mode]').forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
        announce();
      });
    });

    host.querySelector('[data-preview-state-select]').addEventListener('change', function (event) {
      var state = event.target.value;
      host.setAttribute('data-preview-state', state);
      host.querySelectorAll('[data-example-value]').forEach(function (value) {
        value.textContent = state === 'missing' ? '—' : value.getAttribute('data-example-value');
      });
      host.querySelectorAll('[data-example-unit]').forEach(function (unit) { unit.hidden = state === 'missing'; });
      host.querySelectorAll('[data-example-status]').forEach(function (status) {
        status.textContent = state === 'live' ? (status.getAttribute('data-default-status') || stateNames.live) : stateNames[state];
        status.classList.toggle('ip-charging', state === 'live' && status.hasAttribute('data-default-status'));
      });
      host.querySelectorAll('[data-empty-reason]').forEach(function (reason) {
        reason.textContent = state === 'missing' ? reason.getAttribute('data-empty-reason') : '';
      });
      announce();
    });
  });
})();
