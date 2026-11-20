/* 技术页：按年份展示 48 项关键技术 */
(function(){
  'use strict';
  var T=window.TECH_DATA||[];
  var grid=document.getElementById('tech-grid');if(!grid)return;
  var cats={};T.forEach(function(t){cats[t.cat]=1;});
  var filter='all';
  function render(){
    grid.innerHTML=T.filter(function(t){return filter==='all'||t.cat===filter;})
      .sort(function(a,b){return (a.year||0)-(b.year||0);})
      .map(function(t){
        return '<article class="cell"><div class="num">'+t.year+'</div><h3>'+(t.zh||t.name)+'</h3>'+
          '<p>'+((t.summary||'').split('。')[0]||'')+'。</p><span class="co">'+t.cat+' · '+t.origin+'</span></article>';
      }).join('');
  }
  var fb=document.getElementById('tech-filters');
  if(fb){
    fb.innerHTML='<button class="chip on" data-c="all">全部</button>'+
      Object.keys(cats).map(function(c){return '<button class="chip" data-c="'+c+'">'+c+'</button>';}).join('');
    fb.addEventListener('click',function(e){
      var b=e.target.closest('[data-c]');if(!b)return;
      fb.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');filter=b.getAttribute('data-c');render();
    });
  }
  render();
})();
