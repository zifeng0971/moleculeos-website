# 演示组件复用记录

## Agent

### 2026-09-21 Mocha component upgrade

来源：`tubingqing-oss/Mocha-Component-Upgrade-Testing`，提交
`1d40f28ee8874009c98936da550019d24c93d9f9`。复用范围仅为欢迎态卡片与
消息气泡的展示契约，并改造成外部 props 驱动；Next.js 适配入口位于
`components/hero/AgentDemo.tsx`，主体位于 `components/hero/mocha-upgrade/`。
旧实现保存在 `components/hero/legacy/AgentDemo.tsx`。

未搬入对方仓库的 React 19/Vite 启动层、HEWL 示例数据、全局 CSS、外部链接或
播放编排。本站继续使用 React 18、Next 14、现有 `demo/tasks.config.js`、双语
消息、压缩播放状态与 `AgentStructure`，无新增依赖、API、WebSocket、持久化或
遥测。检查时源仓库未提供 LICENSE 文件，因此只记录来源，不推断许可证。

来源：MoleculesOS / Mocha V3，提交 `1814a755abacc13f35a78d785defcf7d09a0c473`。

核验文件：`web/src/features/tool/components/display-content.tsx`。`AgentTaskList.tsx` 改编其中 TodoContent 的完成／执行中／待处理图标与 props 驱动列表渲染。修改：仅保留三种状态，替换为官网样式、语义化有序列表与本地任务脚本，未引入服务调用、store、搜索渲染或远程图片。

该分支的 Web UI 是 Kimi Code CLI 风格，并非截图中的完整 MOS 工作台；AgentDemo 的任务入口、消息布局、执行行、结果与播放器为按截图新实现的展示层，不能称为完整 MOS 前端移植。

脚本时间点与工具显示名：`lib/agent-demo.ts`；中英文文案：`messages/zh.json` 与 `messages/en.json` 的 `agentDemo`。Prepare* 名称只是演示标签，不声明真实平台工具存在。全部产出为准备／核对清单，不包含模型评分或实验结论。

## MMetrics

核验参考：Structure Prediction Frontend，提交 `393bb9350cb17b1f1bc5198e86902f11b2f540a7`，`src/components/results/molstar-viewer.tsx`。

参考实现验证了 auth_asym_id / auth_seq_id 选区方式；官网沿用已有 `molstar-selection.ts`、`molstar-controller.ts`、序列条与面板，不复制原项目的 logger、token mapping、light SCSS、默认远程结构加载或 B-factor→pLDDT 逻辑，也没有整组件移植。

结构来自已有同源 `/demo/5xh3.cif`。互作显示由 Mol* 本地计算；二维网络仍为示意；面板现有注释与百分比为此前预置数据，未经本次独立科学核验。新增提示明确其非实验验证。

## 加载与边界

Agent 输入只写入当前页面内存中的对话记录，并立即返回固定的 MOS 平台引导文案；不接服务请求、WebSocket 或模型。欢迎页自由输入创建独立的对话任务，不启动预置流程。3D 只 fetch 同源静态 CIF，且仅在预置流程结束后展示并加载。离屏／隐藏标签页暂停，结束停留；减少动效模式按步骤手动推进。

MMetrics 桌面进入视口自动加载，移动端和减少动效模式点击加载；未激活不下载 CIF。失败时保留静态预览与重试。外链仅由用户主动点击打开。

## Agent 复合物工作区

### 2026-09-20 产品视觉对齐

参考用户提供的真实 MOS 三张截图和 `桌面/杂项/MMFold2.0/frontend/src/ResultPage.jsx` 的残基/注释展示。该目录 HEAD 为 `39bf6f9c0fdd3f8e977a7e7230eaf49f9717a385`，实际参考文件 SHA-256 为 `273fb33dd0cfb67c0a36e97377825a736bb94f7f885f42cb0da364a694a3df11`（不假设工作区与提交完全一致）。ResultPage 的注释及互作组件依赖其自有分析数据、Liability 和编号模型，不适合直接移植；本轮未复制源代码、资产或许可证文本，采用本站原有数据/回调重写展示层，无新依赖。

`product-surface.css` 将产品配色、密度与营销页隔离；`AgentSequence.tsx` 使用已校验 2BDN 数据并复用原选区/悬停回调。Mol* 控制器、结构文件、链映射与分析计算不变。原有第三方许可证声明保持不变。

### MMFold2.0 资源审查（2026-09-19）

检查用户提供的桌面 `MMFold2.0.zip`：`frontend/src/MolstarViewer.jsx`、`ResultPage.jsx`、`index.css`。包含独立 Mol* 包装、互作分析与结构结果界面，但不是 Mocha 消息/工具组件。查看器默认 `colorMode='plddt'`，不能直接用于本站实验结构。本轮未复制该包代码或引入依赖，继续复用本站已有查看器；工作台视觉依据用户提供的真实 MOS 截图调整。互作分析与 PAE 组件可供后续专门审查，不将其推断值或示例数据移入官网。

`AgentStructure.tsx` 复用本站 `molstar-controller.ts` 与 `molstar-selection.ts`，未新增产品服务或移植第三方应用。控制器增加可选静态路径、链配色与自动相机配置，未传配置时保持原 5XH3 路径、配色和相机。Mol* 版本仍为 4.9.0（MIT），许可证声明继续保留。

2BDN：RCSB 原始 mmCIF，来源 https://files.rcsb.org/download/2BDN.cif ，条目 https://www.rcsb.org/structure/2BDN ，修订 1.5（2024-11-20）。SHA-256：`543e4349682062b6aedd4e93010e6710b3a9bda330f6330f16edc523c33b80fd`。构建脚本按校验值锁定，来源更新须人工核验。label A/B/C → author A/L/H，抗原／抗体轻链／抗体重链，映射由原文件 ATOM 记录验证。

序列列表仅显示实际建模的 CA 残基，保留 author 编号；缺失残基不补全。静态 fallback 为原始 CA 坐标的二维投影，不是模型预测。四项任务共享该公开参考复合物，不宣称产生新的结构、突变、亲和力或实验结果。
