---
title: DOM Clobbering 漏洞详解
date: 2025-06-07 06:24:00
tags:
    - 2025
    - 计算机网络
    - 网络安全
    - JavaScript
categories:
    - 计算机网络
    - 网络安全
---
> **DOM Clobbering (DOM 覆盖)** 是一种特殊的 Web 安全漏洞，它允许攻击者通过可控的 HTML 片段，意外地覆盖（"clobber"）或修改网页中的全局 JavaScript 变量、对象或属性。这种攻击方式利用了浏览器对带有 `id` 或 `name` 属性的 HTML 元素在全局 `window` 对象上创建引用或在 `document` 对象上创建属性的机制，从而篡改前端脚本的执行逻辑，最终可能导致 **XSS (Cross-Site Scripting)** 或其他客户端逻辑问题。

{% note info %}
**核心思想**：通过注入特定的 HTML 元素（通常带有 `id` 或 `name` 属性），欺骗浏览器，使其将这些 HTML 元素作为 JavaScript 代码中预期的全局变量或对象属性来处理，从而导致类型混淆或值替换。
{% endnote %}
------

## 一、为什么会存在 DOM Clobbering？

DOM Clobbering 漏洞的根源在于浏览器的一些**遗留特性 (Legacy Features)** 和 **JavaScript 的设计原则**：

1.  **全局命名空间污染**：浏览器为了方便，**将具有 `id` 属性的 HTML 元素自动作为 `window` 对象的属性暴露出来**。例如，如果页面中有一个 `<div id="foo">` 元素，那么在 JavaScript 代码中，可以直接通过 `window.foo`（或简写为 `foo`）来访问这个 `div` 元素。
2.  **`name` 属性的影响**：
    *   对于表单元素（`<form>`），其 `name` 属性会使其在 `document` 对象上可用，例如 `<form name="myForm">` 可以通过 `document.myForm` 访问。
    *   更重要的是，在表单内部，如果一个元素（如 `<input>`, `<select>`, `<textarea>`, `<button>`) 具有 `name` 属性，它可以通过 `formElement.elementName` 的方式访问。例如，`<form id="config"><input name="url">`，那么 `config.url` 将会指向这个 `<input>` 元素。
3.  **JavaScript 弱类型与自动类型转换**：JavaScript 是弱类型语言。当代码预期一个字符串或一个对象，但实际得到的是一个 HTML 元素时，JavaScript 会尝试进行类型转换。例如，访问 HTML 元素的 `href`、`value` 等属性时可能会返回期望的字符串，但如果将整个元素作为对象使用，则可能获得其 DOM 对象的引用。
4.  **`document.all` 集合**：虽然现代浏览器不推荐使用，但 `document.all` historically 提供了一个访问页面所有元素的方式，且它本身也是一个全局变量，可能会被 clobber。

这些特性在方便开发的同时，也为攻击者提供了通过注入 HTML 来操纵 JavaScript 执行环境的机会。

## 二、DOM Clobbering 核心机制

DOM Clobbering 的基本原理是通过构造带有特定 `id` 或 `name` 属性的 HTML 标签，来替换掉前端 JavaScript 代码中某个预期的全局变量或属性。

攻击的流程通常是：
1.  **识别目标**：攻击者需要找到应用中存在的**客户端 JavaScript 代码**，特别是那些访问全局变量或对象属性的地方，并且这些变量/属性的值可能导致安全问题（例如，用于构建 URL、动态执行代码、判断权限等）。
    *   例如：`window.someVariable`, `document.config`, `globalSettings.endpoint` 等。
2.  **构造 HTML**：攻击者注入一个 HTML 元素，其 `id` 或 `name` 属性与目标 JavaScript 变量或对象的属性名一致。
    *   `id` 属性最为常见，可以直接覆盖 `window` 上的同名属性。
    *   `name` 属性通常用于覆盖表单内的子元素，或某些特殊情况下的 `document` 属性。
    *   可以通过嵌套 HTML 元素结合 `id` 和 `name` 属性来覆盖深层对象属性。
3.  **触发漏洞**：当受害用户的浏览器解析包含攻击者注入的 HTML 片段时，这些 HTML 元素就会在全局 `window` 对象（或其他 DOM 对象）上创建对应的引用。当合法的 JavaScript 代码稍后执行并尝试访问这些变量/属性时，它将得到被注入的 HTML 元素，而不是预期的 JavaScript 值，从而改变程序行为。

### 核心可覆盖对象：

*   **`window` 上的属性**：通过 `<ANY_TAG id="propertyName">` 可以覆盖 `window.propertyName`。
*   **`document` 上的属性**：通过 `<form name="formName">` 可以覆盖 `document.formName`。
*   **对象属性的嵌套**：通过 `<form id="parentObj"><input name="childProp" value="evil">` 可以使 `parentObj` 成为 `<form>` 元素，而 `parentObj.childProp` 则成为 `<input>` 元素。

