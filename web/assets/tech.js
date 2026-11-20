/* 技术页：48 项关键技术，卡片点开为小博客（原始论文 / 提出机构 / 机制 / 影响 / 关联模型）。
   内容全部来自 atlas.json 的结构化字段，不推测、不编造。 */
(function(){
  'use strict';
  var T=window.TECH_DATA||[];
  var grid=document.getElementById('tech-grid');
  if(!grid)return;
  var detail=document.getElementById('tech-detail');
  var cats={};T.forEach(function(t){cats[t.cat]=1;});
  var filter='all', activeId=null;

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function summaryShort(s){return (s||'').split('。')[0]+'。';}

  /* 关联模型：优先 model_refs，其次 models；映射到 timeline-data 里的真实模型名 */
  var MODEL_NAME={};
  (window.TIMELINE_DATA||[]).forEach(function(m){MODEL_NAME[m.id]=m.name;});
  function relatedModels(t){
    var ids=(t.model_refs&&t.model_refs.length?t.model_refs:(t.models||[])).slice(0,6);
    return ids.map(function(id){return {id:id,name:MODEL_NAME[id]||id};});
  }

  function renderGrid(){
    var list=T.filter(function(t){return filter==='all'||t.cat===filter;})
      .sort(function(a,b){return (a.year||0)-(b.year||0);});
    grid.innerHTML=list.map(function(t){
        return '<article class="cell tech-cell'+(activeId===t.id?' on':'')+'" data-id="'+esc(t.id)+'" tabindex="0" role="button" aria-label="查看 '+esc(t.zh||t.name)+' 详情">'+
          '<div class="num">'+esc(t.year)+'</div>'+
          '<h3>'+esc(t.zh||t.name)+'</h3>'+
          '<p>'+esc(summaryShort(t.summary))+'</p>'+
          '<span class="co">'+esc(t.cat)+' · '+esc(t.origin)+'</span></article>';
      }).join('');
    // 卡片少于一整行时，网格宽度收缩到刚好容纳，避免右侧大面积空白
    if(list.length&&list.length<5){
      grid.classList.add('compact');
      grid.style.setProperty('--cols',Math.min(list.length,3));
    }else{
      grid.classList.remove('compact');
      grid.style.removeProperty('--cols');
    }
  }

  /* 同类别的其他技术（数据推导，不编造） */
  function relatedTech(t){
    var rel=T.filter(function(x){return x.id!==t.id&&x.cat===t.cat;})
      .sort(function(a,b){return (a.year||0)-(b.year||0);}).slice(0,6);
    if(!rel.length)return '';
    return '<h4>同类技术</h4><div class="td-rel">'+
      rel.map(function(r){return '<button class="td-chip td-link" data-goto="'+esc(r.id)+'">'+
        esc(r.year)+' '+esc(r.zh||r.name)+'</button>';}).join('')+'</div>';
  }

  /* ---- 小博客详情 ---- */
  function renderDetail(t){
    if(!detail)return;
    if(!t){detail.classList.remove('on');detail.innerHTML='';return;}
    var rel=relatedModels(t);
    var meta=
      '<div class="td-meta">'+
        '<div class="td-year">'+esc(t.year)+'</div>'+
        '<dl>'+
          '<dt>提出机构</dt><dd>'+esc(t.origin)+'</dd>'+
          '<dt>类别</dt><dd>'+esc(t.cat)+'</dd>'+
          '<dt>原始论文</dt><dd><a href="'+esc(t.source)+'" target="_blank" rel="noopener">'+esc(t.source.replace(/^https?:\/\//,''))+' ↗</a></dd>'+
        '</dl>'+
      '</div>';
    var body=
      '<div class="td-body">'+
        '<h2>'+esc(t.zh||t.name)+'</h2>'+
        '<div class="td-ename">'+esc(t.name)+'</div>'+
        '<h4>核心机制</h4><p>'+esc(t.summary)+'</p>'+
        '<h4>影响</h4><p>'+esc(t.impact)+'</p>'+
        (rel.length?'<h4>关联模型</h4><div class="td-rel">'+
          rel.map(function(r){return '<span class="td-chip">'+esc(r.name)+'</span>';}).join('')+'</div>':'')+
        relatedTech(t)+
        '<div class="td-src">来源：<a href="'+esc(t.source)+'" target="_blank" rel="noopener">'+esc(t.source)+' ↗</a></div>'+
      '</div>';
    detail.innerHTML='<div class="td-inner"><button class="td-close" aria-label="收起">收起 ×</button>'+meta+body+'</div>';
    detail.classList.add('on');
  }

  function open(id,scroll){
    var t=T.filter(function(x){return x.id===id;})[0];
    if(!t)return;
    activeId=id;
    renderGrid();renderDetail(t);
    if(scroll!==false&&detail&&detail.scrollIntoView)detail.scrollIntoView({behavior:'smooth',block:'start'});
    history.replaceState(null,'','#tech/'+encodeURIComponent(id));
  }
  function close(){
    activeId=null;renderGrid();renderDetail(null);
    history.replaceState(null,'','#tech');
  }

  var fb=document.getElementById('tech-filters');
  if(fb){
    fb.innerHTML='<button class="chip on" data-c="all">全部</button>'+
      Object.keys(cats).sort().map(function(c){return '<button class="chip" data-c="'+esc(c)+'">'+esc(c)+'</button>';}).join('');
    fb.addEventListener('click',function(e){
      var b=e.target.closest('[data-c]');if(!b)return;
      fb.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');filter=b.getAttribute('data-c');renderGrid();
    });
  }
  grid.addEventListener('click',function(e){
    var c=e.target.closest('[data-id]');if(!c)return;
    var id=c.getAttribute('data-id');
    if(id===activeId)close();else open(id);
  });
  grid.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;
    var c=e.target.closest('[data-id]');if(!c)return;
    e.preventDefault();
    var id=c.getAttribute('data-id');
    if(id===activeId)close();else open(id);
  });
  if(detail)detail.addEventListener('click',function(e){
    if(e.target.closest('.td-close')){close();return;}
    var g=e.target.closest('[data-goto]');
    if(g)open(g.getAttribute('data-goto'));
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&activeId)close();});

  renderGrid();
  var h=location.hash.match(/^#tech\/(.+)$/);
  if(h){var id=decodeURIComponent(h[1]);if(T.some(function(x){return x.id===id;}))open(id,false);}
})();
