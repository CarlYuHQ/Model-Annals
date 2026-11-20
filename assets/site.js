/* Model Annals — 公共脚本：进度条、时间轴入场、Hero 时间轴 */
(function(){
  'use strict';
  var SVGNS='http://www.w3.org/2000/svg';
  document.documentElement.classList.add('js');

  function el(t,c){var e=document.createElementNS(SVGNS,t);if(c)e.setAttribute('class',c);return e;}
  function attr(n,o){Object.keys(o).forEach(function(k){n.setAttribute(k,o[k]);});return n;}

  /* 逐字手写入场：把文字拆成单字，逐个显现 */
  function handwrite(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    document.querySelectorAll('[data-write]').forEach(function(el){
      var text=el.textContent.trim();
      if(!text)return;
      el.textContent='';
      var step=el.classList.contains('quote-by')?0.018:(el.classList.contains('page-title')?0.07:0.04);
      for(var i=0;i<text.length;i++){
        var sp=document.createElement('span');
        sp.className='ink-char';
        sp.style.animationDelay=(0.15+i*step).toFixed(3)+'s';
        sp.textContent=text[i];
        el.appendChild(sp);
      }
      // 保证动画结束后一定可见（内联样式优先于 html.js .ink-char 的 opacity:0）
      var last=0.15+text.length*step+0.6;
      window.setTimeout(function(){
        Array.prototype.forEach.call(el.querySelectorAll('.ink-char'),function(sp){
          sp.style.opacity='1';sp.style.transform='none';
        });
      },last*1000);
    });
  }

  /* 进度条 */
  function progress(){
    var bar=document.getElementById('progress');if(!bar)return;
    var ticking=false;
    function up(){
      var h=document.documentElement.scrollHeight-window.innerHeight;
      bar.style.transform='scaleX('+(h>0?window.scrollY/h:0)+')';ticking=false;
    }
    window.addEventListener('scroll',function(){if(!ticking){requestAnimationFrame(up);ticking=true;}},{passive:true});
    up();
  }

  /* 时间轴进入视口 */
  function reveal(){
    var items=Array.prototype.slice.call(document.querySelectorAll('.tl-item'));
    if(!items.length)return;
    if(!('IntersectionObserver' in window)){items.forEach(function(i){i.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{threshold:.15,rootMargin:'0px 0px -6% 0px'});
    items.forEach(function(i){io.observe(i);});
  }

  /* Hero 手绘时间轴 */
  function heroArt(){
    var host=document.getElementById('hero-art');if(!host)return;
    var s=el('svg');attr(s,{viewBox:'0 0 800 150',preserveAspectRatio:'xMidYMid meet',role:'img'});
    s.appendChild(attr(el('line'),{x1:10,y1:96,x2:700,y2:92,stroke:'var(--ink)','stroke-width':2}));
    var years=['2018','2020','2022','2024','2026'],xs=[40,205,370,535,700];
    years.forEach(function(yr,i){
      var x=xs[i],y=95;
      s.appendChild(attr(el('circle'),{cx:x,cy:y,r:i===2||i===4?6:4,fill:i===2||i===4?'var(--red)':'var(--paper)',stroke:i===2||i===4?'var(--red)':'var(--ink)','stroke-width':2}));
      var t=el('text');attr(t,{x:x,y:128,'text-anchor':'middle','font-size':22,'font-family':'var(--hand)',fill:'var(--muted)'});t.textContent=yr;s.appendChild(t);
    });
    host.appendChild(s);
  }

  function start(){handwrite();progress();reveal();heroArt();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
