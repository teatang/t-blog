---
title: MathJax 详解：在 Web 上优雅地渲染数学公式
date: 2024-03-01 06:24:00
tags:
  - MathJax
  - LaTeX
  - 数学公式
  - Web开发
  - Markdown
categories:
  - 前端技术
  - 库
mathjax: true
---

> **MathJax** 是一个**开源的 JavaScript 显示引擎**，用于在所有现代浏览器中显示数学公式。它以高性能渲染高质量的排版，支持广泛使用的数学标记语言，如 **LaTeX**、**MathML** 和 **AsciiMath**。MathJax 的目标是让网页上的数学内容能够像桌面排版软件那样清晰、美观、易读，同时保持可访问性和可搜索性。

{% note info %}
**核心思想：** MathJax 使得在浏览器中显示复杂的数学公式变得**简单、美观且无需安装任何插件或字体**。它将数学标记语言转换为网页上可渲染的图形元素（通常是 HTML + CSS 或 SVG），确保跨平台和设备的显示一致性。
{% endnote %}
------

## 一、为什么选择 MathJax？

在 Web 上显示数学公式一直是一个挑战。传统的解决方案包括：

1.  **图片 (Images)**：将公式渲染成图片。
    *   **缺点**：不清晰（特别是缩放时）、不易编辑、不可搜索、不能复制文本、可访问性差（屏幕阅读器无法识别）。
2.  **纯文本 (Plain Text)**：使用 ASCII 字符近似表示公式（如 `x^2 + y^2 = r^2`）。
    *   **缺点**：可读性极差，无法表达复杂结构。
3.  **MathML (Mathematical Markup Language)**：W3C 标准的 XML 标记语言。
    *   **优点**：语义化。
    *   **缺点**：浏览器支持不一，编写复杂。
4.  **自定义字体 (Custom Fonts)**：需要用户安装特定字体。
    *   **缺点**：用户体验差，兼容性问题。

MathJax 旨在解决这些问题，提供一个**一劳永逸**的解决方案：

*   **高质量排版**：生成与桌面出版质量媲美的数学公式，清晰、美观。
*   **跨浏览器兼容**：支持所有主流浏览器，无需插件。
*   **自适应缩放**：公式可随页面文字自由缩放，且保持清晰。
*   **可访问性**：支持屏幕阅读器，公式文本可复制。
*   **可搜索性**：公式文本是 DOM 内容的一部分，可被搜索引擎索引。
*   **灵活性**：支持多种输入格式 (LaTeX, MathML, AsciiMath) 和多种输出格式 (HTML+CSS, SVG, CHTML)。
*   **易于集成**：只需几行 JavaScript 代码即可集成到任何网页中。

## 二、MathJax 的基本用法

集成 MathJax 到你的网页非常简单，通常只需要在 HTML 文件的 `<head>` 或 `<body>` 标签中添加一个 `<script>` 标签。

### 2.1 引入 MathJax 库

你可以从 MathJax 的 CDN (Content Delivery Network) 引入库文件。

**推荐方式 (MathJax v3):**
MathJax v3 引入了模块化和更快的加载速度。

```html
<!DOCTYPE html>
<html>
<head>
    <title>MathJax 示例</title>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <h1>MathJax 公式演示</h1>

    <p>这是一个行内公式：当 \(a \ne 0\) 时，方程 \(ax^2 + bx + c = 0\) 的解为 \(x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}\)。</p>

    <p>这是一个块级公式：</p>
    $$
    \int_0^\infty \frac{x^3}{e^x - 1} dx = \frac{\pi^4}{15}
    $$

    <p>你也可以使用传统的 LaTeX 块级公式分隔符：</p>
    \[
    \sum_{n=1}^\infty \frac{1}{n^2} = \frac{\pi^2}{6}
    \]
</body>
</html>
```

*   `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js`：这是一个包含 TeX (LaTeX)、MathML 输入和 CommonHTML 输出的 MathJax v3 主文件。
*   `async` 属性：确保 MathJax 脚本异步加载，不阻塞页面渲染。
*   `id="MathJax-script"`：为了方便 MathJax 内部识别和管理。

### 2.2 配置 MathJax (可选)

MathJax 提供了丰富的配置选项，你可以通过 `MathJax.startup.extend()` 或 `MathJax.config` 对象进行自定义。

**示例：修改 LaTeX 分隔符**
默认情况下，MathJax 支持以下 LaTeX 分隔符：
*   **行内公式 (Inline Math)**：`\( ... \)` 或 `$ ... $` (需要启用)
*   **块级公式 (Display Math)**：`\[ ... \]` 或 `$$ ... $$`