## 三、漏洞示例与攻击场景

以下是几种常见的 DOM Clobbering 攻击示例。

### 3.1 覆盖全局变量导致逻辑混淆 (基础 `id` 攻击)

**场景：** 页面中有一个全局配置对象，用于控制某个功能。
**合法 JavaScript 代码：**
```javascript
// index.js
var config = {
    isAdmin: false,
    debugMode: false,
    version: "1.0",
    apiUrl: "/api/v1"
};

// ... 页面中可能使用 config.isAdmin 来判断用户权限
if (config.isAdmin) {
    console.log("Welcome, Admin!");
    // grant admin privileges
} else {
    console.log("Welcome, User!");
}
```

**攻击者注入的 HTML：**
攻击者发现 `config` 变量可以被覆盖，并且 `isAdmin` 属性会被访问。
```html
<!-- 攻击者注入的 HTML 片段，通过某个 XSS 漏洞点进入页面 -->
<form id="config">
    <input name="isAdmin" value="true">
    <input name="apiUrl" value="javascript:alert('XSS by Clibbering!')">
</form>
```

**攻击效果：**
当上述 HTML 被浏览器解析后：
*   `window.config` 不再是原来的 `{ isAdmin: false, ... }` 对象，而变成了攻击者注入的 `<form id="config">` 元素。
*   当 JavaScript 代码尝试访问 `config.isAdmin` 时，它实际上是在访问 `formElement.isAdmin`，这个 `isAdmin` 属性是 `<input name="isAdmin">` 元素的一个 DOM 引用。
*   `formElement.isAdmin` 作为一个 HTML `input` 元素，在布尔上下文中通常是真值 (truthy)。因此 `if (config.isAdmin)` 可能会被评估为 `true`，从而**绕过权限检查**。
*   更进一步，如果页面中使用了 `config.apiUrl`，比如 `window.location.href = config.apiUrl;`，那么 `config.apiUrl` 将被 clobber 成 `<input name="apiUrl" value="javascript:alert('XSS by Clibbering!')">` 元素。当 `window.location.href` 尝试访问 `input` 元素的 `value` 属性时，就可能触发 XSS。

### 3.2 覆盖对象属性导致 XSS (嵌套 `id` 和 `name` 攻击)

这是最常见的攻击方式，利用了 `<a>` 标签或 `form` 标签内部元素的属性。

**场景：** 页面中有一个全局配置对象 `SETTINGS`，其中包含一个 URL，用于跳转或发起请求，但没有充分过滤 URL。
**合法 JavaScript 代码：**
```javascript
// app.js
var SETTINGS = {
    URL: "/default_dashboard",
    DEBUG: false
};

function navigateTo(path) {
    if (SETTINGS && SETTINGS.URL) {
        // ... 一些逻辑
        window.location.href = SETTINGS.URL; // 这是一个潜在的 XSS 点
    }
}

// 页面加载后立即调用
navigateTo();
```

**攻击者注入的 HTML (利用 `<a>` 标签):**
`<a>` 标签的 `href` 属性在被当作字符串上下文使用时，会自动返回其值。
```html
<a id="SETTINGS" href="javascript:alert(document.domain)"></a>
```
**攻击效果：**
1.  `<a id="SETTINGS" ...>` 元素被创建，`window.SETTINGS` 现在指向这个 `<a>` 元素。
2.  当 `navigateTo()` 执行 `window.location.href = SETTINGS.URL;` 时：
    *   `SETTINGS` 实际上是这个 `<a>` 元素。
    *   访问 `SETTINGS.URL` 将会返回 `<a id="SETTINGS">` 元素的 `href` 属性值，即 `javascript:alert(document.domain)`.
    *   `window.location.href` 被设置为 `javascript:alert(document.domain)`，触发 XSS。

**攻击者注入的 HTML (利用 `<form>` 和 `<input>`):**
这是一种更灵活的深层属性覆盖方式。
```html
<form id="SETTINGS">
    <input name="URL" value="javascript:alert(document.cookie)">
</form>
```
**攻击效果：**
1.  `<form id="SETTINGS">` 元素被创建，`window.SETTINGS` 现在指向这个 `<form>` 元素。
2.  当 `navigateTo()` 执行 `window.location.href = SETTINGS.URL;` 时：
    *   `SETTINGS` 实际上是 `<form>` 元素。
    *   `SETTINGS.URL` 将会返回 `<input name="URL">` 元素。
    *   当该 `<input>` 元素被赋值给 `window.location.href` 时，浏览器会尝试使用其 `value` 属性。
    *   因此，`window.location.href` 被设置为 `javascript:alert(document.cookie)`，触发 XSS。

