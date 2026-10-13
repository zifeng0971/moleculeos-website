# MoleculeOS 官网 · 协作开发文档

> 写给一起开发这个仓库的伙伴。先读完「快速开始」和「协作流程」，动手改页面前再看对应模块的说明。
> 产品与内容背景见根目录 [README.md](../README.md)，待确认数据见 [content/TODO.md](../content/TODO.md)。

---

## 1. 快速开始

**环境要求**

- Node.js ≥ 18.17（推荐 20 LTS 或更新；当前维护者本地为 Node 24）
- npm（仓库使用 `package-lock.json`，请不要混用 yarn / pnpm）
- 浏览器：桌面端 Chrome 最新版（WebGL 动效与 Mol* 结构查看器在 Chrome 上验证最充分）

```bash
git clone <仓库地址>
cd mos
npm install
npm run dev          # http://localhost:3000
```

如需固定端口：`npm run dev -- -p 3123`。

**常用命令**

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发（会额外生成一个仅开发环境可见的 `/dev/manual-assets` 素材浏览页） |
| `npm run typecheck` | TypeScript 类型检查，**提交前必须通过** |
| `npm run lint` | ESLint |
| `npm run build` | 完整静态构建，产物在 `out/`（会先跑结构资源校验、手册搜索索引、重定向同步） |
| `npm run test:mock` / `test:demo` / `test:manual` | Mock 内容、首页演示、用户手册导入的校验脚本 |

---

## 2. 技术栈

- **Next.js 14 App Router**，`output: 'export'` 纯静态导出，无服务端运行时
- **TypeScript** + **Tailwind CSS 3**（基础布局）+ 两份手写 CSS（视觉细节）
- **next-intl**：中英文双语，中文为默认语言，英文页面在 `/en`
- **Framer Motion**：进场、切换动画
- **three.js**：首页的 WebGL 粒子效果（数据飞轮、Hero 背景）
- **Mol\***（molstar 4.9.0）：蛋白结构 3D 查看器
- **MDX**：用户手册内容

---

## 3. 目录结构

```
app/
  (zh)/            中文路由（默认语言，URL 无前缀）
  en/              英文路由（/en/...），页面结构与 (zh) 一一对应
  globals.css      设计变量（颜色、渐变、玻璃质感）、基础组件样式、文档页样式
  visual.css       首页视觉层：字号、间距、动效、各区块的精细样式（后加载，会覆盖 globals）
components/
  sections/        首页各区块（一个文件一个区块）
  pages/           页面级组件（平台、定价、验证、帮助、社区……）
  hero/            Hero 区的 Agent 演示、Mol* 查看器、MMetrics 演示
  motion/          动效：Reveal 进场、WebGL 场景、滚动进度、背景光晕
  layout/          Header / Footer / 右侧位置指示器 / 移动端 CTA
  docs/            用户手册（侧栏、搜索、目录、视频）
  ui/              基础组件（按钮、卡片、标题、手风琴等）
lib/               站点配置、内容读取、重定向规则、手册类型与搜索
messages/          zh.json / en.json —— 全站文案
content/           Mock 数据、手册源文件与生成结果、结构资源说明、待确认清单
scripts/           构建前处理脚本（结构文件、手册导入、搜索索引、重定向）
public/            静态资源（品牌、演示结构文件、手册截图/GIF、占位图）
docs/              本文档等协作文档
```

### 首页区块顺序

定义在 `components/pages/home-page.tsx`，叙事顺序为：

1. `hero-section` —— 主标题 + Agent 工作区演示
2. `results-section` —— 可解释的结果展示
3. `tasks-section` —— 「它能帮我完成什么」任务选择器（左侧标签 + 右侧结构演示卡片）
4. `model-stack-section` —— 三层模型体系（滚动时吸顶、卡片层叠）
5. `flywheel-section` —— 数据飞轮（WebGL 粒子）
6. `validation-section` —— 验证案例
7. `enterprise-section` —— 企业级能力与访问方式
8. `trust-section` —— 关键数据与合作方
9. `final-cta-section` —— 结尾行动号召

