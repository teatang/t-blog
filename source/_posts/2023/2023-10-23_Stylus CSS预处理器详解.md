---
title: Stylus CSS预处理器详解
date: 2023-10-23 06:24:00
tags:
  - 2023
  - Stylus
  - 前端技术
  - CSS
categories:
  - 前端技术
  - CSS
---

> Stylus 是一个富有表现力、动态且功能强大的 CSS 预处理器。它由 TJ Holowaychuk（Pug 模板引擎的作者）创建，与 Less 和 Sass 齐名，是前端开发中提高 CSS 编写效率和可维护性的重要工具之一。Stylus 以其高度灵活和简洁的语法而著称，允许开发者以多种方式编写 CSS，包括类似原生 CSS 的语法、省略括号和冒号的缩进语法等。

{% note info %}
核心思想：**Stylus 通过灵活的语法（可省略分号、冒号、括号），提供变量、混合、函数、条件判断、循环等高级特性，使 CSS 编写更高效、模块化和可维护。**
{% endnote %}

## 一、Stylus 简介

### 1.1 什么是 CSS 预处理器？

CSS 预处理器是一种编程语言，它允许你使用变量、函数、混合 (Mixins)、嵌套、继承等编程特性来编写 CSS。这些预处理器代码最终会被编译成浏览器能够理解的标准 CSS。它们解决了传统 CSS 编程性差、难以维护和复用的问题。

常见的 CSS 预处理器包括：Sass/SCSS、Less 和 Stylus。

### 1.2 Stylus 的特点

*   **极度灵活的语法**：
    *   **可省略分号**：一行一个属性时，可省略分号。
    *   **可省略冒号**：属性名和属性值之间的冒号可省略。
    *   **可省略大括号**：嵌套规则时，大括号可省略，通过缩进来表示。
    *   **可省略 `@import`**：直接写文件名即可导入。
    *   **可省略圆括号**：在某些函数调用、条件语句中可以省略。
*   **功能强大**：支持变量、混合 (Mixins)、函数、条件判断 (`if`/`else`)、循环 (`for`/`in`)、逻辑运算符、算术运算等。
*   **内建函数和插件**：提供了丰富的内建函数，并支持通过 JavaScript 或 Stylus 自身编写插件。
*   **Node.js 环境**：基于 Node.js，与 Node.js 生态系统（如 Express、Webpack）无缝集成。
*   **简洁和表现力**：通过其灵活的语法，可以编写出非常简洁且富有表现力的样式代码。

### 1.3 适用场景

*   大型或复杂的 CSS 项目，需要高度模块化和可维护性。
*   追求极致简洁和灵活语法的开发者。
*   Node.js 生态下的前端项目。

## 二、Stylus 的安装与使用

Stylus 作为 Node.js 模块发布，通常通过 npm 或 yarn 进行安装。

### 2.1 安装

全局安装 (方便命令行使用)：
```bash
npm install -g stylus
# 或
yarn global add stylus
```
项目依赖安装 (推荐)：
```bash
npm install --save-dev stylus
# 或
yarn add --dev stylus
```

### 2.2 命令行编译

如果全局安装了 Stylus，可以直接在命令行编译 `.styl` 文件。

`style.styl`:
```stylus
body
  font 14px Arial, sans-serif
  color #333

p
  margin 10px 0
```

编译：
```bash
stylus style.styl -o style.css
# -o 或 --output 指定输出文件
# 监听文件变化并自动编译
stylus style.styl -w -o style.css
```
输出 `style.css`:
```css
body {
  font: 14px Arial, sans-serif;
  color: #333;
}
p {
  margin: 10px 0;
}
```

### 2.3 在 Node.js 项目中使用

在 Node.js 中，可以通过中间件（如 Express）或构建工具（如 Webpack）来集成 Stylus。

#### 2.3.1 Express 示例

