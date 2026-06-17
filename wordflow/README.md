# WordFlow 考研背词台

本项目是给 Suntory 使用的本地静态背单词网页，入口为 `index.html`。

## 当前覆盖

- 考研总词库：5822 个唯一词，`targetSize` 为 5500。
- 分层：核心必背、阅读高频、边缘低频、熟词生义、考纲速认。
- 英语一 80+ 四层训练入口：核心精背、考纲速认、真题熟词生义、我的错词。
- 核心精背层：2042 词，保留深背、主动提取和语境训练。
- 考纲速认层：5822 词，先训练英文到中文的大意秒反应。
- 真题/熟词生义层：422 词，含真题命中词和高危多义词。
- 真题来源：`https://pastpapers.cn/kaoyan`，当前索引 2023-2025 共 6 套。
- 真题统计：只保存词频命中和来源链接，不保存整套真题原文。
- 背词模式：进入学习页后启用全屏专注模式，隐藏主导航、顶栏、来源提示和右侧状态栏。
- 扩展性：托福、雅思词库结构已预留，后续补 `words` 即可启用同一套学习逻辑。

## 80+ 四层词库

- 核心精背：高频核心、真题热词、熟词生义，当前 2042 词，重在主动提取和真题语境。
- 考纲速认：大纲词快速识别，当前 5822 词，目标是先把识别面铺满。
- 真题熟词生义：真题命中词、熟词生义、阅读冷门义，重点解决长难句误读。
- 我的错词：由答错、模糊、慢想自动生成，冲刺期优先复习。

## 词库来源与再生成

- 手工核心包：`data/kaoyan-core-pack.js`、`data/kaoyan-extended-pack.js`、`data/kaoyan-complete-pack.js`。
- 速认扩展包：`data/kaoyan-syllabus-recognition-pack.js`，由 ECDICT 开源英汉词典筛选 `ky` 考研标签和高频考试词生成。
- 牛津参考：用户提供的 OALD MDX/MDD 作为后续释义校对来源，当前前端只记录精简学习字段。
- DeepSeek：通过 OpenClaw 调用 `deepseek/deepseek-v4-pro` 做垂直方向校准和熟词生义种子校对，不把大批量词义完全交给模型生成。

重新生成速认包前，先下载 ECDICT CSV 到临时目录：

```bash
curl -L --fail --show-error https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv -o /private/tmp/ecdict.csv
node tools/build-syllabus-pack.js
```

## 本地打开

直接用浏览器打开：

```bash
open index.html
```

也可以用本地静态服务：

```bash
python3 -m http.server 8765
```

## GitHub Pages 部署

仓库根目录已经包含 GitHub Actions 工作流：

```text
.github/workflows/deploy-wordflow-pages.yml
```

这个工作流会把 `wordflow/` 目录发布到 GitHub Pages，因此最终 Pages 网址会直接打开 WordFlow 应用。

首次部署步骤：

1. 在 GitHub 新建一个仓库，例如 `wordflow`。
2. 把本地仓库推到 GitHub 的 `main` 分支。
3. 打开 GitHub 仓库页面，进入 `Settings` -> `Pages`。
4. 在 `Build and deployment` 里把 `Source` 选为 `GitHub Actions`。
5. 回到 `Actions` 页面，运行或等待 `Deploy WordFlow to GitHub Pages` 完成。

推送命令示例：

```bash
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git add .github wordflow
git commit -m "Deploy WordFlow with GitHub Pages"
git push -u origin main
```

部署成功后，页面地址通常是：

```text
https://<你的用户名>.github.io/<仓库名>/
```

学习进度保存在浏览器本地。换到 Windows 电脑打开同一个网址时，会从新的本地进度开始；如果以后需要跨设备同步，再加账号和云端存储。

## 验证命令

```bash
node tools/validate-wordbank.js
node tools/audit-app.js
```

`validate-wordbank.js` 检查 5500+ 词库规模、去重、字段完整、熟词生义数量、真题统计接入。

`audit-app.js` 检查首页显示、真题统计、全屏专注模式和核心 CSS 约束。

## OpenClaw 辅助流程

本机 OpenClaw 已验证可调用 `deepseek/deepseek-v4-pro`。建议只用于低风险任务：

- 生成候选词条草稿。
- 补全简单中文释义、标签、难度、频次。
- 批量产出固定格式：`word|pos|cn|tags|difficulty|frequency|level`。

最终入库仍要经过本地校验脚本，避免重复、字段缺失或分层错误。

## 备注

Codex in-app Browser 当前策略拒绝打开本地 `localhost` 和 `file://` 页面，因此本轮用 Node 运行时审计代替浏览器截图验证。网页本身是静态文件，可直接在系统浏览器打开。
