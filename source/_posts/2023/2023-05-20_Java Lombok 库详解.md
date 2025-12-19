---
title: Java Lombok 库详解
date: 2023-05-20 06:24:00
tags:
  - 2023
  - Java
  - 代码生成
  - 程序设计
categories:
  - Java
  - 库
---
> **Project Lombok (Lombok)** 是一个 Java 库，旨在通过注解处理器 (Annotation Processor) **自动生成** Java 类中的样板代码，例如 `getter`、`setter`、`equals`、`hashCode`、`toString` 等方法，以及构造函数。它的目标是减少代码的冗余，提升开发效率和代码的可读性、简洁性。

{% note info %}
**核心思想**：Lombok 在编译阶段通过注解处理器介入，在 `.java` 文件编译成 `.class` 文件之前，根据我们代码中的 Lombok 注解自动插入对应的 Java 代码，然后才交给编译器编译。因此，它不是在运行时通过反射生成代码。
{% endnote %}
------

## 一、为什么需要 Lombok？

在传统的 Java 开发中，尤其是在数据模型类 (POJOs / DTOs) 中，我们常常需要编写大量的重复性代码：

1.  **Getter 和 Setter**：每个字段通常都需要对应的 `getter` 和 `setter` 方法。
2.  **构造函数**：无参构造函数、全参构造函数或部分参数构造函数。
3.  **`equals()` 和 `hashCode()`**：为了正确地比较对象和在集合中存储对象。
4.  **`toString()`**：为了方便日志输出和调试。

这些方法虽然功能简单但数量庞大，且几乎没有任何业务逻辑，被称为“样板代码” (boilerplate code)。它们占用大量屏幕空间，降低了代码的可读性，且在字段增减时需要手动维护，容易出错。

Lombok 的出现正是为了解决这些痛点：

*   **减少样板代码**：大幅减少需要手动编写的代码量。
*   **提高可读性**：代码变得更加简洁，只关注核心业务逻辑。
*   **提升开发效率**：开发者无需花费时间编写和维护这些重复性的方法。
*   **降低错误率**：自动生成的方法不容易出现手动编写时可能出现的疏漏，例如 `equals` 和 `hashCode` 的不一致。

## 二、Lombok 核心注解详解

Lombok 提供了丰富的注解来满足不同的代码生成需求。以下是一些最常用和重要的注解：

### 2.1 `@Getter` / `@Setter`

*   **用途**：自动为字段生成 `getter` 和 `setter` 方法。
*   **修饰范围**：可以修饰类或字段。
    *   修饰类时，为该类的所有非静态字段生成 `getter` 和 `setter`。
    *   修饰字段时，只为该字段生成对应的 `getter` 或 `setter`。
*   **参数**：
    *   `AccessLevel value()`：指定生成方法的访问级别 (如 `PUBLIC`, `PROTECTED`, `PACKAGE`, `PRIVATE`)，默认为 `PUBLIC`。
    *   `boolean lazy()`：作用于 `@Getter`。当设置为 `true` 时，`getter` 方法会采用懒加载模式，只有第一次调用时才初始化字段的值。

