---
title: Rust 结构体 (Structs) 详解
date: 2025-08-21 06:24:00
tags: 
    - 2025
    - Rust
    - 程序设计
categories: 
    - Rust
    - 程序设计
---

> 在 Rust 语言中，**结构体 (Structs)** 是一种自定义的复合数据类型，允许开发者将多个相关联的值打包成一个有意义的整体。它们是组织数据、定义复杂类型以及实现面向对象编程中“数据与行为”封装的关键机制。Rust 提供了三种主要形式的结构体：经典结构体（带命名字段）、元组结构体（带匿名序号字段）和单元结构体（不带任何字段），每种都有其特定的应用场景。结构体的设计强调内存安全和性能，通过其与所有权、借用、生命周期以及 Trait 系统的紧密集成，实现了强大而灵活的数据建模能力。

{% note info %}
核心思想：
- **结构体**：将多个相关联的数据组合成一个自定义类型。
- **数据封装**：将数据与相关的行为（方法和关联函数）捆绑。
- **三种类型**：经典结构体、元组结构体、单元结构体。
- **与所有权、借用、生命周期、Trait 深度集成**。
- **编译时安全**：强制类型和内存安全。
{% endnote %}
------

## 一、什么是结构体 (Structs)？

### 1.1 定义

**结构体** 是 Rust 中一种用户定义的复合数据类型，它允许开发者将不同类型的数据字段组合到一个单一的命名单元中。每个字段都可以有自己的类型，并且在结构体内部有唯一的标识（通过字段名或序号）。结构体旨在将逻辑上相关的数据组织在一起，便于管理和操作。

### 1.2 为什么需要结构体？

考虑以下场景：如果我们需要存储一个用户的姓名、年龄和邮箱地址。不使用结构体，我们可能需要三个独立的变量：`name: String`, `age: u8`, `email: String`。当应用程序需要处理多个用户时，管理这些独立的变量将变得繁琐且容易出错。

结构体解决了这个问题，它允许我们将这些相关数据封装到一个 `User` 类型中：

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

// 现在我们可以创建一个 User 类型的实例，将所有相关数据封装在一起
let user1 = User {
    username: String::from("alice_smith"),
    email: String::from("alice@example.com"),
    sign_in_count: 1,
    active: true,
};

