---
title: Java Apache Commons 库详解
date: 2023-05-06 06:24:00
tags:
  - 2023
  - Java
  - 程序设计
categories:
  - Java
  - 库
---
> **Apache Commons 库** 是 Apache 软件基金会开发和维护的一个开源项目，旨在提供可重用、可扩展且经过良好测试的 Java 组件。它由一系列独立的模块组成，这些模块通常作为标准 Java API 的补充，提供了大量实用的工具类和功能，帮助开发者解决日常编程中遇到的常见问题，提高开发效率和代码质量。

{% note info %}
核心思想：**Apache Commons 提供了一系列成熟、稳定且经过测试的 Java 工具库，用于弥补标准 Java API 的不足，解决常见编程问题，从而简化开发并提升代码质量。**
{% endnote %}

------

## 一、为什么需要 Apache Commons 库？

尽管 Java 标准库非常强大，但在实际开发中，开发者经常会遇到一些重复性的、繁琐的、或者标准库支持不够完善的任务。例如：

1.  **字符串操作**：标准库的 `String` 类虽然功能完善，但在处理空字符串、判空、连接、裁剪等方面，往往需要编写大量重复的 `null` 检查和条件判断。
2.  **文件 I/O 操作**：`java.io` 包提供了底层的 I/O 功能，但进行文件复制、目录操作、按行读取等高级操作时，代码会比较冗长且容易出错。
3.  **集合操作**：`java.util` 包的集合类非常强大，但在集合的转换、过滤、查找等方面，仍然存在一些便捷性不足的情况（尤其是在 Java 8 Stream API 之前）。
4.  **反射操作**：Java 的反射 API 相对底层和复杂，进行一些常见反射操作时不够直观。
5.  **数据类型转换**：基本数据类型和包装类之间的转换、字符串和数字之间的安全转换等。

Apache Commons 库正是为了解决这些“痛点”而生，它通过提供一系列高度优化的、易于使用的工具类，极大地简化了这些常见任务的实现，减少了样板代码，并提升了代码的健壮性。

## 二、Apache Commons 核心模块概览

Apache Commons 项目由众多独立的子项目（模块）组成，每个模块专注于解决某一特定领域的通用问题。以下是一些最常用和重要的模块：

1.  **Commons Lang**：提供对 Java 核心类（`String`、`Number`、`Date`、`Object`、`Array`、`System` 等）的扩展和增强，是 Apache Commons 中最常用的模块之一。
2.  **Commons IO**：提供处理文件、目录和 I/O 流的实用工具，简化了文件和流操作。
3.  **Commons Collections / Commons Collections4**：对 `java.util` 集合框架的补充，提供更多高级的数据结构和集合操作工具，如 Bag、BidiMap、各种 Predicate、Transformer 等。
4.  **Commons Codec**：提供常用的编码和解码算法实现，如 Base64、Hex、MD5、SHA1 等。
5.  **Commons Net**：提供客户端网络协议的实现，如 FTP、SMTP、POP3、NNTP 等。
6.  **Commons CLI**：用于解析命令行参数，帮助应用程序处理启动参数。
7.  **Commons Logging**：一个通用的日志抽象层，允许应用程序在运行时选择具体的日志实现（如 Log4j、java.util.logging 等）。
8.  **Commons Math**：提供了一套数学和统计学的实用工具，如各种分布、矩阵、线性代数、优化算法等。
9.  **Commons BeanUtils / PropertyUtils**：用于简化 Java Bean 的属性访问和操作，如属性拷贝、动态设置/获取属性值。
10. **Commons Configuration**：提供读取和管理各种配置文件的能力，如 XML、Properties、INI 等格式。
11. **Commons Validator**：提供可扩展的验证框架，用于验证数据。

## 三、常用模块详解与代码示例

为了更好地理解 Apache Commons 的强大之处，我们将详细介绍几个最常用且极具代表性的模块，并提供相应的 Java 代码示例。

### 3.1 Commons Lang

`Commons Lang` 是一个非常核心的模块，它扩展和增强了 Java 的核心类，提供了大量的工具方法来处理 `String`、`Number`、`Date`、`Object`、`Array` 等。

**Maven 依赖：**

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId> <!-- lang3 for Java 6+ -->
    <version>3.13.0</version>
</dependency>
```

#### 3.1.1 `StringUtils`

处理 `String` 字符串的各种实用方法，如判空、连接、裁剪、大小写转换等。

```java
import org.apache.commons.lang3.StringUtils;