**示例 (Java)**：
```java
import lombok.Getter;
import lombok.Setter;

// 为整个类生成 getter/setter
@Getter
@Setter
public class User {
    private Long id;
    private String name;

    @Getter(AccessLevel.PROTECTED) // 仅为 age 字段生成 protected getter
    @Setter(AccessLevel.PRIVATE) // 仅为 age 字段生成 private setter
    private int age;

    @Getter(lazy = true) // 懒加载的 getter
    private final double expensiveCalculation = Math.random() * 1000;

    public static void main(String[] args) {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        // user.setAge(30); // 编译错误！setter 是 private 的

        System.out.println("ID: " + user.getId());
        System.out.println("Name: " + user.getName());
        System.out.println("Age: " + user.getAge()); // 可以访问 protected getter
        System.out.println("Expensive calculation (first call): " + user.getExpensiveCalculation());
        System.out.println("Expensive calculation (second call): " + user.getExpensiveCalculation()); // 值不变
    }
}
```
**编译后 (大致等价代码)**：
```java
public class User {
    private Long id;
    private String name;
    private int age;
    private final java.util.concurrent.atomic.AtomicReference<Object> expensiveCalculation = new java.util.concurrent.atomic.AtomicReference<>();

    public Long getId() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    protected int getAge() { // protected 访问权限
        return this.age;
    }

    private void setAge(int age) { // private 访问权限
        this.age = age;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getExpensiveCalculation() {
        Object value = this.expensiveCalculation.get();
        if (value == null) {
            synchronized (this.expensiveCalculation) {
                value = this.expensiveCalculation.get();
                if (value == null) {
                    value = Math.random() * 1000;
                    this.expensiveCalculation.set(value);
                }
            }
        }
        return (Double) value;
    }
}
```

### 2.2 `@ToString`

*   **用途**：自动为类生成一个 `toString()` 方法。
*   **修饰范围**：修饰类。
*   **参数**：
    *   `boolean callSuper()`：是否调用父类的 `toString()` 方法，默认为 `false`。
    *   `String[] exclude()`：排除某些字段不参与 `toString()` 输出。
    *   `String[] of()`：指定只有哪些字段参与 `toString()` 输出。
    *   `boolean includeFieldNames()`：是否包含字段名，默认为 `true`。

**示例 (Java)**：
```java
import lombok.ToString;

@ToString(exclude = {"secret", "age"}, callSuper = true) // 排除 secret 和 age 字段, 调用父类 toString
public class Person extends BaseEntity {
    private String name;
    private int age;
    private String secret; // 敏感信息不应该在 toString 中输出

    public Person(String id, String name, int age, String secret) {
        super(id);
        this.name = name;
        this.age = age;
        this.secret = secret;
    }

    public static void main(String[] args) {
        Person person = new Person("123", "Bob", 25, "hidden_password");
        System.out.println(person);
        // 假设 BaseEntity 的 toString 输出形如: BaseEntity(id=xxx)
        // 期望输出: Person(super=BaseEntity(id=123), name=Bob)
    }
}

@ToString
class BaseEntity {
    private String id;
    public BaseEntity(String id) { this.id = id; }
}
```

### 2.3 `@EqualsAndHashCode`

*   **用途**：自动为类生成 `equals()` 和 `hashCode()` 方法。
*   **修饰范围**：修饰类。
*   **参数**：
    *   `boolean callSuper()`：是否考虑父类的 `equals()` 和 `hashCode()`。
    *   `String[] exclude()`：排除某些字段不参与计算。
    *   `String[] of()`：指定只有哪些字段参与计算。

**重要**：生成 `equals()` 和 `hashCode()` 方法时，如果类有继承关系，`callSuper = true` 是非常重要的，否则可能导致比较不正确。对于一个继承链上的根类，`callSuper` 应该为 `false`。

**示例 (Java)**：
```java
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true, exclude = "salary")
public class Employee extends Person { // 假设 Person 也有 @EqualsAndHashCode(callSuper = true)
    private String employeeId;
    private double salary; // 薪水不参与 equals 和 hashCode 计算

    public Employee(String id, String name, int age, String secret, String employeeId, double salary) {
        super(id, name, age, secret);
        this.employeeId = employeeId;
        this.salary = salary;
    }

    public static void main(String[] args) {
        Employee emp1 = new Employee("123", "Alice", 30, "p1", "E001", 50000.0);
        Employee emp2 = new Employee("123", "Alice", 30, "p2", "E001", 60000.0); // salary不同
        Employee emp3 = new Employee("456", "Bob", 25, "p3", "E002", 45000.0);

        System.out.println("emp1.equals(emp2): " + emp1.equals(emp2)); // true (因为 salary 被排除)
        System.out.println("emp1.hashCode() == emp2.hashCode(): " + (emp1.hashCode() == emp2.hashCode())); // true
        System.out.println("emp1.equals(emp3): " + emp1.equals(emp3)); // false
    }
}
```

