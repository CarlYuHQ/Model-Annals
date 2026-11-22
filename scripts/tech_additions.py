# -*- coding: utf-8 -*-
"""补充的技术条目：覆盖 2013–2024 的预训练前史、架构组件、分布式训练、
   数据工程、推理、评测、多模态与检索。每条都附原始论文链接，可批量验证。

写入 data/raw/tech-history-supplement.json（被 build_data.py 自动 glob）。
"""
import json

# (id, name_zh, name_en, year, category, origin, origin_en, summary_zh, impact_zh,
#  summary_en, impact_en, source)
A = [
# ---- 预训练前史 / 表示学习 ----
("elmo", "ELMo 上下文词表示", "ELMo: Deep Contextualized Word Representations", 2018, "训练方法",
 "Allen Institute for AI（Peters 等）", "Allen Institute for AI (Peters et al.)",
 "用双向 LSTM 语言模型为同一个词生成依赖整句语境的动态向量，取代 word2vec 那种一词一向量的静态表示。下游任务把不同层的表示加权组合即可接入。",
 "首次让「同一个词在不同句子里有不同向量」成为标准做法，直接催生了 BERT 与预训练—微调范式。",
 "A bidirectional LSTM language model produces a distinct vector for each word depending on its whole sentence, replacing the one-vector-per-word static embeddings of word2vec. Downstream models combine weighted layers of these representations.",
 "Made context-dependent word vectors standard and directly set the stage for BERT and the pretrain-then-finetune paradigm.",
 "https://arxiv.org/abs/1802.05365"),

("ulmfit", "ULMFiT 通用微调", "ULMFiT: Universal Language Model Fine-tuning", 2018, "训练方法",
 "fast.ai（Howard & Ruder）", "fast.ai (Howard & Ruder)",
 "提出三阶段流程：在通用语料预训练语言模型、在目标领域继续预训练、最后用逐层解冻与斜三角学习率微调分类器。少量标注数据即可达到当时最佳文本分类效果。",
 "证明预训练语言模型可以迁移到任意下游任务，是「预训练 + 微调」路线在 BERT 之前最有力的证据。",
 "A three-stage recipe: pretrain a language model on general text, continue pretraining on the target domain, then fine-tune a classifier with gradual unfreezing and a slanted triangular learning rate. Strong text classification with very few labels.",
 "Showed pretrained language models transfer to arbitrary downstream tasks; the strongest evidence for pretrain-then-finetune before BERT.",
 "https://arxiv.org/abs/1801.06146"),

("glove", "GloVe 全局词向量", "GloVe: Global Vectors for Word Representation", 2014, "数据",
 "Stanford（Pennington 等）", "Stanford (Pennington et al.)",
 "利用全局词—词共现矩阵做加权最小二乘分解，把局部窗口方法的类比推理能力与全局统计信息结合，得到低维稠密词向量。",
 "与 word2vec 并列成为预训练时代之前的默认词表示，也是早期 NLP 模型输入层的事实标准。",
 "Factorizes a global word-word co-occurrence matrix with weighted least squares, combining the analogy-solving ability of local window methods with global corpus statistics.",
 "Became a default word representation alongside word2vec and the de facto input embedding for early NLP models.",
 "https://aclanthology.org/D14-1162/"),

("subword-tokenization", "子词切分 BPE", "Subword Tokenization (BPE / SentencePiece)", 2016, "数据",
 "University of Edinburgh（Sennrich 等）；Google（Kudo 等）", "University of Edinburgh (Sennrich et al.); Google (Kudo et al.)",
 "把稀有词拆成高频子词单元，用字节对编码或一元语言模型从语料自动学习词表，在固定词表大小下消除未登录词并控制序列长度。",
 "所有主流大模型的分词基础；决定了上下文长度、多语言覆盖与数字/代码的处理方式。",
 "Rare words are split into frequent subword units; byte-pair encoding or a unigram language model learns the vocabulary from corpus statistics, eliminating unknown tokens under a fixed vocabulary size.",
 "The tokenization foundation of every mainstream LLM; it determines effective context length, multilingual coverage and how numbers or code are handled.",
 "https://arxiv.org/abs/1508.07909"),

("adam-adamw", "Adam / AdamW 优化器", "Adam and AdamW Optimizers", 2014, "训练方法",
 "Kingma & Ba；Loshchilov & Hutter", "Kingma & Ba; Loshchilov & Hutter",
 "Kingma & Ba 2014 的 Adam 用一阶、二阶动量估计为每个参数自适应调整学习率；Loshchilov & Hutter 2017 的 AdamW 把权重衰减与梯度更新解耦，修正了 L2 正则在自适应优化器中的偏差。",
 "成为 Transformer 与几乎所有大模型预训练的默认优化器，使大规模训练对超参数不再那么敏感。",
 "Adam adapts the learning rate per parameter using first- and second-moment estimates; AdamW decouples weight decay from the gradient update, fixing the bias of L2 regularization under adaptive optimizers.",
 "The default optimizer for Transformers and virtually all LLM pretraining, making large-scale training far less sensitive to hyperparameters.",
 "https://arxiv.org/abs/1412.6980"),

("layer-norm", "层归一化", "Layer Normalization", 2016, "架构",
 "University of Toronto（Ba 等）", "University of Toronto (Ba et al.)",
 "在单个样本的特征维度上做归一化，不依赖批次统计量，因此对变长序列与小批量训练稳定，并显著加速循环网络收敛。",
 "Transformer 每个子层的标准组件；后续的 RMSNorm、Pre-LN 变体决定了百层以上模型的训练稳定性。",
 "Normalizes across the feature dimension of a single example rather than over a batch, so it is stable for variable-length sequences and small batches and speeds up convergence.",
 "A standard component of every Transformer sublayer; its RMSNorm and Pre-LN variants determine whether hundred-layer models train stably.",
 "https://arxiv.org/abs/1607.06450"),

("residual-connection", "残差连接", "Residual Connections", 2015, "架构",
 "Microsoft Research（He 等）", "Microsoft Research (He et al.)",
 "把层的输出改为 F(x)+x，让梯度可以沿恒等路径直接回传，从而训练上百层的网络而不会出现退化。",
 "Transformer 的注意力层与前馈层都靠残差连接堆叠，是大模型能不断加深的前提。",
 "Rewrites a layer as F(x)+x so gradients flow along an identity path, allowing networks with hundreds of layers to train without degradation.",
 "Both attention and feed-forward sublayers in Transformers rely on residual connections; they are the prerequisite for ever-deeper LLMs.",
 "https://arxiv.org/abs/1512.03385"),

("pos-encoding-sinusoidal", "正弦位置编码", "Sinusoidal Positional Encoding", 2017, "架构",
 "Google（Vaswani 等）", "Google (Vaswani et al.)",
 "《Attention Is All You Need》用不同频率的正弦与余弦函数把绝对位置注入词向量，无需学习参数即可表达相对位置关系，使纯注意力架构获得序列顺序信息。",
 "开启了位置编码这条独立研究线，后续演进为相对位置、ALiBi、RoPE 与各种长度外推方法。",
 "Injects absolute position into token vectors with sine and cosine functions at different frequencies; no learned parameters, yet relative offsets remain expressible.",
 "Opened positional encoding as its own research line, later evolving into relative positions, ALiBi, RoPE and length-extrapolation methods.",
 "https://arxiv.org/abs/1706.03762"),

# ---- 预训练范式 2019–2021 ----
("t5", "T5 文本到文本", "T5: Text-to-Text Transfer Transformer", 2019, "训练方法",
 "Google（Raffel 等）", "Google (Raffel et al.)",
 "把分类、问答、翻译、摘要等所有任务统一改写成「输入文本→输出文本」，用同一套编码器—解码器与跨度破坏目标预训练，并发布 C4 语料。",
 "统一了多任务微调接口，让大规模迁移学习有了可复现的基线；C4 成为此后最常用的公开预训练语料之一。",
 "Recasts classification, QA, translation and summarization as text-to-text, pretrains one encoder-decoder with a span-corruption objective, and releases the C4 corpus.",
 "Unified the multitask fine-tuning interface and provided a reproducible large-scale transfer baseline; C4 became a standard open pretraining corpus.",
 "https://arxiv.org/abs/1910.10683"),

("roberta", "RoBERTa 强化预训练", "RoBERTa: Robustly Optimized BERT", 2019, "训练方法",
 "Meta AI（Liu 等）", "Meta AI (Liu et al.)",
 "系统消融 BERT 的训练配置，发现更大批量、更多数据与更久训练、动态掩码、去掉下一句预测目标都能显著提分，说明此前 BERT 明显训练不足。",
 "把「训练配方」本身变成研究对象，直接影响了后续所有预训练模型的数据与算力配比。",
 "A systematic ablation of BERT: larger batches, more data and longer training, dynamic masking and dropping next-sentence prediction all help, showing BERT was undertrained.",
 "Made the training recipe itself an object of study and shaped the data/compute ratios of every later pretrained model.",
 "https://arxiv.org/abs/1907.11692"),

("bart", "BART 去噪自编码", "BART: Denoising Sequence-to-Sequence Pre-training", 2019, "训练方法",
 "Meta AI（Lewis 等）", "Meta AI (Lewis et al.)",
 "对文本施加任意噪声（打乱句序、删除、跨度掩码等）再用序列到序列模型还原，兼顾双向理解与自回归生成。",
 "在生成式任务（摘要、对话、翻译）上确立编码器—解码器预训练路线，也是早期 RAG 生成器的底座。",
 "Corrupts text with arbitrary noising functions (sentence shuffling, deletion, span masking) and trains a sequence-to-sequence model to reconstruct it, combining bidirectional understanding with autoregressive generation.",
 "Established the encoder-decoder pretraining route for generation (summarization, dialogue, translation) and underpinned early RAG generators.",
 "https://arxiv.org/abs/1910.13461"),

("electra", "ELECTRA 替换词检测", "ELECTRA: Replaced-Token Detection", 2020, "训练方法",
 "Stanford / Google（Clark 等）", "Stanford / Google (Clark et al.)",
 "用一个小生成器替换部分词，让判别器逐位置判断每个词是否被替换，使全部 token 都参与损失计算而非只有被掩码的 15%。",
 "在同等算力下大幅提高预训练效率，证明「判别式预训练目标」可以比掩码语言模型更划算。",
 "A small generator replaces some tokens and a discriminator decides per position whether each token was replaced, so every token contributes to the loss instead of only the 15% masked.",
 "Greatly improved pretraining efficiency at equal compute, showing discriminative objectives can be cheaper than masked language modeling.",
 "https://arxiv.org/abs/2003.10555"),

("in-context-learning", "上下文学习 / 少样本提示", "In-Context Learning and Few-Shot Prompting", 2020, "推理",
 "OpenAI（Brown 等，GPT-3）", "OpenAI (Brown et al., GPT-3)",
 "不更新任何参数，仅把若干「输入→输出」示例放进提示，模型就能在新任务上按示例模式作答；规模越大，这种能力越明显。",
 "把「提示」变成一种推理接口，催生了提示工程、指令微调与整个对齐研究分支。",
 "With no parameter updates, a handful of input-output examples in the prompt lets the model follow the demonstrated pattern on a new task; the ability grows with scale.",
 "Turned the prompt into an inference interface and gave rise to prompt engineering, instruction tuning and much of alignment research.",
 "https://arxiv.org/abs/2005.14165"),

("prefix-tuning", "Prefix / Prompt Tuning", "Prefix-Tuning and Prompt Tuning", 2021, "效率",
 "Stanford（Li & Liang）；Google（Lester 等）", "Stanford (Li & Liang); Google (Lester et al.)",
 "冻结整个模型，只训练拼接在每层键—值前的一小段可学习连续向量（或输入端的软提示），用极小参数量适配下游任务。",
 "参数高效微调（PEFT）的开端，为 LoRA 与大规模多任务服务化铺路。",
 "Freezes the whole model and trains only a short learned continuous prefix prepended to keys and values at each layer (or a soft prompt at the input), adapting to tasks with a tiny parameter budget.",
 "The start of parameter-efficient fine-tuning (PEFT), paving the way for LoRA and multi-task serving at scale.",
 "https://arxiv.org/abs/2101.00190"),

("adapter-modules", "Adapter 模块", "Adapter Modules", 2019, "效率",
 "Google / DeepMind（Houlsby 等）", "Google / DeepMind (Houlsby et al.)",
 "在 Transformer 每层之间插入小型瓶颈前馈网络，微调时只更新这些新增模块，每个任务保留一份几兆参数的适配器。",
 "首次系统证明「冻结主干 + 小模块」可行，是 PEFT 与模型复用的直接前身。",
 "Inserts small bottleneck feed-forward networks between Transformer layers; fine-tuning updates only these modules, keeping one few-megabyte adapter per task.",
 "First systematic demonstration that a frozen backbone plus small modules works; the direct predecessor of PEFT and model reuse.",
 "https://arxiv.org/abs/1902.00751"),

("gqa-mqa", "MQA / GQA 分组查询注意力", "Multi-Query and Grouped-Query Attention", 2023, "效率",
 "Google（Shazeer；Ainslie 等）", "Google (Shazeer; Ainslie et al.)",
 "Shazeer 2019 提出 MQA：多个查询头共享同一份键—值头；Ainslie 等 2023 提出 GQA 分组共享，在几乎不损失质量的前提下把 KV 缓存与解码带宽压缩数倍。",
 "成为 Llama 2/3、Qwen、Mistral 等开源模型长上下文推理的默认配置。",
 "Multiple query heads share one key/value head (MQA) or share within groups (GQA), cutting KV cache and decode bandwidth several-fold with little quality loss.",
 "The default configuration for long-context inference in Llama 2/3, Qwen, Mistral and other open models.",
 "https://arxiv.org/abs/2305.13245"),

("alibi", "ALiBi 位置外推", "ALiBi: Attention with Linear Biases", 2021, "架构",
 "University of Washington / Meta（Press 等）", "University of Washington / Meta (Press et al.)",
 "不加位置向量，而是在注意力分数上按查询与键的距离减去一个与头相关的线性惩罚，使模型在短序列上训练却能直接推理更长序列。",
 "开启了「训练短、测试长」的长度外推研究，是 RoPE 之外另一条主流位置方案。",
 "Instead of position embeddings, subtracts a head-specific linear penalty from attention scores proportional to query-key distance, so models trained on short sequences extrapolate to longer ones.",
 "Opened the train-short-test-long extrapolation line and remains a mainstream alternative to RoPE.",
 "https://arxiv.org/abs/2108.12409"),

("rmsnorm-swiglu", "RMSNorm 与 SwiGLU", "RMSNorm and SwiGLU", 2019, "架构",
 "Zhang & Sennrich；Google（Shazeer）", "Zhang & Sennrich; Google (Shazeer)",
 "RMSNorm 只按均方根缩放、去掉均值中心化；SwiGLU 用门控线性单元替换前馈层激活。两者计算更省且实测效果更好。",
 "LLaMA、Qwen、DeepSeek、PaLM 等现代模型的标准组件组合，影响几乎所有开源架构。",
 "RMSNorm rescales by root-mean-square without mean centering; SwiGLU replaces the feed-forward activation with a gated linear unit. Both are cheaper and empirically stronger.",
 "The standard component pair in LLaMA, Qwen, DeepSeek, PaLM and most modern open architectures.",
 "https://arxiv.org/abs/1910.07467"),

# ---- 分布式训练与系统 ----
("mixed-precision", "混合精度训练", "Mixed Precision Training", 2017, "效率",
 "NVIDIA（Micikevicius 等）", "NVIDIA (Micikevicius et al.)",
 "用 FP16 做矩阵乘与激活、保留 FP32 主权重，并用损失缩放避免小梯度下溢，显存减半且可利用 Tensor Core 加速。",
 "让千亿参数模型在现有 GPU 上可训练，是此后 FP8 / BF16 训练的基础。",
 "Uses FP16 for matmuls and activations while keeping FP32 master weights, with loss scaling to prevent gradient underflow; halves memory and exploits Tensor Cores.",
 "Made hundred-billion-parameter training feasible on existing GPUs and underpins later FP8 / BF16 training.",
 "https://arxiv.org/abs/1710.03740"),

("parallel-training", "张量 / 流水 / ZeRO 并行", "Tensor, Pipeline and ZeRO Parallelism", 2019, "效率",
 "NVIDIA / Google / Microsoft（Shoeybi、Huang、Rajbhandari 等）",
 "NVIDIA / Google / Microsoft (Shoeybi, Huang, Rajbhandari et al.)",
 "把模型按层内矩阵切分（张量并行）、按层切分流水调度（流水并行），或用 ZeRO 把优化器状态、梯度、参数分片到各卡，突破单卡显存上限。",
 "构成 3D 并行训练框架，是 GPT-3、BLOOM、Megatron-Turing 等超大模型得以训练的工程前提。",
 "Splits matrices within layers (tensor parallel), pipelines layers across devices, or shards optimizer states, gradients and parameters with ZeRO to break the single-GPU memory ceiling.",
 "Forms 3D-parallel training frameworks; the engineering prerequisite for GPT-3, BLOOM, Megatron-Turing and other very large models.",
 "https://arxiv.org/abs/1910.02054"),

("gradient-checkpointing", "激活重计算", "Gradient Checkpointing", 2016, "效率",
 "OpenAI（Chen 等）", "OpenAI (Chen et al.)",
 "只保存若干层的激活，反向传播时重新计算中间结果，用额外计算换取近似平方根级的显存节省。",
 "让深层网络在有限显存下训练，至今仍是长上下文与超大模型训练的标配。",
 "Stores activations only at a few checkpoints and recomputes the rest during backpropagation, trading extra compute for a near square-root memory saving.",
 "Allows deep networks to train under limited memory and remains standard for long-context and very large model training.",
 "https://arxiv.org/abs/1604.06174"),

# ---- 数据与规模化 ----
("chinchilla", "Chinchilla 计算最优配比", "Chinchilla Compute-Optimal Training", 2022, "训练方法",
 "DeepMind（Hoffmann 等）", "DeepMind (Hoffmann et al.)",
 "在固定算力下联合扫描参数量与训练 token 数，发现二者应近似等比例增长；同等算力下更小但训练更久的模型损失更低。",
 "纠正了此前「一味堆参数」的路线，直接改变了 GPT-4 之后所有前沿模型的算力分配。",
 "Jointly sweeps parameter count and training tokens at fixed compute and finds they should scale roughly proportionally; a smaller model trained longer achieves lower loss at equal compute.",
 "Corrected the parameter-only scaling race and changed compute allocation for every frontier model after GPT-4.",
 "https://arxiv.org/abs/2203.15556"),

("pretraining-corpus", "公开预训练语料工程", "Open Pretraining Corpora (C4 / The Pile / FineWeb / Dolma)", 2020, "数据",
 "Google / EleutherAI / Hugging Face / AI2", "Google / EleutherAI / Hugging Face / AI2",
 "从网页抓取、启发式过滤、语言识别、去重与质量打分构建可复现的大规模语料，并把数据来源与处理流程公开。",
 "让开源模型第一次拥有与闭源同量级的训练数据，数据配方本身成为模型能力的关键变量。",
 "Builds reproducible large-scale corpora from web crawl, heuristic filtering, language ID, deduplication and quality scoring, with sources and pipelines published openly.",
 "Gave open models training data comparable to closed ones and made the data recipe a first-class determinant of model capability.",
 "https://arxiv.org/abs/2101.00027"),

("data-dedup", "训练数据去重", "Training Data Deduplication", 2021, "数据",
 "Google（Lee 等）", "Google (Lee et al.)",
 "用 MinHash / 后缀数组等近似方法检测并移除语料中的近重复文档，减少模型对重复文本的记忆与逐字复述。",
 "显著降低记忆化与隐私风险、提升泛化，成为所有公开预训练语料的标准处理步骤。",
 "Detects and removes near-duplicate documents with MinHash or suffix-array approximations, reducing verbatim memorization of repeated text.",
 "Cuts memorization and privacy risk while improving generalization; now a standard step in every open pretraining corpus.",
 "https://arxiv.org/abs/2107.06499"),

# ---- 推理与提示 ----
("self-consistency", "自洽性采样", "Self-Consistency", 2022, "推理",
 "Google（Wang 等）", "Google (Wang et al.)",
 "对同一问题采样多条不同思维链，对最终答案做多数投票，取代贪心解码的单条推理路径。",
 "用极低成本显著提升数学与常识推理，是「测试时计算」最早的实用形式之一。",
 "Samples multiple distinct chains of thought for one question and majority-votes over final answers instead of greedily decoding a single path.",
 "Improved math and commonsense reasoning at very low cost; one of the earliest practical forms of test-time compute.",
 "https://arxiv.org/abs/2203.11171"),

("zero-shot-cot", "零样本思维链", "Zero-Shot Chain-of-Thought", 2022, "推理",
 "Google / University of Tokyo（Kojima 等）", "Google / University of Tokyo (Kojima et al.)",
 "只需在提示里加一句「让我们一步一步思考」，无需任何示例就能触发模型展开中间推理步骤。",
 "说明推理能力可由提示词直接激活，让思维链成为零门槛的通用技巧。",
 "Adding a single phrase such as 'Let's think step by step' elicits intermediate reasoning without any worked examples.",
 "Showed reasoning can be activated by a prompt alone, making chain-of-thought a zero-setup general technique.",
 "https://arxiv.org/abs/2205.11916"),

("least-to-most", "由易到难分解提示", "Least-to-Most Prompting", 2022, "推理",
 "Google（Zhou 等）", "Google (Zhou et al.)",
 "把复杂问题先分解为有序的子问题序列，再按由易到难逐个求解，每一步都把先前得到的答案显式带入后续提示，使模型不必一次性完成全部推理。",
 "把任务分解显式化，显著提升组合泛化，是后来各类规划式推理提示的原型。",
 "Decomposes a hard problem into an ordered sequence of subproblems, solves them from easy to hard, and explicitly carries earlier answers into later prompts so the model need not complete the whole reasoning in one pass.",
 "Makes decomposition explicit and improves compositional generalization; the prototype of later planning-style prompting.",
 "https://arxiv.org/abs/2205.10625"),

("tree-of-thoughts", "思维树搜索", "Tree of Thoughts", 2023, "推理",
 "Princeton / Google DeepMind（Yao 等）", "Princeton / Google DeepMind (Yao et al.)",
 "把推理状态展开成树，用自我评估给各分支打分，再用广度或深度优先搜索在多条思路间探索与回溯。",
 "把经典搜索算法引入语言模型推理，是 o1/R1 之前「推理时搜索」的代表性工作。",
 "Expands reasoning states into a tree, scores branches with self-evaluation, and explores or backtracks with BFS/DFS.",
 "Brought classical search into LLM reasoning; the representative work on inference-time search before o1/R1.",
 "https://arxiv.org/abs/2305.10601"),

("self-instruct", "Self-Instruct 自生成指令", "Self-Instruct", 2022, "数据",
 "University of Washington 等（Wang 等）", "University of Washington et al. (Wang et al.)",
 "用少量种子指令让模型自己生成新任务、筛选过滤后再用于指令微调，摆脱对人工标注指令数据的依赖。",
 "开启了「用模型造数据训练模型」的路线，是 Alpaca、Vicuna 等开源指令模型的直接来源。",
 "Uses a few seed instructions to have the model generate new tasks, filters them, and fine-tunes on the result instead of relying on human-written instructions.",
 "Started the model-generates-data-for-models line; the direct source of Alpaca, Vicuna and other open instruction models.",
 "https://arxiv.org/abs/2212.10560"),

("toolformer", "Toolformer 自学习工具调用", "Toolformer", 2023, "智能体",
 "Meta AI（Schick 等）", "Meta AI (Schick et al.)",
 "让模型在文本中自采样插入 API 调用、执行后只保留能降低后续 token 损失的调用，从而自监督学会何时调用计算器、检索与日历。",
 "把工具使用从人工提示变为模型自学能力，是后续函数调用与智能体训练的重要前身。",
 "The model samples API calls inside text, executes them, and keeps only calls that reduce loss on following tokens, self-supervising when to use a calculator, search or calendar.",
 "Turned tool use from hand-written prompting into a learned capability; an important precursor to function calling and agent training.",
 "https://arxiv.org/abs/2302.04761"),

# ---- 评测（用户方向重点）----
("llm-as-judge", "LLM-as-a-Judge 与 MT-Bench", "LLM-as-a-Judge and MT-Bench", 2023, "评测",
 "UC Berkeley / UCSD / CMU（Zheng 等）", "UC Berkeley / UCSD / CMU (Zheng et al.)",
 "用强模型按成对比较或打分评判开放式回答，并以 MT-Bench 多轮问题集和 Chatbot Arena 人类偏好验证其与人类判断的一致性；同时系统讨论了位置偏置、冗长偏好与自我偏好。",
 "让开放式生成的自动评测成为可能，成为对齐、奖励建模与模型筛选的通用基础设施，也把「评判者本身的偏差」变成独立研究问题。",
 "A strong model judges open-ended answers by pairwise comparison or scoring; MT-Bench and Chatbot Arena human preferences validate agreement, while position bias, verbosity bias and self-preference bias are characterized.",
 "Made automatic evaluation of open-ended generation feasible and became shared infrastructure for alignment, reward modeling and model selection, while turning judge bias into its own research problem.",
 "https://arxiv.org/abs/2306.05685"),

("reward-overoptimization", "奖励模型过优化", "Reward Model Overoptimization", 2022, "评测",
 "OpenAI（Gao 等）", "OpenAI (Gao et al.)",
 "系统测量强化学习优化代理奖励时，真实质量先升后降的「过度优化」现象，并给出其与 KL 约束、奖励模型规模的缩放关系。",
 "为 RLHF 提供关键的失效模式与诊断口径，是后续 KL 正则、长度惩罚与评判者校准研究的出发点。",
 "Measures how true quality first rises then falls as RL optimizes a proxy reward, and characterizes the scaling with KL budget and reward-model size.",
 "Established the key failure mode and diagnostics for RLHF; the starting point for KL regularization, length penalties and judge calibration.",
 "https://arxiv.org/abs/2210.10760"),

("mmlu-helm", "MMLU 与 HELM 综合评测", "MMLU and HELM Holistic Evaluation", 2020, "评测",
 "UC Berkeley 等（Hendrycks）；Stanford（Liang 等）", "UC Berkeley et al. (Hendrycks); Stanford (Liang et al.)",
 "Hendrycks 等 2020 的 MMLU 用 57 个学科的多选题衡量知识与推理；Stanford 2022 的 HELM 进一步把准确性、校准、鲁棒性、公平性、毒性等多维指标在统一场景下逐项记录。",
 "确立了大模型「多维度、可复现」的评测范式，取代单一准确率榜单。",
 "MMLU measures knowledge and reasoning with multiple-choice questions across 57 subjects; HELM records accuracy, calibration, robustness, fairness and toxicity in one unified scenario suite.",
 "Established the multi-dimensional, reproducible evaluation paradigm that replaced single-accuracy leaderboards.",
 "https://arxiv.org/abs/2009.03300"),

("gsm8k-humaneval", "GSM8K 与 HumanEval", "GSM8K and HumanEval", 2021, "评测",
 "OpenAI（Cobbe、Chen 等）", "OpenAI (Cobbe, Chen et al.)",
 "Cobbe 等 2021 的 GSM8K 提供需多步算术推理的小学数学题并附逐步解答；Chen 等 2021 的 HumanEval 用单元测试自动判分代码生成，避免自然语言匹配的歧义。",
 "分别成为数学推理与代码生成的标准基准，思维链、自洽性、过程奖励与 RLVR 的进展都以此度量。",
 "GSM8K supplies grade-school math problems requiring multi-step arithmetic with worked solutions; HumanEval scores code generation automatically with unit tests, avoiding ambiguous string matching.",
 "Became the standard benchmarks for math reasoning and code generation respectively; progress in chain-of-thought, self-consistency, PRMs and RLVR is measured on them.",
 "https://arxiv.org/abs/2110.14168"),

("swe-bench", "SWE-bench 真实工程评测", "SWE-bench", 2023, "评测",
 "Princeton / University of Chicago（Jimenez 等）", "Princeton / University of Chicago (Jimenez et al.)",
 "从真实 GitHub issue 与对应补丁构建任务，要求智能体在完整代码库中定位、修改并通过测试，用测试通过率自动评分。",
 "把评测从孤立函数生成推进到仓库级软件工程，成为代码智能体能力的主要标尺。",
 "Builds tasks from real GitHub issues and their patches, requiring an agent to localize, edit and pass tests inside a full repository, scored automatically by test pass rate.",
 "Moved evaluation from isolated function synthesis to repository-level software engineering and became the main yardstick for coding agents.",
 "https://arxiv.org/abs/2310.06770"),

# ---- 多模态 ----
("clip", "CLIP 图文对比预训练", "CLIP: Contrastive Language-Image Pre-training", 2021, "多模态",
 "OpenAI（Radford 等）", "OpenAI (Radford et al.)",
 "用 4 亿图文对做对比学习，把图像与文本映射到同一表征空间，使零样本分类只需把类别名写成自然语言提示。",
 "奠定多模态大模型的对齐范式，是 LLaVA、Flamingo、扩散模型文本条件与视觉指令微调的共同基础。",
 "Contrastive learning on 400M image-text pairs maps images and text into a shared space, so zero-shot classification only needs class names written as natural-language prompts.",
 "Set the alignment paradigm for multimodal LLMs; the shared foundation of LLaVA, Flamingo, text conditioning in diffusion models and visual instruction tuning.",
 "https://arxiv.org/abs/2103.00020"),

("vit", "Vision Transformer", "Vision Transformer (ViT)", 2020, "多模态",
 "Google（Dosovitskiy 等）", "Google (Dosovitskiy et al.)",
 "把图像切成固定大小的图块、按序列输入标准 Transformer 编码器，在足够数据下取代卷积成为视觉主干。",
 "让视觉与语言共用同一架构，是多模态统一建模的结构前提。",
 "Splits an image into fixed-size patches and feeds them as a sequence to a standard Transformer encoder, replacing convolutions as the visual backbone at sufficient data scale.",
 "Allowed vision and language to share one architecture; the structural prerequisite for unified multimodal modeling.",
 "https://arxiv.org/abs/2010.11929"),

("flamingo", "Flamingo 少样本多模态", "Flamingo", 2022, "多模态",
 "DeepMind（Alayrac 等）", "DeepMind (Alayrac et al.)",
 "用门控交叉注意力把冻结的视觉编码器接入冻结的语言模型，只训练桥接层，并以交错图文序列做少样本上下文学习。",
 "证明多模态能力可以通过轻量桥接获得，避免联合预训练的巨额成本。",
 "Gated cross-attention connects a frozen vision encoder to a frozen language model; only the bridge is trained, and interleaved image-text sequences enable few-shot in-context learning.",
 "Showed multimodal ability can be obtained with a lightweight bridge, avoiding the enormous cost of joint pretraining.",
 "https://arxiv.org/abs/2204.14198"),

("llava", "LLaVA 视觉指令微调", "LLaVA: Visual Instruction Tuning", 2023, "多模态",
 "Microsoft Research / University of Wisconsin（Liu 等）", "Microsoft Research / University of Wisconsin (Liu et al.)",
 "用 GPT-4 把图像描述与边界框转成对话式指令数据，再微调「视觉编码器 + 投影层 + 语言模型」，得到能就图片多轮问答的助手。",
 "以极低成本复现多模态对话能力，成为开源视觉语言模型的主流配方。",
 "Uses GPT-4 to turn image captions and bounding boxes into conversational instruction data, then fine-tunes a vision encoder, projection layer and LLM into an assistant that answers questions about images.",
 "Reproduced multimodal dialogue at very low cost and became the mainstream recipe for open vision-language models.",
 "https://arxiv.org/abs/2304.08485"),

# ---- 检索 ----
("dpr", "DPR 稠密段落检索", "Dense Passage Retrieval", 2020, "检索",
 "Facebook AI（Karpukhin 等）", "Facebook AI (Karpukhin et al.)",
 "用双塔编码器把问题与段落映射到同一向量空间，以向量内积召回替代 BM25 的词法匹配，并用批内负样本训练。",
 "现代 RAG 的检索底座，使开放域问答从关键词匹配转向语义匹配。",
 "A dual encoder maps questions and passages into one vector space; inner-product retrieval replaces BM25 lexical matching, trained with in-batch negatives.",
 "The retrieval substrate of modern RAG, moving open-domain QA from keyword to semantic matching.",
 "https://arxiv.org/abs/2004.04906"),

("self-rag", "Self-RAG 自反思检索", "Self-RAG", 2023, "检索",
 "University of Washington / AI2（Asai 等）", "University of Washington / AI2 (Asai et al.)",
 "让模型生成反思标记，自行判断何时需要检索、检索到的段落是否相关、生成内容是否有证据支持，从而按需检索并自我批判。",
 "把检索从固定前置步骤变成模型可控制的决策，是智能体式 RAG 的关键一步。",
 "The model emits reflection tokens deciding when to retrieve, whether passages are relevant and whether its output is supported by evidence, enabling on-demand retrieval and self-critique.",
 "Turned retrieval from a fixed preprocessing step into a model-controlled decision; a key step toward agentic RAG.",
 "https://arxiv.org/abs/2310.11511"),

# ---- 对齐变体 ----
("kto-orpo-simpo", "KTO / ORPO / SimPO 偏好优化变体", "KTO, ORPO and SimPO Preference Variants", 2024, "对齐",
 "Stanford（Ethayarajh 等）；KAIST；Princeton / UIUC", "Stanford (Ethayarajh et al.); KAIST; Princeton / UIUC",
 "KTO 只需「好/坏」二元标注而不必成对比较；ORPO 把偏好项并入 SFT 去掉参考模型；SimPO 用长度归一化的隐式奖励并去掉参考模型。",
 "共同降低了偏好对齐对数据形式与显存的门槛，使中小团队也能稳定做对齐训练。",
 "KTO needs only binary desirable/undesirable labels rather than paired comparisons; ORPO folds the preference term into SFT and drops the reference model; SimPO uses length-normalized implicit rewards without a reference model.",
 "Together they lower the data-format and memory barriers of preference alignment, making stable alignment training accessible to smaller teams.",
 "https://arxiv.org/abs/2402.01306"),

("ipo", "IPO 偏好优化理论", "IPO: Identity Preference Optimization", 2023, "对齐",
 "DeepMind（Azar 等）", "DeepMind (Azar et al.)",
 "从理论上指出 DPO 在偏好数据可分时会过拟合，提出直接优化偏好概率恒等式并加正则的目标，给出统一的偏好学习框架。",
 "为 DPO 及其后续变体提供理论诊断与改进方向，是偏好优化算法族的理论支点。",
 "Shows theoretically that DPO overfits when preference data is separable and proposes optimizing an identity on preference probabilities with regularization, yielding a unified framework.",
 "Provides the theoretical diagnosis and improvement direction for DPO and its variants; the theory anchor of the preference-optimization family.",
 "https://arxiv.org/abs/2310.12036"),

("red-teaming", "红队测试与越狱研究", "Red Teaming and Jailbreak Discovery", 2022, "评测",
 "Anthropic / DeepMind（Perez 等）", "Anthropic / DeepMind (Perez et al.)",
 "用语言模型自动生成大量对抗性提示，规模化探测有害输出、越狱与提示注入，并把发现的失败案例回流到安全训练。",
 "把安全评估从人工抽样变成可规模化的自动生成，是模型发布前安全流程的标准环节。",
 "Language models generate large numbers of adversarial prompts to systematically surface harmful outputs, jailbreaks and prompt injection, feeding discovered failures back into safety training.",
 "Turned safety evaluation from manual sampling into scalable automatic generation; now a standard pre-release safety stage.",
 "https://arxiv.org/abs/2202.03286"),

# ---- 长上下文与推理服务 ----
("position-interpolation", "位置插值扩展上下文", "Position Interpolation", 2023, "效率",
 "Meta AI（Chen 等）", "Meta AI (Chen et al.)",
 "把超长序列的位置索引按比例压缩回模型原有范围，只需少量微调即可把 RoPE 模型的上下文窗口扩展数倍至数十倍。",
 "以极低成本开启长上下文竞赛，是 YaRN、LongRoPE 与实际百万上下文产品的起点。",
 "Rescales position indices of a long sequence back into the model's original range, extending a RoPE model's context window several-fold with only light fine-tuning.",
 "Started the long-context race at very low cost; the origin of YaRN, LongRoPE and production million-token context.",
 "https://arxiv.org/abs/2306.15595"),

("ring-attention", "Ring Attention 环形注意力", "Ring Attention", 2023, "效率",
 "UC Berkeley（Liu 等）", "UC Berkeley (Liu et al.)",
 "把序列切块分布到多个设备，用环形通信把分块注意力与全连接计算完全重叠，使上下文长度随设备数近线性增长而不增加单卡显存。",
 "让百万级上下文训练在工程上可行，是长序列分布式注意力的代表方案。",
 "Shards a sequence across devices and overlaps blockwise attention with all-gather communication in a ring, so context length grows near-linearly with device count at constant per-device memory.",
 "Made million-token context training engineering-feasible; the representative scheme for distributed long-sequence attention.",
 "https://arxiv.org/abs/2310.01889"),

("continuous-batching", "连续批处理与推理服务", "Continuous Batching for LLM Serving", 2022, "效率",
 "KAIST / FriendliAI（Yu 等，Orca）", "KAIST / FriendliAI (Yu et al., Orca)",
 "以迭代级调度取代请求级批处理，已完成的序列立即释放槽位、新请求随时加入，配合分页 KV 缓存显著提高 GPU 利用率与吞吐。",
 "奠定 vLLM、TGI 等现代推理引擎的调度模型，直接决定单位 token 的服务成本。",
 "Replaces request-level batching with iteration-level scheduling: finished sequences release slots immediately and new requests join at any step, combined with paged KV cache for much higher GPU utilization.",
 "Established the scheduling model of vLLM, TGI and other modern serving engines, directly determining per-token serving cost.",
 "https://www.usenix.org/conference/osdi22/presentation/yu"),

("streamingllm", "StreamingLLM 流式长文本", "StreamingLLM", 2023, "效率",
 "MIT / CMU（Xiao 等）", "MIT / CMU (Xiao et al.)",
 "发现注意力汇聚现象：保留最初几个 token 的 KV 与最近的滑动窗口，就能在有限缓存下稳定处理无限长流式输入。",
 "解释了窗口注意力为何失效，并给出无需重训的流式推理方案。",
 "Identifies attention sinks: keeping the first few tokens' KV plus a recent sliding window allows stable processing of unbounded streaming input under a fixed cache budget.",
 "Explains why plain window attention fails and provides a streaming inference solution requiring no retraining.",
 "https://arxiv.org/abs/2309.17453"),

("model-merging", "模型合并与任务向量", "Model Merging and Task Arithmetic", 2022, "训练方法",
 "University of Washington（Ilharco 等）", "University of Washington (Ilharco et al.)",
 "把微调前后的权重差视为「任务向量」，通过加减与线性组合把多个能力合并进一个模型，无需再训练或访问原始数据。",
 "成为开源社区组合能力、构建强基线模型的常用手段，衍生出 TIES、DARE 等冲突消解方法。",
 "Treats the weight difference before and after fine-tuning as a task vector; adding, subtracting or linearly combining these vectors merges capabilities without retraining or access to original data.",
 "A common open-source technique for composing capabilities and building strong baselines, later extended by TIES, DARE and other interference-resolution methods.",
 "https://arxiv.org/abs/2212.04089"),
]

