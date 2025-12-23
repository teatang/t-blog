---
title: JDBC (Java Database Connectivity) 详解
date: 2024-01-20 06:24:00
tags:
  - 2024
  - Java
  - 程序设计
  - 编码规范
  - JDBC
categories:
  - Java
  - 程序设计
---
> **JDBC (Java Database Connectivity)** 是 Java 语言中用于访问关系型数据库的**标准 Java API (应用程序编程接口)**。它提供了一套统一的接口，允许 Java 应用程序以**独立于数据库供应商**的方式连接到各种关系型数据库（如 MySQL、Oracle、PostgreSQL、SQL Server 等），执行 SQL 语句，并处理查询结果。

{% note info %}
核心思想：**JDBC 提供了一个通用的抽象层，使得 Java 开发者可以使用一套标准的 API 来与任何支持 JDBC 规范的关系型数据库进行交互，而无需关心底层数据库的具体实现细节。**
{% endnote %}

------

## 一、为什么需要 JDBC？

在 JDBC 出现之前，Java 应用程序要连接和操作数据库，需要为每种数据库编写特定的代码。这意味着：

1.  **缺乏通用性**：每更换一个数据库，应用程序的代码就需要大幅修改。
2.  **开发效率低**：开发者需要熟悉不同数据库的私有 API。
3.  **维护成本高**：代码难以维护和扩展。

JDBC 的目标就是解决这些问题，提供一个**“一次编写，处处运行” (Write Once, Run Anywhere)** 的数据库访问解决方案：

*   **统一接口**：JDBC 定义了标准接口（`Connection`, `Statement`, `ResultSet` 等），Java 应用程序只需与这些接口交互。
*   **驱动实现**：每个数据库供应商提供其数据库的 JDBC **驱动程序 (Driver)**，这个驱动程序负责实现 JDBC 接口，并将 JDBC 调用翻译成数据库能理解的特定协议。
*   **数据库无关性**：应用程序代码只依赖于 JDBC 接口，切换数据库只需更换相应的 JDBC 驱动包和修改连接字符串即可，无需修改核心业务逻辑。

**JDBC 架构示意图：**

{% mermaid %}
graph TD
    A[Java Application] -->|JDBC API Calls| B[JDBC Driver Manager]
    B -->|加载并管理| C["JDBC Driver <br>(Vendor Specific)"]
    C -->|通过网络协议| D["Database (MySQL, <br>Oracle, PostgreSQL, etc.)"]
{% endmermaid %}

## 二、JDBC 核心组件与接口

JDBC API 主要由 `java.sql` 包中的接口和类组成。以下是其核心组件：

1.  **`DriverManager`**：
    *   管理 JDBC 驱动程序。
    *   负责注册和加载驱动，并根据传入的数据库 URL 找到合适的驱动来建立数据库连接。
    *   主要方法：`getConnection(String url, String user, String password)`。

2.  **`Connection`**：
    *   代表与特定数据库的会话（连接）。
    *   负责管理事务（提交、回滚）、创建 `Statement` 对象。
    *   重要方法：`createStatement()`, `prepareStatement(String sql)`, `commit()`, `rollback()`, `close()`。

3.  **`Statement`**：
    *   用于执行静态 SQL 语句并返回结果。
    *   执行不带参数的 SQL 语句。
    *   重要方法：`executeQuery(String sql)` (查询)、`executeUpdate(String sql)` (更新、插入、删除)、`execute(String sql)` (通用)。

4.  **`PreparedStatement`**：
    *   继承自 `Statement`，用于执行**预编译**的 SQL 语句。
    *   SQL 语句在创建时被发送到数据库进行预编译，可以使用**占位符 `?`** 来动态设置参数。
    *   优点：
        *   **性能优化**：对于多次执行相同 SQL 语句的情况，数据库只需编译一次。
        *   **防止 SQL 注入**：参数会被正确处理，避免恶意代码嵌入。
    *   重要方法：`setXxx(int parameterIndex, Xxx value)` (设置参数)、`executeQuery()`, `executeUpdate()`。

5.  **`CallableStatement`**：
    *   继承自 `PreparedStatement`，用于执行数据库的**存储过程 (Stored Procedures)**。
    *   支持输入参数、输出参数和返回值。

6.  **`ResultSet`**：
    *   代表 SQL 查询的结果集。
    *   是一个行迭代器，通过 `next()` 方法逐行遍历结果。
    *   提供了一系列 `getXxx(String columnName)` 或 `getXxx(int columnIndex)` 方法来获取当前行各个列的数据。
    *   重要方法：`next()`, `getXxx()`, `close()`。

## 三、JDBC 连接数据库的步骤 (JDBC 编程六步走)

使用 JDBC 访问数据库通常遵循以下六个基本步骤：

1.  **加载 JDBC 驱动**：将数据库厂商提供的 JDBC 驱动程序加载到 JVM 中。
2.  **建立数据库连接**：通过 `DriverManager` 获取 `Connection` 对象。
3.  **创建 Statement 对象**：通过 `Connection` 对象创建 `Statement` 或 `PreparedStatement` 对象。
4.  **执行 SQL 语句**：通过 `Statement` 或 `PreparedStatement` 对象执行 SQL 查询或更新。
5.  **处理查询结果**：如果执行的是查询语句，处理 `ResultSet` 返回的结果。
6.  **关闭资源**：依次关闭 `ResultSet`、`Statement` 和 `Connection` 对象，释放数据库资源。

