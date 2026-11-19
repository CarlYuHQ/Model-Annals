/* 机构页：从 compare-data 统计每家模型数与最新发布 */
(function(){
  'use strict';
  var D=window.COMPARE_DATA||[];
  var grid=document.getElementById('company-grid');if(!grid)return;
  var by={};
  D.forEach(function(d){
    var k=d.companyId;
    if(!by[k])by[k]={name:d.company,region:d.region,count:0,latest:'',latestName:'',ctx:0};
    by[k].count++;
    if(d.date>by[k].latest){by[k].latest=d.date;by[k].latestName=d.name;by[k].ctx=d.ctx;}
  });
  var names=Object.keys(by).sort(function(a,b){return by[b].count-by[a].count;});
  var filter='all';

  function regionLabel(r){return r==='cn'?'中国':(r==='us'?'北美':'其他');}

  function render(){
    grid.innerHTML=names.filter(function(k){return filter==='all'||by[k].region===filter;})
      .map(function(k){
        var o=by[k];
        return '<article class="cell"><div class="num">'+o.count+'</div><h3>'+o.name+'</h3>'+
          '<p>最新 '+o.latest+' · '+o.latestName+' · '+o.ctx+'K</p>'+
          '<span class="co">'+regionLabel(o.region)+'</span></article>';
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