# 英文卡片用的简短显示名（详情标题仍用完整名）
SHORT_EN = {
    "parallel-training": "3D Parallelism & ZeRO",
    "in-context-learning": "In-Context Learning",
    "chinchilla": "Chinchilla Scaling",
    "continuous-batching": "Continuous Batching",
    "red-teaming": "Red Teaming",
    "gqa-mqa": "MQA / GQA",
    "kto-orpo-simpo": "KTO / ORPO / SimPO",
    "pretraining-corpus": "Open Pretraining Corpora",
    "mmlu-helm": "MMLU & HELM",
    "gsm8k-humaneval": "GSM8K & HumanEval",
    "adam-adamw": "Adam / AdamW",
    "rmsnorm-swiglu": "RMSNorm & SwiGLU",
    "subword-tokenization": "Subword Tokenization",
    "pos-encoding-sinusoidal": "Sinusoidal Positional Encoding",
}

CAT_EN = {
    "数据": "Data", "架构": "Architecture", "训练方法": "Training",
    "效率": "Efficiency", "多模态": "Multimodal", "检索": "Retrieval",
    "推理": "Reasoning", "对齐": "Alignment", "智能体": "Agents",
    "评测": "Evaluation",
}


def build():
    out = []
    for (tid, zh, name, year, cat, origin, origin_en,
         sz, iz, se, ie, source) in A:
        short = SHORT_EN.get(tid)
        out.append({
            "id": tid,
            "name": name,
            "name_zh": zh,
            "year": year,
            "category": cat,
            "origin": origin,
            "summary": sz,
            "impact": iz,
            "source": source,
            "models": [],
            "model_refs": [],
            # 英文字段随源头保存，供 build_en_data.py 直接读取
            "name_en": name,
            "label_en": short,
            "origin_en": origin_en,
            "summary_en": se,
            "impact_en": ie,
            "category_en": CAT_EN[cat],
        })
    return out


if __name__ == "__main__":
    data = build()
    ids = [x["id"] for x in data]
    assert len(ids) == len(set(ids)), "duplicate ids"
    print("补充条目:", len(data))
    from collections import Counter
    print("分类:", dict(Counter(x["category"] for x in data)))
    print("年份范围:", min(x["year"] for x in data), "-", max(x["year"] for x in data))
