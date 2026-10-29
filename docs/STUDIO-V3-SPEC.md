# MOS v3 产品与界面规格：「舞台优先的证据工作台」

> 路由 `/studio/v3`，代码 `components/studio-v3/`。本文是 5 位并行实现者的唯一依据。
> 前置阅读：`docs/STUDIO-PRD.md`、`docs/STUDIO-CONCEPT.md`、`preview-package/explore/{ide,atlas,firstprinciples,board,notebook}.md`。
> 全部数据为演示数据。唯一真实条目：2FJG 的结构坐标、由坐标计算出的结构事实，以及 2FJG 主引用的元数据（Fuh G. 等，J Biol Chem 2006;281:6625–6631，PMID 16373345，DOI 10.1074/jbc.M507783200）。其余论文/专利一律是明显的占位示例。

---

## 0. 核心概念与取舍

### 0.1 一句话

**MOS v3 = 一块永远在场的真实 3D 舞台，加上两条围绕它的"带"：下方的证据带（核对凭据）与右侧的 Mocha 带（说目标、看计划、读结论）。所有区域共享同一条"残基地址总线"，所以点哪里都是同一个动作。**

概念名：**舞台优先的证据工作台（Stage-first Evidence Workbench）**。

### 0.2 为什么 v2 的分区不行

v2 按"谁在说话/哪种载体"切分：会话侧栏、对话流、右侧工作台标签页。3D 藏在可关闭的标签里，运行后才出现；MMetrics 停靠在 3D 下方像个附件；用户要找"这个残基有没有人报道过"，要在对话、标签、表格间来回跳。

v3 按**用户的工作循环**切分：**看（舞台）→ 选（轨道）→ 问（Mocha）→ 核（证据）→ 取舍（候选）→ 交接（文档）**。每个区域只服务其中一步，且都从同一个"焦点"取数。

### 0.3 取谁为底、借了什么、舍了什么

| 来源 | 决定 | 内容 |
| --- | --- | --- |
| **ide（底）** | 采用骨架 | 锁定的舞台组（文档永不顶替 3D）；底部面板读证据与文档；右侧 Mocha；底部状态栏；⌘K；残基地址总线（诊断/悬停/转到定义/代码透镜/快速修复）；provenance 与 verification 正交；FTO 做成可计算规则；演示数据四道闸。**理由**：5 个实现者最易切分，现有单画布 `stage.tsx` 下风险最低，证据层最完整。 |
| **atlas** | 借语法与不变量 | 全幅单画布永不卸载，面板开合只改画布尺寸并重新取景；"可见面积 ≥ 480×420"不变量；图层通道互斥语法（着色单选、其余各占一通道）；一个状态在舞台/轨道/图例三处渲染；"证据空白"一等公民；"仅显示真实证据"开关；幽灵标本空状态；沉浸模式（Tab）。 |
| **firstprinciples** | 借取舍机制 | 候选篮 + 五道闸门（亲和/稳定/开发/文献/专利），"无数据"永不显示为通过；带成本的动词条；证据平衡条（支持/限制/空白）；内联免责文案；固定语义轨道。 |
| **board** | 借规则 | "任意时刻至少一个实时舞台，只降级不移除"；来源可靠度 × 映射可信度两轴；演示证据默认不进入推荐排序；运行血缘；Mocha 指令光标。 |
| **notebook** | 借交接物 | 真实/派生/演示三态 origin；"交接摘要"（汇报模式）；舞台草稿思想（自由探索不强制入正文，改为"候选篮/视图书签"）。 |

**舍弃（及原因）**：并排双画布（`stage.tsx` 是单画布，只做叠合）；轮次/封存概念（强加流程）；无限画布与卡片引线（难以一句话说清区域、性能差）；滚动联动相机（与手动操作冲突）；每帧屏幕投影的针与阴影轮廓（`stage.tsx` 无投影接口，列入二期，原型把针/括号放在 2D 轨道上）；IDE 术语（终端、文件标签页、Problems/Output）；地图隐喻命名（改用：着色/图层/位点卡）；命令面板的 `#` `>` 前缀（只保留 `/` `@`）；Atlas 的"提问栏替代对话栏"（计划/算力确认/长运行需要稳定承载位，保留 Mocha 带）。

---

## 1. 产品论点与设计原则

1. **舞台是产品。** 交互式 3D 始终在屏幕上，其余一切围绕它。
2. **一个焦点，处处同步。** 点 3D、点序列轨、点候选行、点证据里的残基标签、点 Mocha 回答里的引用，都是同一个动作：`setFocus(addresses)`。
3. **证据有出处、有粒度、有等级。** 不合成"可信度百分比"；演示数据永远带标记，且不进入推荐排序。
4. **没有绿灯。** 专利/FTO 不出现"安全/可自由实施"；"未见覆盖"必须同时写明检索范围与日期。
5. **Mocha 是手，不是骨架。** 保留自然语言 → 计划 → 工具调用 → 算力确认 → 产出；`/` 调模型、`@` 引用链/区域；选区自动成为上下文。
6. **每个区域一句话说清**，位置稳定，不漂移。
7. **克制。** 深色为主、浅色同等品质；一种强调色；彩色只给科学数据与状态。

### 1.1 "舞台常驻"硬规则（可测试）

**规则 S0**：任意时刻、任意断点，页面上存在且仅存在一个挂载的 `<Stage/>`（Mol* 画布），**永不卸载**；任何状态只能改变它的尺寸、叠层、取景，不能把它放进可关闭容器、标签页或需要点击才出现的位置。

**规则 S1（可见面积不变量）**：桌面（≥1100 宽）舞台"净空区"（canvas 去掉 HUD 之外的矩形）常态 ≥ 480×420；阅读态下限 ≥ 480×300（仅"最大化证据带"时允许降到该下限）；窄屏 ≥ 42vh。违反即缺陷。

**规则 S2**：文档/表格/报告/论文只在证据带阅读，**永不替换舞台**。

**规则 S3**：面板开合、窗口 resize 后，舞台在 280ms 内重新取景（`reset()` 并保持当前选区居中：若有选区则 `focus(sel)`），不留黑边。

**规则 S4**：舞台上只有一个"着色"状态（互斥透镜）；其余通道叠加，通道各自最多一层。

下表是五种状态下 3D 在哪、占多大、怎样不被遮挡（1440×900，数值为画布区域 W×H）：

| 状态 | 3D 的存在方式 | 尺寸 | 防遮挡措施 |
| --- | --- | --- | --- |
| **空状态**（尚无用户结构） | 舞台铺满主区；画布加载内置示例 2FJG 的**幽灵标本**（35% 亮度，右下金色虚线「示例结构 · 不属于你的项目」徽章，可旋转可点选，选中不产生计算）。导入入口是舞台底部居中的毛玻璃卡片（粘贴序列 / PDB ID / 上传 / 载入示例），不盖蛋白中心；整块舞台是拖放目标。侧栏与证据带此刻**不渲染**（零状态），Mocha 带只显示起手问题 | 1088×808（仅导航轨 52 + Mocha 带 300 收窄；若 Mocha 收起则 1388×808） | 导入卡高度 ≤ 132，贴底；蛋白中心位于 y∈[30%,60%]。载入示例后标本 280ms 交叉淡化为实体，侧栏 280ms 展开，舞台自动 `reset()` |
| **对话/运行进行中** | 舞台**不被占用，保持可交互**。只叠加：顶部居中进度胶囊（模型名·步骤·剩余）；被扫描位点错峰脉冲（用 `paint` 分批上色实现"边算边染"）；预测时保留晶体幽灵并叠加预测结构，完成后新结构淡入并默认切到 pLDDT 着色 | 同常态（816×≥420） | 运行日志在证据带"运行"标签，**不自动把证据带抬高超过 peek**；算力确认卡在 Mocha 带内，不是模态 |
| **阅读表格/报告/论文** | 文档在证据带"文档/证据"标签阅读。证据带可拉到 read（340）或 max（464，自动收起左侧栏换宽度）。悬停表格行 → 3D 对应残基发光（`highlight`），点击 → `focus` | read：816×424；max：1028×300（左侧栏收起，x52–1080） | 取景在上方可见区重新居中；Mocha 带可 ⌘/ 收起以再让出 360 宽；证据带最大高度 = `bodyH − 轨道 72 − 舞台下限`，由 `layout.ts` 计算，不是常量 |
| **对比多个结构** | 同一画布**叠合**（Superimpose）：固定为灰色幽灵，移动者按链着色；RMSD 与"位移"透镜；差异卡在证据带。**不做双画布并排**（二期，仅当 viewer 支持多视口）。原型只有 2FJG，对比用"预测模型 vs 晶体（演示差异场）"脚本模拟，并在卡片上标"演示" | 同常态 | 轨道上增加"位移"行；图例标注哪条是固定/移动 |
| **窄屏** | 1100–1279：Mocha 带变右侧抽屉（覆盖 360，打开时舞台 `viewOffset` 不可得，改为舞台留左侧净空 ≥ 480 宽）；760–1099：舞台吸顶 ≥ 42vh，下方分段切换「对话 · 证据 · 项目」；<760：舞台吸顶 38vh，三档底部面板（peek 25vh / half 50vh / full 但舞台缩成 120px 实时舷窗，不卸载） | 见 §2.4 | 点引用只在顶部舞台高亮，不跳转页面；手势：舞台区域独占触摸，面板拖拽柄独立 |

**占屏比（1440×900，舞台画布 / 窗口）**：空状态 ~62%；常态（证据带折叠）46%；证据带 peek（208）38%；read（340）33%；max 23%（仅阅读核对时，允许）。默认**折叠**，用户点引用/风险/文件才抬起；回到浏览自动落回折叠（点舞台空白处或 Esc）。