public class StringUtilsDemo {
    public static void main(String[] args) {
        String str1 = null;
        String str2 = "";
        String str3 = "  ";
        String str4 = "Hello World";
        String str5 = " hello ";

        // 1. 判空：is (Not)Empty / is (Not)Blank
        // isEmpty: null 或 "" 返回 true
        System.out.println("isEmpty(str1): " + StringUtils.isEmpty(str1)); // true
        System.out.println("isEmpty(str2): " + StringUtils.isEmpty(str2)); // true
        System.out.println("isEmpty(str3): " + StringUtils.isEmpty(str3)); // false (包含空格)
        System.out.println("isEmpty(str4): " + StringUtils.isEmpty(str4)); // false

        // isBlank: null, "", 或只包含空格的字符串返回 true
        System.out.println("isBlank(str1): " + StringUtils.isBlank(str1)); // true
        System.out.println("isBlank(str2): " + StringUtils.isBlank(str2)); // true
        System.out.println("isBlank(str3): " + StringUtils.isBlank(str3)); // true
        System.out.println("isBlank(str4): " + StringUtils.isBlank(str4)); // false

        // 2. 连接字符串
        System.out.println("join: " + StringUtils.join("A", "B", "C", "D")); // ABCD
        System.out.println("join with separator: " + StringUtils.join(new String[]{"A", "B", "C"}, ", ")); // A, B, C

        // 3. 裁剪字符串 (去除首尾空格)
        System.out.println("trim: '" + StringUtils.trim(str5) + "'"); // 'hello'

        // 4. 判断字符串是否相等 (可处理 null)
        System.out.println("equals: " + StringUtils.equals(str4, "Hello World")); // true
        System.out.println("equals (null safe): " + StringUtils.equals(str1, null)); // true

        // 5. 检查是否包含某个子串
        System.out.println("contains: " + StringUtils.contains(str4, "World")); // true
        System.out.println("containsIgnoreCase: " + StringUtils.containsIgnoreCase(str4, "world")); // true
    }
}
```

#### 3.1.2 `NumberUtils`

处理 `Number` 类型的实用方法，如判断是否是数字、字符串到数字的安全转换等。

```java
import org.apache.commons.lang3.math.NumberUtils;

public class NumberUtilsDemo {
    public static void main(String[] args) {
        String numStr = "12345";
        String invalidNumStr = "123a";
        String emptyStr = "";
        String decimalStr = "3.14";

        // 1. 判断是否是数字
        System.out.println("isDigits(\"123\"): " + NumberUtils.isDigits("123")); // true (只包含数字字符)
        System.out.println("isDigits(numStr): " + NumberUtils.isDigits(numStr)); // true
        System.out.println("isDigits(invalidNumStr): " + NumberUtils.isDigits(invalidNumStr)); // false
        System.out.println("isDigits(emptyStr): " + NumberUtils.isDigits(emptyStr)); // false

        // 2. 判断是否是可解析的数值 (包括负数、浮点数、科学计数法等)
        System.out.println("isParsable(\"123\"): " + NumberUtils.isParsable("123")); // true
        System.out.println("isParsable(\"-12.3e-10\"): " + NumberUtils.isParsable("-12.3e-10")); // true
        System.out.println("isParsable(invalidNumStr): " + NumberUtils.isParsable(invalidNumStr)); // false

        // 3. 字符串转换为数字，提供默认值
        int parsedInt = NumberUtils.toInt(numStr, 0);
        System.out.println("toInt(\"" + numStr + "\", 0): " + parsedInt); // 12345

        int failedInt = NumberUtils.toInt(invalidNumStr, -1);
        System.out.println("toInt(\"" + invalidNumStr + "\", -1): " + failedInt); // -1 (转换失败，返回默认值)

        double parsedDouble = NumberUtils.toDouble(decimalStr, 0.0);
        System.out.println("toDouble(\"" + decimalStr + "\", 0.0): " + parsedDouble); // 3.14
    }
}
```

#### 3.1.3 `ArrayUtils`

提供对数组的各种操作，如判断是否为空、合并、添加、删除、反转等。

```java
import org.apache.commons.lang3.ArrayUtils;

