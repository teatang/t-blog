---
title: 深入理解虚拟 DOM 与 Vue 核心补丁机制：patch(), patchVnode(), updateChildren()
date: 2023-11-15 06:24:00
tags:
  - 2023
  - Vue
  - 前端技术
  - JavaScript
  - 数据结构
categories:
  - 前端技术
  - Vue
---

> 现代前端框架如 Vue 和 React 之所以能提供高性能和优秀的开发体验，很大程度上要归功于 **虚拟 DOM (Virtual DOM)** 及其配套的 **Diff 算法 (补丁机制)**。虚拟 DOM 充当了真实 DOM 的一个轻量级抽象层，而 Vue 的补丁机制则负责将虚拟 DOM 的变化高效地反映到真实的浏览器 DOM 上。本文将深入解析虚拟 DOM 的概念，并聚焦 Vue 2 中驱动这一机制的三个核心函数：`patch()`, `patchVnode()`, 和 `updateChildren()`，并辅以 Mermaid 流程图进行可视化说明。

{% note info %}
“虚拟 DOM 是前端性能优化的基石，而 Vue 的 `patch()` 系列函数正是将这块基石转化为实际渲染效率的魔法棒。”
{% endnote %}
------

## 一、虚拟 DOM (Virtual DOM) 再探

### 1.1 什么是虚拟 DOM？

虚拟 DOM 是一个用 JavaScript 对象来模拟真实 DOM 节点的数据结构。它是一个轻量级的、内存中的真实 DOM 树的抽象。每一个虚拟节点（VNode）都包含构建一个真实 DOM 节点所需的所有信息，例如：

*   `tag`：标签名（如 `div`、`p`，或者组件的配置对象）。
*   `data`：一个对象，包含 DOM 元素的属性（`attrs`）、样式（`style`）、事件（`on`）、`key`、`class` 等。
*   `children`：一个 VNode 数组，表示当前 VNode 的子节点。
*   `text`：如果 VNode 是一个文本节点，则为文本内容。
*   `elm`：对实际 DOM 元素的引用（在补丁 (`patch`) 过程中会被赋值）。

### 1.2 为什么需要虚拟 DOM？

1.  **性能优化**：直接操作真实 DOM 是非常耗费性能的。虚拟 DOM 将频繁的 DOM 操作集中起来，通过 Diff 算法计算出最小的变更集，然后一次性（批量）地更新真实 DOM，显著减少了重绘和回流的次数。
2.  **开发体验**：开发者只需关注数据的变化和组件状态，无需手动操作复杂的 DOM API，提高了开发效率。
3.  **跨平台能力**：因为虚拟 DOM 只是 JavaScript 对象，它可以被渲染到不同的平台（如 Web 浏览器、Native 应用、小程序等），而不仅仅是浏览器环境。

### 1.3 虚拟 DOM 到真实 DOM 的过程

{% mermaid %}
graph TD
    A[Vue 组件数据/状态变化] --> B(render 函数生成新的 VNode 树)
    B --> C{Diff 算法 / patch 函数}
    D[旧的 VNode 树 （上次渲染结果）] --> C
    C --> E[生成补丁集 （最小差异）]
    E --> F[更新真实 DOM]
{% endmermaid %}

## 二、Vue 补丁机制核心函数解析

当 Vue 的响应式数据发生变化时，如果组件被标记为需要重新渲染，它会重新执行 `render` 函数生成一颗新的 VNode 树。接下来，Vue 的渲染器会调用 `patch()` 函数，负责比较新旧 VNode 树并更新真实 DOM。

### 2.1 `patch(oldVnode, newVnode)`：差异发现与更新的入口

`patch()` 函数是整个渲染更新过程的入口。它的主要职责是根据 `oldVnode` 和 `newVnode` 的不同情形，执行相应的 DOM 操作，包括创建、更新或删除元素。

