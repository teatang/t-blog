---
title: MyBatis-Plus (MP) 详解
date: 2024-01-24 06:24:00
tags:
  - 2024
  - Java
  - 程序设计
  - JDBC
categories:
  - Java
  - 库
---
> **MyBatis-Plus (MP)** 是一个基于 **MyBatis** 的**增强工具**，它在 MyBatis 的基础上提供了许多便捷的功能，旨在简化开发、提高效率。MP 提供了**无侵入式**的特性，即它仅在 MyBatis 的基础上进行增强，不改变 MyBatis 原有的逻辑和配置，可以与 MyBatis 完全兼容。它的核心目标是**少写代码，甚至不用写 SQL**，即可完成大部分常见的 CRUD (创建、读取、更新、删除) 操作。

{% note info %}
核心思想：**MyBatis-Plus 通过提供通用的 CRUD 接口、强大的条件构造器、代码生成器以及一系列自动化功能，极大地减少了开发者在持久层的工作量，使得 MyBatis 更加易用，开发效率更高，同时保留了 MyBatis 对 SQL 的高度控制能力。**
{% endnote %}

------

## 一、为什么需要 MyBatis-Plus？

尽管 MyBatis 已经是一个非常优秀的持久层框架，解决了传统 JDBC 的许多痛点，但在实际开发中，仍然存在一些重复性劳动：

1.  **大量重复的 CRUD SQL**：对于每个实体类，都需要编写大量的 `insert`, `selectById`, `updateById`, `deleteById`, `selectAll` 等基础 SQL 语句和对应的 Mapper 接口方法。
2.  **通用查询的繁琐**：即使是简单的 `WHERE name = 'xxx'` 或 `WHERE age > 18` 这样的条件查询，也需要在 XML 中编写 SQL 或在 Mapper 接口使用 `@Select` 注解，当条件复杂时，动态 SQL 标签会变得冗长。
3.  **分页功能的集成**：集成第三方分页插件（如 PageHelper）虽然有效，但仍需额外配置和代码编写。
4.  **业务字段自动化**：如创建时间、更新时间、逻辑删除等字段，需要手动维护。
5.  **主键策略配置**：主键自增、UUID 等策略需要手动在 XML 中配置。

MyBatis-Plus 正是为了解决这些问题而生，它提供了以下显著优势：

*   **开箱即用，无需编写 Mapper XML**：针对单表 CRUD 操作，只需继承 `BaseMapper` 即可获得所有常用方法，无需编写 SQL。
*   **强大的条件构造器 (Wrapper)**：通过链式 API 编程方式构建复杂查询条件，无需手写动态 SQL。
*   **内置分页插件**：无需额外配置，即可实现高效分页。
*   **代码生成器**：根据数据库表自动生成实体类 (Entity)、Mapper、Service、Controller 等代码，大幅提升开发效率。
*   **自动化业务字段**：支持逻辑删除、自动填充创建/更新时间等。
*   **多租户、乐观锁等企业级特性**。
*   **无侵入性**：完全兼容 MyBatis，原有 MyBatis 项目可以平滑迁移，也可以同时使用 MyBatis 的 XML 和注解功能。

## 二、MyBatis-Plus 核心组件与架构

MyBatis-Plus 作为 MyBatis 的增强，其架构是在 MyBatis 的基础上进行扩展的。

**MyBatis-Plus 核心架构示意图：**

{% mermaid %}
graph TD
    A[Java Application] -->|调用 Mapper 接口方法| B["MyBatis-Plus Mapper <br>(BaseMapper)"]
    B -->|MyBatis-Plus 增强逻辑| C[MyBatis 核心]
    C -->|MyBatis Driver/插件| D[JDBC Driver]
    D -->|数据库协议| E["Database (MySQL, <br>Oracle, etc.)"]

    subgraph MyBatis-Plus 增强
        B --> F["条件构造器 (QueryWrapper<br>/UpdateWrapper)"]
        B --> G[代码生成器]
        B --> H[内置分页插件]
        B --> I[逻辑删除 / 自动填充 <br>/ 乐观锁]
    end
{% endmermaid %}

### 2.1 核心组件

1.  **`BaseMapper<T>` 接口**：
    *   MP 的核心，提供了一系列通用 CRUD 方法，例如 `insert`, `deleteById`, `updateById`, `selectById`, `selectList`, `selectCount` 等。
    *   泛型 `T` 表示对应的实体类类型。
    *   开发者只需让自己的 Mapper 接口继承 `BaseMapper<T>` 即可，无需编写任何 SQL。