### 3.3 绕过 CSP (Content Security Policy)

某些情况下，如果 CSP 依赖于可以通过 DOM Clobbering 覆盖的全局变量，攻击者可能利用此漏洞绕过 CSP。
例如，如果一个应用基于一个可以通过配置修改的全局变量来生成 `<script src="...">` 标签，而这个变量被 clobber 成了恶意 URL，即便有 CSP 限制，也可能导致问题。

## 四、漏洞影响

*   **XSS (Cross-Site Scripting)**：最常见的后果。攻击者可以通过执行任意 JavaScript 代码窃取用户凭证、会话信息、篡改页面内容等。
*   **逻辑劫持**：改变应用程序的预期行为，例如绕过权限检查、提交恶意数据。
*   **代码执行**：如果被覆盖的变量用于 `eval()` 或 `setTimeout()` 等函数，可以导致任意代码执行。
*   **信息泄露**：改变某些配置导致敏感信息传输到攻击者控制的服务器。
*   **沙箱逃逸**：在用户可控 HTML 在一个沙箱中渲染的场景（如富文本编辑器、Markdown 解析器）中，可以逃逸沙箱环境。

## 五、防御措施

防范 DOM Clobbering 漏洞需要从多个层面进行考虑：

1.  **严格过滤用户输入 (最重要)**：
    *   **白名单过滤**：对于任何可能包含 HTML 的用户输入，采用严格的白名单策略。只允许已知安全的标签和属性。
    *   **移除 `id` 和 `name` 属性**：如果不需要用户在输入的 HTML 中定义 `id` 或 `name`，则应将其完全移除。如果需要保留某些 `id` 或 `name` 属性，则必须对其值进行严格验证，确保不与已有的 JS 变量冲突。
    *   **上下文敏感转义**：对用户输入进行适当的 HTML 转义或编码，确保它们不会被解析为实际的 HTML 元素。

2.  **避免在全局作用域定义敏感变量或对象**：
    *   将所有敏感的配置、状态或函数封装在**模块**或**局部作用域**中，避免将其挂载到 `window` 对象上。
    *   使用 `const` 或 `let` 声明变量而不是 `var`。虽然 `const` 和 `let` 定义的变量不会像 `var` 那样直接创建 `window` 属性，但它们仍然可能受到影响（例如，如果它们是对象，其属性可能被 clobber）。**最根本的还是避免 `id/name` 属性值与 JavaScript 变量冲突。**

3.  **避免使用 `window[idOrName]` 形式访问 DOM 元素**：
    *   始终优先使用 `document.getElementById('someId')` 来获取 DOM 元素引用。这种方式不会受到 `id` 值与全局变量名的冲突影响。
    *   避免依赖 `document.forms.myForm.myInput` 这种非标准或老旧的访问方式。

4.  **明确检查类型和值**：
    *   在 JavaScript 代码中，当访问可能被 clobber 的变量时，**始终进行类型检查**。例如，预期一个字符串时，确保 `typeof config.url === 'string'`。预期一个对象时，检查它是否包含预期的属性，例如 `config && typeof config === 'object' && 'isAdmin' in config`。
    *   使用 `Object.prototype.hasOwnProperty.call(obj, 'prop')` 进行属性检查，而不是 `obj.prop`。

5.  **不依赖 `document.all`**：避免使用 `document.all`，它已经是一个过时的非标准属性，且易受攻击。

6.  **合理设置 Content Security Policy (CSP)**：
    *   部署严格的 CSP 作为纵深防御机制，限制可执行脚本的来源，阻止内联脚本和不信任域的资源加载。
    *   即使 DOM Clobbering 绕过了某些客户端逻辑，CSP 也能作为最后一道防线，阻止 XSS 有效载荷的执行。

7.  **使用现代前端框架**：
    *   Angular、React、Vue 等现代框架的开发模式通常不会将组件实例或内部状态直接暴露到全局 `window` 对象，从而自然地减少了 DOM Clobbering 的攻击面。它们通常通过虚拟 DOM 进行渲染，并且有自己的沙盒机制。

## 六、总结

DOM Clobbering 是一种相对隐蔽但后果严重的 Web 安全漏洞。它利用浏览器对带有 `id` 或 `name` 属性的 HTML 元素的特殊处理，允许攻击者通过可控的 HTML 片段，覆盖或修改关键的 JavaScript 变量和对象属性，最终导致 XSS、逻辑劫持等安全问题。

防范此漏洞的关键在于对**用户输入的严格过滤**，特别是对 HTML 元素的 `id` 和 `name` 属性进行处理，以及避免在全局作用域中定义敏感的 JavaScript 变量。同时，采用 `document.getElementById()` 等标准 DOM 访问方法，并进行严格的类型和值检查，也是重要的防御实践。