如果你想启用 `$ ... $` 作为行内公式分隔符，可以这样配置：

```html
<!DOCTYPE html>
<html>
<head>
    <title>MathJax 配置示例</title>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']] // 启用 $...$ 作为行内公式
            },
            svg: {
                fontCache: 'global' // SVG 输出的字体缓存策略
            }
        };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <p>这是一个用 $ 符号包围的行内公式：$E=mc^2$。</p>
    <p>这是一个用 \( \) 符号包围的行内公式：\(x^2+y^2=z^2\)。</p>
</body>
</html>
```

`window.MathJax` 对象必须在 MathJax 脚本加载之前定义。

## 三、数学标记语言：LaTeX 语法简介

MathJax 最常用且功能最强大的是对 **LaTeX (TeX)** 语法的支持。学习一些基本的 LaTeX 数学命令，你就能创建大多数常见公式。

### 3.1 行内公式与块级公式

*   **行内公式 (Inline Math)**：嵌入在文本行中的公式。
    *   使用 `\( ... \)` 或 `$ ... $` (如果启用)。
    *   示例：`\(E=mc^2\)` 显示为 $E=mc^2$
*   **块级公式 (Display Math)**：独立显示在一行或多行中，通常居中显示。
    *   使用 `\[ ... \]` 或 `$$ ... $$`。
    *   示例：`$$ \sum_{i=1}^n i = \frac{n(n+1)}{2} $$`
        $$ \sum_{i=1}^n i = \frac{n(n+1)}{2} $$

### 3.2 常用数学符号与结构

| 功能         | LaTeX 语法                      | 示例                                               | 渲染效果                                          |
| :----------- | :------------------------------ | :------------------------------------------------- | :------------------------------------------------ |
| 上下标       | `^` (上标), `_` (下标)          | `x^2`, `y_i`, `e^{ax^2+b}`, `x_{ij}`              | $x^2$, $y_i$, $e^{ax^2+b}$, $x_{ij}$              |
| 分数         | `\frac{分子}{分母}`             | `\frac{x+y}{2}`                                    | $\frac{x+y}{2}$                                   |
| 根号         | `\sqrt{内容}`, `\sqrt[n]{内容}`  | `\sqrt{x^2+y^2}`, `\sqrt[3]{8}`                     | $\sqrt{x^2+y^2}$, $\sqrt[3]{8}$                   |
| 积分         | `\int`, `\int_a^b`              | `\int f(x)dx`, `\int_0^\infty e^{-x}dx`            | $\int f(x)dx$, $\int_0^\infty e^{-x}dx$           |
| 求和         | `\sum`, `\sum_{i=1}^n`          | `\sum_{i=1}^n i`, `\sum_{n=0}^\infty \frac{1}{n!}` | $\sum_{i=1}^n i$, $\sum_{n=0}^\infty \frac{1}{n!}$ |
| 希腊字母     | `\alpha`, `\beta`, `\Gamma`     | `\alpha`, `\beta`, `\Gamma`, `\Delta`              | $\alpha$, $\beta$, $\Gamma$, $\Delta$             |
| 运算符       | `+`, `-`, `\times`, `\div`, `\pm` | `a \times b`, `p \pm q`                            | $a \times b$, $p \pm q$                           |
| 关系运算符   | `=`, `\ne`, `<`, `>`, `\le`, `\ge` | `A \ne B`, `x \le y`                               | $A \ne B$, $x \le y$                              |
| 括号         | `( )`, `[ ]`, `{ }`, `\| \|`    | `(x+y)`, `[a,b]`, `{ z }`, `\|v\|`                  | $(x+y)$, $[a,b]$, $\{ z \}$, $\|v\|$                  |
| 自动匹配括号 | `\left( ... \right)`             | `\left(\frac{1}{x} + \frac{1}{y}\right)`           | $\left(\frac{1}{x} + \frac{1}{y}\right)$          |
| 矩阵         | `\begin{pmatrix} ... \end{pmatrix}` | 见下方示例                                         |                                                   |
| 矢量         | `\vec{v}`, `\overrightarrow{AB}` | `\vec{v}`, `\overrightarrow{AB}`                   | $\vec{v}$, $\overrightarrow{AB}$                  |

**矩阵示例：**
```latex
$$
A = \begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```
$$
A = \begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

**分段函数示例：**
```latex
$$
f(x) = \begin{cases}
x^2 & \text{if } x < 0 \\
x+1 & \text{if } x \ge 0
\end{cases}
$$
```
$$
f(x) = \begin{cases}
x^2 & \text{if } x < 0 \\
x+1 & \text{if } x \ge 0
\end{cases}
$$