public class ArrayUtilsDemo {
    public static void main(String[] args) {
        String[] arr1 = {"apple", "banana"};
        String[] arr2 = {"orange", "grape"};
        String[] emptyArr = {};
        String[] nullArr = null;

        // 1. 判空
        System.out.println("isEmpty(arr1): " + ArrayUtils.isEmpty(arr1)); // false
        System.out.println("isEmpty(emptyArr): " + ArrayUtils.isEmpty(emptyArr)); // true
        System.out.println("isEmpty(nullArr): " + ArrayUtils.isEmpty(nullArr)); // true

        // 2. 合并数组
        String[] combined = ArrayUtils.addAll(arr1, arr2);
        System.out.println("combined array: " + StringUtils.join(combined, ", ")); // apple, banana, orange, grape

        // 3. 检查数组是否包含某个元素
        System.out.println("contains 'banana': " + ArrayUtils.contains(arr1, "banana")); // true
        System.out.println("contains 'kiwi': " + ArrayUtils.contains(arr1, "kiwi")); // false

        // 4. 添加元素
        String[] newArr = ArrayUtils.add(arr1, "cherry");
        System.out.println("array after add: " + StringUtils.join(newArr, ", ")); // apple, banana, cherry

        // 5. 删除元素
        String[] removedArr = ArrayUtils.removeElement(newArr, "banana");
        System.out.println("array after remove: " + StringUtils.join(removedArr, ", ")); // apple, cherry
    }
}
```

### 3.2 Commons IO

`Commons IO` 提供了大量的 I/O 工具类和方法，极大地简化了文件、目录和流的处理。

**Maven 依赖：**

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.15.1</version>
</dependency>
```

#### 3.2.1 `FileUtils`

文件和目录操作的实用工具类。