2.  **`Wrapper` 条件构造器**：
    *   用于构建 SQL 查询或更新的条件表达式，替代了在 XML 中编写动态 SQL 的繁琐。
    *   主要实现类：
        *   `QueryWrapper<T>`：用于构建 `WHERE` 子句和排序等查询条件。
        *   `LambdaQueryWrapper<T>`：`QueryWrapper` 的 Lambda 表达式形式，提供类型安全的字段引用，避免硬编码字段名。
        *   `UpdateWrapper<T>`：用于构建 `SET` 和 `WHERE` 子句的更新条件。
        *   `LambdaUpdateWrapper<T>`：`UpdateWrapper` 的 Lambda 表达式形式。

3.  **`IService<T>` 和 `ServiceImpl<M extends BaseMapper<T>, T>`**：
    *   MP 提供的 Service 层抽象，进一步封装了 `BaseMapper` 的常用方法。
    *   `IService<T>` 定义了通用的 Service 层方法（如 `save`, `remove`, `update`, `getById` 等）。
    *   `ServiceImpl` 实现了 `IService` 接口，并提供了 `BaseMapper` 的便捷访问。
    *   开发者可以继承 `ServiceImpl` 来快速实现 Service 层，无需手动注入 Mapper。

4.  **代码生成器 (Code Generator)**：
    *   一个独立的工具，根据数据库表结构，自动生成 Entity (实体类)、Mapper、Service、Controller 等层的基础代码，大大减少了重复性工作。

5.  **分页插件 (PaginationInnerInterceptor)**：
    *   MP 内置的分页功能，通过配置 `MybatisPlusInterceptor` 即可实现，无需引入额外的分页插件。

## 三、MyBatis-Plus 快速入门与代码示例

我们将以 Spring Boot 项目为例，演示 MyBatis-Plus 的基本使用。

### 3.1 准备工作 (Maven 依赖与数据库)

**Maven 依赖 (pom.xml):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.3</version> <!-- 根据实际情况选择 Spring Boot 版本 -->
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>com.example</groupId>
    <artifactId>mybatis-plus-demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>mybatis-plus-demo</name>
    <description>Demo project for MyBatis-Plus with Spring Boot</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- MyBatis-Plus Spring Boot Starter -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>3.5.5</version> <!-- 使用最新稳定版本，注意与Spring Boot 3.x 匹配 -->
        </dependency>

        <!-- MySQL 驱动 -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok (可选，用于简化POJO代码) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring Boot Test Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

**数据库表 (MySQL):**

```sql
CREATE DATABASE IF NOT EXISTS mybatis_plus_demo;
USE mybatis_plus_demo;

CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(30) NULL DEFAULT NULL COMMENT '姓名',
    age INT NULL DEFAULT NULL COMMENT '年龄',
    email VARCHAR(50) NULL DEFAULT NULL COMMENT '邮箱',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT(1) DEFAULT 0 COMMENT '逻辑删除标识 (0-未删除, 1-已删除)'
);

INSERT INTO user (name, age, email) VALUES ('Jone', 18, 'test1@baomidou.com');
INSERT INTO user (name, age, email) VALUES ('Jack', 20, 'test2@baomidou.com');
INSERT INTO user (name, age, email) VALUES ('Tom', 28, 'test3@baomidou.com');
INSERT INTO user (name, age, email) VALUES ('Sandy', 21, 'test4@baomidou.com');
INSERT INTO user (name, age, email) VALUES ('Billie', 24, 'test5@baomidou.com');
```

### 3.2 Spring Boot 配置 (`application.properties`)

放在 `src/main/resources` 目录下。

```properties
# 数据库连接配置
spring.datasource.url=jdbc:mysql://localhost:3306/mybatis_plus_demo?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# MyBatis-Plus 配置
mybatis-plus.mapper-locations=classpath*:/mapper/*.xml # 如果有自定义的Mapper XML文件，可以配置
mybatis-plus.type-aliases-package=com.example.entity # 实体类包路径，MyBatis-Plus会自动扫描

# 日志配置，用于显示SQL
logging.level.com.example.mapper=DEBUG
logging.level.org.apache.ibatis=DEBUG
```

### 3.3 MyBatis-Plus 配置类 (`MybatisPlusConfig.java`)

