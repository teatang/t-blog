---
title: Sass(SCSS)和Less CSS预处理器详解
date: 2023-09-19 06:24:00
tags:
  - 2023
  - Sass
  - Less
  - 前端技术
  - CSS
categories:
  - 前端技术
  - CSS
---

> Sass (Syntactically Awesome Style Sheets) 和 Less (Leaner Style Sheets) 是目前最流行的两种 CSS 预处理器。它们扩展了 CSS 语言的功能，允许开发者使用变量、混合 (Mixins)、嵌套、函数、继承等编程特性来编写样式，极大地提高了 CSS 的可维护性、代码复用性和开发效率。本篇将详细介绍 Sass 和 Less 的特性、语法以及它们之间的异同。

{% note info info %}
核心思想：**Sass 和 Less 通过添加编程语言特性（如变量、混合、嵌套、函数等），将样式代码模块化、动态化，最终编译为标准 CSS，从而提升 CSS 编写效率和可维护性。**
{% endnote %}

## 一、CSS 预处理器概述

### 1.1 为什么需要 CSS 预处理器？

传统的 CSS 有以下痛点：

*   **重复性**：颜色、字体大小等值可能在多处重复，修改时需要修改所有地方。
*   **可维护性差**：缺乏变量、函数等概念，难以模块化和抽象。
*   **没有逻辑性**：无法进行条件判断、循环等操作。
*   **选择器冗余**：深度嵌套的选择器导致代码量庞大。
*   **供应商前缀**：手动添加 `-webkit-`, `-moz-` 等前缀繁琐且易出错。

CSS 预处理器通过引入编程语言的特性来解决这些问题，让 CSS 编写从“苦力活”变成“编程”。

### 1.2 它们的工作原理

开发者编写 Sass 或 Less 代码（通常是 `.scss`, `.sass` 或 `.less` 文件），然后通过各自的编译器将这些代码转换成浏览器能够理解的标准 CSS 文件。这个编译过程可以在开发时自动完成，也可以在部署前手动执行。

## 二、Sass / SCSS 详解

### 2.1 Sass 简介

Sass (Syntactically Awesome Style Sheets) 诞生于 2007 年，是资格最老、功能最强大的 CSS 预处理器之一。它由 Ruby 语言开发。Sass 提供了两种语法：

1.  **Sass (缩进语法)**：这是早期版本的 Sass 语法，使用缩进代替大括号，用换行代替分号，类似于 Stylus 或 Python。文件扩展名为 `.sass`。
2.  **SCSS (Sassy CSS)**：Sass 3.0 引入的语法，完全兼容 CSS 语法。这意味着任何有效的 CSS 代码都是有效的 SCSS 代码。文件扩展名为 `.scss`。**SCSS 是目前 Sass 的主流和推荐语法。**

本文主要以 **SCSS** 语法进行讲解。

### 2.2 安装

Sass 最初基于 Ruby，现在主流的实现是 Dart Sass (由 Google 开发，推荐)。

```bash
# 全局安装 Dart Sass
npm install -g sass
# 或作为项目依赖
npm install --save-dev sass
```

### 2.3 核心特性 (SCSS 语法)

#### 2.3.1 变量 (Variables)

使用 `$` 符号定义变量，用于存储颜色、字体、尺寸等值。

```scss
// _variables.scss
$primary-color: #3498db;
$font-stack: Arial, sans-serif;
$base-spacing: 16px;

// main.scss
@import 'variables';

body {
  font-family: $font-stack;
  color: $primary-color;
  margin: $base-spacing;
}

h1 {
  color: darken($primary-color, 10%); // Sass 内置函数
}
```
编译为：
```css
body {
  font-family: Arial, sans-serif;
  color: #3498db;
  margin: 16px;
}

h1 {
  color: #2c81ba;
}
```

#### 2.3.2 嵌套 (Nesting)

允许将相关的 CSS 规则嵌套在父选择器中，避免重复编写父选择器。

