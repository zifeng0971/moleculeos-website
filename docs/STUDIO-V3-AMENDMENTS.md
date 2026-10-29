# MOS v3 规格修订（评审后）

> **本文件的约束优先于 `STUDIO-V3-SPEC.md` 正文。** 正文与本文冲突时，以本文为准。
> 来源：覆盖度审查者与可实现性审查者对规格的 31 条缺口。此处只写决定，不写讨论。
> 共享骨架（`contracts.ts`、`store.ts`、`catalog.ts`、`evidence/types.ts`）由编排者落地，**五位负责人均不得修改**；需要扩展时见 §A.3。

---

## A. 共享状态与契约

**A.1 单一状态容器。** 全部跨区域状态在 `components/studio-v3/store.ts` 的模块级单例里（已实现，见文件）：焦点、悬停、图层、布局、证据带状态（`dock`）、候选篮、打分结果（`scores`）、文件（`files`）、运行（`runs`）、通知（`notices`）、Mocha 会话（`agent`）、Mocha 视线光标（`mochaCursor`）、舞台句柄（`stage`）、叠合差异（`diff`）。D 的引擎只**写**这些切片，A/B/C 只**读**。**没有 `useAgent()` / `useRuns()` 这类各自持状态的 hook**：运行记录读 `useV3(s => s.runs)`，会话读 `useV3(s => s.agent)`，引擎入口是 `engine.send(text)` 等普通函数（D 导出，模块级单例，不依赖 React）。

**A.2 `useV3(selector)`。** 必须带选择器：`const sel = useV3(s => s.focus.sel)`。不带选择器的写法不存在。悬停是 `s.hover`，只有显式选择它的组件才会随悬停重渲染；Mocha 带、证据带、侧栏**不得**选择 `s.hover`。`by === 'stage'` 的悬停不回写 3D 高亮（Mol* 自带）。

**A.3 扩展规则。** 需要新字段/新类型时，在**自己模块内**定义局部类型；若必须进入 store，用 `store.ext`（`Record<string, unknown>` 切片，`setExt(key, value)` / `useV3(s => s.ext[key])`）。Block 联合里有一个逃生口 `{ t: 'ext'; kind: string; data: unknown }`。不得改动 `contracts.ts`、`store.ts`、`catalog.ts`、`evidence/types.ts`。

**A.4 导出入口（barrel）。** 各模块只通过以下入口被引用，入口文件归各自负责人：
`./stage`（B：`StageLayer, Hud, SiteCard, Track, SuperimposePanel, computePaint, PAINT_LENSES`）·
`./evidence`（C：`LEDGER, queryEvidence, balanceOf, evaluateFto, demoCount, ledgerVersion, getEvidence, getPaper, getPatent, assertDemoRules, citationOf, gatesOf, Dock, HandoffDoc, buildHandoff`）·
`./agent`（D：`engine, parseInput, renderCitations, MochaPane, CommandPalette`，另见 §A.1）·
`./ui`（E：全部原语）·
`./onboarding`（E：`EmptyStageCard, StarterChips, Hints`）·
`./theme`（E：`ThemeProvider, useTheme`）。
编排者已为所有入口写了**可编译的占位实现**；负责人**整文件替换**自己的占位，保持导出名与签名不变。

**A.5 CSS。** 根节点 `.v3`，主题属性 `data-theme`，**只由 E 的 `ThemeProvider` 持有与写入**，A 只读。A 的 `v3-app.tsx` 在文件顶部按固定顺序 import 全部 CSS：`tokens.css → base.css → motion.css → ui/ui.css → shell/shell.css → stage/stage.css → evidence/evidence.css → agent/agent.css → onboarding/onboarding.css`。类名前缀：A `v3-`，B `v3s-`，C `v3e-`，D `v3a-`，E `v3u-`。全局 `@keyframes` 一律 `v3-` 前缀，**不复用** `ag-spin`。B 的 `stage.css` 必须显式重声明 `.v3 .st-stage`、`.v3 .st-stage canvas`（absolute; inset 0; 100%×100%）、`.v3 .st-stage-msg`、`.v3 .st-spin`（v2 的这些规则挂在 `.ag` 下，v3 里不生效，不补则画布高度为 0）。`.ag` 选择器不得出现在 v3 中。除 Mol* 外**禁止使用 `<canvas>`**，轨道与图例用 SVG/DOM。

