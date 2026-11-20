// shots.js — screenshot modes for Crimson Palms Cover Press v2
// ?shot=cover shows only the cover canvas, full-bleed, for cover shots.
// ?shot=editor shows the full editor. Both set window.__shotReady once the
// cover has rendered with the sample photos loaded.
(function () {
  'use strict';

  function sizeCanvasForShot() {
    var canvas = document.getElementById('cover-canvas');
    if (!canvas) return;
    var params = new URLSearchParams(window.location.search);
    var shot = params.get('shot');
    if (shot === 'cover') {
      // Fit the canvas to the viewport so a headless screenshot is the cover.
      var w = window.innerWidth, h = window.innerHeight;
      var ratio = params.get('ratio') || '16:9';
      var parts = ratio.split(':');
      var target = parseFloat(parts[0]) / parseFloat(parts[1]);
      var cw = w, ch = Math.round(w / target);
      if (ch > h) { ch = h; cw = Math.round(h * target); }
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.margin = '0 auto';
      canvas.style.display = 'block';
    }
  }

  function waitReady() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var photos = window.__app && window.__app.photos();
      var loaded = photos && photos[0] && photos[0].img && photos[0].img.naturalWidth > 0;
      if (loaded || tries > 100) {
        sizeCanvasForShot();
        if (window.__app) window.__app.render();
        window.__shotReady = true;
        clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitReady);
  } else {
    waitReady();
  }
})();
