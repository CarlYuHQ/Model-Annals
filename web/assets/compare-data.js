/* Model Annals — 对比图数据快照
   取自 data/atlas.json（356 条档案），仅收录公开披露的字段。
   ctx 单位 K token；param 单位 B；未知一律 null，不推测。
   数据截止 2026-11-19。 */
window.COMPARE_DATA = [
  { id:'gpt-6.1-terra',      name:'GPT-6.1 Terra',     company:'OpenAI',    region:'us', date:'2026-10', ctx:1050, param:null, license:'proprietary', modality:'text,image', note:'电脑操作与视觉推理，六档推理强度' },
  { id:'claude-fable-5-2',   name:'Claude Fable 5.2',  company:'Anthropic', region:'us', date:'2026-11', ctx:1000, param:null, license:'proprietary', modality:'text,image', note:'编码、金融与科学任务的前沿档' },
  { id:'gemini-4-hydrogen',  name:'Gemini 4 Hydrogen', company:'Google',    region:'us', date:'2026-11', ctx:1000, param:null, license:'proprietary', modality:'text,image,audio,video', note:'原生多模态，四档思考模式' },
  { id:'qwen4-max',          name:'Qwen4-Max',         company:'阿里',       region:'cn', date:'2026-11', ctx:1000, param:2400, license:'proprietary', modality:'text,image', note:'通义千问旗舰，最大参数之一' },
  { id:'hy4-flash',          name:'混元 Hy4 flash',    company:'腾讯',       region:'cn', date:'2026-11', ctx:1024, param:224,  license:'proprietary', modality:'text,image', note:'混元最新，1024K 上下文' },
  { id:'deepseek-v4-1-flash',name:'DeepSeek-V4.1',     company:'DeepSeek',  region:'cn', date:'2026-09', ctx:1000, param:552,  license:'open',       modality:'text', note:'MoE 开源，高性价比推理' },
  { id:'glm-5-3-flash',      name:'GLM-5.3-Flash',     company:'智谱',       region:'cn', date:'2026-08', ctx:1000, param:320,  license:'open',       modality:'text', note:'智谱开源快速档' },
  { id:'kimi-k2-7-code',     name:'Kimi K2.7 Code',    company:'月之暗面',   region:'cn', date:'2026-06', ctx:256,  param:1000, license:'weighted',   modality:'text,image', note:'代码向，权重开放' },
  { id:'doubao-seed-2-1',    name:'Doubao Seed 2.1',   company:'字节',       region:'cn', date:'2026-06', ctx:256,  param:null, license:'proprietary', modality:'text,image', note:'豆包主力版本' },
  { id:'grok-4-7',           name:'Grok 4.7',          company:'xAI',       region:'us', date:'2026-09', ctx:500,  param:null, license:'proprietary', modality:'text,image', note:'xAI 旗舰' },
  { id:'llama-4-maverick',   name:'Llama 4 Maverick',  company:'Meta',      region:'us', date:'2025-04', ctx:1000, param:400,  license:'weighted',   modality:'text,image', note:'开源阵营代表，MoE' },
  { id:'command-a-plus',     name:'Command A+',        company:'Cohere',    region:'ca', date:'2026-05', ctx:128,  param:218,  license:'open',       modality:'text', note:'企业向开放模型' },
];
