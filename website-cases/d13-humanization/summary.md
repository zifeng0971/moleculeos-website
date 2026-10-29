# D1.3 抗体人源化：执行与官网素材

实际完成 1 个人源化任务及 10 个独立 MMFold 任务，均 Succeed。10 组独立 VH/VL 序列、50 个独立 MMFold Fv 模型及人源化任务附带的 5 个模型全部保存；55 个模型的实际序列均已核对。

## 输入与链映射

- 实验来源：[1FDL](https://www.rcsb.org/structure/1FDL)、[1BVL](https://www.rcsb.org/structure/1BVL)。原始 PDB/mmCIF、FASTA、元数据、下载 SHA256 均在 `source/`。
- 1FDL 作者链 L=轻链214 aa、H=重链218 aa、Y=溶菌酶129 aa；MOS 链 A=L、B=H、C=Y。人源化仅输入 ANARCI 提取的 VH116 aa + VL107 aa，未把恒定区作为 Fv。
- 1BVL 生物学配对为作者 A+B、C+D；MOS 导入重排后 A+C 才对应作者 A+B。独立比较以原始作者 A+B 为准。编号表、额外末端残基排除和坐标一致性证据见原始导出 `analyses/1BVL_chain_mapping.*`。

## 实操步骤及证据

|步骤|执行情况|证据|
|---|---|---|
|载入与识别|完成；原始和 MOS 结构分别留存|source/；outputs/mos-export/website_case_d13/structures/|
|原生 MMetrics|最终已返回描述、链识别、六段 CDR、界面表及10份CSV；Homologs 显示无显著同源物|tasks/native-1FDL-mmetrics-panel.json；outputs/native-mmetrics-1FDL/|
|Mocha 人源化10组|Succeed，任务342335722341376，num_designs=10|tasks/native-humanization-details.txt；原始任务ledger|
|独立 Fv MMFold|10个任务均成功，每个5个采样|原始 native_tasks/mmfold/；native_tasks/task-ledger.json|
|框架/CDR叠合|完成 IMGT 对应、全Fv/框架拟合、六段CDR的全局及局部RMSD；全部50采样可追溯|analysis/verified-results.json；analysis/audit_outputs.py|
|1BVL独立比较|完成；亲本与作者AB参考223个CA的RMSD=0.80629 Å|analysis/verified-results.json|
|代表性原生截图|3、2、9号叠合已导入MOS并截图|screenshots/representative-humanization-*-overlay.jpg|

本会话可用工具和任务目录没有暴露原生 Superimpose；叠合来自明确记录的 Kabsch 坐标统计，导入 MOS 展示。不能把它写作“原生 Superimpose 任务成功”。

## 代表候选与定量结果

选择顺序是展示叙事顺序，不是实验活性排名。结构采用每个独立 MMFold 任务未四舍五入 ranking_score 最高的采样；pLDDT 为原生 global 字段，ipTM 为 VH/VL 界面置信度，均非抗原结合亲和力。

|候选|选择理由|框架变化数|CDR变化|原生人源化综合分|pLDDT|VH/VL ipTM|亲本CA RMSD Å|框架拟合RMSD Å|1BVL AB CA RMSD Å|
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
|humanization_3|亲本框架与全Fv偏移较小|36|0|0.4730|96.10|0.963|0.406|0.390|0.759|
|humanization_2|高预测置信度、接近亲本|35|0|0.4589|96.77|0.966|0.432|0.420|0.707|
|humanization_9|原生人源化综合分最高|36|0|0.5032|95.04|0.964|0.503|0.449|0.637|

全部10组排序和完整序列：`analysis/candidate-summary.csv`、`outputs/all-humanized-sequences.fasta`、`analysis/verified-results.json`。原生排序：原始导出 `native_tasks/humanization/final_ranked_summary.csv`。9号综合分0.503163，亲本0.246307；OASis percentile 0.045454→0.291193，表示约第4.55→29.12百分位，不能写成人源化百分比。AbNatiV VH2 0.396811→0.748157，VL2 0.497507→0.682109。未测免疫原性或亲和力。

## 界面与可视化高亮

- 原生抗原界面表：B–C 19行（7条 H-Bond 标签、12条 VdW）；A–C 14行（4条 H-Bond、9条 VdW、1条 π-H）。A–B为抗体内部界面80行。逐行结构化数据在 `outputs/native-mmetrics-1FDL/interactions.csv`；原生标签保持原样。
- 原生关键对：B:ASP100–C:SER24 H-Bond 2.82 Å、VdW最短2.63 Å；B:GLY53–C:GLY117 2.87 Å；A:TYR50–C:ASP18 2.86 Å。距离可采用不同原子对，勿把2.82与2.63误判为同一原子对的冲突。
- 独立4.5 Å重原子接触高亮（作者编号）：H30/31/32/52/53/54/99/100/101/102，L32/49/50/53/91/92/93；恒定区没有该阈值下的直接抗原接触。
- 六段CDR序列：VH GFSLTGYG / IWGDGNT / ARERDYRLDY；VL GNIHNY / YTT / QHFWSTPRT。10组均保持43个CDR位置。精确 IMGT 标识用 `analyses/numbering_all_schemes.tsv`，不能把界面UI中连续序列下标直接当成IMGT编号。
- 修正后 Mocha FreeSASA：双侧埋藏面积1243.2 Å²；这是两侧面积之和，单侧平均621.6 Å²。本地独立 Shrake–Rupley（960点、probe1.4 Å）为1223.75 Å²；算法/半径不同，保留方法标签。
- 建议动画：亲本Fv–抗原界面 → 六段CDR固定 → FR突变高亮 → 3/2/9三个预测Fv与亲本及1BVL参考切换。所有叠合结构、结构路径和各CDR数值见 `website-data.json` 与 canonical JSON。

## 保留的异常与解读边界

- 初期 Mocha PPInterface 表未通过坐标复核，其恒定区结合面积/部分互作已被撤回；原始文件和纠正日志均保留。最终原生 MMetrics Paratope 列表仍包含远端恒定区残基，不应直接作为全部抗原接触位点展示。
- 7号 VL106 aa，含1个框架缺失。共222个配对CA/179个FR CA，其余223/180；35–41为包含缺失的框架变化范围（替换35–40）。原始QC等长声明错误，已在 canonical JSON修正。
- 7号原始结构比较用了sample3，但原生精确 ranking_score 最佳为sample1；独立审核改用sample1，亲本RMSD0.464216 Å。原始0.450 Å保留作错误证据，不用于展示。
- 9号部分CDR采样差异较大，保留全部5采样和逐环统计。低RMSD、CDR序列一致和高pLDDT不证明结合能力保留。
- 早期导出包内“MMetrics RUNNING”为历史状态；最终界面已返回数据，以 `tasks/native-ui-status.json` 为准。

## 素材入口

- 机器读取：`website-data.json`、`analysis/verified-results.json`、候选 CSV、原生 MMetrics CSV。
- 原始交付包：`outputs/website_case_d13.zip`；完整解包：`outputs/mos-export/website_case_d13/`。旧checkpoint保留。
- 原生页面：`screenshots/`；完整Mocha对话/执行轨迹/任务详情：`tasks/` 和原始导出 `logs/`。
- 所有文件校验和：`manifest.json`。原始导出中的 report/results 为运行历史，发生差异时以本 summary 和独立审核数据为准。

额外定量可视化：`analysis/candidate-comparison.png` / `.svg`；由审核后的实际模型数据绘制，图表不替代原生MOS截图。