// 访问数据更清晰
println!("User: {}, Email: {}", user1.username, user1.email);
```
通过结构体，数据被统一管理，提高了代码的可读性和可维护性。

## 二、结构体的种类

Rust 提供了三种结构体形式，以适应不同的需求。

### 2.1 经典结构体 (Classic Structs / C-like Structs)

这是最常见的结构体形式，拥有命名的字段。它们类似于 C/C++ 中的 `struct` 或其他语言中的类（仅数据部分）。

*   **定义与实例化:**
    ```rust
    struct User {
        username: String,
        email: String,
        sign_in_count: u64,
        active: bool,
    }

    fn main() {
        let user1 = User {
            email: String::from("someone@example.com"),
            username: String::from("someusername123"),
            active: true,
            sign_in_count: 1,
        };
        // 注意：字段顺序不重要，但名称必须匹配
    }
    ```

*   **字段访问与可变性:**
    使用点号 (`.`) 运算符访问结构体实例的字段。访问权限遵循 Rust 的可见性规则。
    如果结构体实例是可变的 (`mut`)，那么其字段也是可变的。

    ```rust
    fn main() {
        let mut user1 = User { // 声明 user1 为可变
            email: String::from("someone@example.com"),
            username: String::from("someusername123"),
            active: true,
            sign_in_count: 1,
        };

        user1.email = String::from("anotheremail@example.com"); // 可以修改字段
        println!("User email: {}", user1.email);
    }
    ```

*   **字段初始化简写 (Field Init Shorthand):**
    当结构体字段名与用于初始化该字段的变量名相同时，可以省略字段名和冒号。

    ```rust
    fn build_user(email: String, username: String) -> User {
        User {
            email,      // 简写：等同于 email: email,
            username,   // 简写：等同于 username: username,
            active: true,
            sign_in_count: 1,
        }
    }

    fn main() {
        let user2 = build_user(String::from("user2@example.com"), String::from("user2name"));
        println!("User2: {} {}", user2.username, user2.email);
    }
    ```

*   **结构体更新语法 (Struct Update Syntax):**
    当从另一个结构体实例创建新结构体实例时，可以使用 `..` 语法将剩余的字段从旧实例复制过来。这在只有少数字段需要改变时非常有用。

    ```rust
    fn main() {
        let user3 = User {
            email: String::from("user3@example.com"),
            username: String::from("user3name"),
            active: true,
            sign_in_count: 10,
        };

        let user4 = User {
            email: String::from("user4@example.com"),
            username: String::from("user4name"),
            ..user3 // 复制 user3 的 active 和 sign_in_count 字段
        };

        println!("User4 active: {}", user4.active); // true
        println!("User4 sign_in_count: {}", user4.sign_in_count); // 10
        // 注意：如果 user3 的字段不是 Copy 类型，它们将被移动到 user4，user3 将不再可用。
        // 在此例中，active 和 sign_in_count 是 Copy 类型，所以 user3 仍然可用。
    }
    ```

*   **所有权与生命周期 (简单提及):**
    结构体字段拥有它们的数据的所有权。如果字段是引用类型 (`&str` 等)，那么结构体必须显式地处理生命周期，以确保引用在结构体存活期间始终有效。

    ```rust
    // struct InvalidUser { // 编译错误：需要生命周期参数
    //     email: &str,
    // }

    struct ValidUser<'a> { // `T` 引用字段需要生命周期参数 `'a`
        email: &'a str,
        username: &'a str,
    }

    fn main() {
        let email_str = String::from("valid@example.com");
        let username_str = String::from("validuser");
        let user = ValidUser {
            email: &email_str,
            username: &username_str,
        };
        println!("Valid user email: {}", user.email);
    } // email_str 和 username_str 在这里离开作用域，`user` 也必须同时离开。
    ```
    生命周期会在后续章节更详细地讨论。

### 2.2 元组结构体 (Tuple Structs)

元组结构体类似于元组，但它们带有名字，可以用来创建不同的类型别名。它们没有命名字段，而是通过索引 (`.0`, `.1` 等) 访问字段。当结构体中的值有意义但又没有特定名称时，元组结构体很有用。

*   **定义与实例化:**
    ```rust
    struct Color(i32, i32, i32); // 定义一个 Color 元组结构体
    struct Point(i32, i32, i32); // 定义一个 Point 元组结构体

    fn main() {
        let black = Color(0, 0, 0);
        let origin = Point(0, 0, 0);

        // 尽管内部数据类型相同，但 black 和 origin 是不同的类型，不能互相赋值
        // let x = black;
        // let y: Point = x; // 编译错误：expected struct `Point`, found struct `Color`
    }
    ```

*   **字段访问:**
    通过点号加上字段的索引来访问。

    ```rust
    fn main() {
        let black = Color(0, 0, 0);
        println!("Black R: {}", black.0);
    }
    ```

*   **何时使用:**
    当你想给元组增加一个有意义的类型名，但又不想给每个字段命名时。典型的例子如 `Point(x, y)` 或 `Rgb(r, g, b)`。

### 2.3 单元结构体 (Unit-like Structs)

单元结构体不包含任何字段。它们主要用于实现 Trait，当我们需要拥有某个 Trait 的实例，但内部却没有实际数据要存储时，单元结构体就很有用。它们类似于不带参数的函数或特化的枚举变体。

