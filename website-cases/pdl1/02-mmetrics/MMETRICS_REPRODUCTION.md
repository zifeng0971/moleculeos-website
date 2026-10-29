# MMetrics 原生界面复现交接

本文件记录 2026-10-20 在生产 MOS 项目 `PDL1-02-MMetrics-20261020` 实际观察、操作和下载的结果。原生面板已加载；此前“面板未完成”是历史状态。项目：`https://mos.moleculemind.com/?projectId=342256011498496`。

## 优先读取

1. `raw/native-ui/verified-native-summary.json`：经过审校的原生数据概要、覆盖范围和编号说明。
2. `raw/native-ui/native-datasets.json`：十份原生 CSV 的完整 JSON，含原列名与每一行数值。所有数字按原 CSV 字符串保留，避免精度和格式丢失。
3. `raw/native-ui/annotations.json`：五组原生注释、每个残基/范围的原文与 tooltip、实际 chip 样式。
4. `raw/native-ui/interactions.json`：71 条表格记录，含链对、类型、两个残基和距离。
5. `raw/native-ui/interaction-plot-{1,2,3}.svg`：原生 DOM 导出的三张 SVG，分别 A:C、A:B、B:C；保留节点位置、颜色、边、距离和文字。可直接用作静态参考或拆成可交互元素。
6. `raw/native-ui/verified-antibody-csv-numbering.json`：抗体 CSV 紧凑序号到结构及原始作者编号的逐残基映射。
7. `raw/native-ui/panel-dom.json`：完整已加载面板的可见文本与渲染后 DOM，用于复核顺序与文案。
8. `raw/native-ui/layout-and-typography.json`、`file-view-layout.json`：实际 viewport、边界矩形、字号、间距、颜色和表格尺寸。

路径在本文中相对 `02-mmetrics/`；全项目 JSON 卡片路径则相对 `website-cases/pdl1/`。

## 页面结构与视觉

截图 viewport 为 **1470×710 CSS px，devicePixelRatio=2**，未改变用户浏览器尺寸。首屏有顶部 MOS 工具栏、左侧对象树、中间序列条和结构画布、右侧 MMetrics。右侧为单一纵向滚动面板，**没有七个模块 Tab**。

正常面板内容起点约 x=747,y=102，宽703、高596，内容总高4359px。主体标题为12px/600、字距0.5px、颜色rgb(189,189,189)，视觉上大写；正文约13px，使用系统 sans-serif。卡片背景rgb(42,42,42)，圆角8px，内边距12px。激活的 MMetrics 标签为13px/600、背景rgb(47,47,47)、圆角6px。

打开 CSV 会在最右侧新增 File viewer，原 MMetrics 与结构区域缩窄。File viewer 含40px文件标题条、新窗口图标、关闭图标、可排序表格、底部分页；边界有“调整 Mocha 与文件面板宽度”的分隔条。实际尺寸随布局改变，读取记录文件，不把桌面绝对坐标硬编码成网站响应式布局。

逐屏原生截图：`visuals/native-panel-scroll-00.jpg` 至 `07.jpg`，scrollTop 分别0、568、1136、1704、2272、2840、3408、3762.5。相邻截图有约28px重叠。`08.jpg`与末屏相同，是滚动到底的边界证据。具体索引见 `raw/native-ui/scroll-captures.json`。

## 六个实际区块与数据

| 原生区块 | 原生实际内容 | 复现要求 |
|---|---|---|
| Description | Antigen–Antibody、confidence: high、英文描述、Reasoning、A=VH/B=VL/C=protein | 原文在 panel-dom.json；high 是描述分类的置信标签，不是 pLDDT |
| Homologs | Searched by antigen sequence similarity；No significant homologs found. | 原样保留空结果；不可用独立检索结果冒充这一面板 |
| Annotations | Paratope43、Epitope38、Domain3个范围、PTM4、UniProt Feature1 | 读取 annotations.json；Domain 的“3 residues”是原生 UI 字样，实际是3个区间 |
| Interaction Network | Table / 2D 切换；A:C38条、A:B22条、B:C11条 | 同一数据的两种视图；保留图例、节点类别和距离单位Å |
| Mutation Scoring | MutXevo、MutXstruct、MutXseq、MutXaff 四个文件卡 | 每张卡 CSV图标、文件名、View、Download |
| Antibody Design | AbScN_heavy..csv、AbScN_light.csv、AbAn_heavy.csv、AbAn_light.csv、ParaDt_heavy.csv、ParaDt_light.csv | 保留原文件名，包括 heavy..csv 的双点；解释性名称可另写官网文案 |

原生没有独立的 Risk Sites 和 Recommended Mutations 区块。已有补充数据分别在 `raw/mos-export/case02_complete/04_liabilities/liability_sites.json` 与 `06_mutations/recommended_mutations.csv`。若官网另增这两个区块，应标注补充来源；不把它们作为此次原生截图的一部分。

