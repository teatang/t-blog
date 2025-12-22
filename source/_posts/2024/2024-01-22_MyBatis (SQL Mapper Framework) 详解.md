---
title: MyBatis (SQL Mapper Framework) 详解
date: 2024-01-22 06:24:00
tags:
  - 2024
  - Java
  - 程序设计
  - JDBC
categories:
  - Java
  - 库
---
> **MyBatis** 是一款优秀的**持久层框架**，它避免了几乎所有的 JDBC 代码和手动设置参数以及获取结果集的工作。MyBatis 使用简单的 XML 或注解来配置和映射原始类型、Map 和 POJO 到数据库中的记录。它是一个 **SQL Mapper 框架**，强调 SQL 的灵活性和控制性，允许开发者完全掌控 SQL 语句，而不需要像全功能 ORM 框架（如 Hibernate）那样进行过度的抽象。

{% note info %}
核心思想：**MyBatis 提供了一个介于应用程序和数据库之间的桥梁，将 SQL 语句和应用程序代码解耦，并通过 XML 或注解定义 SQL 映射关系，实现数据对象的灵活持久化。它允许开发者编写高性能、可优化的定制化 SQL。**
{% endnote %}

------

## 一、为什么需要 MyBatis？

在 Java Web 开发中，持久层是处理数据存储和检索的关键部分。传统的 JDBC (Java Database Connectivity) 直接操作数据库，虽然提供了最大的灵活性，但存在以下痛点：

1.  **代码冗余和复杂**：需要手动编写大量的模板代码来建立连接、创建 `Statement`、设置参数、处理 `ResultSet`、关闭资源等。
2.  **SQL 与 Java 代码耦合**：SQL 语句通常硬编码在 Java 代码中，导致可维护性差，修改 SQL 需要重新编译 Java 代码。
3.  **结果集处理繁琐**：手动将 `ResultSet` 中的数据映射到 Java 对象是重复且容易出错的工作。
4.  **SQL 注入风险**：手动拼接 SQL 字符串容易遭受 SQL 注入攻击。

虽然像 Hibernate 这样的全功能 ORM 框架解决了这些问题，但它们也带来了新的挑战：

*   **过度封装**：对 SQL 的过度封装导致开发者失去对底层 SQL 的控制，难以编写高度优化或复杂的特定数据库 SQL。
*   **学习曲线**：需要理解复杂的 ORM 概念（如对象状态、缓存机制、延迟加载等）。
*   **性能问题**：在某些复杂查询或大规模数据操作场景下，生成的 SQL 可能不是最优的，性能可能不如手动优化的 SQL。

MyBatis 正是为了在灵活性和开发效率之间取得平衡而诞生的。它：
*   **消除了 JDBC 的大部分样板代码**，通过配置映射关系自动完成参数设置和结果集映射。
*   **将 SQL 从 Java 代码中分离**，集中管理在 XML 文件或注解中，提高了可维护性。
*   **提供了对 SQL 的完全控制**，允许开发者编写定制化、高性能的 SQL 语句。
*   **内置了动态 SQL 功能**，可以根据条件动态构建 SQL 语句，解决了 SQL 拼接的难题。
*   **支持事务管理和缓存机制**。

## 二、MyBatis 核心组件与架构

MyBatis 的核心架构涉及以下几个主要组件：

1.  **`SqlSessionFactoryBuilder`**：
    *   根据配置文件 (`mybatis-config.xml`) 或 `Configuration` 对象构建 `SqlSessionFactory`。
    *   它的作用域是方法级别的，一旦构建完 `SqlSessionFactory` 就不再需要它了。

2.  **`SqlSessionFactory`**：
    *   负责创建 `SqlSession` 实例的工厂。
    *   它是线程安全的，一旦创建就应该在应用的整个生命周期中存在。通常一个应用只创建一个 `SqlSessionFactory` 实例。

3.  **`SqlSession`**：
    *   表示与数据库交互的会话。
    *   它包含了执行 SQL 语句、管理事务（提交、回滚）等方法。
    *   `SqlSession` 不是线程安全的，它的生命周期应与一次请求或一个业务操作保持一致，使用完毕后必须关闭。