**常用函数**：`\sin`, `\cos`, `\log`, `\ln`, `\lim` 等会自动以正体显示。
例如：`\sin(x)`, `\lim_{x \to 0} \frac{\sin x}{x}`
显示为：$\sin(x)$, $\lim_{x \to 0} \frac{\sin x}{x}$

### 3.3 文本与空格

*   **文本**：在数学模式中插入普通文本，使用 `\text{...}` 或 `\mbox{...}`。
    *   示例：`$$ \sum_{i=1}^n i = \frac{n(n+1)}{2} \text{ for } n \ge 1 $$`
        $$ \sum_{i=1}^n i = \frac{n(n+1)}{2} \text{ for } n \ge 1 $$
*   **空格**：LaTeX 会自动调整公式中的空格。如果需要手动调整，可以使用：
    *   `\,` (小空格), `\;` (中空格), `\quad` (大空格), `\qquad` (特大空格)
    *   `\!` (负空格)

## 四、MathJax 的渲染输出

MathJax 可以根据浏览器和配置选择不同的输出格式：

1.  **CommonHTML (CHTML)**：MathJax v3 的默认输出。
    *   使用 HTML 和 CSS 渲染数学公式。
    *   **优点**：渲染速度快，占用内存少，打印效果好。
    *   **缺点**：在某些旧浏览器或特定字体环境下可能显示不如 SVG 完美。
2.  **SVG (Scalable Vector Graphics)**：
    *   使用 SVG 图形渲染公式。
    *   **优点**：缩放无锯齿，显示效果非常锐利，特别适合高分辨率屏幕。
    *   **缺点**：可能比 CHTML 稍慢，生成的 DOM 结构更复杂。
3.  **MathML**：如果浏览器原生支持 MathML，MathJax 也可以选择直接输出 MathML。
    *   **优点**：语义化，原生支持。
    *   **缺点**：浏览器支持不一致，且通常 MathJax 的渲染效果优于原生 MathML。

在 MathJax 配置中，你可以指定首选的输出格式。例如，要强制使用 SVG 输出：

```javascript
window.MathJax = {
    options: {
        renderActions: {
            add: [
                ['CHTMLorSVG', 10, function (doc) {
                    const preferred = MathJax.startup.output;
                    const chtml = preferred.constructor.name === 'CHTML';
                    doc.outputJax = (chtml ? MathJax.startup.get') : preferred);
                }, '', true],
            ]
        }
    },
    // 或者更简单的 MathJax v3 配置
    output: {
        force: 'svg' // 强制使用 SVG 输出
    }
};
```
或者，直接引入 SVG 相关的组件：
`https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js`

## 五、在 Markdown 中使用 MathJax

大多数支持 MathJax 的 Markdown 渲染器或平台 (如 GitHub Pages、Jupyter Notebooks、一些博客系统) 都允许你在 Markdown 文件中直接使用 LaTeX 语法来撰写公式。

**行内公式**：使用 `$E=mc^2$` 或 `\(E=mc^2\)`
**块级公式**：使用 `$$ \int_0^1 x^2 dx = \frac{1}{3} $$` 或 `\[ \frac{d}{dx} \sin x = \cos x \]`

**注意事项**：
*   **GitHub Pages**：默认不直接支持 MathJax。你需要手动在 `_layouts/default.html` 或其他布局文件中添加 MathJax 的 `<script>` 标签。
*   **Hexo, Hugo 等博客框架**：通常有插件或主题配置来启用 MathJax/KaTeX 支持。
*   **Markdown 编辑器**：有些编辑器内置了 MathJax 预览功能，如 Typora、VS Code 搭配插件。

## 六、高级特性与配置

*   **自定义宏 (Macros)**：定义自己的 LaTeX 命令，简化常用或复杂的表达式。
*   **自动编号 (Automatic Numbering)**：为块级公式自动添加编号。
*   **辅助功能 (Accessibility)**：支持 MathML 结构，方便屏幕阅读器识别。
*   **扩展包 (Extensions)**：支持多种 LaTeX 扩展包 (如 `amsmath`、`amssymb`)，提供更多数学符号和环境。
*   **动态内容**：MathJax 提供了 API 来处理通过 JavaScript 动态加载或修改的数学内容。

## 七、总结

MathJax 是一个强大而灵活的工具，它彻底改变了在 Web 上呈现数学公式的方式。通过利用其对 LaTeX 的广泛支持，开发者和内容创作者可以轻松地在网页上创建出专业、高质量且易于访问的数学内容，无需担心浏览器兼容性或复杂的排版问题。无论你是教育工作者、科学家、工程师，还是只是想在博客中分享一些数学思想，MathJax 都是你的理想选择。