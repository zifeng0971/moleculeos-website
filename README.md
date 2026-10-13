# MoleculeOS Marketing Site

MoleculeOS 产品官网，使用 Next.js 14 App Router、TypeScript、Tailwind CSS、next-intl 与 Framer Motion 构建。站点默认中文，英文页面位于 `/en`，支持静态导出。

> 协作开发请先阅读 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)（环境、目录、样式约定、分支与提交流程）。

## 本地启动

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。类型检查与生产构建：

```bash
npm run typecheck
npm run build
```

生产构建结果输出到 `out/`，可部署到任意静态托管服务。

### Agent 结构资源

Hero 的三栏工作区使用同源 `public/demo/2bdn.cif`，不连接 MOS 模型服务。构建时执行 `scripts/prepare-agent-structure.ts`：仅文件缺失时从 RCSB 获取，验证锁定 SHA-256，生成实际建模残基索引与坐标投影预览。来源、修订与链编号见 `content/agent-structure.json` 和 `content/demo-reuse.md`。资源更新时须人工核验版本和校验值，不应自动跟随远程更新。

Agent 任务仅在页面生命周期保留；结构步骤后桌面加载 3D，移动端及减少动效模式点击加载。放大／收起沿用同一个 canvas，ESC 收起；各任务保留选区、视角和显示方式。下方 MMetrics 继续使用 5XH3，控制器不传配置时保持原行为。

## 内容与配置

- 中英文文案：`messages/zh.json`、`messages/en.json`
- 平台地址、导航与 Footer：`lib/site-config.ts`
- 待确认数字与内容总表：`content/TODO.md`
- 首页独立区块：`components/sections/`
- 页面级组件：`components/pages/`
- shadcn 风格基础组件：`components/ui/`
- 通用卡片交互：`components/ui/InteractiveCard.tsx`；统一参数：`lib/interaction-config.ts`

可跳转卡片使用 `as="a"` 和 `href`，信息卡使用 `tilt={false}`、`glowRadius={320}`。触摸或减弱动态模式自动降级为顶部静态微光；小于 200×160px 的卡片不倾斜。鼠标监听仅在视口内悬停时挂载。不要在组件内嵌套玻璃模糊面板，也不要在整卡链接内嵌套其他链接。

## 替换占位内容

所有产品图位于 `public/placeholder/`。代码中相应 `next/image` 附近有替换说明：

- `mos-workspace.svg`：替换为已审批的 MOS 项目工作台截图。
- 合作方 Logo 当前为无客户含义的文字占位；获得授权后替换为正式 Logo 资源。

具体数值均以 `{{TODO: 待业务方确认}}` 标记。请先更新 `content/TODO.md` 的确认状态，再同步替换两个语言文件，避免中英文数据不一致。

## 部署

`next.config.mjs` 已配置 `output: 'export'` 与图片静态导出。运行 `npm run build` 后，将 `out/` 上传至静态托管服务即可。若未来接入表单后端、草稿预览或服务端个性化，需要移除静态导出配置并改用支持 Next.js 服务端运行时的部署方式。

## v7 信息架构与旧链接

任务与模型集中在 `/platform`（英文 `/en/platform`），左侧导航监听页面锚点。首页按七个区块呈现，模型带只保留三列简介；FAQ 已迁至 `/help/faq`。

旧 `/platform/[slug]`、`/models` 和模型详情地址映射到平台页对应锚点。开发服务器通过 `next.config.mjs` 返回 HTTP 301；静态 HTML 本身不能产生 HTTP 301，因此生产环境必须启用托管层规则：Netlify 使用导出目录中的 `_redirects`，Vercel 使用根目录 `vercel.json`。其他托管平台需按 `lib/legacy-redirects.mjs` 配置同等的 301 `Location`（保留锚点和语言前缀）。兼容页面提供客户端 `location.replace` 及普通链接作为降级，但不代替 HTTP 301。

## v8 用户手册

