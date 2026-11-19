# Model Annals

> 大模型编年史 — 一部关于模型、机构与关键技术的编年史。

一个纯静态、数据驱动的多视角可视化档案：收录 **356 个大模型**、**21 家机构**、**30 项关键技术**与 **64 个历史事件**，时间跨度 2018—2026（含 11 月最新发布）。每个条目都附原始来源链接；未公开的数据一律留空，不做推测。

## 手写编年史网页（主展示）

[打开网页版 →](web/index.html)

这是一个**真正的网页**：单页滚动、固定导航、响应式、可分享链接，而不是幻灯片。以时间轴为主线，王虹学术手写风（Notability 风格）：近白纸面、深蓝手写字、短红线、细红框、绿荧光结论、大量留白。手绘线条（下划线、红框、荧光、圆圈、时间轴）由 `web/assets/handdraw.js` 用固定种子生成 SVG，滚动进入视口时逐笔画出。

四个章节：**编年**（左右交替的年份时间轴）· **谱系**（六条线的思维导图）· **数据**（手写表格与数字）· **关于**（阅读注意）。

网页遵循 Hallmark 反 AI 味规则，`sloplint` 扫描 0 FAIL / 0 REFLEX / 0 WARN，并在 500px 与 1440px 实际渲染验证过。

> `deck/` 下另有一版 17 页王虹手写风**幻灯片**（翻页版 / 逐步书写版），作为演示材料的备选，不是主展示。

## 数据视图

完整数据仓库仍保留，六个视角如下：

| 视图 | 说明 |
|---|---|
| [总览](index.html) | 数字总览、阅读路径、三个时代分期、最新发布 |
| [时间线](timeline.html) | 模型发布与行业事件合流，按机构 / 类型筛选 |
| [关系图谱](graph.html) | 机构—模型—技术三类节点的交互网络（D3 力导向） |
| [模型家谱](lineage.html) | 沿 predecessor 关系梳理代际传承 |
| [数据观察](stats.html) | 发布密度、上下文演进、参数分布、许可占比 |
| [地理分布](geo.html) | 机构总部的世界地图与密集区 |
| [模型索引](catalog.html) | 可搜索、筛选、排序的完整清单 |

另有[数据来源与说明](sources.html)页，记录统计口径、来源原则与已知局限。

## 运行

零依赖、零构建。直接打开 `index.html` 即可（数据以 JS 形式加载，`file://` 下可用）。

若需本地服务：

```bash
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000
```

用 GitHub Pages 托管时，把本仓库设为站点的根目录即可。

## 目录结构

```
llm-evolution-atlas/
├── index.html              # 总览
├── timeline.html           # 时间线
├── graph.html              # 关系图谱
├── lineage.html            # 模型家谱
├── stats.html              # 数据观察
├── geo.html                # 地理分布
├── catalog.html            # 模型索引
├── sources.html            # 数据来源与说明
├── assets/
│   ├── css/main.css        # 设计系统（深色科技编辑风 · 数据发光感）
│   ├── js/common.js        # 公共逻辑：报头、抽屉、工具函数
│   └── vendor/             # D3 / topojson（本地，离线可用）
├── data/
│   ├── raw/                # 分机构采集的原始数据（人工维护）
│   ├── atlas.json          # 合并后的统一数据（可读）
│   ├── atlas.js            # 同上，供页面加载
│   └── world.js            # Natural Earth 110m 世界边界
└── scripts/
    └── build_data.py       # 合并 / 校验 / 派生字段 / 生成数据层
```

## 数据更新

编辑 `data/raw/` 下对应机构的 JSON，然后重建：

```bash
python3 scripts/build_data.py
```

脚本会校验引用完整性、按日期排序、派生统计字段，并重新生成 `atlas.json` 与 `atlas.js`。校验发现问题会在终端列出，但不会静默丢弃条目。

原始数据字段：

- `models[]`：`id, company, family, name, release, params_b, context_k, modality, license, predecessor, highlights[], source, note`
- `companies[]`：`id, name, name_zh, country, founded, hq, site, blurb`
- `technologies[]`：`id, name, name_zh, year, category, origin, summary, impact, source, models[]`
- `events[]`：`id, date, title, company, type, summary, source, model_id, tech_id`

许可取值：`open`（开放权重）、`weighted`（受限开源）、`proprietary`（闭源）。

## 设计

采用"深色科技编辑风"设计系统 v2：近黑底（`#0A0B0D`）、细网格背景、Space Grotesk 几何标题、数据青绿主强调色（`#00D9A3`）+ 琥珀橙 / 蓝双辅色、JetBrains Mono 用于编号与数据标签。视觉锤包括 Hero 逐字入场、数字滚动、发光节点、图表生长动画、滚动进度条。刻意规避生成式 AI 的默认套路（紫粉渐变、玻璃拟态、emoji 堆砌、居中式英雄区）。所有字体从 Google Fonts 加载，离线时回退到系统字体，并遵循 `prefers-reduced-motion`。

## 来源与局限

数据来源以机构官方发布页、系统卡、技术报告与论文为主，部分 2026 年新模型的日期来自可靠媒体报道或行业时间线聚合站，已在条目的 `note` 字段标注。详见 [数据来源与说明](sources.html)。

本项目为独立整理，与文中所列任何机构无隶属或背书关系。

## 许可

MIT — 详见 [LICENSE](LICENSE)。
