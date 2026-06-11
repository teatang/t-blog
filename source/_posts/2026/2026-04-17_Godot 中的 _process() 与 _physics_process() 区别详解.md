---
title: Godot 中的 _process() 与 _physics_process() 区别详解
date: 2026-04-17 06:24:00
tags:
  - Godot
  - 游戏开发
  - GDScript
  - 帧率
categories:
  - 游戏开发
  - Godot
---

> 在 Godot 引擎中，`_process(delta)` 和 `_physics_process(delta)` 是两个核心的虚函数，它们允许节点在每一帧或每个物理步长中执行自定义逻辑。尽管两者都用于更新游戏状态，但它们在**调用时机**、**调用频率**以及**应用场景**上存在显著差异。理解并正确使用这两个函数对于构建稳定、响应迅速且物理行为准确的 Godot 游戏至关重要。

{% note info %}
**核心概念：**
*   **`_process(delta)`：** 依赖于游戏的渲染帧率，用于处理与渲染相关的逻辑、输入、非物理游戏逻辑等。
*   **`_physics_process(delta)`：** 独立于渲染帧率，以固定频率调用，主要用于处理物理相关的逻辑。
*   **`delta` 参数：** 两个函数都接受一个 `delta` 参数，表示自上次调用以来的时间，用于实现帧率无关的运动和更新。
{% endnote %}

------

## 一、`_process(delta)` 详解

### 1.1 调用时机与频率

*   **时机：** `_process(delta)` 函数在**每一帧渲染之前**被调用。
*   **频率：** 它的调用频率**与游戏的渲染帧率挂钩**。如果游戏运行在 60 FPS，`_process` 就会每秒调用 60 次；如果帧率下降到 30 FPS，它就每秒调用 30 次。这意味着它的调用频率是**不固定**的，会随着游戏性能和设备性能波动。

### 1.2 `delta` 参数

*   `delta` 参数表示自上一帧开始到当前帧开始所经过的时间（单位：秒）。
*   由于帧率不固定，`delta` 的值也会不固定。
*   **重要性：** 为了确保游戏对象的运动和行为在不同帧率下保持一致，必须将运动速度、旋转速度等乘以 `delta`。
    $$ \text{位移} = \text{速度} \times \text{delta} $$
    如果不乘以 `delta`，在帧率高的设备上，对象会移动得更快；在帧率低的设备上，对象会移动得更慢。

### 1.3 典型应用场景

`_process(delta)` 适用于以下类型的逻辑：

1.  **非物理对象的运动**：例如，UI 元素的动画、背景滚动、粒子效果的位置更新。
    ```gdscript
    # 示例: UI元素平滑移动
    func _process(delta):
        position.x += 100 * delta # 每秒移动 100 像素
    ```
2.  **用户输入处理**：检测按键、鼠标点击、触摸事件等。
    ```gdscript
    # 示例: 检测玩家输入
    func _process(delta):
        if Input.is_action_pressed("ui_right"):
            position.x += 200 * delta
        if Input.is_action_just_pressed("attack"):
            print("Player attacked!")
    ```
3.  **渲染相关逻辑**：更新材质参数、调整相机视角、复杂动画的帧更新等。
4.  **游戏逻辑**：计时器、计分系统、非物理碰撞检测（例如，检测拾取物品）、敌人 AI 的非物理决策等。
5.  **资源管理**：如动态加载或卸载资源，更新显示信息。

### 1.4 注意事项

*   由于帧率的不稳定性，不应在 `_process` 中直接处理物理模拟。
*   如果游戏帧率过低，`_process` 的调用频率也会降低，这可能导致一些需要高频率更新的逻辑表现不佳（例如，输入响应延迟）。

## 二、`_physics_process(delta)` 详解

### 2.1 调用时机与频率

*   **时机：** `_physics_process(delta)` 函数在**固定的时间间隔**内被调用，与渲染帧率无关。它在物理引擎计算每一步之前被调用。
*   **频率：** 它的调用频率由项目设置中的 "Physics > Common > Physics FPS" 决定，默认通常是 60 次/秒。这意味着它的调用频率是**固定且可预测**的。即使游戏渲染帧率波动，物理步长也保持一致。

### 2.2 `delta` 参数

*   `delta` 参数表示自上一个物理步长开始到当前物理步长开始所经过的固定时间。
*   在默认的 60 Physics FPS 设置下，`delta` 的值固定为 `1/60` 秒（约 `0.016667` 秒）。
*   **重要性：** 正是因为 `delta` 是固定的，物理计算才能保持确定性和稳定性，避免因帧率波动导致的物理穿透或不一致行为。

### 2.3 典型应用场景

`_physics_process(delta)` 适用于以下类型的逻辑：

1.  **物理对象的运动和碰撞**：控制 `RigidBody2D/3D`、`KinematicBody2D/3D` 等物理节点的移动、旋转、施加力等。
    ```gdscript
    # 示例: 玩家使用 KinematicBody2D 移动
    func _physics_process(delta):
        var velocity = Vector2.ZERO
        if Input.is_action_pressed("ui_right"):
            velocity.x += 100
        if Input.is_action_pressed("ui_left"):
            velocity.x -= 100
        move_and_slide(velocity) # 使用物理引擎移动
    ```
