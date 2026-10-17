# tools local

<p align="center">
  <img src="public/icon.svg" width="84" height="84" alt="tools local 图标" />
</p>

<p align="center">
  <strong>100% 浏览器本地离线多功能图像与隐私安全工具箱</strong><br>
  零网络上传 · 纯内存渲染 · 断网环境完整可用
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a> · <a href="README.zh-CN.md"><strong>简体中文</strong></a>
</p>

---

## 🌟 项目简介

**tools local** 是一款现代化、高响应速度且注重隐私安全的本地图像处理工具箱，专为个人开发者、摄影师、企事业单位及普通用户打造。涵盖**图片水印制作、隐私涂抹脱敏、照片 EXIF/GPS 清理、截图隐私裁切、证件分享副本制作**等功能。所有图像处理均通过 HTML5 Canvas 2D 和现代浏览器 API 在**本地内存中实时完成**。

图片与元数据绝不上传至任何外部服务器。在离线或飞行模式下可完全正常使用。

---

## 🚀 核心功能模块

### 1. 图片水印工作室 (`/watermark`)
- **文本与样式深度调节**：支持多行文字输入、动态变量插值（`{{date}}` 当前日期、`{{time}}` 时间戳、`{{filename}}` 原文件名）及常用合规防盗声明预设。
- **智能平铺与九宫格定位**：支持 50% 错位交错砖墙平铺（防止局部截图截取）、九宫格定点排布及像素级外边距偏移。
- **高级视觉特效**：0~100% 水印透明度无级调节、文字描边轮廓（确保白色字体在浅色明亮背景上依然清晰可辨）、3D 阴影立体层次，以及色彩混合模式（滤色、叠加、柔光、正片叠底、差值反相）。
- **批量与队列管理**：支持多图拖拽导入、剪贴板粘贴（`Cmd/Ctrl + V`）、底栏胶卷缩略图管理与并发打包 ZIP 导出。
- **一键模版库**：全屏防盗平铺、证件审核专用、摄影精细角标、中心样本印章、高密防泄密网格。

### 2. 隐私遮挡工作室 (`/redact`)
- **双重选区工具**：支持矩形框选与自由涂抹笔刷。
- **三种底层不可逆脱敏效果**：
  - **马赛克 (Mosaic)**：可调节像素块颗粒大小（6px ~ 36px）。
  - **硬件高斯模糊 (Gaussian Blur)**：平滑渐进模糊（6px ~ 40px）。
  - **纯色色块覆盖 (Solid Fill)**：纯黑、纯白、深灰、警戒红。
- **撤销与对比体验**：撤销历史步骤（`Cmd/Ctrl + Z`）、一键清空、按住快速对比原图，导出时永久重绘底层像素数据。

### 3. 照片信息清理 (`/exif`)
- **底层二进制解析**：基于 `exifr` 在本地直接读取照片 EXIF 标签，零外部网络传输。
- **自动化隐私风险评估**：自动检测并标红高危信息（高精度 GPS 经纬度与海拔、设备型号、镜头参数、精确拍摄时间戳）。
- **无损擦除**：通过 HTML5 Canvas 重新编码，彻底抹除照片附带的所有定位与设备指纹。
- **批量处理**：支持多张照片一键批量清理并自动归档打包为 ZIP 下载。

### 4. 截图隐私处理 (`/screenshot`)
- **常用场景一键裁切预设**：
  - 裁掉 iOS 灵动岛/刘海状态栏、Android 顶部时间与电量状态栏。
  - 裁掉底部手势横条 (Home Bar)。
  - 裁掉浏览器顶部标签栏（隐藏 URL 地址与个人书签）。
- **四边精细边缘微调**：支持对 Top、Bottom、Left、Right 四个方向进行无级像素调节。
- **一键快速遮罩**：在截图画面任意位置轻点，即可快速生成贴合头像的圆形马赛克或昵称横条遮罩。