---

## 2. 信息架构

### 2.1 区域清单（每区一句话）

| # | 区域 | 用户在这里做什么（一句话） |
| --- | --- | --- |
| Z1 | **标题栏** | 切换/新建/分享项目，管成员与权限，按 ⌘K 找任何东西。 |
| Z2 | **导航轨 + 项目侧栏** | 找到并管理项目里"存着的东西"：蛋白与残基组、候选篮、文件、任务、帮助。 |
| Z3 | **舞台**（含 HUD：着色/图层/工具列/位点卡/图例） | 看、转、选、量结构，并在同一画布上看到打分、风险和证据落在哪里。 |
| Z4 | **轨道**（序列条） | 沿序列扫同一组图层并拖选区域；与 3D 共用选区。 |
| Z5 | **证据带**（标签：证据 · 候选 · 文档 · 运行） | 核对凭据与取舍：这句话凭什么、这个突变能不能做、产出文件里写了什么。 |
| Z6 | **Mocha 带** | 说目标，看计划，确认花钱，读带引用的结论。 |
| Z7 | **状态栏** | 不打开任何东西就知道全局状态：演示数据、选区、编号体系、风险/IP、运行进度、算力。 |
| — | 浮层：**命令面板** ⌘K | 第二入口：打字找模型、残基、证据、命令；首行永远可把一句话交给 Mocha。 |

首屏（有结构、证据带折叠）实际可见：Z1 Z2 Z3 Z4 Z6 Z7 + 证据带的标签条（36px，不算作"展开区域"）。

### 2.2 1440×900 线框（常态：证据带折叠）

```
x0                264                                      1080                    1440
y0  ┌──────────────────────────────────────────────────────────────────────────────────┐
    │ Z1 标题栏 40  ◇项目▾ G6×VEGF-A · 成员 · 分享     [⌘K 搜索或交给 Mocha]  ◐ 通知 主题 │
y40 ├────┬─────────────┬──────────────────────────────────────────────┬────────────────┤
    │Z2  │ Z2 项目侧栏 │ Z3 舞台（单画布 Mol*，HUD 叠在其上）          │ Z6 Mocha 带     │
    │导航│ 212         │ ┌ 着色: 区域▾ 图层▾ ┐             ┌工具列┐   │ 360             │
    │轨  │ ▾ 结构      │ │                                  │表示  │   │ 会话标题 · 步骤条│
    │52  │   2FJG      │ │      3D 结构 (真实 Mol*)          │测距  │   │ ─────────────── │
    │    │   ▸ 残基组  │ │                                  │5Å    │   │ 回答（含 S/M/P/ │
    │资料│ ▾ 候选 3/6  │ │          [位点卡 H:54]            │对比  │   │  PAT 引用角标） │
    │查找│ ▾ 文件      │ │                                  │截图  │   │ 依据 6·真实3·演示3│
    │模型│ ▸ 任务      │ │ 图例 ■区域 ░论文覆盖  ░ 专利覆盖   └──────┘   │ 内联候选表      │
    │任务│             │ └────────────────────────────────────────────┘   │ 产出文件 chip   │
    │帮助│             │ Z4 轨道 72：序列·区域·当前着色·论文针·专利括号·风险 │ 建议动作(带成本)│
    │    │             ├──────────────────────────────────────────────┤  │ ─────────────── │
    │    │             │ Z5 证据带 36（折叠）：证据 候选 文档 运行  ⌘J ▲ │ │ [Mocha 看到:H:54]│
    │    │             │                                              │  │ [输入… / @ ]    │
y876├────┴─────────────┴──────────────────────────────────────────────┴────────────────┤
    │ Z7 状态栏 24：演示数据·5项 │ 选区 H:54 │ IMGT▾ ‖ ⚠风险2 · ⛨IP1 · 运行 62% · 积分 │
y900└──────────────────────────────────────────────────────────────────────────────────┘
```
x 轴：导航轨 0–52，侧栏 52–264，中心列 264–1080（816），Mocha 1080–1440（360）。舞台画布高 = 836 − 轨道 72 − 证据带 36 = 728 → 画布 816×728。

**证据带展开（peek 208 / read 340）**：证据带自底向上抬起，**挤压**舞台高度（不覆盖）；read 时侧栏自动收起，舞台宽度 +212：

```
y40 ┌────┬──────────────────────────────────────────────────┬───────────────┐
    │导航│ Z3 舞台 816→1028 × 424（净空 ≥480×420 ✔）         │ Z6 Mocha      │
    │轨  ├──────────────────────────────────────────────────┤               │
    │    │ Z4 轨道 72                                        │               │
y536│    ├──────────────────────────────────────────────────┤               │
    │    │ Z5 证据带 340（read）                             │               │
    │    │ [范围条: 与选区相关 H:54 ▾]  证据平衡 ▮支持2 ▮限制1 ▯空白1 │      │
    │    │ ┌列表 260──┐┌ 阅读器 ─────────────┐┌ 覆盖/FTO 卡 ──┐ │               │
y876└────┴──────────────────────────────────────────────────┴───────────────┘
```

### 2.3 区域详细规格

#### Z1 标题栏（高 40，通栏，永不折叠）
内容：项目面包屑（切换/新建/重命名）· 成员头像堆叠 · 分享（权限：只读/评论/编辑，项目内含私有证据范围提示）· 居中 ⌘K 触发条 · 通知 · 主题切换（深/浅/跟随）· 账号。

#### Z2 导航轨（52）+ 项目侧栏（212）
- 轨（图标+小字标签）：**资料**（默认）/ **查找**（SeqSim、同源、站内搜索结果）/ **模型**（10 个模型功能，按目标分组：预测 · 设计 · 打分 · 其他）/ **任务**（运行中徽标）/ **帮助**（手册、示例）。
- 侧栏随轨切换内容。"资料"分组（可单独折叠并记忆，空分组隐藏）：**结构**（蛋白→链→残基组的节点树，导入/重命名/对齐/删除/显隐）· **候选**（候选篮，≤6 行，每行 5 个闸门点，见 §5.3）· **文件**（产出：CSV、结构、报告）· **视图**（视图书签：相机+着色+选区）。
- 折叠：<1240 宽变抽屉；证据带 read/max 时自动收起，关闭时恢复；⌘B 手动。轨本身不折叠（窄屏并入分段切换）。

#### Z3 舞台
- 单一 `<Stage/>` 画布（复用 `../studio/stage.tsx`），HUD 为 DOM 叠层，**不做每帧 3D 投影**。
- HUD 四角：**左上**「着色」chip（当前透镜）+「图层」弹层；**右上**工具列（表示 Representation：卡通/棒状/表面·测距·5Å 邻域·结构对齐 Superimpose·截图·复位）；**左下**图例（随着色与图层变化，一个状态三处渲染：舞台、轨道、图例）；**右下**证据摘要 chip（"H:54 · 论文1 · 专利1"，点击展开证据带）；位点卡（选中后出现在选区附近的固定锚点——画布右侧 24px 边距，不跟随 3D 投影）。
- **沉浸模式**：Tab 或 ⌘. 隐藏 Z2/Z5/Z6/Z7 之外的 HUD 与所有面板（保留舞台与最小化的提问条），再按恢复。
- Mocha 视线光标：Mocha 回答"正在看 CDR-H2"时，在舞台左下出现带名字的胶囊（"Mocha · 对照 CDR-H2"），同时 `highlight` 对应残基；不做 3D 内浮动指针。

#### Z4 轨道（高 72，可拖到 160；证据带非折叠时锁在 72）
- 一维投影，与 3D **同一份图层状态**。行（自上而下，固定语义顺序，用户只能显隐，不能新增）：序列 · 区域（CDR/表位）· 当前着色 · 互作 · 论文针 · 专利括号 · 风险点 · 候选。72 高时合并为"序列 + 一条复合热度带 + 针/括号"；160 时展开各行。
- 拖选区域 = 设置选区；悬停 = 悬停地址；论文针（蓝）与专利括号（粉，斜纹）点击 → 证据带过滤到该证据。
- 可折叠为 24px 细条（保留选区刻度）。

#### Z5 证据带（折叠 36 / peek 208 / read 340 / max 464）
- 标签：**证据 · 候选 · 文档 · 运行**。右上"范围条"：`全结构 › CDR-H2 › H:54A>M`（面包屑决定证据范围）、「仅显示真实证据」开关、`⌘J` 切换、`⌘⇧J` 最大化。
- **证据**（MMetrics 的新家）：范围 = 全结构时是 **MMetrics 档案**（概述、同源、注释、互作网络、可开发性风险、突变打分，与 v2 内容对齐，作为"结构事实 / 模型打分"两类证据的专页）；范围 = 区域/残基/突变时是该范围的证据列表（类型筛选芯片：结构 S · 打分 M · 论文 P · 专利 PAT · 风险 R）+ 阅读器 + 右栏（论文：已报道突变/结论卡；专利：权利要求与 FTO 卡）+ 证据平衡条（支持/限制/空白）。
- **候选**：候选表（含五道闸门）与对比；闸门详情；"加入候选篮/移出"；"生成交接摘要"。
- **文档**：CSV/报告/档案原文的阅读器（表格虚拟滚动，悬停行 → 3D），"在文档中打开"的统一落点；交接摘要在这里渲染并可复制/导出。
- **运行**：每次模型调用的卡片（模型名与版本、参数、输入哈希、状态、日志、算力、复现按钮、产出文件、血缘"此结果来自第 N 次运行"）。
- 自动行为：点引用角标/风险角标/文件 chip/状态栏计数 → 抬到对应标签的 peek；运行开始 → 状态栏进度动，**不自动抬高证据带**；Esc 或点舞台空白 → 折叠。