**代码示例：JDBC 基础操作**

假设我们有一个 MySQL 数据库，用户名为 `root`，密码为 `123456`，数据库名为 `testdb`，其中包含一个 `users` 表：
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    age INT
);
```

**Maven 依赖 (MySQL Connector/J):**
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.32</version> <!-- 根据你的MySQL版本选择合适的驱动版本 -->
</dependency>
```

```java
import java.sql.*;

public class JDBCCrudDemo {
    // 数据库连接信息
    private static final String DB_URL = "jdbc:mysql://localhost:3306/testdb?useSSL=false&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASS = "123456";

    public static void main(String[] args) {
        // 1. 加载 JDBC 驱动
        // 对于 JDK 6+，DriverManager 会自动发现并加载合适的驱动，
        // 但显式加载 Class.forName("com.mysql.cj.jdbc.Driver"); 仍然是常见且安全的做法
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("JDBC Driver loaded successfully.");
        } catch (ClassNotFoundException e) {
            System.err.println("Failed to load JDBC driver: " + e.getMessage());
            e.printStackTrace();
            return;
        }

        Connection conn = null;
        PreparedStatement pstmt = null; // 推荐使用 PreparedStatement
        ResultSet rs = null;

        try {
            // 2. 建立数据库连接
            conn = DriverManager.getConnection(DB_URL, USER, PASS);
            conn.setAutoCommit(false); // 开启事务手动提交模式
            System.out.println("Database connection established.");

            // 3. 插入数据 (INSERT)
            String insertSql = "INSERT INTO users(name, age) VALUES(?, ?)";
            pstmt = conn.prepareStatement(insertSql);
            pstmt.setString(1, "Alice");
            pstmt.setInt(2, 30);
            int affectedRows = pstmt.executeUpdate();
            System.out.println("Inserted " + affectedRows + " row(s).");

            pstmt.setString(1, "Bob");
            pstmt.setInt(2, 25);
            affectedRows = pstmt.executeUpdate();
            System.out.println("Inserted " + affectedRows + " row(s).");
            conn.commit(); // 提交事务
            System.out.println("Insert transaction committed.");

            // 关闭 PreparedStatement，准备新的操作
            if (pstmt != null) {
                pstmt.close();
            }

            // 4. 查询数据 (SELECT)
            String selectSql = "SELECT id, name, age FROM users WHERE age > ?";
            pstmt = conn.prepareStatement(selectSql);
            pstmt.setInt(1, 28);
            rs = pstmt.executeQuery(); // 执行查询

            // 5. 处理查询结果
            System.out.println("\n--- Query Results (Users older than 28) ---");
            while (rs.next()) { // 遍历结果集
                int id = rs.getInt("id");
                String name = rs.getString("name");
                int age = rs.getInt("age");
                System.out.println("ID: " + id + ", Name: " + name + ", Age: " + age);
            }
            System.out.println("----------------------------------------");

            // 关闭 ResultSet，准备新的操作
            if (rs != null) {
                rs.close();
            }
            if (pstmt != null) {
                pstmt.close();
            }

            // 6. 更新数据 (UPDATE)
            String updateSql = "UPDATE users SET age = ? WHERE name = ?";
            pstmt = conn.prepareStatement(updateSql);
            pstmt.setInt(1, 31);
            pstmt.setString(2, "Alice");
            affectedRows = pstmt.executeUpdate();
            System.out.println("\nUpdated " + affectedRows + " row(s).");
            conn.commit();
            System.out.println("Update transaction committed.");

            // 关闭 PreparedStatement，准备新的操作
            if (pstmt != null) {
                pstmt.close();
            }

            // 7. 删除数据 (DELETE)
            String deleteSql = "DELETE FROM users WHERE name = ?";
            pstmt = conn.prepareStatement(deleteSql);
            pstmt.setString(1, "Bob");
            affectedRows = pstmt.executeUpdate();
            System.out.println("\nDeleted " + affectedRows + " row(s).");
            conn.commit();
            System.out.println("Delete transaction committed.");

        } catch (SQLException e) {
            System.err.println("Database operation failed: " + e.getMessage());
            e.printStackTrace();
            try {
                if (conn != null) {
                    conn.rollback(); // 发生异常时回滚事务
                    System.out.println("Transaction rolled back.");
                }
            } catch (SQLException ex) {
                System.err.println("Rollback failed: " + ex.getMessage());
            }
        } finally {
            // 8. 关闭资源 (重要！)
            try {
                if (rs != null) rs.close();
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
                System.out.println("\nAll JDBC resources closed.");
            } catch (SQLException e) {
                System.err.println("Error closing JDBC resources: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
```

## 四、JDBC 事务管理

事务 (Transaction) 是一系列数据库操作，这些操作要么全部成功提交，要么全部失败回滚。JDBC 支持事务管理。