### 2.4 `@NoArgsConstructor` / `@RequiredArgsConstructor` / `@AllArgsConstructor`

*   **用途**：自动化生成构造函数。
    *   `@NoArgsConstructor`：生成一个无参构造函数。
    *   `@RequiredArgsConstructor`：生成一个包含所有 `final` 字段和带有 `@NonNull` 注解字段的构造函数。
    *   `@AllArgsConstructor`：生成一个包含所有字段的构造函数。
*   **修饰范围**：修饰类。
*   **参数**：
    *   `staticName()`：可以指定一个静态工厂方法名来代替直接的构造函数。
    *   `AccessLevel`：指定构造函数的访问级别。

**示例 (Java)**：
```java
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.NonNull;

@NoArgsConstructor // 生成无参构造函数
@AllArgsConstructor // 生成包含所有字段的构造函数
@RequiredArgsConstructor // 生成包含 final 和 @NonNull 字段的构造函数
public class Product {
    private final Long productId; // final 字段
    @NonNull private String name; // @NonNull 字段
    private String description;
    private double price;

    public static void main(String[] args) {
        // 使用 @AllArgsConstructor
        Product product1 = new Product(1L, "Laptop", "Powerful laptop", 1200.0);
        System.out.println(product1.name);

        // 使用 @NoArgsConstructor (注意：这会使 final 字段 productId 无法初始化，需要手动赋值或通过 builder 等方式)
        Product product2 = new Product();
        product2.name = "Mouse"; // final 字段不能再赋值，此处会编译错误，除非 productId 也不是 final
        // 对于 final 字段，@NoArgsConstructor 除非有默认值，否则会报错。一般不推荐 final 字段与 @NoArgsConstructor 同时使用。

        // 使用 @RequiredArgsConstructor
        Product product3 = new Product(2L, "Keyboard"); // 只有 productId 和 name (NonNull) 会被加入
        System.out.println(product3.name);
    }
}
```

### 2.5 `@Data`

*   **用途**：一个非常方便的组合注解，它相当于同时使用了 `@ToString`, `@EqualsAndHashCode`, `@Getter`, `@Setter`, `@RequiredArgsConstructor`。
*   **修饰范围**：修饰类。
*   **注意**：`@Data` 默认会生成 `RequiredArgsConstructor`，即如果你的类有 `final` 字段或 `@NonNull` 字段，它会生成一个包含这些字段的构造函数。如果你需要一个全参构造函数或无参构造函数，还需要额外添加 `@AllArgsConstructor` 或 `@NoArgsConstructor`。

**示例 (Java)**：
```java
import lombok.Data;
import lombok.NonNull;
import lombok.AllArgsConstructor; // 通常会和 @Data 一起使用提供全参构造

@Data // 相当于 @ToString, @EqualsAndHashCode, @Getter, @Setter, @RequiredArgsConstructor
@AllArgsConstructor // 提供一个包含所有字段的构造函数
public class OrderItem {
    private final String itemCode; // final 字段
    @NonNull private String itemName; // @NonNull 字段
    private int quantity;
    private double unitPrice;

    public static void main(String[] args) {
        // 通过 @AllArgsConstructor 创建
        OrderItem item1 = new OrderItem("I001", "Book", 2, 25.5);
        System.out.println(item1); // 调用 @ToString
        System.out.println("Item name: " + item1.getItemName()); // 调用 @Getter

        OrderItem item2 = new OrderItem("I001", "Book", 2, 30.0); // unitPrice不同
        System.out.println("item1.equals(item2): " + item1.equals(item2)); // 对比所有字段（除了被排除的），默认 true

        // @RequiredArgsConstructor 也会生成，会包含 itemCode 和 itemName
        // OrderItem item3 = new OrderItem("I002", "Pen"); // 编译失败，因为AllArgsConstructor覆盖了RequiredArgsConstructor
    }
}
```

