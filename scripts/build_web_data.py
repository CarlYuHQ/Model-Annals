#!/usr/bin/env python3
"""从 data/atlas.json 生成网页用的数据快照（timeline / compare / companies / tech）。
   与 scripts/build_data.py 串联使用：先 build_data，再本脚本。"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web' / 'assets'
atlas = json.loads((ROOT / 'data' / 'atlas.json').read_text(encoding='utf-8'))

LOGO = {
    'openai':'openai','anthropic':'anthropic','google':'deepmind','meta':'meta','xai':'x',
    'nvidia':'nvidia','mistral':'mistral','cohere':'cohere','ai21':'ai21','deepseek':'deepseek',
    'alibaba':'qwenlm','bytedance':'bytedance','moonshot':'moonshot','zhipu':'zhipuai',
    'minimax':'minimaxi','tencent':'tencent','huawei':'huawei','stepfun':'stepfun',
    '01ai':'01ai','internlm':'internlm','baidu':'baidu',
}
CN = {'alibaba','deepseek','bytedance','zhipu','moonshot','minimax','baidu','tencent',
      'huawei','stepfun','internlm','01ai'}
US = {'openai','anthropic','google','meta','xai','nvidia'}
REGION = lambda cid: 'us' if cid in US else ('cn' if cid in CN else 'other')

def region_of(cid):
    if cid in US: return 'us'
    if cid in CN: return 'cn'
    return 'other'

def write_js(name, comment, data):
    (WEB / name).write_text(
        f'/* {comment} */\nwindow.{data[0]} = ' + json.dumps(data[1], ensure_ascii=False, separators=(',', ':')) + ';\n',
        encoding='utf-8')

# ---- timeline：全部有发布日期的模型，精确到月 ----
tl = []
for m in atlas['models']:
    r = m.get('release')
    if not r: continue
    comp = next((c for c in atlas['companies'] if c['id'] == m['company']), None)
    p = r.split('-')
    tl.append({
        'id': m['id'], 'name': m['name'], 'company': m['company'],
        'coName': comp['name'] if comp else m['company'],
        'logo': LOGO.get(m['company']),
        'y': int(p[0]), 'm': int(p[1]) if len(p) > 1 else 6, 'date': r,
        'ctx': m.get('context_k'), 'param': m.get('params_b'),
        'license': m.get('license'),
        'key': bool(m.get('highlights')) and (m.get('year') or 0) >= 2024,
    })
tl.sort(key=lambda x: (x['y'], x['m'], x['date']))
write_js('timeline-data.js', f'自动生成：全部有发布日期的模型（{len(tl)} 条），精确到月。', ('TIMELINE_DATA', tl))

# ---- compare：每家 4 个代表 + 关键细分版本 ----
by_co = {}
for m in atlas['models']:
    if m.get('release'):
        by_co.setdefault(m['company'], []).append(m)
cmp = []
for cid, arr in by_co.items():
    arr = sorted({m['id']: m for m in arr}.values(), key=lambda x: x['release'])
    idxs = sorted({0, len(arr)//3, 2*len(arr)//3, len(arr)-1})
    for i in idxs:
        m = arr[i]
        comp = next((c for c in atlas['companies'] if c['id'] == cid), None)
        cmp.append({
            'id': m['id'], 'name': m['name'], 'company': comp['name'] if comp else cid,
            'companyId': cid, 'region': region_of(cid), 'date': m['release'][:7],
            'ctx': m.get('context_k'), 'param': m.get('params_b'), 'license': m.get('license'),
            'modality': m.get('modality', ''), 'predecessor': m.get('predecessor'),
            'note': m.get('note', ''), 'highlights': m.get('highlights', []),
        })
# 保底：被抽样漏掉的细分版本（名字带日期后缀 -MMDD，或 note 明确标注为更新版本的）
import re
def is_variant(m):
    name = m.get('name', '') or ''
    note = m.get('note', '') or ''
    return bool(re.search(r'-\d{4}$', name) or re.search(r'\b\d{4}\b.*版本|更新版本|小更新|checkpoint', note))
have = {x['id'] for x in cmp}
for m in atlas['models']:
    if m.get('predecessor') and m['id'] not in have and m.get('release') and is_variant(m):
        comp = next((c for c in atlas['companies'] if c['id'] == m['company']), None)
        cmp.append({
            'id': m['id'], 'name': m['name'], 'company': comp['name'] if comp else m['company'],
            'companyId': m['company'], 'region': region_of(m['company']), 'date': m['release'][:7],
            'ctx': m.get('context_k'), 'param': m.get('params_b'), 'license': m.get('license'),
            'modality': m.get('modality', ''), 'predecessor': m.get('predecessor'),
            'note': m.get('note', ''), 'highlights': m.get('highlights', []),
        })
cmp.sort(key=lambda x: x['date'])
write_js('compare-data.js', f'自动生成：每家代表模型 + 关键细分版本（{len(cmp)} 条）。', ('COMPARE_DATA', cmp))

# ---- companies：全量统计 ----
companies = []
for c in atlas['companies']:
    cid = c['id']
    ms = [m for m in atlas['models'] if m['company'] == cid]
    latest = max(ms, key=lambda x: (x.get('release') or '')) if ms else None
    companies.append({
        'id': cid, 'name': c['name'], 'zh': c.get('name_zh', ''), 'logo': LOGO.get(cid),
        'region': region_of(cid), 'count': len(ms),
        'latest': latest['name'] if latest else '',
        'latestDate': (latest.get('release') or '')[:7] if latest else '',
        'latestCtx': latest.get('context_k') if latest else None,
        'families': len({m.get('family', '') for m in ms}),
        'openCount': sum(1 for m in ms if m.get('license') in ('open', 'weighted')),
        'src': c.get('site', ''),
    })
companies.sort(key=lambda x: -x['count'])
write_js('companies-data.js', f'自动生成：全量统计 {len(companies)} 家机构。', ('COMPANIES_DATA', companies))

# ---- tech（tech.js 读 t.cat；详情小博客需要 impact / models / model_refs）----
tech = [{k: t.get(k) for k in
         ('id','name','year','category','origin','summary','impact','source','models','model_refs')}
        | {'zh': t.get('name_zh'), 'cat': t.get('category') or '其他'}
        for t in atlas['technologies']]
write_js('tech-data.js', f'自动生成：{len(tech)} 项关键技术。', ('TECH_DATA', tech))

print(f'网页数据已生成：timeline {len(tl)} / compare {len(cmp)} / companies {len(companies)} / tech {len(tech)}')