调整顺序只需改这个数组；右侧圆点导航会自动跟随。

---

## 4. 文案与多语言

- **所有用户可见文字都放在 `messages/zh.json` 和 `messages/en.json`**，组件里不要写死中文或英文。
- 两个文件的 key 结构必须完全一致。新增文案时两边同时加；英文暂时没有就先放英文占位，不要留空 key。
- 首页文案在 `home.*` 下，按区块分组（`home.hero`、`home.tasks`、`home.flywheel`……）。
- 组件中使用：

  ```tsx
  const t = useTranslations('home.flywheel');
  t('title');
  ```

- 导航、Footer、平台菜单、外部链接在 `lib/site-config.ts`。
- **尚未确认的数字**统一写 `{{TODO: 待业务方确认}}`（英文 `{{TODO: pending confirmation}}`），并登记到 `content/TODO.md`。不要填推测值，科学结论和客户信息必须经过业务方确认。

---

## 5. 样式约定

### 两层 CSS

| 文件 | 放什么 |
| --- | --- |
| `app/globals.css` | 设计变量（`--accent`、`--bg-base`、`--text-secondary` 等）、Tailwind 组件层、文档页样式 |
| `app/visual.css` | 首页视觉：字号阶梯、区块间距、各区块的细节与动效 |

`visual.css` 在后面加载，同名选择器会覆盖 `globals.css`。改首页视觉时优先改 `visual.css`。

### 颜色

只使用 `:root` 上已定义的变量和渐变（`globals.css` 中的 `--grad-brand`、`--grad-cta`，`visual.css` 中的 `--grad-title`）。需要新颜色时先加变量，不要在组件里散落十六进制色值。

### 字号与间距（当前基准，1440px 宽屏）

| 元素 | 选择器 | 约为 |
| --- | --- | --- |
| Hero 主标题 | `.hero-title` | 62px |
| 区块标题 | `.section-title` | 39px |
| 区块说明 | `.section-copy` | 16px |
| 大数字 | `.proof-stat .stat-value` | 60px |
| 区块上下留白 | `.home-section-pad` | 72–120px |

字号都用 `clamp(最小, vw, 最大)` 随屏宽缩放。中文字形比英文显大，**新加的标题请参照上表，不要再放大**；行高和字距也不要压得太紧（中文标题行高 ≥ 1.12）。

### 响应式

- 断点：`639px`（手机）、`767px`、`1023px`（平板 / 小屏）
- 手机端 375px 宽下不能出现横向滚动；改完布局务必在手机尺寸下检查一遍
- 动效需尊重 `prefers-reduced-motion`：组件里用 `useReducedMotion()` 降级

---

## 6. 动效与 WebGL

### Reveal 进场

`components/motion/reveal.tsx`：元素进入视口时从下方淡入并去模糊。

```tsx
<Reveal delay={0.1}>...</Reveal>
<Reveal blur={false}>...</Reveal>   // 包裹 WebGL canvas 时必须关闭模糊
```

> ⚠️ **包含 WebGL canvas 的内容不要用模糊进场。** Chrome 在祖先元素做 `filter: blur()` 动画时，可能暂时忽略 canvas 上的 CSS `mask-image`，造成边缘出现硬切的“接缝”。数据飞轮就踩过这个坑。

### 数据飞轮

`components/motion/flywheel-scene.tsx`

- 三个阶段（设计 → 实验 → 进化）的粒子环，每跑一圈精度提升、粒子收紧；中心是 NewOrigin 粒子球
- 粒子在靠近画布边缘时**在着色器里淡出**（`EDGE_FADE`），不依赖 CSS 遮罩；新增粒子层时记得乘上 `edgeFade(gl_Position)`
- 鼠标移动会让相机轻微偏转；滚出视口或页面隐藏时停止渲染
- WebGL 不可用时自动降级为静态的三个阶段标签（`data-failed`）

