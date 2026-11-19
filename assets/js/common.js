/* ============================================================================
   LLM Evolution Atlas — 公共逻辑
   依赖：data/atlas.js（window.ATLAS）、data/world.js（window.WORLD，仅地图页）
   ========================================================================== */
(function () {
  'use strict';
  const A = window.ATLAS;
  if (!A) { console.error('ATLAS 数据未加载'); return; }

  const NAV = [
    ['index.html', '总览'],
    ['timeline.html', '时间线'],
    ['graph.html', '关系图谱'],
    ['lineage.html', '模型家谱'],
    ['stats.html', '数据观察'],
    ['geo.html', '地理分布'],
    ['catalog.html', '模型索引'],
    ['sources.html', '数据来源'],
  ];

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));
  const COMPANIES = byId(A.companies);
  const MODELS = byId(A.models);
  const TECHS = byId(A.technologies);

  const companyName = (id) => COMPANIES[id] ? (COMPANIES[id].name_zh || COMPANIES[id].name) : (id || '—');
  const licenseLabel = { open: '开放权重', weighted: '受限开源', proprietary: '闭源' };

  function fmtDate(d) {
    if (!d) return '—';
    const p = String(d).split('-');
    if (p.length === 1) return p[0];
    if (p.length === 2) return `${p[0]}.${p[1]}`;
    return `${p[0]}.${p[1]}.${p[2]}`;
  }

  /* ---------- 滚动进度条 ---------- */
  function initProgress(){
    let bar=document.getElementById('progress');
    if(!bar){bar=document.createElement('div');bar.id='progress';document.body.prepend(bar);}
    let ticking=false;
    const update=()=>{
      const h=document.documentElement.scrollHeight-window.innerHeight;
      const pct=h>0?(window.scrollY/h*100):0;
      bar.style.width=pct+'%';
      ticking=false;
    };
    window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true;}},{passive:true});
    update();
  }

  /* ---------- 渲染报头与导航 ---------- */
  function renderChrome(activeKey) {
    initProgress();
    const mh = document.getElementById('masthead');
    if (mh) {
      mh.className = 'masthead';
      mh.innerHTML = `
        <div class="masthead-inner">
          <div class="brand">
            <span class="brand-mark">Atlas · Vol. 01</span>
            <a class="brand-title" href="index.html">Model Annals · 大模型编年史</a>
            <span class="brand-sub">MODEL ANNALS · 2017—2026</span>
          </div>
          <div class="masthead-meta">
            收录 <b>${A.stats.models}</b> 个模型 · <b>${A.stats.companies}</b> 家机构<br>
            <b>${A.stats.technologies}</b> 项关键技术 · <b>${A.stats.events}</b> 个事件<br>
            更新于 ${A.meta.updated}
          </div>
        </div>`;
    }
    const nb = document.getElementById('navbar');
    if (nb) {
      nb.className = 'navbar';
      nb.innerHTML = `<nav class="navbar-inner">${NAV.map(([href, label]) =>
        `<a href="${href}" class="${activeKey === href ? 'active' : ''}">${label}</a>`
      ).join('')}</nav>`;
    }
  }

  /* ---------- 详情抽屉 ---------- */
  let backdrop, drawer;
  function ensureDrawer() {
    if (drawer) return;
    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.addEventListener('click', closeDrawer);
    document.body.appendChild(backdrop);
    drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', '详情');
    drawer.innerHTML = '<button class="close" aria-label="关闭">关闭 ×</button><div id="drawer-content"></div>';
    drawer.querySelector('.close').addEventListener('click', closeDrawer);
    document.body.appendChild(drawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }
  function openDrawer(html) {
    ensureDrawer();
    document.getElementById('drawer-content').innerHTML = html;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.scrollTop = 0;
  }

  function openModel(id) {
    const m = MODELS[id]; if (!m) return;
    const pred = m.predecessor && MODELS[m.predecessor];
    const hl = (m.highlights || []).map(h => `<li>${esc(h)}</li>`).join('');
    const succ = A.models.filter(x => x.predecessor === id).slice(0, 8);
    openDrawer(`
      <span class="d-kicker">模型档案 / ${esc(m.family || 'MODEL')}</span>
      <h2>${esc(m.name)}</h2>
      <div class="d-section">
        <h4>基本信息</h4>
        <dl class="kv">
          <dt>机构</dt><dd>${esc(companyName(m.company))}</dd>
          <dt>发布</dt><dd>${fmtDate(m.release)}</dd>
          <dt>参数量</dt><dd>${m.params_b ? m.params_b + 'B' : '未公开'}</dd>
          <dt>上下文</dt><dd>${m.context_k ? (m.context_k >= 1000 ? (m.context_k/1000)+'M' : m.context_k+'K') : '未公开'}</dd>
          <dt>模态</dt><dd>${esc(m.modality || '—')}</dd>
          <dt>许可</dt><dd><span class="tag ${esc(m.license || '')}">${esc(licenseLabel[m.license] || m.license || '—')}</span></dd>
        </dl>
      </div>
      ${hl ? `<div class="d-section"><h4>要点</h4><ul class="hl">${hl}</ul></div>` : ''}
      ${pred ? `<div class="d-section"><h4>前代</h4><a class="src" href="#" data-open-model="${esc(pred.id)}">${esc(pred.name)} →</a></div>` : ''}
      ${succ.length ? `<div class="d-section"><h4>后继</h4><ul class="hl">${succ.map(s => `<li><a href="#" data-open-model="${esc(s.id)}">${esc(s.name)}</a></li>`).join('')}</ul></div>` : ''}
      ${m.note ? `<div class="d-section"><p class="note">注：${esc(m.note)}</p></div>` : ''}
      ${m.source ? `<div class="d-section"><h4>来源</h4><a class="src" href="${esc(m.source)}" target="_blank" rel="noopener">${esc(m.source)} ↗</a></div>` : ''}
    `);
    wireDrawerLinks();
  }

  function openTech(id) {
    const t = TECHS[id]; if (!t) return;
    const refs = (t.model_refs || []).slice(0, 12).map(mid => MODELS[mid]).filter(Boolean);
    openDrawer(`
      <span class="d-kicker">技术条目 / ${esc(t.category || 'TECH')}</span>
      <h2>${esc(t.name_zh || t.name)}</h2>
      <p class="muted" style="margin-top:-6px">${esc(t.name)} · ${t.year || '—'} · ${esc(t.origin || '—')}</p>
      <div class="d-section"><h4>概述</h4><p style="color:var(--text-2);font-size:15px;line-height:1.7;margin:0">${esc(t.summary)}</p></div>
      <div class="d-section"><h4>为何关键</h4><p style="color:var(--text-2);font-size:15px;line-height:1.7;margin:0">${esc(t.impact)}</p></div>
      ${refs.length ? `<div class="d-section"><h4>相关模型</h4><ul class="hl">${refs.map(m => `<li><a href="#" data-open-model="${esc(m.id)}">${esc(m.name)}</a></li>`).join('')}</ul></div>` : ''}
      ${t.source ? `<div class="d-section"><h4>来源</h4><a class="src" href="${esc(t.source)}" target="_blank" rel="noopener">${esc(t.source)} ↗</a></div>` : ''}
    `);
    wireDrawerLinks();
  }

  function openEvent(id) {
    const e = A.events.find(x => x.id === id); if (!e) return;
    openDrawer(`
      <span class="d-kicker">事件 / ${esc(e.type || 'EVENT')} / ${fmtDate(e.date)}</span>
      <h2>${esc(e.title)}</h2>
      <div class="d-section"><p style="color:var(--text-2);font-size:15px;line-height:1.7;margin:0">${esc(e.summary)}</p></div>
      <div class="d-section"><h4>关联</h4><dl class="kv">
        <dt>机构</dt><dd>${esc(companyName(e.company))}</dd>
        ${e.model_id && MODELS[e.model_id] ? `<dt>模型</dt><dd><a href="#" data-open-model="${esc(e.model_id)}">${esc(MODELS[e.model_id].name)}</a></dd>` : ''}
        ${e.tech_id && TECHS[e.tech_id] ? `<dt>技术</dt><dd><a href="#" data-open-tech="${esc(e.tech_id)}">${esc(TECHS[e.tech_id].name_zh || TECHS[e.tech_id].name)}</a></dd>` : ''}
      </dl></div>
      ${e.source ? `<div class="d-section"><h4>来源</h4><a class="src" href="${esc(e.source)}" target="_blank" rel="noopener">${esc(e.source)} ↗</a></div>` : ''}
    `);
    wireDrawerLinks();
  }

  function wireDrawerLinks() {
    if (!drawer) return;
    drawer.querySelectorAll('[data-open-model]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openModel(a.dataset.openModel); });
    });
    drawer.querySelectorAll('[data-open-tech]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); openTech(a.dataset.openTech); });
    });
  }

  /* 全局委托：任何带 data-open-* 的元素都可打开抽屉 */
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-open-model]');
    if (m) { e.preventDefault(); openModel(m.dataset.openModel); return; }
    const t = e.target.closest('[data-open-tech]');
    if (t) { e.preventDefault(); openTech(t.dataset.openTech); return; }
    const v = e.target.closest('[data-open-event]');
    if (v) { e.preventDefault(); openEvent(v.dataset.openEvent); }
  });

  /* ---------- 导出 ---------- */
  window.ATLAS_UI = {
    A, esc, byId, NAV, COMPANIES, MODELS, TECHS,
    companyName, licenseLabel, fmtDate,
    renderChrome, openDrawer, closeDrawer, openModel, openTech, openEvent,
  };
})();
