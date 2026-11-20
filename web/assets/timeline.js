/* 横向编年长轴：精确到月，356 个模型按发布日期铺开，带机构 logo
   布局：贪心分层——相邻点 x 距离够近就同层，太近就换层。
   稀疏段自动贴轴，密集段自动铺开，不留大片空白。 */
(function(){
  'use strict';
  var D=window.TIMELINE_DATA||[];
  var host=document.getElementById('long-timeline');
  if(!host||!D.length)return;

  var Y0=2018,Y1=2026,MO=12;
  var COL=40;                        // 每月宽度
  var X0=90;
  var TOTAL=(Y1-Y0+1)*MO*COL+X0+120;
  var AXIS_Y=190;                    // 主轴 y（画布压到 380）
  var H=380;
  var W=TOTAL;
  var LAYERS=[-150,-120,-90,-60,-30, 30,60,90,120,150];  // 上下各 5 层，间距 30
  var MIN_GAP=46;                    // 同层两点最小 x 间距（小于此就换层）
  var selectedId=null;

  function xOf(y,m,day){
    var d=day||15;
    return X0+((y-Y0)*12+(m-1)+(d-1)/30)*COL;
  }
  function logoURL(l){return l?'assets/logos/'+l+'.png':'';}

  // 解析日
  D.forEach(function(d){
    var p=d.date.split('-');d.day=p.length>2?parseInt(p[2],10):15;
  });

  // ---- 贪心分层：稀疏段贴轴，密集段铺开 ----
  var lastX=LAYERS.map(function(){return -Infinity;});
  D.forEach(function(d){
    var x=xOf(d.y,d.m,d.day);
    d.x=x;
    var best=-1,bestScore=-Infinity;
    for(var i=0;i<LAYERS.length;i++){
      var gap=x-lastX[i];
      if(gap<MIN_GAP)continue;
      // 优先靠近轴（|layer| 小），且复用刚用过的层（gap 越大分越高但离轴远的惩罚）
      var score=(Math.abs(LAYERS[i])<=30?40:0) - Math.abs(LAYERS[i])*0.5 + Math.min(gap,MIN_GAP*3)*0.2;
      if(score>bestScore){bestScore=score;best=i;}
    }
    if(best<0){
      // 所有层都太近：选最远的一层覆盖
      best=0;
      for(var j=1;j<LAYERS.length;j++)if(lastX[j]<lastX[best])best=j;
    }
    d.layer=best;
    d.yPos=AXIS_Y+LAYERS[best];
    lastX[best]=x;
  });

    var s=document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('viewBox','0 0 '+W+' '+H);
    s.setAttribute('preserveAspectRatio','xMidYMid meet');
    s.setAttribute('role','img');
    s.setAttribute('aria-label','2018 至 2026 按月份排列的模型发布时间轴');

  // 主轴
  var axis=document.createElementNS('http://www.w3.org/2000/svg','line');
  axis.setAttribute('x1',X0);axis.setAttribute('y1',AXIS_Y);
  axis.setAttribute('x2',W-60);axis.setAttribute('y2',AXIS_Y);
  axis.setAttribute('stroke','var(--ink)');axis.setAttribute('stroke-width',2);
  s.appendChild(axis);

  // 年份 + 季度月份
  for(var y=Y0;y<=Y1;y++){
    var xYear=xOf(y,1,1);
    var t=document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',xYear);t.setAttribute('y',AXIS_Y-12);
    t.setAttribute('font-size','28');t.setAttribute('font-family','var(--hand)');
    t.setAttribute('fill','var(--red)');t.textContent=y;
    s.appendChild(t);
    var big=document.createElementNS('http://www.w3.org/2000/svg','line');
    big.setAttribute('x1',xYear);big.setAttribute('y1',AXIS_Y-6);
    big.setAttribute('x2',xYear);big.setAttribute('y2',AXIS_Y+6);
    big.setAttribute('stroke','var(--red)');big.setAttribute('stroke-width',2);
    s.appendChild(big);
    [4,7,10].forEach(function(mm){
      var xm=xOf(y,mm,1);
      var tk=document.createElementNS('http://www.w3.org/2000/svg','line');
      tk.setAttribute('x1',xm);tk.setAttribute('y1',AXIS_Y);
      tk.setAttribute('x2',xm);tk.setAttribute('y2',AXIS_Y+5);
      tk.setAttribute('stroke','var(--muted)');tk.setAttribute('stroke-width',1);
      s.appendChild(tk);
    });
  }
  for(var yy=Y0;yy<=Y1;yy++){
    [1,4,7,10].forEach(function(mm){
      var x=xOf(yy,mm,1);
      var mt=document.createElementNS('http://www.w3.org/2000/svg','text');
      mt.setAttribute('x',x);mt.setAttribute('y',AXIS_Y+24);
      mt.setAttribute('font-size','14');mt.setAttribute('font-family','var(--ui)');
      mt.setAttribute('text-anchor','middle');mt.setAttribute('fill','var(--muted)');
      mt.textContent=mm+'月';
      s.appendChild(mt);
    });
  }

  // 模型点
  D.forEach(function(d,idx){
    var x=d.x,y=d.yPos;
    var up=LAYERS[d.layer]<0;

    // 竖线连主轴（只在离轴较远时画，近的直接贴轴不画）
    if(Math.abs(LAYERS[d.layer])>30){
      var stem=document.createElementNS('http://www.w3.org/2000/svg','line');
      stem.setAttribute('x1',x);stem.setAttribute('y1',AXIS_Y+(up?-3:3));
      stem.setAttribute('x2',x);stem.setAttribute('y2',y+(up?9:-9));
      stem.setAttribute('stroke','var(--rule)');stem.setAttribute('stroke-width',1);
      s.appendChild(stem);
    }

    var g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','tl-model');
    g.setAttribute('tabindex','0');
    g.setAttribute('role','button');
    g.setAttribute('data-id',d.id);
    g.setAttribute('aria-label',d.name+'，'+d.date);
    // 逐点入场：按时间顺序依次画出
    g.style.animationDelay=(idx*0.006).toFixed(3)+'s';

    var logo=logoURL(d.logo);
    var r=8;
    if(logo){
      var clip=document.createElementNS('http://www.w3.org/2000/svg','clipPath');
      var cid='clip-'+idx;clip.setAttribute('id',cid);
      var cc=document.createElementNS('http://www.w3.org/2000/svg','circle');
      cc.setAttribute('cx',x);cc.setAttribute('cy',y);cc.setAttribute('r',r);
      clip.appendChild(cc);s.appendChild(clip);
      var img=document.createElementNS('http://www.w3.org/2000/svg','image');
      img.setAttribute('x',x-r);img.setAttribute('y',y-r);
      img.setAttribute('width',r*2);img.setAttribute('height',r*2);
      img.setAttribute('href',logo);
      img.setAttribute('clip-path','url(#'+cid+')');
      g.appendChild(img);
    } else {
      var dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
      dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r',6);
      dot.setAttribute('fill','var(--muted)');g.appendChild(dot);
    }

    // 名字标签预建但默认隐藏，点击才显示，任何密度都不压字
    var label=document.createElementNS('http://www.w3.org/2000/svg','text');
    var ly=y+(up?-14:22);
    label.setAttribute('x',x);label.setAttribute('y',ly);
    label.setAttribute('font-size','16');label.setAttribute('font-family','var(--hand)');
    label.setAttribute('fill','var(--red)');label.setAttribute('text-anchor','middle');
    label.setAttribute('stroke','var(--paper)');label.setAttribute('stroke-width','4');
    label.setAttribute('paint-order','stroke');
    label.setAttribute('class','tl-name');
    label.setAttribute('opacity','0');
    label.textContent=d.name;
    g.appendChild(label);

    g.addEventListener('click',function(){showDetail(d);});
    g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();showDetail(d);}});
    s.appendChild(g);
  });

  host.appendChild(s);

  /* ---- 完整显示 + 缩放看局部：改 viewBox 实现地图式交互 ---- */
  var vb={x:0,y:0,w:W,h:H};
  var full={x:0,y:0,w:W,h:H};
  function applyVB(){s.setAttribute('viewBox',vb.x+' '+vb.y+' '+vb.w+' '+vb.h);}
  function zoomAt(factor,cx,cy){
    // 横向时间轴：只缩放 X，Y 保持完整高度
    var nw=Math.max(W*.06,Math.min(W,vb.w/factor));
    var rx=cx-vb.x;
    vb.x=cx-rx*(nw/vb.w);
    vb.w=nw;vb.h=H;vb.y=0;
    if(vb.w>=W*.999){vb.x=0;vb.w=W;}
    vb.x=Math.max(0,Math.min(W-vb.w,vb.x));
    applyVB();updateZoomUI();
  }
  function updateZoomUI(){}

  /* ---- hover 就近吸附 + 展开（移植自 ccfddls DeadlineAxis）---- */
  var hoverId=null;
  var nodeEls={}; // id -> {g, label, logo, ring}
  // 收集节点元素引用
  document.querySelectorAll('.tl-model').forEach(function(g){
    var id=g.getAttribute('data-id');
    nodeEls[id]={g:g,label:g.querySelector('.tl-name')};
  });
  function applyHighlight(){
    Object.keys(nodeEls).forEach(function(id){
      var n=nodeEls[id];
      var on=(id===hoverId||id===selectedId);
      var dim=hoverId&&!on;
      n.g.style.opacity=dim?'0.55':'1';
      if(n.label)n.label.setAttribute('opacity',on?'1':'0');
      n.g.classList.toggle('expanded',id===hoverId);
    });
  }
  function nearestAt(clientX){
    var pt=s.createSVGPoint();pt.x=clientX;pt.y=0;
    var loc=pt.matrixTransform(s.getScreenCTM().inverse());
    var best=null,bd=Infinity;
    D.forEach(function(d){
      var dist=Math.abs(d.x-loc.x);
      if(dist<bd){bd=dist;best=d;}
    });
    return best;
  }
  // 滚轮缩放
  s.addEventListener('wheel',function(e){
    e.preventDefault();
    var pt=s.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    var loc=pt.matrixTransform(s.getScreenCTM().inverse());
    zoomAt(e.deltaY<0?1.25:0.8,loc.x,loc.y);
  },{passive:false});
  // 拖拽平移
  var dragging=false,start=null;
  s.addEventListener('pointerdown',function(e){dragging=true;start={x:e.clientX,y:e.clientY,vx:vb.x,vy:vb.y};s.setPointerCapture(e.pointerId);});
  s.addEventListener('pointermove',function(e){
    if(dragging&&start){
      var rect=s.getBoundingClientRect();
      var dx=(e.clientX-start.x)/rect.width*vb.w;
      vb.x=Math.max(0,Math.min(W-vb.w,start.vx-dx));
      applyVB();return;
    }
    // 非拖拽：就近吸附展开
    var near=nearestAt(e.clientX);
    var id=near?near.id:null;
    if(id!==hoverId){
      hoverId=id;applyHighlight();
      if(near)showDetail(near);
    }
  });
  s.addEventListener('pointerleave',function(){hoverId=null;applyHighlight();});
  s.addEventListener('pointerup',function(){dragging=false;start=null;});
  s.addEventListener('pointercancel',function(){dragging=false;start=null;});
  function showDetail(d){
    var p=document.getElementById('timeline-detail');
    if(p){
      var lg=d.logo?'<img class="d-logo" src="'+logoURL(d.logo)+'" alt="">':'';
      p.innerHTML='<div class="d-card">'+lg+'<div><b>'+d.name+'</b><span>'+d.coName+' · '+d.date+'</span></div></div>';
    }
    selectedId=d.id;
    applyHighlight();
  }
})();
