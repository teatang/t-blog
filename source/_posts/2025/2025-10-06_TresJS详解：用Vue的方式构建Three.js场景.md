---
title: TresJS详解：用Vue的方式构建Three.js场景
date: 2025-10-06 06:24:00
tags:
  - 2025
  - 前端技术
  - Three.js
  - TresJS
  - Vue
  - WebGL
categories:
  - 前端技术
  - WebGL
---

> **TresJS** 是一个基于 [Vue.js](https://vuejs.org/) 和 [Three.js](https://threejs.org/) 的声明式 3D 渲染框架。它允许开发者像编写 Vue 组件一样，通过声明式的方式构建复杂的 Three.js 场景，从而大大降低 Three.js 的学习曲线和开发复杂度，特别适合 Vue 开发者快速进入 3D 领域。

{% note info %}
核心思想：**将 Three.js 对象抽象为 Vue 组件，用 Vue 的响应式和组件化思维管理 3D 场景。**
{% endnote %}

## 一、什么是 TresJS？

Three.js 是一个强大的 JavaScript 3D 库，用于在浏览器中创建和渲染 3D 图形。然而，直接使用 Three.js API 需要编写大量的命令式（或说是“指令式”）代码来创建几何体、材质、网格、灯光、摄像机、场景以及设置渲染循环等。这对于不熟悉 3D 图形编程的开发者来说，上手较难，且代码维护复杂。

TresJS 的出现就是为了解决这个问题。它提供了一套 Vue 组件，每个组件都对应 Three.js 中的一个核心概念（如 `<TresCanvas>`, `<TresMesh>`, `<TresPerspectiveCamera>`, `<TresAmbientLight>` 等）。通过这些组件，你可以：

*   **声明式构建场景**：像 Vue 模板一样嵌套组件，直接在模板中描述 3D 场景的结构。
*   **响应式数据绑定**：利用 Vue 的响应式系统，数据的变化会自动触发 3D 场景的更新。
*   **组件化开发**：将复杂的 3D 元素封装成可复用的 Vue 组件。
*   **TypeScript 支持**：提供良好的类型推断。

TresJS 并不是对 Three.js 的简单封装，它更像是一个 Vue 的渲染器或编译器，能够将 Vue 的虚拟 DOM 转换为 Three.js 的场景对象。

## 二、为什么选择 TresJS？

1.  **降低 Three.js 学习门槛**：如果你熟悉 Vue.js，那么 TresJS 会让你对 Three.js 的概念理解和使用变得更加直观。
2.  **提高开发效率**：声明式 API 减少了大量的手动对象创建、属性设置和渲染循环管理的代码。
3.  **更好的代码组织**：将 3D 场景分解为独立的、可复用的 Vue 组件，提高了代码的可维护性和可读性。
4.  **Vue 生态集成**：可以无缝地与其他 Vue 生态工具（Vue Router, Pinia, Vite 等）集成。
5.  **响应式更新**：利用 Vue 的响应式系统，动态更新 3D 场景的属性变得非常简单。
6.  **性能优化**：TresJS 在内部处理了 Three.js 的渲染循环和性能优化，通常情况下无需开发者手动干预。

## 三、TresJS 核心概念与组件

TresJS 的核心是围绕 Three.js 的几个主要对象构建的 Vue 组件。

### 3.1 `<TresCanvas>`

*   **作用**：TresJS 应用程序的根组件，它创建并管理一个 Three.js 场景 (Scene)、渲染器 (Renderer) 和一个默认的摄像机 (Camera)。所有的 3D 元素都必须嵌套在这个组件内部。
*   **重要属性**：
    *   `shadows`：是否启用阴影 (默认为 false)。
    *   `alpha`：渲染器是否透明 (默认为 false)。
    *   `flat`：启用平面色调映射 (Flat Tone Mapping)。
    *   `dpr`：设备像素比，用于优化高分屏渲染。
    *   `preset`：预设相机和灯光配置 (如 `"soft"`, `"realistic"`)。
    *   `log`：是否在控制台打印 TresJS 内部日志。
    *   `camera`：可以传入一个自定义的摄像机组件实例。
*   **事件**：可以监听 थ्री维对象的点击、hover 等事件。

```vue
<template>
  <TresCanvas>
    <!-- 所有 3D 元素都在这里 -->
  </TresCanvas>
</template>
```

### 3.2 几何体 (Geometries)

对应 Three.js 中的 `THREE.BufferGeometry` 及其子类。
TresJS 提供了以 `Tres` 开头的组件，例如：

*   `<TresBoxGeometry>`
*   `<TresSphereGeometry>`
*   `<TresPlaneGeometry>`
*   `<TresCylinderGeometry>`
*   `<TresTorusGeometry>`
*   `<TresExtrudeGeometry>`
*   ...以及更多

```vue
<template>
  <TresCanvas>
    <TresMesh>
      <TresBoxGeometry :args="[1, 1, 1]" /> <!-- args 对应 Three.js 构造函数的参数 -->
    </TresMesh>
  </TresCanvas>
</template>
```

### 3.3 材质 (Materials)

对应 Three.js 中的 `THREE.Material` 及其子类。
TresJS 提供了以 `Tres` 开头，以 `Material` 结尾的组件，例如：

*   `<TresMeshStandardMaterial>` (物理渲染，支持灯光、阴影)
*   `<TresMeshBasicMaterial>` (基本材质，不受灯光影响)
*   `<TresMeshLambertMaterial>` (非物理渲染，支持点光源)
*   `<TresMeshPhongMaterial>`
*   `<TresShaderMaterial>` (自定义着色器)
*   ...

```vue
<template>
  <TresCanvas>
    <TresMesh>
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="hotpink" /> <!-- 颜色等属性作为 prop 传递 -->
    </TresMesh>
  </TresCanvas>
</template>
```

### 3.4 网格 (Meshes)

对应 Three.js 中的 `THREE.Mesh`。它是几何体和材质的组合，表示场景中的一个三维对象。

*   **重要属性**：
    *   `position`：对象的 (x, y, z) 坐标。
    *   `rotation`：对象的旋转 (欧拉角)。
    *   `scale`：对象的缩放。
    *   `cast-shadow`, `receive-shadow`：是否投射/接收阴影。
    *   `name`：名称，用于组织和查找对象。

```vue
<template>
  <TresCanvas>
    <TresMesh :position="[1, 0, 0]" :rotation="[Math.PI / 4, 0, 0]">
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="hotpink" />
    </TresMesh>
  </TresCanvas>
</template>
```

### 3.5 灯光 (Lights)

对应 Three.js 中的 `THREE.Light` 及其子类。

*   `<TresAmbientLight>` (环境光，均匀照亮所有物体)
*   `<TresDirectionalLight>` (平行光，如太阳光)
*   `<TresPointLight>` (点光源，如灯泡)
*   `<TresSpotLight>` (聚光灯)
*   ...

```vue
<template>
  <TresCanvas>
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :position="[0, 5, 5]" :intensity="1" cast-shadow />
    <!-- ...其他 3D 元素 -->
  </TresCanvas>
</template>
```

### 3.6 摄像机 (Cameras)

对应 Three.js 中的 `THREE.Camera` 及其子类。

*   `<TresPerspectiveCamera>` (透视相机，模拟人眼观看效果)
*   `<TresOrthographicCamera>` (正交相机，无透视效果，常用于 CAD 或 2D 游戏)
*   可以放在 `<TresCanvas>` 内部作为默认相机，或者通过 `useTresContext()` 获取后手动激活。

```vue
<template>
  <TresCanvas>
    <TresPerspectiveCamera :position="[0, 2, 5]" :fov="45" :near="0.1" :far="1000" />
    <!-- ... -->
  </TresCanvas>
</template>
```

### 3.7 辅助工具 (Helpers)

如 `<TresAxesHelper>`、`<TresGridHelper>` 等，用于辅助开发和调试。

```vue
<template>
  <TresCanvas>
    <TresAxesHelper />  <!-- 显示坐标轴 -->
    <TresGridHelper />  <!-- 显示网格 -->
    <!-- ... -->
  </TresCanvas>
</template>
```

## 四、TresJS 的动画与交互

### 4.1 动画

TresJS 可以很方便地实现动画，通常结合 Vue 的 `ref` 和响应式数据。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRenderLoop } from '@tresjs/core';