### 5. 证件分享副本 (`/id-copy`)
- **证件专属防护**：专为居民身份证、驾驶证、护照设计。
- **敏感信息一键脱敏**：快速遮挡身份证号后 4 位（校验码）、遮挡详细门牌地址、遮挡出生年月日。
- **法定防伪用途声明水印**：自动生成法律合规声明文本：“仅供 [业务用途] [机构] 使用，有效期至 YYYY-MM-DD，他用无效，复印无效”。
- **标准 A4 副本排版**：自动生成正反双面标准 A4 打印单，附带官方抬头和免责版权说明。

---

## ⌨️ 快捷键与手势支持

| 快捷键 / 交互手势 | 功能描述 |
|---|---|
| `Cmd / Ctrl + V` | 直接从系统剪贴板粘贴截图或图片 |
| `Cmd / Ctrl + S` | 保存下载当前处理完成的图片 |
| `Cmd / Ctrl + Z` | 撤销上一次遮挡涂抹 |
| `鼠标滚轮 (Wheel)` | 画布平滑缩放视图 (10% ~ 400%) |
| `鼠标左键拖拽` | 平移移动高分辨率大图画布 |
| `按住对比 (C)` | 临时切换查看原始无水印图像进行效果对比 |
| `双击画布` | 恢复 100% 原始尺寸并居中显示 |
| `Esc` | 关闭当前弹出的快捷键或配置浮层 |

---

## 🌐 中英双语国际化 (i18n)

内置中英文双语无缝支持：
- **即时语言切换**：点击顶部导航栏的 `EN` / `中` 按钮即可切换，无需刷新页面。
- **自动检测系统偏好**：根据浏览器 `navigator.language` 智能适配初始语言。
- **状态本地持久化**：用户选择的语言偏好保存在本地 localStorage 中。
- **类型安全保障**：所有翻译字典在 `src/i18n/types.ts` 中完全强类型约束。

---

## 🛠️ 技术架构

- **前端核心**：[React 19](https://react.dev/)、[TypeScript 5](https://www.typescriptlang.org/)
- **构建工具**：[Vite 6](https://vitejs.dev/)
- **界面与样式**：[Tailwind CSS 4](https://tailwindcss.com/)、[shadcn/ui](https://ui.shadcn.com/) 规范、CSS 自定义变量
- **状态管理**：[Zustand 5](https://zustand-demo.pmnd.rs/)（支持 localStorage 持久化）
- **轻量路由**：[Wouter](https://github.com/molefrog/wouter)
- **代码编辑器**：[CodeMirror 6](https://codemirror.net/)（支持 JSON 高亮与暗黑主题）
- **图像核心处理**：原生 HTML5 Canvas 2D
- **元数据与归档**：[exifr](https://github.com/MikeKovarik/exifr)（EXIF 解析）、[JSZip](https://stuk.github.io/jszip/)（客户端并发压缩）
- **自动化测试**：[Vitest](https://vitest.dev/)、[@testing-library/react](https://testing-library.com/)、[Playwright](https://playwright.dev/)

---

## 💻 本地开发与构建

### 环境要求
- Node.js 20 或 22 (`nvm use 22`)
- npm 10+

### 操作命令

```bash
# 克隆代码仓库
git clone https://github.com/your-username/tools_with_local.git
cd tools_with_local

# 安装依赖
npm install

# 启动本地开发服务器
npm run dev
# -> 开发服务运行于 http://localhost:3000/

# 运行自动化测试套件
npm test

# 生产环境编译打包 (含 TypeScript 类型检查)
npm run build
```

---

## 🔒 隐私与安全性保障

1. **零外部网络通信**：应用不包含任何第三方跟踪、埋点或数据收集代码。
2. **纯内存中运行**：文件通过浏览器 `FileReader` 读取为内存图像对象并在 Canvas 2D 上执行变换。
3. **不可逆底层覆写**：马赛克与纯色遮盖直接改变底层像素数据，不可被逆向剥离或还原。

---

## 📄 开源许可证

MIT License © 2026 tools local 贡献者.
