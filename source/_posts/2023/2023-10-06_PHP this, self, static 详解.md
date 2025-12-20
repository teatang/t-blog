---
title: PHP this, self, static 详解
date: 2023-10-06 06:24:00
tags:
  - 2023
  - PHP
  - 程序设计
  - 编码规范
categories:
  - PHP
---
> 在 PHP 面向对象编程中，`$this`、`self` 和 `static` 是三个至关重要的关键词，它们用于在类内部访问成员属性和方法。理解它们之间的区别和用法是掌握 PHP 对象模型，特别是后期静态绑定 (Late Static Binding) 的关键。

{% note info %}
核心思想：**`$this` 指向当前对象实例，`self` 指向当前类，`static` 结合后期静态绑定机制，根据运行时调用者来确定指向的类。**
{% endnote %}

------

## 一、`$this` 关键字

### 1.1 定义与用途

`$this` 关键字用于**引用当前对象实例**。它只能在**非静态方法**中使用，用于访问当前对象实例的**非静态属性**和**非静态方法**。

当一个类被实例化为一个对象后，`$this` 就代表了该对象。

### 1.2 访问方式

通过 `->` 运算符访问：`$this->propertyName` 或 `$this->methodName()`。

### 1.3 示例

```php
<?php

class Car {
    public $color; // 非静态属性

    public function __construct($color) {
        $this->color = $color; // 使用 $this 访问当前对象的 color 属性
    }

    public function getDescription() {
        return "This car is " . $this->color . "."; // 使用 $this 访问当前对象的 color 属性
    }

    public function repaint($newColor) {
        $this->color = $newColor; // 使用 $this 修改当前对象的 color 属性
        echo "Car repainted to " . $this->color . "\n";
    }
}

$myCar = new Car("red");
echo $myCar->getDescription() . "\n"; // 输出: This car is red.

$myCar->repaint("blue");
echo $myCar->getDescription() . "\n"; // 输出: This car is blue.

// 尝试在静态方法中使用 $this 会报错
// class StaticTest {
//     public static function test() {
//         echo $this->name; // 错误: Using $this when not in object context
//     }
// }
// StaticTest::test();

?>
```

### 1.4 总结 `$this`

*   **代表**：当前对象实例。
*   **使用范围**：非静态方法。
*   **访问类型**：非静态属性和非静态方法。
*   **操作符**：`->`。

## 二、`self` 关键字

### 2.1 定义与用途

`self` 关键字用于**引用当前类**。它可以在**静态方法和非静态方法**中使用，用于访问当前类的**静态属性**、**静态方法**以及**类常量**。

`self` 在编译时就确定了它所引用的类，因此它总是指向定义该常量的类，即使是在继承链中。这被称为**早期绑定 (Early Binding)**。

### 2.2 访问方式

通过 `::` (Scope Resolution Operator，范围解析操作符) 访问：`self::$staticProperty` 或 `self::staticMethod()` 或 `self::CLASS_CONSTANT`。

### 2.3 示例

```php
<?php

class MathHelper {
    const PI = 3.14159; // 类常量
    public static $name = "Math Helper"; // 静态属性

    public static function getCircleArea($radius) {
        return self::PI * $radius * $radius; // 使用 self 访问类常量
    }

    public function sayName() {
        echo "My name is " . self::$name . " (from non-static method).\n"; // 在非静态方法中访问静态属性
    }

    public static function getClassName() {
        return self::$name; // 使用 self 访问静态属性
    }
}

echo "PI value: " . MathHelper::PI . "\n"; // 外部访问类常量
echo "Class name: " . MathHelper::getClassName() . "\n"; // 外部访问静态方法

$helper = new MathHelper();
$helper->sayName(); // 输出: My name is Math Helper (from non-static method).

echo "Circle area with radius 5: " . MathHelper::getCircleArea(5) . "\n";

?>
```

### 2.4 `self` 与继承

`self` 总是指向它**被定义时所在的类**，而不是运行时调用的类。

```php
<?php

class ParentClass {
    public static $name = "Parent";

    public static function getClassName() {
        return self::$name; // 这里的 self 永远指 ParentClass
    }

    public static function getSelfAndStaticName() {
        echo "Self name: " . self::$name . "\n";
        echo "Static name: " . static::$name . "\n"; // 对比 static 关键字
    }
}

class ChildClass extends ParentClass {
    public static $name = "Child"; // 子类重写静态属性
}

echo ParentClass::getClassName() . "\n"; // 输出: Parent
echo ChildClass::getClassName() . "\n";  // 输出: Parent (尽管是 ChildClass 调用，self 仍然指向 ParentClass)

ParentClass::getSelfAndStaticName();
// 输出:
// Self name: Parent
// Static name: Parent

ChildClass::getSelfAndStaticName();
// 输出:
// Self name: Parent  (self 仍然指向 ParentClass)
// Static name: Child (static 指向 ChildClass)

?>
```

从上面的例子可以看出，`self::getClassName()` 在 `ChildClass` 中调用时，仍然返回 "Parent"，因为它绑定到了 `ParentClass`。

### 2.5 总结 `self`

*   **代表**：当前类。
*   **使用范围**：静态方法和非静态方法。
*   **访问类型**：静态属性、静态方法、类常量。
*   **操作符**：`::`。
*   **绑定**：**早期绑定 (Early Binding)**，总是指向代码编写时所在的类。

## 三、`static` 关键字 (后期静态绑定)

### 3.1 定义与用途

`static` 关键字在上下文中使用时，提供了一种**后期静态绑定 (Late Static Binding)** 的机制。与 `self` 不同，`static` 关键字指向的是**运行时实际调用该方法或属性的类**，而不是声明该方法或属性的类。