用于配置 Mybatis-Plus 插件，如分页插件、乐观锁插件等。

```java
// src/main/java/com/example/config/MybatisPlusConfig.java
package com.example.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {

    /**
     * 新增 Mybatis-Plus 拦截器配置
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 添加分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        // 添加乐观锁插件 (可选)
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }

    // 如果需要自动填充，可以配置一个 MetaObjectHandler (见后文 AutoFill 示例)
}
```

### 3.4 实体类 (Entity - `User.java`)

使用 Lombok 简化代码，并使用 Mybatis-Plus 的注解配置表名和逻辑删除字段。

```java
// src/main/java/com/example/entity/User.java
package com.example.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data // Lombok: 自动生成 getter, setter, toString, equals, hashCode
@NoArgsConstructor // Lombok: 自动生成无参构造器
@AllArgsConstructor // Lombok: 自动生成全参构造器
@TableName("user") // 映射数据库表名
public class User {

    @TableId(type = IdType.AUTO) // 主键ID，类型为自增
    private Long id;

    private String name;

    private Integer age;

    private String email;

    @TableField(fill = FieldFill.INSERT) // 插入时自动填充
    private LocalDateTime createdTime;

    @TableField(fill = FieldFill.INSERT_UPDATE) // 插入和更新时自动填充
    private LocalDateTime updatedTime;

    @TableLogic // 逻辑删除字段，默认值0未删除，1已删除
    private Integer deleted;

    // @Version // 乐观锁字段 (需要有此注解，并添加 OptimisticLockerInnerInterceptor)
    // private Integer version;
}
```

**自动填充处理器 (`MyMetaObjectHandler.java`)：**
为了让 `createdTime` 和 `updatedTime` 自动填充，需要自定义一个 `MetaObjectHandler`。

```java
// src/main/java/com/example/config/MyMetaObjectHandler.java
package com.example.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        log.info("start insert fill ....");
        // 尝试设置 createdTime 和 updatedTime
        // hasSetter(metaObject, "createdTime") 检查实体是否有 createdTime 属性的 setter 方法
        // getFieldValByName("createdTime", metaObject) 检查该属性当前值是否为空
        // 如果为空，则进行填充
        this.strictInsertFill(metaObject, "createdTime", LocalDateTime::now, LocalDateTime.class);
        this.strictInsertFill(metaObject, "updatedTime", LocalDateTime::now, LocalDateTime.class);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        log.info("start update fill ....");
        // 更新时只填充 updatedTime
        this.strictUpdateFill(metaObject, "updatedTime", LocalDateTime::now, LocalDateTime.class);
    }
}
```

### 3.5 Mapper 接口 (`UserMapper.java`)

继承 `BaseMapper`，无需编写任何方法。

```java
// src/main/java/com/example/mapper/UserMapper.java
package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper // 标记这是一个 MyBatis Mapper 接口，Spring Boot 会自动扫描
public interface UserMapper extends BaseMapper<User> {
    // 继承 BaseMapper 后，无需编写任何方法，即可拥有 CRUD 功能
    // 如果需要自定义更复杂的 SQL，可以在这里添加方法，并在对应的 XML 文件中编写 SQL
}
```

### 3.6 Service 接口 (`UserService.java`) 和 实现类 (`UserServiceImpl.java`)

继承 `IService` 和 `ServiceImpl`，进一步简化 Service 层代码。

```java
// src/main/java/com/example/service/UserService.java
package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.entity.User;

public interface UserService extends IService<User> {
    // 继承 IService 接口后，无需编写任何通用方法
    // 可以在这里定义业务特有的方法
}
```

```java
// src/main/java/com/example/service/impl/UserServiceImpl.java
package com.example.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.User;
import com.example.mapper.UserMapper;
import com.example.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    // 继承 ServiceImpl 后，会自动注入 BaseMapper，并实现 IService 的所有通用方法
    // 可以在这里添加业务逻辑
}
```

### 3.7 控制器 (`UserController.java`)

提供 RESTful API 接口来测试 CRUD 操作。

