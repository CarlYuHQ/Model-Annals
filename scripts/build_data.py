#!/usr/bin/env python3
"""把 data/raw/*.json 合并为统一数据层，做校验与派生字段，输出 data/atlas.js。

前端只读取 atlas.js（把数据挂到 window.ATLAS），这样双击 index.html 用 file://
也能打开，不依赖本地服务器。同时输出一份格式化 JSON 便于仓库内查阅。
"""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
DATA = ROOT / "data"

FILES = ["frontier.json", "west-others.json", "china.json", "tech-events.json"]


def load_all():
    companies, models, techs, events = [], [], [], []
    for name in FILES:
        d = json.loads((RAW / name).read_text(encoding="utf-8"))
        companies += d.get("companies", [])
        models += d.get("models", [])
        techs += d.get("technologies", [])
        events += d.get("events", [])
    return companies, models, techs, events


def dedupe(items):
    """按 id 去重，保留信息更全的一条。"""
    seen = {}
    for it in items:
        iid = it.get("id")
        if not iid:
            continue
        score = sum(1 for v in it.values() if v not in (None, "", [], {}))
        if iid not in seen or score > seen[iid][0]:
            seen[iid] = (score, it)
    return [v[1] for v in seen.values()]


def year_of(date_str):
    if not date_str:
        return None
    try:
        return int(str(date_str)[:4])
    except ValueError:
        return None


def main():
    companies, models, techs, events = load_all()
    companies = dedupe(companies)
    models = dedupe(models)
    techs = dedupe(techs)
    events = dedupe(events)

    company_ids = {c["id"] for c in companies}
    model_ids = {m["id"] for m in models}
    tech_ids = {t["id"] for t in techs}

    issues = []

    # 排序
    models.sort(key=lambda m: (m.get("release") or "9999", m.get("name") or ""))
    events.sort(key=lambda e: (e.get("date") or "9999", e.get("title") or ""))
    techs.sort(key=lambda t: (t.get("year") or 9999, t.get("name") or ""))
    companies.sort(key=lambda c: (c.get("country") or "", c.get("founded") or 9999))

    # 派生字段 + 引用校验
    for m in models:
        m["year"] = year_of(m.get("release"))
        if m.get("company") and m["company"] not in company_ids:
            issues.append(f"模型 {m['id']} 引用了未知公司 {m['company']}")
        if m.get("predecessor") and m["predecessor"] not in model_ids:
            issues.append(f"模型 {m['id']} 引用了未知前代 {m['predecessor']}")
    for e in events:
        e["year"] = year_of(e.get("date"))
        if e.get("company") and e["company"] not in company_ids and e["company"] not in ("community", "industry"):
            issues.append(f"事件 {e['id']} 引用了未知公司 {e['company']}")
        if e.get("model_id") and e["model_id"] not in model_ids:
            issues.append(f"事件 {e['id']} 引用了未知模型 {e['model_id']}")
        if e.get("tech_id") and e["tech_id"] not in tech_ids:
            issues.append(f"事件 {e['id']} 引用了未知技术 {e['tech_id']}")
    for t in techs:
        t["model_refs"] = [mid for mid in (t.get("models") or []) if mid in model_ids]

    # 公司总部经纬度（用于地理视图）。同一城市多家机构加轻微抖动避免重叠。
    geo = {
        "openai": [-122.42, 37.77], "anthropic": [-122.41, 37.79],
        "google": [-122.08, 37.42], "meta": [-122.15, 37.48],
        "xai": [-122.14, 37.44], "nvidia": [-121.96, 37.35],
        "mistral": [2.35, 48.86], "cohere": [-79.38, 43.65],
        "ai21": [34.78, 32.08],
        "baidu": [116.40, 39.90], "bytedance": [116.41, 39.91],
        "zhipu": [116.39, 39.92], "moonshot": [116.42, 39.89],
        "01ai": [116.38, 39.91],
        "alibaba": [120.15, 30.27], "deepseek": [120.14, 30.28],
        "minimax": [121.47, 31.23], "internlm": [121.46, 31.22],
        "stepfun": [121.48, 31.24],
        "tencent": [114.06, 22.54], "huawei": [114.05, 22.55],
    }
    for c in companies:
        if c["id"] in geo:
            c["lon"], c["lat"] = geo[c["id"]]

    # 统计信息（供前端展示）
    stats = {
        "models": len(models),
        "companies": len(companies),
        "technologies": len(techs),
        "events": len(events),
        "year_min": min((m["year"] for m in models if m.get("year")), default=None),
        "year_max": max((m["year"] for m in models if m.get("year")), default=None),
        "by_company": dict(Counter(m.get("company") for m in models if m.get("company"))),
        "by_year": dict(Counter(str(m["year"]) for m in models if m.get("year"))),
        "by_license": dict(Counter(m.get("license") for m in models if m.get("license"))),
        "by_family": dict(Counter(m.get("family") for m in models if m.get("family"))),
    }

    atlas = {
        "meta": {
            "title": "大模型发展全景档案",
            "subtitle": "LLM Evolution Atlas",
            "updated": "2026-11-19",
            "note": "数据来自公开来源，各条目附原始链接。未知字段留空，不做推测。",
        },
        "stats": stats,
        "companies": companies,
        "models": models,
        "technologies": techs,
        "events": events,
    }

    # 输出前端可直接引用的 JS
    js = "/* 自动生成，请勿手改。源文件见 data/raw/，构建脚本 scripts/build_data.py */\n"
    js += "window.ATLAS = " + json.dumps(atlas, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (DATA / "atlas.js").write_text(js, encoding="utf-8")

    # 输出便于查阅的 JSON
    (DATA / "atlas.json").write_text(
        json.dumps(atlas, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"合并完成：{len(models)} 模型 / {len(companies)} 公司 / {len(techs)} 技术 / {len(events)} 事件")
    print(f"年份范围：{stats['year_min']} – {stats['year_max']}")
    print(f"许可分布：{stats['by_license']}")
    print(f"引用问题 {len(issues)} 条：")
    for i in issues[:30]:
        print("  -", i)
    if len(issues) > 30:
        print(f"  ... 还有 {len(issues)-30} 条")


if __name__ == "__main__":
    main()
