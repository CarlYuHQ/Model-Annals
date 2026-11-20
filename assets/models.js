/* Model Annals — 对比页：90 个模型同图 + 筛选 + 点选详情
   纵轴对数刻度（数据跨 0.5K–2000K），未公开上下文的模型单独成带；
   同坐标点确定性错开避免叠成一团；hover 显示信息卡。 */
(function(){
  'use strict';
  var SVGNS='http://www.w3.org/2000/svg';
  var D=window.COMPARE_DATA||[];
  if(!document.getElementById('chart-wrap'))return;

  function el(t,c){var e=document.createElementNS(SVGNS,t);if(c)e.setAttribute('class',c);return e;}
  function attr(n,o){Object.keys(o).forEach(function(k){n.setAttribute(k,o[k]);});return n;}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  var W=1000,H=560,m={t:20,r:28,b:96,l:66};
  var plotTop=m.t, plotBottom=H-m.b;   // 464
  var yearLabelY=plotBottom+20;        // 年份标签
  var naDivY=plotBottom+38;            // 分隔虚线
  var naY=plotBottom+62;               // 未公开点中心，与年份标签拉开
  var yrMin=2018,yrMax=2026.85;
  var ctxMin=0.5,ctxMax=2000;
  var X=function(y){return m.l+(y-yrMin)/(yrMax-yrMin)*(W-m.l-m.r);};
  var lgMin=Math.log(1+ctxMin),lgMax=Math.log(1+ctxMax);
  var Y=function(c){
    var t=(Math.log(1+Math.max(ctxMin,Math.min(ctxMax,c)))-lgMin)/(lgMax-lgMin);
    return plotBottom-t*(plotBottom-plotTop);
  };
  var CTX_TICKS=[1,4,16,64,256,1000];
  function tickLabel(v){return v>=1000?(v/1000)+'M':v+'K';}
  function ctxLabel(c){return c==null?L('undisclosed'):(c>=1000?(c/1000)+'M':c+'K');}

  var current='all', selected=null;
  var LOGO={openai:'openai',anthropic:'anthropic',google:'deepmind',meta:'meta',xai:'x',nvidia:'nvidia',mistral:'mistral',cohere:'cohere',ai21:'ai21',deepseek:'deepseek',alibaba:'qwenlm',bytedance:'bytedance',moonshot:'moonshot',zhipu:'zhipuai',minimax:'minimaxi',tencent:'tencent',huawei:'huawei',stepfun:'stepfun','01ai':'01ai',internlm:'internlm',baidu:'baidu'};

  /* 碰撞松弛：按 x 排序逐个放置，与已放置点太近则沿垂直方向找空位。
     确定性、无随机，保证每次渲染结果一致。 */
  function spread(list){
    var withCtx=list.filter(function(d){return d._hasCtx;})
      .sort(function(a,b){return a._cx-b._cx||a._cy-b._cy;});
    var placed=[];
    var MIN=23; // 两点最小中心距
    withCtx.forEach(function(d){
      var best=null;
      // 候选偏移：优先原位，再上下交替，幅度递增
      var offs=[0,14,-14,28,-28,42,-42,56,-56,70,-70];
      for(var k=0;k<offs.length;k++){
        var cy=d._cy+offs[k];
        if(cy<plotTop+12||cy>plotBottom-8)continue;
        var ok=true;
        for(var i=0;i<placed.length;i++){
          var p=placed[i];
          if(p._cx>d._cx+MIN+4)break; // 后面更远，不必再查
          var dx=p._cx-d._cx,dy=p._sy-cy;
          if(dx*dx+dy*dy<MIN*MIN){ok=false;break;}
        }
        if(ok){best=cy;break;}
      }
      d._sx=d._cx;
      d._sy=best==null?d._cy:best;
      // 保持 placed 按 x 有序，便于上面的提前 break
      placed.push(d);
      placed.sort(function(a,b){return a._cx-b._cx;});
    });
    // 未公开点保持原坐标，后续单独铺开
    list.filter(function(d){return !d._hasCtx;}).forEach(function(d){
      d._sx=d._cx;d._sy=d._cy;
    });
  }

  function buildChart(){
    var host=document.getElementById('chart-wrap');
    host.innerHTML='';
    var svg=el('svg');attr(svg,{viewBox:'0 0 '+W+' '+H,preserveAspectRatio:'xMidYMid meet',role:'img',
      'aria-label':L('chartAria')});

    CTX_TICKS.forEach(function(v){
      var y=Y(v);
      svg.appendChild(attr(el('line'),{x1:m.l,y1:y,x2:W-m.r,y2:y,stroke:'var(--rule)','stroke-width':1,'stroke-dasharray':'2 5'}));
      var t=el('text','cmp-axis');attr(t,{x:m.l-10,y:y+4,'text-anchor':'end'});t.textContent=tickLabel(v);svg.appendChild(t);
    });
    for(var yr=2018;yr<=2026;yr++){
      var t2=el('text','cmp-axis');attr(t2,{x:X(yr),y:yearLabelY,'text-anchor':'middle'});t2.textContent=yr;svg.appendChild(t2);
      svg.appendChild(attr(el('line'),{x1:X(yr),y1:plotBottom,x2:X(yr),y2:plotBottom+5,stroke:'var(--ink)','stroke-width':1}));
    }
    svg.appendChild(attr(el('line'),{x1:m.l,y1:plotBottom,x2:W-m.r,y2:plotBottom,stroke:'var(--ink)','stroke-width':1.5}));
    svg.appendChild(attr(el('line'),{x1:m.l,y1:plotTop,x2:m.l,y2:plotBottom,stroke:'var(--ink)','stroke-width':1.5}));
    var yl=el('text','cmp-axis');attr(yl,{x:m.l-10,y:plotTop-6,'text-anchor':'end'});yl.textContent=L('context');svg.appendChild(yl);
    svg.appendChild(attr(el('line'),{x1:m.l,y1:naDivY,x2:W-m.r,y2:naDivY,stroke:'var(--rule)','stroke-width':1,'stroke-dasharray':'3 6'}));
    var nt=el('text','cmp-axis');attr(nt,{x:W-m.r,y:naDivY-6,'text-anchor':'end'});nt.textContent=L('ctxUndisclosed');svg.appendChild(nt);

    var pts=[];
    D.forEach(function(d){
      if(current!=='all'&&d.companyId!==current)return;
      var yr=parseInt(d.date.slice(0,4),10)+(parseInt(d.date.slice(5,7)||'6',10)-1)/12;
      var hasCtx=d.ctx!=null&&d.ctx>0;
      d._cx=X(Math.max(yrMin,Math.min(yrMax,yr)));
      d._cy=hasCtx?Y(d.ctx):naY;
      d._hasCtx=hasCtx;
      pts.push(d);
    });
    spread(pts);

    // 未公开点沿 x 均匀铺开，避免叠成一团
    var na=pts.filter(function(d){return !d._hasCtx;}).sort(function(a,b){return a._cx-b._cx;});
    na.forEach(function(d,i){
      d._sy=naY+(i%2===0?-7:7);
      if(na.length>1)d._sx=m.l+16+(i/(na.length-1))*(W-m.l-m.r-32);
    });

    pts.forEach(function(d){
      var cx=d._sx,cy=d._sy;
      var color=d.region==='cn'?'var(--red)':(d.region==='us'?'var(--blue)':'var(--green)');
      var open=d.license==='open'||d.license==='weighted';
      var isSel=selected===d.id;
      var g=el('g','cmp-point');g.setAttribute('data-id',d.id);g.setAttribute('tabindex','0');
      g.setAttribute('role','button');
      g.setAttribute('aria-label',d.name+' · '+d.company+' · '+ctxLabel(d.ctx));

      var lf=LOGO[d.companyId];
      var r=isSel?15:(d._hasCtx?11:9);
      if(lf){
        var cid='clip-'+d.id.replace(/[^a-z0-9]/gi,'-');
        var clip=el('clipPath');clip.setAttribute('id',cid);
        clip.appendChild(attr(el('circle'),{cx:cx,cy:cy,r:r}));svg.appendChild(clip);
        g.appendChild(attr(el('image'),{x:cx-r,y:cy-r,width:r*2,height:r*2,
          href:'assets/logos/'+lf+'.png','clip-path':'url(#'+cid+')',opacity:d._hasCtx?1:0.8}));
      } else {
        g.appendChild(attr(el('circle'),{cx:cx,cy:cy,r:r-2,fill:open?'var(--paper)':color,
          stroke:color,'stroke-width':1,opacity:d._hasCtx?1:0.8}));
      }
      var ring=el('circle','cmp-dot');
      attr(ring,{cx:cx,cy:cy,r:r,fill:'none',
        stroke:isSel?'var(--red)':(open?'var(--ink-2)':color),
        'stroke-width':isSel?2.4:(open?1:0.8),'stroke-dasharray':d._hasCtx?'none':'3 3'});
      g.appendChild(ring);

      if(isSel){
        var lab=el('text','cmp-label');
        var anchor=cx>W*.72?'end':'start';
        attr(lab,{x:cx+(anchor==='start'?20:-20),y:cy-14,'text-anchor':anchor,'font-size':16,
          stroke:'var(--paper)','stroke-width':5,'paint-order':'stroke'});
        lab.textContent=d.name+' · '+ctxLabel(d.ctx);g.appendChild(lab);
      }
      g.addEventListener('click',function(){select(d.id);});
      g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(d.id);}});
      g.addEventListener('pointerenter',function(e){showTip(d,e);});
      g.addEventListener('pointermove',moveTip);
      g.addEventListener('pointerleave',hideTip);
      svg.appendChild(g);
    });
    host.appendChild(svg);
  }

  /* ---- hover 信息卡 ---- */
  var tip=null;
  function getTip(){
    if(!tip){tip=document.createElement('div');tip.className='cmp-tip';document.getElementById('chart-wrap').appendChild(tip);}
    return tip;
  }
  function showTip(d,e){
    var t=getTip();
    t.innerHTML='<b>'+esc(d.name)+'</b><span>'+esc(d.company)+' · '+esc(d.date)+'</span>'+
      '<span>'+L('context')+' '+esc(ctxLabel(d.ctx))+(d.param?' · '+esc(d.param)+L('params'):'')+'</span>';
    t.classList.add('on');moveTip(e);
  }
  function moveTip(e){
    if(!tip)return;
    var host=document.getElementById('chart-wrap'),r=host.getBoundingClientRect();
    var px=e.clientX-r.left+14,py=e.clientY-r.top+14;
    px=Math.max(8,Math.min(r.width-190,px));
    py=Math.max(8,Math.min(r.height-72,py));
    tip.style.left=px+'px';tip.style.top=py+'px';
  }
  function hideTip(){if(tip)tip.classList.remove('on');}

  function select(id){
    var d=D.filter(function(x){return x.id===id;})[0];if(!d)return;
    selected=id;
    var p=document.getElementById('model-detail');
    var lf=LOGO[d.companyId];
    var lg=lf?'<img class="d-logo" src="assets/logos/'+lf+'.png" alt="">':'';
    var chain='';
    if(d.predecessor){
      var pred=D.filter(function(x){return x.id===d.predecessor;})[0];
      chain=pred?'<span class="d-chain">'+esc(pred.name)+' → <em>'+esc(d.name)+'</em></span>':'';
    }
    p.innerHTML='<div class="d-card">'+lg+'<div><b>'+esc(d.name)+'</b><span>'+esc(d.company)+' · '+esc(d.date)+'</span>'+chain+'</div></div>';
    buildChart();
  }

  function buildOrgIndex(){
    var host=document.getElementById('org-index');if(!host)return;
    var by={};
    D.forEach(function(d){if(!by[d.companyId])by[d.companyId]={name:d.company,logo:LOGO[d.companyId]};});
    host.innerHTML=Object.keys(by).sort(function(a,b){return by[a].name.localeCompare(by[b].name);})
      .map(function(k){
        var o=by[k];
        var lg=o.logo?'<img src="assets/logos/'+o.logo+'.png" alt="" width="16" height="16">':'<span class="org-ph"></span>';
        return '<button class="org" data-co="'+k+'">'+lg+'<span>'+esc(o.name)+'</span></button>';
      }).join('');
    host.addEventListener('click',function(e){
      var b=e.target.closest('[data-co]');if(!b)return;
      var co=b.getAttribute('data-co');
      current=(current===co?'all':co);
      host.querySelectorAll('.org').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-co')===current);});
      selected=null;
      document.getElementById('model-detail').innerHTML='';
      hideTip();buildChart();
      if(tbRender)tbRender();
    });
  }

  function buildTable(){
    var tb=document.getElementById('model-tbody');if(!tb)return;
    var lic={open:L('licOpen'),weighted:L('licWeighted'),proprietary:L('licClosed')};
    function render(){
      tb.innerHTML=D.filter(function(d){return current==='all'||d.companyId===current;})
        .map(function(d){return '<tr data-id="'+esc(d.id)+'"><td>'+esc(d.name)+'</td><td>'+esc(d.company)+'</td><td>'+esc(d.date)+'</td><td>'+esc(ctxLabel(d.ctx))+'</td><td>'+(d.param?esc(d.param)+'B':'—')+'</td><td>'+(lic[d.license]||'—')+'</td></tr>';}).join('');
      tb.querySelectorAll('tr').forEach(function(tr){tr.addEventListener('click',function(){select(tr.getAttribute('data-id'));switchView('chart');});});
    }
    render();tb._render=render;
  }

  function switchView(v,hash){
    ['chart','table'].forEach(function(x){
      var b=document.querySelector('.viewtab[data-view="'+x+'"]');
      b.classList.toggle('on',x===v);
      document.getElementById('view-'+x).classList.toggle('on',x===v);
    });
    if(hash!==false)history.replaceState(null,'','#view/'+v);
    if(v==='table'&&tbRender)tbRender();
  }
  var tbRender=null;

  function init(){
    buildOrgIndex();buildChart();buildTable();
    tbRender=function(){document.getElementById('model-tbody')._render();};
    document.querySelectorAll('.viewtab').forEach(function(b){
      b.addEventListener('click',function(){switchView(b.getAttribute('data-view'));});
    });
    var mh=location.hash.match(/^#view\/(chart|table)$/);if(mh)switchView(mh[1],false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
