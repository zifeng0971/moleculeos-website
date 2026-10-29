# 第二轮复现

输入目标与首轮相同，唯一改变random_seed为444/555/666。input.json保留每个真实提交payload与来源，raw/mos-export保留平台输出，不需要重新提交即可复核：

```sh
python website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py --round 2
python website-cases/pdl1/handoff/scripts/compare_kn035_denovo_rounds.py
```

Biopython1.88/numpy2.4.6。比较文件显示全部六个设计，避免仅保留最好结果。