```java
// src/main/java/com/example/controller/UserController.java
package com.example.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.entity.User;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService; // 注入 UserService

    // 查询所有用户
    @GetMapping
    public List<User> getAllUsers() {
        return userService.list();
    }

    // 根据ID查询用户
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getById(id);
    }

    // 添加用户
    @PostMapping
    public boolean addUser(@RequestBody User user) {
        return userService.save(user); // save 方法会自动填充 createdTime, updatedTime
    }

    // 更新用户
    @PutMapping
    public boolean updateUser(@RequestBody User user) {
        return userService.updateById(user); // updateById 方法会自动填充 updatedTime
    }

    // 根据ID删除用户 (逻辑删除)
    @DeleteMapping("/{id}")
    public boolean deleteUser(@PathVariable Long id) {
        return userService.removeById(id); // removeById 会执行逻辑删除 (将 deleted 字段设为1)
    }

    // 示例：条件查询 (使用 QueryWrapper)
    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam(required = false) String name,
                                  @RequestParam(required = false) Integer age) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        if (name != null && !name.isEmpty()) {
            queryWrapper.like("name", name); // name 字段模糊匹配
        }
        if (age != null) {
            queryWrapper.ge("age", age); // age 字段大于等于
        }
        return userService.list(queryWrapper);
    }

    // 示例：条件查询 (使用 LambdaQueryWrapper，更安全)
    @GetMapping("/search/lambda")
    public List<User> searchUsersLambda(@RequestParam(required = false) String name,
                                        @RequestParam(required = false) Integer age) {
        LambdaQueryWrapper<User> lambdaQueryWrapper = new LambdaQueryWrapper<>();
        if (name != null && !name.isEmpty()) {
            lambdaQueryWrapper.like(User::getName, name); // 类型安全地引用 User::getName 属性
        }
        if (age != null) {
            lambdaQueryWrapper.ge(User::getAge, age);
        }
        return userService.list(lambdaQueryWrapper);
    }

    // 示例：分页查询
    @GetMapping("/page")
    public IPage<User> getUsersByPage(@RequestParam(defaultValue = "1") int current,
                                      @RequestParam(defaultValue = "5") int size) {
        Page<User> page = new Page<>(current, size);
        return userService.page(page);
    }
}
```

### 3.8 Spring Boot 启动类 (`MybatisPlusDemoApplication.java`)

```java
// src/main/java/com/example/MybatisPlusDemoApplication.java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MybatisPlusDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(MybatisPlusDemoApplication.class, args);
        System.out.println("MyBatis-Plus Demo Application started successfully!");
        System.out.println("Access endpoints, e.g., http://localhost:8080/users");
    }
}
```

## 四、MyBatis-Plus 常用进阶功能

1.  **逻辑删除 (Logic Delete)**：
    *   在实体类字段上添加 `@TableLogic` 注解。
    *   在 `application.properties` 中配置：
        `mybatis-plus.global-config.db-config.logic-delete-field=deleted` (字段名)
        `mybatis-plus.global-config.db-config.logic-delete-value=1` (删除值)
        `mybatis-plus.global-config.db-config.logic-not-delete-value=0` (未删除值)
    *   MP 会自动将删除操作转换为 `UPDATE` 语句来更新 `deleted` 字段，查询时会自动过滤 `deleted=1` 的记录。

2.  **乐观锁 (Optimistic Locker)**：
    *   在实体类字段（通常是 `version` 字段）上添加 `@Version` 注解。
    *   在 `MybatisPlusInterceptor` 中添加 `OptimisticLockerInnerInterceptor` 插件。
    *   当执行 `updateById` 或 `update` 操作时，MP 会自动检查 `version` 字段，并在更新时递增 `version` 值，防止并发更新冲突。

3.  **Enum 枚举处理**：
    *   MP 可以自动处理枚举类型与数据库字段的映射。

4.  **多租户 (Multi-Tenant)**：
    *   通过 `TenantLineInnerInterceptor` 插件实现，可以在 SQL 语句中自动添加租户 ID 过滤条件。

5.  **批量操作**：
    *   `IService` 提供了 `saveBatch(Collection<T> entityList)`、`updateBatchById(Collection<T> entityList)` 等批量操作方法，高效执行批量 CRUD。

## 五、MyBatis-Plus 与 MyBatis 对比

