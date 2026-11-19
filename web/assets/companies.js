/* 机构页：全量档案统计（非抽样），21 家机构的模型数、最新发布与开放比例 */
(function(){
  'use strict';
  var C=window.COMPANIES_DATA||[];
  var grid=document.getElementById('company-grid');if(!grid)return;
  var filter='all';

  function regionLabel(r){return r==='cn'?'中国':(r==='us'?'北美':'其他');}
  function fullName(o){return o.zh&&o.zh!==o.name?o.zh:o.name;}

  function render(){
    grid.innerHTML=C.filter(function(o){return filter==='all'||o.region===filter;})
      .map(function(o){
        var ctx=o.latestCtx?o.latestCtx+'K':'';
        var src=o.src?'<span class="co"><a href="'+o.src+'" target="_blank" rel="noopener">官网 ↗</a></span>':'';
        return '<article class="cell">'+
          '<div class="num">'+o.count+'</div>'+
          '<h3>'+o.name+'</h3>'+
          '<p>最新 '+o.latestDate+' · '+o.latest+(ctx?' · '+ctx:'')+'</p>'+
          '<span class="co">'+regionLabel(o.region)+' · '+o.families+' 个谱系 · '+o.openCount+' 个开放权重</span>'+
          src+'</article>';
      }).join('');
  }

  var fb=document.getElementById('region-filters');
  if(fb){
    fb.innerHTML=['all','cn','us','other'].map(function(r){
      return '<button class="chip'+(r==='all'?' on':'')+'" data-r="'+r+'">'+(r==='all'?'全部':regionLabel(r))+'</button>';
    }).join('');
    fb.addEventListener('click',function(e){
      var b=e.target.closest('[data-r]');if(!b)return;
      fb.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');filter=b.getAttribute('data-r');render();
    });
  }
  render();
})();