#### Z6 Mocha 带（360，≥1280 宽 336）
自上而下：会话标题（可切换历史） → 折叠的步骤条（计划/工具调用，可展开参数） → 回答（带引用角标） → 依据统计（"依据 6 · 真实 3 · 演示 3"） → 内联候选表 → 产出文件 chip → 建议动作（动词条，旁边写成本）→ 输入区（"Mocha 看到：H:54 · CDR-H2"上下文 chip；`/` `@`；运行模式 ask/auto/plan；积分估计）。待确认算力时不静默收起。⌘/ 收起（舞台 +360）。

#### Z7 状态栏（高 24，永不折叠，每项可点击）
左：**演示数据·N项**（点击=过滤到演示证据）· 选区（点击=清除/复制地址）· 编号体系（IMGT/Kabat/Chothia/AHo 切换）· 视角同步；右：风险 ⚠N（→ 证据带·证据·风险筛选）· IP ⛨N（→ 专利筛选）· 运行进度（→ 运行标签）· 算力积分。

### 2.4 尺寸、折叠与响应规则

| 断点 | 规则 |
| --- | --- |
| **≥1440** | 如线框。侧栏 212，Mocha 360。 |
| **1280–1439** | 侧栏默认**抽屉**（轨常驻 52，点开覆盖 212，Esc 关闭，不挤压舞台）；Mocha 336；中心列 892。证据带 read 高度 = `min(340, bodyH−72−420)`。 |
| **1100–1279** | 轨常驻；侧栏抽屉；Mocha 变右侧抽屉（320，覆盖，打开时舞台左侧净空 ≥480）；状态栏文字缩略为图标+数字。 |
| **760–1099** | 单列：顶部舞台 sticky ≥42vh；其下 [对话 · 证据 · 项目] 分段切换；轨道 56；⌘K 收为搜索图标。 |
| **<760** | 舞台吸顶 38vh；底部三档面板；拖到 full 时舞台缩成 120px 高实时舷窗；窄屏只承诺"看与问"，编辑类操作（对齐、测距）提示回桌面。 |

高度 <760 时（笔记本 1366×768）：轨道 56，证据带 peek 160 / read = `bodyH−56−360`。

### 2.5 功能 → 区域映射（覆盖全部真实 MOS 任务）

| 真实 MOS 功能 | 区域/位置 | 备注 |
| --- | --- | --- |
| 项目切换、新建、重命名 | Z1 面包屑 | |
| 项目分享、成员、权限 | Z1 分享弹层 | 证据库可见范围继承项目权限 |
| 导入蛋白（序列/PDB ID/文件/示例） | Z3 空状态导入卡；Z2 结构分组"＋"；Mocha `/import` | |
| 蛋白/氨基酸组节点树、显隐/删除/重命名 | Z2 资料·结构 | 残基组 = 命名选区，可 `@` 引用 |
| 序列区浏览、选择 | Z4 轨道 | 与 3D 同选区 |
| 结构查看、旋转缩放选择 | Z3 | |
| Representation（卡通/棒状/表面） | Z3 工具列 | |
| 测距 | Z3 工具列；Mocha "量一下 H:54 到 V:48" | 结果写入状态栏与位点卡 |
| 结构对齐 Superimpose | Z3 工具列「对比」；Z2 结构右键；Mocha `/superimpose` | 结果在证据带·证据（差异卡） |
| 氨基酸注释 / 残基组注释 | Z4 区域行；Z2 残基组；MMetrics 注释 | 创建组 = 命名选区 |
| 5Å 邻域搜索 | Z3 工具列；位点卡「邻域」；Mocha `/neighbors` | |
| 非共价互作 | Z3 图层「互作线」；Z4 互作行；证据带·证据（互作网络） | MMetrics 档案内 2D 网络 |
| SeqSim 同源搜索 | Z2 轨「查找」；证据带·证据（档案·同源） | |
| MMetrics | Z5 证据（全结构范围 = 档案）；Z6 摘要卡 | 自动运行，0 积分 |
| Mocha 对话 | Z6 | |
| 10 个模型功能（MMFold / Protein Redesign / Binder Design / 3 个突变打分 / 蛋白-配体亲和力 / 口袋检测 / 抗体人源化 / 结合亲和力突变打分） | Z2 轨「模型」目录；⌘K `/`；Mocha 输入框 `/`；位点卡的动词条 | 运行前一律出算力确认卡 |
| 模型结果（结构/表格/热图） | 结构：Z3 着色；表格：Z5 文档 + Z6 内联候选表；打分：Z4 当前着色行 | |
| 任务列表、状态 | Z2 轨「任务」；Z5 运行；Z7 进度 | |
| 通知 | Z1 通知；Z7 | |
| Workspace 文件夹/产出文件 | Z2 资料·文件；Z6 文件 chip；Z5 文档 | |
| 候选清单与取舍 | Z2 候选篮；Z5 候选 | |
| 论文/专利证据 | Z5 证据；Z3 着色透镜；Z4 针与括号；Z6 引用 | |
| 帮助中心/手册 | Z2 轨「帮助」 | |
| 主题/语言 | Z1 | |

---

## 3. 证据层数据模型

### 3.1 设计要点

- MMetrics 从"结构档案"扩展为**证据层（Evidence Layer）**。五类证据共用一种记录 `Evidence`，`kind` 区分：`structure`（结构事实）、`model`（模型打分）、`paper`（论文）、`patent`（专利）、`risk`（可开发性/IP 风险，可由前几类派生）。
- 所有证据挂在**锚点** `Anchor` 上，锚点粒度：残基 / 区间 / 区域 / 突变 / 残基对 / 界面 / 链 / 结构。
- **地址**统一为 `label` 字符串 `链:序号`（沿用 `model.ts`，auth 编号，如 `H:54`）；编号体系（IMGT/Kabat/Chothia/AHo）只在显示层转换（`displayResidue`），数据层同时存 `scheme` 与 `authAddr`。
- **来源与可信度的三个正交维度，禁止合成单一百分比**：`provenance`（怎么来的）· `verification`（谁核过）· `mapping`（落到本结构残基上的把握）。论文再加 `stance`（实验测得/作者推断/综述转述）。
- **演示 vs 真实**：`origin: 'real' | 'derived' | 'demo'`，三态是视觉语言：真实（实心绿点）/ 派生（青色半圆，由真实坐标计算）/ 演示（金色虚线边框 + 斜纹 + 「演示」）。ID 层强制：`demo` 记录 ID 必须以 `DEMO-` 开头，标题以「示例：」开头（`assertDemoRules()` 在模块加载时校验，生产构建中遇 DEMO 记录抛错）。

### 3.2 TypeScript 接口（`components/studio-v3/evidence/types.ts`，由 C 负责）