### 其他

- `protein-field.tsx`：Hero / 结尾的背景粒子
- `task-visuals.tsx`：任务卡片里的结构演示与曲线面板
- 新写 WebGL 组件时：监听 `IntersectionObserver` 只在可见时渲染；`ResizeObserver` 处理尺寸；卸载时释放 renderer、geometry、material

---

## 7. 演示与内容资源

- **Hero Agent 演示**使用同源的 `public/demo/2bdn.cif`，构建时 `scripts/prepare-agent-structure.ts` 校验 SHA-256。不连接 MOS 模型服务。细节见 README「Agent 结构资源」。
- **任务演示视频**：放入 `public/` 对应路径后重新构建即会出现；文件缺失时页面显示“演示素材待补充”，不会 404。清单见 `content/mock/capabilities.json`。
- **用户手册**：源文件为 DOCX，通过 `npm run ingest:manual` 生成 `content/manual/`。不要手改生成结果，改源文件后重新导入。
- **占位图**在 `public/placeholder/`，正式素材获批后替换。
- **大体积原始录屏**（`manual-videos/`）不进 Git，请通过网盘等方式单独传递。

---

## 8. 构建与部署

```bash
npm run build      # 产物在 out/
```

- 纯静态站，`out/` 可部署到 Vercel、Netlify、OSS 等任意静态托管
- 旧链接 301 重定向：Vercel 读根目录 `vercel.json`，Netlify 读 `public/_redirects`；其他平台按 `lib/legacy-redirects.mjs` 配置
- 如果将来接入表单后端或服务端功能，需要去掉 `next.config.mjs` 里的 `output: 'export'`

---

## 9. 协作流程

### 分支

- `main`：可发布的稳定版本，**不要直接 push**
- 功能分支：`feat/<简短描述>`；修复：`fix/<简短描述>`；纯样式：`style/<简短描述>`
- 从最新的 `main` 拉分支，完成后提 Pull Request，至少一位伙伴 review 后合并

```bash
git checkout main && git pull
git checkout -b feat/pricing-table
# ……开发……
npm run typecheck
git push -u origin feat/pricing-table
# 在 GitHub 上发起 Pull Request
```

### 提交信息

沿用现有风格：`类型: 英文简述`，正文可写中文说明原因。

```
feat: add pricing comparison table
fix: stop flywheel seam during reveal
style: calmer type scale on the homepage
chore / docs / perf / refactor ...
```

### 提交前自查

- [ ] `npm run typecheck` 通过
- [ ] 中英文两个 messages 文件都改了
- [ ] 桌面（1440px）和手机（375px）都看过，无横向滚动
- [ ] 没有提交 `.env`、密钥、客户数据、`out/`、`node_modules/`、大视频
- [ ] 没有把未确认的数字写成确定值

### PR 描述建议包含

- 改了什么、为什么改
- 改动页面的前后截图（视觉改动必附）
- 需要业务方确认的内容

---

## 10. 常见问题

**页面某块一直是模糊的 / 动画卡住**
开发模式热更新会保留旧的动画状态，先强制刷新（Cmd+Shift+R）再判断是不是 bug。

**3D 结构查看器不显示**
确认浏览器开启了硬件加速；Mol\* 在移动端和减少动效模式下需点击后才加载，这是预期行为。

**`npm run build` 报结构文件校验失败**
`public/demo/*.cif` 被改动或缺失。不要随意替换，确需更新时同步修改 `content/*-structure.json` 里的校验值并人工核对来源版本。

**手册页面 404**
先跑一次 `npm run ingest:manual`，确认 `content/manual/manifest.json` 已生成。

---

有问题直接在 GitHub Issue 或群里提，改动较大的设计调整先对齐再动手。
