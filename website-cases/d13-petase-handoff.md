# MOS 两个研究案例交接

专业写作入口：

- [D1.3 抗体人源化](d13-humanization/summary.md)：11个新增任务成功；10组独立序列；55个Fv预测结构；原生MMetrics最终已返回。
- [PETase 局部理性改造](petase-redesign/summary.md)：8个新增任务成功；10条输出含4种独立序列；15个预测结构；完整HEMT原生MMetrics尚未返回。

每个目录内 `website-data.json` 为素材索引，`analysis/verified-results.json` 为审核后的完整定量数据，`manifest.json` 为文件校验索引。数据路径相对于各案例根目录。

严格区分公开实验结构、MOS实际预测/评分、额外序列/坐标统计。原始包保持不变；summary与verified-results中记录已发现的原始报告错误及修正。未开发官网前端。

部分步骤存在实际功能限制：完整HEMT原生MMetrics等待平台计算，本会话没有原生Superimpose工具入口；已保存原生状态截图及可追溯的额外Kabsch比较。19个明确发起的模型任务均成功，不等于所有自动MMetrics分析均完成。
