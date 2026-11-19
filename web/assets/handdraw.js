/* Model Annals — 手绘线条引擎（移植自 z-wanghong-handwritten-ppt runtime.js）
   给标记元素生成 SVG 手绘线条：短红线 / 蓝线 / 红框 / 绿荧光 / 圆圈。
   线条用固定种子随机，同一元素每次打开长得一样。滚动进入视口时逐笔画出。 */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 固定种子伪随机
  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function svgEl(w, h) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'draw-svg');
    s.setAttribute('width', w);
    s.setAttribute('height', h);
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    return s;
  }
  function path(d, color, width) {
    var p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('class', 'draw-stroke');
    p.setAttribute('d', d);
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', width || 3);
    return p;
  }

  /* 一条略带起伏的线：from (x1,y1) to (x2,y2) */
  function wavyLine(x1, y1, x2, y2, rnd, wobble) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var a1 = (rnd() - .5) * (wobble || 4);
    var a2 = (rnd() - .5) * (wobble || 4);
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      ' Q' + (mx + nx * a1).toFixed(1) + ' ' + (my + ny * a1).toFixed(1) +
      ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }

  function underline(el, color) {
    var rnd = seeded(hash(el.textContent + color));
    var w = el.offsetWidth + 16, h = 16;
    var s = svgEl(w, h);
    var y = 6;
    s.appendChild(path(wavyLine(4, y, w - 4, y - (rnd() - .5) * 3, rnd, 3), color, 3));
    el.appendChild(s);
    // 线落在文字下缘：SVG 顶部对齐到文字底部附近
    s.style.left = '-8px';
    s.style.top = 'calc(100% - 10px)';
    return s;
  }

  function highlight(el) {
    var rnd = seeded(hash(el.textContent + 'hl'));
    var w = el.offsetWidth + 16, h = el.offsetHeight + 12;
    var s = svgEl(w, h);
    var y = h * .55;
    var d = 'M4 ' + y.toFixed(1) +
      ' C' + (w * .3).toFixed(1) + ' ' + (y - 3).toFixed(1) + ',' +
      (w * .7).toFixed(1) + ' ' + (y + 3).toFixed(1) + ',' +
      (w - 4).toFixed(1) + ' ' + (y - 1).toFixed(1) +
      ' L' + (w - 4).toFixed(1) + ' ' + (h - 3) +
      ' C' + (w * .7).toFixed(1) + ' ' + (h - 1) + ',' +
      (w * .3).toFixed(1) + ' ' + (h - 5) + ',' +
      '4 ' + (h - 3) + ' Z';
    var p = path(d, 'var(--hl-green)', h * .62);
    p.setAttribute('stroke', 'rgba(126,232,92,.5)');
    s.appendChild(p);
    el.appendChild(s);
    s.style.left = '-8px'; s.style.top = '-2px';
    return s;
  }

  function circle(el) {
    var rnd = seeded(hash(el.textContent + 'circle'));
    var w = el.offsetWidth + 24, h = el.offsetHeight + 16;
    var s = svgEl(w, h);
    var cx = w / 2, cy = h / 2, rx = w / 2 - 6, ry = h / 2 - 4;
    var d = 'M' + (cx - rx + 6).toFixed(1) + ' ' + (cy + 4).toFixed(1) +
      ' C' + (cx - rx).toFixed(1) + ' ' + (cy - ry).toFixed(1) + ',' +
      (cx + rx).toFixed(1) + ' ' + (cy - ry + 4).toFixed(1) + ',' +
      (cx + rx - 4).toFixed(1) + ' ' + (cy - 2).toFixed(1) +
      ' C' + (cx + rx).toFixed(1) + ' ' + (cy + ry).toFixed(1) + ',' +
      (cx - rx + 2).toFixed(1) + ' ' + (cy + ry).toFixed(1) + ',' +
      (cx - rx + 8).toFixed(1) + ' ' + (cy + 1).toFixed(1);
    s.appendChild(path(d, 'var(--red)', 2.5));
    el.appendChild(s);
    s.style.left = '-12px'; s.style.top = '-8px';
    return s;
  }

  function box(el, color) {
    var rnd = seeded(hash(el.textContent.slice(0, 40) + (color || 'box')));
    var pad = 12; // 框外扩，文字不贴边
    var w = el.offsetWidth + pad * 2, h = el.offsetHeight + pad * 2;
    var s = svgEl(w, h);
    var ext = 7;
    var x1 = pad, y1 = pad, x2 = w - pad, y2 = h - pad;
    // 四条边，四角出头交叉（手画矩形特征）
    s.appendChild(path(wavyLine(x1 - ext, y1 + 2, x2 + ext, y1 - 1, rnd, 3), color, 2.5));
    s.appendChild(path(wavyLine(x2 - 2, y1 - ext, x2 + 1, y2 + ext, rnd, 3), color, 2.5));
    s.appendChild(path(wavyLine(x2 + ext, y2 - 2, x1 - ext, y2 + 1, rnd, 3), color, 2.5));
    s.appendChild(path(wavyLine(x1 + 2, y2 + ext, x1 - 1, y1 - ext, rnd, 3), color, 2.5));
    el.insertBefore(s, el.firstChild);
    s.style.left = '-' + pad + 'px'; s.style.top = '-' + pad + 'px';
    return s;
  }

  /* 收集所有标记元素，生成线条；返回带 svg 的元素列表 */
  function buildMarks() {
    var items = [];
    document.querySelectorAll('[data-underline]').forEach(function (el) { items.push({ el: el, svg: underline(el, 'var(--red)') }); });
    document.querySelectorAll('[data-underline-blue]').forEach(function (el) { items.push({ el: el, svg: underline(el, 'var(--blue)') }); });
    document.querySelectorAll('[data-highlight]').forEach(function (el) { items.push({ el: el, svg: highlight(el) }); });
    document.querySelectorAll('[data-circle]').forEach(function (el) { items.push({ el: el, svg: circle(el) }); });
    document.querySelectorAll('[data-box]').forEach(function (el) { items.push({ el: el, svg: box(el, 'var(--ink)') }); });
    document.querySelectorAll('[data-box-red]').forEach(function (el) { items.push({ el: el, svg: box(el, 'var(--red)') }); });

    // 逐笔绘制：用 stroke-dasharray / dashoffset 动画
    items.forEach(function (it) {
      it.svg.querySelectorAll('path').forEach(function (p) {
        var len = p.getTotalLength ? p.getTotalLength() : 0;
        if (!len) return;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = prefersReduced ? '0' : len;
        p.style.transition = 'stroke-dashoffset .7s var(--ease)';
      });
    });
    return items;
  }

  /* Hero 手绘时间轴 SVG */
  function buildHeroArt() {
    var host = document.getElementById('hero-art');
    if (!host) return;
    var w = 760, h = 150;
    var s = svgEl(w, h);
    // 右侧给最后一个年份标签留空间，避免被 viewBox 裁掉
    s.setAttribute('viewBox', '0 0 800 ' + h);
    s.removeAttribute('width'); s.removeAttribute('height');
    s.classList.remove('draw-svg');
    s.classList.add('hero-svg');
    s.style.width = '100%'; s.style.height = 'auto';
    s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // 主轴（略起伏）
    s.appendChild(path('M10 96 C180 92, 460 100, 700 92', 'var(--ink)', 2.5));
    var years = ['2017', '2018', '2020', '2022', '2024', '2026'];
    var xs = [40, 165, 290, 415, 540, 665];
    years.forEach(function (yr, i) {
      var x = xs[i], y = 95 - (i > 3 ? (i - 3) * 7 : 0);
      var dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      dot.setAttribute('r', i === 3 || i === 5 ? 6 : 4);
      dot.setAttribute('fill', i === 3 || i === 5 ? 'var(--red)' : 'var(--paper)');
      dot.setAttribute('stroke', i === 3 || i === 5 ? 'var(--red)' : 'var(--ink)');
      dot.setAttribute('stroke-width', '2');
      s.appendChild(dot);
      var t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', 128);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '22');
      t.setAttribute('font-family', 'var(--hand)');
      t.setAttribute('fill', 'var(--muted)');
      t.textContent = yr;
      s.appendChild(t);
    });
    // 一个手绘箭头标注
    s.appendChild(path('M415 70 C425 50, 455 44, 490 48', 'var(--blue)', 2));
    s.appendChild(path('M482 42 L492 48 L480 55', 'var(--blue)', 2));
    var lab = document.createElementNS(SVGNS, 'text');
    lab.setAttribute('x', 450); lab.setAttribute('y', 38);
    lab.setAttribute('text-anchor', 'middle'); lab.setAttribute('font-size', '20');
    lab.setAttribute('fill', 'var(--blue)'); lab.setAttribute('font-family', 'var(--hand)');
    lab.textContent = '对齐转折';
    s.appendChild(lab);
    host.appendChild(s);
  }

  /* 谱系思维导图 */
  function buildLineage() {
    var host = document.getElementById('lineage-map');
    if (!host) return;
    var nodes = [
      { id: 'core', label: '大模型', x: 50, y: 50, core: true },
      { id: 'scale', label: '规模', x: 15, y: 16 },
      { id: 'align', label: '对齐', x: 50, y: 14, blue: true },
      { id: 'reason', label: '推理', x: 85, y: 16 },
      { id: 'open', label: '开源', x: 15, y: 84 },
      { id: 'multi', label: '多模态', x: 50, y: 86, blue: true },
      { id: 'agent', label: '智能体', x: 85, y: 84 },
    ];
    // 连线层
    var svg = svgEl(100, 100);
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.classList.add('lin-link');
    nodes.slice(1).forEach(function (n) {
      var rnd = seeded(hash(n.id));
      var cx = 50, cy = 50;
      var d = 'M' + cx + ' ' + cy + ' Q' + ((cx + n.x) / 2 + (rnd() - .5) * 8).toFixed(1) +
        ' ' + ((cy + n.y) / 2 + (rnd() - .5) * 8).toFixed(1) + ' ' + n.x + ' ' + n.y;
      var p = path(d, n.blue ? 'var(--blue)' : 'var(--ink)', .35);
      p.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(p);
    });
    host.appendChild(svg);
    // 节点层
    nodes.forEach(function (n) {
      var el = document.createElement('div');
      el.className = 'lin-node' + (n.core ? ' core' : '') + (n.blue ? ' blue' : '');
      el.style.left = n.x + '%'; el.style.top = n.y + '%';
      el.textContent = n.label;
      host.appendChild(el);
    });
  }

  /* 滚动进入视口：显示元素 + 画线条 */
  function observe() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.draw-svg path'));
    // 把 svg 的绘制绑定到其父元素进入视口
    var targets = new Map();
    document.querySelectorAll('.tl-item,.stat-block,.hero-inner,#lineages,.note-item,.takeaway,.closing').forEach(function (el) {
      targets.set(el, []);
    });
    document.querySelectorAll('.draw-svg').forEach(function (svg) {
      var p = svg.closest('.tl-item,.stat-block,.hero-inner,#lineages,.note-item,.takeaway,.closing') || svg.parentElement;
      if (!targets.has(p)) targets.set(p, []);
      targets.get(p).push(svg);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        (targets.get(el) || []).forEach(function (svg) {
          svg.querySelectorAll('path').forEach(function (p) {
            var len = p.getTotalLength ? p.getTotalLength() : 0;
            if (len) p.style.strokeDashoffset = '0';
          });
        });
        io.unobserve(el);
      });
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (_, el) { io.observe(el); });
  }

  /* 进度条 + 导航高亮 */
  function chrome() {
    var bar = document.getElementById('progress');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
      var y = window.scrollY + window.innerHeight * .35;
      var active = 0;
      secs.forEach(function (s, i) { if (s && s.offsetTop <= y) active = i; });
      links.forEach(function (a, i) { a.classList.toggle('active', i === active); });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* 启动 */
  window.addEventListener('DOMContentLoaded', function () {
    // 标记脚本已启用：隐藏态只在此时生效，脚本失效时内容默认可见
    document.documentElement.classList.add('js');
    buildHeroArt();
    buildLineage();
    // 等字体加载完再量尺寸画标记线，避免错位
    var start = function () {
      buildMarks();
      observe();
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start).catch(start);
    } else {
      window.addEventListener('load', start);
    }
    chrome();
  });
})();
