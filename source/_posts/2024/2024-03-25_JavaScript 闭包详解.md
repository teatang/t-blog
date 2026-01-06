---
title: JavaScript 闭包详解
date: 2024-03-25 06:24:00
tags:
  - 2024
  - JavaScript
  - 闭包
  - 编程语法
categories:
  - 前端技术
  - JavaScript
---

> **JavaScript 闭包 (Closure)** 是一个复杂但极其重要的概念，它允许函数访问并操作其**外部作用域 (Outer Scope)** 中的变量，即使该外部函数已经执行结束。换句话说，闭包是**函数**和该函数声明时所处的**词法环境 (Lexical Environment)** 的组合。这个词法环境包含了该函数在创建时能访问到的所有局部变量。

{% note info %}
核心思想：**函数“记住”并“携带”了它诞生时可以访问的外部变量，即便它脱离了诞生的环境被执行，这些变量也依然可用。** 闭包是 JavaScript 中实现私有变量、函数工厂、以及管理状态等高级编程模式的关键。
{% endnote %}
------

## 一、理解作用域和词法环境

要理解闭包，首先需要对 JavaScript 的**作用域 (Scope)** 和**词法环境**有清晰的认识。

1.  **词法作用域 (Lexical Scoping)**：
    JavaScript 采用词法作用域，这意味着函数的作用域在函数定义时就已经确定，而不是在函数调用时确定。函数可以访问其声明时所在的作用域，以及所有更外层的作用域。

    ```javascript
    function outer() {
        let name = "Alice"; // 外部作用域变量
        function inner() {
            console.log(name); // inner 可以访问 outer 的 name
        }
        inner();
    }
    outer(); // Output: Alice
    ```

2.  **词法环境 (Lexical Environment)**：
    每个执行上下文（如函数调用或全局代码）都有一个与之关联的词法环境。词法环境是一个内部数据结构，它包含两部分：
    *   **环境记录 (Environment Record)**：存储了当前作用域内所有声明的变量和函数。
    *   **外部环境引用 (Outer Environment Reference)**：指向外部（父）词法环境的引用。

    正是这个外部环境引用，使得函数能够层层向上查找变量，直到达到全局作用域。

## 二、闭包的定义和形成

当一个**内部函数 (Inner Function)** 被定义在另一个**外部函数 (Outer Function)** 内部，并且这个内部函数**引用了外部函数的局部变量**时，即使外部函数已经执行完毕并从调用栈中弹出，这个内部函数（及其对外部变量的引用）依然存在，这就形成了闭包。

**简单示例：**

```javascript
function makeGreeter(greeting) {
    // greeting 是外部函数的局部变量

    return function(name) { // 这是一个内部函数，它引用了 greeting
        console.log(greeting + ", " + name + "!");
    };
}

let helloGreeter = makeGreeter("Hello"); // makeGreeter 执行完毕，其作用域理论上应该被销毁
let hiGreeter = makeGreeter("Hi");       // 但 helloGreeter 和 hiGreeter 仍然“记住”了各自的 greeting

helloGreeter("Alice"); // Output: Hello, Alice!
hiGreeter("Bob");      // Output: Hi, Bob!

// 通过闭包，即使 makeGreeter 已经返回，其内部的 greeting 变量依然被保留，并可供返回的匿名函数访问。
```

在这个例子中：
*   `makeGreeter` 是外部函数，`greeting` 是它的局部变量。
*   `return function(name) { ... }` 是内部函数（匿名函数）。
*   当 `makeGreeter("Hello")` 被调用时，它返回了一个新的函数，这个新函数就是**闭包**。这个闭包“关闭”（捕获）了它创建时 `greeting` 变量的值 (`"Hello"`)。
*   当 `helloGreeter("Alice")` 被调用时，尽管 `makeGreeter` 已经执行完毕，`helloGreeter` 仍然能够访问到它所捕获的 `greeting` 变量。

## 三、闭包的常见用途

闭包在 JavaScript 中有广泛的应用场景：

### 3.1 模拟私有变量 (Private Variables)

JavaScript 本身没有传统意义上的私有变量（如 Java/C++ 中的 `private` 关键字）。闭包提供了一种机制，通过将变量封装在函数作用域内，使其只能通过特权方法（闭包）访问，从而模拟私有性。

**示例：计数器模块**

```javascript
function createCounter() {
    let count = 0; // 私有变量，只能通过返回的闭包访问

    return {
        increment: function() {
            count++;
            return count;
        },
        decrement: function() {
            count--;
            return count;
        },
        getCount: function() {
            return count;
        }
    };
}

let counter1 = createCounter();
console.log(counter1.increment()); // Output: 1
console.log(counter1.increment()); // Output: 2
console.log(counter1.getCount());  // Output: 2

let counter2 = createCounter(); // 另一个独立的计数器实例
console.log(counter2.increment()); // Output: 1 (不影响 counter1)
console.log(counter1.getCount());  // Output: 2 (counter1 的状态未变)

// console.log(counter1.count); // 错误：无法直接访问私有变量
```

### 3.2 创建函数工厂 (Function Factory) / 高阶函数