```java
import org.apache.commons.io.FileUtils;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class FileUtilsDemo {
    public static void main(String[] args) {
        File testDir = new File("testDir");
        File file1 = new File(testDir, "file1.txt");
        File file2 = new File(testDir, "file2.txt");
        File destFile = new File(testDir, "copied_file.txt");
        File subDir = new File(testDir, "subDir");

        try {
            // 1. 创建目录 (如果不存在)
            FileUtils.forceMkdir(testDir);
            FileUtils.forceMkdir(subDir);
            System.out.println("Directories created: " + testDir.exists() + ", " + subDir.exists());

            // 2. 写入文件 (覆盖)
            FileUtils.writeStringToFile(file1, "Hello Commons IO!", StandardCharsets.UTF_8);
            System.out.println("Content written to " + file1.getName());

            // 3. 读取文件内容
            String content = FileUtils.readFileToString(file1, StandardCharsets.UTF_8);
            System.out.println("Content of " + file1.getName() + ": " + content);

            // 4. 复制文件
            FileUtils.copyFile(file1, destFile);
            System.out.println(file1.getName() + " copied to " + destFile.getName());

            // 5. 获取目录大小
            System.out.println("Size of " + testDir.getName() + ": " + FileUtils.sizeOfDirectory(testDir) + " bytes");

            // 6. 删除目录及其内容
            // FileUtils.deleteDirectory(testDir); // 慎用，会删除所有文件和子目录
            // System.out.println("Directory " + testDir.getName() + " deleted.");

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // 清理
            try {
                if (testDir.exists()) {
                    FileUtils.deleteDirectory(testDir);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

#### 3.2.2 `IOUtils`

处理 I/O 流的实用工具类，如复制流、关闭流、将流转换为字节数组或字符串。

```java
import org.apache.commons.io.IOUtils;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class IOUtilsDemo {
    public static void main(String[] args) {
        String data = "This is some stream data.";

        try (InputStream input = new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8));
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            // 1. 将 InputStream 转换为 String
            String readString = IOUtils.toString(input, StandardCharsets.UTF_8);
            System.out.println("Read from stream (toString): " + readString);

            // 重置输入流以便再次读取
            input.reset();

            // 2. 将 InputStream 内容复制到 OutputStream
            IOUtils.copy(input, output);
            System.out.println("Copied bytes to output stream.");

            // 3. 获取 OutputStream 的内容
            byte[] copiedBytes = output.toByteArray();
            System.out.println("Copied content (bytes): " + new String(copiedBytes, StandardCharsets.UTF_8));

            // 4. 判断两个输入流内容是否相等
            InputStream input1 = new ByteArrayInputStream("abc".getBytes());
            InputStream input2 = new ByteArrayInputStream("abc".getBytes());
            System.out.println("Content equals: " + IOUtils.contentEquals(input1, input2)); // true

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 3.3 Commons Codec

`Commons Codec` 提供了各种编码器和解码器，如 Base64、Hex、MD5、SHA1 等。

**Maven 依赖：**

```xml
<dependency>
    <groupId>commons-codec</groupId>
    <artifactId>commons-codec</artifactId>
    <version>1.16.0</version>
</dependency>
```

#### 3.3.1 `Base64`

Base64 编码和解码。

```java
import org.apache.commons.codec.binary.Base64;
import java.nio.charset.StandardCharsets;

public class Base64Demo {
    public static void main(String[] args) {
        String originalString = "Hello, Commons Codec!";

        // 编码
        byte[] encodedBytes = Base64.encodeBase64(originalString.getBytes(StandardCharsets.UTF_8));
        String encodedString = new String(encodedBytes, StandardCharsets.UTF_8);
        System.out.println("Original: " + originalString);
        System.out.println("Encoded (Base64): " + encodedString); // SGVsbG8sIENvbW1vbnMgQ29kZWMh

        // 解码
        byte[] decodedBytes = Base64.decodeBase64(encodedString.getBytes(StandardCharsets.UTF_8));
        String decodedString = new String(decodedBytes, StandardCharsets.UTF_8);
        System.out.println("Decoded: " + decodedString); // Hello, Commons Codec!
    }
}
```

#### 3.3.2 `DigestUtils`

提供 MD5、SHA 等消息摘要算法。

```java
import org.apache.commons.codec.digest.DigestUtils;
import java.nio.charset.StandardCharsets;

public class DigestUtilsDemo {
    public static void main(String[] args) {
        String input = "This is a secret message.";

        // MD5 哈希
        String md5Hash = DigestUtils.md5Hex(input.getBytes(StandardCharsets.UTF_8));
        System.out.println("MD5 Hash: " + md5Hash); // 922ef6a8362b165b40d6c13ed62d3e1b

        // SHA-256 哈希
        String sha256Hash = DigestUtils.sha256Hex(input.getBytes(StandardCharsets.UTF_8));
        System.out.println("SHA-256 Hash: " + sha256Hash); // 7a8f... (更长)
    }
}
```

## 四、如何引入 Apache Commons 库？

现代 Java 项目通常使用构建工具如 Maven 或 Gradle 来管理依赖。只需在项目的 `pom.xml` (Maven) 或 `build.gradle` (Gradle) 文件中添加相应的依赖即可。

**Maven (pom.xml):**

```xml
<dependencies>
    <!-- Commons Lang 3 -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
        <version>3.13.0</version>
    </dependency>

    <!-- Commons IO -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-io</artifactId>
        <version>2.15.1</version>
    </dependency>

    <!-- Commons Codec -->
    <dependency>
        <groupId>commons-codec</groupId>
        <artifactId>commons-codec</artifactId>
        <version>1.16.0</version>
    </dependency>

    <!-- 其他 Commons 模块按需添加 -->
</dependencies>
```

**Gradle (build.gradle):**

```gradle
dependencies {
    // Commons Lang 3
    implementation 'org.apache.commons:commons-lang3:3.13.0'

    // Commons IO
    implementation 'org.apache.commons:commons-io:2.15.1'

    // Commons Codec
    implementation 'commons-codec:commons-codec:1.16.0'

    // 其他 Commons 模块按需添加
}
```

## 五、优势与最佳实践

### 5.1 优势

1.  **提高开发效率**：大量预置的工具方法，减少了重复造轮子的工作。
2.  **代码质量与健壮性**：经过 Apache 社区的严格测试和多年验证，代码质量高，考虑了各种边界情况 (如 `null` 值处理)。
3.  **标准化与可读性**：提供了一套事实上的标准工具集，团队成员之间更容易理解和维护代码。
4.  **性能优化**：许多工具方法在实现时考虑了性能优化。
5.  **模块化设计**：按功能划分为独立的模块，可以按需引入，避免不必要的依赖。

### 5.2 最佳实践

1.  **按需引入**：只引入项目实际需要的 Commons 模块，避免引入过多不必要的依赖，增加 JAR 包大小和潜在的冲突。
2.  **熟悉常用类**：重点熟悉 `StringUtils`, `FileUtils`, `IOUtils` 等常用工具类，掌握其核心功能。
3.  **优先使用 Commons 方法**：在处理字符串、文件 I/O、数组等常见任务时，优先考虑使用 Commons 提供的工具方法，而不是自己编写重复代码。
4.  **注意版本兼容性**：确保使用的 Commons 模块版本与项目中的其他依赖兼容。例如，`commons-lang3` 是 `commons-lang` 的新一代版本，适用于 Java 6+。

## 六、总结

Apache Commons 库是 Java 开发中不可或缺的利器，它以其丰富的工具集、高质量的实现和模块化的设计，极大地提升了 Java 开发的效率和代码的健壮性。通过合理地利用 Commons 库，开发者可以专注于业务逻辑的实现，而将底层繁琐的通用任务交给这些成熟的组件来处理。掌握 Apache Commons 库的使用，是每一个 Java 开发者提升自身技能的重要一步。