```ts
export type Addr = string;                         // 'H:54'，auth 编号，与 ../studio/model.ts 的 label 同形
export type SchemeId = 'IMGT' | 'Kabat' | 'Chothia' | 'AHo' | 'auth' | 'UniProt' | 'source';

export type EvidenceKind = 'structure' | 'model' | 'paper' | 'patent' | 'risk';
export type Origin = 'real' | 'derived' | 'demo';
export type Provenance = 'computed' | 'extracted' | 'curated' | 'database' | 'demo';
export type Verification = 'none' | 'auto' | 'metadata' | 'human';       // metadata = 仅元数据（PMID/DOI）核验
export type Stance = 'measured' | 'author-inferred' | 'review-cited';    // 实验测得/作者推断/综述转述
export type Support = 'supports' | 'limits' | 'neutral';                // 供证据平衡条使用

/** 落到本结构残基上的把握；不是来源可靠度。 */
export interface Mapping {
  method: 'exact' | 'aligned' | 'inferred' | 'unmapped';
  fromScheme: SchemeId; toScheme: 'auth';
  identity?: number;                    // 对齐一致性 0–1，method=aligned 时必填
  note?: string;                        // 例如 "Kabat H53 → 本结构 H:54，Ala 一致"
}

export type AnchorScope = 'residue' | 'range' | 'region' | 'mutation' | 'pair' | 'interface' | 'chain' | 'structure';
export interface MutationRef { addr: Addr; from: string; to: string }      // 一字母码，例：{addr:'H:54',from:'T',to:'M'}（占位示例）
export interface Anchor {
  scope: AnchorScope;
  addrs: Addr[];                        // 展开后的残基集合（region/range 展开，structure 为空数组）
  regionId?: string;                    // 与 model.ts REGIONS 的 id 对齐（'h2' / 'ep' ...）
  mutation?: MutationRef;               // scope='mutation'
  pair?: [Addr, Addr];                  // scope='pair'
  mapping: Mapping;
}

export interface SourceRef {
  refId: string;                        // 指向 Paper.id / Patent.id / 'MMETRICS' / 'MODEL:xxx' / 'COORD:2FJG'
  locator?: string;                     // 论文: 'Fig. 3' / 'p.6627' ; 专利: '权利要求 1'
  quote?: string;                       // ≤ 15 词的原文摘录或演示占位文字，不得杜撰真实原文
  url?: string;
  retrievedAt: string;                  // ISO 日期；演示数据用 '20XX-XX-XX' 字面量
  dbVersion?: string;
}

export interface Evidence {
  id: string;                           // 'EV-STR-001' | 'EV-PAP-001' | 'DEMO-EV-PAP-002' ...
  kind: EvidenceKind;
  origin: Origin;
  provenance: Provenance;
  verification: Verification;
  stance?: Stance;                      // 论文/专利陈述
  support: Support;                     // 对"当前考察的突变/位点值得做"的态度
  title: string;                        // demo 必须以「示例：」开头
  claim: string;                        // 一句话断言
  anchors: Anchor[];
  source: SourceRef;
  confidenceNote?: string;              // 可信度的**依据**，例如 "基于 2.80 Å 坐标计算"；不得是数字分数
  value?: { label: string; num: number; unit?: string };  // 结构/打分数值
  risk?: RiskFlag;                      // kind='risk' 时必填
  ref?: { paperId?: string; patentId?: string; claimId?: string };
}

export type RiskLevel = 'info' | 'low' | 'medium' | 'high';
export interface RiskFlag {
  type: 'liability' | 'fto' | 'conflict';
  level: RiskLevel;
  reason: string;                       // 一句话："命中 NG 脱酰胺基序" / "落入示例权利要求 1"
  suggestion?: string;                  // 快速修复："改用 A54M，亲和力换自由度"
}

/** 论文 */
export interface Paper {
  id: string;                           // 'PAP-FUH-2006' | 'DEMO-PAP-001'
  origin: Origin;                       // 首条为 'real'；其余 'demo'
  title: string;                        // 真实: 以 PubMed 核对后的标题；demo: '示例：……'
  authors: string;                      // 真实: 'Fuh G. 等'；demo: '示例作者'
  venue: string;                        // 'J Biol Chem 2006;281:6625–6631'
  year: number;
  pmid?: string; doi?: string;
  verification: Verification;           // 主引用: 'metadata'
  reported: ReportedFinding[];          // 已报道突变与结论
}
export interface ReportedFinding {
  id: string;                           // 'DEMO-RF-001'
  mutation?: MutationRef;
  summary: string;                      // demo 必须以「示例：」开头；真实论文只允许写元数据级事实
  effect?: 'improves' | 'reduces' | 'neutral' | 'unknown';
  stance: Stance;
  evidenceId: string;
}

/** 专利 */
export interface Patent {
  id: string;                           // 'DEMO-PAT-001'（不得使用真实专利号格式）
  origin: 'demo';                       // 本轮专利全为 demo
  title: string;                        // '示例：……'
  assignee: string;                     // '示例权利人 A'，禁止真实公司名
  legalStatus: 'unknown' | 'pending' | 'granted' | 'lapsed' | 'demo';
  jurisdiction: string;                 // '示例地域'
  priorityDate: string;                 // '20XX-XX-XX'
  family?: string[];
  claims: Claim[];
  officialUrl?: undefined;              // 演示专利无官方链接；真实数据期必填
  searchScope: { database: string; searchedAt: string; query: string };  // 检索范围，永远展示
}
export interface Claim {
  id: string;                           // 'DEMO-PAT-001#1'
  kind: 'independent' | 'dependent';
  text: string;                         // 示例文本
  rule: CoverageRule;                   // 可计算覆盖规则（§3.4）
  ruleVerification: 'unverified' | 'human-reviewed';
}

/** 可计算覆盖规则：权利要求限定位点/残基 */
export interface Predicate { addr: Addr; anyOf: string[] }                    // H:54 ∈ {F,Y,W}
export interface CoverageRule { mode: 'all' | 'any'; clauses: Predicate[]; regionHint?: string }

/** FTO 判定：确定性计算，不由大模型给出 */
export type CoverageType = 'identical' | 'mutation-in' | 'possibly-equivalent' | 'not-found';
export interface FtoVerdict {
  mutant: MutationRef[];                // 候选
  perClaim: { claimId: string; coverage: CoverageType; matched: Addr[] }[];
  level: RiskLevel | 'unsearched';
  scopeText: string;                    // "检索范围：示例库 · 20XX-XX-XX"，永远随结论显示
  disclaimer: 'screening-only';         // 渲染固定文案「筛查级别，不构成法律意见」
  workaround?: { mutation: MutationRef; tradeoff: string };
}

/** 引用：Mocha 回答中的引用 */
export interface Citation {
  evidenceId: string;
  badge: 'S' | 'M' | 'P' | 'PAT' | 'R';   // 由 kind 派生
  inferred?: false;                       // 有 id 才是引用；无 id 的句子只能渲染为"推断"
}

/** 证据账本（运行时容器） */
export interface Ledger {
  evidence: Evidence[];
  papers: Paper[];
  patents: Patent[];
  version: string;                      // 账本版本哈希，随 Mocha 回答保存
}
export interface LedgerQuery {
  addrs?: Addr[];                       // 与锚点 addrs 相交
  regionId?: string;
  mutation?: MutationRef;
  kinds?: EvidenceKind[];
  realOnly?: boolean;                   // 仅显示真实（origin !== 'demo'）
}
export interface Balance { supports: number; limits: number; gaps: string[] }   // gaps: ["论文：无记录（范围…）"]
```

### 3.3 论文与专利如何挂到残基、区域、突变

| 粒度 | 数据 | 3D | 轨道 | 证据带 |
| --- | --- | --- | --- | --- |
| **残基** | `Anchor{scope:'residue',addrs:['H:54']}` | 选中/悬停时 `select/highlight`；"论文覆盖"透镜把该残基染为论文色阶；位点卡显示「论文1 · 专利1」 | 论文针（蓝）落在该列 | 范围 = `H:54` 时过滤列表，精确命中排最前 |
| **区域** | `scope:'region'`, `regionId:'h2'`，`addrs` 展开 | "专利覆盖"透镜把区域内被权利要求限定的位点染粉色阶；区域整体 `highlight` | 粉色斜纹括号覆盖 CDR 范围 | 范围面包屑 `全结构 › CDR-H2`；区域级证据显示 |
| **突变** | `scope:'mutation'`, `mutation:{addr,from,to}` | 悬停候选行：该位点 `highlight` + 位点卡显示"H:54 T→M"；FTO 热区透镜按突变命中染色 | 候选行小点 + 风险点 | 候选表"风险"列显示命中的权利要求；FTO 卡显示 `perClaim` |
| **残基对/界面** | `pair`/`interface` | `measure` 线 | 互作行 | 互作网络 |
| **结构/链** | `structure`/`chain` | 无 | 无 | 全结构范围（档案） |

排序（同一范围内）：突变精确命中 > 同残基 > 同区域 > 整结构；同级内 真实/派生 > 演示。**演示证据默认不进入推荐排序与"依据"计数的真实部分**（依据条分计"真实 N · 演示 M"）。

**编号映射**：论文 Kabat/UniProt、专利权利要求 SEQ ID 位置，须经 `Mapping` 落到 auth 编号；`method:'inferred'` 的锚点在 3D/轨道上画虚线圈/虚线针；`unmapped` 只在序列级展示，不画针。

### 3.4 FTO：确定性覆盖规则

- 权利要求 → `CoverageRule`（位置限定 `H:54 ∈ {F,Y,W}`；`mode: all|any`）。`evaluateFto(mutants, patents): FtoVerdict` 为纯函数：把候选突变应用到野生型后逐条求值；全部子句满足 = `mutation-in`，序列整体相同 = `identical`，部分命中 = `possibly-equivalent`，其余 `not-found`。
- 等级映射：任一独立权利要求 `identical|mutation-in` → `high`；`possibly-equivalent` → `medium`；全部 `not-found` → `low`（**文案为「未见覆盖」，不是"安全"**）；库未检索 → `unsearched`。
- 规则 `ruleVerification='unverified'` 时，等级旁标「规则未复核」；人工复核后才标「已复核」。
- **呈现链路**：状态栏 ⛨ → 证据带·证据（专利筛选）→ **FTO 卡**（高/中/低/未检索 四格，不含绿色；一句话命中原因；权利要求限定位点高亮在 CDR 序列上；「绕开建议」按钮=快速修复，例如"改用 A54M，用亲和力换自由度"）→ 3D「FTO 热区」透镜 → 轨道专利括号 → 候选表风险列 → 候选篮专利闸门。
- **固定文案（每处 FTO 呈现都带）**：「筛查级别，不构成法律意见」「区域覆盖 ≠ 权利要求覆盖」「未见覆盖 ≠ 可自由实施」「先行技术 ≠ 自由实施」「检索范围：{database} · {searchedAt}」。

### 3.5 来源、可信度与"演示数据"标识

- **可信度展示**：三行小字——`来源：真实·主引用` / `核验：仅元数据已核验` / `映射：对齐 92%（Ala 一致）`；论文再加 stance 标签。**不显示百分比总分；不显示"可信度 87%"。** 每条可信度必须带依据文字（`confidenceNote`）。
- **三态 origin 视觉语言**（全局一套，列表/角标/卡片/轨道/状态栏/导出共用）：真实 = 实心绿点；派生 = 青色半圆；演示 = 金色虚线边框 + 斜纹底 + 「演示」文字（色盲可辨：形状+图案+文字三重）。「真实」≠「已核验」，二者分开显示。
- **四道闸**：(1) 数据层：`DEMO-` 前缀与「示例：」强制，`assertDemoRules()`；(2) 视觉层：上述三态；(3) 汇总层：状态栏「演示数据·N项」与依据条分计，「仅显示真实证据」开关重算全部计数、候选闸门与 Mocha 结论；(4) 边界层：导出/交接摘要对演示行加 `DEMO` 列和水印，生产构建 `assertNoDemoInProd()`。

### 3.6 2FJG 的真实条目与占位条目