{% mermaid %}
graph TD
    start("patch（oldVnode, newVnode）") --> A{oldVnode是真实DOM元素?<br>（如 #app 首次挂载）};
    A -- 是, 首次挂载 --> B[创建 newVnode.elm <br>并替换真实DOM];
    A -- 否 --> C{newVnode 存在?};
    C -- 否, oldVnode需删除 --> D[移除 oldVnode.elm];
    C -- 是 --> E{newVnode是文本VNode?};
    E -- 是, 文本节点 --> F[更新 oldVnode.elm.textContent<br> = newVnode.text];
    E -- 否 --> G{sameVnode（oldVnode, <br>newVnode）相同VNode?};
    G -- 是, 相同VNode --> H(patchVnode（oldVnode, <br>newVnode）);
    G -- 否, 不同VNode --> I[销毁 oldVnode.elm, <br>创建并插入 newVnode.elm];
    B --> K[返回 newVnode.elm];
    F --> K;
    H --> K;
    I --> K;
{% endmermaid %}

**关键逻辑点**：

1.  **首次渲染 (Initial Mount)**：
    *   如果 `oldVnode` 是一个真实 DOM 元素（通常是 `el` 选项提供的挂载点，如 `document.querySelector('#app')`），则 `newVnode` 会被完全创建并插入到 DOM 中，替换掉 `oldVnode`，并建立 `newVnode.elm` 对真实 DOM 的引用。
2.  **更新 (Update)**：
    *   如果发现 `sameVnode(oldVnode, newVnode)` 返回 `true`（即它们代表同一个元素，主要通过 `key` 和 `tag` 判断），则进入 `patchVnode()` 进行更细致的比较和更新。
    *   如果返回 `false`（它们不是 `sameVnode`），说明它们是完全不同的元素。此时，`oldVnode` 对应的真实 DOM 会被销毁，然后创建并插入 `newVnode` 对应的真实 DOM。
3.  `newVnode` 不存在（`undefined`）：这意味着 `oldVnode` 对应的元素需要被移除。

### 2.2 `patchVnode(oldVnode, newVnode)`：同类节点的深度比对与更新

`patchVnode()` 是 `patch()` 函数中用于处理**被认为是相同 VNode** 的深度比较和更新的函数。它会对比两个 VNode 的属性、事件、子节点等，并执行最小化的 DOM 操作。

**Mermaid 流程图**：
{% mermaid %}
graph TD
    start("patchVnode（oldVnode，newVnode）开始") --> A[newVnode.elm = oldVnode.elm（复用真实DOM）];
    A --> B{oldVnode与newVnode的data（如props/style/event）不同?};
    B -- 是 --> C[更新oldVnode.elm上的属性和事件];
    B -- 否 --> D;
    C --> D;

    D{newVnode有子节点?};
    D -- 是 --> E{oldVnode有子节点?};
    E -- 是, 新旧都有子节点 --> F(updateChildren（oldVnode.children, newVnode.children）);
    E -- 否, 旧只有文本或空 --> G[清空oldVnode.elm内容, 添加newVnode的所有子节点];
    F --> O("结束");
    G --> O;

    D -- 否, newVnode无子节点 --> H{oldVnode有子节点?};
    H -- 是, 旧有子节点需移除 --> I[移除oldVnode.elm的所有子节点];
    H -- 否 --> J;
    I --> J;

    J{newVnode有文本内容?};
    J -- 是 --> K[设置 oldVnode.elm.textContent = newVnode.text];
    J -- 否 --> L{oldVnode有文本内容?};
    L -- 是 --> M[清空 oldVnode.elm.textContent];
    L -- 否 --> O;
    K --> O;
    M --> O;
{% endmermaid %}

**关键逻辑点**：

1.  **复用 DOM 元素**：`newVnode.elm = oldVnode.elm`。由于它们是 `sameVnode`，所以它们对应的真实 DOM 元素可以被复用。
2.  **更新 VNode 的数据 (Props, Style, Class, Event Listener 等)**：`updateAttrs(oldVnode, newVnode)` 等方法会对比 `oldVnode.data` 和 `newVnode.data`，只更新变化的属性，移除不再存在的属性，并重新绑定事件。
3.  **处理子节点**：这是最复杂也是最重要的部分。
    *   **新旧 VNode 都有子节点**：调用 `updateChildren(oldVnode.children, newVnode.children)` 进行子节点列表的 Diff 比较。
    *   **新 VNode 有子节点，旧 VNode 没有**：清空旧的 DOM 元素内容，然后将 `newVnode.children` 全部添加到 DOM 中。
    *   **新 VNode 没有子节点，旧 VNode 却有**：则直接移除 `oldVnode` 的所有子节点对应的真实 DOM。
    *   **处理文本节点**：如果新 VNode 有文本内容 (`newVnode.text` 存在)，则将 DOM 元素的 `textContent` 设置为 `newVnode.text`。如果旧 VNode 有文本内容 (`oldVnode.text` 存在) 但新 VNode 既没有子节点也没有文本内容，则清空 DOM 元素的 `textContent`。

### 2.3 `updateChildren(oldChildren, newChildren)`：子节点列表的 Diff 算法核心

`updateChildren()` 是 Vue 2 Diff 算法的核心，它采用**双端比较算法 (Two-Pointer Diff Algorithm)** 来高效地比对新旧子 VNode 列表，最大限度地复用和移动 DOM 元素，减少不必要的创建和销毁。

**Mermaid 流程图**：
{% mermaid %}
graph TD
    start("开始") --> A[初始化四个指针:<br>oldStartIdx, oldEndIdx<br>newStartIdx, newEndIdx];

    A --> B{"while (oldStartIdx <= oldEndIdx<br>&& newStartIdx <= newEndIdx)"};

    B -- 是 --> GetNodes[获取当前VNode:<br>oldStartV, oldEndV<br>newStartV, newEndV];

    GetNodes --> SkipOldStart{oldStartV 为空?};
    SkipOldStart -- 是 --> IncOldStart[oldStartIdx++];
    SkipOldStart -- 否 --> SkipOldEnd{oldEndV 为空?};
    SkipOldEnd -- 是 --> DecOldEnd[oldEndIdx--];
    SkipOldEnd -- 否 --> MatchHeadHead{"sameVnode(oldStartV, newStartV)?"};

    MatchHeadHead -- 是 --> PatchHeadHead["patchVnode(头头),<br>oldStartIdx++, newStartIdx++"];
    MatchHeadHead -- 否 --> MatchTailTail{"sameVnode(oldEndV, newEndV)?"};

    MatchTailTail -- 是 --> PatchTailTail["patchVnode(尾尾),<br>oldEndIdx--, newEndIdx--"];
    MatchTailTail -- 否 --> MatchOldHeadNewTail{"sameVnode(oldStartV, newEndV)?"};

    MatchOldHeadNewTail -- 是 --> PatchOldHeadNewTail["patchVnode(旧头新尾),<br>移动 oldStartV DOM到oldEndV DOM之后,<br>oldStartIdx++, newEndIdx--"];
    MatchOldHeadNewTail -- 否 --> MatchOldTailNewHead{"sameVnode(oldEndV, newStartV)?"};

    MatchOldTailNewHead -- 是 --> PatchOldTailNewHead["patchVnode(旧尾新头),<br>移动 oldEndV DOM到oldStartV DOM之前,<br>oldEndIdx--, newStartIdx++"];
    MatchOldTailNewHead -- 否 --> FallbackStrategy["通用匹配 (Fallback):<br>1. 尝试在 oldChildren 中查找 newStartV 的匹配VNode (By Key)<br>2. 如果找到: patchVnode, 移动DOM, 标记旧VNode已处理<br>3. 否则: 创建 newStartV 对应的DOM并插入<br>4. newStartIdx++"];

    IncOldStart --> B;
    DecOldEnd --> B;
    PatchHeadHead --> B;
    PatchTailTail --> B;
    PatchOldHeadNewTail --> B;
    PatchOldTailNewHead --> B;
    FallbackStrategy --> B;

    B -- 否 --> CheckNewRemaining{"newStartIdx <= newEndIdx?<br>(新节点剩余 - 新增)"};
    CheckNewRemaining -- 是 --> InsertRemaining[批量插入剩余新节点];
    CheckNewRemaining -- 否 --> CheckOldRemaining{"oldStartIdx <= oldEndIdx?<br>(旧节点剩余 - 删除)"};

    CheckOldRemaining -- 是 --> RemoveRemaining[批量移除剩余旧节点];
    CheckOldRemaining -- 否 --> endNode("结束");

    InsertRemaining --> endNode;
    RemoveRemaining --> endNode;
{% endmermaid %}


**关键逻辑点**：

1.  **双端四向比较**：
    *   Vue 的 Diff 算法会维护 `oldStartIdx` (旧开始索引), `oldEndIdx` (旧结束索引), `newStartIdx` (新开始索引), `newEndIdx` (新结束索引) 四个指针。
    *   在循环中，它优先尝试从新旧子节点列表的头部和尾部进行四种快速匹配：
        *   **头头匹配 (`oldStart` vs `newStart`)**：如果匹配，就地更新，两者指针都向右移动。
        *   **尾尾匹配 (`oldEnd` vs `newEnd`)**：如果匹配，就地更新，两者指针都向左移动。
        *   **旧头新尾匹配 (`oldStart` vs `newEnd`)**：如果匹配，说明旧的头节点移动到了新的尾部，更新后将对应的真实 DOM 移动到 `oldEndVnode` 对应的 DOM 之后。
        *   **旧尾新头匹配 (`oldEnd` vs `newStart`)**：如果匹配，说明旧的尾节点移动到了新的头部，更新后将对应的真实 DOM 移动到 `oldStartVnode` 对应的 DOM 之前。
    *   一旦匹配成功，就调用 `patchVnode` 更新节点，并根据匹配类型移动真实 DOM，同时移动相应的指针。
2.  **Fallback 策略（通过 `key` 查找）**：
    *   如果上述四种情况都未匹配，Vue 会为 `oldChildren` 中未处理的节点建立一个 `key` 到索引的映射表。
    *   然后尝试在新列表的 `newStartVnode` 中查找其 `key` 是否在旧列表中存在。
    *   如果找到相同 `key` 且是 `sameVnode` 的旧节点：就 `patchVnode`，并将其对应的真实 DOM 移动到正确的位置。旧节点会被标记为已处理。
    *   如果没找到或 `key` 不同但 `isSameVnode` 失败，则说明 `newStartVnode` 是一个全新的节点，需要创建并插入其对应的真实 DOM。
3.  **循环结束后的处理**：
    *   **新增节点**：如果循环结束后，`newChildren` 中仍有未处理的节点（`newStartIdx <= newEndIdx`），说明它们是新添加的，需要创建并插入到 DOM 中。
    *   **删除节点**：如果循环结束后，`oldChildren` 中仍有未处理的节点（`oldStartIdx <= oldEndIdx`），说明它们在 `newChildren` 中不存在，需要从 DOM 中移除。

### 2.4 `key` 属性的决定性作用

在 `updateChildren()` 中，`key` 属性起着至关重要的作用。它为每个 VNode 提供了唯一的身份标识。

*   **唯一性**：`key` 在同级 VNode 中必须是唯一的。
*   **稳定性**：`key` 值应保持稳定，不应随机生成或使用数组索引（除非列表是静态的且永不变化）。
*   **作用**：
    *   **精确识别**：Vue 能够利用 `key` 精准地判断哪些 VNode 是同一个元素，只是位置变了，哪些是新增或删除的。
    *   **高效复用**：当 VNode 顺序变化时，拥有相同 `key` 的真实 DOM 元素和组件实例能够被尽可能地复用、移动，而不是销毁重建，从而保持组件内部状态（如输入框的焦点、滚动位置等）。
    *   **性能优化**：避免不必要的 DOM 操作，特别是在列表数据发生增删改排序时。

## 三、总结

虚拟 DOM 和 Vue 的 `patch()` 机制是其高性能和良好开发体验的基石。

*   `patch()` 是整个更新流程的入口，负责根据新旧 VNode 的不同类型和关系，决定是创建、更新还是删除 DOM 节点。
*   `patchVnode()` 专注处理被认为是同一元素的 VNode 之间的深度比较，更新它们的属性、样式和事件，并递归处理它们的子节点。
*   `updateChildren()` 作为 Diff 算法的核心，通过巧妙的双端比较和 `key` 属性的辅助，高效地比对子节点列表，并执行最小化的 DOM 移动、插入和删除操作。

理解这些核心函数的工作原理，不仅有助于深入掌握 Vue 的渲染机制，更能帮助我们写出更高效、更健壮的 Vue 应用。 Vue 3 虽然在细节上有所优化（如引入 PatchFlag 和 LIS 算法），但其核心的 Diff/Patch 理念和 `sameVnode`、深度比较与子节点处理的模式是一脉相承的。Mermaid 图为理解这些复杂流程提供了直观的视觉辅助。

---