v11 阅读入口为 `/help/manual`（英文 `/en/help/manual`）：所有分组和章节按源文档顺序连续展示，不再分页。旧章节地址由 manifest 自动生成 HTTP 301 托管规则，跳到新页对应锚点；兼容 HTML 提供客户端跳转降级。文档与营销页共用五项主导航。搜索位于侧栏顶部，Cmd/Ctrl+K 打开 480px 浮层，章节及小节结果定位至锚点。左侧章节树随滚动展开、高亮和跟随；用户手动滚动侧栏后暂停跟随三秒。右侧目录只显示当前 H2 下的 H3/H4。

转换阶段排除页眉／页脚关系引用的图片、宽高比超过 8:1 或低于 1:8 的装饰图片，以及宽高均小于 100px 的图片。备查原资源保存在 `public/manual-assets/<lang>/filtered/`，manifest 记录 `filteredReason`，控制台列出清单；正文和原有说明文字不删改。视频在实际进入视口时才挂载 source，离开两屏后卸载；图片懒加载，标题滚动留出 100px 顶栏空间。`npm run verify:manual` 会校验连续页面原文、锚点唯一性与过滤素材不被引用。

把两份 DOCX 放到桌面，运行 `npm run ingest:manual`。默认文件名为 `分子之心 MoleculeOS 用户操作手册.docx` 与 `MoleculeMind - MoleculeOS User Guide.docx`。其他路径可通过 `MANUAL_ZH` / `MANUAL_EN` 环境变量指定；只接受 DOCX，不接入翻译、PDF 或 Markdown 源文件。

脚本使用 mammoth 保留文本格式，依据真实 Word 标题样式／已有大纲级别拆分 H1 分组和 H2 页面。缺少 H1/H2 会报错，不从手动加粗推断标题。分组前言、没有 H2 的章节及源文件封面保留在手册首页，不丢弃。H5/H6 仍保留正文层级，但只有 H3/H4 列入页内目录。中英页面按出现顺序对应，页数差异与缺失视频会打印警告并记录在 manifest。

- 转换脚本：`scripts/ingest-manual.ts`，可重复执行；覆盖 `content/manual/` 的生成内容。
- 成功转换后清理不再引用的脚本生成素材；保留原始 DOCX 与非脚本命名的文件。
- 输出正文与完整目录：`content/manual/{zh,en}/`、`content/manual/manifest.json`。不要手动修改生成内容，更新 DOCX 后重新运行脚本。
- 截图与媒体：`public/manual-assets/`。PNG 原图保留，WebP 最大宽 1600px。GIF 先由 ffprobe 统计帧数：静态 GIF 转 WebP，多帧 GIF 转 VP9 WebM（CRF 34）与 H.264 MP4（CRF 24），首帧 WebP 作为 poster。视频宽度最大 1600px、偶数尺寸、无音轨。中英文完全独立，绝不跨语言复用或匹配资源。使用项目安装的 `ffmpeg-static` / `ffprobe-static`，无需全局安装。缓存按语言、原文件名、MD5 与转换参数版本保存于 `content/manual/.media-cache/`，未变化的资源跳过转换。
- 静态搜索索引：`public/search-index-zh.json` / `public/search-index-en.json`；FlexSearch 中文 CJK 编码与 `tokenize: full`。
- 阅读组件：`components/docs/`；独立样式在 `app/globals.css` 的 Documentation 区，不暗化截图，不使用营销卡片鼠标效果。
- 本地素材索引：`http://localhost:3000/dev/manual-assets`，可筛选分组并复制资源路径。不会自动替换营销页图片。

`npm run dev` 生成唯一的开发素材路由，`npm run build` 会在 Next 构建前移除该自动生成文件，因此生产导出中不存在 `/dev/manual-assets`。请使用这些 npm 命令而非直接执行 `next dev/build`。构建脚本会临时移出 `gif-original/` 并在构建结束（含失败）后恢复，确保备份不进入导出目录；备份和转换缓存均已加入 `.gitignore`。原始 DOCX 仅作为本地输入，不复制到 public，不提供下载链接。

搜索索引在 ingest 与每次生产构建时重新生成。`npm run test:manual` 用独立临时 DOCX 测试嵌套格式、媒体位置、跨语言对应与重复执行；不会改动真实手册。`npm run verify:manual` 在生产构建后把导出网页的正文与两份源 DOCX 逐字核对（忽略排版空白），同时检查开发路由和原始 DOCX 未被发布。