| 特性           | MyBatis                                          | MyBatis-Plus                                         |
| :------------- | :----------------------------------------------- | :--------------------------------------------------- |
| **SQL 编写**   | 开发者需要编写所有 SQL (XML 或注解)。            | **大部分常用 CRUD 无需手写 SQL**，继承 `BaseMapper` 即可；复杂 SQL 可继续手写。 |
| **开发效率**   | 相对较低，大量重复性工作。                        | **极高**，显著减少代码量，加速开发。                  |
| **功能扩展**   | 需手动集成各种插件（分页、代码生成等）。           | **内置**丰富的功能，如分页、逻辑删除、自动填充、乐观锁、代码生成器等。 |
| **动态 SQL**   | 需要在 XML 中使用 `<if>`, `<where>` 等标签手动编写。 | 提供 **`Wrapper` 条件构造器**，以 Java 代码链式构建动态 SQL，更直观、类型安全。 |
| **代码量**     | 较多，尤其在数据访问层。                          | **大幅减少**，专注于业务逻辑而非数据访问细节。         |
| **侵入性**     | 无。                                             | 对 MyBatis 无侵入，完美兼容。                        |
| **学习成本**   | 较高，需掌握 XML 配置、动态 SQL 等。             | 较低，基于 MyBatis，但简化了用法。                    |

## 六、MyBatis-Plus 的优缺点与适用场景

### 6.1 优点：

1.  **提高开发效率**：大大减少了重复的 CRUD 代码编写，开箱即用。
2.  **简化 SQL 编写**：通过 `Wrapper` 机制，以面向对象的方式构建查询条件，避免手写复杂动态 SQL。
3.  **功能丰富**：内置分页、逻辑删除、自动填充、乐观锁等多种实用功能，无需额外集成。
4.  **无侵入性**：完全兼容 MyBatis，可以与现有 MyBatis 项目平滑集成。
5.  **代码生成器**：一键生成各层代码，进一步提升效率。
6.  **易于上手**：基于 MyBatis，学习曲线平缓。

### 6.2 缺点：

1.  **过度封装**：对于一些非常特殊或复杂的非标准 SQL 场景，仍然需要回到 MyBatis 的 XML 或注解方式，此时 MP 的优势不明显。
2.  **“魔法”效应**：初学者可能不理解其背后自动生成的 SQL，当出现问题时，调试难度可能略高（但 Mybatis-Plus 提供了很好的日志输出）。
3.  **团队规范**：如果团队对 SQL 规范有严格要求，可能需要在自定义 SQL 或 `Wrapper` 编写上做额外规范。

### 6.3 适用场景：

*   **绝大多数单表 CRUD 业务**：这是 MP 最擅长的领域，能极大提升开发效率。
*   **快速开发项目**：如后台管理系统、内部工具、原型开发等，可以快速搭建数据访问层。
*   **微服务项目**：每个微服务通常对应少量实体，MP 可以快速完成数据层接口开发。
*   **希望简化 MyBatis 但又不想放弃 SQL 控制权的项目**：MP 介于 MyBatis 和全功能 ORM 之间，提供了很好的平衡。

## 七、最佳实践

1.  **与 Spring Boot 结合使用**：MyBatis-Plus 提供了 `mybatis-plus-spring-boot-starter`，可以非常方便地与 Spring Boot 集成，推荐作为首选集成方式。
2.  **合理使用 `Wrapper`**：对于常规的条件查询和更新，优先使用 `LambdaQueryWrapper` 或 `LambdaUpdateWrapper`，它提供了类型安全检查，避免了硬编码字段名可能带来的错误。
3.  **自定义 Mapper SQL**：对于联表查询、复杂聚合、存储过程等 MP 无法直接覆盖的场景，仍然可以在 Mapper 接口中定义方法，并在 XML 文件中编写原生 MyBatis SQL。
4.  **善用代码生成器**：在项目初期或新增表时，利用代码生成器快速生成基础代码，再在此基础上进行业务开发。
5.  **事务管理**：在 Service 层通过 Spring 的 `@Transactional` 注解进行声明式事务管理。
6.  **日志输出**：配置好日志，以便在开发和调试时查看 Mybatis-Plus 自动生成的 SQL 语句。

## 八、总结

MyBatis-Plus 是 MyBatis 生态系统中一个非常有价值的增强工具。它在不侵入 MyBatis 核心的前提下，通过一系列强大的功能，极大地提升了 Java Web 应用程序在持久层开发的效率和便捷性。对于追求快速开发、减少样板代码、同时又希望对 SQL 保持一定控制力的开发者来说，MyBatis-Plus 是一个不容错过的优秀选择。深入理解和熟练运用 MyBatis-Plus，将帮助开发者更专注于业务逻辑，从而交付更高质量的应用程序。