闭包可以用于动态创建具有特定预设行为的函数。

**示例：生成不同倍数的函数**

```javascript
function multiplyBy(factor) {
    return function(number) {
        return number * factor;
    };
}

let double = multiplyBy(2); // double 闭包捕获了 factor = 2
let triple = multiplyBy(3); // triple 闭包捕获了 factor = 3

console.log(double(5));  // Output: 10
console.log(triple(5)); // Output: 15
```

### 3.3 模块模式 (Module Pattern)

利用立即执行函数表达式 (IIFE) 和闭包，可以创建模块，封装变量和函数，只暴露特定的公共接口。

**示例：简单的模块**

```javascript
const myModule = (function() {
    let privateVar = "I am private"; // 私有变量

    function privateMethod() { // 私有方法
        console.log("This is a private method accessing:", privateVar);
    }

    return { // 公共接口
        publicMethod: function() {
            console.log("This is a public method.");
            privateMethod(); // 公共方法可以访问私有方法和变量
        },
        getPrivateVar: function() {
            return privateVar;
        }
    };
})(); // 立即执行函数表达式

myModule.publicMethod();   // Output: This is a public method. \n This is a private method accessing: I am private
console.log(myModule.getPrivateVar()); // Output: I am private
// console.log(myModule.privateVar); // 错误：无法直接访问
```

### 3.4 异步编程中的回调函数

在处理异步操作（如 `setTimeout`、AJAX 请求）时，闭包经常用于捕获迭代变量，确保回调函数在触发时访问到正确的值。

**示例：循环中的异步操作 (经典闭包问题)**

```javascript
// 错误的例子：i 变量会被所有 setTimeout 函数共享，最终都输出 3
console.log("--- 错误示例 ---");
for (var i = 1; i <= 3; i++) {
    setTimeout(function() {
        console.log("错误的 i:", i);
    }, i * 100);
}
// 预期输出：1, 2, 3
// 实际输出：错误的 i: 4, 错误的 i: 4, 错误的 i: 4 (因为循环更快，i 最终变为 4)
// [cite:]

// 正确的例子 (使用闭包解决)
console.log("--- 正确示例 (闭包) ---");
for (var j = 1; j <= 3; j++) {
    (function(num) { // 使用 IIFE 创建一个新的作用域，捕获当前的 j 值
        setTimeout(function() {
            console.log("正确的 j:", num);
        }, num * 100);
    })(j); // 将当前的 j 传给 IIFE
}
// 预期输出：正确的 j: 1, 正确的 j: 2, 正确的 j: 3
// [cite:]

// 更现代的解决方式 (使用 let 关键字)
// ES6 引入的 let 关键字具有块级作用域的特性，每次循环都会创建一个新的变量 i。
console.log("--- 正确示例 (let) ---");
for (let k = 1; k <= 3; k++) {
    setTimeout(function() {
        console.log("正确的 k:", k);
    }, k * 100);
}
// 预期输出：正确的 k: 1, 正确的 k: 2, 正确的 k: 3
```

## 四、闭包的优点与缺点

### 4.1 优点

*   **封装性**：实现数据的私有化，保护内部状态不被外部直接访问和修改。
*   **状态维护**：允许函数记住变量，从而在多次调用之间保持状态。
*   **模块化**：有助于构建更清晰的模块结构，实现低耦合。
*   **函数式编程**：是实现高阶函数、柯里化 (Currying) 等函数式编程模式的基础。

### 4.2 缺点

*   **内存消耗**：由于闭包会阻止外部作用域中被捕获变量的垃圾回收，如果闭包长时间不被释放，或意外捕获了大量不必要的变量，可能导致内存泄露或不必要的内存占用。
    ```javascript
    function createLargeClosure() {
        let largeData = new Array(1000000).fill("some data"); // 捕获一个大数组
        return function() {
            // 这个闭包即使只做很小的事情，也会一直引用 largeData
            console.log("Using large data closure.");
        };
    }

    let myClosure = createLargeClosure();
    // 此时 largeData 即使不再被 createLargeClosure 直接访问，也会因为 myClosure 的引用而存在
    // 如果 myClosure 长期存在，largeData 也不会被回收
    // myClosure = null; // 释放闭包后，largeData 才可能被回收
    ```
*   **性能开销**：创建闭包比创建非闭包函数需要更多的内存和处理开销，因为需要存储额外的词法环境。
*   **复杂性**：过度或不恰当地使用闭包可能使代码难以理解和调试。

## 五、总结

闭包是 JavaScript 中一个强大且无处不在的特性，它是理解 JavaScript 运行机制和编写高级、健壮代码的关键。它提供了模拟私有变量、创建函数工厂、实现模块模式以及在异步编程中管理作用域等多种能力。

虽然闭包可能带来额外的内存和性能开销，但在绝大多数情况下，这些开销是可接受的，并且其带来的代码组织和功能实现上的优势远大于其缺点。关键在于理解其工作原理，并根据具体需求，在增强代码功能和保持良好性能之间找到平衡。通过合理地使用闭包，开发者可以解锁 JavaScript 的强大潜力。