**A.6 快捷键。** ⌘K 命令面板 · ⌘B 侧栏 · ⌘/ Mocha 带 · ⌘J 证据带折叠/展开（可能被浏览器占用，必须同时提供按钮）· ⌘. 沉浸模式（取代 Tab；Tab 保持浏览器默认）· Esc 折叠证据带/清选区。

---

## B. 布局与"舞台常驻"

**B.1 不变量表（取代正文 S1 与 §2.4 里互相冲突的数字）。**

| 模式 | 视口宽 | 舞台净空不变量 | 说明 |
| --- | --- | --- | --- |
| desktop | ≥1280 | 常态 ≥480×420；证据带 read/max 时 ≥480×300 | `invariantOk` 必须恒为真 |
| compact | 1100–1279 | 同上；Mocha 带为**抽屉**，打开时不覆盖舞台——对舞台容器做 CSS 收缩（画布本身变窄，再 refit），**不依赖 viewOffset** | `invariantOk` 恒为真 |
| tablet | 760–1099 | 舞台吸顶 ≥42vh；轨道高 56 | 只要求画布可见且 ≥42vh |
| phone | <760 | 舞台吸顶 ≥38vh（面板 peek 25vh / half 50vh 时舞台 ≥30vh）；**取消 full 档**，面板最高 half | 只要求画布可见且 ≥30vh |

沉浸模式（⌘.）是唯一允许舞台 100% 占屏的状态。`computeLayout` 对 desktop/compact 返回 `invariantOk`，对 tablet/phone 返回 `canvasVisible`（见 contracts）。验收只对 desktop/compact 要求 `invariantOk`。

**B.2 永不卸载（实现约束）。** `<StageLayer/>` 在 `v3-app.tsx` React 树中的位置**固定**；条件区域一律用 `{cond && <X/>}` 保持兄弟占位；断点与空状态只改 CSS grid 区域与 `data-*` 属性，**不换父节点**。页面入口用 `dynamic(() => import('...v3-app'), { ssr: false })`，避免 SSR 首帧 `window` 不一致。Stage 的 `useEffect` 里已有挂载逻辑；B 在 `StageLayer` 内加挂载计数 `window.__v3StageMounts`（仅开发期），验收断言其恒为 1。

**B.3 面板开合 → 取景。** 画布尺寸**直接切换（snap）**，不对画布做尺寸过渡；只有面板内容用 `transform/opacity` 过渡。resize 结束后防抖 120ms：仅当画布宽高比相对上次取景变化 >15% 且用户没有手动动过相机（`store.cameraPaused === false`）时才取景：有选区 `focus(sel)`，否则 `reset()`。取代正文 S3：取景在尺寸稳定后 **≤500ms** 内完成。

**B.4 阅读态。** 文档只在证据带读，永不替换舞台（S2 不变）。证据带 read 高度 = `min(340, bodyH − 轨道 − 舞台下限)`，由 `layout.ts` 计算；max 态在 1440×900 下为 464，但 desktop 的 ≥480×300 必须成立，否则自动降级为 read。

**B.5 对比（Superimpose）。** 引擎只有单结构，**不做真实叠合**。流程仍要完整（手册要求）：工具列「对比」打开**对比面板**（非模态弹出，B 实现 `SuperimposePanel`）：蛋白列表勾选（原型里有 2 个：`2FJG` 与 `预测模型 model_1（演示副本）`）、Fixed/Moving 标签切换（单击切换，同组仅一个 Fixed）、逐蛋白选链、Confirm。结果写入 `store.diff`（演示差异场：RMSD、按链位移、按残基位移），在**同一画布**用「位移」着色透镜呈现，轨道多一行「位移」，证据带·证据出现差异卡；所有数值标「演示」。空状态的幽灵标本只用外层 CSS `opacity/filter`，并接受选中环同样变淡。