const cubeRef = ref();
const { onLoop } = useRenderLoop();

// 在每一帧渲染循环中执行
onLoop(({ delta, elapsed }) => {
  if (cubeRef.value) {
    cubeRef.value.rotation.y += delta; // 围绕 Y 轴旋转
    cubeRef.value.position.x = Math.sin(elapsed) * 2; // 左右摆动
  }
});
</script>

<template>
  <TresCanvas>
    <TresPerspectiveCamera :position="[0, 2, 5]" />
    <TresMesh ref="cubeRef">
      <TresBoxGeometry />
      <TresMeshStandardMaterial color="blue" />
    </TresMesh>
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :position="[0, 5, 5]" :intensity="1" />
  </TresCanvas>
</template>
```

### 4.2 交互 (Pointer Events)

TresJS 提供了 `@click`, `@hover-move`, `@hover-enter`, `@hover-leave` 等事件，可以直接在 Tres 组件上使用。

```vue
<template>
  <TresCanvas>
    <TresMesh @click="handleClick" @hover-enter="handleHoverEnter" @hover-leave="handleHoverLeave">
      <TresBoxGeometry />
      <TresMeshStandardMaterial :color="isHovered ? 'lime' : 'red'" />
    </TresMesh>
    <!-- ... -->
  </TresCanvas>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isHovered = ref(false);

function handleClick() {
  alert('方块被点击了！');
}

function handleHoverEnter() {
  isHovered.value = true;
}

