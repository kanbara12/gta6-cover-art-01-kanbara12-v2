// cover.js — Crimson Palms Cover Press v2
// Draws a multi-panel GTA-style poster cover on a canvas, from photos that
// stay on the user's machine. No network, no posterize filter.
(function () {
  'use strict';

  var FACES = {
    boulevard: { x: 0.48, y: 0.17, label: 'boulevard' },
    pier: { x: 0.42, y: 0.24, label: 'pier' }
  };

  var GRADES = [
    { id: 'vice-sunset', name: 'Vice Sunset', filter: 'brightness(1.08) contrast(1.12) saturate(1.35) hue-rotate(-8deg)', tint: '#ff7a3c', tintAlpha: 0.10 },
    { id: 'golden-hour', name: 'Golden Hour', filter: 'brightness(1.12) contrast(1.08) saturate(1.25)', tint: '#ffb347', tintAlpha: 0.12 },
    { id: 'neon-night', name: 'Neon Night', filter: 'brightness(0.95) contrast(1.20) saturate(1.50) hue-rotate(18deg)', tint: '#7b2fff', tintAlpha: 0.14 },
    { id: 'palm-shade', name: 'Palm Shade', filter: 'brightness(1.00) contrast(1.05) saturate(1.10) hue-rotate(-12deg)', tint: '#2fae6b', tintAlpha: 0.10 },
    { id: 'crimson-dusk', name: 'Crimson Dusk', filter: 'brightness(0.92) contrast(1.15) saturate(1.30)', tint: '#c1123f', tintAlpha: 0.14 },
    { id: 'mono-noir', name: 'Mono Noir', filter: 'grayscale(1) contrast(1.25) brightness(1.05)', tint: null, tintAlpha: 0 }
  ];

  function gradeById(id) {
    for (var i = 0; i < GRADES.length; i++) if (GRADES[i].id === id) return GRADES[i];
    return GRADES[0];
  }

  // Panels are fractions of the cover: x, y, w, h in 0..1.
  // kind: photo | title | quote | solid
  var LAYOUTS = [
    {
      id: 'hero-left', name: 'Hero Left',
      panels: [
        { kind: 'photo', photo: 0, x: 0, y: 0, w: 0.62, h: 1 },
        { kind: 'title', x: 0.62, y: 0, w: 0.38, h: 0.36 },
        { kind: 'photo', photo: 1, x: 0.62, y: 0.36, w: 0.38, h: 0.32 },
        { kind: 'quote', x: 0.62, y: 0.68, w: 0.38, h: 0.32 }
      ]
    },
    {
      id: 'comic-5', name: 'Comic 5',
      panels: [
        { kind: 'photo', photo: 0, x: 0, y: 0, w: 1, h: 0.52 },
        { kind: 'photo', photo: 1, x: 0, y: 0.52, w: 0.25, h: 0.48 },
        { kind: 'title', x: 0.25, y: 0.52, w: 0.25, h: 0.48 },
        { kind: 'photo', photo: 0, x: 0.50, y: 0.52, w: 0.25, h: 0.48 },
        { kind: 'quote', x: 0.75, y: 0.52, w: 0.25, h: 0.48 }
      ]
    },
    {
      id: 'grid-3x3', name: 'Grid 3x3',
      panels: [
        { kind: 'photo', photo: 0, x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
        { kind: 'photo', photo: 1, x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
        { kind: 'title', x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
        { kind: 'photo', photo: 1, x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
        { kind: 'photo', photo: 0, x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
        { kind: 'quote', x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
        { kind: 'photo', photo: 0, x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
        { kind: 'solid', x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
        { kind: 'photo', photo: 1, x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 }
      ]
    }
  ];

  function layoutById(id) {
    for (var i = 0; i < LAYOUTS.length; i++) if (LAYOUTS[i].id === id) return LAYOUTS[i];
    return LAYOUTS[0];
  }

  // Face-aware crop: pick the source rect so the face stays in frame.
  // nudge is {x, y} in fractions of the image, relative to the face centre.
  function faceCropRect(img, face, panelW, panelH, nudge) {
    var panelAspect = panelW / panelH;
    var imgAspect = img.naturalWidth / img.naturalHeight;
    var sw, sh;
    if (imgAspect > panelAspect) { sh = img.naturalHeight; sw = sh * panelAspect; }
    else { sw = img.naturalWidth; sh = sw / panelAspect; }
    var cx = face.x * img.naturalWidth + (nudge ? nudge.x * img.naturalWidth : 0);
    var cy = face.y * img.naturalHeight + (nudge ? nudge.y * img.naturalHeight : 0);
    var sx = cx - sw / 2;
    var sy = cy - sh / 2;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + sw > img.naturalWidth) sx = img.naturalWidth - sw;
    if (sy + sh > img.naturalHeight) sy = img.naturalHeight - sh;
    return { sx: sx, sy: sy, sw: sw, sh: sh };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitFont(ctx, text, maxW, startPx, family, weight) {
    var px = startPx;
    ctx.font = weight + ' ' + px + 'px ' + family;
    while (px > 10 && ctx.measureText(text).width > maxW) {
      px -= 2;
      ctx.font = weight + ' ' + px + 'px ' + family;
    }
    return px;
  }

  function drawSunset(ctx, x, y, w, h, grade) {
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#2b1055');
    g.addColorStop(0.45, '#c1123f');
    g.addColorStop(0.75, '#ff7a3c');
    g.addColorStop(1, '#ffc46b');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    var sunR = Math.min(w, h) * 0.22;
    var sunX = x + w * 0.5, sunY = y + h * 0.42;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();
    // Sea band.
    ctx.fillStyle = '#1b2a6b';
    ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
    ctx.fillStyle = 'rgba(255,196,107,0.55)';
    ctx.fillRect(x, sunX - sunR * 0.12, y + h * 0.72, sunR * 0.24, h * 0.28);
    // Palm silhouette, drawn from lines so no artwork is copied.
    ctx.strokeStyle = '#12041f';
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.lineCap = 'round';
    var bx = x + w * 0.12, by = y + h;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + w * 0.02, y + h * 0.55, bx + w * 0.10, y + h * 0.38); ctx.stroke();
    for (var i = 0; i < 5; i++) {
      var a = -0.3 - i * 0.35;
      ctx.beginPath();
      ctx.moveTo(bx + w * 0.10, y + h * 0.38);
      ctx.quadraticCurveTo(
        bx + w * 0.10 + Math.cos(a) * w * 0.16, y + h * 0.38 + Math.sin(a) * h * 0.16,
        bx + w * 0.10 + Math.cos(a) * w * 0.30, y + h * 0.38 + Math.sin(a) * h * 0.30 + h * 0.10);
      ctx.stroke();
    }
    void grade;
  }

  // Title panels use a clean gradient only: the palm and sun of the full
  // sunset sit under the text and strike through the subtitle, so they
  // stay out of this panel. A small sun sits bottom-right, clear of the
  // left-aligned title, subtitle and tag lines.
  function drawTitleBackground(ctx, rect) {
    var g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#2b1055');
    g.addColorStop(0.45, '#c1123f');
    g.addColorStop(0.75, '#ff7a3c');
    g.addColorStop(1, '#ffc46b');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#1b2a6b';
    ctx.fillRect(rect.x, rect.y + rect.h * 0.82, rect.w, rect.h * 0.18);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w * 0.86, rect.y + rect.h * 0.68, Math.min(rect.w, rect.h) * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTitlePanel(ctx, rect, state) {
    drawTitleBackground(ctx, rect, state);
    var pad = rect.w * 0.06;
    var cx = rect.x + pad, cy = rect.y + rect.h * 0.16;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#12041f';
    ctx.lineWidth = Math.max(2, rect.w * 0.006);
    var titlePx = fitFont(ctx, state.title, rect.w - pad * 2, rect.w * 0.16, '"Arial Black", Arial, sans-serif', '900');
    ctx.font = '900 ' + titlePx + 'px "Arial Black", Arial, sans-serif';
    var words = state.title.split(' ');
    var line = '', lines = [];
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > rect.w - pad * 2 && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    var lh = titlePx * 1.02;
    for (var j = 0; j < lines.length; j++) {
      var ly = cy + j * lh;
      ctx.strokeText(lines[j], cx, ly);
      ctx.fillText(lines[j], cx, ly);
    }
    var subY = cy + lines.length * lh + rect.h * 0.06;
    ctx.fillStyle = '#ffe9a8';
    var subPx = fitFont(ctx, state.subtitle, rect.w - pad * 2, rect.w * 0.055, 'Arial, sans-serif', '700');
    ctx.font = '700 ' + subPx + 'px Arial, sans-serif';
    ctx.fillText(state.subtitle, cx, subY);
    // Small tag line under the subtitle.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    var tagPx = Math.max(10, rect.w * 0.038);
    ctx.font = '700 ' + tagPx + 'px Arial, sans-serif';
    ctx.fillText('VICE CITY  •  2026', cx, subY + tagPx * 1.8);
  }

  function drawQuotePanel(ctx, rect, state) {
    var g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#12041f');
    g.addColorStop(1, '#3d0a4e');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // Stars row.
    ctx.fillStyle = '#ffc46b';
    var starPx = Math.max(12, rect.w * 0.09);
    ctx.font = starPx + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★★★★★', rect.x + rect.w / 2, rect.y + rect.h * 0.22);
    ctx.textAlign = 'left';
    // Quote pill.
    var pillPad = rect.w * 0.08;
    var qPx = fitFont(ctx, '"' + state.quote + '"', rect.w - pillPad * 2, rect.w * 0.085, 'Arial, sans-serif', '800');
    ctx.font = '800 ' + qPx + 'px Arial, sans-serif';
    var qy = rect.y + rect.h * 0.52;
    var qw = ctx.measureText('"' + state.quote + '"').width;
    var pillX = rect.x + (rect.w - qw) / 2 - pillPad * 0.5;
    var pillW = qw + pillPad;
    var pillH = qPx * 2.1;
    ctx.fillStyle = '#ff7a3c';
    roundRect(ctx, pillX, qy - pillH * 0.62, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#12041f';
    ctx.fillText('"' + state.quote + '"', pillX + pillPad * 0.5, qy);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    var capPx = Math.max(10, rect.w * 0.04);
    ctx.font = '700 ' + capPx + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    // 0.78, not 0.86: the billing block covers the bottom of the cover,
    // and a caption lower than this is half cut by it.
    ctx.fillText('A POSTER YOU MADE FROM YOUR OWN PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.78);
    ctx.textAlign = 'left';
  }

  function drawSolidPanel(ctx, rect) {
    drawSunset(ctx, rect.x, rect.y, rect.w, rect.h, null);
    // Text sits on the dark sea band at the bottom, clear of the sun and
    // the palm fronds in the upper half of the panel.
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '800 ' + Math.max(12, rect.w * 0.07) + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRIMSON', rect.x + rect.w / 2, rect.y + rect.h * 0.82);
    ctx.fillText('PALMS', rect.x + rect.w / 2, rect.y + rect.h * 0.93);
    ctx.textAlign = 'left';
  }

  function drawBilling(ctx, W, H, state) {
    if (!state.showBilling) return;
    var bh = H * 0.055;
    ctx.fillStyle = 'rgba(10,2,18,0.92)';
    ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 ' + Math.max(9, bh * 0.32) + 'px Arial, sans-serif';
    ctx.textAlign = 'left';
    var left = 'A CRIMSON PALMS PRODUCTION  •  PHOTOS BY YOU  •  VICE CITY, 2026';
    ctx.fillText(left, W * 0.02, H - bh * 0.38);
    // Rating seal: a circle with a letter, our own mark.
    var r = bh * 0.42;
    var cx = W * 0.965, cy = H - bh / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, bh * 0.05);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 ' + (r * 1.1) + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', cx, cy + r * 0.38);
    ctx.textAlign = 'left';
  }

  function drawCover(canvas, state, photos) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var layout = layoutById(state.layout);
    var grade = gradeById(state.grade);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#12041f';
    ctx.fillRect(0, 0, W, H);
    // Panels live in the area above the billing strip. Drawing them over
    // the full height put bottom-row text under the billing block.
    var bh = state.showBilling ? H * 0.055 : 0;
    var layoutH = H - bh;
    var gap = Math.max(2, Math.round(Math.min(W, H) * 0.006));
    for (var i = 0; i < layout.panels.length; i++) {
      var p = layout.panels[i];
      var rect = {
        x: Math.round(p.x * W) + gap, y: Math.round(p.y * layoutH) + gap,
        w: Math.round(p.w * W) - gap * 2, h: Math.round(p.h * layoutH) - gap * 2
      };
      if (rect.w <= 0 || rect.h <= 0) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (p.kind === 'photo') {
        var photo = photos[p.photo];
        if (photo && photo.img && photo.img.naturalWidth > 0) {
          var face = photo.face || { x: 0.5, y: 0.35 };
          var nudge = (state.nudges && state.nudges[i]) || { x: 0, y: 0 };
          var crop = faceCropRect(photo.img, face, rect.w, rect.h, nudge);
          ctx.filter = grade.filter;
          ctx.drawImage(photo.img, crop.sx, crop.sy, crop.sw, crop.sh, rect.x, rect.y, rect.w, rect.h);
          ctx.filter = 'none';
          if (grade.tint) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = grade.tintAlpha;
            ctx.fillStyle = grade.tint;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
          }
          // Thin warm edge so panels read as separate poster frames.
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
        } else {
          ctx.fillStyle = '#33304a';
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
      } else if (p.kind === 'title') {
        drawTitlePanel(ctx, rect, state);
      } else if (p.kind === 'quote') {
        drawQuotePanel(ctx, rect, state);
      } else {
        drawSolidPanel(ctx, rect);
      }
      ctx.restore();
    }
    drawBilling(ctx, W, H, state);
    ctx.restore();
  }

  window.Cover = {
    FACES: FACES, GRADES: GRADES, LAYOUTS: LAYOUTS,
    gradeById: gradeById, layoutById: layoutById,
    faceCropRect: faceCropRect, drawCover: drawCover
  };
})();
