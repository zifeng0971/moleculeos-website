# 04 可开发性补充素材：DevelopabilityLiabilities

已通过用户 Chrome 登录的 GitLab 下载完整 main 源码 ZIP，保留原包与展开目录。

- 项目：`https://code.moleculemind.com/xinxu/developabilityliabilities`（Internal，ID 503）。
- 下载时观察到的 main commit：`c3e7fe6fd067390af479479ccfb00d30a0b9c8ac`。
- 完整源码：`sources/developabilityliabilities/developabilityliabilities-main/`。
- 原始 ZIP：`sources/developabilityliabilities/developabilityliabilities-main.zip`，CRC 已通过。
- 来源和归档哈希：`sources/developabilityliabilities/source.json`。
- 机器可读规则：`sources/developabilityliabilities/rules.json`。
- 本地 KN035 模式匹配：`04-developability/raw/supplementary-liability-matches.json` 与 `.csv`。

## 可供前端复用的材料

共有 38 条规则，分为 12 组：脱酰胺、氧化、异构化、糖基化、游离巯基、细胞粘附、裂解、蛋白水解、环化、羟基化、赖氨酸糖基化、糖基化终产物。当前归档没有独立 SVG 文件；视觉参考来自 React/Mol* 组件。

- `backend/services/scanner.py`：实际规则、RSA 计算与阈值。
- `prd.md`：分类、产品叙事和颜色设计参考；是需求文档，不能替代实际实现或科学验证。
- `frontend/src/components/SequenceStrip.jsx`：序列注释轨道。
- `frontend/src/ProteinViewer.jsx`：结构显示与位点联动。
- `frontend/src/pages/ResultsPage.jsx`：风险列表、筛选与详情组织。
- `frontend/src/components/RulesModal.jsx`：规则表与自定义规则交互参考。

## 推荐用于 KN035 卡片的位点

采用 1-based domain 编号：工作结构 VHH A1–127 对应原始 5JDS 作者链 B1–127；序列 S128 没有参考坐标。

| 关注项 | WT 匹配 | 展示建议 |
|---|---|---|
| Met 氧化关注位点 | M28、M34、M83、M93 | 展示 M34L 使 Met 数从 4 降至 3；未测量氧化速率 |
| Trp 氧化关注位点 | W36、W118 | 联动序列与结构，标注模式扫描来源 |
| 脱酰胺关注基序 | NN73–74、NA74–75、NS84–85 | S85N 后 NS84–85 变为 NN84–85，仍命中该库 Medium 规则 |
| Asp 异构化关注基序 | DS62–63、DT90–91、DS99–100 | 分别高亮，CDR 内位点不直接推荐随意替换 |
| 酸敏裂解关注基序 | DP103–104 | 作为工艺与序列风险讨论入口 |
| N 端环化关注项 | Q1 | 作为可能的异质性来源标记，非实测修饰 |

JSON/CSV 保留全部 56 条规则匹配记录，包括同一位点属于不同类别的记录。这不是 56 个独立缺陷，也不是综合风险评分。宽泛的 S/T 等命中不宜成为卡片核心数字。

## 使用边界与需要修正的实现假设

1. 这是内部规则库的本地模式匹配补充，不属于新增 MOS 任务输出；没有运行下载的代码或安装依赖。
2. 风险标签按原库保留，不当作实验结果、概率或已发生修饰。KG、KE/KD/KK、单残基 S/T 等规则尤其需要具体生物学与生产环境，避免直接写成已确认高风险。
3. 原程序用固定序列位置近似划分抗体 CDR/Fc，且会把 120 位之后标为 Fc；这不适用于 128 aa KN035 VHH。前端沿用原有审校 CDR 和编号，不采用该近似区域或 Critical 自动升级。
4. 原程序偶数 Cys 跳过游离巯基，计数本身不证明配对；KN035 应采用已经从结构验证的 C22–C96、C33–C106。
5. 本补充未计算 RSA。原程序按链排序再与序列拼接，缺失坐标/多链时可能错位；本例 128 aa 与 127 个结构残基亦不直接等长。后续 RSA 必须通过已审校的残基映射关联。
6. 当前源码未发现 LICENSE 文件，项目为 Internal。材料供内部交接参考；没有将完整内部代码或文件公开到官网。

## 推荐动态叙事

沿用 WT → 风险位点 → 单点候选的流程。先展示 M34、NS84–85 等具体位置，再显示 M34L 的 Met 4→3 和 R19S 的理论 pI 9.01→8.76；S85N 用“基序变化，仍需评估”呈现。模式风险、模型突变评分与理论理化量各自标注来源。