```scss
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: inline-block;
    
      a {
        display: block;
        padding: 6px 12px;
        text-decoration: none;
        color: #333;

        &:hover { // & 表示父选择器 'nav ul li a'
          background-color: #eee;
          color: $primary-color;
        }
      }
    }
  }
}
```
编译为：
```css
nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
nav ul li {
  display: inline-block;
}
nav ul li a {
  display: block;
  padding: 6px 12px;
  text-decoration: none;
  color: #333;
}
nav ul li a:hover {
  background-color: #eee;
  color: #3498db;
}
```

#### 2.3.3 混合器 (Mixins)

使用 `@mixin` 定义可重用的样式块，然后用 `@include` 引入。可以接受参数。

```scss
@mixin border-radius($radius) {
  -webkit-border-radius: $radius;
  -moz-border-radius: $radius;
  border-radius: $radius;
}

.button {
  background-color: $primary-color;
  color: #fff;
  padding: 10px 15px;
  @include border-radius(5px); // 使用 mixin

  &--large {
    font-size: 1.2em;
    padding: 15px 20px;
  }
}

.card {
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  @include border-radius(3px);
}
```
编译为：
```css
.button {
  background-color: #3498db;
  color: #fff;
  padding: 10px 15px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
}
.button--large {
  font-size: 1.2em;
  padding: 15px 20px;
}
.card {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  -webkit-border-radius: 3px;
  -moz-border-radius: 3px;
  border-radius: 3px;
}
```

#### 2.3.4 继承 (`@extend`)