*   **定义与实例化:**
    ```rust
    struct AlwaysEqual; // 定义一个单元结构体

    fn main() {
        let subject = AlwaysEqual; // 实例化它
        // let other_subject = AlwaysEqual; // 也可以创建另一个实例
        // subject == other_subject 可以在派生 PartialEq 后比较
    }
    ```

*   **何时使用:**
    *   作为没有数据的标记类型。
    *   在实现 Trait 时，如果 Trait 方法不需要访问任何实例数据。
    *   作为泛型参数，表明类型存在但没有额外的运行时数据。

## 三、为结构体实现行为 (Associated Functions & Methods)

`impl` (implement) 块用于为结构体定义**关联函数 (Associated Functions)** 和**方法 (Methods)**。

### 3.1 `impl` 块

`impl` 块是 Rust 定义类型行为的地方。可以为一个结构体定义多个 `impl` 块。

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // ... 在这里定义关联函数和方法
}
```

### 3.2 关联函数 (Associated Functions)

**定义：** 关联函数是与结构体关联但**不作用于结构体实例**的函数。它们通常用于创建结构体的新实例，类似于其他语言中的**静态方法**或**构造函数**。它们通过 `StructName::function_name()` 语法调用。

*   **`Self` 关键字:** 在 `impl` 块内部，`Self` 是当前正在实现 Trait 或类型别名的类型的别名。对于结构体 `Rectangle` 的 `impl` 块，`Self` 就是 `Rectangle`。

*   **示例 (构造函数):**
    ```rust
    impl Rectangle {
        // 一个关联函数，用于创建一个新的 Rectangle 实例
        fn new(width: u32, height: u32) -> Self { // `Self` 等同于 `Rectangle`
            Rectangle { width, height }
        }

        // 另一个关联函数，用于创建一个正方形
        fn square(size: u32) -> Self {
            Self { width: size, height: size }
        }
    }

    fn main() {
        let rect1 = Rectangle::new(30, 50); // 通过关联函数创建实例
        let square1 = Rectangle::square(25); // 创建一个正方形
    }
    ```

### 3.3 方法 (Methods)

**定义：** 方法是与结构体实例关联的函数，它们作用于结构体的特定实例，并且通常需要访问该实例的数据。它们通过 `instance.method_name()` 语法调用。方法的第一个参数必须是 `self`、`&self` 或 `&mut self`。

*   **`self` (获取所有权):**
    当方法签名使用 `self` 时，该方法会获取调用它的结构体实例的所有权。这意味着在方法调用后，该实例将不能再被使用（除非所有权被方法返回）。这种情况很少见，主要用于转换结构体或销毁资源。

    ```rust
    impl Rectangle {
        fn destroy(self) -> String { // `self` 获取了所有权
            format!("Destroying rectangle with width {} and height {}", self.width, self.height)
            // self 在这里被销毁
        }
    }

    fn main() {
        let rect_to_destroy = Rectangle::new(10, 20);
        let description = rect_to_destroy.destroy(); // rect_to_destroy 的所有权被转移
        // println!("Destroyed: {:?}", rect_to_destroy); // 编译错误！rect_to_destroy 已被移动
        println!("{}", description);
    }
    ```

*   **`&self` (不可变借用):**
    这是最常见的方法类型。方法通过不可变引用 (`&self`) 借用结构体实例的所有权。这意味着方法可以读取实例的数据，但不能修改它。调用后，实例仍然可用。

    ```rust
    impl Rectangle {
        fn area(&self) -> u32 { // `&self` 借用，不能修改实例
            self.width * self.height
        }
    }

    fn main() {
        let rect1 = Rectangle::new(30, 50);
        println!("The area is {} square pixels.", rect1.area()); // 调用后 rect1 仍然可用
    }
    ```

*   **`&mut self` (可变借用):**
    当方法签名使用 `&mut self` 时，方法通过可变引用借用结构体实例的所有权。这意味着方法可以读取和修改实例的数据。调用后，实例仍然可用，且其修改会保留。

    ```rust
    impl Rectangle {
        fn scale(&mut self, factor: u32) { // `&mut self` 借用，可以修改实例
            self.width *= factor;
            self.height *= factor;
        }
    }

    fn main() {
        let mut rect1 = Rectangle::new(30, 50); // 必须声明为可变
        println!("Original rectangle: {}x{}", rect1.width, rect1.height);
        rect1.scale(2); // 调用后 rect1 被修改
        println!("Scaled rectangle: {}x{}", rect1.width, rect1.height); // 60x100
    }
    ```

**方法调用示意图:**

{% mermaid %}
graph TD
    %% 全局样式配置，适配暗黑模式
    %%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#2d3436', 'primaryTextColor': '#dfe6e9', 'lineColor': '#a29bfe'}}}%%

    Start[结构体实例 Instance] --> Call{方法调用 Method Call}

    %% 路径一：所有权转移
    Call -- "self" --> Move["<b>获取所有权 (Move)</b>"]
    Move --> Consumed(["<font color='#ff7675'>实例不再可用</font>"])

    %% 路径二：不可变借用
    Call -- "&self" --> Ref["<b>不可变借用 (Borrow)</b>"]
    Ref --> Read["只读访问 (Read-only)"]
    Read --> Active(["<font color='#55efc4'>实例持续可用</font>"])

    %% 路径三：可变借用
    Call -- "&mut self" --> MutRef["<b>可变借用 (Mut Borrow)</b>"]
    MutRef --> Modify["读取并修改 (Write)"]
    Modify --> ActiveMod(["<font color='#74b9ff'>实例可用且修改生效</font>"])

    %% 样式美化
    classDef move fill:#635a5a,stroke:#ff7675,stroke-width:2px;
    classDef ref fill:#2d3436,stroke:#55efc4,stroke-width:2px;
    classDef mut fill:#2d3436,stroke:#74b9ff,stroke-width:2px;
    
    class Move,Consumed move;
    class Ref,Read,Active ref;
    class MutRef,Modify,ActiveMod mut;
{% endmermaid %}

## 四、结构体与 Trait 的派生 (Derive Attributes)

Rust 的 Trait 机制允许结构体“实现”特定行为。对于一些常见的 Trait，Rust 提供了一个 `#[derive(TraitName)]` 属性，让编译器自动为结构体生成 Trait 的实现代码。这大大减少了样板代码。