4.  **Mapper 接口 (Mapper Interface)**：
    *   定义了应用程序与数据库交互的方法。这些方法无需实现，MyBatis 会通过动态代理自动生成实现。
    *   每个 Mapper 接口通常对应一个数据库表或业务实体。

5.  **Mapper XML 文件 (Mapper XML File)**：
    *   定义了 SQL 语句以及如何将参数映射到 SQL，如何将结果集映射到 Java 对象。
    *   一个 Mapper XML 文件通常与一个 Mapper 接口对应。

6.  **`mybatis-config.xml` (MyBatis 主配置文件)**：
    *   配置数据源、事务管理器、类型别名、插件、Mapper 文件的位置等。
    *   它是 MyBatis 启动和运行的核心配置。

**MyBatis 架构示意图：**

{% mermaid %}
graph TD
    A[Application] -->|1. 构建| B{SqlSessionFactoryBuilder};
    B -->|2. 加载配置| C[mybatis-config.xml / <br>Configuration];
    B -->|3. 创建| D[SqlSessionFactory];
    D -->|4. 打开会话| E["SqlSession (短生命周期)"];
    E -->|5. 获取 Mapper| F["Mapper Interface (Proxy)"];
    F -->|6. 执行 SQL| G[Mapper XML / Annotations];
    G -->|7. JDBC API| H[JDBC Driver];
    H -->|8. 交互| I[Database];
{% endmermaid %}

## 三、MyBatis 快速入门与代码示例

我们将通过一个简单的 CRUD (创建、读取、更新、删除) 示例来演示 MyBatis 的基本使用。

### 3.1 准备工作 (Maven 依赖与数据库)

**Maven 依赖 (pom.xml):**

```xml
<dependencies>
    <!-- MyBatis 核心依赖 -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.15</version> <!-- 使用最新稳定版本 -->
    </dependency>
    <!-- MySQL 驱动 -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.32</version> <!-- 根据你的MySQL版本选择 -->
    </dependency>
    <!-- Log4j2 (可选，用于输出SQL日志) -->
    <dependency>
        <groupId>org.apache.logging.log4j</groupId>
        <artifactId>log4j-api</artifactId>
        <version>2.23.0</version>
    </dependency>
    <dependency>
        <groupId>org.apache.logging.log4j</groupId>
        <artifactId>log4j-core</artifactId>
        <version>2.23.0</version>
    </dependency>
</dependencies>
```

**数据库表 (MySQL):**

```sql
CREATE DATABASE IF NOT EXISTS mybatis_demo;
USE mybatis_demo;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE
);
```

**`log4j2.xml` (可选，放在 `src/main/resources` 下，用于打印 SQL 日志):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
    </Appenders>
    <Loggers>
        <!-- 将 MyBatis 的日志级别设置为 DEBUG，可以看到执行的 SQL 语句和参数 -->
        <Logger name="com.example.mapper" level="DEBUG" additivity="false">
            <AppenderRef ref="Console"/>
        </Logger>
        <Root level="INFO">
            <AppenderRef ref="Console"/>
        </Root>
    </Loggers>
</Configuration>
```

### 3.2 MyBatis 配置文件 (`mybatis-config.xml`)

放在 `src/main/resources` 目录下。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!-- 配置 log4j2 启用 MyBatis 的日志 -->
    <settings>
        <setting name="logImpl" value="LOG4J2"/>
    </settings>

    <!-- 定义类型别名，方便在 Mapper XML 中使用 -->
    <typeAliases>
        <package name="com.example.model"/> <!-- 扫描 com.example.model 包下的所有类并自动取别名 -->
    </typeAliases>

    <!-- 配置环境，可以有多个环境，这里只配置一个开发环境 -->
    <environments default="development">
        <environment id="development">
            <!-- 事务管理器：JDBC 或 MANAGED -->
            <transactionManager type="JDBC"/>
            <!-- 数据源：POOLED (使用连接池), UNPOOLED (每次都创建新连接), JNDI -->
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/mybatis_demo?useSSL=false&amp;serverTimezone=UTC"/>
                <property name="username" value="root"/>
                <property name="password" value="123456"/>
            </dataSource>
        </environment>
    </environments>

    <!-- 映射器：注册 Mapper XML 文件 -->
    <mappers>
        <mapper resource="mapper/UserMapper.xml"/>
        <!-- 或者使用 package 扫描
        <package name="com.example.mapper"/>
        -->
    </mappers>
</configuration>
```

