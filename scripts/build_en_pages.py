# -*- coding: utf-8 -*-
"""从中文 HTML 生成英文页面：静态文案翻译 + 数据脚本切换 + 语言互链。
中文页面为唯一源，重跑即同步，避免维护两套。"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web')

# 通用替换（按顺序，长串优先）
COMMON = [
    ('<html lang="zh-CN">', '<html lang="en">'),
    ('aria-label="页面导航"', 'aria-label="Main navigation"'),
    ('aria-label="机构图例"', 'aria-label="Organization legend"'),
    ('>编年 · Model Annals<', '>Chronicle · Model Annals<'),
    ('>模型 · Model Annals<', '>Models · Model Annals<'),
    ('>机构 · Model Annals<', '>Organizations · Model Annals<'),
    ('>技术 · Model Annals<', '>Techniques · Model Annals<'),
    ('content="大模型编年史，2018 至 2026 年 357 个模型的发布编年与关键技术。"',
     'content="A chronicle of 357 large models released 2018–2026, with key techniques and original sources."'),
    ('content="90 个大模型在统一坐标系中对比发布时间与上下文长度。"',
     'content="90 large models compared on release date and context length in one coordinate system."'),
    ('content="21 家机构的模型收录统计与最新发布。"',
     'content="Model counts and latest releases across 21 organizations."'),
    ('content="97 项关键技术，从词向量到 LLM-as-a-Judge，附原始论文与提出机构。"',
     'content="97 key techniques from word2vec to LLM-as-a-Judge, with original papers and proposers."'),
    ('href="index.html" aria-current="page">编年</a>', 'href="index-en.html" aria-current="page">Chronicle</a>'),
    ('>编年</a>', '>Chronicle</a>'),
    ('>模型</a>', '>Models</a>'),
    ('>机构</a>', '>Organizations</a>'),
    ('>技术</a>', '>Techniques</a>'),
    ('<div class="footer-inner">Model Annals</div>', '<div class="footer-inner">Model Annals</div>'),
    # 顶部语言切换（插入到 nav 末尾）
]

PAGE = {
    'index.html': [
        ('<h1 class="page-title" data-write>大模型编年史</h1>', '<h1 class="page-title" data-write>A Chronicle of Large Models</h1>'),
        ('<p class="kicker">2018 至 2026</p>', '<p class="kicker">2018 – 2026</p>'),
        ('<p class="page-quote" data-write>究天人之际，通古今之变。</p>',
         '<p class="page-quote" data-write>To trace the pattern of heaven and man, to see change across past and present.</p>'),
        ('<p class="quote-by" data-write>司马迁 · 报任安书</p>', '<p class="quote-by" data-write>Sima Qian · Letter to Ren An</p>'),
        ('>编年长轴<', '>Model Release Timeline<'),
        ('1.17 亿参数，512 token。自回归预训练的第一条主线。', '117M parameters, 512 tokens. The first thread of autoregressive pretraining.'),
        ('15 亿参数与掩码双向预训练。规模与理解，两条路并行。', '1.5B parameters and masked bidirectional pretraining. Scale and understanding, two roads in parallel.'),
        ('1750 亿参数。少样本能力出现，缩放法则成为共识。', '175B parameters. Few-shot ability appears; scaling laws become consensus.'),
        ('RLHF 让模型可对话。技术突破第一次来自训练方式而非参数。', 'RLHF makes models conversational. For the first time the breakthrough comes from training method, not scale.'),
        ('权重公开催生上千衍生模型。Qwen、DeepSeek、GLM 随之开源。', 'Open weights spawn thousands of derivatives. Qwen, DeepSeek and GLM follow suit.'),
        ('推理时计算。模型在回答前先想一会儿，算力从训练侧搬到推理侧。', 'Test-time compute. The model thinks before answering; compute shifts from training to inference.'),
        ('GRPO 强化学习激发推理，权重公开。开源追到第一梯队。', 'GRPO-style RL elicits reasoning with open weights. Open models reach the frontier.'),
        ('同一代切成多档。下半年 68 个新模型，上下文普遍到百万。', 'One generation, many tiers. 68 new models in the second half; million-token context becomes common.'),
        ('>多家<', '>Multiple<'),
        ('assets/timeline-data.js', 'assets/timeline-data-en.js'),
    ],
    'models.html': [
        ('<h1 class="page-title" data-write>模型对比</h1>', '<h1 class="page-title" data-write>Model Comparison</h1>'),
        ('<p class="kicker">90 models · 21 organizations</p>', '<p class="kicker">90 models · 21 organizations</p>'),
        ('<p class="page-quote" data-write>尺有所短，寸有所长。</p>',
         '<p class="page-quote" data-write>A foot may be too short; an inch may be too long.</p>'),
        ('<p class="quote-by" data-write>屈原 · 卜居</p>', '<p class="quote-by" data-write>Qu Yuan · Divination</p>'),
        ('>坐标图<', '>Chart<'),
        ('>规格表<', '>Specifications<'),
        ('>北美<', '>North America<'), ('>中国<', '>China<'), ('>其他<', '>Other<'),
        ('>权重开放<', '>Open weights<'),
        ('纵轴为对数刻度；未公开上下文的模型置于底部虚线带，同坐标点作轻微错开。',
         'Vertical axis is logarithmic. Models with undisclosed context sit in the bottom dashed band; coincident points are slightly offset.'),
        ('<th>模型</th><th>机构</th><th>发布</th><th>上下文</th><th>参数</th><th>许可</th>',
         '<th>Model</th><th>Organization</th><th>Released</th><th>Context</th><th>Params</th><th>License</th>'),
        ('>指标与排行<', '>Benchmarks & Leaderboards<'),
        ('>智能 / 速度 / 价格<', '>Intelligence / Speed / Price<'),
        ('>人类盲测<', '>Human blind evaluation<'),
        ('>抗污染评测<', '>Contamination-resistant eval<'),
        ('>开放权重<', '>Open weights<'),
        ('>代码工程<', '>Software engineering<'),
        ('>调用量 / 价格<', '>Usage / Price<'),
        ('>跑分 / 价格<', '>Scores / Price<'),
        ('>代码评测<', '>Code evaluation<'),
        ('>斯坦福学术评测<', '>Stanford academic eval<'),
        ('>生产向模型榜<', '>Production-oriented board<'),
        ('>专家私有题集<', '>Private expert questions<'),
        ('>行业真实任务<', '>Real industry tasks<'),
        ('assets/compare-data.js', 'assets/compare-data-en.js'),
    ],
    'companies.html': [
        ('<h1 class="page-title" data-write>机构</h1>', '<h1 class="page-title" data-write>Organizations</h1>'),
        ('<p class="page-quote" data-write>三人行，必有我师焉。</p>',
         '<p class="page-quote" data-write>Among three walking, one can be my teacher.</p>'),
        ('<p class="quote-by" data-write>论语 · 述而</p>', '<p class="quote-by" data-write>Analects · Shu Er</p>'),
        ('assets/companies-data.js', 'assets/companies-data-en.js'),
    ],
    'tech.html': [
        ('<h1 class="page-title" data-write>关键技术</h1>', '<h1 class="page-title" data-write>Key Techniques</h1>'),
        ('<p class="kicker">97 techniques · 2013 至 2024</p>', '<p class="kicker">97 techniques · 2013 – 2024</p>'),
        ('<p class="page-quote" data-write>苟日新，日日新，又日新。</p>',
         '<p class="page-quote" data-write>Renew yourself daily, and again daily, and always daily.</p>'),
        ('<p class="quote-by" data-write>礼记 · 大学</p>', '<p class="quote-by" data-write>Book of Rites · Great Learning</p>'),
        ('assets/tech-data.js', 'assets/tech-data-en.js'),
    ],
}

# 每个页面：i18n.js 必须最先加载；英文页加语言互链
def lang_link(zh_page, en_page, is_en):
    other = zh_page if is_en else en_page
    label = '中文' if is_en else 'English'
    return '<a class="lang-toggle" href="%s">%s</a>' % (other, label)


def main():
    for zh, pairs in PAGE.items():
        en = zh.replace('.html', '-en.html')
        s = open(os.path.join(WEB, zh), encoding='utf-8').read()
        # 幂等：先移除上一轮注入的 i18n 脚本与语言切换链接
        s = re.sub(r'\s*<script src="assets/i18n\.js"></script>', '', s)
        s = re.sub(r'\s*<a class="lang-toggle"[^>]*>[^<]*</a>', '', s)
        for a, b in COMMON:
            s = s.replace(a, b)
        for a, b in pairs:
            s = s.replace(a, b)
        # 内部链接全部指向英文页（wordmark / 导航 / 数据脚本）
        s = s.replace('href="index.html"', 'href="index-en.html"')
        for page in ('models', 'companies', 'tech'):
            s = s.replace('href="%s.html"' % page, 'href="%s-en.html"' % page)
        s = s.replace('assets/timeline-data.js', 'assets/timeline-data-en.js')
        # i18n.js 插到 site.js 之前
        s = s.replace('<script src="assets/site.js"></script>',
                      '<script src="assets/i18n.js"></script>\n<script src="assets/site.js"></script>')
        # 语言切换放进 nav（用占位符，避免被上面的内部链接替换误伤）
        s = s.replace('</nav>', '__LANG_LINK__\n  </nav>')
        s = s.replace('__LANG_LINK__', lang_link(zh, en, True))
        open(os.path.join(WEB, en), 'w', encoding='utf-8').write(s)
        print('生成', en)

    # 中文页也加 i18n.js 与 English 链接
    for zh in PAGE:
        s = open(os.path.join(WEB, zh), encoding='utf-8').read()
        s = re.sub(r'\s*<script src="assets/i18n\.js"></script>', '', s)
        s = re.sub(r'\s*<a class="lang-toggle"[^>]*>[^<]*</a>', '', s)
        s = s.replace('<script src="assets/site.js"></script>',
                      '<script src="assets/i18n.js"></script>\n<script src="assets/site.js"></script>')
        s = s.replace('</nav>', lang_link(zh, zh.replace('.html', '-en.html'), False) + '\n  </nav>')
        open(os.path.join(WEB, zh), 'w', encoding='utf-8').write(s)
        print('更新', zh)


if __name__ == '__main__':
    main()