### 2.6 `@Value`

*   **用途**：用于创建**不可变**的类。它相当于 `@FieldDefaults(makeFinal=true, level=AccessLevel.PRIVATE)`, `@AllArgsConstructor`, `@ToString`, `@EqualsAndHashCode`, `@Getter`。此外，它不会生成 `setter` 方法，并将所有字段设置为 `final`。
*   **修饰范围**：修饰类。
*   **限制**：一旦字段被赋值，就不能再修改。

**示例 (Java)**：
```java
import lombok.Value;

@Value // 相当于 @FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE), @AllArgsConstructor, @ToString, @EqualsAndHashCode, @Getter
public class ImmutablePoint {
    int x;
    int y;

    public static void main(String[] args) {
        ImmutablePoint p1 = new ImmutablePoint(10, 20);
        System.out.println(p1); // ImmutablePoint(x=10, y=20)
        System.out.println("X: " + p1.getX()); // getter
        // p1.setX(30); // 编译错误，没有 setter 且字段是 final
    }
}
```

### 2.7 `@Builder`

*   **用途**：为类生成构建器模式 (Builder Pattern) 的代码，使得创建对象时更具可读性和安全性，特别适用于复杂对象或拥有多个可选参数的对象。
*   **修饰范围**：修饰类或构造函数。
*   **工作原理**：它会生成一个静态内部类 `YourClassBuilder`，并提供链式调用的 `withXxx()` 方法来设置字段，最后通过 `build()` 方法创建对象。

**示例 (Java)**：
```java
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Builder // 为 User 类生成 Builder 模式
@Getter // 提供 getter
@ToString // 提供 toString
public class UserSettings {
    private String username;
    private String email;
    private boolean enableNotifications;
    private int themeId;
    private String language;

    public static void main(String[] args) {
        UserSettings userSettings = UserSettings.builder()
                .username("Alice")
                .email("alice@example.com")
                .enableNotifications(true)
                .themeId(1)
                .language("en-US")
                .build(); // 链式调用构建对象

        System.out.println(userSettings);
        // UserSettings(username=Alice, email=alice@example.com, enableNotifications=true, themeId=1, language=en-US)

        UserSettings defaultSettings = UserSettings.builder()
                .username("Bob")
                .enableNotifications(false) // 只设置部分字段
                .build();
        System.out.println(defaultSettings);
        // UserSettings(username=Bob, email=null, enableNotifications=false, themeId=0, language=null)
    }
}
```

### 2.8 `@Cleanup`

*   **用途**：确保流或资源（实现了 `java.io.Closeable` 或 `java.lang.AutoCloseable` 接口）在使用后被正确关闭。它类似于 Java 7 的 `try-with-resources` 语句，但可以在任何块中使用。
*   **修饰范围**：修饰局部变量。

**示例 (Java)**：
```java
import lombok.Cleanup;
import java.io.*;

public class CleanupExample {
    public static void main(String[] args) throws IOException {
        String fileName = "test.txt";

        try {
            @Cleanup OutputStream out = new FileOutputStream(fileName);
            out.write("Hello, Lombok!".getBytes());
        } // out 会在这里自动调用 close() 方法

        try {
            @Cleanup InputStream in = new FileInputStream(fileName);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int len;
            while ((len = in.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            System.out.println(new String(bos.toByteArray()));
        } // in 会在这里自动调用 close() 方法

        // 不需要手动 try-finally 块来关闭资源
    }
}
```

## 三、Lombok 的安装与配置

为了让 Lombok 正常工作，你需要进行以下配置：

