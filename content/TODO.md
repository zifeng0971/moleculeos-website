# MOS 官网内容待确认清单

以下字段在站点中统一以 `{{TODO: 待业务方确认}}`（英文页为 `{{TODO: pending confirmation}}`）展示，不应在未确认前替换为推测值。

| 页面 / 模块 | 待确认内容 | 当前文件 |
| --- | --- | --- |
| 首页 · 信任条 | 真实临床靶点数、完成湿实验验证的项目数 | `messages/zh.json`、`messages/en.json` |
| 平台 · 模型体系 | NewOrigin、MMFold、MMDesign 的输入、输出、适用分子、Benchmark 与已知局限 | `messages/zh.json`、`messages/en.json` |
| 平台任务页 | 四个任务的 Hero 说明、适用分子、典型场景、输入、输出、调用模型与相关案例 | `messages/zh.json`、`messages/en.json` |
| 首页 · 验证与证据 | 已验证候选数、覆盖靶点数、设计到验证周期 | `messages/zh.json`、`messages/en.json` |
| 首页与验证页 · 六个案例模板 | 核心结果、难点、分子类型、周期、项目背景、设计策略与授权范围 | `messages/zh.json`、`messages/en.json` |
| 定价页 | 学术版、专业版、企业版价格及计费周期 | `messages/zh.json`、`messages/en.json` |
| 定价页 · 算力表 | 各任务 Credit 消耗与预计耗时 | `messages/zh.json`、`messages/en.json` |
| Footer | 网站备案号 | `messages/zh.json`、`messages/en.json` |
| 全站图片 | 正式产品截图、合作方 Logo、获批案例配图 | `public/placeholder/` |
| 品牌资源 | 深色 PNG Logo 与站点图标已接入；未来浅色场景需另行提供资源 | `public/brand/` |
| 联系表单 | 正式表单服务或 CRM 接口 | `components/pages/contact-page.tsx` |

## 发布前科学与合规检查

唯一已确认的结果须完整呈现：在 12 个靶点上，每个靶点仅测试不超过 50 个候选分子的低通量条件下，靶点成功率超过 90%。该条件不得拆分为孤立的成功率数字。

- 不添加未经验证的命中率、提升倍数、模型领先结论或客户名称。
- 每项 benchmark 必须同时确认数据集、版本、基线和评测口径。
- 每个案例需确认客户授权、靶点脱敏范围与湿实验检测方法。
- 数据安全与 IP 文案需由法务和安全负责人最终审核。

## v12 MMetrics 素材与接口确认

| 位置 | 待确认内容 |
| --- | --- |
| `public/placeholder/5xh3-preview.svg` | 5xh3 真实首帧截图 |
| `content/mock/mmetrics-5xh3.json` | UniProt Feature 被遮挡的残基、完整网络拓扑、MutXstruct 与 MutXseq 说明，保留原 TODO |
| `public/demo/5xh3.cif` | 后续平台预处理版本；核对 author 编号与面板注释，不猜测映射 |
# v13：首页结构调整

| 位置 | 待确认内容 |
| --- | --- |
| 结果可检查：标题 | {{TODO: 待确认}} |
| 结果可检查：引导文字 | {{TODO: 待确认}} |
| Hero Agent 演示 | 固定外框已搭好；四拍脚本待后续开发 |
## v14：帮助中心与社区

| 位置 | 待确认内容 |
| --- | --- |
| 帮助中心：更新日志、API 文档 | {{TODO: 待确认}}；本轮仅禁用入口与占位页 |
| 社区：用户论坛、飞书、X、Discord、Reddit、Quora、Facebook | {{TODO: 待确认}}；逐项核实账号开通状态后再启用外链 |
