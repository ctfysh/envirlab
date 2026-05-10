# Envirlab — 环境虚拟仿真实验平台

基于 [Insight Maker](https://insightmaker.com) 二次开发的系统动力学建模与仿真平台，用于[南京大学](https://www.nju.edu.cn)环境虚拟仿真实验教学。

南京大学环境虚拟仿真实验平台隶属于南京大学环境学院，开发团队由南京大学环境学院[袁增伟教授课题组](http://www.njumce.com)组成，主要成员有 [ctfysh](https://github.com/ctfysh)、[不白](https://github.com/Nowhitestar) 等人。

---

## 项目说明

本项目是 Insight Maker 的离线定制版本，已完全移除 Drupal 后端依赖（`save.php`、节点管理、用户认证等），所有功能均在浏览器中运行，无需任何后端服务。核心功能包括：

- 系统动力学建模（Stock/Flow 图、Agent 建模）
- 仿真模拟与结果可视化
- 模型保存与加载（本地文件下载）
- **多格式导入/导出**：InsightMaker XML (`.evl`)、ModelJSON (`.json`)、XMILE (`.xmile`)
- 中文界面
- **MathJax 数学公式渲染**：文本框支持 LaTeX 数学公式（行内 `\(...\)` 与行间 `$$...$$`）

---

## 快速开始

项目为纯前端静态应用，无需构建步骤：

1. 在本地启动一个 HTTP 服务器：

   ```bash
   # Python 3
   python -m http.server 8080

   # 或 Node.js
   npx serve .
   ```
2. 浏览器访问 `http://localhost:8080`

> 注意：本版本已完全移除所有后端依赖，所有功能均可在离线环境下使用。

---

## 键盘快捷键

| 快捷键 | 操作 |
| ------ | ---- |
| `Ctrl+S` / `⌘S` | 保存模型 |
| `Ctrl+Alt+N` / `⌥⌘N` | 新建模型 |
| `Ctrl+Alt+O` / `⌥⌘O` | 加载模型 |
| `Ctrl+L` / `⌘L` | 时间设置 |
| `Ctrl+Enter` / `⌘Enter` | 运行模拟 |
| `Ctrl+Z` / `⌘Z` | 撤销 |
| `Ctrl+Y` / `⌘Y` | 重做 |
| `Ctrl+C` / `⌘C` | 复制 |
| `Ctrl+X` / `⌘X` | 剪切 |
| `Ctrl+V` / `⌘V` | 粘贴 |
| `Ctrl+F` / `⌘F` | 查找/替换 |

---



## 文件格式

平台支持三种模型文件格式，可在 **文件 → 导入/导出** 菜单中访问：

| 格式 | 扩展名 | 说明 |
| ---- | ------ | ---- |
| **InsightMaker XML** | `.evl` | 原生 mxGraph 编码格式，完整保留所有模型信息（含 UI 布局、显示配置等）。 |
| **ModelJSON** | `.json` | 轻量 JSON 格式，适合程序化处理与跨工具交换。可通过 `ModelJSON.js` 在 Node.js 中读写。 |
| **XMILE** | `.xmile` | OASIS XMILE v1.0 标准格式，用于与其他系统动力学工具（如 Stella、Vensim）交换模型。 |

### ModelJSON 格式

```json
{
  "format": "InsightMaker-ModelJSON",
  "version": 1,
  "setting": { "TimeStart": "0", "TimeLength": "100", "TimeStep": "1", ... },
  "elements": [
    { "type": "Stock", "id": "3", "name": "库存", "InitialValue": "0", "geometry": { "x": 200, "y": 200, "width": 100, "height": 40 } },
    { "type": "Flow",  "id": "4", "name": "流入", "value": "rate", "sourceId": "3", "targetId": "5", "geometry": { "sourcePoint": { "x": 300, "y": 220 }, "targetPoint": { "x": 400, "y": 220 } } },
    { "type": "Variable", "id": "5", "name": "变量", "value": "10", "geometry": { "x": 400, "y": 200, "width": 100, "height": 40 } }
  ]
}
```

示例文件位于 `examples/` 目录：
- `pflow_sim_story.evl` / `pflow_sim_story.json` — 畜禽养殖磷流模拟（故事版）
- `pflow_sim_slide.evl` / `pflow_sim_slide.json` — 畜禽养殖磷流模拟（幻灯片版）

### XMILE

XMILE 导入使用 xmldom（已内置于 `js/xmldom.js`）进行解析，输出为 InsightMaker XML 后再加载到画布。
转换逻辑位于 `js/XMILEImporter.js`，支持 `<stock>`、`<flow>`、`<aux>`、`<connector>`、`<sim_specs>` 等基本元素类型。

> `examples/` 目录下的 `.json` 文件由 `loadInsightMaker()` + `toModelJSON()` 自动生成，
> 可用 `importModelJSON()` 重新导入。

---

## 主要依赖

| 库         | 用途                                   |
| ---------- | -------------------------------------- |
| ExtJS 4    | UI 框架（工具栏、对话框、布局）        |
| mxGraph    | 绘图与图形编辑（流程图/Stock-Flow 图） |
| ACE Editor | 代码/公式编辑器                        |
| jQuery     | DOM 操作                               |
| Raphaël   | 矢量图形渲染                           |
| MathJax 3 | 数学公式渲染（LaTeX 行内/行间公式）    |

---

## 修改记录

### 2026-05-10

- **文件操作快捷键**：新增「开始 → 文件」菜单的键盘快捷键，新建/加载/保存分别绑定 `Ctrl+Alt+N` / `Ctrl+Alt+O` / `Ctrl+S`（Mac 为 `⌥⌘N` / `⌥⌘O` / `⌘S`）。修复原有 `Ctrl+S` 未正确调用离线保存逻辑的问题。

### 2026-05-09

- **文本框 MathJax 数学公式支持**：Text 图元新增"使用数学公式"选项，勾选后标签支持 LaTeX 数学公式渲染（`$$...$$` 行间公式，`\(...\)` 行内公式）。使用 MathJax 3（tex-mml-chtml），仅对勾选的文本框进行渲染，不影响其他图元。
- **JSON 导入/导出**：新增 ModelJSON 格式的导入（`js/ModelImporter.js` / `importModelJSON`）与导出（`exportModelJSON`）功能。导出从 mxCodec XML 中提取单元格属性与几何数据；导入将 JSON 还原为 mxGraph XML 后解码到画布。
- **XMILE 导入/导出**：新增 `js/XMILEImporter.js`，实现 XMILE ↔ SimpleNode 树的双向转换，支持 OASIS XMILE v1.0 标准的 `<stock>`、`<flow>`、`<aux>`、`<connector>`、`<sim_specs>` 元素。
- **UI 菜单**：在导入菜单新增"JSON 文件..."，导出菜单新增"下载 JSON"；XMILE 导入按钮保留在导入菜单中。
- **示例文件**：将 `examples/` 中的 `.evl` 模型文件批量转换为 JSON 格式，便于程序化访问。
- **去重 UI 菜单**：注释掉"分享 → 导入 → 文件..."（与"开始 → 文件 → 加载"重复）和"分享 → 导出 → 下载"（与"开始 → 文件 → 保存"重复）。
- **新建重置**："开始 → 文件 → 新建"改为 `location.reload()`，确保所有设置和状态彻底重置。
- **JSON 导入/导出修复**：修正 `modelJSONToInsightMakerXML` 生成的 XML 结构（`<PrimitiveType>` 包裹 `<mxCell>` 而非反置），匹配 `.evl` 标准格式，JSON 导入/导出正常工作。

### 2026-05-08

- **移除虚假登录系统**：删除 `login/` 目录、登录图片、`logged_in` 变量及相关 Drupal 用户链接代码。当前版本无需登录即可使用。
- **移除后端服务依赖**：删除 `save.php` POST 调用，改为本地文件下载保存；移除所有 Drupal 节点管理链接（权限、删除、克隆、收藏）；移除文章发布功能（`StoryConverter.php`）；移除公开/私有/群组共享设置；移除 AddThis 分享按钮和嵌入代码生成。所有功能不再依赖外部后端服务。
- **界面全面中文化**：翻译所有 `getText()` 字符串及硬编码英文用户界面文本。
- **文档更新**：修复 URL 协议前缀，新增快速开始、依赖说明章节。

### 2018-08-29

- 更改主页默认界面

### 2018-08-28

1. 汉化
2. 文件保存和加载方式修改
3. 加载界面
4. 应用界面
5. 默认界面
6. 应用介绍

---

## 许可

本项目基于 Insight Maker 二次开发。

- 上游代码：Copyright 2010-2016 Scott Fortmann-Roe
- 见 [LICENSE.txt](./LICENSE.txt) 和 [Insight Maker Public License](https://InsightMaker.com/impl)