真实（`origin:'real'|'derived'`）：
- `PAP-FUH-2006`：Fuh G. 等，J Biol Chem 2006;281:6625–6631，PMID 16373345，DOI 10.1074/jbc.M507783200；`verification:'metadata'`。**标题字段**：C 须到 PubMed 核对后再填；无法核对时写 `title: '2FJG 主引用（PMID 16373345）'`，不凭记忆写标题。`reported` 为空数组（不虚构真实结论）。
- `EV-STR-001`（real）：2FJG 晶体结构分辨率 2.80 Å（取自 `public/demo/2fjg.cif` `_refine.ls_d_res_high`），锚点 `structure`，source `COORD:2FJG`。
- `EV-STR-0xx`（derived）：由坐标计算的界面互作、表位、CDR 位置（沿用 `mmetrics-data.ts` 已有 `origin:'structure'` 的事实，C 转换为 `derived`）。
- `EV-PAP-001`（real, `kind:'paper'`）：「2FJG 的主引用」，claim 仅写元数据级事实："该文献为 2FJG 晶体结构的主引用"，锚点 `structure`。

占位（全部 `origin:'demo'`）：
- `DEMO-PAP-001`「示例：某位点突变的亲和力报道」作者「示例作者」，`reported` 含 `DEMO-RF-001`（示例：H:54 某突变报道亲和力提升）、`DEMO-RF-002`（示例：另一位点无明显影响）；`DEMO-PAP-002`「示例：CDR-H2 区域综述」（stance=`review-cited`）。
- `DEMO-PAT-001`「示例：含 CDR-H2 位点限定的抗体变体」，权利人「示例权利人 A」，优先权日 `20XX-XX-XX`，独立权利要求 `DEMO-PAT-001#1` 规则 `H:54 ∈ {F,Y,W}`（示例）；`DEMO-PAT-002`「示例：CDR-H3 序列限定」，规则 `H:105 ∈ {…}`（示例）。
- 数量：论文 3（1 真实 + 2 演示）、专利 2、结构/打分/风险若干（沿用现有）；状态栏应显示「演示数据·N 项」。

### 3.7 数据模块导出契约（C 提供）

```ts
// components/studio-v3/evidence/data.ts
export const LEDGER: Ledger;
// components/studio-v3/evidence/query.ts
export function queryEvidence(q: LedgerQuery, ledger?: Ledger): Evidence[];
export function balanceOf(items: Evidence[]): Balance;
export function evaluateFto(mutants: MutationRef[], ledger?: Ledger): FtoVerdict;
export function demoCount(ledger?: Ledger): number;
export function ledgerVersion(ledger?: Ledger): string;
export function getEvidence(id: string): Evidence | undefined;
export function getPaper(id: string): Paper | undefined;
export function getPatent(id: string): Patent | undefined;
export function assertDemoRules(ledger?: Ledger): void;
export function citationOf(id: string): Citation | null;   // 无此 id 返回 null
```

---

## 4. 交互矩阵

### 4.1 焦点总线

所有区域读写同一个 store（`store.ts`，A 负责）。

```ts
export interface Focus {
  sel: Addr[];                       // 选区（持久，作为 Mocha 上下文）
  hover: Addr[] | null;              // 悬停（瞬时）
  region?: string;                   // 'h2' 等
  mutation?: MutationRef;
  evidenceId?: string;               // 当前阅读的证据
  candidateId?: string;
  by: 'stage' | 'track' | 'sidebar' | 'agent' | 'evidence' | 'doc' | 'candidate' | 'cmdk';  // 谁发起，避免回环
}
```
动作：`setSel(addrs, by)` · `toggleSel(addr, by)` · `setHover(addrs|null, by)` · `focusEvidence(id, by)` · `focusMutation(m, by)` · `clearFocus()`。

### 4.2 双向联动规则

| 触发方 | 3D 舞台 | 轨道 | 证据带 | Mocha 上下文 | 候选 |
| --- | --- | --- | --- | --- | --- |
| **点 3D 残基**（Shift 追加） | 选中环 | 刻度高亮并滚动到可见 | 范围 = 该残基（若证据带非折叠） | 输入框出现「Mocha 看到 · H:54」chip | 对应候选行高亮 |
| **悬停 3D** | — | 对应列虚线 | 对应列表行浅高亮 | — | — |
| **拖选轨道** | `select` + `focus` | 刻度 | 范围 = 区间/区域 | 同 | — |
| **点证据行**（论文/专利/结构） | `focus` 锚点残基；区域则 `highlight` 整区；`inferred` 映射画虚线（轨道） | 针/括号闪烁 | 右栏展开该证据 | 可「@证据」引用 | — |
| **悬停证据行** | `highlight` 锚点 | 针高亮 | — | — | — |
| **点 Mocha 引用角标** | `focus` + 选区替换为锚点 | 同上 | 抬到 peek，展开该证据 | — | — |
| **悬停 Mocha 引用角标** | `highlight` 锚点 | 针高亮 | 引用卡浮出（来源、定位、核验、演示标记） | — | — |
| **点候选行/候选篮** | `focus` 突变位点，位点卡显示 | 候选点高亮 | 候选标签定位 | 选区=该位点 | — |
| **点文档表格行** | `focus` 对应残基（标签列解析） | 同 | — | — | — |
| **点状态栏计数** | — | — | 抬到对应标签并预设筛选 | — | — |
| **⌘K 选择残基/证据** | 同点 3D/点证据 | 同 | 同 | 同 | — |

规则：`by` 相同的写入不回环；`hover` 只影响 `highlight`，不改变 `sel`；`sel` 变化 120ms 防抖后才触发 `focus`（避免连点抖动）；用户手动旋转相机时，Agent 回答的自动 `focus` 暂停并出现「回到此处」按钮（借 notebook "操作即暂停跟随"）。

### 4.3 着色透镜/图层的统一模型

通道（channel）规则：**每个视觉通道至多一层；着色通道互斥单选**。

```ts
export type PaintLensId =
  | 'chain' | 'plddt' | 'region' | 'interface' | 'conservation' | 'ddg' | 'stability'   // 沿用 model.ts LensId
  | 'paper'     // 论文覆盖：每残基被论文锚定的次数色阶（蓝）
  | 'patent'    // 专利覆盖：被权利要求限定的位点（粉）
  | 'fto'       // FTO 热区：对当前候选/选区的风险等级色阶（无绿色，低=中性灰蓝）
  | 'gap';      // 证据空白：无任何证据锚定的残基以虚线灰显示（"没被收录≠没被报道"）

export interface LayerState {
  paint: PaintLensId;                       // 着色（互斥）
  lines: boolean;                           // 互作线（measure 线）通道
  neighbors: { on: boolean; radius: number };  // 5Å 邻域通道
  track: Record<'region'|'paint'|'contact'|'paper'|'patent'|'risk'|'candidate', boolean>; // 轨道行，各占一行
  realOnly: boolean;                        // 仅显示真实证据：影响 paper/patent/fto/gap 透镜与所有计数
  evidenceKinds: EvidenceKind[];            // 证据列表筛选
}
```
一个状态三处渲染：舞台（着色+线）、轨道（对应行）、图例（色阶+通道说明）。3D 上只用 `paint`（overpaint）、`select`、`highlight`、`measure`、`neighbors`；其余视觉（针、括号、风险点）只在 2D 轨道与 HUD 上。**3D 内每帧投影的针/阴影轮廓为二期**。

降噪预算：标签 ≤3；≥4 轨道行时非悬停行降到 70% 不透明度；`F` 聚焦选区（淡出其它）；视图书签保存 `LayerState + 相机 + sel`。

### 4.4 命令面板与 `/` `@`

- **⌘K 面板**（居中 640）：首行永远是「把这句话交给 Mocha」。前缀：`/` 模型与命令（附时间与积分估计）· `@` 残基/区域/证据/文件。选区感知（有选区时模型项显示"将作用于 H:54"）。回车 = 打开参数与算力确认，从不静默运行。
- **Mocha 输入框**与面板**共用同一套解析器** `parseInput()`（`/` `@`），保证专家入口与新手入口同构。
- `@` 目标类型：`@H:54`、`@CDR-H2`、`@表位`、`@链H`、`@候选-3`、`@EV-PAP-001`、`@文件名`。选区自动成为上下文，无需 `@`。
- 动词条（先指后说）：焦点变化时，在位点卡与 Mocha 输入区上方列出 3–4 个带成本的动词，如「核查文献 免费」「核查专利 免费」「提升亲和力 24 积分」「5Å 邻域 免费」。

---

## 5. Agent 行为

### 5.1 保留的流程

自然语言 → 计划卡（可编辑）→ 工具调用（可折叠，显示模型名/参数/来源）→ **算力确认卡**（积分、时长、运行模式）→ 产出（结构着色、表格、文件）→ 建议动作。算力确认卡在 Mocha 带内，不是模态；论文/专利核查检索类工具为**免费**但仍显示为工具调用。

### 5.2 引用语法与 UI

- **文本语法**：回答文本中用 `{{cite:EV-PAP-001,DEMO-EV-PAT-001}}` 放在句末。渲染成引用角标：`S`青 ●、`M`紫 ◆、`P`蓝 ■、`PAT`粉 ⬡、`R`红环+「!」；**颜色+形状+字母三重编码**。演示引用 = 金色虚线边框+斜纹。
- **硬规则**：
  1. 无证据 ID 不得输出文献/专利论断；`{{cite:…}}` 中的 ID 必须存在于账本，否则渲染为红色「无效引用」并使验收失败。
  2. 无来源的句子渲染为点状下划线并标「推断」。
  3. 仅有演示证据支撑的结论必须在句内写明「（演示数据，请勿当作结论）」。
  4. 证据冲突（`supports` 与 `limits` 并存）必须在文中点出。
  5. 检索无结果必须写「未检索到（范围 · 日期）」，不得写"无风险"。
  6. 每条回答保存 `ledger.version`。