*   **默认行为**：`Connection` 对象默认是**自动提交 (Auto-Commit)** 模式，即每执行一个 SQL 语句，都会立即提交到数据库。
*   **手动事务**：
    1.  `conn.setAutoCommit(false);`：将连接设置为手动提交模式。
    2.  执行一系列 SQL 操作。
    3.  `conn.commit();`：所有操作成功后，提交事务。
    4.  `conn.rollback();`：如果任何操作失败，回滚事务，撤销所有未提交的更改。
    5.  `conn.setAutoCommit(true);`：可选，恢复为自动提交模式。

在上面的示例中，我们已经演示了如何通过 `setAutoCommit(false)`、`commit()` 和 `rollback()` 来进行事务管理。

## 五、Statement, PreparedStatement 和 CallableStatement 的区别

| 特性           | `Statement`                     | `PreparedStatement`                  | `CallableStatement`                 |
| :------------- | :------------------------------ | :----------------------------------- | :---------------------------------- |
| **用途**       | 执行静态 SQL 语句。             | 执行预编译的 SQL 语句。             | 执行数据库存储过程。                 |
| **SQL 语句**   | 每次执行时都传递完整的 SQL 字符串。 | 使用占位符 `?`，SQL 语句模板预编译。 | 使用 `{call procedure_name(?, ?)}` 语法。 |
| **参数处理**   | 通过字符串拼接 SQL 语句，可能导致 SQL 注入。 | 通过 `setXxx()` 方法安全地设置参数。 | 支持输入 (`IN`)、输出 (`OUT`)、输入/输出 (`INOUT`) 参数。 |
| **性能**       | 每次执行都需数据库编译，性能较低。 | SQL 语句只需编译一次，后续执行性能高。 | 每次执行都需数据库编译存储过程，但存储过程本身已编译。 |
| **安全性**     | 易受 SQL 注入攻击。             | **有效防止 SQL 注入攻击。**         | 相对安全，但仍需谨慎处理参数。      |
| **适用场景**   | 只执行一次且不带参数的简单 SQL 语句。 | 大多数场景，特别是多次执行、带参数或防止 SQL 注入的语句。 | 调用数据库存储过程。                 |

**强烈建议在绝大多数情况下使用 `PreparedStatement`。**

## 六、JDBC 最佳实践

1.  **始终关闭资源**：在 `finally` 块中按照 `ResultSet` -> `Statement` -> `Connection` 的顺序关闭资源，防止资源泄露。使用 try-with-resources 语法 (JDK 7+) 可以极大地简化这个过程并确保资源正确关闭。
2.  **使用 `PreparedStatement`**：优先使用 `PreparedStatement` 来执行 SQL 语句，以提高性能和防止 SQL 注入。
3.  **事务管理**：合理使用事务来确保数据的一致性，将相关联的数据库操作放在一个事务中。
4.  **连接池**：在生产环境中，**切勿直接使用 `DriverManager` 获取连接**。这会导致每次请求都创建和销毁连接，性能极低。应使用数据库连接池（如 C3P0, Druid, HikariCP）来管理连接，提高性能和资源复用。
5.  **异常处理**：捕获并处理 `SQLException`，提供有意义的错误信息。
6.  **日志记录**：使用日志框架（如 Log4j, SLF4J）记录数据库操作和异常信息。
7.  **避免在循环中创建 Statement/Connection**：这些操作都是昂贵的。
8.  **参数索引从 1 开始**：JDBC API 中 `PreparedStatement` 的参数索引是从 1 开始的，而不是 0。

**使用 try-with-resources 改进资源关闭：**

```java
import java.sql.*;

public class JDBCTryWithResources {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/testdb?useSSL=false&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASS = "123456";

    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("Driver not found: " + e.getMessage());
            return;
        }

        String selectSql = "SELECT id, name, age FROM users";
        // try-with-resources 会自动关闭在括号内声明的实现了 AutoCloseable 接口的资源
        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
             PreparedStatement pstmt = conn.prepareStatement(selectSql);
             ResultSet rs = pstmt.executeQuery()) { // 注意：ResultSet 也是 AutoCloseable

            System.out.println("--- All Users ---");
            while (rs.next()) {
                int id = rs.getInt("id");
                String name = rs.getString("name");
                int age = rs.getInt("age");
                System.out.println("ID: " + id + ", Name: " + name + ", Age: " + age);
            }
            System.out.println("-----------------");

        } catch (SQLException e) {
            System.err.println("Database operation error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

## 七、总结

JDBC 作为 Java 应用程序与关系型数据库交互的基石，虽然在现代 Java 开发中，我们更多地接触到的是基于 JDBC 之上的更高级别的框架（如 JPA/Hibernate、MyBatis、Spring Data JDBC），但理解 JDBC 的底层原理和工作方式对于深入理解这些框架至关重要。掌握 JDBC 不仅能让我们直接操作数据库，更能为理解数据访问层的设计模式和优化策略打下坚实的基础。通过遵循最佳实践，可以确保编写出高效、安全、可维护的数据库访问代码。