使用 `@extend` 允许一个选择器继承另一个选择器的所有样式，同时保持代码 DRY (Don't Repeat Yourself)。

```scss
.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.message--success {
  @extend .message; // 继承 .message 的所有样式
  border-color: green;
  color: green;
}

.message--error {
  @extend .message;
  border-color: red;
  color: red;
}
```
编译为：
```css
.message, .message--success, .message--error {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.message--success {
  border-color: green;
  color: green;
}

.message--error {
  border-color: red;
  color: red;
}
```
**注意：** `@extend` 会合并选择器，减少代码重复，但过度使用可能导致生成的 CSS 选择器链太长，增加复杂性。考虑优先使用 Mixins。

#### 2.3.5 函数 (Functions)

Sass 提供了丰富的内建函数（如颜色函数 `darken()`, `lighten()`, 数学函数 `round()`, 字符串函数 `to-upper-case()` 等），你也可以自定义函数。

```scss
@function calculate-column-width($total-width, $columns, $gutter) {
  @return ($total-width - ($columns - 1) * $gutter) / $columns;
}

.container {
  width: 960px;
  .col-4 {
    width: calculate-column-width(960px, 4, 20px);
  }
}
```

#### 2.3.6 控制指令 (`@if`, `@for`, `@each`, `@while`)

Sass 支持条件判断和循环，为 CSS 带来编程逻辑。

```scss
// @if / @else if / @else
@mixin text-style($theme: light) {
  @if $theme == light {
    color: #333;
    background-color: #fff;
  } @else if $theme == dark {
    color: #fff;
    background-color: #333;
  } @else {
    color: gray;
    background-color: lightgray;
  }
}

.light-box { @include text-style(light); }
.dark-box { @include text-style(dark); }

// @for
@for $i from 1 through 3 {
  .item-#{$i} { // 插值 #{}
    width: 100px * $i;
  }
}

// @each
$icons: facebook, twitter, instagram;
@each $icon in $icons {
  .icon-#{$icon} {
    background-image: url('/img/#{$icon}.png');
  }
}
```

#### 2.3.7 模块化 (`@import`)

使用 `@import` 导入 `.scss` 或 `.sass` 文件。如果导入的文件名以下划线开头（例如 `_variables.scss`），Sass 会将其视为局部文件，编译时不会单独输出为 CSS 文件。

```scss
// _base.scss
body { margin: 0; font-size: 16px; }

// _layout.scss
.container { max-width: 960px; margin: 0 auto; }

// style.scss
@import 'base';
@import 'layout';
@import 'variables'; // 假设 _variables.scss 存在
```

## 三、Less 详解

### 3.1 Less 简介

Less (Leaner Style Sheets) 诞生于 2009 年，是受 Sass 启发而创建的，旨在提供一种更“亲近”CSS 的预处理器。它基于 JavaScript 开发，可以直接在浏览器端或 Node.js 环境中编译。Less 的语法与 SCSS 非常相似，因为它也基于 CSS 的语法。

### 3.2 安装

```bash
# 全局安装 Less
npm install -g less
# 或作为项目依赖
npm install --save-dev less
```

### 3.3 核心特性

Less 的核心特性与 Sass 大同小异，但语法上存在细微差别。

#### 3.3.1 变量 (Variables)

使用 `@` 符号定义变量。

```less
// variables.less
@primary-color: #2980b9;
@font-stack: 'Helvetica Neue', Arial, sans-serif;
@base-spacing: 16px;

// main.less
@import 'variables.less';

body {
  font-family: @font-stack;
  color: @primary-color;
  margin: @base-spacing;
}

h1 {
  color: darken(@primary-color, 10%); // Less 内置函数
}
```

#### 3.3.2 嵌套 (Nesting)

与 Sass 类似。

```less
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: inline-block;
    
      a {
        display: block;
        padding: 6px 12px;
        text-decoration: none;
        color: #333;

        &:hover {
          background-color: #eee;
          color: @primary-color;
        }
      }
    }
  }
}
```

#### 3.3.3 混合器 (Mixins)

使用类选择器或 ID 选择器作为 Mixin，直接在其他选择器中引入。可以接受参数。

```less
.border-radius(@radius: 5px) { // 默认参数
  -webkit-border-radius: @radius;
  -moz-border-radius: @radius;
  border-radius: @radius;
}

.button {
  background-color: @primary-color;
  color: #fff;
  padding: 10px 15px;
  .border-radius(5px); // 使用 mixin
}

.card {
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  .border-radius(3px);
}
```
**注意：** Less 的 Mixin 默认也会将 Mixin 自身编译为 CSS。如果不想生成多余的 CSS，可以使用 `()` 或 `--` 后缀来定义静默 Mixin。
```less
.my-mixin() { // 静默 Mixin，不会被编译到 CSS
  color: blue;
}
.box {
  .my-mixin();
}
```

#### 3.3.4 继承 (`:extend`)

Less 使用 `:extend` 伪类进行继承，通常更倾向于使用 Mixins。

```less
.message {
  border: 1px solid #ccc;
  padding: 10px;
  color: #333;
}

.message--success {
  &:extend(.message); // 继承 .message
  border-color: green;
  color: green;
}
```

#### 3.3.5 函数 (Functions)

Less 也提供了各种内建函数（如颜色函数 `darken()`, `lighten()`, 数学函数 `round()`, 字符串函数 `e()` 等），并支持自定义函数。

```less
@fn-column-width(@total-width, @columns, @gutter) {
  @return (@total-width - (@columns - 1) * @gutter) / @columns;
}

.container {
  width: 960px;
  .col-4 {
    width: unit(@fn-column-width(960, 4, 20), px); // unit() 用于添加单位
  }
}
```

#### 3.3.6 控制指令 (Guard)

Less 没有 `@if`, `@for`, `@each` 等指令，但可以通过 Guard (类似于 Sass 的 `if` 混合器) 和循环 Mixin 来实现类似逻辑。

```less
// 模拟条件判断 (Guard)
.text-style(@theme) when (@theme = light) {
  color: #333;
  background-color: #fff;
}
.text-style(@theme) when (@theme = dark){
  color: #fff;
  background-color: #333;
}
.text-style(@theme) { // 默认情况
  color: gray;
  background-color: lightgray;
}

.light-box { .text-style(light); }
.dark-box { .text-style(dark); }

// 模拟循环 (Recursive Mixins)
.loop-columns(@index) when (@index > 0) {
  .column-@{index} {
    width: (100% / 3) * @index;
  }
  .loop-columns(@index - 1);
}
.loop-columns(3);
```

#### 3.3.7 模块化 (`@import`)

与 Sass 类似，但 Less 默认会尝试导入 `.less` 文件，也可以导入 `.css` 等其他文件。

```less
@import 'base.less';
@import 'layout.less';
// @import 'variables.less'; // 假设 variables.less 存在
```

## 四、Sass 与 Less 的异同

| 特性/Poin ts | Sass / SCSS                                     | Less                                                |
| :----------- | :---------------------------------------------- | :-------------------------------------------------- |
| **语法**     | `.scss` 像 CSS，`.sass` 是缩进语法             | 像 CSS，更简洁，但也支持一些可选的省略               |
| **变量**     | `$variable-name`                                | `@variable-name`                                    |
| **Mixin**    | `@mixin name { ... }` / `@include name`         | `.name() { ... }` / `.name;` (或 `.name()`)         |
| **Extend**   | `@extend .selector`                             | `&:extend(.selector)`                               |
| **嵌套**     | 支持，`&` 代表父选择器                          | 支持，`&` 代表父选择器                               |
| **函数**     | 丰富内置函数，可自定义 `@function`              | 丰富内置函数，可自定义 (通过 Mixins 或 Less.js API) |
| **条件/循环** | `@if`, `@for`, `@each`, `@while`                | 通过 Guard 和递归 Mixins 模拟                       |
| **实现语言** | Ruby Sass (deprecated), Dart Sass (主流，推荐)  | JavaScript                                          |
| **编译环境** | Node.js (Dart Sass), 各种构建工具               | Node.js, 浏览器, 各种构建工具                       |
| **生态**     | 庞大，有 Compass 等框架，社区活跃               | 活跃，但相对 Sass 略小                              |
| **学习曲线** | SCSS 接近 CSS，易上手；Sass 缩进语法需适应      | 接近 CSS，易上手                                    |

### 共同点

*   都提供了嵌套、变量、混合 (Mixins)、导入 (Import) 等核心功能。
*   都支持算术运算和各种内置函数（颜色处理、数学运算等）。
*   都致力于提高 CSS 的编写效率和可维护性。
*   都与现代前端构建工具链（Webpack, Gulp, Grunt）无缝集成。

### 主要差异

1.  **语法**：Sass 有两种语法（SCSS 兼容 CSS，Sass 缩进），Less 只有一种类似 CSS 的语法。SCSS 和 Less 在语法上非常接近。
2.  **变量前缀**：Sass 使用 `$`，Less 使用 `@`。
3.  **Mixin 的实现和调用**：Sass 使用 `@mixin` / `@include`，Less 使用类选择器或 ID 选择器作为 Mixin。
4.  **逻辑控制**：Sass 提供了更强大的 `@if`, `@for`, `@each` 等指令，Less 主要通过 Guard 和递归 Mixins 来实现条件和循环逻辑。
5.  **核心实现语言**：Sass (Dart Sass) 基于 Dart，Less 基于 JavaScript。这意味着 Less 可以直接在浏览器端运行（虽然不推荐用于生产环境）。
6.  **生态系统**：Sass 的生态系统（特别是工具和社区）相对更庞大和成熟。

## 五、如何选择？

*   **如果你追求最新最强大的功能和最活跃的社区**：**Sass (SCSS)** 是首选。它拥有更完善的功能集和更丰富的第三方库。
*   **如果你希望与现有 CSS 更高的兼容性，或需要在 Node.js / 浏览器端进行编译**：**Less** 是一个不错的选择，它的语法简洁且接近原生 CSS。
*   **如果你团队已经有特定技术栈**：遵循团队规范，沿用现有技术栈。

无论是 Sass 还是 Less，它们都是现代前端开发中不可或缺的工具。掌握其中之一，都能显著提升你的 CSS 开发体验。

## 六、结语

Sass 和 Less 都极大地革新了 CSS 的编写方式，将传统的样式表变成了功能丰富的编程语言。它们通过变量、混合、嵌套等特性，解决了原生 CSS 在大型项目中的痛点，使得 CSS 代码更加模块化、可复用和易于维护。选择哪一个取决于个人偏好、项目需求以及团队的技术栈，但无论选择哪个，都能让你的前端开发工作事半功倍。