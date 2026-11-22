/* 机构页：全量档案统计（非抽样），21 家机构的模型数、最新发布与开放比例 */
(function(){
  'use strict';
  var C=window.COMPANIES_DATA||[];
  var grid=document.getElementById('company-grid');if(!grid)return;
  var filter='all';

  function regionLabel(r){return r==='cn'?L('cn'):(r==='us'?L('us'):L('other'));}
  function fullName(o){return o.zh&&o.zh!==o.name?o.zh:o.name;}

  function render(){
    var list=C.filter(function(o){return filter==='all'||o.region===filter;});
    grid.innerHTML=list.map(function(o){
        var ctx=o.latestCtx?o.latestCtx+'K':'';
        var src=o.src?'<span class="co"><a href="'+o.src+'" target="_blank" rel="noopener">'+L('official')+'</a></span>':'';
        var lg=o.logo?'<img class="co-logo" src="assets/logos/'+o.logo+'.png" alt="'+o.name+' logo">':'<span class="co-logo co-logo-ph"></span>';
        return '<article class="cell co-cell">'+
          '<div class="co-head"><div class="num">'+o.count+'</div>'+lg+'</div>'+
          '<h3>'+o.name+'</h3>'+
          '<p>'+L('latest')+' '+o.latestDate+' · '+o.latest+(ctx?' · '+ctx:'')+'</p>'+
          '<span class="co">'+regionLabel(o.region)+' · '+o.families+L('families')+o.openCount+L('openWeights')+'</span>'+
          src+'</article>';
      }).join('');
    // 卡片不足一行时收缩网格，避免右侧空白
    if(list.length&&list.length<5){
      grid.classList.add('compact');
      grid.style.setProperty('--cols',Math.min(list.length,3));
    }else{
      grid.classList.remove('compact');
      grid.style.removeProperty('--cols');
    }
  }

  var fb=document.getElementById('region-filters');
  if(fb){
    fb.innerHTML=['all','cn','us','other'].map(function(r){
      return '<button class="chip'+(r==='all'?' on':'')+'" data-r="'+r+'">'+(r==='all'?L('all'):regionLabel(r))+'</button>';
    }).join('');
    fb.addEventListener('click',function(e){
      var b=e.target.closest('[data-r]');if(!b)return;
      fb.querySelectorAll('.chip').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on');filter=b.getAttribute('data-r');render();
    });
  }
  render();
})();
