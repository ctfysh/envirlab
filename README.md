# Envirlab — 环境虚拟仿真实验平台

基于 [Insight Maker](https://insightmaker.com) 二次开发的系统动力学建模与仿真平台，用于[南京大学](https://www.nju.edu.cn)环境虚拟仿真实验教学。

南京大学环境虚拟仿真实验平台隶属于南京大学环境学院，开发团队由南京大学环境学院[袁增伟教授课题组](http://www.njumce.com)组成，主要成员有 [ctfysh](https://github.com/ctfysh)、[不白](https://github.com/Nowhitestar) 等人。

---

## 项目说明

本项目是 Insight Maker 的离线定制版本，已完全移除 Drupal 后端依赖（`save.php`、节点管理、用户认证等），所有功能均在浏览器中运行，无需任何后端服务。核心功能包括：

- 系统动力学建模（Stock/Flow 图、Agent 建模）
- 仿真模拟与结果可视化
- 模型保存与加载（本地文件下载）
- 中文界面

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

## 主要依赖

| 库         | 用途                                   |
| ---------- | -------------------------------------- |
| ExtJS 4    | UI 框架（工具栏、对话框、布局）        |
| mxGraph    | 绘图与图形编辑（流程图/Stock-Flow 图） |
| ACE Editor | 代码/公式编辑器                        |
| jQuery     | DOM 操作                               |
| Raphaël   | 矢量图形渲染                           |

---

## 修改记录

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