- **悬停**：角标浮出引用卡（来源、定位、stance、核验、映射、演示标记），同时 `highlight` 锚点。**点击**：证据带抬到 peek 并定位该证据，3D `focus`。**⌥点击**：钉入候选的"依据"。
- 回答末尾"依据条"：`依据 6 · 真实 3 · 演示 3`，点击展开列表；开启"仅显示真实证据"时重算并改写结论文本（如「真实证据 3 条，未发现专利证据；演示专利已排除」）。

### 5.3 候选与五道闸门

候选篮（Z2）与候选标签（Z5）。每个候选 = 突变 + 5 个闸门点：**亲和**（ΔΔG 阈值）· **稳定**（ΔΔG fold）· **开发**（MMetrics 风险基序）· **文献**（有无与方向）· **专利**（FTO 等级）。点状态：实心=通过、半环=有疑问、红环=不通过、**虚线圈=无数据（永不显示为通过）**。闸门阈值为演示默认值，可在候选标签中编辑。篮容量 6，仅为取舍压力，可配置。演示证据不计入"文献/专利"通过。

### 5.4 脚本场景（`agent/scenes/`，D 负责；每个场景 = 一串 Block + 对舞台/证据带的副作用）

保留 v2 场景：载入示例、预测、MMetrics 自动运行、亲和力扫描、稳定性、邻域、候选表。新增三个（均基于 2FJG 与上述账本）：

**场景 A「核查候选突变的文献与专利风险」**
触发：选区 H:54（或候选篮任一候选）+ 动词「核查文献与专利」，或输入"这个突变有人报道过吗？有专利风险吗？"
步骤：
1. 上下文 chip "Mocha 看到 · H:54 T→M（示例候选）"；
2. 计划（3 步）：检索账本文献 → 求值权利要求覆盖 → 汇总风险与建议；
3. 工具调用 `evidence.search`（免费，参数：范围 H:54、库、日期）→ 返回 `DEMO-EV-PAP-…`；
4. 工具调用 `fto.evaluate`（免费，确定性规则，参数：规则版本、`unverified`）→ `FtoVerdict`；
5. 回答：含 2 句带引用，1 句「未检索到…」，1 句推断，1 句冲突说明；若证据全为演示，句内写「演示数据，请勿当作结论」；
6. 副作用：着色切换为「FTO 热区」，证据带抬到 peek（证据·专利筛选），轨道出现专利括号与论文针，3D `focus` H:54；
7. 建议动作：「改用 A54M（示例绕行）」「加入候选篮」「生成交接摘要」。

**场景 B「总结某区域的已知文献」**
触发：`@CDR-H2 总结已知文献` 或 CDR-H2 区域选中 + 动词「总结文献」。
步骤：检索区域锚点证据 → 按位点聚合 → 输出"该区域已知"：每位点一行（位点·已报道变化·stance·引用），末尾"证据空白"清单（该区域哪些位点无任何证据）；副作用：着色切到「论文覆盖」，空白位点用「证据空白」虚线灰；证据带·证据范围 = CDR-H2。真实证据只有主引用（结构级），回答必须明说"本区域没有真实的位点级文献记录，以下为演示示例"。

**场景 C「生成给 PI/法务的交接摘要」**
触发：候选标签「生成交接摘要」或输入"给 PI 和法务一份交接摘要"。
步骤：汇总（候选 ≤6 + 五道闸门 + 依据 + FTO 与固定免责 + 演示数据清单 + 运行血缘）→ 工具调用 `report.compose`（免费）→ 在证据带「文档」渲染 `HandoffDoc`（目标、候选表、证据附录脚注、风险与免责、演示数据标记、账本版本哈希）；含演示数据时页眉水印「含演示数据，仅供演示」；提供「复制为 Markdown」。Mocha 回答只给 3 行摘要+文件 chip。

### 5.5 Agent 引擎契约（D）

```ts
export type Block =
  | { id: string; t: 'text'; md: string }                         // 含 {{cite:…}}
  | { id: string; t: 'plan'; items: PlanItem[] }
  | { id: string; t: 'tool'; name: string; title: string; args: [string,string][]; status: ToolStatus; cost?: string; logs: string[]; progress: number; source?: string; runId?: string }
  | { id: string; t: 'confirm'; credits: number; eta: string; modelId: string }   // 算力确认卡
  | { id: string; t: 'candidates'; rows: CandidateRow[] }
  | { id: string; t: 'file'; fileId: string; title: string; meta: string }
  | { id: string; t: 'basis'; real: number; demo: number; ids: string[] }          // 依据条
  | { id: string; t: 'suggest'; items: { label: string; cost?: string; prompt: string }[] };

export interface AgentApi {
  messages: Msg[];
  busy: boolean;
  send(text: string, ctx: Focus): void;
  approve(blockId: string): void;  deny(blockId: string): void;
  setMode(m: 'ask'|'auto'|'plan'): void;
}
export function useAgent(deps: AgentDeps): AgentApi;
export function parseInput(text: string): { slash?: string; mentions: Mention[]; rest: string };
```

---

## 6. 视觉系统

### 6.1 沿用的 token（来自 `components/studio/agent.css`，值不变）
`--bg --side --panel --panel-2 --raise --raise-2 --hover --press --line --line-2 --line-3 --text --muted --faint --on-strong --accent --accent-soft --accent-text --accent-line --ok --ok-soft --warn --warn-soft --warn-line --bad --bad-soft --sel --sel-soft --sel-text --strong --strong-hover --grad --res-mix --glass --shadow-pop --shadow-focus --stage --seq-text --r-sm --r-md --r-lg --r-pill --font --mono --ease --dur`。v3 根节点类名 `.v3`，主题属性 `data-theme="dark|light"`（与 `.ag` 同构），**不得引入 `.ag` 选择器**以免与 v2 冲突；E 在 `tokens.css` 中重新声明同名 token。

### 6.2 新增 token

```css
/* 证据种类色（深色值；浅色在 [data-theme=light] 重定义）*/
--ev-struct: #4fd3d0;   /* S 结构事实 圆点 */
--ev-model:  #a58bff;   /* M 模型打分 菱形 */
--ev-paper:  #6aa5ff;   /* P 论文 方块 */
--ev-patent: #ff7fb7;   /* PAT 专利 六边形 */
--ev-risk:   #ff6b6b;   /* R 风险 红环 */
/* origin 三态 */
--origin-real: var(--ok);  --origin-derived: #4fd3d0;  --origin-demo: #e8b64a;
--origin-demo-bg: repeating-linear-gradient(135deg, rgba(232,180,74,.10) 0 4px, transparent 4px 8px);
--origin-demo-line: rgba(232,180,74,.55);
/* FTO 等级（无绿色）*/
--fto-unsearched: var(--faint); --fto-low: #6f8fb5; --fto-medium: var(--warn); --fto-high: var(--bad);
/* 布局 */
--z1-h: 40px; --z7-h: 24px; --rail-w: 52px; --side-w: 212px; --mocha-w: 360px; --track-h: 72px; --dock-h-fold: 36px;
--stage-min-w: 480px; --stage-min-h: 420px; --stage-min-h-read: 300px;
/* 动效 */
--dur-fast: .12s; --dur-panel: .28s; --ease-panel: cubic-bezier(.2,.8,.2,1);
--hatch-patent: repeating-linear-gradient(135deg, rgba(255,127,183,.35) 0 3px, transparent 3px 7px);
```
所有彩色以 `color-mix(in srgb, var(--x) N%, transparent)` 衍生，保证深浅两套。

### 6.3 深浅色
深色为默认（舞台背景 `--stage`）。浅色为暖白（沿用 v2 浅色值），3D 画布背景用 `--stage` 浅色渐变；Mol* 的残基着色在浅色下对比度须验证（B 负责 lens 色阶在两套背景下均可辨）。主题跟随系统，可手动覆盖。

### 6.4 动效原则
- 动效只表达**状态变化与因果**：面板开合（280ms，`--ease-panel`，舞台同步重新取景）、选中（环出现 120ms）、运行脉冲（2s 循环，错峰）、引用高亮（闪烁 1 次 600ms）。
- 禁止装饰性循环动画；`prefers-reduced-motion` 下全部降为淡入淡出，运行脉冲改为静态环。
- 空状态幽灵标本若 viewer 不支持自转，改用 6s 呼吸光晕（不动画 3D）。

### 6.5 空状态与首次进入
- 打开 `/studio/v3`：舞台立即显示幽灵 2FJG（35% 亮度），无遮罩、无引导弹窗；左栏与证据带**不渲染**；Mocha 带显示一句话 + 3 个起手芯片（载入示例 2FJG · 粘贴序列预测结构 · 看看示例里的证据）。
- 点「载入示例 2FJG」（0 积分）：标本交叉淡化 → 实体，侧栏 280ms 展开，MMetrics 自动运行 6s（进度在状态栏），首个位点卡自动弹出（H:Y105 之类的界面热点，演示）。
- 选一个残基：输入框出现「Mocha 看到 · H:54」，tooltip 解释"选区即上下文"（仅首次，一行灰字，非弹窗）。
- 所有提示为一行灰字，不做遮罩式引导。每个空区域一句话说明它会长成什么（空候选篮：「把值得做实验的突变放这里，最多 6 个」）。
- 首次出现的证据带标签条上，「演示数据」图例（三态）一次性展示。

---

## 7. 构建计划

