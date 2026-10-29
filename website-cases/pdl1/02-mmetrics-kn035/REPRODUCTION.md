# 复现说明

使用保留的原始下载数据复算，不会重新提交MOS任务。环境为Biopython 1.88、numpy 2.4.6；可视化额外使用matplotlib 3.11.2，与既有handoff/analysis-requirements.txt一致。

以下命令复算 2026-10-21 的历史全模块快照；其中 `build_kn035_case02.py` 会把规范 Homologs 写回旧空结果。当前规范入口已追加 2026-10-29 同源数据，复算历史时应在副本中执行，避免覆盖最新观察：

```sh
python website-cases/pdl1/handoff/scripts/prepare_kn035.py
python website-cases/pdl1/handoff/scripts/build_kn035_case02.py
python website-cases/pdl1/handoff/scripts/finish_kn035_antibody.py
python website-cases/pdl1/handoff/scripts/build_kn035_scoring.py
python website-cases/pdl1/handoff/scripts/audit_kn035_structures.py
python website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py
```

脚本校验唯一主文件hash、全部序列、WT身份、逐残基映射和派生文件坐标。源数据的数值字符串完整保留。GUI复现须在本案例新项目中使用input.json的真实输入、prompt、schema及payload；原生面板缺失项不人工补造。

详细原生采集口径见 `MMETRICS_REPRODUCTION.md`。

2026-10-29 相同结构、相同 prompt 的重跑数据与校验方式见 [reruns/20261029/README.md](reruns/20261029/README.md)。两次运行的原始输入、任务及观察日期分别保留；本次只刷新规范 Homologs，不把旧模块标成新运行输出。