### 原生文件的完整度

| 文件 | 数据行 | 字段/用途 |
|---|---:|---|
| MutXevo.csv | 8780 | chain、mutation、score；进化评分 |
| MutXstruct.csv | 8780 | chain、mutation、score；结构适应度 |
| MutXseq.csv | 8780 | chain、mutation、score；序列适应度 |
| MutXaff.csv | 4294 | 空名索引列、mutstr、ddG_pred、score_ddg、rank；VH/VL单点亲和力 |
| AbScN_heavy..csv | 118 | 逐位点 VH2/VHH2 人源化及重复的序列总分 |
| AbScN_light.csv | 108 | 逐位点 VL2 人源化及重复的序列总分 |
| AbAn_heavy.csv | 118 | aa_index、aa、IMGT/Kabat/Chothia位置与区域 |
| AbAn_light.csv | 108 | 同上；序号1对应结构B2 |
| ParaDt_heavy.csv | 118 | aa_index、aa、pos_imgt、region_imgt、paragraph_score |
| ParaDt_light.csv | 108 | 同上；Paratope模型评分 |

三份8780行矩阵各含439个WT→WT，非同义替换各8341；覆盖A118、B108、C213个有坐标残基。原生亲和力恰为226个抗体残基×19，不含靶点替换。`ddG_pred`较低更有利，`score_ddg=-ddG_pred`；原始rank列不当作成功率。原生候选最佳K(A100)W，预测ΔΔG=-1.8933268 kcal/mol，仅是模型结果。

人源化序列模型分数：VH2=0.83598256，VHH2=0.7340711，VL2=0.94844085。Avelumab本例为VH/VL，不能把VHH2作为它实际属于VHH的依据；这些也不是实验人源性百分比。

## 已验证交互

- 点 Paratope 卡片：卡片出现选中边框，相关结构和序列残基高亮，出现 Clear (1)。
- 点 Epitope 卡片：可与另一组选中同时存在；Clear 数量随选中组变化。
- 点 A:TYR52 chip：触发单残基结构定位；保存 `native-residue-A52-selected.jpg`。
- 点 PTM 卡片：组选择与高亮状态；保存 `native-ptm-selected.jpg`。
- 点 Clear：清除注释群组选中。清除高亮不一定恢复此前缩放，因此用结构 Reset 恢复全景。
- Table / 2D：切换同一批链间相互作用的表格和SVG；表格列为Type、Residue A、Residue B、Dist (Å)。
- 文件 View：在右侧打开原生CSV viewer；十份文件均实际打开并截图。Download：十份均成功下载，原始CSV已保留。
- 点击亲和力 `ddG_pred` 列头：第一次升序、tooltip提示下一步降序。升序结果截图为 `native-affinity-sorted.jpg`；保留原始精度。
- 默认100条/页；Page Size选项50、100、500、1000。实际切到50并点击第2页，见 `native-affinity-page2-50.jpg`。8780行默认88页；4294行默认43页。
- 未观察到CSV内链筛选框、搜索框或自定义风险筛选，不添加为已观察功能。新窗口按钮和拖动分隔条已记录外观，但未宣称已验证其行为。

## 科学与编号边界

主界面显示完整实体序列A120/B110/C221；CSV主要使用有坐标部分A118/B108/C213，且保留结构编号空缺。轻链人源化/编号/ParaDt CSV按紧凑顺序编号，因此必须用映射连接结构。native与先前独立任务的9020行矩阵和8341条全复合物亲和力文件分开使用。

UniProt Feature显示C:ARG221，但tooltip说C→S；C221不在晶体坐标中，残基身份与文案不一致。截图和原文完整保留，官网若要科学陈述需省略或单独复核这个条目。原生Paratope列表与直接几何接触列表也不完全相同；保留其模型/注释来源，不描述为全部经过实验验证的结合残基。

原生自动任务ID此前记录为342256189539328，当前Task List只列出11项独立任务，没有该自动条目的最终状态。此次交付依据是实际加载的原生面板和十份可读下载文件；未虚构该任务的Succeed状态。

## 官网建议的展示节奏

优先复现首屏Description与三链复合物，然后滚动到Annotations并选中Paratope/Epitope，再切换Interaction Network的2D/Table，最后打开AbAn_light.csv展现编号与序列联动；需要分数时打开MutXaff并按ddG_pred升序。保留原生Homologs空状态。与02补充分析结合时，用明确的数据来源标签区分。

全景入口截图：`visuals/native-final-overview.jpg`。原生注释高亮：`native-paratope-selected.jpg`、`native-paratope-epitope-selected.jpg`。十份文件截图为 `native-file-文件名.jpg`。本交接没有修改官网前端。
