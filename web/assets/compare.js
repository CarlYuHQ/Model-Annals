/* Model Annals — 对比视图与导航状态管理
   依赖：compare-data.js（window.COMPARE_DATA）。
   负责：手绘散点图、点选联动详情、规格表、视图切换（含 URL hash）、键盘切换章节、回到顶部。 */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var D = window.COMPARE_DATA || [];
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls) {
    var e = document.createElementNS(SVGNS, tag);
    if (cls) e.setAttribute('class', cls);
    return e;
  }
  function attr(node, obj) {
    Object.keys(obj).forEach(function (k) { node.setAttribute(k, obj[k]); });
    return node;
  }
  function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ---------- 手绘散点图：X=时间, Y=上下文 ---------- */
  function buildChart() {
    var host = document.getElementById('compare-chart');
    if (!host || !D.length) return;
    var W = 920, H = 460, m = { t: 28, r: 28, b: 56, l: 72 };
    var svg = el('svg', 'cmp-svg');
    attr(svg, { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', role: 'img' });

    var years = D.map(function (d) { return parseInt(d.date.slice(0, 4), 10); });
    var yMin = Math.min.apply(null, years) - 1, yMax = Math.max.apply(null, years) + 1;
    var ctxMin = 0, ctxMax = 1100;
    var X = function (yr) { return m.l + (yr - yMin) / (yMax - yMin) * (W - m.l - m.r); };
    var Y = function (ctx) { return H - m.b - (ctx - ctxMin) / (ctxMax - ctxMin) * (H - m.t - m.b); };

    // 网格与轴（细线，王虹风）
    [0, 256, 512, 768, 1024].forEach(function (v) {
      var y = Y(v);
      svg.appendChild(el('line', 'cmp-grid'));
      var ln = svg.lastChild;
      attr(ln, { x1: m.l, y1: y, x2: W - m.r, y2: y, stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '2 5' });
      var t = el('text', 'cmp-axis');
      attr(t, { x: m.l - 12, y: y + 4, 'text-anchor': 'end' });
      t.textContent = v + 'K';
      svg.appendChild(t);
    });
    for (var yr = yMin; yr <= yMax; yr++) {
      var x = X(yr);
      var t2 = el('text', 'cmp-axis');
      attr(t2, { x: x, y: H - m.b + 26, 'text-anchor': 'middle' });
      t2.textContent = yr;
      svg.appendChild(t2);
    }
    // 轴线（略手绘感：轻微起伏）
    svg.appendChild(attr(el('line'), { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
    svg.appendChild(attr(el('line'), { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.5 }));

    var rnd = seeded(20261119);
    var pts = D.map(function (d) {
      var year = parseInt(d.date.slice(0, 4), 10) + (parseInt(d.date.slice(5, 7) || '6', 10) - 1) / 12;
      return { d: d, cx: X(year), cy: Y(d.ctx) };
    });

    // 标签避让：按 y 排序，逐个找不与已放置标签碰撞的位置
    var placed = [];
    var LABEL_H = 18;
    function collides(x, y, w) {
      return placed.some(function (p) {
        return Math.abs(x - p.x) < (w + p.w) / 2 + 8 && Math.abs(y - p.y) < LABEL_H + 4;
      });
    }
    pts.forEach(function (p) {
      var name = p.d.name.length > 15 ? p.d.name.slice(0, 14) + '…' : p.d.name;
      var w = name.length * 9;
      var base = -18;
      var offsets = [base, 24, -38, 44, -58, 64, -78, 84, -98, 104, -118, 124];
      var chosen = base, chosenX = p.cx;
      // 先试正上方，再试上下错位；仍碰撞则左右拉开
      var found = false;
      for (var k = 0; k < offsets.length && !found; k++) {
        if (!collides(p.cx, p.cy + offsets[k], w)) { chosen = offsets[k]; found = true; }
      }
      if (!found) {
        var shifts = [0, -50, 50, -100, 100, -150, 150];
        for (var s = 0; s < shifts.length && !found; s++) {
          for (var k2 = 0; k2 < offsets.length; k2++) {
            if (!collides(p.cx + shifts[s], p.cy + offsets[k2], w)) {
              chosen = offsets[k2]; chosenX = p.cx + shifts[s]; found = true; break;
            }
          }
        }
      }
      p.labelY = p.cy + chosen;
      p.labelX = chosenX;
      p.labelW = w;
      placed.push({ x: chosenX, y: p.labelY, w: w });
    });

    pts.forEach(function (p) {
      var d = p.d, cx = p.cx, cy = p.cy;
      var g = el('g', 'cmp-point');
      g.setAttribute('data-id', d.id);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', d.name + '，上下文 ' + d.ctx + 'K');

      var color = d.region === 'cn' ? 'var(--red)' : (d.region === 'us' ? 'var(--blue)' : 'var(--green)');
      var open = (d.license === 'open' || d.license === 'weighted');
      // 引出线：标签离点远时连一条细线
      if (Math.abs(p.labelY - cy) > 26 || Math.abs(p.labelX - cx) > 8) {
        g.appendChild(attr(el('line'), {
          x1: cx, y1: cy, x2: p.labelX, y2: p.labelY + (p.labelY < cy ? 6 : -12),
          stroke: color, 'stroke-width': 1, 'stroke-opacity': .45
        }));
      }
      var dot = el('circle', 'cmp-dot');
      attr(dot, {
        cx: cx, cy: cy, r: 8,
        fill: open ? 'var(--paper)' : color,
        stroke: color, 'stroke-width': 2.5
      });
      g.appendChild(dot);

      var lab = el('text', 'cmp-label');
      attr(lab, { x: p.labelX, y: p.labelY, 'text-anchor': 'middle' });
      lab.textContent = d.name.length > 15 ? d.name.slice(0, 14) + '…' : d.name;
      g.appendChild(lab);

      g.addEventListener('click', function () { select(d.id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(d.id); }
      });
      svg.appendChild(g);
    });

    host.appendChild(svg);
  }

  /* ---------- 规格表 ---------- */
  function buildTable() {
    var tb = document.getElementById('compare-tbody');
    if (!tb || !D.length) return;
    var licLabel = { open: '开放', weighted: '受限', proprietary: '闭源' };
    tb.innerHTML = D.map(function (d) {
      return '<tr data-id="' + d.id + '">' +
        '<td>' + d.name + '</td>' +
        '<td>' + d.company + '</td>' +
        '<td>' + d.date + '</td>' +
        '<td>' + d.ctx + 'K</td>' +
        '<td>' + (d.param ? d.param + 'B' : '—') + '</td>' +
        '<td>' + (licLabel[d.license] || d.license) + '</td>' +
        '</tr>';
    }).join('');
    tb.querySelectorAll('tr').forEach(function (tr) {
      tr.addEventListener('click', function () {
        select(tr.getAttribute('data-id'));
        switchView('chart');
      });
    });
  }

  /* ---------- 点选联动详情 ---------- */
  function select(id) {
    var d = D.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    var licLabel = { open: '开放权重', weighted: '受限开源', proprietary: '闭源' };
    var panel = document.getElementById('model-detail');
    panel.innerHTML =
      '<h3 class="detail-name">' + d.name + '</h3>' +
      '<div class="detail-meta">' +
        '<span>机构 <b>' + d.company + '</b></span>' +
        '<span>发布 <b>' + d.date + '</b></span>' +
        '<span>上下文 <b>' + d.ctx + 'K</b></span>' +
        '<span>参数 <b>' + (d.param ? d.param + 'B' : '未公开') + '</b></span>' +
        '<span>许可 <b>' + (licLabel[d.license] || d.license) + '</b></span>' +
        '<span>模态 <b>' + d.modality.replace(/,/g, '、') + '</b></span>' +
      '</div>' +
      '<p class="detail-note">' + d.note + '。数据来自档案快照，截止 2026-11-19。</p>';
    // 高亮散点
    document.querySelectorAll('.cmp-dot').forEach(function (dot) {
      var g = dot.parentNode;
      dot.classList.toggle('sel', g.getAttribute('data-id') === id);
      dot.setAttribute('r', g.getAttribute('data-id') === id ? 12 : 8);
    });
  }

  /* ---------- 视图切换 + hash 同步 ---------- */
  var VIEWS = ['chart', 'table', 'diff'];
  function switchView(view, updateHash) {
    if (VIEWS.indexOf(view) < 0) view = 'chart';
    document.querySelectorAll('.viewtab').forEach(function (b) {
      var on = b.getAttribute('data-view') === view;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.viewpanel').forEach(function (p) {
      p.classList.toggle('on', p.id === 'view-' + view);
    });
    var hints = { chart: '每个点只画公开披露的上下文长度', table: '点击任意行回到坐标图查看', diff: '仅比较公开披露的规格' };
    var h = document.getElementById('view-hint');
    if (h) h.textContent = hints[view];
    // 通知手绘引擎为刚显示的面板补画标记线
    var panel = document.getElementById('view-' + view);
    if (panel) window.dispatchEvent(new CustomEvent('annals:viewshown', { detail: { root: panel } }));
    if (updateHash !== false && location.hash.indexOf('#compare') === 0) {
      history.replaceState(null, '', '#compare/' + view);
    }
  }

  function initViewTabs() {
    document.querySelectorAll('.viewtab').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var i = VIEWS.indexOf(b.getAttribute('data-view'));
        i = (i + (e.key === 'ArrowRight' ? 1 : -1) + VIEWS.length) % VIEWS.length;
        switchView(VIEWS[i]);
        document.querySelector('.viewtab[data-view="' + VIEWS[i] + '"]').focus();
      });
    });
    // 从 hash 恢复视图
    var m = location.hash.match(/^#compare\/(chart|table|diff)$/);
    if (m) switchView(m[1], false);
  }

  /* ---------- 导航状态 + 键盘切换章节 + 回到顶部 ---------- */
  function initNav() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
    var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var top = document.getElementById('to-top');
    var ticking = false;

    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY + window.innerHeight * .35;
      var active = 0;
      sections.forEach(function (s, i) { if (s && s.offsetTop <= y) active = i; });
      navLinks.forEach(function (a, i) {
        var on = i === active;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      if (top) top.classList.toggle('show', window.scrollY > 600);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    // 键盘左右切换章节（焦点不在输入/按钮内时）
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button' || tag === 'a') return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var cur = navLinks.findIndex(function (a) { return a.classList.contains('active'); });
      if (cur < 0) cur = 0;
      var next = cur + (e.key === 'ArrowRight' ? 1 : -1);
      if (next < 0 || next >= navLinks.length) return;
      e.preventDefault();
      var target = sections[next];
      if (target) {
        history.replaceState(null, '', navLinks[next].getAttribute('href'));
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    });
  }

  /* ---------- 启动 ---------- */
  function start() {
    buildChart();
    buildTable();
    initViewTabs();
    initNav();
    // hash 指向 compare 时，滚动到对比章节
    if (location.hash.indexOf('#compare') === 0) {
      var sec = document.getElementById('compare');
      if (sec) setTimeout(function () { sec.scrollIntoView(); }, 60);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
