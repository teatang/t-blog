---
title: Java 泛型 (Generics) 详解
date: 2024-05-23 06:24:00
tags:
  - 2024
  - Java
  - 程序设计
  - 编码规范
  - 泛型
categories:
  - Java
  - 程序设计
---
> **Java 泛型 (Generics)** 是在 JDK 5.0 中引入的一项重要语言特性，它允许在定义类、接口和方法时，使用**类型参数 (Type Parameters)** 来表示不确定的类型。这样，编译器可以在编译时对类型进行检查，从而在运行时避免 `ClassCastException` 等类型转换异常，提高了代码的**类型安全性 (Type Safety)**、**重用性 (Reusability)** 和**可读性 (Readability)**。

{% note info %}
核心思想：**Java 泛型通过引入类型参数，使得代码可以操作各种类型的数据而无需运行时强制类型转换，从而在编译时提供了更强的类型检查，减少了运行时错误，并提升了代码的通用性和安全性。**
{% endnote %}

------

## 一、为什么需要泛型？

在泛型出现之前，Java 集合框架（如 `ArrayList`, `HashMap`）可以存放任何类型的对象，因为它们操作的是 `Object` 类型。这带来了两个主要问题：

1.  **类型不安全**：编译器无法检查集合中存储的实际类型。如果从集合中取出一个对象并强制转换为不正确的类型，就会在运行时抛出 `ClassCastException`。
2.  **代码冗余**：每次从集合中取出对象时，都需要进行强制类型转换，代码显得冗长且易错。

**示例：没有泛型的问题**

```java
import java.util.ArrayList;
import java.util.List;

public class LegacyListExample {
    public static void main(String[] args) {
        List list = new ArrayList(); // 没有指定类型，默认存储 Object
        list.add("Hello");
        list.add(123); // 编译器不会报错

        // 问题1：类型不安全，运行时抛出 ClassCastException
        // String s = (String) list.get(1); // 运行时报错：java.lang.Integer cannot be cast to java.lang.String

        // 问题2：代码冗余，需要手动强制类型转换
        String s1 = (String) list.get(0);
        System.out.println(s1);

        // Integer i = (Integer) list.get(1); // 正确的转换
        // System.out.println(i);
    }
}
```

泛型通过在编译时捕获这些类型错误，解决了上述问题。

## 二、泛型的基本语法

泛型的核心思想是**类型参数化**，即在定义类、接口或方法时，使用一个或多个类型参数来代替实际的类型。类型参数通常用单个大写字母表示，如 `E` (Element), `T` (Type), `K` (Key), `V` (Value), `N` (Number) 等。

### 2.1 泛型类 (Generic Class)

定义一个类时，可以在类名后使用 `<T>` 来声明一个或多个类型参数。

```java
// 泛型类定义
class Box<T> {
    private T content;

    public Box(T content) {
        this.content = content;
    }

    public T getContent() {
        return content;
    }

    public void setContent(T content) {
        this.content = content;
    }

    public <U> void inspect(U otherContent) { // 泛型方法
        System.out.println("T: " + content.getClass().getName());
        System.out.println("U: " + otherContent.getClass().getName());
    }
}

public class GenericClassDemo {
    public static void main(String[] args) {
        // 使用泛型类，指定具体类型
        Box<String> stringBox = new Box<>("Hello Generics"); // JDK 7+ 菱形运算符 <>
        String message = stringBox.getContent(); // 无需强制类型转换
        System.out.println("String Box Content: " + message);

        Box<Integer> integerBox = new Box<>(123);
        Integer number = integerBox.getContent(); // 无需强制类型转换
        System.out.println("Integer Box Content: " + number);

        // 编译时错误：类型不匹配
        // stringBox.setContent(456); // Compile-time error: incompatible types

        stringBox.inspect(456.78); // 泛型方法调用
    }
}
```

### 2.2 泛型接口 (Generic Interface)

接口也可以声明类型参数，其实现类在实现泛型接口时，可以指定具体的类型，也可以继续保持泛型。

```java
// 泛型接口定义
interface Generator<T> {
    T next();
}

// 实现泛型接口，指定具体类型
class StringGenerator implements Generator<String> {
    private String[] data = {"Apple", "Banana", "Cherry"};
    private int index = 0;

    @Override
    public String next() {
        if (index < data.length) {
            return data[index++];
        }
        return null;
    }
}

// 实现泛型接口，继续保持泛型
class RandomGenerator<T> implements Generator<T> {
    private List<T> items;
    private java.util.Random random = new java.util.Random();

    public RandomGenerator(List<T> items) {
        this.items = items;
    }

    @Override
    public T next() {
        if (items.isEmpty()) {
            return null;
        }
        return items.get(random.nextInt(items.size()));
    }
}

public class GenericInterfaceDemo {
    public static void main(String[] args) {
        StringGenerator sg = new StringGenerator();
        System.out.println("Next string: " + sg.next()); // Apple
        System.out.println("Next string: " + sg.next()); // Banana

        List<Integer> numbers = List.of(1, 2, 3, 4, 5);
        RandomGenerator<Integer> rg = new RandomGenerator<>(numbers);
        System.out.println("Random number: " + rg.next()); // 随机数
    }
}
```