### 3.3 实体类 (POJO - `User.java`)

```java
// src/main/java/com/example/model/User.java
package com.example.model;

public class User {
    private Integer id;
    private String name;
    private String email;

    // 无参构造器
    public User() {}

    // 全参构造器 (方便创建对象)
    public User(Integer id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public User(String name, String email) {
        this(null, name, email); // id 自动生成
    }

    // Getter 和 Setter 方法
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public String toString() {
        return "User{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", email='" + email + '\'' +
               '}';
    }
}
```

### 3.4 Mapper 接口 (`UserMapper.java`)

```java
// src/main/java/com/example/mapper/UserMapper.java
package com.example.mapper;

import com.example.model.User;
import java.util.List;

public interface UserMapper {
    // 插入用户，并获取生成的主键ID
    int insertUser(User user);

    // 根据ID查询用户
    User selectUserById(Integer id);

    // 查询所有用户
    List<User> selectAllUsers();

    // 更新用户
    int updateUser(User user);

    // 删除用户
    int deleteUser(Integer id);
}
```

### 3.5 Mapper XML 文件 (`UserMapper.xml`)

放在 `src/main/resources/mapper` 目录下，与 Mapper 接口同名对应。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
    <!-- 插入用户，useGeneratedKeys 和 keyProperty 用于获取自增ID -->
    <insert id="insertUser" parameterType="User" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (name, email) VALUES (#{name}, #{email})
    </insert>

    <!-- 根据ID查询用户 -->
    <select id="selectUserById" parameterType="int" resultType="User">
        SELECT id, name, email FROM users WHERE id = #{id}
    </select>

    <!-- 查询所有用户 -->
    <select id="selectAllUsers" resultType="User">
        SELECT id, name, email FROM users
    </select>

    <!-- 更新用户 -->
    <update id="updateUser" parameterType="User">
        UPDATE users
        SET name = #{name}, email = #{email}
        WHERE id = #{id}
    </update>

    <!-- 删除用户 -->
    <delete id="deleteUser" parameterType="int">
        DELETE FROM users WHERE id = #{id}
    </delete>
</mapper>
```

### 3.6 主程序 (`MyBatisDemo.java`)

```java
// src/main/java/com/example/MyBatisDemo.java
package com.example;

import com.example.mapper.UserMapper;
import com.example.model.User;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public class MyBatisDemo {

    public static void main(String[] args) {
        String resource = "mybatis-config.xml";
        InputStream inputStream = null;
        try {
            inputStream = Resources.getResourceAsStream(resource);
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }

        // 1. 构建 SqlSessionFactory
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        System.out.println("SqlSessionFactory built successfully.");

        // 2. 使用 try-with-resources 确保 SqlSession 自动关闭
        try (SqlSession session = sqlSessionFactory.openSession()) {
            // 3. 获取 Mapper 实例
            UserMapper userMapper = session.getMapper(UserMapper.class);
            System.out.println("UserMapper obtained.");

            // 4. 执行 CRUD 操作

            // 插入用户
            System.out.println("\n--- Insert User ---");
            User newUser = new User("Alice", "alice@example.com");
            int insertCount = userMapper.insertUser(newUser);
            System.out.println("Inserted " + insertCount + " user. Generated ID: " + newUser.getId());
            session.commit(); // 提交事务

            newUser = new User("Bob", "bob@example.com");
            insertCount = userMapper.insertUser(newUser);
            System.out.println("Inserted " + insertCount + " user. Generated ID: " + newUser.getId());
            session.commit(); // 提交事务

            // 查询所有用户
            System.out.println("\n--- Select All Users ---");
            List<User> users = userMapper.selectAllUsers();
            users.forEach(System.out::println);

            // 根据ID查询用户
            System.out.println("\n--- Select User by ID (ID: " + newUser.getId() + ") ---");
            User userById = userMapper.selectUserById(newUser.getId());
            System.out.println("Found User: " + userById);

            // 更新用户
            System.out.println("\n--- Update User (ID: " + newUser.getId() + ") ---");
            userById.setName("Robert");
            userById.setEmail("robert@example.com");
            int updateCount = userMapper.updateUser(userById);
            System.out.println("Updated " + updateCount + " user.");
            session.commit(); // 提交事务

            // 再次查询更新后的用户
            System.out.println("\n--- Select Updated User ---");
            userById = userMapper.selectUserById(userById.getId());
            System.out.println("Updated User: " + userById);

            // 删除用户
            System.out.println("\n--- Delete User (ID: " + newUser.getId() + ") ---");
            int deleteCount = userMapper.deleteUser(newUser.getId());
            System.out.println("Deleted " + deleteCount + " user.");
            session.commit(); // 提交事务

            // 再次查询所有用户，验证删除
            System.out.println("\n--- Select All Users After Delete ---");
            userMapper.selectAllUsers().forEach(System.out::println);


        } catch (Exception e) {
            e.printStackTrace();
            // 如果发生异常，SqlSession 会自动回滚 (默认情况下)
            // 但如果手动开启了事务，需要手动回滚
            // session.rollback(); // 在 try-with-resources 中，如果异常，session会关闭，不需手动rollback
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
            System.out.println("\nMyBatis Demo finished.");
        }
    }
}
```

## 四、MyBatis 进阶特性

### 4.1 动态 SQL

MyBatis 最强大的功能之一就是动态 SQL。它提供了一套强大的标签（如 `<if>`, `<where>`, `<foreach>`, `<set>`, `<trim>` 等），可以根据条件动态构建 SQL 语句，避免了传统方式下复杂的字符串拼接。

**示例：动态查询**

```xml
<!-- com/example/mapper/UserMapper.xml -->
<mapper namespace="com.example.mapper.UserMapper">
    <!-- ... (前面的CRUD操作) ... -->

    <select id="selectUsersByCriteria" parameterType="map" resultType="User">
        SELECT id, name, email FROM users
        <where> <!-- 自动处理第一个条件前的 AND/OR，以及没有条件时的 WHERE 关键词 -->
            <if test="name != null and name != ''">
                name LIKE CONCAT('%', #{name}, '%')
            </if>
            <if test="email != null and email != ''">
                AND email = #{email}
            </if>
        </where>
    </select>

    <!-- 批量插入示例 -->
    <insert id="insertBatchUsers" parameterType="list">
        INSERT INTO users (name, email) VALUES
        <foreach collection="list" item="user" separator=",">
            (#{user.name}, #{user.email})
        </foreach>
    </insert>
</mapper>
```

**Mapper 接口添加方法：**

```java
// com/example/mapper/UserMapper.java
// ...
import java.util.Map;

public interface UserMapper {
    // ...
    List<User> selectUsersByCriteria(Map<String, Object> params);
    int insertBatchUsers(List<User> users);
}
```

**调用示例：**

```java
// MyBatisDemo.java main 方法中
// ...
            System.out.println("\n--- Dynamic SQL: Select Users by Criteria ---");
            Map<String, Object> searchParams = new HashMap<>();
            searchParams.put("name", "lice"); // 模糊查询
            // searchParams.put("email", "alice@example.com"); // 精确查询

            List<User> filteredUsers = userMapper.selectUsersByCriteria(searchParams);
            filteredUsers.forEach(System.out::println);

            // 批量插入
            System.out.println("\n--- Batch Insert Users ---");
            List<User> newUsers = new ArrayList<>();
            newUsers.add(new User("Charlie", "charlie@example.com"));
            newUsers.add(new User("David", "david@example.com"));
            int batchInsertCount = userMapper.insertBatchUsers(newUsers);
            System.out.println("Batch inserted " + batchInsertCount + " users.");
            session.commit();
```

### 4.2 结果映射 (`<resultMap>`)

当数据库列名与 Java 实体类属性名不一致，或者需要进行复杂的对象关联（一对一、一对多）映射时，`resultType` 就不够用了，这时需要使用 `<resultMap>`。

```xml
<!-- com/example/mapper/UserMapper.xml -->
<mapper namespace="com.example.mapper.UserMapper">
    <!-- 定义一个结果映射 -->
    <resultMap id="userResultMap" type="User">
        <!-- id 元素用于指定主键列的映射 -->
        <id property="id" column="id"/>
        <!-- result 元素用于指定普通列的映射 -->
        <result property="name" column="user_name"/> <!-- 假设数据库列名为 user_name -->
        <result property="email" column="user_email"/> <!-- 假设数据库列名为 user_email -->
    </resultMap>

    <select id="selectUserWithCustomColumns" resultMap="userResultMap">
        SELECT id, user_name, user_email FROM users_with_custom_columns WHERE id = #{id}
    </select>
</mapper>
```
**注意：** 实际项目中，如果列名与属性名不一致，也可以在 SQL 中使用 `AS` 进行别名映射，例如 `SELECT id, user_name AS name, user_email AS email FROM users;`，这样就仍可以使用 `resultType`。`resultMap` 更强大的地方在于处理复杂关联查询和嵌套对象。

### 4.3 缓存

MyBatis 内置了两级缓存：

1.  **一级缓存 (Local Cache)**：
    *   `SqlSession` 级别的缓存。
    *   默认开启，生命周期与 `SqlSession` 相同。
    *   在同一个 `SqlSession` 中，多次执行相同的查询，只有第一次会访问数据库，后续会从缓存中获取。
    *   当 `SqlSession` 关闭或提交/回滚事务时，一级缓存会被清空。

2.  **二级缓存 (Global Cache)**：
    *   `SqlSessionFactory` 级别的缓存，跨 `SqlSession` 共享。
    *   默认关闭，需要手动配置开启。
    *   Mapper 级别的缓存，不同 `SqlSession` 执行同一个 Mapper 命名空间下的查询时，可以共享缓存数据。
    *   使用 `Ehcache` 或 `Redis` 等作为缓存实现。

**开启二级缓存：**
在 `mybatis-config.xml` 中配置：
```xml
<configuration>
    <settings>
        <setting name="cacheEnabled" value="true"/> <!-- 全局开启二级缓存 -->
    </settings>
    <!-- ... 其他配置 ... -->
</configuration>
```
在 Mapper XML 文件中添加 `<cache/>` 标签：
```xml
<!-- com/example/mapper/UserMapper.xml -->
<mapper namespace="com.example.mapper.UserMapper">
    <cache/> <!-- 启用当前 Mapper 的二级缓存 -->
    <!-- ... SQL 语句 ... -->
</mapper>
```
**注意：** 开启二级缓存需要谨慎，要考虑缓存穿透、缓存雪崩、缓存一致性等问题。对于读多写少且对实时性要求不高的场景比较适合。

### 4.4 注解方式配置

除了 XML 文件，MyBatis 也支持使用注解来配置 SQL 映射。对于简单的 CRUD 操作，注解方式更加简洁。

```java
// com/example/mapper/UserMapperAnnotations.java
package com.example.mapper;

import com.example.model.User;
import org.apache.ibatis.annotations.*;

import java.util.List;

public interface UserMapperAnnotations {
    @Insert("INSERT INTO users (name, email) VALUES (#{name}, #{email})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertUser(User user);

    @Select("SELECT id, name, email FROM users WHERE id = #{id}")
    User selectUserById(Integer id);

    @Select("SELECT id, name, email FROM users")
    List<User> selectAllUsers();

    @Update("UPDATE users SET name = #{name}, email = #{email} WHERE id = #{id}")
    int updateUser(User user);

    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteUser(Integer id);

    // 动态 SQL 注解方式，相对复杂，通常结合 @SelectProvider 等实现
    // @SelectProvider(type = UserSqlBuilder.class, method = "buildSelectSql")
    // List<User> selectUsersByCriteria(@Param("name") String name, @Param("email") String email);
}
```
**在 `mybatis-config.xml` 中注册注解 Mapper：**
```xml
<mappers>
    <!-- ... -->
    <mapper class="com.example.mapper.UserMapperAnnotations"/>
</mappers>
```
**建议：** 对于复杂 SQL 或动态 SQL，XML 配置通常更具可读性和可维护性。对于简单、固定 SQL 的 CRUD 操作，注解是一个不错的选择。

## 五、MyBatis 与其他框架的集成

*   **MyBatis-Spring**：MyBatis 提供了 `mybatis-spring` 集成包，可以与 Spring 框架无缝集成。通过 Spring 管理 `SqlSessionFactory` 和 `SqlSession`，并支持声明式事务，极大地简化了开发。
*   **Spring Boot**：在 Spring Boot 项目中，通过 `mybatis-spring-boot-starter` 可以非常方便地集成 MyBatis，只需少量配置即可快速启动。

## 六、MyBatis vs. Hibernate/JPA 简要对比

| 特性         | MyBatis                                   | Hibernate / JPA (全功能 ORM)                           |
| :----------- | :---------------------------------------- | :------------------------------------------------------- |
| **SQL 控制** | **SQL 导向**，完全控制 SQL 语句，可定制、优化。 | **对象导向**，通常通过 HQL/JPQL 或 Criteria API 生成 SQL，对底层 SQL 控制较少。 |
| **学习曲线** | 相对直接，概念更贴近 SQL。                 | 复杂概念（会话、对象状态、级联、延迟加载等），学习曲线较陡。 |
| **开发效率** | 对于简单 CRUD，效率不如 ORM；对于复杂定制 SQL，效率高。 | 对于标准 CRUD 操作，开发效率高；对于复杂定制 SQL，可能需要绕道或优化。 |
| **性能**     | 易于编写高性能、精细优化的 SQL。           | 生成的 SQL 性能可能不是最优，需通过调优或原生 SQL 弥补。 |
| **可维护性** | SQL 与 Java 代码分离，易于 SQL 维护。      | 对象模型与数据库模型分离，数据库变更对 Java 代码影响小。 |
| **适用场景** | 对 SQL 性能、灵活性要求高的项目；现有数据库结构复杂或非标准；需要使用特定数据库功能或存储过程；追求 SQL 透明度。| 快速开发，对 SQL 细节不敏感；对象模型与关系模型对应紧密； 跨数据库平台，减少数据库切换成本；更倾向于面向对象编程。|

## 七、最佳实践

1.  **`SqlSession` 生命周期**：`SqlSession` 不是线程安全的，每次操作都应该获取一个新的 `SqlSession` 实例，并在操作完成后立即关闭。**务必使用 `try-with-resources` 语句来管理 `SqlSession`。**
2.  **事务管理**：手动管理事务时，记得调用 `session.commit()` 提交事务和 `session.rollback()` 回滚事务。在 Spring 环境下，通常由 Spring 进行声明式事务管理。
3.  **Mapper 接口与 XML 文件的命名空间**：Mapper 接口的全限定名必须与 Mapper XML 文件中的 `namespace` 属性值完全一致。
4.  **参数类型和结果类型**：清晰地指定 `parameterType` 和 `resultType` (或 `resultMap`)。
5.  **合理使用动态 SQL**：动态 SQL 功能强大，但也可能增加 SQL 的复杂性，应根据实际情况合理使用。
6.  **防止 SQL 注入**：MyBatis 默认使用 `#{}` 占位符，它会自动进行预编译和参数绑定，有效防止 SQL 注入。应避免使用 `${}` 占位符，除非确定内容安全（例如用于表名、列名等不接受用户输入的场景）。
7.  **日志记录**：配置日志框架（如 Log4j2、SLF4J）以查看 MyBatis 生成的 SQL 语句和参数，便于调试和性能分析。
8.  **连接池**：在 `mybatis-config.xml` 中，推荐使用 `POOLED` 类型的数据源，或者更推荐使用第三方连接池（如 HikariCP、Druid），Spring 集成时通常由 Spring 管理数据源。

## 八、总结

MyBatis 作为一个强大的 SQL Mapper 框架，在 Java 持久层领域占据了重要地位。它提供了在传统 JDBC 的灵活性和现代 ORM 框架的开发效率之间取得平衡的解决方案。通过将 SQL 语句与 Java 代码分离，以及强大的动态 SQL 功能，MyBatis 赋能开发者编写出高性能、可维护且高度定制化的数据库访问代码。深入理解和掌握 MyBatis 的核心概念和最佳实践，对于 Java 开发者来说，是提升数据库交互能力的关键一步。