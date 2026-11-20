<div align="center">

# Model Annals

**大模型编年史 — 一部关于模型、机构与关键技术的可视化档案。**

**[English](README.en.md) | 中文**

[![Models](https://img.shields.io/badge/Models-357-2c4ec4.svg)](web/index.html)
[![Organizations](https://img.shields.io/badge/Organizations-21-d7303b.svg)](web/companies.html)
[![Techniques](https://img.shields.io/badge/Techniques-48-2f9b46.svg)](web/tech.html)
[![Static](https://img.shields.io/badge/Dependencies-none-7a7f99.svg)](#运行)
[![License](https://img.shields.io/badge/Data-public%20sources-3c4166.svg)](#来源与局限)

</div>

> **Scope.** 这是一个**纯静态、数据驱动**的多视角档案，收录 **357 个模型**、**21 家机构**、**48 项关键技术**，时间跨度 2018—2026。无后端、无构建、无外部 API；每个条目都附原始来源链接；**未公开的数据一律留空，不做推测**。所有内容来自 `data/atlas.json` 一份数据源，页面由脚本生成。

**在线浏览：** [https://carlyuhq.github.io/Model-Annals/](https://carlyuhq.github.io/Model-Annals/) · [English version](https://carlyuhq.github.io/Model-Annals/index-en.html)

![编年长轴预览](docs/preview.jpg)

## 它解决什么

阅读模型史时，难点不是找资料，而是**看清时间与关系**。Model Annals 把同一个数据集切成四个视角：

- **一条轴看全貌** — 357 个模型按真实发布月份铺开，机构 logo 作点。可按年份区间、机构筛选；筛选后点等距重排、刻度同步变化（动态效果参考 `CarlYuHQ/ccfddls`）。
- **一张图看能力演进** — 90 个代表模型放在「时间 × 上下文长度」对数坐标上；未公开上下文单独成带，同坐标点自动错开，hover 显示详情。
- **一张卡看机构** — 21 家机构的模型数、最新发布、谱系与开放权重比例，带机构 logo。
- **点开即读的技术小博客** — 48 项关键技术各有原始论文、提出机构、核心机制、影响、关联模型与同类技术导航。内容全部来自结构化字段，不新写事实。

## 四个页面

| 页面 | 内容 |
|---|---|
| [编年](web/index.html) / [EN](web/index-en.html) | 横向编年长轴，年份区间 + 机构筛选、hover 就近吸附、滚轮缩放 |
| [模型](web/models.html) / [EN](web/models-en.html) | 对数散点图 + 规格表，机构 logo 索引筛选 |
| [机构](web/companies.html) / [EN](web/companies-en.html) | 21 家机构统计卡片，按地区筛选 |
| [技术](web/tech.html) / [EN](web/tech-en.html) | 48 项技术卡片，点开为带论文链接的小博客 |

**双语**：每页右上角 `English / 中文` 一键切换。英文版与中文版共用同一套 CSS/JS，语言由 `assets/i18n.js` 字典与 `*-en.js` 数据文件驱动，中文页是唯一源，重跑脚本即同步。

## 运行

零依赖、零构建，直接打开 `web/index.html`（`file://` 可用），或：

```bash
python3 -m http.server 8000 --directory web
# http://localhost:8000
```

GitHub Pages 部署源为 `gh-pages` 分支（根目录）。[`.github/workflows/pages.yml`](.github/workflows/pages.yml) 在每次 push 到 `main` 时把 `web/` 同步为该分支的根内容，Pages 随即自动重建。

## 重新生成

```bash
python3 scripts/build_data.py          # 合并 data/raw/ → data/atlas.json
python3 scripts/build_web_data.py      # atlas.json → web/assets/*-data.js
python3 scripts/build_en_data.py       # atlas.json → web/assets/tech-data-en.js（英文正文）
python3 scripts/build_en_pages.py      # 中文 HTML → 四个英文 HTML（幂等）
```

改动数据后按以上顺序重跑；中文 HTML 是唯一源，不要直接编辑 `*-en.html`。

## 目录

```
model-annals/
├── web/                     # 站点根（Pages 部署此目录）
│   ├── index.html           # 中文编年页
│   ├── *-en.html            # 英文版四页（生成）
│   └── assets/
│       ├── site.css         # 王虹学术手写风设计系统
│       ├── i18n.js          # 中英 UI 字典
│       ├── *-data.js        # 数据层（中/英）
│       └── logos/           # 21 家机构 logo
├── data/atlas.json          # 唯一数据源
├── docs/preview.jpg         # README 预览图
└── scripts/                 # 生成脚本
```

## 设计

王虹学术手写风：近白纸面、深蓝手写字（Xiaolai）、短红线、局部荧光、大量留白。标题与名言逐字入场，名言下红笔线逐笔画出；不使用渐变、玻璃拟态、emoji 堆砌等生成式默认套路。遵循 `prefers-reduced-motion`。

## 来源与局限

数据以机构官方发布页、系统卡、技术报告与论文为主；部分 2026 年新模型的日期来自可靠媒体或行业时间线聚合，已在条目 `note` 标注。未公开的字段留空显示为「未公开」，不以 0 代替。数据截止 2026-11-19。

---

<div align="center">

[English](README.en.md) · [在线站点](https://carlyuhq.github.io/Model-Annals/) · [仓库](https://github.com/CarlYuHQ/Model-Annals)

</div>
