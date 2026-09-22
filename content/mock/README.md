# Mock 数据替换清单

本目录仅供页面演示。除 `isReal: true` 的信任数字和验证强调句外，六份 v15 数据中的业务值均为用户提供的 Mock，不代表独立验证的产品指标或正式报价。上线前必须完成 P0 项审核；页面按要求不显示演示标识。

所有 JSON 保留顶层 `_demo` 与 `_note`。MMetrics 的 `_meta.isReal` 仅指采集自平台可见内容，不是独立科学验证，字段仍需研发复核。

中文页面从这六份 JSON 读取。英文对应文案在 `messages/en.json` 的 `mockContent` 中，修改业务字段时同步更新英文。缺少业务确认的其他页面字段以中性空态显示，不编造数据。

## 资源替换

四个任务录屏路径见 capabilities.json。将同名 WebM 放入 `public/demo/` 后刷新开发预览即可生效；静态部署须重新构建。可修改 `media` 指向自行选定的图片/视频，组件也支持 PNG、JPEG、WebP、GIF、SVG。不要将 `mediaTodo` 渲染到页面。

## 逐字段清单

| 字段 | 当前值 | 是否为演示数据 | 来源方 | 替换优先级 |
| --- | --- | --- | --- | --- |
| `trust-bar._demo` | true | 内部元信息 | 研发 | 保留 |
| `trust-bar.items[0].value` | 12 | 否（用户确认） | 研发 | P0 |
| `trust-bar.items[0].label` | 真实临床靶点 | 否（用户确认） | 研发 | P0 |
| `trust-bar.items[0].isReal` | true | 否（用户确认） | 研发 | P0 |
| `trust-bar.items[1].value` | 90%+ | 否（用户确认） | 研发 | P0 |
| `trust-bar.items[1].label` | 低通量条件下靶点成功率 | 否（用户确认） | 研发 | P0 |
| `trust-bar.items[1].isReal` | true | 否（用户确认） | 研发 | P0 |
| `trust-bar.items[2].value` | 37 | 是 / 待复核 | 研发 | P0 |
| `trust-bar.items[2].label` | 完成湿实验验证的项目 | 是 / 待复核 | 研发 | P0 |
| `trust-bar.items[2].isReal` | false | 是 / 待复核 | 研发 | P0 |
| `trust-bar._note` | 演示数据,上线前必须替换 | 内部元信息 | 研发 | 保留 |
| `capabilities._demo` | true | 内部元信息 | 研发 / 市场 | 保留 |
| `capabilities.tasks[0].id` | affinity | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[0].title` | 提升候选分子的结合表现 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[0].brief` | 已有先导，但亲和力卡住了 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[0].situation` | 手上的先导分子已经有活性，但亲和力再往上提就进入高成本试错——可突变区域受结构约束，组合空间又大到没法穷举。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[0].approach` | 围绕结合界面识别关键位点，生成少量高信息量的突变组合，并给出统一的排序与解释。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[0].outcome` | 一份可以直接送实验的候选清单，每个候选都标明改了哪里、为什么这么改。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[0].media` | /demo/capability-affinity.webm | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[0].mediaTodo` | 替换为亲和力优化的真实操作录屏 | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[1].id` | stability | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[1].title` | 改善表达、稳定性与可开发性 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[1].brief` | 活性没问题，但工艺上过不去 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[1].situation` | 分子活性达标了，可是表达量低、热稳定性不够、或者容易聚集——工艺和制剂环节卡住，前面的活性就白做了。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[1].approach` | 在保留功能区域的前提下探索更稳健的序列空间，同时评估改造对活性的影响。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[1].outcome` | 兼顾功能约束的改造方案，附带风险提示，避免改了稳定性丢了活性。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[1].media` | /demo/capability-stability.webm | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[1].mediaTodo` | 替换为稳定性改造的真实操作录屏 | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[2].id` | denovo | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[2].title` | 为新靶点从头生成结合分子 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[2].brief` | 连先导都还没有 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[2].situation` | 靶点是新的，没有已知的结合分子可以改，只能从目标界面的结构特征开始建立候选——传统路线要么靠噬菌体展示，要么靠运气。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[2].approach` | 基于靶点结构与设计约束直接生成新序列，筛选后给出可解释的排序依据。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[2].outcome` | 一批多样化的候选序列，可直接下单合成进入验证。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[2].media` | /demo/capability-denovo.webm | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[2].mediaTodo` | 替换为从头设计的真实操作录屏 | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[3].id` | structure | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[3].title` | 从序列出发，快速判断结构与复合物状态 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[3].brief` | 没有可靠结构，后面都没法做 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[3].situation` | 缺少可靠的结构，实验设计和位点判断就没有依据——等共晶太慢，同源建模的模板又不够近。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[3].approach` | 提交序列或已有结构，完成单体与复合物的结构预测，并标出关键区域。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[3].outcome` | 可以逐项检查的结构结果，附置信度提示，作为后续设计的起点。 | 是 / 待复核 | 研发 / 市场 | P0 |
| `capabilities.tasks[3].media` | /demo/capability-structure.webm | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities.tasks[3].mediaTodo` | 替换为结构预测的真实操作录屏 | 是 / 待复核 | 研发 / 市场 | P1 |
| `capabilities._note` | 演示数据,上线前必须替换 | 内部元信息 | 研发 / 市场 | 保留 |
| `validation._demo` | true | 内部元信息 | 研发 | 保留 |
| `validation.headline.text` | 在 12 个靶点上，每个靶点仅测试不超过 50 个候选分子的低通量条件下，靶点成功率超过 90% | 否（用户确认） | 研发 | P0 |
| `validation.headline.isReal` | true | 否（用户确认） | 研发 | P0 |
| `validation.cases[0].category` | 抗体亲和力优化 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[0].result` | 先导抗体亲和力提升 23 倍，特异性保持不变 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[0].difficulty` | 可突变区域受 CDR 结构约束，组合空间超过 10⁶，传统饱和突变需 4 轮以上筛选 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[0].molecule` | IgG 单抗 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[0].cycle` | 6 周 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[1].category` | 酶稳定性改造 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[1].result` | 工业酶 Tm 提高 11.4℃，60℃ 下残余活性由 31% 升至 86% | 是 / 待复核 | 研发 | P0 |
| `validation.cases[1].difficulty` | 需在提升热稳定性的同时保住催化效率，两者常此消彼长 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[1].molecule` | 水解酶 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[1].cycle` | 8 周 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[2].category` | 复合物结构预测 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[2].result` | 抗原抗体复合物界面预测 DockQ 0.78，关键接触残基命中 14/16 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[2].difficulty` | 缺少共晶结构，同源模板序列一致性不足 40% | 是 / 待复核 | 研发 | P0 |
| `validation.cases[2].molecule` | 抗体-抗原复合物 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[2].cycle` | 3 天 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[3].category` | 从头设计 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[3].result` | 针对新靶点生成 48 个候选，湿实验测得 5 个有结合信号，最优 KD 42 nM | 是 / 待复核 | 研发 | P0 |
| `validation.cases[3].difficulty` | 靶点无已知结合分子，缺少可用先导，需从界面特征直接建立候选 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[3].molecule` | 小蛋白 binder | 是 / 待复核 | 研发 | P0 |
| `validation.cases[3].cycle` | 10 周 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[4].category` | 功能蛋白设计 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[4].result` | 纳米抗体在保持中和活性前提下，聚集倾向下降 62% | 是 / 待复核 | 研发 | P0 |
| `validation.cases[4].difficulty` | 疏水补丁位于 CDR 邻近区域，改造易影响结合能力 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[4].molecule` | 纳米抗体 VHH | 是 / 待复核 | 研发 | P0 |
| `validation.cases[4].cycle` | 7 周 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[5].category` | 蛋白质稳定性改造 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[5].result` | 治疗性蛋白在 40℃ 加速试验中降解速率降低 3.8 倍 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[5].difficulty` | 需兼顾表达宿主适配与制剂条件，单点改造收益有限 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[5].molecule` | 重组治疗蛋白 | 是 / 待复核 | 研发 | P0 |
| `validation.cases[5].cycle` | 9 周 | 是 / 待复核 | 研发 | P0 |
| `validation._note` | 演示数据,上线前必须替换 | 内部元信息 | 研发 | 保留 |
| `models._demo` | true | 内部元信息 | 研发 | 保留 |
| `models.models[0].name` | NewOrigin（达尔文） | 是 / 待复核 | 研发 | P0 |
| `models.models[0].limitation` | 对缺乏同源信息的孤儿蛋白，表征质量会明显下降；跨物种迁移需结合实验数据校准。 | 是 / 待复核 | 研发 | P0 |
| `models.models[1].name` | MMFold | 是 / 待复核 | 研发 | P0 |
| `models.models[1].limitation` | 高度柔性区域与无序段的构象预测置信度较低；对依赖辅因子或特定 pH 的构象状态，需结合实验条件判断。 | 是 / 待复核 | 研发 | P0 |
| `models.models[2].name` | MMDesign | 是 / 待复核 | 研发 | P0 |
| `models.models[2].limitation` | 生成序列的可表达性与可开发性需逐级实验验证；对超过 200 个氨基酸的从头设计，成功率显著降低。 | 是 / 待复核 | 研发 | P0 |
| `models._note` | 演示数据,上线前必须替换 | 内部元信息 | 研发 | 保留 |
| `pricing._demo` | true | 内部元信息 | 市场 | 保留 |
| `pricing.plans[0].name` | 学术版 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[0].price` | 免费 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[0].note` | 需机构邮箱认证，限非商业用途 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[1].name` | 专业版 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[1].price` | ¥2,800 / 月起 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[1].note` | 含 5,000 credit，超出按量计费 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[2].name` | 企业版 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[2].price` | 联系商务 | 是 / 待复核 | 市场 | P0 |
| `pricing.plans[2].note` | 私有化部署 / 平台授权 / 联合研发 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[0].task` | 单体结构预测 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[0].credit` | 20 / 次 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[0].time` | 约 3 分钟 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[1].task` | 复合物结构预测 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[1].credit` | 80 / 次 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[1].time` | 约 12 分钟 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[2].task` | 亲和力优化（50 候选） | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[2].credit` | 450 / 批 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[2].time` | 约 2 小时 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[3].task` | 稳定性改造（50 候选） | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[3].credit` | 380 / 批 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[3].time` | 约 1.5 小时 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[4].task` | 从头设计（100 候选） | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[4].credit` | 1,200 / 批 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[4].time` | 约 6 小时 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[5].task` | 同源蛋白搜索 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[5].credit` | 5 / 次 | 是 / 待复核 | 市场 | P0 |
| `pricing.creditTable[5].time` | 约 30 秒 | 是 / 待复核 | 市场 | P0 |
| `pricing._note` | 演示数据,上线前必须替换 | 内部元信息 | 市场 | 保留 |
| `footer._demo` | true | 内部元信息 | 法务 | 保留 |
| `footer.icp` | 京ICP备2023XXXXXX号-1 | 是 / 待复核 | 法务 | P0 |
| `footer._note` | 演示数据,上线前必须替换 | 内部元信息 | 法务 | 保留 |
| `mmetrics-5xh3._demo` | true | 内部元信息 | 研发 | 保留 |
| `mmetrics-5xh3._note` | 演示数据,上线前必须替换 | 内部元信息 | 研发 | 保留 |
| `mmetrics-5xh3._meta.source` | MOS 平台当前已打开的 Chrome 页面可见内容（用户授权只读采集） | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3._meta.isReal` | true | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3._meta.note` | 字段名为推测，前端提供真实接口返回后需对齐。替换时只需保证本文件结构不变，组件无需修改。 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3._meta.todo` | 完整互作网络拓扑、MutXstruct/MutXseq 说明仍待确认。UniProt Feature 已按当前页面可见标签更新；仅代表页面预置展示数据，不构成独立科学验证。 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.protein.id` | 5xh3 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.protein.chains[0].id` | A | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.protein.chains[0].type` | protein | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.protein.chains[1].id` | B | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.protein.chains[1].type` | ligand | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.protein.sequence` | NPYARGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALGQVASLNGTSSSPIYGKVDTARMGVMGWAMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCS | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.description.tags[0].label` | Enzyme | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.description.tags[0].type` | category | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.description.tags[1].label` | confidence: high | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.description.tags[1].type` | confidence | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.description.text` | This structure represents a mutant (R103G/S131A) of poly(ethylene terephthalate) hydrolase (PETase) from the bacterium Ideonella sakaiensis. PETase is a key enzyme involved in the biodegradation of PET plastic, converting it into mono(2-hydroxyethyl) terephthalate (MHET). The structural characterization of this mutant provides insights into the catalytic mechanism and engineering strategies for improved plastic degradation. | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.description.reasoning` | The protein is explicitly identified as poly(ethylene terephthalate) hydrolase (PETase), a member of the AB hydrolase superfamily with well-documented catalytic activity in degrading PET plastic. | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.method` | Searched by enzyme sequence similarity | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[0].id` | 5XFZ | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[0].type` | Crystal | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[0].identity` | 100 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[1].id` | 5XH3 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[1].type` | Crystal | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[1].identity` | 100 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[2].id` | 6EQD | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[2].type` | Crystal | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[2].identity` | 99.2 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[3].id` | A0A0K8P6T7 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[3].type` | null | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[3].identity` | 99.2 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[4].id` | E9LVH8 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[4].type` | null | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.homologs.items[4].identity` | 51.3 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.count` | 16 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.source` | uniprot | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[0]` | A:TYR58 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[1]` | A:MET132 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[2]` | A:TRP156 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[3]` | A:SER32 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[4]` | A:GLY57 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[5]` | A:THR59 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[6]` | A:ALA60 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[7]` | A:ALA100 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[8]` | A:GLY103 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[9]` | A:GLN104 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[10]` | A:SER107 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[11]` | A:TRP130 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[12]` | A:ALA131 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[13]` | A:ILE179 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[14]` | A:ALA180 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.bindingPocket.residues[15]` | A:HIS208 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.count` | 6 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.source` | uniprot | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.residues[0]` | A:ALA131 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.residues[1]` | A:ASP177 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.residues[2]` | A:HIS208 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.residues[3]` | A:TYR58 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.residues[4]` | A:MET132 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.activeSites.residues[5]` | A:TRP156 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.count` | 17 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.source` | uniprot | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[0]` | A:TYR58 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[1]` | A:SER64 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[2]` | A:GLN90 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[3]` | A:SER92 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[4]` | A:TRP130 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[5]` | A:ALA131 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[6]` | A:MET132 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[7]` | A:TRP156 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[8]` | A:ASP157 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[9]` | A:CYS174 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[10]` | A:ASP177 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[11]` | A:SER185 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[12]` | A:HIS208 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[13]` | A:SER209 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[14]` | A:CYS210 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[15]` | A:ASN212 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.annotations.uniprotFeature.residues[16]` | A:ARG251 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[0].type` | pi-pi | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[0].label` | π-π Stack | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[0].color` | #D98A3F | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[0].style` | dashed | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[1].type` | hbond | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[1].label` | H-Bond | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[1].color` | #4DBBA8 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[1].style` | dashed | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[2].type` | vdw | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[2].label` | VdW Contact | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[2].color` | #8A8A8A | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.legend[2].style` | solid | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[0].type` | aromatic | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[0].label` | Aromatic | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[0].color` | #4DBBA8 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[1].type` | sulfur | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[1].label` | Sulfur | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[1].color` | #F2C343 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[2].type` | basic | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[2].label` | Basic | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.atomTypes[2].color` | #5B8DEF | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[0].id` | TRP130 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[0].label` | TRP | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[0].sub` | A:130 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[0].kind` | residue | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[1].id` | TYR58 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[1].label` | TYR | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[1].sub` | A:58 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.nodes[1].kind` | residue | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.edges[0].from` | TYR58 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.edges[0].to` | ligand_C7 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.edges[0].type` | pi-pi | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.edges[1].from` | TRP130 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.edges[1].to` | ligand_C3 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions.edges[1].type` | vdw | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.interactions._todo` | 完整的互作网络拓扑需从接口返回获取，当前为示意 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.mutationScoring.files[0].name` | MutXevo.csv | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.mutationScoring.files[0].desc` | 根据进化保守性和同源序列信息评估突变 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.mutationScoring.files[1].name` | MutXstruct.csv | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.mutationScoring.files[1].desc` | 内容待补充 | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.mutationScoring.files[2].name` | MutXseq.csv | 是 / 待复核 | 研发 | P0 |
| `mmetrics-5xh3.mutationScoring.files[2].desc` | 内容待补充 | 是 / 待复核 | 研发 | P0 |

P0：上线阻断项，数据与文案须经来源方确认；P1：录屏素材替换项。不可拆开真实验证句的 12 个靶点、每靶点不超过 50 个候选与超过 90% 的条件。