1.  **Maven/Gradle 依赖**：
    在 `pom.xml` (Maven) 或 `build.gradle` (Gradle) 中添加 Lombok 依赖。

    **Maven `pom.xml`**：
    ```xml
    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version> <!-- 使用最新稳定版本 -->
            <scope>provided</scope>
        </dependency>
    </dependencies>
    ```
    **Gradle `build.gradle`**：
    ```gradle
    plugins {
        id 'java'
    }

    dependencies {
        compileOnly 'org.projectlombok:lombok:1.18.30' // 使用 compileOnly
        annotationProcessor 'org.projectlombok:lombok:1.18.30'
    }
    ```
    *   **`scope=provided` (Maven) / `compileOnly` (Gradle)**：Lombok 只需要在编译时介入生成代码，生成的代码会直接合并到 `.class` 文件中。在运行时，Lombok 库本身并不是必需的，因此为了避免 JAR 包膨胀，通常将其 scope 设置为 `provided` 或 `compileOnly`。

2.  **IDE 插件安装**：
    由于 Lombok 在编译阶段生成代码，IDE 需要特殊的插件才能正确识别和处理 Lombok 注解，避免在编辑器中显示错误（例如，找不到 `getName()` 方法）。

    *   **IntelliJ IDEA**：通常在 `File -> Settings -> Plugins` 中搜索并安装 "Lombok Plugin"。安装后需要重启 IDE。在较新版本的 IDEA 中，Lombok 支持可能已内置或无需额外配置。
    *   **Eclipse**：下载 `lombok.jar` 文件，并双击运行它，它会自动检测 Eclipse 的安装路径并安装插件。或者将 `lombok.jar` 复制到 Eclipse 的 `dropins` 目录。
    *   **VS Code**：安装 Java Extension Pack 后，通常会自动支持 Lombok。

## 四、Lombok 的优缺点与注意事项

### 4.1 优点：

*   **代码简洁**：极大地减少了样板代码，使核心业务逻辑更加突出。
*   **提高开发效率**：缩短了开发时间，减少了手动编写和维护代码的负担。
*   **降低维护成本**：字段增减时，无需手动修改 `getter`/`setter`/`equals`/`hashCode` 等方法，Lombok 会自动处理。
*   **社区支持广泛**：Lombok 已经成为 Java 生态中非常流行和成熟的工具。

### 4.2 缺点与注意事项：

1.  **对工具链的依赖**：需要 IDE 插件支持才能在开发环境中正常工作和避免错误提示。
2.  **隐藏代码**：生成的代码在源代码中不可见，对于不熟悉 Lombok 的开发者来说，可能会对方法的来源感到困惑，增加了初学者的学习成本和调试难度。
3.  **调试挑战**：在某些情况下，当遇到由 Lombok 生成代码引起的运行时错误时，调试可能会变得稍微复杂，因为堆栈跟踪会指向“看不见”的代码。
4.  **版本兼容性**：Lombok 版本与 JDK 版本、IDE 版本之间可能存在兼容性问题，需要保持更新。
5.  **不当使用可能导致问题**：例如，在所有字段上无脑使用 `@Data` 可能会导致敏感信息打印在 `toString` 中，或者 `equals`/`hashCode` 包含不应该参与计算的字段。
6.  **编译时报错**：如果在一个类上同时使用 `@NoArgsConstructor` 和 `@AllArgsConstructor`，且存在 `final` 字段，可能会导致编译错误，因为 `final` 字段必须在构造函数中初始化。这种情况需要谨慎处理，或者通过 `@Builder` 等更灵活的方式。

## 五、总结

Project Lombok 是一个强大的工具，通过注解处理器在编译阶段自动生成 Java 样板代码，极大地提高了开发效率和代码整洁度。它在现代 Java 开发，特别是在 Spring Boot 等框架中被广泛使用，几乎成为了数据模型类开发的标配。

然而，像所有强大的工具一样，Lombok 也需要谨慎使用。理解每个注解的作用、其生成的具体代码以及潜在的局限性，并确保团队成员都熟悉其工作原理和配置，是最大化其优势并避免踩坑的关键。尽管存在一些缺点，但 Lombok 在平衡代码简洁性和功能性方面做得非常出色，对于减少 Java 开发中的重复劳动而言，它仍然是一个非常值得推荐的库。