```javascript
const express = require('express');
const stylus = require('stylus'); // 引入 stylus 模块
const path = require('path');
const app = express();
const port = 3000;

// 配置 stylus 中间件
app.use(stylus.middleware({
  src: path.join(__dirname, 'public'), // Stylus 文件的源目录
  dest: path.join(__dirname, 'public'), // 编译后的 CSS 输出目录
  compile: function(str, path) { // 编译函数，用于设置编译选项
    return stylus(str)
      .set('filename', path)
      .set('compress', true); // 是否压缩 CSS
  }
}));

// 设置静态文件目录，Express 会自动提供 public 目录下的文件
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('<h1>Hello Stylus!</h1><link rel="stylesheet" href="/style.css">');
});

// 确保 public 目录中有一个 style.styl 文件，Express 会将其编译为 /style.css
// public/style.styl
// body
//   background-color blue

app.listen(port, () => {
  console.log(`Stylus App running at http://localhost:${port}`);
});
```

#### 2.3.2 Webpack 示例 (需安装 `stylus-loader`)

```bash
npm install --save-dev stylus stylus-loader css-loader style-loader
# 或
yarn add --dev stylus stylus-loader css-loader style-loader
```

`webpack.config.js`:
```javascript
module.exports = {
  // ... 其他配置
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          'style-loader',      // 将 CSS 注入到 DOM
          'css-loader',        // 解析 CSS 中的 @import 和 url()
          'stylus-loader'      // 将 Stylus 编译为 CSS
        ]
      }
    ]
  }
};
```

## 三、Stylus 核心语法详解

### 3.1 变量

变量以 `$` 或不带前缀的标识符定义。

```stylus
// 使用 $ 前缀 (可选)
$primary-color = #3498db
$font-stack = Arial, sans-serif

body
  font-family $font-stack
  color $primary-color

// 不使用前缀
accent-color = #e74c3c

.button
  background-color accent-color
  padding 10px 20px
```
编译为：
```css
body {
  font-family: Arial, sans-serif;
  color: #3498db;
}
.button {
  background-color: #e74c3c;
  padding: 10px 20px;
}
```

### 3.2 混合器 (Mixins)

Mixins 允许你定义一组可重用的 CSS 属性。

```stylus
// 定义一个 Mixin
shadow(x = 0, y = 0, blur = 5px, color = rgba(0,0,0,.5))
  -webkit-box-shadow x y blur color
  -moz-box-shadow x y blur color
  box-shadow x y blur color

// 使用 Mixin
.card
  background-color #fff
  padding 20px
  shadow() // 使用默认参数

.icon
  display inline-block
  width 24px
  height 24px
  shadow(2px, 2px, 10px, rgba(0,0,0,.3)) // 传入自定义参数
```
编译为：
```css
.card {
  background-color: #fff;
  padding: 20px;
  -webkit-box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  -moz-box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  -webkit-box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  -moz-box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
}
```

### 3.3 嵌套 (Nesting)

嵌套允许你将相关的 CSS 规则组织在一起，提高可读性。

```stylus
.menu
  margin 0
  padding 0
  list-style none

  li
    display inline-block
    a
      display block
      padding 10px 15px
      text-decoration none
      color #333
    
      &:hover // & 代表父选择器 .menu li a
        background-color #eee
        color red
      
      p // 嵌套任意深
        font-size 12px