2.  **施加力或冲量**：通过 `apply_central_force()`、`apply_torque()` 等方法与物理世界交互。
    ```gdscript
    # 示例: 给 RigidBody2D 施加力
    func _physics_process(delta):
        if Input.is_action_pressed("thrust"):
            # 施加向上的力
            linear_velocity.y -= 50
    ```
3.  **精确的物理碰撞检测**：所有与物理引擎相关的碰撞检测和响应都应在此函数中进行。
4.  **需要固定频率更新的逻辑**：任何对时间精确度要求高的逻辑，例如，自定义的物理模拟、需要确保在特定时间步长内执行的 AI 行为。

### 2.4 注意事项

*   **避免在 `_process` 中直接修改物理状态**：在 `_process` 中直接改变 `position` 或 `linear_velocity` 等物理属性可能会导致物理引擎的不稳定行为，例如抖动、穿透。应使用 `_physics_process` 或物理引擎提供的方法（如 `_integrate_forces`）。
*   **物理引擎的配置**：可以通过 "项目设置 -> Physics -> Common" 调整物理帧率 (`Physics FPS`)。更高的帧率会提高物理模拟的精度和稳定性，但也会增加 CPU 消耗。

## 三、`_process()` 与 `_physics_process()` 总结与对比

| 特性           | `_process(delta)`                                   | `_physics_process(delta)`                                   |
| :------------- | :-------------------------------------------------- | :---------------------------------------------------------- |
| **调用时机**   | 每一帧渲染之前                                      | 物理引擎处理每个步长之前                                    |
| **调用频率**   | **不固定**，与渲染帧率同步，可变                     | **固定**，与物理 FPS 同步，稳定且可预测                     |
| **`delta` 值** | **不固定**，取决于渲染帧率                          | **固定**，默认为 `1/60` 秒 (由 Physics FPS 决定)            |
| **主要用途**   | *   非物理运动 (UI、背景、粒子)<br>*   用户输入处理<br>*   渲染相关逻辑<br>*   非物理游戏逻辑 (计时器、计分) | *   **所有物理相关操作** (移动、力、碰撞检测)<br>*   `RigidBody2D/3D`、`KinematicBody2D/3D` 的控制<br>*   需要固定时间步长的逻辑 |
| **对性能影响** | 随渲染帧率波动，若渲染帧率低，更新次数少              | 独立于渲染帧率，即使渲染帧率低，也会固定次数更新，可能导致 CPU 负担重 |
| **最佳实践**   | 用于视觉、输入、非关键逻辑                          | 用于物理、碰撞、需要高精度时间步的逻辑                      |

## 四、何时使用哪个函数？

正确的选择取决于你正在处理的逻辑类型：

*   **视觉效果和响应**：如果你需要处理用户输入、更新 UI、播放动画、滚动背景、或者任何不涉及物理交互的视觉效果，使用 `_process(delta)`。
    *   **例子**：玩家按下跳跃键，显示跳跃动画。
*   **物理模拟和互动**：如果你需要移动一个物理对象（如 `RigidBody` 或 `KinematicBody`），施加力，或者进行精确的碰撞检测和响应，使用 `_physics_process(delta)`。
    *   **例子**：根据玩家输入计算一个力并施加到角色上，使其在地面上移动。

### 混合使用的策略

在很多情况下，你可能需要两个函数协同工作：

1.  **输入处理与物理移动结合**：
    *   在 `_process(delta)` 中捕获用户输入（例如，`Input.is_action_pressed("move_right")`）。
    *   将输入状态存储在一个变量中（例如，`_input_direction`）。
    *   在 `_physics_process(delta)` 中，根据存储的输入状态来计算物理运动（例如，`move_and_slide()` 或 `apply_force()`）。
    ```gdscript
    # player.gd
    extends KinematicBody2D

    var move_direction = Vector2.ZERO
    const SPEED = 200

    func _process(delta):
        # 捕获输入 (与帧率同步)
        move_direction.x = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
        move_direction.y = Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")

    func _physics_process(delta):
        # 根据输入进行物理移动 (与物理帧率同步)
        var velocity = move_direction.normalized() * SPEED
        move_and_slide(velocity)
    ```

2.  **动画与物理状态同步**：
    *   在 `_physics_process(delta)` 中更新物理状态。
    *   在 `_process(delta)` 中根据物理状态（如速度、是否跳跃）来播放相应的动画。
    *   **例子**：角色的 `linear_velocity.y` 如果是负数（向上），则播放跳跃动画；如果是正数（向下），则播放下落动画。

## 五、结论

`_process(delta)` 和 `_physics_process(delta)` 是 Godot 引擎中处理游戏逻辑的两个基本入口点。它们的设计目的是为了将**渲染相关的更新**与**物理相关的模拟**分离开来，以确保游戏的**流畅性 (Frame Rate Independence)** 和**物理模拟的稳定性 (Physics Step Consistency)**。

正确地理解和区分这两个函数，并根据其特性选择合适的时机和场景使用，是编写高效、健壮 Godot 游戏代码的关键。遵循“物理归物理，逻辑归逻辑”的原则，将有助于避免常见的物理抖动、穿透问题，并使你的游戏行为更加可预测和专业。