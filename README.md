# tools local

本地离线多功能图像与隐私安全工具箱。所有操作均在浏览器本地端完成，零网络上传，断网亦可完整使用。

## 核心功能模块 (第一批全集)

### 1. 图片水印工作室
- 添加文字水印，支持多行文本与动态变量 `{{date}}`、`{{time}}`、`{{filename}}`。
- 支持全屏 50% 错位交错防伪平铺与九宫格定位。
- 支持无级调节字号、旋转方向（-180°~180°）、透明度、文字描边与立体阴影。
- 批量多图导入、剪贴板粘贴 (`Cmd/Ctrl + V`)、一键打包导出 ZIP。

### 2. 隐私遮挡 (Privacy Redaction)
- 支持框选（矩形）与自由涂抹（笔刷）两种形状。
- 支持三类脱敏效果：**马赛克 (Pixelate)**、**高斯模糊 (Gaussian Blur)**、**纯色覆盖 (Solid Fill)**。
- 颗粒大小、模糊半径、笔刷粗细自由调节。
- 撤销 (`Cmd/Ctrl + Z`)、清空、按住对比原图，底层像素级不可逆覆盖。

### 3. 照片信息清理 (EXIF Inspector & Cleaner)
- 离线解析手机/数码相机照片的完整 EXIF 元数据。
- 自动评估隐私风险等级：高精度 GPS 经纬度位置检测、拍摄时间戳、设备序列号与相机型号。
- 一键擦除全部 EXIF/GPS 敏感信息，支持单张下载与多图批量打包 ZIP。

### 4. 截图隐私处理 (Screenshot Privacy)
- 专为手机与电脑截屏打造的快速去敏感信息工具。
- 一键快速预设裁切：裁去 iOS 灵动岛/刘海状态栏、裁去 Android 顶部状态栏、裁去底部横条 (Home Bar)、裁去浏览器顶部标签栏。
- 四边自由像素级裁剪 (Top/Bottom/Left/Right)。
- 快速头像遮罩（圆形打码）与账号/昵称横条打码。

### 5. 证件分享副本 (ID Certified Copy)
- 制作身份证、驾驶证、护照、银行卡安全分享副本。
- 敏感字段一键脱敏：遮挡身份证号后 4 位、遮挡详细门牌住址、遮挡出生年月日。
- 法定防盗用途水印：自动覆写“仅供 [业务用途] [机构] 使用，有效期至 YYYY-MM-DD，他用无效，复印无效”。
- 支持标准 A4 核验纸张排版（带官方抬头与律法免责声明）与双面并排排版。

## 开发与构建

使用 Node.js 22 或兼容版本。

```bash
npm install
npm run dev          # 启动开发服务 http://localhost:3000
npm test             # 运行 Vitest 单元与组件测试 (13项测试全部通过)
npm run build        # TypeScript 类型检查与 Vite 生产打包
```

## 技术架构

- 前端框架：**React 19、TypeScript**
- 构建工具：**Vite 6**
- 界面样式：**Tailwind CSS 4、shadcn/ui 设计规范**
- 状态管理：**Zustand 5**
- 代码编辑器：**CodeMirror 6** (`@uiw/react-codemirror`)
- 测试框架：**Vitest、Testing Library、Playwright**
- 核心离线库：**HTML5 Canvas 2D、exifr、JSZip、canvas-confetti**
