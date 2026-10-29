# 复现说明

使用保留的原始下载数据复算，不会重新提交MOS任务。环境为Biopython 1.88、numpy 2.4.6；可视化额外使用matplotlib 3.11.2，与既有handoff/analysis-requirements.txt一致。

从仓库根目录按顺序运行：

```sh
python website-cases/pdl1/handoff/scripts/prepare_kn035.py
python website-cases/pdl1/handoff/scripts/build_kn035_case02.py
python website-cases/pdl1/handoff/scripts/finish_kn035_antibody.py
python website-cases/pdl1/handoff/scripts/build_kn035_scoring.py
python website-cases/pdl1/handoff/scripts/audit_kn035_structures.py
python website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py
```

脚本校验唯一主文件hash、全部序列、WT身份、逐残基映射和派生文件坐标。源数据的数值字符串完整保留。GUI复现须在本案例新项目中使用input.json的真实输入、prompt、schema及payload；原生面板缺失项不人工补造。

规范分析以顶层results.json及raw/local为准；raw/mos-export保留当时的真实平台输出及调试分析，个别早期摘要已被本地审计更正。
