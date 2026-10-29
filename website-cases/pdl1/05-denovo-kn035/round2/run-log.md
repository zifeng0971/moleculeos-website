# de novo第二轮执行记录

用户授权追加三次随机运行；seed444/555/666。项目：https://mos.moleculemind.com/?projectId=342605363971072。

首轮参数程序化复制，仅改变seed。真实输入payload和提交prompt在input.json及raw/submitted-prompt.txt；原始schema、task ledger、运行/排队及完成快照保留于raw/mos-export。平台等待时间按原始ledger和Task List记录，不把中间Pending/Running称为完成。

首轮122个文件全部hash核验未改，第二轮六份CIF与FASTA独立保存。输入目标仍为主MMFold_1的链A，输出B映回主A1–118，新binder输出A无主结构残基对应。虚拟全G骨架和设计序列分开。

本地沿用首轮算法复核三份复合物：完整118aa靶点、全部编号映射、118个CA对齐、4.5Å重原子接触、六热点距离与ShrakeRupley SASA/BSA。结果在results.json，跨轮六设计对比在../round-comparison.json。没有用本地几何值冒充MOS原生评分，置信度没有则为空。

任务 342610714428416：succeed；平台记录用时 6.5min。

任务 342610715788288：succeed；平台记录用时 3.6min。

任务 342610718331904：succeed；平台记录用时 9.5min。

复算：`python website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py --round 2`，再运行`compare_kn035_denovo_rounds.py`。
