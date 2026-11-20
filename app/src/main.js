// main.js — editor wiring for Crimson Palms Cover Press v2
(function () {
  'use strict';

  var SAMPLES = [
    { src: 'samples/boulevard.jpg', face: window.Cover.FACES.boulevard, name: 'Boulevard' },
    { src: 'samples/pier.jpg', face: window.Cover.FACES.pier, name: 'Pier' }
  ];

  var state = {
    layout: 'hero-left',
    grade: 'vice-sunset',
    title: 'CRIMSON PALMS',
    subtitle: 'A Vice City story',
    quote: 'ONLY IN VICE CITY',
    showBilling: true,
    nudges: {}
  };

  var photos = [null, null];
  var canvas, statusEl;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
    window.__status = text;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('could not load ' + src)); };
      img.src = src;
    });
  }

  function render() {
    if (!canvas) return;
    window.Cover.drawCover(canvas, state, photos);
    window.__shotReady = true;
  }

  function photoPanels() {
    var layout = window.Cover.layoutById(state.layout);
    var out = [];
    for (var i = 0; i < layout.panels.length; i++) {
      if (layout.panels[i].kind === 'photo') out.push({ index: i, photo: layout.panels[i].photo });
    }
    return out;
  }

  function buildNudgeControls() {
    var box = document.getElementById('nudge-box');
    if (!box) return;
    box.innerHTML = '';
    var panels = photoPanels();
    panels.forEach(function (pp) {
      var n = state.nudges[pp.index] || { x: 0, y: 0 };
      state.nudges[pp.index] = n;
      var group = document.createElement('div');
      group.className = 'nudge-group';
      var label = document.createElement('div');
      label.className = 'nudge-label';
      label.textContent = 'Panel ' + (pp.index + 1) + ' (' + SAMPLES[pp.photo].name + ')';
      group.appendChild(label);
      [['x', 'Nudge X'], ['y', 'Nudge Y']].forEach(function (pair) {
        var axis = pair[0];
        var row = document.createElement('label');
        row.className = 'slider-row';
        var span = document.createElement('span');
        span.textContent = pair[1];
        var input = document.createElement('input');
        input.type = 'range';
        input.min = '-0.2'; input.max = '0.2'; input.step = '0.01';
        input.value = String(n[axis]);
        input.setAttribute('data-panel', String(pp.index));
        input.setAttribute('data-axis', axis);
        input.addEventListener('input', function () {
          state.nudges[pp.index][axis] = parseFloat(input.value);
          render();
        });
        row.appendChild(span);
        row.appendChild(input);
        group.appendChild(row);
      });
      box.appendChild(group);
    });
  }

  function buildChips(containerId, items, current, onPick, attr) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '';
    items.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (item.id === current ? ' active' : '');
      b.textContent = item.name;
      b.setAttribute(attr, item.id);
      b.addEventListener('click', function () { onPick(item.id); });
      box.appendChild(b);
    });
  }

  function refreshChips() {
    buildChips('layout-chips', window.Cover.LAYOUTS, state.layout, function (id) {
      state.layout = id;
      buildNudgeControls();
      refreshChips();
      render();
    }, 'data-layout');
    buildChips('grade-chips', window.Cover.GRADES, state.grade, function (id) {
      state.grade = id;
      refreshChips();
      render();
    }, 'data-grade');
  }

  function exportPNG(width, height) {
    var off = document.createElement('canvas');
    off.width = width; off.height = height;
    window.Cover.drawCover(off, state, photos);
    return new Promise(function (resolve) {
      off.toBlob(function (blob) {
        if (!blob) { setStatus('Export failed: the canvas produced no image.'); resolve(null); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var name = 'crimson-palms-' + width + 'x' + height + '.png';
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        setStatus('Saved ' + name + ' (' + width + 'x' + height + ', ' + Math.round(blob.size / 1024) + ' KiB).');
        resolve({ width: width, height: height, bytes: blob.size, name: name });
      }, 'image/png');
    });
  }

  // Test hook used by the local self-check: renders offscreen and reports
  // the real canvas size, without downloading anything.
  function exportTest(width, height) {
    var off = document.createElement('canvas');
    off.width = width; off.height = height;
    window.Cover.drawCover(off, state, photos);
    var url = off.toDataURL('image/png');
    return { width: off.width, height: off.height, dataUrlLength: url.length };
  }

  function bindInputs() {
    var title = document.getElementById('title-input');
    var subtitle = document.getElementById('subtitle-input');
    var quote = document.getElementById('quote-input');
    var billing = document.getElementById('billing-toggle');
    if (title) title.addEventListener('input', function () { state.title = title.value.toUpperCase() || 'CRIMSON PALMS'; render(); });
    if (subtitle) subtitle.addEventListener('input', function () { state.subtitle = subtitle.value; render(); });
    if (quote) quote.addEventListener('input', function () { state.quote = quote.value.toUpperCase() || 'ONLY IN VICE CITY'; render(); });
    if (billing) billing.addEventListener('change', function () { state.showBilling = billing.checked; render(); });

    var upload = document.getElementById('upload-input');
    if (upload) upload.addEventListener('change', function () {
      var file = upload.files && upload.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          photos[0] = { img: img, face: { x: 0.5, y: 0.35 }, name: file.name };
          setStatus('Loaded your photo "' + file.name + '" on this machine only. It was not uploaded anywhere.');
          render();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    document.querySelectorAll('[data-export]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-export').split('x');
        exportPNG(parseInt(parts[0], 10), parseInt(parts[1], 10));
      });
    });
  }

  function applyShotParams() {
    var params = new URLSearchParams(window.location.search);
    var shot = params.get('shot');
    if (!shot) return;
    if (params.get('layout')) state.layout = params.get('layout');
    if (params.get('grade')) state.grade = params.get('grade');
    if (params.get('title')) state.title = params.get('title').toUpperCase();
    if (params.get('quote')) state.quote = params.get('quote').toUpperCase();
    if (shot === 'cover') document.body.classList.add('shot-cover');
    if (shot === 'editor') document.body.classList.add('shot-editor');
  }

  async function init() {
    canvas = document.getElementById('cover-canvas');
    statusEl = document.getElementById('status-line');
    applyShotParams();
    bindInputs();
    refreshChips();
    buildNudgeControls();
    // Load the bundled samples first; the cover renders once both arrive.
    try {
      var imgs = await Promise.all(SAMPLES.map(function (s) { return loadImage(s.src); }));
      photos = imgs.map(function (img, i) {
        return { img: img, face: SAMPLES[i].face, name: SAMPLES[i].name };
      });
      setStatus('Sample photos loaded. 2 photos on this machine. Pick a layout, export PNG.');
    } catch (err) {
      setStatus('A sample photo failed to load: ' + err.message);
    }
    render();
  }

  window.__app = {
    state: state, photos: function () { return photos; },
    render: render, exportPNG: exportPNG, exportTest: exportTest,
    setLayout: function (id) { state.layout = id; buildNudgeControls(); refreshChips(); render(); },
    setGrade: function (id) { state.grade = id; refreshChips(); render(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