**B.6 着色性能。** `computePaint` 必须 `useMemo`，**输出 ≤8 个分组**（连续数值量化到 ≤5 档 + 底色 + 少量标记）。依赖选区的透镜（paper/patent/fto）对选区做 150ms 防抖。`StageLayer` 只把**最新**的 paint 传给 `Stage`（`Stage` 内部已串行排队，防抖保证队列不积压）。扫描脉冲用 DOM/CSS 叠层或**最多 3 步** paint，不逐帧 paint。选区 >60 个残基时，不调用逐残基 `select`，改为只做 `highlight` + 轨道范围条。

**B.7 3D 里能画什么。** 只有 `paint / select / highlight / measure / neighbors`。删除正文 §3.3「3D 上画虚线圈/虚线针」。`inferred` 映射的区分改为：轨道针用虚线描边，位点卡与证据行标「推断映射」，3D 上用低饱和度。新增通道「证据叠加」：用 `highlight` 的第二种颜色同时标出论文/专利锚点，使其与着色透镜并存。**突变联动是残基级的**：位点卡里并排列出 `野生型 → 突变体`，邻域冲突/互作差异标「演示」。

**B.8 轨道。** 一次只显示**一条链**（链标签切换），每残基 ≥3px，超宽时横向滚动 + 顶部总览缩略条。72px 高度合并为「序列 + 复合热度带 + 针/括号」；拖到 160 展开各行。

---

## C. 证据层与"演示数据"边界

**C.1 来源映射表（取代正文 §3.6 冲突处）。**

| 内容 | origin | kind |
| --- | --- | --- |
| 2FJG 分辨率 2.80 Å、主引用元数据 | `real` | `structure` / `paper` |
| 由 cif 坐标直接算出的接触、Kabat CDR 边界、表位、可变区序列上的化学风险基序扫描 | `derived` | `structure` / `risk` |
| 同源条目与相似度、保守性、ΔΔG、稳定性、pLDDT、非 Kabat 的 CDR 方案、一切模型打分 | `demo` | `model` |
| 论文（除主引用）、专利、已报道发现、权利要求 | `demo` | `paper` / `patent` |

`DEMO-` 前缀与标题「示例：」**只强制用于论文、专利、ReportedFinding**；`model` 类证据只需 `origin:'demo'` 与视觉标记。**所有打分、保守性、风险一律不得进入「真实」计数**。额外加 `assertRealWhitelist()`：`origin:'real'` 只能来自白名单 ID（`EV-STR-001`、`PAP-FUH-2006`、`EV-PAP-001`）。

**C.2 取消生产构建抛错。** 删除 `assertNoDemoInProd()`。原型整体就是演示数据，`next build` 的生产环境必须正常。改为：导出与交接摘要路径上，演示行**始终**带 `DEMO` 列与水印；`assertDemoRules` 与 `assertRealWhitelist` 只在开发期（`process.env.NODE_ENV !== 'production'`）运行并 `console.error`，**不抛错**。

**C.3 主引用字段取自 cif。** 标题、作者、期刊、卷页、年、PMID、DOI 直接来自 `public/demo/2fjg.cif` 的 `_citation.*` 与 `_citation_author.*`：
标题「Structure-function studies of two synthetic anti-vascular endothelial growth factor Fabs and comparison with the Avastin Fab.」；作者 Fuh G., Wu P., Liang W.C., Ultsch M., Lee C.V., Moffat B., Wiesmann C.；J Biol Chem 2006;281:6625–6631；PMID 16373345；DOI 10.1074/jbc.M507783200。**不依赖网络。**

**C.4 演示专利的防误读。** 演示专利的权利要求限定在真实残基上（便于联动），为避免被误读成 2FJG 的真实 IP：每张权利要求卡带显眼的斜纹水印「虚构权利要求 · 仅供演示」；权利人写「示例权利人 A」；检索范围写「示例库 · 20XX-XX-XX」。**H:54 是 Ala（A）**，所有示例用 `A54F / A54Y / A54W / A54M`，示例权利要求 `H:54 ∈ {F,Y,W}`，绕行建议 `A54M`。`focusMutation / addCandidate` 校验 `from === 结构中该位点的残基`，不一致拒绝并 `console.warn`。其他位点（已核对）：H:31 Asp、H:33 Trp、H:53 Pro、H:101 Phe、H:105 Tyr、H:107 Met。