### 7.1 总则
- 路由：`app/studio/v3/page.tsx`（A 独占），导入 `components/studio-v3/v3-app.tsx`；`export const metadata = { title: 'MOS v3 (prototype)', robots: { index: false } }`。
- 目录：`components/studio-v3/`。**只读复用**：`../studio/model.ts`、`../studio/stage.tsx`、`../studio/mmetrics-data.ts`、`../console/molstar-lite.ts`。**不得修改**它们，也不得修改 `components/studio/` 与 `components/console/` 下任何文件。其余需要的东西复制到 v3 目录改造。
- 类名前缀：A `.v3-`（布局）、B `.v3s-`、C `.v3e-`、D `.v3a-`、E `.v3u-`（原语）与 `.v3`（根/token）。避免跨文件选择器冲突。
- **契约先行（阶段 0，前 45 分钟）**：A 提交 `contracts.ts` 与 `store.ts` 骨架；C 提交 `evidence/types.ts`；E 提交 `tokens.css` 与 `ui/` 原语的占位导出。其余人在此之前用本文档的签名自行写本地 mock，之后切换到真实导入。
- 禁止两人同写一个文件。需要新增共享类型时，在 PR 描述里请求文件所有者添加。

### 7.2 五个负责人（文件互不重叠）

#### 负责人 A：外壳布局与全局状态
**独占文件**
- `app/studio/v3/page.tsx`
- `components/studio-v3/v3-app.tsx`（根，组装所有区域，挂载唯一 `<Stage/>`）
- `components/studio-v3/contracts.ts`（共享类型：`Focus`、`LayoutState`、`DockTab` 等）
- `components/studio-v3/store.ts`（焦点总线 + 布局状态 + 项目/结构状态；`useV3()`）
- `components/studio-v3/layout.ts`（尺寸计算：`computeLayout(viewport, state)`，保证 S1 不变量）
- `components/studio-v3/shell/titlebar.tsx`、`shell/statusbar.tsx`、`shell/rail.tsx`、`shell/sidebar.tsx`（含候选篮与文件/任务分组，使用 `evidence` 的 `evaluateFto` 做闸门）
- `components/studio-v3/shell/share-menu.tsx`、`shell/shortcuts.ts`（⌘K/⌘J/⌘B/⌘/ /Tab）
- `components/studio-v3/shell/shell.css`

**导出契约**
```ts
// contracts.ts
export type DockTab = 'evidence' | 'candidates' | 'docs' | 'runs';
export type DockSize = 'fold' | 'peek' | 'read' | 'max';
export interface LayoutState { sidebar: 'open'|'drawer'|'closed'; mocha: 'open'|'drawer'|'closed'; dock: DockSize; track: 'fold'|'normal'|'tall'; immersive: boolean; theme: 'dark'|'light'|'system' }
export interface ComputedLayout { stage: { x:number; y:number; w:number; h:number }; track: {h:number}; dock: {h:number}; mode: 'desktop'|'compact'|'tablet'|'phone'; invariantOk: boolean }
export interface V3Store {
  focus: Focus; layer: LayerState; layout: LayoutState; scheme: SchemeId;
  structure: { loaded: boolean; chains: ChainInfo[]; isDemoSpecimen: boolean };
  candidates: Candidate[];
  setSel(a: Addr[], by: Focus['by']): void; toggleSel(a: Addr, by: Focus['by']): void;
  setHover(a: Addr[] | null, by: Focus['by']): void;
  focusEvidence(id: string, by: Focus['by']): void; focusMutation(m: MutationRef, by: Focus['by']): void; clearFocus(): void;
  setLayer(p: Partial<LayerState>): void;
  openDock(tab: DockTab, size?: DockSize): void;
  setLayout(p: Partial<LayoutState>): void;
  addCandidate(c: Candidate): void; removeCandidate(id: string): void;
}
export function useV3(): V3Store;
export function computeLayout(viewport: {w:number;h:number}, s: LayoutState): ComputedLayout;
```
**依赖**：C 的 `evidence/types.ts`（阶段 0）；E 的 `tokens.css`；B 的 `StageLayer` 与 `Track`；C 的 `Dock`；D 的 `MochaPane` 与 `CommandPalette`。
**验收**：1440×900/1280×800/1024×768/390×844 下 `invariantOk` 恒为真；无论怎样开合面板，页面 DOM 中 `canvas` 数量恒为 1 且从不卸载（用 `document.querySelectorAll('canvas').length` 与 mount 计数断言）；所有快捷键与状态栏计数点击跳转正确；`tsc --noEmit` 无错误。

#### 负责人 B：舞台层、图层/透镜/标注、轨道
**独占文件**
- `components/studio-v3/stage/stage-layer.tsx`（包裹 `../studio/stage` 的 `Stage`，订阅 `store.focus/layer`，计算 `paint`）
- `components/studio-v3/stage/layers.ts`（`PaintLensId` 着色计算，含 `paper/patent/fto/gap`，调用 C 的 `queryEvidence`）
- `components/studio-v3/stage/hud.tsx`（着色 chip、图层弹层、工具列、图例、证据摘要 chip、Mocha 光标胶囊）
- `components/studio-v3/stage/site-card.tsx`（位点卡 + 动词条）
- `components/studio-v3/stage/track.tsx`（轨道，含各通道行、拖选、针与括号）
- `components/studio-v3/stage/ghost.tsx`（空状态幽灵标本徽章与导入卡的**定位容器**；导入卡的内容由 E 提供）
- `components/studio-v3/stage/stage.css`

**导出契约**
```ts
export interface StageLayerProps { onLoaded(chains: ChainInfo[]): void; mochaCursor?: { label: string; addrs: Addr[] } | null; emptySlot?: React.ReactNode }
export const StageLayer: React.ForwardRefExoticComponent<StageLayerProps & React.RefAttributes<StageHandle>>;
export function computePaint(layer: LayerState, focus: Focus, ledger: Ledger, chains: ChainInfo[]): PaintGroup[] | null;
export const PAINT_LENSES: { id: PaintLensId; name: string; hint: string; group: 'structure'|'evidence' }[];
export function Track(props: { height: number }): JSX.Element;
export function Hud(props: { stageRef: React.RefObject<StageHandle> }): JSX.Element;
export function SiteCard(): JSX.Element | null;
```
**依赖**：A 的 `useV3`/`contracts.ts`；C 的 `queryEvidence`/`LEDGER`；E 的原语（CiteChip、OriginMark、Kbd）。
**验收**：着色互斥，切换 `paper/patent/fto/gap` 后 3D 与轨道与图例一致；仅真实证据开关使演示残基着色消失；悬停轨道/证据行 3D 即时高亮；舞台缩放（面板开合）后 280ms 内重新取景；单画布；无每帧投影代码；浅色下透镜可辨。

#### 负责人 C：证据层模块（数据 + UI，含论文与专利）
**独占文件**
- `components/studio-v3/evidence/types.ts`（§3.2）
- `components/studio-v3/evidence/data.ts`（账本：2FJG 主引用 + 占位条目 + 由 `../studio/mmetrics-data` 转换的结构/打分/风险）
- `components/studio-v3/evidence/query.ts`（§3.7，含 `evaluateFto`、`assertDemoRules`）
- `components/studio-v3/evidence/dock.tsx`（证据带容器与标签条）
- `components/studio-v3/evidence/tab-evidence.tsx`（范围条、列表、阅读器、平衡条、论文已报道卡、专利/FTO 卡）
- `components/studio-v3/evidence/tab-archive.tsx`（MMetrics 档案：复制并改造 `../studio/mmetrics.tsx` 的内容，全结构范围）
- `components/studio-v3/evidence/tab-candidates.tsx`（候选表 + 五道闸门）
- `components/studio-v3/evidence/tab-docs.tsx`（CSV/报告阅读器 + `HandoffDoc`）
- `components/studio-v3/evidence/tab-runs.tsx`（运行卡与血缘）
- `components/studio-v3/evidence/evidence.css`

**导出契约**
```ts
export const Dock: (props: { height: number }) => JSX.Element;               // 读取 store.layout.dock / tab
export function HandoffDoc(props: { data: HandoffData }): JSX.Element;
export interface HandoffData { goal: string; candidates: Candidate[]; ledgerVersion: string; demoItems: string[]; fto: FtoVerdict[] }
export function gatesOf(c: Candidate, ledger?: Ledger, opts?: { realOnly: boolean }): Gate[];
export type Gate = { id: 'affinity'|'stability'|'liability'|'literature'|'patent'; state: 'pass'|'doubt'|'fail'|'nodata'; label: string };
// 以及 §3.7 全部函数
```
**依赖**：A 的 `useV3`；E 的原语；D 提供运行记录数据（`useRuns()` 由 D 导出，C 只读订阅）。
**验收**：`assertDemoRules` 通过；LEDGER 中仅 `PAP-FUH-2006`/`EV-STR-001` 为真实/元数据，其余全部 DEMO；无任何真实专利号格式、真实公司名、杜撰真实论文结论；`evaluateFto` 对单元样例（H:54 ∈ {F,Y,W}）输出确定且与等级映射一致，且"低"文案为「未见覆盖」；「仅显示真实证据」使所有计数和闸门重算，专利闸门因无真实数据显示虚线圈；证据平衡条含"空白"；每处 FTO 呈现带固定免责。

#### 负责人 D：Agent 引擎、场景、对话与指令面
**独占文件**
- `components/studio-v3/agent/engine.ts`（`useAgent`、路由、流式、模式）
- `components/studio-v3/agent/parse.ts`（`parseInput`、`{{cite:}}` 解析）
- `components/studio-v3/agent/scenes/base.ts`（沿用 v2 场景，复制改造）
- `components/studio-v3/agent/scenes/fto-check.ts`、`scenes/region-literature.ts`、`scenes/handoff.ts`
- `components/studio-v3/agent/runs.ts`（`useRuns`、`RunRecord`，血缘与复现）
- `components/studio-v3/mocha/mocha-pane.tsx`、`mocha/transcript.tsx`、`mocha/composer.tsx`（上下文 chip、`/` `@` 补全、动词条）、`mocha/confirm-card.tsx`、`mocha/cite.tsx`（引用渲染，使用 E 的 `CiteChip`）
- `components/studio-v3/cmdk/command-palette.tsx`
- `components/studio-v3/agent/agent.css`

