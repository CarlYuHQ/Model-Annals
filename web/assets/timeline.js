/* 编年长轴：357 个模型按年月聚合成节点，保留真实时间位置。
   圆点大小按该月模型数分级，hover 就近吸附展开该月模型列表（带 logo）。
   完整一屏显示、无滚动条，滚轮/拖拽缩放看局部。 */
(function () {
  'use strict';
  var D = window.TIMELINE_DATA || [];
  var host = document.getElementById('long-timeline');
  if (!host || !D.length) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var LOGO = {openai:'openai',anthropic:'anthropic',google:'deepmind',meta:'meta',xai:'x',
    nvidia:'nvidia',mistral:'mistral',cohere:'cohere',ai21:'ai21',deepseek:'deepseek',
    alibaba:'qwenlm',bytedance:'bytedance',moonshot:'moonshot',zhipu:'zhipuai',
    minimax:'minimaxi',tencent:'tencent',huawei:'huawei',stepfun:'stepfun',
    '01ai':'01ai',internlm:'internlm',baidu:'baidu'};
  var logoURL = function (l) { return l ? 'assets/logos/' + l + '.png' : ''; };
  function el(t, c) { var e = document.createElementNS(SVGNS, t); if (c) e.setAttribute('class', c); return e; }
  function attr(n, o) { Object.keys(o).forEach(function (k) { n.setAttribute(k, o[k]); }); return n; }

  var Y0 = 2018, Y1 = 2026, COL = 44, X0 = 80;
  var AXIS_Y = 190, H = 380;
  var W = (Y1 - Y0 + 1) * 12 * COL + X0 + 100;
  function xOf(y, m) { return X0 + ((y - Y0) * 12 + (m - 1)) * COL; }

  /* ---- 按年月聚合 ---- */
  var byKey = {};
  D.forEach(function (m) {
    var key = m.y + '-' + String(m.m).padStart(2, '0');
    (byKey[key] = byKey[key] || { key: key, y: m.y, m: m.m, items: [] }).items.push(m);
  });
  var pts = Object.keys(byKey).map(function (k) { return byKey[k]; })
    .sort(function (a, b) { return a.key.localeCompare(b.key); });
  var maxN = Math.max.apply(null, pts.map(function (p) { return p.items.length; }));
  pts.forEach(function (p) {
    p.x = xOf(p.y, p.m);
    p.r = p.items.length === 1 ? 5 : (p.items.length < 5 ? 8 : (p.items.length < 10 ? 11 : 14));
    p.side = pts.indexOf(p) % 2 === 0 ? -1 : 1; // 上下交替标注
  });

  /* ---- SVG ---- */
  var s = el('svg');
  attr(s, {viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', role: 'img',
    'aria-label': '2018 至 2026 模型发布编年轴，按年月聚合'});
  // 主轴
  s.appendChild(attr(el('line'), {x1: X0, y1: AXIS_Y, x2: W - 50, y2: AXIS_Y,
    stroke: 'var(--ink)', 'stroke-width': 1.5}));
  // 年份 + 季度刻度
  for (var y = Y0; y <= Y1; y++) {
    var xy = xOf(y, 1);
    var t = el('text');
    attr(t, {x: xy, y: AXIS_Y - 22, 'font-size': 28, 'font-family': 'var(--hand)', fill: 'var(--red)'});
    t.textContent = y; s.appendChild(t);
    s.appendChild(attr(el('line'), {x1: xy, y1: AXIS_Y - 7, x2: xy, y2: AXIS_Y + 7,
      stroke: 'var(--red)', 'stroke-width': 2}));
    [4, 7, 10].forEach(function (mm) {
      var xm = xOf(y, mm);
      s.appendChild(attr(el('line'), {x1: xm, y1: AXIS_Y, x2: xm, y2: AXIS_Y + 5,
        stroke: 'var(--muted)', 'stroke-width': 1}));
    });
    [1, 4, 7, 10].forEach(function (mm) {
      var xm = xOf(y, mm);
      var mt = el('text');
      attr(mt, {x: xm, y: AXIS_Y + 26, 'font-size': 13, 'font-family': 'var(--ui)',
        'text-anchor': 'middle', fill: 'var(--muted)'});
      mt.textContent = mm + '月'; s.appendChild(mt);
    });
  }
  // 聚合节点
  var nodeEls = {};
  pts.forEach(function (p, i) {
    var g = el('g', 'ax-node');
    g.setAttribute('data-key', p.key);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', p.y + '年' + p.m + '月，' + p.items.length + '个模型');
    var stem = el('line');
    attr(stem, {x1: p.x, y1: AXIS_Y + (p.side < 0 ? -4 : 4), x2: p.x,
      y2: AXIS_Y + p.side * 26, stroke: 'var(--rule)', 'stroke-width': 1});
    g.appendChild(stem);
    var dot = el('circle');
    attr(dot, {cx: p.x, cy: AXIS_Y, r: p.r, fill: 'var(--paper)',
      stroke: p.items.length >= 10 ? 'var(--red)' : 'var(--ink-2)',
      'stroke-width': p.items.length >= 10 ? 2 : 1.5});
    g.appendChild(dot);
    // 只给重要节点标注：该月 ≥5 个模型，或每年 1 月；上下交替斜向
    if (p.items.length >= 5 || p.m === 1) {
      var lab = el('text');
      var lx = p.x + 6, ly = AXIS_Y + p.side * (p.r + 16);
      attr(lab, {x: lx, y: ly, 'font-size': 14, 'font-family': 'var(--hand)',
        fill: p.items.length >= 10 ? 'var(--red)' : 'var(--muted)',
        transform: 'rotate(' + (p.side < 0 ? -30 : 30) + ' ' + lx + ' ' + ly + ')'});
      lab.textContent = String(p.y).slice(2) + '/' + String(p.m).padStart(2, '0') + '·' + p.items.length;
      g.appendChild(lab);
    }
    g.addEventListener('click', function () { showPop(p); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPop(p); } });
    s.appendChild(g);
    nodeEls[p.key] = g;
  });
  host.appendChild(s);

  /* ---- hover 就近吸附 + 浮层 ---- */
  var pop = document.createElement('div');
  pop.className = 'ax-float';
  host.parentNode.insertBefore(pop, host.nextSibling);
  var hoverKey = null;

  function nearest(clientX) {
    var pt = s.createSVGPoint(); pt.x = clientX; pt.y = 0;
    var loc = pt.matrixTransform(s.getScreenCTM().inverse());
    var best = null, bd = Infinity;
    pts.forEach(function (p) { var d = Math.abs(p.x - loc.x); if (d < bd) { bd = d; best = p; } });
    return best;
  }
  function applyHighlight() {
    Object.keys(nodeEls).forEach(function (k) {
      nodeEls[k].classList.toggle('on', k === hoverKey);
      nodeEls[k].style.opacity = (hoverKey && k !== hoverKey) ? '0.4' : '1';
    });
  }
  function showPop(p) {
    var lg = p.items.filter(function (m) { return m.logo; }).length;
    var h = '<em>' + p.y + '年' + p.m + '月 · ' + p.items.length + ' 个模型</em><ul>';
    p.items.forEach(function (m) {
      var img = m.logo ? '<img src="' + logoURL(m.logo) + '" alt="">' : '<i class="ax-ph"></i>';
      h += '<li><span class="ax-logo">' + img + '</span><span class="ax-mi"><b>' + m.name +
        '</b><small>' + (m.ctx ? m.ctx + 'K' : '—') + '</small></span></li>';
    });
    h += '</ul>';
    pop.innerHTML = h;
    // 定位到该节点的屏幕位置
    var hostRect = host.getBoundingClientRect();
    var scale = hostRect.width / W;
    var sx = (vb.x + p.x) / vb.w * hostRect.width;
    pop.style.left = Math.max(8, Math.min(hostRect.width - 240, sx - 120)) + 'px';
    pop.style.top = (AXIS_Y / H * hostRect.height + 30) + 'px';
    pop.classList.add('on');
  }
  function hidePop() { pop.classList.remove('on'); }

  /* ---- 缩放：改 viewBox 只缩放 X ---- */
  var vb = {x: 0, y: 0, w: W, h: H};
  function applyVB() { s.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); }
  function zoomAt(factor, cx) {
    var nw = Math.max(W * 0.06, Math.min(W, vb.w / factor));
    vb.x = cx - (cx - vb.x) * (nw / vb.w);
    vb.w = nw; vb.h = H; vb.y = 0;
    if (vb.w >= W * 0.999) { vb.x = 0; vb.w = W; }
    vb.x = Math.max(0, Math.min(W - vb.w, vb.x));
    applyVB(); updateUI();
  }
  function updateUI() { var z = document.getElementById('zoom-level'); if (z) z.textContent = Math.round(W / vb.w * 100) + '%'; }

  s.addEventListener('pointermove', function (e) {
    if (dragging && dragStart) return;
    var p = nearest(e.clientX);
    var k = p ? p.key : null;
    if (k !== hoverKey) { hoverKey = k; applyHighlight(); if (p) showPop(p); else hidePop(); }
  });
  s.addEventListener('pointerleave', function () { hoverKey = null; applyHighlight(); hidePop(); });
  s.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var loc = pt.matrixTransform(s.getScreenCTM().inverse());
    zoomAt(e.deltaY < 0 ? 1.25 : 0.8, loc.x);
  }, {passive: false});
  var dragging = false, dragStart = null;
  s.addEventListener('pointerdown', function (e) { dragging = true; dragStart = {x: e.clientX, vx: vb.x}; s.setPointerCapture(e.pointerId); });
  s.addEventListener('pointermove', function (e) {
    if (!dragging || !dragStart) return;
    var dx = (e.clientX - dragStart.x) / s.getBoundingClientRect().width * vb.w;
    vb.x = Math.max(0, Math.min(W - vb.w, dragStart.vx - dx)); applyVB();
  });
  s.addEventListener('pointerup', function () { dragging = false; dragStart = null; });
  s.addEventListener('pointercancel', function () { dragging = false; dragStart = null; });
  var zi = document.getElementById('zoom-in'), zo = document.getElementById('zoom-out'), zr = document.getElementById('zoom-reset');
  if (zi) zi.addEventListener('click', function () { zoomAt(1.6, vb.x + vb.w / 2); });
  if (zo) zo.addEventListener('click', function () { zoomAt(0.625, vb.x + vb.w / 2); });
  if (zr) zr.addEventListener('click', function () { vb = {x: 0, y: 0, w: W, h: H}; applyVB(); updateUI(); hidePop(); });
})();