### 2.3 泛型方法 (Generic Method)

在方法签名中声明类型参数，使其可以独立于类本身的泛型类型。

*   类型参数 `T` 放在方法返回类型之前。
*   静态方法也可以是泛型方法，因为它们不依赖于类的实例。

```java
public class GenericMethodDemo {

    // 泛型方法：打印任意类型的数组元素
    public static <E> void printArray(E[] inputArray) {
        for (E element : inputArray) {
            System.out.printf("%s ", element);
        }
        System.out.println();
    }

    // 泛型方法：返回两个数中较大的那个 (需要限定类型)
    public static <T extends Comparable<T>> T maximum(T x, T y, T z) {
        T max = x;
        if (y.compareTo(max) > 0) {
            max = y;
        }
        if (z.compareTo(max) > 0) {
            max = z;
        }
        return max;
    }

    public static void main(String[] args) {
        Integer[] intArray = {1, 2, 3, 4, 5};
        Double[] doubleArray = {1.1, 2.2, 3.3, 4.4};
        String[] stringArray = {"Hello", "World", "Generics"};

        printArray(intArray);    // 1 2 3 4 5
        printArray(doubleArray); // 1.1 2.2 3.3 4.4
        printArray(stringArray); // Hello World Generics

        System.out.println("Max Integer: " + maximum(3, 5, 2));   // 5
        System.out.println("Max Double: " + maximum(6.6, 8.8, 7.7)); // 8.8
        System.out.println("Max String: " + maximum("apple", "orange", "banana")); // orange
    }
}
```

## 三、类型通配符 (Wildcards)

类型通配符 (`?`) 用于处理泛型类型之间的兼容性问题，特别是当泛型类作为方法参数时。它表示未知类型。

### 3.1 无界通配符 (`<?>`)

表示任意类型，等同于 `<Object>`。通常用于：
1.  你不知道或不关心集合中存储的类型。
2.  对集合进行只读操作时 (因为你不知道具体类型，所以不能安全地添加元素)。

```java
import java.util.Arrays;
import java.util.List;

public class UnboundedWildcardDemo {

    // 接受任何泛型列表，打印其内容
    public static void printList(List<?> list) {
        for (Object elem : list) { // 只能按 Object 处理
            System.out.print(elem + " ");
        }
        System.out.println();
        // list.add(new Object()); // 编译错误：不能添加任何元素 (除了 null)
    }

    public static void main(String[] args) {
        List<Integer> li = Arrays.asList(1, 2, 3);
        List<String> ls = Arrays.asList("one", "two", "three");

        printList(li); // 1 2 3
        printList(ls); // one two three
    }
}
```

### 3.2 上界通配符 (`<? extends T>`)

表示类型必须是 `T` 或 `T` 的子类。
*   **读取数据 (Producer Extends)**：你可以从 `List<? extends T>` 中读取类型为 `T` 或其子类的元素。
*   **不能添加数据**：因为编译器不知道 `?` 的具体子类型，为了保证类型安全，除了 `null` 之外，不能向其中添加任何元素。

```java
import java.util.ArrayList;
import java.util.List;

class Shape { /* ... */ }
class Circle extends Shape { /* ... */ }
class Rectangle extends Shape { /* ... */ }

public class UpperBoundedWildcardDemo {

    // 接受 Shape 或其子类的列表，计算总面积 (假设 Shape 有 getArea 方法)
    // List<? extends Shape> 意味着这个列表可以持有 Shape 或 Shape 的任何子类型
    public static double sumAreas(List<? extends Shape> shapes) {
        double totalArea = 0;
        for (Shape shape : shapes) { // 可以读取 Shape 或其子类对象
            // totalArea += shape.getArea(); // 假设有此方法
            System.out.println("Processing shape: " + shape.getClass().getSimpleName());
        }
        return totalArea;
        // shapes.add(new Circle()); // 编译错误：不能添加，因为列表可能实际上是 List<Rectangle>
    }

    public static void main(String[] args) {
        List<Circle> circles = new ArrayList<>();
        circles.add(new Circle());
        circles.add(new Circle());

        List<Rectangle> rectangles = new ArrayList<>();
        rectangles.add(new Rectangle());

        sumAreas(circles);    // OK
        sumAreas(rectangles); // OK

        List<Shape> shapes = new ArrayList<>();
        shapes.add(new Circle());
        shapes.add(new Rectangle());
        sumAreas(shapes);     // OK
    }
}
```

### 3.3 下界通配符 (`<? super T>`)

