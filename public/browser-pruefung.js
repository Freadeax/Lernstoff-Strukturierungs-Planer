// Läuft vor der App als klassisches Skript (bewusst altes JavaScript, damit es auch in alten Browsern startet).
// Kann der Browser die App nicht ausführen, steht statt einer leeren Seite ein Hinweis da.
// Mindeststand = Build-Ziel von Vite 8 (Safari/iOS 16.4, Chrome/Edge 111, Firefox 114). Siehe docs/BROWSER.md.
(function () {
  'use strict';
  var fehlt = [];
  function pruefe(name, test) {
    try { if (!test()) fehlt.push(name); } catch (e) { fehlt.push(name); }
  }
  pruefe('Module', function () { return 'noModule' in document.createElement('script'); });
  pruefe('Lookbehind', function () { return new RegExp('(?<=a)b').test('ab'); });
  pruefe('structuredClone', function () { return typeof structuredClone === 'function'; });
  pruefe('IndexedDB', function () { return typeof indexedDB !== 'undefined' || typeof IDBFactory !== 'undefined'; });
  pruefe('CompressionStream', function () { return typeof CompressionStream === 'function'; });
  pruefe('CSS', function () { return !!(window.CSS && CSS.supports && CSS.supports('selector(:focus-visible)')); });

  function hinweis(grund) {
    if (document.getElementById('browser-hinweis')) return;
    var root = document.getElementById('root');
    if (root && root.childNodes.length) return; // App läuft schon
    var box = document.createElement('div');
    box.id = 'browser-hinweis';
    box.setAttribute('role', 'alert');
    box.style.cssText = 'max-width:34rem;margin:15vh auto;padding:24px;font:17px/1.5 -apple-system,system-ui,sans-serif;color:#1d2433;background:#fbf6ec;border:2px solid #1d2433;border-radius:12px';
    // Nur DOM und element.style: die Content Security Policy erlaubt keine style-Attribute im Markup.
    function teil(tag, text, css) {
      var el = document.createElement(tag);
      el.textContent = text;
      el.style.cssText = css;
      box.appendChild(el);
    }
    teil('h1', 'Dieser Browser ist zu alt für den Lernstoff-Planer', 'font-size:22px;margin:0 0 8px');
    teil('p', 'Bitte das Gerät aktualisieren oder einen aktuellen Browser verwenden: ' +
      'Safari ab iOS/iPadOS 16.4 oder macOS 13.3, Chrome, Edge oder Firefox in aktueller Version.', 'margin:0 0 8px');
    teil('p', 'Deine bisher gespeicherten Daten bleiben auf dem Gerät erhalten.', 'margin:0;color:#555;font-size:14px');
    if (grund) teil('p', 'Technisch: ' + grund, 'margin:8px 0 0;color:#777;font-size:12px');
    (document.body || document.documentElement).appendChild(box);
  }

  if (fehlt.length) {
    // Die App gar nicht erst starten lassen: sie würde nur halb laufen.
    window.__browserZuAlt = true;
    if (document.body) hinweis('fehlt: ' + fehlt.join(', '));
    else document.addEventListener('DOMContentLoaded', function () { hinweis('fehlt: ' + fehlt.join(', ')); });
    return;
  }

  // Bricht das App-Skript schon beim Einlesen ab (Syntax, die der Browser nicht kennt), bleibt die Seite sonst leer.
  window.addEventListener('error', function (e) {
    var m = String((e && e.message) || '');
    var datei = String((e && e.filename) || '');
    if (/\.m?js(\?|$)/.test(datei) && /SyntaxError|Unexpected token|Invalid regular expression/i.test(m)) {
      setTimeout(function () { hinweis(m.slice(0, 160)); }, 0);
    }
  });
})();
