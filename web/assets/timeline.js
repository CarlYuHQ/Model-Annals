/* 编年长轴 —— 统一坐标模型
   全部视图：点按真实月份 x、贪心分层 y；刻度用真实时间坐标。
   筛选视图：可见点等距铺满整轴（x）+ 分层铺满高度（y），刻度同步等距重画。
   viewBox 恒定 0 0 W H，宽高比不变，故点大小稳定、不裁切、不溢出。
   唯一过渡 = 点的 transform 720ms；hover 就近吸附；滚轮缩放/拖拽；点击详情。 */
(function () {
  'use strict';
  var D = window.TIMELINE_DATA || [];
  var host = document.getElementById('long-timeline');
  if (!host || !D.length) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var Y0 = 2018, Y1 = 2026;
  var COL = 30, X0 = 90;
  var W = (Y1 - Y0 + 1) * 12 * COL + X0 + 120;
  var AXIS_Y = 300, H = 600;
  var LAYERS = [-270,-240,-210,-180,-150,-120,-90,-60,-30, 30,60,90,120,150,180,210,240,270];
  var MIN_GAP = 36, MOTION = 720;
  var filter = { from: 'all', to: 'all', co: 'all' };
  var selectedId = null, hoverId = null;

  function el(t, c) { var e = document.createElementNS(SVGNS, t); if (c) e.setAttribute('class', c); return e; }
  function attr(n, o) { Object.keys(o).forEach(function (k) { n.setAttribute(k, o[k]); }); return n; }
  function logoURL(l) { return l ? 'assets/logos/' + l + '.png' : ''; }
  function xOf(y, m, day) { return X0 + ((y - Y0) * 12 + (m - 1) + ((day || 15) - 1) / 30) * COL; }
  function visible(d) {
    if (filter.from !== 'all' && d.y < +filter.from) return false;
    if (filter.to !== 'all' && d.y > +filter.to) return false;
    if (filter.co !== 'all' && d.company !== filter.co) return false;
    return true;
  }

  /* ---- 一次性布局：真实时间 x + 贪心分层 y ---- */
  D.forEach(function (d) {
    var p = d.date.split('-');
    d.day = p.length > 2 ? parseInt(p[2], 10) : 15;
    d.x = xOf(d.y, d.m, d.day);
  });
  function layoutFull() {
    D.forEach(function (d) { d.x = xOf(d.y, d.m, d.day); });
    var lastX = LAYERS.map(function () { return -Infinity; });
    D.forEach(function (d) {
      var best = -1, bestScore = -Infinity;
      for (var i = 0; i < LAYERS.length; i++) {
        var gap = d.x - lastX[i];
        if (gap < MIN_GAP) continue;
        var sc = (Math.abs(LAYERS[i]) <= 30 ? 40 : 0) - Math.abs(LAYERS[i]) * .5 + Math.min(gap, MIN_GAP * 3) * .2;
        if (sc > bestScore) { bestScore = sc; best = i; }
      }
      if (best < 0) { best = 0; for (var j = 1; j < LAYERS.length; j++) if (lastX[j] < lastX[best]) best = j; }
      d.yPos = AXIS_Y + LAYERS[best];
      lastX[best] = d.x;
    });
  }
  /* 筛选：点等距铺满 x；层用 id 散列，避免规律波浪 */
  function layerHash(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  }
  function layoutFiltered(list) {
    var n = list.length, L = LAYERS.length;
    var sorted = list.slice().sort(function (a, b) {
      return xOf(a.y, a.m, a.day) - xOf(b.y, b.m, b.day);
    });
    sorted.forEach(function (d, i) {
      d.x = n === 1 ? X0 + (W - X0) / 2 : X0 + (i / (n - 1)) * (W - X0 - 60);
      d.yPos = AXIS_Y + LAYERS[layerHash(d.id) % L];
    });
  }
  layoutFull();

  /* ---- SVG ---- */
  var s = el('svg');
  attr(s, {viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', role: 'img',
    'aria-label': '2018 至 2026 模型发布编年轴'});
  s.appendChild(attr(el('line'), {x1: X0, y1: AXIS_Y, x2: W - 60, y2: AXIS_Y,
    stroke: 'var(--ink)', 'stroke-width': 2}));
  var ticks = el('g', 'tl-ticks');
  s.appendChild(ticks);
  host.appendChild(s);

  /* ---- 刻度：始终真实时间坐标；单年额外补月份 ---- */
  function drawTicks() {
    ticks.innerHTML = '';
    var from = filter.from === 'all' ? Y0 : +filter.from;
    var to = filter.to === 'all' ? Y1 : +filter.to;
    if (from > to) { var tmp = from; from = to; to = tmp; }
    var all = filter.from === 'all' && filter.to === 'all' && filter.co === 'all';
    var span = to - from + 1;
    function tx(frac) { return X0 + frac * (W - X0 - 60); }
    if (from === to) {
      for (var mm = 1; mm <= 12; mm++) {
        var x = all ? xOf(from, mm, 1) : tx((mm - 1) / 11);
        var t = el('text');
        attr(t, {x: x, y: AXIS_Y - 14, 'font-size': 32, 'font-family': 'var(--hand)',
          'text-anchor': 'middle', fill: mm === 1 ? 'var(--red)' : 'var(--ink-2)',
          stroke: 'var(--paper)', 'stroke-width': 6, 'paint-order': 'stroke'});
        t.textContent = mm + '月'; ticks.appendChild(t);
        ticks.appendChild(attr(el('line'), {x1: x, y1: AXIS_Y - 7, x2: x, y2: AXIS_Y + 7,
          stroke: mm === 1 ? 'var(--red)' : 'var(--muted)', 'stroke-width': mm === 1 ? 2 : 1}));
      }
    } else {
      for (var yr = from; yr <= to; yr++) {
        var xy = all ? xOf(yr, 1, 1) : tx((yr - from) / (span - 1));
        var ty = el('text');
        attr(ty, {x: xy, y: AXIS_Y - 14, 'font-size': 40, 'font-family': 'var(--hand)',
          'text-anchor': 'middle', fill: 'var(--red)',
          stroke: 'var(--paper)', 'stroke-width': 6, 'paint-order': 'stroke'});
        ty.textContent = yr; ticks.appendChild(ty);
        ticks.appendChild(attr(el('line'), {x1: xy, y1: AXIS_Y - 7, x2: xy, y2: AXIS_Y + 7,
          stroke: 'var(--red)', 'stroke-width': 2}));
      }
    }
  }
  drawTicks();

  /* ---- 点层 ---- */
  var layer = el('g', 'tl-layer');
  s.appendChild(layer);
  s.appendChild(ticks); // 刻度置于点之上，避免被密集点盖住
  var nodeEls = {};
  D.forEach(function (d, idx) {
    var g = el('g', 'tl-model');
    g.setAttribute('data-id', d.id);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', d.name + '，' + d.date);
    g.setAttribute('transform', 'translate(' + d.x.toFixed(1) + ',' + d.yPos.toFixed(1) + ')');

    var dy = AXIS_Y - d.yPos;
    g.appendChild(attr(el('line', 'tl-stem'), {
      x1: 0, y1: 0, x2: 0, y2: dy.toFixed(1),
      stroke: 'var(--rule)', 'stroke-width': 1, opacity: Math.abs(dy) > 20 ? 1 : 0}));

    var r = 10;
    if (d.logo) {
      var cid = 'clip-' + idx;
      var clip = el('clipPath'); clip.setAttribute('id', cid);
      clip.appendChild(attr(el('circle'), {cx: 0, cy: 0, r: r}));
      s.appendChild(clip);
      g.appendChild(attr(el('image'), {x: -r, y: -r, width: r * 2, height: r * 2,
        href: logoURL(d.logo), 'clip-path': 'url(#' + cid + ')'}));
    } else {
      g.appendChild(attr(el('circle'), {cx: 0, cy: 0, r: 8, fill: 'var(--muted)'}));
    }
    var label = el('text', 'tl-name');
    attr(label, {x: 0, y: 16, 'font-size': 20, 'font-family': 'var(--hand)', fill: 'var(--red)',
      'text-anchor': 'middle', stroke: 'var(--paper)', 'stroke-width': 4, 'paint-order': 'stroke', opacity: 0});
    label.textContent = d.name;
    g.appendChild(label);

    g.addEventListener('click', function () { showDetail(d); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetail(d); }
    });
    layer.appendChild(g);
    nodeEls[d.id] = {g: g, label: label, stem: g.querySelector('.tl-stem')};
  });

  /* ---- 写 transform；animate 时先设 transition 再下一任务改值，确保过渡触发 ---- */
  function writeTransform(d) {
    var n = nodeEls[d.id];
    n.g.setAttribute('transform', 'translate(' + d.x.toFixed(1) + ',' + d.yPos.toFixed(1) + ')');
    var dy = AXIS_Y - d.yPos;
    attr(n.stem, {y2: dy.toFixed(1)});
    n.stem.setAttribute('opacity', Math.abs(dy) > 20 ? '1' : '0');
  }
  function applyLayout(animate) {
    if (!animate) {
      D.forEach(function (d) { nodeEls[d.id].g.style.transition = 'none'; writeTransform(d); });
      return;
    }
    D.forEach(function (d) {
      nodeEls[d.id].g.style.transition = 'transform ' + MOTION + 'ms var(--ease)';
    });
    window.setTimeout(function () { D.forEach(writeTransform); }, 20);
  }
  applyLayout(false);

  /* ---- 筛选条：起始年 / 结束年 / 机构（自定义下拉带 logo）---- */
  var companies = {};
  D.forEach(function (d) {
    if (!companies[d.company]) companies[d.company] = {name: d.coName || d.company, logo: d.logo};
  });
  var bar = document.createElement('div');
  bar.className = 'tl-filter';
  function yearOpts(which) {
    var h = '<option value="all">' + (which === 'from' ? '起始年' : '结束年') + '</option>';
    for (var yr = Y0; yr <= Y1; yr++) h += '<option value="' + yr + '">' + yr + '</option>';
    return h;
  }
  var coKeys = Object.keys(companies).sort(function (a, b) {
    return companies[a].name.localeCompare(companies[b].name);
  });
  var coOptions = '<button type="button" class="co-opt on" data-co="all">' +
      '<img src="assets/logos/all.png" alt=""><span>全部</span></button>' +
    coKeys.map(function (k) {
      var c = companies[k];
      var img = c.logo ? '<img src="' + logoURL(c.logo) + '" alt="">' : '<i class="co-ph"></i>';
      return '<button type="button" class="co-opt" data-co="' + k + '">' + img +
        '<span>' + c.name + '</span></button>';
    }).join('');
  bar.innerHTML =
    '<span class="flt-label">年份</span>' +
    '<span class="flt-select"><select id="flt-from">' + yearOpts('from') + '</select></span>' +
    '<span class="tl-dash">—</span>' +
    '<span class="flt-select"><select id="flt-to">' + yearOpts('to') + '</select></span>' +
    '<span class="flt-label">机构</span>' +
    '<span class="co-picker"><button type="button" id="flt-co-trigger" aria-expanded="false">' +
      '<span id="co-current"><img src="assets/logos/all.png" alt="">全部</span>' +
      '<i class="co-caret"></i></button>' +
      '<span class="co-menu" id="co-menu">' + coOptions + '</span></span>' +
    '<button type="button" id="flt-reset">重置</button>';
  host.parentNode.insertBefore(bar, host);

  /* ---- viewBox（恒定宽高比；滚轮缩放/拖拽时变 x/w）---- */
  var vb = {x: 0, y: 0, w: W, h: H};
  function applyVB() { s.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); }

  /* ---- 筛选：点重排 + 刻度同步 + 显隐 ---- */
  function runFilter() {
    var all = filter.from === 'all' && filter.to === 'all' && filter.co === 'all';
    var list = D.filter(visible);
    // 点坐标：全部→真实时间；筛选→等距铺满（与刻度同坐标）
    if (all) layoutFull(); else layoutFiltered(list);
    D.forEach(function (d) {
      var on = visible(d), g = nodeEls[d.id].g;
      g.classList.toggle('out', !on);
      g.style.opacity = on ? '' : '0';
      g.style.pointerEvents = on ? '' : 'none';
    });
    applyLayout(true);
    drawTicks();
    ticks.classList.remove('redraw');
    void ticks.getBoundingClientRect();
    ticks.classList.add('redraw');
    // viewBox 恒定：宽高比不变，点大小稳定、不裁切
    vb.x = 0; vb.w = W; vb.y = 0; vb.h = H;
    applyVB();
    hidePop();
  }
  bar.querySelector('#flt-from').addEventListener('change', function (e) {
    filter.from = e.target.value; runFilter();
  });
  bar.querySelector('#flt-to').addEventListener('change', function (e) {
    filter.to = e.target.value; runFilter();
  });
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
    var img = filter.co === 'all' ? '<img src="assets/logos/all.png" alt="">'
      : (c && c.logo ? '<img src="' + logoURL(c.logo) + '" alt="">' : '<i class="co-ph"></i>');
    coCurrent.innerHTML = img + (c ? c.name : '全部');
    coMenu.querySelectorAll('.co-opt').forEach(function (o) { o.classList.toggle('on', o === opt); });
    coMenu.classList.remove('open');
    coTrigger.setAttribute('aria-expanded', 'false');
    runFilter();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.co-picker')) {
      coMenu.classList.remove('open');
      coTrigger.setAttribute('aria-expanded', 'false');
    }
  });
  bar.querySelector('#flt-reset').addEventListener('click', function () {
    filter = {from: 'all', to: 'all', co: 'all'};
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
  host.appendChild(pop);
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
      if (!visible(d)) return;
      var on = d.id === hoverId || d.id === selectedId;
      n.g.style.opacity = hoverId && !on ? '0.35' : '';
      n.label.setAttribute('opacity', on ? '1' : '0');
      n.g.classList.toggle('expanded', d.id === hoverId);
    });
  }
  function showPop(p) {
    pop.innerHTML = '<em>' + p.name + ' · ' + p.coName + ' · ' + p.date + '</em>';
    var hr = host.getBoundingClientRect();
    var pt = s.createSVGPoint(); pt.x = p.x; pt.y = p.yPos;
    var screen = pt.matrixTransform(s.getScreenCTM());
    var px = screen.x - hr.left, py = screen.y - hr.top;
    pop.style.left = Math.max(8, Math.min(hr.width - 220, px - 110)) + 'px';
    pop.style.top = (py + 24) + 'px';
    pop.classList.add('on');
  }
  function hidePop() { pop.classList.remove('on'); }

  s.addEventListener('pointermove', function (e) {
    if (dragging && dragStart) return;
    var p = nearest(e.clientX);
    var id = p ? p.id : null;
    if (id !== hoverId) {
      hoverId = id; applyHighlight();
      if (p) showPop(p); else hidePop();
    }
  });
  s.addEventListener('pointerleave', function () { hoverId = null; applyHighlight(); hidePop(); });

  /* ---- 滚轮缩放 / 拖拽平移 ---- */
  function zoomAt(factor, cx) {
    var nw = Math.max(W * .06, Math.min(W, vb.w / factor));
    vb.x = cx - (cx - vb.x) * (nw / vb.w);
    vb.w = nw; vb.y = 0; vb.h = H;
    if (vb.w >= W * .999) { vb.x = 0; vb.w = W; }
    vb.x = Math.max(0, Math.min(W - vb.w, vb.x));
    applyVB();
  }
  s.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var loc = pt.matrixTransform(s.getScreenCTM().inverse());
    zoomAt(e.deltaY < 0 ? 1.25 : .8, loc.x);
  }, {passive: false});
  var dragging = false, dragStart = null;
  s.addEventListener('pointerdown', function (e) {
    dragging = true; dragStart = {x: e.clientX, vx: vb.x};
    s.setPointerCapture(e.pointerId);
  });
  s.addEventListener('pointermove', function (e) {
    if (!dragging || !dragStart) return;
    var dx = (e.clientX - dragStart.x) / s.getBoundingClientRect().width * vb.w;
    vb.x = Math.max(0, Math.min(W - vb.w, dragStart.vx - dx));
    applyVB();
  });
  s.addEventListener('pointerup', function () { dragging = false; dragStart = null; });
  s.addEventListener('pointercancel', function () { dragging = false; dragStart = null; });

  /* ---- 点击详情 ---- */
  function showDetail(d) {
    var p = document.getElementById('timeline-detail');
    if (p) {
      var lg = d.logo ? '<img class="d-logo" src="' + logoURL(d.logo) + '" alt="">' : '';
      p.innerHTML = '<div class="d-card">' + lg + '<div><b>' + d.name +
        '</b><span>' + d.coName + ' · ' + d.date + '</span></div></div>';
      p.classList.add('has-content');
    }
    selectedId = d.id;
    applyHighlight();
  }
})();
