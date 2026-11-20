/* 编年长轴：357 个模型按发布时间铺开，带机构 logo。
   年份筛选：选中的点重新等距铺满整轴，位置/透明度平滑过渡（参考 ccfddls useAxisMotion）。
   hover 就近吸附展开模型名与详情；滚轮缩放看局部。 */
(function () {
  'use strict';
  var D = window.TIMELINE_DATA || [];
  var host = document.getElementById('long-timeline');
  if (!host || !D.length) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var Y0 = 2018, Y1 = 2026, MO = 12;
  var COL = 30, X0 = 90;
  var TOTAL = (Y1 - Y0 + 1) * MO * COL + X0 + 120;
  var AXIS_Y = 300, H = 600, W = TOTAL;
  var LAYERS = [-270,-240,-210,-180,-150,-120,-90,-60,-30, 30,60,90,120,150,180,210,240,270];
  var MIN_GAP = 36;
  var MOTION = 720;
  var selectedId = null;
  var filter = { from: 'all', to: 'all', co: 'all' };
  function visible(d) {
    if (filter.from !== 'all' && d.y < +filter.from) return false;
    if (filter.to !== 'all' && d.y > +filter.to) return false;
    if (filter.co !== 'all' && d.company !== filter.co) return false;
    return true;
  }

  function el(t, c) { var e = document.createElementNS(SVGNS, t); if (c) e.setAttribute('class', c); return e; }
  function attr(n, o) { Object.keys(o).forEach(function (k) { n.setAttribute(k, o[k]); }); return n; }
  function logoURL(l) { return l ? 'assets/logos/' + l + '.png' : ''; }
  function xOf(y, m, day) { return X0 + ((y - Y0) * 12 + (m - 1) + ((day || 15) - 1) / 30) * COL; }

  // 解析日 + 初始真实时间位置
  D.forEach(function (d) {
    var p = d.date.split('-');
    d.day = p.length > 2 ? parseInt(p[2], 10) : 15;
    d.tx = xOf(d.y, d.m, d.day); // 真实时间 x（筛选=全部时用）
  });

  /* ---- 贪心分层（全量时）---- */
  function layoutFull() {
    D.forEach(function (d) { d.x = d.tx; });
    assignLayers(D);
  }
  /* ---- 贪心分层：把给定点铺满 18 层 ---- */
  function assignLayers(list) {
    var lastX = LAYERS.map(function () { return -Infinity; });
    list.forEach(function (d) {
      var x = d.x, best = -1, score = -Infinity;
      for (var i = 0; i < LAYERS.length; i++) {
        var gap = x - lastX[i];
        if (gap < MIN_GAP) continue;
        var sc = (Math.abs(LAYERS[i]) <= 30 ? 40 : 0) - Math.abs(LAYERS[i]) * .5 + Math.min(gap, MIN_GAP * 3) * .2;
        if (sc > score) { score = sc; best = i; }
      }
      if (best < 0) { best = 0; for (var j = 1; j < LAYERS.length; j++) if (lastX[j] < lastX[best]) best = j; }
      d.yPos = AXIS_Y + LAYERS[best]; d.up = LAYERS[best] < 0; d.layer = best;
      lastX[best] = x;
    });
  }
  /* ---- 筛选后：点按序号等距铺开，贪心分层自然铺开 ---- */
  function layoutFiltered(list) {
    var n = list.length;
    list.forEach(function (d, i) {
      d.x = n === 1 ? X0 + (W - X0) / 2 : X0 + (i / (n - 1)) * (W - X0 - 60);
    });
    assignLayers(list); // 贪心：点密时自然用满多层
  }

  layoutFull();

  /* ---- SVG 骨架 ---- */
  var s = el('svg');
  attr(s, {viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', role: 'img',
    'aria-label': '2018 至 2026 模型发布编年轴'});
  s.appendChild(attr(el('line'), {x1: X0, y1: AXIS_Y, x2: W - 60, y2: AXIS_Y,
    stroke: 'var(--ink)', 'stroke-width': 2}));
  var ticks = el('g', 'tl-ticks');
  s.appendChild(ticks);

  /* 刻度随筛选重建：单年→12个月；多年→每年 */
  function drawTicks() {
    ticks.innerHTML = '';
    var from = filter.from === 'all' ? Y0 : +filter.from;
    var to = filter.to === 'all' ? Y1 : +filter.to;
    if (from > to) { var tmp = from; from = to; to = tmp; }
    var singleYear = from === to;
    var span = to - from + 1;
    // 等距刻度位置：与筛选后点的铺开范围一致
    function tx(frac) { return X0 + frac * (W - X0 - 60); }
    if (singleYear) {
      for (var mm = 1; mm <= 12; mm++) {
        // 单年筛选用真实时间位置，与保留真实 x 的点对齐
        var x = xOf(from, mm, 1) - xOf(from, 1, 1) + X0;
        var t = el('text');
        attr(t, {x: x, y: AXIS_Y - 14, 'font-size': 32, 'font-family': 'var(--hand)',
          'text-anchor': 'middle', fill: mm === 1 ? 'var(--red)' : 'var(--ink-2)'});
        t.textContent = mm + '月'; ticks.appendChild(t);
        ticks.appendChild(attr(el('line'), {x1: x, y1: AXIS_Y - 7, x2: x, y2: AXIS_Y + 7,
          stroke: mm === 1 ? 'var(--red)' : 'var(--muted)', 'stroke-width': mm === 1 ? 2 : 1}));
      }
    } else {
      for (var yr = from; yr <= to; yr++) {
        var x = xOf(yr, 1, 1);
        var t2 = el('text');
        attr(t2, {x: x, y: AXIS_Y - 14, 'font-size': 40, 'font-family': 'var(--hand)',
          'text-anchor': 'middle', fill: 'var(--red)'});
        t2.textContent = yr; ticks.appendChild(t2);
        ticks.appendChild(attr(el('line'), {x1: x, y1: AXIS_Y - 7, x2: x, y2: AXIS_Y + 7,
          stroke: 'var(--red)', 'stroke-width': 2}));
      }
    }
  }
  drawTicks();
  host.appendChild(s);

  /* ---- 点层：每个点一个 g，用 transform 定位，内部相对坐标 ---- */
  var layer = el('g', 'tl-layer');
  s.appendChild(layer);
  var nodeEls = {};
  D.forEach(function (d, idx) {
    var g = el('g', 'tl-model');
    g.setAttribute('data-id', d.id);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', d.name + '，' + d.date);
    g.style.animationDelay = (idx * .006).toFixed(3) + 's';

    var stem = el('line', 'tl-stem');
    attr(stem, {x1: 0, y1: 0, x2: 0, y2: 0, stroke: 'var(--rule)', 'stroke-width': 1});
    g.appendChild(stem);

    var r = 10;
    if (d.logo) {
      var cid = 'clip-' + idx;
      var clip = el('clipPath'); clip.setAttribute('id', cid);
      var cc = el('circle'); attr(cc, {cx: 0, cy: 0, r: r});
      clip.appendChild(cc); s.appendChild(clip);
      var img = el('image');
      attr(img, {x: -r, y: -r, width: r*2, height: r*2, href: logoURL(d.logo), 'clip-path': 'url(#' + cid + ')'});
      g.appendChild(img);
    } else {
      var dot = el('circle');
      attr(dot, {cx: 0, cy: 0, r: 8, fill: 'var(--muted)'});
      g.appendChild(dot);
    }
    var label = el('text', 'tl-name');
    attr(label, {x: 0, y: 16, 'font-size': 20, 'font-family': 'var(--hand)', fill: 'var(--red)',
      'text-anchor': 'middle', stroke: 'var(--paper)', 'stroke-width': 4, 'paint-order': 'stroke', opacity: 0});
    label.textContent = d.name;
    g.appendChild(label);

    g.addEventListener('click', function () { showDetail(d); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetail(d); } });
    layer.appendChild(g);
    nodeEls[d.id] = {g: g, stem: stem, label: label};
  });

  /* ---- applyLayout：写 transform + stem；animate 时用双 rAF 确保过渡触发 ---- */
  function writeTransform(d) {
    var n = nodeEls[d.id], g = n.g;
    g.setAttribute('transform', 'translate(' + d.x.toFixed(1) + ',' + d.yPos.toFixed(1) + ')');
    var dy = AXIS_Y - d.yPos;
    attr(n.stem, {x2: 0, y2: dy.toFixed(1)});
    n.stem.setAttribute('opacity', Math.abs(dy) > 20 ? '1' : '0');
  }
  function applyLayout(animate) {
    if (!animate) {
      D.forEach(function (d) { nodeEls[d.id].g.style.transition = 'none'; writeTransform(d); });
      return;
    }
    // 先计算好新位置，分两步：本帧设 transition，下一任务改 transform
    D.forEach(function (d) {
      nodeEls[d.id].g.style.transition = 'transform ' + MOTION + 'ms var(--ease)';
    });
    window.setTimeout(function () {
      D.forEach(function (d) { writeTransform(d); });
    }, 20);
  }
  applyLayout(false);

  /* ---- 筛选条：起始年 / 结束年 / 公司（自定义下拉带 logo）---- */
  var companies = {};
  D.forEach(function (d) {
    if (!companies[d.company]) companies[d.company] = {name: d.coName || d.company, logo: d.logo};
  });
  var bar = document.createElement('div');
  bar.className = 'tl-filter';
  function yearOpts(sel) {
    var h = '<option value="all">' + (sel === 'from' ? '起始年' : '结束年') + '</option>';
    for (var yr = Y0; yr <= Y1; yr++) h += '<option value="' + yr + '">' + yr + '</option>';
    return h;
  }
  var coKeys = Object.keys(companies).sort(function (a, b) { return companies[a].name.localeCompare(companies[b].name); });
  var coOptions = '<button type="button" class="co-opt on" data-co="all"><img src="assets/logos/all.png" alt=""><span>全部</span></button>' +
    coKeys.map(function (k) {
      var c = companies[k];
      var img = c.logo ? '<img src="' + logoURL(c.logo) + '" alt="">' : '<i class="co-ph"></i>';
      return '<button type="button" class="co-opt" data-co="' + k + '">' + img + '<span>' + c.name + '</span></button>';
    }).join('');
  bar.innerHTML =
    '<span class="flt-label">年份</span>' +
    '<span class="flt-select"><select id="flt-from">' + yearOpts('from') + '</select></span>' +
    '<span class="tl-dash">—</span>' +
    '<span class="flt-select"><select id="flt-to">' + yearOpts('to') + '</select></span>' +
    '<span class="flt-label">机构</span>' +
    '<span class="co-picker"><button type="button" id="flt-co-trigger" aria-expanded="false"><span id="co-current"><img src="assets/logos/all.png" alt="">全部</span><i class="co-caret"></i></button>' +
      '<span class="co-menu" id="co-menu">' + coOptions + '</span></span>' +
    '<button type="button" id="flt-reset">重置</button>';
  host.parentNode.insertBefore(bar, host);

  function runFilter() {
    var list = D.filter(visible);
    // 筛选后可见点等距铺满整轴，轴刻度同步重排（ccfddls spreadAcrossAxis）
    // 点始终按真实时间定位；筛选只控制显隐，viewBox 收缩到可见范围放大
    D.forEach(function (d) { d.x = d.tx; });
    var inSet = {}; list.forEach(function (d) { inSet[d.id] = 1; });
    D.forEach(function (d) {
      var g = nodeEls[d.id].g;
      var on = !!inSet[d.id];
      g.classList.toggle('out', !on);
      g.style.opacity = on ? '' : '0';
      g.style.pointerEvents = on ? '' : 'none';
    });
    applyLayout(true);
    drawTicks();
    ticks.classList.remove('redraw');
    void ticks.getBoundingClientRect();
    ticks.classList.add('redraw');
    // viewBox 高度自适应：框住可见点 + 轴，去掉上下空白
    var all = filter.from === 'all' && filter.to === 'all' && filter.co === 'all';
    if (all) {
      animateVB(0, W, 0, H);
    } else if (list.length) {
      var ys = list.map(function (d) { return d.yPos; });
      var xs = list.map(function (d) { return d.x; });
      var padY = 70, padX = 60;
      var nY = Math.max(0, Math.min.apply(null, ys.concat([AXIS_Y])) - padY);
      var nH = Math.min(H, Math.max.apply(null, ys.concat([AXIS_Y])) + padY) - nY;
      var nX = Math.max(0, Math.min.apply(null, xs) - padX);
      var nW = Math.min(W - nX, Math.max.apply(null, xs) + padX - nX);
      animateVB(nX, nW, nY, nH);
    }
    hidePop();
  }
  bar.querySelector('#flt-from').addEventListener('change', function (e) { filter.from = e.target.value; runFilter(); });
  bar.querySelector('#flt-to').addEventListener('change', function (e) { filter.to = e.target.value; runFilter(); });
  // 机构自定义下拉
  var coTrigger = bar.querySelector('#flt-co-trigger');
  var coMenu = bar.querySelector('#co-menu');
  var coCurrent = bar.querySelector('#co-current');
  coTrigger.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = coMenu.classList.toggle('open');
    coTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  coMenu.addEventListener('click', function (e) {
    var opt = e.target.closest('[data-co]');
    if (!opt) return;
    filter.co = opt.getAttribute('data-co');
    var c = companies[filter.co];
    var img = filter.co === 'all' ? '<img src="assets/logos/all.png" alt="">' :
      (c && c.logo ? '<img src="' + logoURL(c.logo) + '" alt="">' : '<i class="co-ph"></i>');
    coCurrent.innerHTML = img + (c ? c.name : '全部');
    coMenu.querySelectorAll('.co-opt').forEach(function (o) { o.classList.toggle('on', o === opt); });
    coMenu.classList.remove('open');
    coTrigger.setAttribute('aria-expanded', 'false');
    runFilter();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.co-picker')) { coMenu.classList.remove('open'); coTrigger.setAttribute('aria-expanded', 'false'); }
  });
  bar.querySelector('#flt-reset').addEventListener('click', function () {
    filter = { from: 'all', to: 'all', co: 'all' };
    bar.querySelector('#flt-from').value = 'all';
    bar.querySelector('#flt-to').value = 'all';
    coCurrent.innerHTML = '<img src="assets/logos/all.png" alt="">全部';
    coMenu.querySelectorAll('.co-opt').forEach(function (o, i) { o.classList.toggle('on', i === 0); });
    coMenu.classList.remove('open');
    runFilter();
  });

  /* ---- hover 就近吸附 + 浮层 ---- */
  var pop = document.createElement('div');
  pop.className = 'tl-float';
  host.parentNode.insertBefore(pop, host.nextSibling);
  var hoverId = null;
  function nearest(clientX) {
    var pt = s.createSVGPoint(); pt.x = clientX; pt.y = 0;
    var loc = pt.matrixTransform(s.getScreenCTM().inverse());
    var best = null, bd = Infinity;
    D.forEach(function (d) {
      if (!visible(d)) return;
      var dist = Math.abs(d.x - loc.x);
      if (dist < bd) { bd = dist; best = d; }
    });
    return best;
  }
  function applyHighlight() {
    D.forEach(function (d) {
      var n = nodeEls[d.id];
      if (!visible(d)) return; // 筛选外的点保持隐藏
      var on = d.id === hoverId || d.id === selectedId;
      var dim = hoverId && !on;
      n.g.style.opacity = dim ? '0.35' : '';
      n.label.setAttribute('opacity', on ? '1' : '0');
      n.g.classList.toggle('expanded', d.id === hoverId);
    });
  }
  function showPop(p) {
    pop.innerHTML = '<em>' + p.name + ' · ' + p.coName + ' · ' + p.date + '</em>';
    var r = host.getBoundingClientRect();
    var sx = (p.x - vb.x) / vb.w * r.width;
    pop.style.left = Math.max(8, Math.min(r.width - 200, sx - 100)) + 'px';
    pop.style.top = (p.yPos / H * r.height + 24) + 'px';
    pop.classList.add('on');
  }
  function hidePop() { pop.classList.remove('on'); }

  /* ---- 缩放（viewBox 只缩放 X）---- */
  var vb = {x: 0, y: 0, w: W, h: H};
  function applyVB() { s.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); }
  var vbAnim = null;
  function animateVB(tx, tw, ty, th) {
    if (vbAnim) cancelAnimationFrame(vbAnim);
    ty = ty == null ? 0 : ty;
    th = th == null ? H : th;
    vb.y = ty; vb.h = th; // 高度直接生效（避免 rAF 不推进时卡住）
    var sx = vb.x, sw = vb.w, t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / MOTION);
      var e = 1 - Math.pow(1 - p, 3);
      vb.x = sx + (tx - sx) * e;
      vb.w = sw + (tw - sw) * e;
      applyVB();
      if (p < 1) vbAnim = requestAnimationFrame(step);
    }
    vbAnim = requestAnimationFrame(step);
  }
  function zoomAt(factor, cx) {
    var nw = Math.max(W * .06, Math.min(W, vb.w / factor));
    vb.x = cx - (cx - vb.x) * (nw / vb.w);
    vb.w = nw; vb.h = H; vb.y = 0;
    if (vb.w >= W * .999) { vb.x = 0; vb.w = W; }
    vb.x = Math.max(0, Math.min(W - vb.w, vb.x));
    applyVB();
  }
  s.addEventListener('pointermove', function (e) {
    if (dragging && dragStart) return;
    var p = nearest(e.clientX);
    var id = p ? p.id : null;
    if (id !== hoverId) { hoverId = id; applyHighlight(); if (p) showPop(p); else hidePop(); }
  });
  s.addEventListener('pointerleave', function () { hoverId = null; applyHighlight(); hidePop(); });
  s.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var loc = pt.matrixTransform(s.getScreenCTM().inverse());
    zoomAt(e.deltaY < 0 ? 1.25 : .8, loc.x);
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

  function showDetail(d) {
    var p = document.getElementById('timeline-detail');
    if (p) {
      var lg = d.logo ? '<img class="d-logo" src="' + logoURL(d.logo) + '" alt="">' : '';
      p.innerHTML = '<div class="d-card">' + lg + '<div><b>' + d.name + '</b><span>' + d.coName + ' · ' + d.date + '</span></div></div>';
    }
    selectedId = d.id;
    applyHighlight();
  }
})();