**C.5 额外预留。** `EvidenceKind` 增加 `'lab'`（私有实验数据，如 SPR；`origin:'real'`、`verification:'none'`，继承项目权限）——原型不放数据，仅在类型、筛选、导出里预留。Mocha 回答保存 `ledgerVersion`；打开旧回答时版本不一致，回答下方显示「证据已更新，查看变化」。证据带出现「冲突」徽标：同一锚点同时存在 `supports` 与 `limits`，或论文与专利方向相反。专利条目显示法律状态、数据库版本的陈旧提示。

**C.6 MMetrics 复用。** C **直接只读复用** `../studio/mmetrics` 的 `MMetricsPanel` 与 `MMetricsSummary` 以及 `mmetrics.css`，只包一层适配器接 store（`onSelect → setSel(…,'evidence')`，`onHover → setHover(…,'evidence')`，`onOpenTable → store.addFile + openDock('docs')`）。不做复制改造，不改 `mmx-` 前缀。v3 与 v2 不同路由，样式不会同时生效。

---

## D. 任务、模型表单与其余缺口

**D.1 模型任务的参数表单。** 10 个模型 + SeqSim 的目录与参数 schema 在 `catalog.ts`（已写）。入口：侧栏「模型」目录 · ⌘K `/` · 位点卡动词条 · Mocha 输入框 `/`。入口只负责把 `modelId` 与当前选区交给 `engine.openForm(modelId)`。D 在 Mocha 带内渲染 `{t:'form'}` 块（**任务配置卡**）：按 schema 渲染，选区/`@`/当前结构自动填入，必填校验、默认值、积分与时长估计；提交后出现 `{t:'confirm'}` 算力确认卡，再运行。非自然语言用户可完全靠表单完成配置。

**D.2 任务/运行/通知的主从关系。** `runs`（store）是**唯一**清单。侧栏「任务」展示全部（含两条演示用的"其它项目"任务），负责状态与取消/重试；证据带「运行」标签展示**当前项目**运行的详情（参数、血缘、复现）；状态栏只显示进度计数；通知是任务事件在 `notices` 里的投影，点击跳到对应运行并聚焦产出。状态：`queued / running / done / failed / canceled`；失败卡给出「重试」，取消在运行中可用。

**D.3 结构对齐的手册流程** 见 B.5。

**D.4 补全真实功能的归属（低优先级但必须有位置）。**
- 缩放/复位：工具列 + 滚轮；
- 残基组：侧栏「结构 → 残基组」节点，可编辑名称、颜色、备注，与轨道「区域」行同步；**氨基酸注释**即带备注的残基组；
- 5Å 邻域：工具列/位点卡触发，结果以表格进入证据带「文档」，行点击聚焦；
- 互作类型筛选：图层弹层「互作线」子项；
- 序列区高度拖拽：轨道可拖到 160；
- 项目角色：Owner / Editor / Viewer（与手册一致，分享弹层说明各自权限），UI 仅展示。

**D.5 回访与账号。** 标题栏面包屑下拉列出 3 个演示项目（只切换名称与目标，不换结构）；有候选/运行记录时，Mocha 带顶部出现一行恢复卡「上次：候选 N 个 · 运行 M 次 · 证据账本 vN」。账号菜单展示余额、本月用量与「购买积分」占位（仅状态展示，不做支付）。

---

## E. 构建流程

1. **编排者先落地骨架**（`contracts.ts`、`store.ts`、`catalog.ts`、`evidence/types.ts`，以及所有 barrel 的可编译占位实现）并通过 `tsc`。五人从同一个状态起步，**不存在"阶段 0 契约窗口"**。
2. 五位负责人并行，各自**整文件替换**自己的文件，不改别人的文件。
3. 每人完成后自检：`npx tsc --noEmit -p .` 在 `components/studio-v3` 无错误、`npx eslint components/studio-v3/<自己的目录>` 干净、不引入 `.ag` 选择器、无 `<canvas>`。
4. 测试用 `scripts/test-v3.ts`（tsx 脚本，C 负责）：`evaluateFto` 样例、`assertDemoRules`、`assertRealWhitelist`、`demoCount`。
5. 编排者合并后在浏览器做全流程验收与对抗式审查。