**导出契约**
```ts
export const MochaPane: () => JSX.Element;
export const CommandPalette: (props: { open: boolean; onClose(): void }) => JSX.Element;
export function useAgent(): AgentApi;               // §5.5
export function useRuns(): { runs: RunRecord[]; byId(id: string): RunRecord | undefined };
export interface RunRecord { id: string; model: string; modelVersion: string; args: [string,string][]; inputHash: string; status: ToolStatus; credits: number; logs: string[]; startedAt: string; outputs: { fileId: string; title: string }[]; parentRunId?: string }
export function parseInput(text: string): { slash?: string; mentions: Mention[]; rest: string };
export function renderCitations(md: string): React.ReactNode;     // 未知 id → 红色无效引用
```
**依赖**：A 的 `useV3`；C 的 `getEvidence`/`evaluateFto`/`queryEvidence`/`ledgerVersion`/`HandoffDoc`；E 的原语。
**验收**：三个新场景完整跑通且文本中的每个引用 ID 都存在于账本；仅演示证据的结论带「请勿当作结论」；无来源句子渲染为"推断"；"检索无结果"使用「未检索到（范围·日期）」；算力确认卡在运行前出现且不静默运行；`/` `@` 在 Mocha 输入框与 ⌘K 行为一致；选区变化立即更新「Mocha 看到」chip；打字比计划流式；`ledger.version` 随回答保存。

#### 负责人 E：视觉系统、CSS、空状态、动效、引导
**独占文件**
- `components/studio-v3/tokens.css`（§6.1/6.2 全部 token，深浅两套）
- `components/studio-v3/base.css`（reset、排版、滚动条、焦点环、`prefers-reduced-motion`）
- `components/studio-v3/motion.css`
- `components/studio-v3/ui/*.tsx`：`chip.tsx`、`badge.tsx`、`origin-mark.tsx`、`cite-chip.tsx`、`kbd.tsx`、`segmented.tsx`、`gate-dots.tsx`、`balance-bar.tsx`、`disclaimer.tsx`（固定免责文案）、`tooltip.tsx`、`ui.css`
- `components/studio-v3/onboarding/empty-state.tsx`（导入卡：粘贴序列/PDB ID/上传/载入示例；Mocha 空状态起手芯片）、`onboarding/hints.tsx`（一行灰字提示与首次图例）、`onboarding/onboarding.css`
- `components/studio-v3/theme.tsx`（`ThemeProvider`、`data-theme` 管理）

**导出契约**
```ts
export function CiteChip(props: { badge: 'S'|'M'|'P'|'PAT'|'R'; label: string; origin: Origin; unverified?: boolean; onClick?(): void; onHover?(on: boolean): void }): JSX.Element;
export function OriginMark(props: { origin: Origin; text?: boolean }): JSX.Element;
export function GateDots(props: { gates: { id: string; state: 'pass'|'doubt'|'fail'|'nodata'; label: string }[] }): JSX.Element;
export function BalanceBar(props: { supports: number; limits: number; gaps: number }): JSX.Element;
export function Disclaimer(props: { kind: 'fto'|'demo'|'region-vs-claim'|'absence'; scope?: string }): JSX.Element;
export function Segmented<T extends string>(props: { value: T; options: { id: T; label: string }[]; onChange(v: T): void }): JSX.Element;
export function Kbd(props: { children: React.ReactNode }): JSX.Element;
export function EmptyStageCard(props: { onLoadSample(): void; onImport(text: string): void }): JSX.Element;
export function StarterChips(props: { onPick(prompt: string): void }): JSX.Element;
export function ThemeProvider(props: { children: React.ReactNode }): JSX.Element;
```
**依赖**：无（其他人依赖 E）。阶段 0 须最先交付占位导出。
**验收**：深浅色全部原语对比度 ≥ 4.5:1（正文）/ 3:1（图形）；三态 origin 在灰度截图下仍可辨；`prefers-reduced-motion` 下无循环动画；空状态首屏无任何表单/空列表，导入卡不遮挡蛋白中心；CSS 中不出现 v2 的 `.ag` 选择器；所有 token 名与 §6 一致。

### 7.3 文件所有权总表（互不重叠）

| 路径 | 负责人 |
| --- | --- |
| `app/studio/v3/page.tsx`、`components/studio-v3/{v3-app.tsx,contracts.ts,store.ts,layout.ts}`、`shell/*` | A |
| `components/studio-v3/stage/*` | B |
| `components/studio-v3/evidence/*` | C |
| `components/studio-v3/{agent,mocha,cmdk}/*` | D |
| `components/studio-v3/{tokens.css,base.css,motion.css,theme.tsx}`、`ui/*`、`onboarding/*` | E |

### 7.4 集成顺序
1. 阶段 0（≈45 分钟）：契约与占位。2. 阶段 1：A 搭壳 + B 舞台 + E 原语 + C 账本/查询（并行）。3. 阶段 2：C 的 UI 标签、D 的引擎与场景、B 的轨道与位点卡。4. 阶段 3：联调交互矩阵与三条旅程，E 打磨动效与空状态。5. 阶段 4：验收脚本逐条通过。

---

## 8. 验收脚本与 open decisions

### 8.1 通用检查（浏览器逐条）
1. 访问 `/studio/v3`：首屏无白屏；`document.querySelectorAll('canvas')` 中 Mol* 画布恰为 1 个；约 3 秒内幽灵 2FJG 可见；左栏与证据带不存在；Mocha 带有 3 个起手芯片。
2. 空状态：拖动旋转幽灵标本可交互；点选残基不触发计算；导入卡不遮挡蛋白中心；徽章写「示例结构 · 不属于你的项目」。
3. 点「载入示例 2FJG」：侧栏展开；状态栏出现 MMetrics 进度；位点卡弹出。
4. 开合侧栏/Mocha/证据带（⌘B、⌘/、⌘J）：画布始终可见，280ms 内重新取景，净空 ≥ 480×420（max 态 ≥ 480×300）。
5. 阅读态：打开「文档」→ 悬停表格行，3D 对应残基发光；点击行，3D 聚焦；舞台未被替换。
6. 着色：切换 chain/region/ddg/paper/patent/fto/gap，3D、轨道、图例一致；开启「仅显示真实证据」，演示相关着色与计数消失，状态栏「演示数据·N项」变化。
7. 对比：触发 Superimpose（演示差异场），同画布叠合，卡片带「演示」标记。
8. 窗口 1280×800、1024×768、390×844：布局按 §2.4 降级；窄屏舞台吸顶；点引用只在顶部舞台高亮。
9. 深浅色切换：所有区域无破版；三态 origin 可辨。
10. `assertDemoRules()` 通过；搜索账本无真实专利号格式、无真实公司名；`PAP-FUH-2006` 元数据与 PMID/DOI 一致。

### 8.2 旅程 1：30 秒内发起第一次计算（新用户）
1. 打开页面 → 点「粘贴序列预测结构」或「载入示例」；2. 看到链识别与计划；3. 算力确认卡出现，点确认；4. 状态栏进度开始，舞台出现扫描脉冲。**通过线：从打开页面到确认运行 ≤ 30 秒，全程未离开舞台。**

### 8.3 旅程 2：证据追溯（选一个残基 → 看到论文与专利）
1. 在 3D 点选 H:54 → 位点卡与 Mocha chip 出现；2. 状态栏/位点卡点「论文1 · 专利1」→ 证据带抬到 peek，范围 = H:54；3. 点专利行 → 右栏显示 `DEMO-PAT-001` 的权利要求与 FTO 卡，含固定免责，轨道出现粉色括号；4. 点论文行 → 阅读器定位，主引用 `PAP-FUH-2006` 显示「真实·仅元数据核验」，其余为「演示」；5. 向 Mocha 问"谁报道过这里？" → 回答含引用角标，悬停高亮 3D，点击定位证据；回答末尾「依据 N · 真实 x · 演示 y」。**通过线：≤ 2 次点击找到证据；引用 ID 100% 存在。**

### 8.4 旅程 3：从候选到交接
1. 选中 CDR-H2 → 动词「提升亲和力」→ 确认算力 → 候选表出现，加入候选篮；2. 对候选运行场景 A（核查文献与专利）→ 五道闸门更新，专利闸门为虚线圈或疑问；3. 场景 B 对 `@CDR-H2` 总结文献，出现"证据空白"清单；4. 场景 C 生成交接摘要 → 证据带「文档」渲染摘要，含演示水印、免责、演示数据清单、账本版本哈希；5. 开启「仅显示真实证据」后重生成：摘要重算且不含演示结论。**通过线：交接摘要可复制为 Markdown，所有演示行带 `DEMO` 标。**

### 8.5 Open decisions（需要你拍板，已给默认）
1. **候选篮容量与闸门阈值**：默认 6 席，闸门阈值为演示默认值且可编辑；若你希望完全去掉"名额"概念，则改为不限量、仅保留闸门。
2. **并排对比**：默认只做同画布叠合；是否值得为并排投入第二个 Mol* 实例（二期）？默认：不做。
3. **证据带默认折叠**：默认折叠（舞台占 46%）；若你更希望首屏就看到证据，可默认 peek（舞台 38%）。默认：折叠。
4. **术语**：「位点卡 / 着色 / 图层 / 证据带」是否可接受？默认：采用；可只换词不改结构。