表示类型必须是 `T` 或 `T` 的父类。
*   **添加数据 (Consumer Super)**：你可以向 `List<? super T>` 中添加类型为 `T` 或 `T` 的子类的元素。
*   **读取数据**：从列表中读取出的元素只能被当作 `Object` 处理 (因为你只知道它是 `T` 的父类，具体是哪个父类不确定)。

```java
import java.util.ArrayList;
import java.util.List;

public class LowerBoundedWildcardDemo {

    // 接受 Integer 或其父类的列表，添加一个 Integer
    // List<? super Integer> 意味着这个列表可以持有 Integer 或 Integer 的任何父类型
    public static void addIntegerToList(List<? super Integer> list) {
        list.add(10); // 可以添加 Integer 及其子类
        list.add(20);
        // list.add(new Object()); // 编译错误：不能添加非 Integer 或其子类的类型
        Object o = list.get(0); // 取出时只能作为 Object 处理
        System.out.println("Added integers. First element as Object: " + o);
    }

    public static void main(String[] args) {
        List<Integer> ints = new ArrayList<>();
        addIntegerToList(ints); // OK
        System.out.println("Ints: " + ints); // [10, 20]

        List<Number> numbers = new ArrayList<>();
        addIntegerToList(numbers); // OK
        System.out.println("Numbers: " + numbers); // [10, 20]

        List<Object> objects = new ArrayList<>();
        addIntegerToList(objects); // OK
        System.out.println("Objects: " + objects); // [10, 20]

        // List<Double> doubles = new ArrayList<>();
        // addIntegerToList(doubles); // 编译错误：Double 不是 Integer 的父类或 Integer 本身
    }
}
```

### 3.4 PECS 原则 (Producer-Extends, Consumer-Super)

这是一个用于指导何时使用 `extends` 和 `super` 通配符的助记符：
*   如果你需要从泛型结构中**读取 (Produce)** 数据，使用 `<? extends T>`。
*   如果你需要向泛型结构中**写入 (Consume)** 数据，使用 `<? super T>`。

## 四、泛型擦除 (Type Erasure)

Java 泛型是**编译时类型检查**的，这意味着在运行时，所有的泛型信息都会被**擦除 (Erasure)**。JVM 看到的只是原始类型 (Raw Type)，通常是类型参数的第一个上界（如果没有指定上界，则为 `Object`）。

**这意味着：**
1.  **无法在运行时获取泛型类型信息**：例如，你不能在运行时判断 `List<String>` 和 `List<Integer>` 是不同的类型。它们都被擦除为 `List`。
    ```java
    List<String> stringList = new ArrayList<>();
    List<Integer> integerList = new ArrayList<>();
    System.out.println(stringList.getClass() == integerList.getClass()); // true
    ```
2.  **不能创建泛型类型的实例**：`new T()` 是不允许的。
3.  **不能创建泛型数组**：`new T[size]` 是不允许的。
4.  **`instanceof` 运算符不能用于泛型类型**：`obj instanceof List<String>` 是编译错误的。
5.  **泛型方法重载**：由于擦除，`void method(List<String> list)` 和 `void method(List<Integer> list)` 在编译后签名相同，导致无法重载。

**泛型擦除的实现原理**：
*   **类型参数替换**：所有类型参数都被替换为其第一个上界（如果没有指定，则为 `Object`）。
*   **插入强制类型转换**：在从泛型结构中取出元素的地方，编译器会自动插入必要的强制类型转换，以确保类型安全。

{% mermaid %}
graph TD
    A[Java 源代码 with Generics]
    B[编译时 Type Checking] --> C[JVM 字节码 <br>without Generics]
    C --类型擦除 (Type Erasure)--> D["运行时 Raws Types <br>(Object/Bound)"]

    A -- "List<String> list = new ArrayList<>()" --> B
    B -- "list.add('hello')" --> C
    C -- "(String) list.get(0)" <br>插入强制类型转换--> D
{% endmermaid %}

## 五、泛型的一些限制

除了类型擦除带来的限制外，泛型还有其他一些使用限制：

1.  **不能用基本数据类型实例化泛型**：`List<int>` 是不允许的，必须使用包装类，如 `List<Integer>`。
2.  **不能捕获泛型类的实例**：`catch (MyException<T> e)` 是不允许的。
3.  **不能在静态字段上使用泛型类型参数**：`static T instance;` 是不允许的，因为静态成员属于类，与任何特定的泛型实例无关。
4.  **泛型类型不能是异常类**：`class MyException<T> extends Exception` 是不允许的。

## 六、总结

Java 泛型是现代 Java 编程中不可或缺的一部分，它通过在编译时引入类型检查，极大地提升了代码的类型安全性、可读性和重用性。虽然其底层的类型擦除机制带来了一些限制，但通过合理利用类型参数、通配符（特别是遵循 PECS 原则），以及理解其工作原理，开发者可以编写出更健壮、更灵活的泛型代码。掌握泛型是编写高质量 Java 代码的关键技能之一。