这使得 `static` 在处理继承和多态时更加灵活，它允许子类重写父类的静态成员，并在运行时正确地引用到子类的实现。

### 3.2 访问方式

通过 `::` 访问：`static::$staticProperty` 或 `static::staticMethod()`。

### 3.3 示例 (延续 `self` 示例中的 `ParentClass` 和 `ChildClass`)

```php
<?php

class ParentClass {
    public static $name = "Parent";

    public static function getClassNameBySelf() {
        return self::$name; // self 早期绑定到 ParentClass
    }

    public static function getClassNameByStatic() {
        return static::$name; // static 后期绑定，根据运行时调用者确定
    }
}

class ChildClass extends ParentClass {
    public static $name = "Child";
}

class GrandChildClass extends ChildClass {
    public static $name = "GrandChild";
}

// ======================= self 的行为 =======================
echo "self behavior:\n";
echo ParentClass::getClassNameBySelf() . "\n";   // 输出: Parent
echo ChildClass::getClassNameBySelf() . "\n";    // 输出: Parent (仍然是 ParentClass)
echo GrandChildClass::getClassNameBySelf() . "\n"; // 输出: Parent (仍然是 ParentClass)


// ======================= static 的行为 =======================
echo "\nstatic behavior:\n";
echo ParentClass::getClassNameByStatic() . "\n";  // 输出: Parent
echo ChildClass::getClassNameByStatic() . "\n";   // 输出: Child (后期绑定到 ChildClass)
echo GrandChildClass::getClassNameByStatic() . "\n"; // 输出: GrandChild (后期绑定到 GrandChildClass)

?>
```

通过这个例子，我们可以清晰地看到 `static` 在继承链中如何动态地根据调用者来解析静态成员。

### 3.4 `static` 的其他应用

*   **工厂模式**：当工厂方法需要根据子类类型创建实例时，`static` 配合 `new static()` 可以很方便地实现。

    ```php
    <?php
    class Product {
        public static function factory() {
            return new static(); // 创建调用者的实例
        }
    }

    class ConcreteProductA extends Product {}
    class ConcreteProductB extends Product {}

    $a = ConcreteProductA::factory();
    $b = ConcreteProductB::factory();

    var_dump($a); // object(ConcreteProductA)#1 (...)
    var_dump($b); // object(ConcreteProductB)#2 (...)
    ?>
    ```

*   **链式调用中的 `return static`**：在实现链式调用时，返回 `static` 而不是 `$this` 可以确保在继承链中保持正确的类型提示。

    ```php
    <?php
    class QueryBuilder {
        protected $query;

        public function select($fields) {
            $this->query .= "SELECT " . implode(', ', $fields);
            return $this; // 返回当前对象实例
        }

        public function where($condition) {
            $this->query .= " WHERE " . $condition;
            return $this;
        }

        public function getQuery() {
            return $this->query;
        }
    }

    class ExtendedQueryBuilder extends QueryBuilder {
        public function limit($count) {
            $this->query .= " LIMIT " . $count;
            return $this; // 如果这里返回的是 $this，但类型提示是 QueryBuilder，可能影响 IDE 自动补全
            // 更好的做法是返回 static，即使是子类方法，也能返回子类实例
            // return static;
        }
    }

    $query = new ExtendedQueryBuilder();
    // $query->select(['id', 'name'])->where('age > 18')->limit(10); // 可以链式调用

    ?>
    ```

### 3.5 总结 `static`

*   **代表**：运行时实际调用该静态成员的类。
*   **使用范围**：静态方法和非静态方法。
*   **访问类型**：静态属性、静态方法。
*   **操作符**：`::`。
*   **绑定**：**后期静态绑定 (Late Static Binding)**，动态地根据运行时调用上下文确定类。

## 四、三者的对比总结

| 特性     | `$this`                                    | `self`                                            | `static`                                        |
| :------- | :----------------------------------------- | :------------------------------------------------ | :---------------------------------------------- |
| **代表** | 当前对象实例                               | 当前类 (定义时的类)                               | 运行时调用者所在的类                            |
| **绑定** | 对象绑定 (Instance Binding)                | 早期绑定 (Early Binding) / 编译时绑定             | 后期静态绑定 (Late Static Binding) / 运行时绑定 |
| **用途** | 访问实例属性和方法                         | 访问类静态属性、静态方法、类常量                  | 访问类静态属性、静态方法，实现多态               |
| **使用范围** | 非静态方法                                 | 静态方法和非静态方法                              | 静态方法和非静态方法                            |
| **操作符** | `->`                                       | `::`                                              | `::`                                            |
| **继承中的行为** | 指向实例化对象本身，不受继承影响              | 无论谁调用，都指向代码定义时的类 (`ParentClass::someMethod()`) | 动态指向调用者所在的类 (`ChildClass::someMethod()`) |

## 五、在实际开发中的选择

1.  **访问对象实例成员**：始终使用 `$this->propertyName` 和 `$this->methodName()`。
2.  **访问类常量**：始终使用 `self::CONSTANT_NAME`。类常量是不会被子类重写的，因此使用 `self` 是正确的选择。
3.  **访问静态属性和静态方法**：
    *   如果你确定需要引用**当前定义这些静态成员的类**，并且不希望子类重写时影响到这里，就使用 `self::$staticProperty` 或 `self::staticMethod()` (早期绑定)。
    *   如果你希望在**继承链中能够动态地引用到调用者（子类）的静态成员**，实现多态性，那么就使用 `static::$staticProperty` 或 `static::staticMethod()` (后期静态绑定)。这通常是更灵活、更推荐的做法，特别是在需要子类行为覆盖父类静态行为的场景。

理解这三个关键字，特别是 `self` 和 `static` 在继承中的区别，是编写健壮、可扩展的 PHP 面向对象代码的关键。