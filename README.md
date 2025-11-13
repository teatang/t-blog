# 1024 维度技术博客

[![Hexo](https://img.shields.io/badge/Hexo-7.3.0-blue?logo=hexo)](https://hexo.io/)
[![Butterfly](https://img.shields.io/badge/Theme-Butterfly-blue)](https://butterfly.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-brightgreen?logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Container-blue?logo=docker)](https://www.docker.com/)

一个基于 Hexo 和 Butterfly 主题构建的技术博客，专注于编程、网络、安全等技术领域的深度解析文章。

## 🌐 博客预览

博客地址: https://blog.tbf1211.xx.kg

## 📚 博客特色

- **技术深度文章**: 涵盖 Python、Go、JavaScript、Vue、Web3、网络安全等多个技术领域
- **响应式设计**: 支持移动端和桌面端访问
- **暗黑模式**: 支持自动/手动切换主题模式
- **本地搜索**: 快速检索博客内容
- **评论系统**: 集成 Disqus 评论系统
- **数据分析**: 集成 Umami、百度、Google 等多种分析工具
- **SEO优化**: 支持站点地图、结构化数据等SEO功能

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone git@github.com:teatang/t-blog.git
cd t-blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或
npm run server
```

### 构建静态文件

```bash
# 清理缓存并生成静态文件
npm run build
```

### Docker 部署

```bash
# 运行容器
docker run -p 8080:80 tbf1211/t-blog:latest
```

## 📁 项目结构

```
.
├── source/
│   ├── _posts/           # 博客文章（按年份分类）
│   ├── _data/            # 数据文件（链接、说说等）
│   ├── img/              # 图片资源
│   └── self/             # 自定义 CSS 和 JavaScript
├── themes/               # 主题文件
├── public/               # 构建后的静态文件
├── _config.yml           # Hexo 主配置文件
├── _config.butterfly.yml # Butterfly 主题配置文件
├── package.json          # 项目依赖和脚本
└── Dockerfile            # Docker 配置文件
```

## 🛠️ 技术栈

- **静态站点生成器**: [Hexo](https://hexo.io/)
- **主题**: [Butterfly](https://butterfly.js.org/)
- **语言**: 中文
- **部署**: 静态部署 / Docker 容器化部署
- **包管理器**: pnpm

## 📝 内容创作

### 添加新文章

1. 在 `source/_posts/` 目录下创建新的 Markdown 文件
2. 文件命名格式: `YYYY-MM-DD_Title.md`
3. 添加 Front-matter 元数据

示例文章结构:
```markdown
---
title: 文章标题
date: 2025-01-01 12:00:00
tags:
  - 标签1
  - 标签2
categories:
  - 分类1
---

文章内容...
```

### 自定义样式和脚本

- 自定义 CSS: `source/self/btf.css`
- 自定义 JavaScript: `source/self/btf.js`

## ⚙️ 配置文件

- `_config.yml`: Hexo 核心配置
- `_config.butterfly.yml`: Butterfly 主题配置

## 📦 主要依赖

- hexo-theme-butterfly: ^5.4.3
- hexo-generator-searchdb: ^1.5.0
- hexo-wordcount: ^6.0.1
- hexo-deployer-git: ^4.0.0

## 📄 许可证

本博客内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证。

## 📞 联系方式

- 邮箱: tea.tang1211@gmail.com
- GitHub: [teatang](https://github.com/teatang)