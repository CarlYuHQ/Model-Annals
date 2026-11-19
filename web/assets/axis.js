/* Model Annals — 编年长轴（形式参考 CarlYuHQ/ccfddls DeadlineAxis）
   按年月聚合成节点，等距铺在水平轴上，上下交替 chip，点大小按该月模型数分级。
   hover 就近吸附展开该月模型列表，其余 chip 淡化。缩放用 CSS transform 保留。 */
(function () {
  'use strict';
  var D = window.TIMELINE_DATA || [];
  var host = document.getElementById('axis-root');
  if (!host || !D.length) return;

  var LOGO = {openai:'openai',anthropic:'anthropic',google:'deepmind',meta:'meta',xai:'x',
    nvidia:'nvidia',mistral:'mistral',cohere:'cohere',ai21:'ai21',deepseek:'deepseek',
    alibaba:'qwenlm',bytedance:'bytedance',moonshot:'moonshot',zhipu:'zhipuai',
    minimax:'minimaxi',tencent:'tencent',huawei:'huawei',stepfun:'stepfun',
    '01ai':'01ai',internlm:'internlm',baidu:'baidu'};
  var logoURL = function (l) { return l ? 'assets/logos/' + l + '.png' : ''; };

  /* ---- 按年月分组 ---- */
  var groups = {};
  D.forEach(function (m) {
    var key = m.y + '-' + String(m.m).padStart(2, '0');
    (groups[key] = groups[key] || { key: key, y: m.y, m: m.m, items: [] }).items.push(m);
  });
  var pts = Object.keys(groups).map(function (k) { return groups[k]; })
    .sort(function (a, b) { return a.key.localeCompare(b.key); });
  pts.forEach(function (p, i) { p.index = i; });

  /* ---- 等距分布 5% - 95% ---- */
  var n = pts.length;
  pts.forEach(function (p, i) { p.left = n === 1 ? 50 : 5 + (i / (n - 1)) * 90; });

  /* ---- 稀疏常驻标签（minGap 9%）---- */
  var standing = {};
  var last = -Infinity;
  pts.slice().sort(function (a, b) { return a.left - b.left; }).forEach(function (p) {
    if (p.left - last >= 9) { standing[p.key] = true; last = p.left; }
  });
  if (pts.length) standing[pts[0].key] = true;
  if (pts.length > 1) standing[pts[n - 1].key] = true;

  var maxCount = Math.max.apply(null, pts.map(function (p) { return p.items.length; }));
  var hoverKey = null;
  // 常驻 chip 按显示顺序上下交替（而非全部节点索引）
  var chipIndex = 0;
  pts.forEach(function (p) {
    p.side = standing[p.key] ? (chipIndex++ % 2 === 0 ? 'above' : 'below') : 'below';
  });

  /* ---- 构建 DOM ---- */
  var html = '<div class="ax-board"><div class="ax-scroll"><div class="ax-stage" id="ax-stage">';
  html += '<div class="ax-track"><div class="ax-line"></div></div>';
  pts.forEach(function (p, i) {
    var size = p.items.length >= maxCount * .6 ? 'lg' : (p.items.length >= maxCount * .3 ? 'md' : 'sm');
    var side = p.side;
    var align = p.left <= 14 ? 'start' : (p.left >= 86 ? 'end' : 'center');
    var featured = p.items[p.items.length - 1];
    var label = p.y + '·' + String(p.m).padStart(2, '0');
    var hasChip = standing[p.key];
    html += '<div class="ax-node side-' + side + ' align-' + align + (hasChip ? ' has-chip' : ' dot-only') +
      '" data-key="' + p.key + '" style="left:' + p.left.toFixed(2) + '%">';
    if (hasChip) {
      html += '<button class="ax-chip" tabindex="-1" data-key="' + p.key + '"><strong>' + label +
        '</strong><span>' + p.items.length + ' 个模型</span></button>';
    }
    html += '<span class="ax-stem"></span><span class="ax-dot size-' + size + '"></span>';
    if (!hasChip) html += '<button class="ax-hit" tabindex="-1" data-key="' + p.key + '" aria-label="' + label + '"></button>';
    // 展开列表
    html += '<div class="ax-pop" data-key="' + p.key + '"><em>' + label + ' · ' + p.items.length + ' 个模型</em><ul>';
    p.items.forEach(function (m) {
      var lg = m.logo ? '<img src="' + logoURL(m.logo) + '" alt="">' : '<i class="ax-ph"></i>';
      html += '<li><span class="ax-logo">' + lg + '</span><span class="ax-mi"><b>' + m.name + '</b><small>' +
        (m.ctx ? m.ctx + 'K' : '—') + '</small></span></li>';
    });
    html += '</ul></div>';
    html += '</div>';
  });
  html += '</div></div></div>';
  host.innerHTML = html;

  var stage = document.getElementById('ax-stage');
  var nodes = Array.prototype.slice.call(host.querySelectorAll('.ax-node'));

  /* ---- 就近吸附 ---- */
  function nearest(clientX) {
    var rect = stage.getBoundingClientRect();
    var pct = ((clientX - rect.left) / rect.width) * 100;
    var best = null, bd = Infinity;
    pts.forEach(function (p) {
      var d = Math.abs(p.left - pct);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }
  function apply() {
    host.querySelectorAll('.ax-pop').forEach(function (el) { el.classList.remove('on'); });
    nodes.forEach(function (nd) {
      nd.classList.toggle('expanded', nd.getAttribute('data-key') === hoverKey);
    });
    if (hoverKey) {
      var pop = host.querySelector('.ax-pop[data-key="' + hoverKey + '"]');
      if (pop) pop.classList.add('on');
    }
  }
  stage.addEventListener('pointermove', function (e) {
    var p = nearest(e.clientX);
    var k = p ? p.key : null;
    if (k !== hoverKey) { hoverKey = k; apply(); }
  });
  stage.addEventListener('pointerleave', function () { hoverKey = null; apply(); });
  // 点击定位到模型页
  host.addEventListener('click', function (e) {
    var t = e.target.closest('[data-key]');
    if (t && t.classList.contains('ax-chip')) {
      location.href = 'models.html#' + t.getAttribute('data-key');
    }
  });

  /* ---- 缩放（transform）---- */
  var scale = 1;
  var scroller = host.querySelector('.ax-scroll');
  function setScale(v) {
    scale = Math.max(1, Math.min(4, v));
    stage.style.width = (scale * 100) + '%';
    var z = document.getElementById('axis-zoom');
    if (z) z.textContent = Math.round(scale * 100) + '%';
  }
  var zi = document.getElementById('axis-in'), zo = document.getElementById('axis-out'), zr = document.getElementById('axis-all');
  if (zi) zi.addEventListener('click', function () { setScale(scale + 0.5); });
  if (zo) zo.addEventListener('click', function () { setScale(scale - 0.5); });
  if (zr) zr.addEventListener('click', function () { setScale(1); scroller.scrollLeft = 0; });
  host.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setScale(scale + (e.deltaY < 0 ? 0.3 : -0.3));
  }, { passive: false });
})();
