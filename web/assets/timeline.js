/* 横向编年长轴：精确到月，356 个模型按发布日期铺开，带机构 logo */
(function(){
  'use strict';
  var D=window.TIMELINE_DATA||[];
  var host=document.getElementById('long-timeline');
  if(!host||!D.length)return;

  var Y0=2018,Y1=2026,MO=12;
  var COL=44;                       // 每月宽度
  var X0=90;                        // 左侧留白
  var TOTAL=(Y1-Y0+1)*MO*COL+X0+120;
  var AXIS_Y=300;                   // 主轴 y
  var LEVELS=[-40,-96,-152,52,108,164];  // 上下交错层
  var H=560;
  var W=TOTAL;

  function xOf(y,m){return X0+((y-Y0)*12+(m-1))*COL;}
  function logoURL(l){return l?'assets/logos/'+l+'.png':'';}

  var s=document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('viewBox','0 0 '+W+' '+H);
  s.setAttribute('width',W);s.setAttribute('height',H);
  s.setAttribute('role','img');
  s.setAttribute('aria-label','2018 至 2026 按月份排列的模型发布时间轴');

  // 主轴
  var axis=document.createElementNS('http://www.w3.org/2000/svg','line');
  axis.setAttribute('x1',X0);axis.setAttribute('y1',AXIS_Y);
  axis.setAttribute('x2',W-60);axis.setAttribute('y2',AXIS_Y);
  axis.setAttribute('stroke','var(--ink)');axis.setAttribute('stroke-width',2);
  s.appendChild(axis);

  // 年份分界 + 月份刻度
  for(var y=Y0;y<=Y1;y++){
    for(var mo=1;mo<=MO;mo++){
      if(mo===1){
        var x=xOf(y,mo);
        var t=document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('x',x);t.setAttribute('y',AXIS_Y-14);
        t.setAttribute('font-size','30');t.setAttribute('font-family','var(--hand)');
        t.setAttribute('fill','var(--red)');t.textContent=y;
        s.appendChild(t);
        var big=document.createElementNS('http://www.w3.org/2000/svg','line');
        big.setAttribute('x1',x);big.setAttribute('y1',AXIS_Y-6);
        big.setAttribute('x2',x);big.setAttribute('y2',AXIS_Y+6);
        big.setAttribute('stroke','var(--red)');big.setAttribute('stroke-width',2);
        s.appendChild(big);
      } else {
        var xm=xOf(y,mo);
        var tick=document.createElementNS('http://www.w3.org/2000/svg','line');
        tick.setAttribute('x1',xm);tick.setAttribute('y1',AXIS_Y);
        tick.setAttribute('x2',xm);tick.setAttribute('y2',AXIS_Y+6);
        tick.setAttribute('stroke','var(--muted)');tick.setAttribute('stroke-width',1);
        s.appendChild(tick);
      }
    }
  }
  // 月份数字（每季度标一次，避免密）
  for(var yy=Y0;yy<=Y1;yy++){
    [1,4,7,10].forEach(function(mm){
      var x=xOf(yy,mm);
      var mt=document.createElementNS('http://www.w3.org/2000/svg','text');
      mt.setAttribute('x',x);mt.setAttribute('y',AXIS_Y+26);
      mt.setAttribute('font-size','15');mt.setAttribute('font-family','var(--ui)');
      mt.setAttribute('text-anchor','middle');mt.setAttribute('fill','var(--muted)');
      mt.textContent=mm+'月';
      s.appendChild(mt);
    });
  }

  // 模型点：按年月聚合，同月多模型分层
  var used={};
  D.forEach(function(d,idx){
    var x=xOf(d.y,d.m);
    var key=Math.round(x/16);
    var lv=used[key]===undefined?0:(used[key]+1)%LEVELS.length;
    used[key]=lv;
    var y=AXIS_Y+LEVELS[lv];
    var up=LEVELS[lv]<0;

    // 竖线连接主轴
    var stem=document.createElementNS('http://www.w3.org/2000/svg','line');
    stem.setAttribute('x1',x);stem.setAttribute('y1',AXIS_Y+(up?-4:4));
    stem.setAttribute('x2',x);stem.setAttribute('y2',y+(up?8:-8));
    stem.setAttribute('stroke','var(--rule)');stem.setAttribute('stroke-width',1);
    s.appendChild(stem);

    var g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','tl-model');
    g.setAttribute('tabindex','0');
    g.setAttribute('role','button');
    g.setAttribute('data-id',d.id);
    g.setAttribute('aria-label',d.name+'，'+d.date);

    // logo 圆片（用 image 裁圆）
    var logo=logoURL(d.logo);
    if(logo){
      var clip=document.createElementNS('http://www.w3.org/2000/svg','clipPath');
      var cid='clip-'+idx;clip.setAttribute('id',cid);
      var cc=document.createElementNS('http://www.w3.org/2000/svg','circle');
      cc.setAttribute('cx',x);cc.setAttribute('cy',y);cc.setAttribute('r',9);
      clip.appendChild(cc);s.appendChild(clip);
      var img=document.createElementNS('http://www.w3.org/2000/svg','image');
      img.setAttribute('x',x-9);img.setAttribute('y',y-9);
      img.setAttribute('width',18);img.setAttribute('height',18);
      img.setAttribute('href',logo);
      img.setAttribute('clip-path','url(#'+cid+')');
      g.appendChild(img);
    } else {
      var dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
      dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r',7);
      dot.setAttribute('fill','var(--muted)');g.appendChild(dot);
    }

    // 模型名（旋转 -35°，向左上或右上）
    var label=document.createElementNS('http://www.w3.org/2000/svg','text');
    var nm=d.name.length>22?d.name.slice(0,21)+'…':d.name;
    label.setAttribute('x',x+13);
    label.setAttribute('y',y+(up?-6:14));
    label.setAttribute('font-size','17');
    label.setAttribute('font-family','var(--hand)');
    label.setAttribute('fill',d.key?'var(--red)':'var(--ink-2)');
    label.setAttribute('transform','rotate(-38 '+(x+13)+' '+(y+(up?-6:14))+')');
    label.textContent=nm;
    g.appendChild(label);

    g.addEventListener('click',function(){showDetail(d);});
    g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();showDetail(d);}});
    s.appendChild(g);
  });

  host.appendChild(s);

  // 详情
  function showDetail(d){
    var p=document.getElementById('timeline-detail');
    p.innerHTML='<b>'+d.name+'</b> · '+d.coName+' · '+d.date+
      (d.ctx?' · 上下文 '+d.ctx+'K':'')+(d.param?' · 参数 '+d.param+'B':'');
    document.querySelectorAll('.tl-model').forEach(function(g){
      g.classList.toggle('sel',g.getAttribute('data-id')===d.id);
    });
  }
})();