```
编译为：
```css
.menu {
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu li {
  display: inline-block;
}
.menu li a {
  display: block;
  padding: 10px 15px;
  text-decoration: none;
  color: #333;
}
.menu li a:hover {
  background-color: #eee;
  color: red;
}
.menu li a p {
  font-size: 12px;
}
```

### 3.4 导入 (Import)

使用 `@import` 导入其他 `.styl` 文件。Stylus 会自动查找文件。

`_vars.styl`:
```stylus
primary-color = #007bff
padding-base = 10px
```

`_buttons.styl`:
```stylus
.btn
  display inline-block
  padding padding-base * 1.5 padding-base * 2
  border-radius 4px
  background-color primary-color
  color #fff
  text-decoration none
```

`main.styl`:
```stylus
@import '_vars.styl' // 或者 @import '_vars'
@import '_buttons'

body
  font-family sans-serif
  color primary-color
```

### 3.5 函数 (Functions)

Stylus 允许你定义自己的函数，或者使用其丰富的内建函数。

```stylus
// 定义一个函数
add-px(n)
  return n + 'px'

// 使用函数
.box
  width add-px(100)
  height add-px(50)

// 使用内建函数 `lighten`
.dark-bg
  background-color #333
  color lighten(#333, 50%) // 将颜色亮度提高 50%
```
编译为：
```css
.box {
  width: 100px;
  height: 50px;
}
.dark-bg {
  background-color: #333;
  color: #bfbfbf;
}
```

### 3.6 条件判断 (`if`/`else`)

```stylus
rounded(radius = 5px)
  if radius is a 'string' or radius is a 'unit' and radius >= 0
    border-radius radius
  else
    warning('radius 必须为正值或字符串')

.avatar
  rounded(10px)

.square
  rounded(0)

.invalid
  rounded(-5px) // 会触发 warning
```

### 3.7 循环 (`for`/`in`)

```stylus
// 循环生成多个类
for i in 1..3
  .column-{i}
    width (100% / 3) * i 
  
// 遍历列表
colors = red green blue

for color in colors
  .text-{color}
    color color
```
编译为：
```css
.column-1 {
  width: 33.333333%;
}
.column-2 {
  width: 66.666667%;
}
.column-3 {
  width: 100%;
}
.text-red {
  color: #f00;
}
.text-green {
  color: #008000;
}
.text-blue {
  color: #00f;
}
```

### 3.8 运算符

支持各种算术、比较、逻辑运算符。

```stylus
container-width = 960px
gutter = 20px

.grid-item
  width (container-width - gutter * 2) / 3
  margin-right gutter

  &:last-child
    margin-right 0
```

## 四、Stylus 的灵活语法

Stylus 最显著的特点是其语法灵活性，它可以让你以多种方式书写，兼容性强。

例如，下面的所有 Stylus 语法都将被编译成相同的 CSS：

**标准 CSS 风格：**
```stylus
body {
  font-size: 14px;
  color: #333;
}
```

**省略分号：**
```stylus
body {
  font-size: 14px
  color: #333
}
```

**省略冒号和分号：**
```stylus
body {
  font-size 14px
  color #333
}
```

**省略大括号（缩进）：**
```stylus
body
  font-size 14px
  color #333
```

**完全省略（最简洁）：**
```stylus
body
  font-size 14px
  color #333

.header
  background-color #f0f0f0
  padding 10px
```

这种灵活性使得开发者可以根据个人喜好或团队规范选择最合适的书写方式。

## 五、Stylus 的优缺点

### 5.1 优点

*   **极度灵活的语法**：这是 Stylus 最大的亮点，允许开发者自由选择语法风格，可以写得像原生 CSS，也可以写得非常简洁。
*   **功能强大**：变量、混合、函数、条件、循环等一应俱全，满足复杂的 CSS 编写需求。
*   **JavaScript 扩展性**：可以轻松地在 Stylus 中调用 JavaScript 函数，甚至用 JavaScript 编写插件，提供了极高的扩展性。
*   **简洁明了**：在采用缩进语法时，代码行数明显减少，可读性高。
*   **基于 Node.js**：与 Node.js 生态系统完美融合，便于集成到现代前端工作流。

### 5.2 缺点

*   **生态系统相对较小**：相比于 Sass 和 Less，Stylus 的用户群体和第三方库（如 Mixin 库）规模较小。
*   **学习曲线**：虽然灵活，但对于新手来说，多种语法风格可能反而增加选择困难或混淆。
*   **调试稍复杂**：预处理器共同的缺点是编译后的 CSS 可能难以直接映射回源代码行数。
*   **社区支持**：虽然文档齐全，但遇到问题时，可能不如 Sass/Less 容易找到解决方案。

## 六、结语

Stylus 是一个优秀且功能强大的 CSS 预处理器，尤其适合那些追求极致简洁和语法灵活性的开发者。它提供了一套完整的特性集，可以帮助你编写出更结构化、可维护和高效的 CSS 代码。尽管其生态系统不如 Sass 庞大，但其独特的语法和强大的功能使其在 Node.js 生态中拥有自己的一席之地。如果你习惯了基于缩进的语法（如 Pug、YAML）或者喜欢自定义语法风格，那么 Stylus 将是一个非常值得尝试的选择。