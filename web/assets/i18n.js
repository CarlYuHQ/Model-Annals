/* UI 语言字典：中文为默认，英文页在 <html lang="en"> 时自动切换。
   数据层（技术正文、机构来源等）由 *-en.js 覆盖，与此字典分开。 */
(function(){
  'use strict';
  var ZH={
    all:'全部', year:'年份', org:'机构', from:'起始年', to:'结束年', reset:'重置',
    month:'月', axisAria:'2018 至 2026 模型发布编年轴',
    context:'上下文', ctxUndisclosed:'上下文未公开', undisclosed:'未公开',
    params:'B 参数', chartAria:'模型上下文长度对数坐标散点图',
    licOpen:'开放', licWeighted:'受限', licClosed:'闭源',
    proposedBy:'提出机构', category:'类别', originalPaper:'原始论文',
    coreMechanism:'核心机制', impact:'影响', relatedModels:'关联模型',
    relatedTech:'同类技术', source:'来源：', viewDetail:'查看 ', collapse:'收起 ×',
    cn:'中国', us:'北美', other:'其他', official:'官网 ↗', latest:'最新',
    families:' 个谱系 · ', openWeights:' 个开放权重',
    axisNote:'纵轴为对数刻度；未公开上下文的模型置于底部虚线带，同坐标点作轻微错开。',
    chartNote:'纵轴为对数刻度；未公开上下文的模型置于底部虚线带，同坐标点作轻微错开。'
  };
  var EN={
    all:'All', year:'Year', org:'Organization', from:'From', to:'To', reset:'Reset',
    month:'', axisAria:'Model release timeline, 2018–2026',
    context:'Context', ctxUndisclosed:'Context not disclosed', undisclosed:'Undisclosed',
    params:'B params', chartAria:'Scatter plot of model context length (log scale)',
    licOpen:'Open', licWeighted:'Restricted', licClosed:'Proprietary',
    proposedBy:'Proposed by', category:'Category', originalPaper:'Original paper',
    coreMechanism:'Core mechanism', impact:'Impact', relatedModels:'Related models',
    relatedTech:'Related techniques', source:'Source: ', viewDetail:'Read ', collapse:'Close ×',
    cn:'China', us:'North America', other:'Other', official:'Website ↗', latest:'Latest',
    families:' families · ', openWeights:' open-weight',
    axisNote:'Vertical axis is logarithmic. Models with undisclosed context sit in the bottom dashed band; coincident points are slightly offset.',
    chartNote:'Vertical axis is logarithmic. Models with undisclosed context sit in the bottom dashed band; coincident points are slightly offset.'
  };
  function lang(){
    return (document.documentElement.lang||'zh').toLowerCase().indexOf('en')===0?'en':'zh';
  }
  window.I18N={zh:ZH,en:EN};
  window.L=function(k){
    var d=window.I18N[lang()]||ZH;
    return (d[k]!==undefined)?d[k]:(ZH[k]!==undefined?ZH[k]:k);
  };
  window.IS_EN=function(){return lang()==='en';};
})();