*   **定义：** `#[derive(TraitName)]` 是一个属性宏，指示 Rust 编译器自动为目标结构体或枚举生成指定 Trait 的实现。

*   **常见可派生 Trait 列表及用途:**

    *   `Debug`: 允许使用 `{:?}` 或 `{:#?}` 格式化输出结构体，在调试时非常有用。几乎所有自定义结构体都应该派生它。
    *   `Clone`: 允许通过 `clone()` 方法创建结构体的深拷贝（分配新内存并复制数据）。
    *   `Copy`: 如果所有字段都实现了 `Copy` Trait，那么结构体也可以派生 `Copy`。这使得在赋值或作为函数参数传递时，结构体会被按值复制而不是移动。
    *   `PartialEq`, `Eq`: 允许使用 `==` 和 `!=` 进行相等性比较。`Eq` 是一个标记 Trait，表示可以在相等性比较中进行优化（如确保 `a == b` 当且仅当 `hash(a) == hash(b)`）。如果 `a == b` 可以确保 `a.cmp(other)` 返回 `Ordering::Equal`。
    *   `PartialOrd`, `Ord`: 允许使用 `<`, `>`, `<=`, `>=` 进行比较。`Ord` 是一个标记 Trait，表示可以进行全序排序。
    *   `Default`: 允许通过 `Type::default()` 创建一个具有所有字段默认值的结构体实例。
    *   `Hash`: 允许将结构体存储在 `std::collections::HashMap` 或 `HashSet` 中。
    *   `serde::{Serialize, Deserialize}`:（需要 `serde` 库）允许结构体实例序列化/反序列化为 JSON、YAML 等格式。