### 媒体修订

原始 GIF 仅保存在 `public/manual-assets/{zh,en}/gif-original/`，网页不引用。每个资源记录原始文件名、MD5、帧数、时长、原始/转换后体积与尺寸；脚本打印各语言压缩报告。双格式视频加 poster 若比 GIF 更大，会告警并改用 WebP 首帧静图。

缺失的 `[文件名.mov/.mp4]` 按原文件名放入 `content/manual-source/zh/video/` 或 `content/manual-source/en/video/`，重跑即可接入；缺失清单为 `content/manual/missing-videos.json`，开发期显示占位，生产期渲染为空。除此明确指定的文件名占位替换外，原文保留逐字校验。

播放器进入视口 50% 时静音循环播放，离开时暂停；胶囊控件仅有播放/暂停与进度条，无静音按钮。系统设置减少动态效果时不自动播放，仍可手动播放。截图没有暗化滤镜。

### 首页演示位置（v13）

Hero 右侧为 `components/hero/AgentDemo.tsx`：16:10 固定外框，顶部 44px、底部 56px，本轮仅空态，不含演示脚本。首页按 Hero、信任条、能力卡、结果可检查、模型带、验证、结尾 CTA 排列。

`components/sections/results-section.tsx` 承接原 `components/hero/MMetricsDemo.tsx`。桌面且未启用减少动态效果时，区块进入视口后经外层适配自动触发原有加载入口；减少动态效果时仍需点击。查看器原组件实现未改，小于 768px 仍保留其现有静态降级。加载读取本地 `/demo/5xh3.cif`，不请求真实产品计算接口、账号或 token。结果区标题和正文保留 TODO。

结构文件来自 [RCSB 5XH3](https://files.rcsb.org/download/5XH3.cif)。预置面板数据来源和替换约定见 `content/mock/mmetrics-5xh3.json` 的 `_meta`；此文件使用严格 JSON，来源说明不使用非法 JSON 注释。保留所有 TODO，不补造网络拓扑和被遮挡的残基。原始结构用 author 链和编号匹配，包含三字母名称的注释同时验证残基名称，不匹配时显示提示。平台预处理文件可直接替换 CIF，随后应复核相机与编号。

`public/placeholder/5xh3-preview.svg` 是明确标记的非结构占位，待提供 5xh3 首帧截图后替换。查看器保持青绿蛋白、元素配色配体和透明背景；自转在不可见、测距模式或减少动态效果设置下停止。测距通过 Mol* measurement manager 完成，无计算请求。
# v15 Mock 数据与能力选择器

六份业务 Mock 位于 `content/mock/`，逐字段来源、演示状态与替换优先级见 [替换清单](content/mock/README.md)。英文对应文案位于 `messages/en.json` 的 `mockContent`，更新数据时两处同步。页面不显示演示标签，生产发布前需业务审核 P0 字段。

能力屏由 `components/sections/tasks-section.tsx` 渲染。录屏默认缺失，展示任务名与空态，不自动引用手册素材。将 `capabilities.json` 中四个同名文件放入 `public/demo/` 后刷新开发页面，或重新运行 `npm run build` 生成静态站点。选择器默认每 6 秒切换，点击或键盘选择后停止；减少动态效果设置下关闭自动切换。
# 本地预置演示

Hero Agent 的四项任务脚本由 `lib/agent-demo.ts` 管理，中英文展示内容位于 `messages/*.json` 的 `agentDemo`。任务切换自动播放，支持暂停／重播；减少动效模式使用“查看下一步”。输入区不提交请求。`npm run test:demo` 检查脚本与静态请求边界。

MMetrics 沿用本地 5XH3 与 Mol*，支持结构／序列联动、互作开关和原子测距；桌面滚动进入加载，移动端点击加载。业务注释为既有预置数据，非本轮科学核验。复用范围与固定来源版本见 `content/demo-reuse.md`，第三方声明见 `THIRD_PARTY_NOTICES.md`。