function handleHoverLeave() {
  isHovered.value = false;
}
</script>
```

### 4.3 轨道控制器 (OrbitControls)

通过 `@tresjs/cientos` (一个 TresJS 的实用工具库)，可以轻松引入常用的 Three.js 控件。

1.  **安装 Cientos**：
    ```bash
    npm install @tresjs/cientos
    ```
2.  **使用**：
    ```vue
    <script setup lang="ts">
    import { OrbitControls } from '@tresjs/cientos';
    </script>

    <template>
      <TresCanvas>
        <TresPerspectiveCamera :position="[0, 2, 5]" />
        <OrbitControls /> <!-- 引入轨道控制器 -->
        <TresMesh>
          <TresBoxGeometry />
          <TresMeshStandardMaterial color="blue" />
        </TresMesh>
        <TresAmbientLight :intensity="0.5" />
        <TresDirectionalLight :position="[0, 5, 5]" :intensity="1" />
      </TresCanvas>
    </template>
    ```

## 五、生态系统：Cientos

`@tresjs/cientos` 是 TresJS 的一个伴生库，灵感来源于 `react-three/drei`，它提供了大量实用的 Three.js 抽象和组件，进一步简化开发：

*   **相机控制器**：`OrbitControls`, `PointerLockControls`
*   **加载器**：`useGLTF`, `useTexture` (加载 glTF 模型、纹理)
*   **实用几何体**：`Sphere`, `Plane`, `Box` (更简洁的 Mesh 封装)
*   **后处理效果**：`EffectComposer`
*   **其他工具**：`ScreenQuad`, `HTML`, `Text3D` 等。

大大减少了重复代码，例如加载 3D 模型：

```vue
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import { useGLTF, OrbitControls } from '@tresjs/cientos';

const { scene: model } = await useGLTF('/model.glb');
</script>

<template>
  <TresCanvas>
    <TresPerspectiveCamera :position="[0, 2, 5]" />
    <OrbitControls />
    <TresAmbientLight :intensity="0.5" />
    <primitive :object="model" :scale="0.5" /> <!-- 使用 primitive 渲染加载的模型 -->
  </TresCanvas>
</template>
```

## 六、入门示例 (一个旋转的立方体)

```vue
<script setup lang="ts">
import { ref } from 'vue'; // 引入 Vue 的 ref
import { useRenderLoop } from '@tresjs/core'; // 引入 TresJS 的渲染循环 hook

// 创建一个响应式引用来存储立方体网格对象
const boxRef = ref();

// 获取渲染循环的句柄
const { onLoop } = useRenderLoop();

// 监听每一帧的渲染循环
onLoop(({ delta }) => {
  // 确保 boxRef.value 存在，即立方体已被渲染
  if (boxRef.value) {
    // 让立方体围绕 Y 轴旋转，delta 是上一帧和当前帧之间的间隔时间
    boxRef.value.rotation.y += delta;
  }
});
</script>

<template>
  <TresCanvas clear-color="#82DBC5"> <!-- 设置背景色 -->
    <!-- 摄像机：透视相机，位置在 (0, 2, 5)，视野 45 度 -->
    <TresPerspectiveCamera :position="[0, 2, 5]" :fov="45" :near="0.1" :far="1000" />

    <!-- 环境光：提供基础照明 -->
    <TresAmbientLight :intensity="0.5" />

    <!-- 平行光：模拟太阳光，从 (0, 5, 5) 位置照射，强度 1，并开启投射阴影 -->
    <TresDirectionalLight :position="[0, 5, 5]" :intensity="1" cast-shadow />

    <!-- 立方体网格： -->
    <TresMesh ref="boxRef" :position="[0, 0, 0]" :cast-shadow="true">
      <!-- 几何体：一个边长为 1 的立方体 -->
      <TresBoxGeometry :args="[1, 1, 1]" />
      <!-- 材质：一个标准网格材质，颜色为 hotpink -->
      <TresMeshStandardMaterial color="hotpink" />
    </TresMesh>

    <!-- 地面平面：接收阴影 -->
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1, 0]" :receive-shadow="true">
      <TresPlaneGeometry :args="[10, 10]" />
      <TresMeshStandardMaterial color="#ffffff" />
    </TresMesh>
  </TresCanvas>
</template>
```

## 七、总结与展望

TresJS 为 Vue 开发者提供了一种非常优雅和高效的方式来构建 Three.js 场景。它抹平了 Three.js 的一部分复杂性，使得 3D 体验的开发不再是少数专业图形工程师的专利，而是更广泛的前端开发者可以触及的领域。

如果你是 Vue 开发者，想要在项目中添加 3D 效果，或者想学习 Three.js 而又不想被繁琐的命令式代码所困扰，那么 TresJS 绝对是你的首选。

未来，社区对 WebGL、WebGPU 的兴趣日益高涨，像 TresJS 这样的声明式框架将扮演越来越重要的角色，降低 3D 内容创作的门槛，推动 Web 3D 应用的普及。