*   **示例:**
    ```rust
    #[derive(Debug, PartialEq, Clone, Copy, Default)] // 派生多个 Trait
    struct Point {
        x: i32,
        y: i32,
    }

    #[derive(Debug)] // 派生 Debug
    struct Rectangle {
        top_left: Point,
        bottom_right: Point,
    }

    fn main() {
        let p1 = Point { x: 1, y: 2 };
        let p2 = Point { x: 1, y: 2 };
        let p3 = Point { x: 3, y: 4 };

        println!("p1: {:?}", p1); // 使用 Debug 格式化输出
        println!("p1 == p2: {}", p1 == p2); // 使用 PartialEq 比较
        println!("p1 == p3: {}", p1 == p3);

        let p1_clone = p1.clone(); // 使用 Clone 创建副本
        println!("p1_clone: {:?}", p1_clone);

        let p_default: Point = Default::default(); // 使用 Default 创建默认值实例
        println!("Default point: {:?}", p_default);

        let rect = Rectangle {
            top_left: Point::default(),
            bottom_right: Point { x: 10, y: 20 },
        };
        println!("Rectangle: {:#?}", rect); // 漂亮的 Debug 格式化输出
    }
    ```

## 五、泛型结构体 (Generic Structs)

泛型允许结构体在定义时不指定某些字段的具体数据类型，而是在实例化时才确定。这使得结构体能够处理多种类型的数据，提高了代码的复用性。

*   **定义：** 在结构体名称后面使用尖括号 (`<>`) 指定一个或多个泛型类型参数。

*   **类型参数:** `T`, `U` 等字母通常用作泛型类型参数。

*   **示例:**
    ```rust
    struct Pair<T> { // 泛型结构体 Pair，可以存储任意类型 T 的两个值
        x: T,
        y: T,
    }

    struct Wrapper<T, U> { // 泛型结构体 Wrapper，可以存储 T 和 U 两种类型的值
        value1: T,
        value2: U,
    }

    impl<T> Pair<T> { // 可以在 impl 块中使用泛型参数
        fn swap(&mut self) {
            std::mem::swap(&mut self.x, &mut self.y);
        }
    }

    fn main() {
        let integer_pair = Pair { x: 5, y: 10 };
        let float_pair = Pair { x: 1.0, y: 2.5 };
        let mixed_wrapper = Wrapper { value1: 100, value2: "hello" };

        println!("Integer pair x: {}", integer_pair.x);
        println!("Float pair y: {}", float_pair.y);
        println!("Mixed wrapper value1: {}, value2: {}", mixed_wrapper.value1, mixed_wrapper.value2);

        let mut p_to_swap = Pair { x: 'a', y: 'b' };
        println!("Before swap: x={}, y={}", p_to_swap.x, p_to_swap.y);
        p_to_swap.swap();
        println!("After swap: x={}, y={}", p_to_swap.x, p_to_swap.y);
    }
    ```

## 六、结构体与生命周期 (Lifetimes in Structs)

当结构体包含引用类型的字段时（例如 `&str`、`&T`），就需要引入**生命周期参数 (`'a`)** 来告诉编译器该引用所指向的数据的存活时间。生命周期参数确保结构体不会比它所引用的数据活得更久，从而防止悬垂引用。

*   **简要介绍问题:**
    如果一个结构体拥有一个引用，那么这个引用指向的外部数据必须至少和结构体本身一样长寿。如果没有生命周期参数，编译器无法验证这一点。

