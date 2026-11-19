/* Model Annals — 对比页：73 个真实模型同图 + 筛选 + 点选详情 */
(function(){
  'use strict';
  var SVGNS='http://www.w3.org/2000/svg';
  var D=window.COMPARE_DATA||[];
  if(!document.getElementById('chart-wrap'))return;

  function el(t,c){var e=document.createElementNS(SVGNS,t);if(c)e.setAttribute('class',c);return e;}
  function attr(n,o){Object.keys(o).forEach(function(k){n.setAttribute(k,o[k]);});return n;}

  var W=1000,H=520,m={t:24,r:26,b:54,l:70};
  var ctxMax=1100;
  var yrMin=2017,yrMax=2027;
  var X=function(y){return m.l+(y-yrMin)/(yrMax-yrMin)*(W-m.l-m.r);};
  var Y=function(c){return H-m.b-(c/ctxMax)*(H-m.t-m.b);};

  var current='all', selected=null;
  var LOGO={openai:'openai',anthropic:'anthropic',google:'deepmind',meta:'meta',xai:'x',nvidia:'nvidia',mistral:'mistral',cohere:'cohere',ai21:'ai21',deepseek:'deepseek',alibaba:'qwenlm',bytedance:'bytedance',moonshot:'moonshot',zhipu:'zhipuai',minimax:'minimaxi',tencent:'tencent',huawei:'huawei',stepfun:'stepfun','01ai':'01ai',internlm:null};

  function buildChart(){
    var host=document.getElementById('chart-wrap');
    host.innerHTML='';
    var svg=el('svg');attr(svg,{viewBox:'0 0 '+W+' '+H,preserveAspectRatio:'xMidYMid meet',role:'img'});
    // 网格
    [0,256,512,768,1024].forEach(function(v){
      svg.appendChild(attr(el('line'),{x1:m.l,y1:Y(v),x2:W-m.r,y2:Y(v),stroke:'var(--rule)','stroke-width':1,'stroke-dasharray':'2 5'}));
      var t=el('text','cmp-axis');attr(t,{x:m.l-10,y:Y(v)+4,'text-anchor':'end'});t.textContent=v+'K';svg.appendChild(t);
    });
    for(var yr=2018;yr<=2027;yr+=1){
      var t2=el('text','cmp-axis');attr(t2,{x:X(yr),y:H-m.b+24,'text-anchor':'middle'});t2.textContent=yr;svg.appendChild(t2);
    }
    svg.appendChild(attr(el('line'),{x1:m.l,y1:H-m.b,x2:W-m.r,y2:H-m.b,stroke:'var(--ink)','stroke-width':1.5}));
    svg.appendChild(attr(el('line'),{x1:m.l,y1:m.t,x2:m.l,y2:H-m.b,stroke:'var(--ink)','stroke-width':1.5}));

    D.forEach(function(d){
      if(current!=='all'&&d.companyId!==current)return;
      var yr=parseInt(d.date.slice(0,4),10)+(parseInt(d.date.slice(5,7)||'6',10)-1)/12;
      var cx=X(yr),cy=Y(Math.min(d.ctx,ctxMax));
      var color=d.region==='cn'?'var(--red)':(d.region==='us'?'var(--blue)':'var(--green)');
      var open=d.license==='open'||d.license==='weighted';
      var g=el('g','cmp-point');g.setAttribute('data-id',d.id);g.setAttribute('tabindex','0');
      g.setAttribute('role','button');g.setAttribute('aria-label',d.name+' · '+d.company);

      var lf=LOGO[d.companyId];
      var r=selected===d.id?16:12;
      if(lf){
        var cid='clip-'+d.id.replace(/[^a-z0-9]/gi,'-');
        var clip=el('clipPath');clip.setAttribute('id',cid);
        var cc=el('circle');attr(cc,{cx:cx,cy:cy,r:r});clip.appendChild(cc);svg.appendChild(clip);
        var img=el('image');
        attr(img,{x:cx-r,y:cy-r,width:r*2,height:r*2,href:'assets/logos/'+lf+'.png','clip-path':'url(#'+cid+')'});
        g.appendChild(img);
        var ring=el('circle','cmp-dot');
        attr(ring,{cx:cx,cy:cy,r:r,fill:'none',stroke:open?'var(--ink)':color,'stroke-width':selected===d.id?3:1.5});
        g.appendChild(ring);
      } else {
        var dot=el('circle','cmp-dot');
        attr(dot,{cx:cx,cy:cy,r:selected===d.id?9:7,fill:open?'var(--paper)':color,stroke:color,'stroke-width':2});
        g.appendChild(dot);
      }
      // 选中点显示模型名 + 机构名；其余点用下方机构缩写标记
      if(selected===d.id){
        var lab=el('text','cmp-label');
        var anchor=cx>W*.72?'end':'start';
        attr(lab,{x:cx+(anchor==='start'?22:-22),y:cy-6,'text-anchor':anchor,'font-size':16});
        lab.textContent=d.name+' · '+d.company;g.appendChild(lab);
      }
      // 其余点不加文字，避免 73 个标签互相压字；机构名统一放在图例索引里
      g.addEventListener('click',function(){select(d.id);});
      g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(d.id);}});
      svg.appendChild(g);
    });
    host.appendChild(svg);
  }

  function select(id){
    var d=D.filter(function(x){return x.id===id;})[0];if(!d)return;
    selected=id;
    var p=document.getElementById('model-detail');
    p.innerHTML='<h3 class="detail-name">'+d.name+'</h3><div class="detail-meta">'+
      '<span>机构 <b>'+d.company+'</b></span><span>发布 <b>'+d.date+'</b></span>'+
      '<span>上下文 <b>'+d.ctx+'K</b></span><span>参数 <b>'+(d.param?d.param+'B':'未公开')+'</b></span>'+
      '<span>模态 <b>'+(d.modality?d.modality.replace(/,/g,'、'):'—')+'</b></span></div>';
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
        return '<button class="org" data-co="'+k+'">'+lg+'<span>'+o.name+'</span></button>';
      }).join('');
    host.addEventListener('click',function(e){
      var b=e.target.closest('[data-co]');if(!b)return;
      var co=b.getAttribute('data-co');
      current=(current===co?'all':co);
      host.querySelectorAll('.org').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-co')===current);});
      selected=null;
      document.getElementById('model-detail').innerHTML='';
      buildChart();
      if(tbRender)tbRender();
    });
  }


  function buildTable(){
    var tb=document.getElementById('model-tbody');if(!tb)return;
    var lic={open:'开放',weighted:'受限',proprietary:'闭源'};
    function render(){
      tb.innerHTML=D.filter(function(d){return current==='all'||d.companyId===current;})
        .map(function(d){return '<tr data-id="'+d.id+'"><td>'+d.name+'</td><td>'+d.company+'</td><td>'+d.date+'</td><td>'+d.ctx+'K</td><td>'+(d.param?d.param+'B':'—')+'</td><td>'+(lic[d.license]||'—')+'</td></tr>';}).join('');
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
    var m=location.hash.match(/^#view\/(chart|table)$/);if(m)switchView(m[1],false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