*   **引用字段需要生命周期参数:**
    ```rust
    struct Book<'a> { // 结构体需要一个生命周期参数 `'a`
        title: &'a str,
        author: &'a str,
        // 其他拥有所有权的字段不需要生命周期参数
        page_count: u32,
    }

    fn main() {
        let book_title = String::from("Rust Programming");
        let book_author = String::from("Rustaceans");

        // 这里的 book_title 和 book_author 的生命周期必须至少和 book 实例的生命周期一样长
        let book = Book {
            title: &book_title,
            author: &book_author,
            page_count: 500,
        };

        println!("Book: {} by {}", book.title, book.author);
    }
    // book_title 和 book_author 在这里离开作用域，它们比 book 实例活得更久
    // 如果 book 实例在外部环境创建，但 book_title 和 book_author 在内部环境创建，编译器会报错。
    ```
    Rust 的生命周期规则在编译时保证了内存安全，避免了 C/C++ 中常见的悬垂指针问题。

## 七、结构体的优缺点及使用场景

### 7.1 优点

*   **数据封装:** 将相关数据聚合为一个有意义的单元，提高代码组织性。
*   **类型安全:** 编译器强制检查字段类型，确保数据的一致性。
*   **可读性强:** 命名的字段使得代码意图清晰。
*   **行为绑定:** `impl` 块允许为结构体定义关联函数和方法，增强其功能。
*   **元编程支持:** `#[derive]` 属性和泛型使得代码复用和自动化 Trait 实现成为可能。
*   **零成本抽象:** 在运行时，结构体只是数据的内存布局，不会引入额外的运行时开销。

### 7.2 缺点

*   **样板代码:** 对于非常简单的聚合，可能会觉得定义结构体有些冗长（但通常是值得的）。
*   **字段顺序不保证:** 内部内存布局通常是优化过的，不保证字段在内存中按定义顺序排列（除非使用 `#[repr(C)]`）。
*   **可变性控制:** 需要显式地使用 `mut` 关键字来指示可变性。

### 7.3 何时使用？

*   **当需要将多个相关数据组合成一个逻辑单元时。** (例如，`User`, `Order`, `HttpRequest`)
*   **当需要为数据定义专属行为时。** (通过 `impl` 块添加方法)
*   **当需要区分具有相同字段类型的不同实体时。** (例如，`struct Millimeters(u32)` 和 `struct Meters(u32)`)
*   **构建复杂数据结构和面向对象风格的代码时。** (尽管 Rust 不是传统意义上的 OOP 语言，结构体加上 Trait 提供了类似的功能)。

## 八、总结与最佳实践

Rust 结构体是构建复杂、安全且高性能应用程序的基础。它们提供了一种强大的方式来定义自定义数据类型，并与所有权、借用、生命周期和 Trait 等 Rust 核心概念无缝集成。

**最佳实践:**

1.  **为经典结构体字段命名清晰:** 使用描述性的名称，提高代码可读性。
2.  **合理选择结构体类型:**
    *   **经典结构体:** 大部分情况下的默认选择。
    *   **元组结构体:** 当字段的顺序和类型比名称更重要时（例如，数学坐标、颜色值）。
    *   **单元结构体:** 作为无数据的标记类型。
3.  **积极使用 `#[derive]` 属性:** 自动生成常用 Trait 的实现，减少样板代码，尤其是 `Debug`。
4.  **根据方法行为选择 `self` 参数:**
    *   `&self`: 读取数据（最常见）。
    *   `&mut self`: 修改数据。
    *   `self`: 获取所有权（转换类型或销毁时）。
5.  **设计泛型结构体以提高复用性:** 当结构体的数据结构不变，但内部数据类型可能变化时。
6.  **正确处理带引用字段的结构体生命周期:** 仔细思考引用字段的存活时间，并添加必要的生命周期参数，让编译器帮助你保证内存安全。
7.  **将关联函数作为构造函数或工具函数:** 利用 `StructName::function_name()` 模式。

通过熟练掌握结构体及其相关的核心概念，你将能够更有效地在 Rust 中建模数据，编写出高效、健壮和易于维护的代码。