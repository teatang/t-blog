---
title: Rust ORM 库 Diesel 详解
date: 2025-11-16 06:24:00
tags: 
    - 2025
    - Rust
    - ORM
categories: 
    - Rust
    - 库
---

> **Diesel** 是 Rust 语言中一个强大且高性能的**对象关系映射 (ORM)** 和**查询构建器 (Query Builder)** 库。它的设计哲学是提供一个安全、快速、类型检查严格的 API，让开发者能够以 Rust 原生代码的方式与关系型数据库进行交互。Diesel 强调在编译时捕获尽可能多的数据库错误，从而减少运行时错误，并提供与手写 SQL 相当甚至更快的性能。

{% note info %}
核心思想：
- **ORM**：将数据库表映射为 Rust 结构体、行映射为结构体实例。
- **查询构建器**：提供 Rust DSL 来构造 SQL 查询。
- **高安全性**：编译时类型检查，尽可能避免运行时数据库错误。
- **高性能**：零成本抽象，生成高效优化的 SQL。
- **支持数据库**：PostgreSQL, MySQL, SQLite。
{% endnote %}
------

## 一、什么是 ORM？为什么需要 Diesel？

在软件开发中，应用程序通常需要与数据库进行交互来存储和检索数据。传统的做法是直接编写 SQL 语句，并通过数据库驱动程序执行。然而，这种方式存在一些挑战：

*   **字符串拼接风险:** SQL 语句通常以字符串形式构建，容易受到 SQL 注入攻击，并且在编译时无法检查语法错误。
*   **代码重复:** 频繁编写相似的 `SELECT * FROM ...`, `INSERT INTO ...` 等样板代码。
*   **阻抗不匹配:** 关系型数据库的数据模型与面向对象编程语言的数据模型之间存在差异，需要手动进行转换。

**对象关系映射 (ORM)** 库旨在解决这些问题。它提供了一种高级抽象，允许开发者使用编程语言的对象和方法来操作数据库，而无需直接编写 SQL。ORM 负责将语言对象映射到数据库表，将方法调用转换为相应的 SQL 语句，并将数据库结果转换回语言对象。

**Diesel 的价值在于：**

1.  **Rustaceans 的 SQL:** 它允许你用熟悉和安全的 Rust 语法来编写数据库交互逻辑，而不是裸字符串。
2.  **编译时安全:** Diesel 在编译时检查你的查询是否与数据库 Schema 匹配，包括表名、列名、数据类型等，大大减少了运行时错误。
3.  **高性能:** 它的设计目标是生成与手写优化的 SQL 几乎相同的代码，避免了许多其他 ORM 可能引入的性能开销。
4.  **表达力强:** 提供一套富有表达力的 DSL，可以构建复杂的查询，包括联接、聚合、子查询等。
5.  **内置工具:** 提供了强大的 `diesel_cli` 工具，用于管理数据库迁移和自动生成 Rust Schema 定义。

## 二、Diesel 的核心概念

### 2.1 Schema (数据库 Schema 映射)

Diesel 核心功能之一是将你的数据库 Schema 映射为 Rust 代码。这一步通常通过 `diesel print-schema` 命令自动完成。

*   **`src/schema.rs`:** 这是 Diesel 自动生成的文件，包含了所有数据库表、列以及它们对应的 Rust 类型定义。这个文件是 Diesel 进行编译时检查的基础。

    **示例 `src/schema.rs` (PostgreSQL):**
    ```rust
    // @generated automatically by Diesel CLI.

    diesel::table! {
        users (id) {
            id -> Int4,
            name -> Varchar,
            email -> Varchar,
            created_at -> Timestamp,
        }
    }

    diesel::table! {
        posts (id) {
            id -> Int4,
            title -> Varchar,
            body -> Text,
            published -> Bool,
            user_id -> Int4, // 外键列
        }
    }

    // 定义表之间的关系，方便后续关联查询
    diesel::joinable!(posts -> users (user_id));

    diesel::allow_tables_to_appear_in_same_query!(
        users,
        posts,
    );
    ```
    这些宏定义是 Diesel 内部使用的，使得 Rust 代码可以引用数据库的表和列。例如，`users::dsl::id` 会引用 `users` 表的 `id` 列。

### 2.2 Records/Models (Rust 结构体)

数据库的每一行数据在 Rust 中通常被映射为一个结构体实例。Diesel 通过特定的 Trait 使得这些结构体能够与数据库交互。

*   **`Queryable` Trait:** 允许将查询结果映射到 Rust 结构体。当你从数据库中读取数据时，Diesel 会使用这个 Trait。
*   **`Insertable` Trait:** 定义了如何将 Rust 结构体的数据插入到数据库。
*   **`AsChangeset` Trait:** 用于更新操作，定义了结构体字段如何映射为数据库的更新语句。
*   **`Associations` Trait:** 管理表之间的关联 (一对一、一对多等)。

**示例 (定义模型):**
```rust
use super::schema::{users, posts}; // 导入 schema 定义

// 查询到的用户模型
#[derive(Queryable, Debug, PartialEq)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub created_at: chrono::NaiveDateTime,
}

// 插入新用户的结构体 (通常与 Queryable 结构体不同，因为 id 和 created_at 由数据库生成)
#[derive(Insertable)]
#[diesel(table_name = users)] // 指定插入到 users 表
pub struct NewUser<'a> {
    pub name: &'a str,
    pub email: &'a str,
}

// 查询到的文章模型
#[derive(Queryable, Debug, PartialEq)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
    pub user_id: i32,
}

// 插入新文章的结构体
#[derive(Insertable)]
#[diesel(table_name = posts)]
pub struct NewPost<'a> {
    pub title: &'a str,
    pub body: &'a str,
    pub published: bool,
    pub user_id: i32, // 外键
}
```

### 2.3 Connections (数据库连接)

Diesel 提供了不同数据库的连接类型，例如 `PgConnection` (PostgreSQL), `MysqlConnection` (MySQL), `SqliteConnection` (SQLite)。

```rust
use diesel::prelude::*;
use diesel::pg::PgConnection; // 或者 MySqlConnection, SqliteConnection
use dotenvy::dotenv;
use std::env;

pub fn establish_connection() -> PgConnection {
    dotenv().ok(); // 加载 .env 文件
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", database_url))
}
```

### 2.4 Query Builder (查询构建器)

Diesel 提供一套丰富的 DSL 来构建各种 SQL 查询，它避免了直接写 SQL 字符串，并在编译时进行类型检查。

**示例:**
```rust
use diesel::prelude::*;
use crate::schema::{users, posts}; // 导入生成的 schema
use crate::models::{User, NewUser, Post, NewPost}; // 导入模型

// ... establish_connection()

pub fn create_user<'a>(conn: &mut PgConnection, name: &'a str, email: &'a str) -> User {
    let new_user = NewUser { name, email };

    diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn) // 执行并获取结果
        .expect("Error saving new user")
}

pub fn get_user_by_id(conn: &mut PgConnection, id: i32) -> Option<User> {
    users::table.find(id) // 查找指定 ID 的用户
        .first(conn)
        .optional() // 如果未找到则返回 None
        .expect("Error loading user by ID")
}

pub fn get_published_posts(conn: &mut PgConnection) -> Vec<Post> {
    posts::table
        .filter(posts::published.eq(true)) // 添加过滤条件
        .limit(10) // 限制结果数量
        .order(posts::title.asc()) // 排序
        .load::<Post>(conn) // 加载为 Post 结构体列表
        .expect("Error loading published posts")
}

pub fn update_user_email(conn: &mut PgConnection, user_id: i32, new_email: &str) -> User {
    diesel::update(users::table.find(user_id))
        .set(users::email.eq(new_email)) // 更新 email
        .get_result(conn)
        .expect("Error updating user email")
}

pub fn delete_user(conn: &mut PgConnection, user_id: i32) -> usize {
    diesel::delete(users::table.find(user_id))
        .execute(conn) // 执行删除，返回影响的行数
        .expect("Error deleting user")
}
```

## 三、Diesel 的关键特性

1.  **编译时类型安全:** 这是 Diesel 最核心的卖点。在编译时，Diesel 会检查你构造的查询是否：
    *   引用了存在的表和列。
    *   使用了正确的列别名。
    *   类型匹配（例如，不能将字符串插入到整数列）。
    *   确保 `SELECT` 子句中的列与 `load::<T>` 中 `T` 的字段匹配。
    这大大减少了运行时 `SQLSTATE` 错误，提高了代码的健壮性。

2.  **高性能:** Diesel 通过零成本抽象策略，旨在生成紧凑且高效的 SQL 语句。它避免了许多动态 SQL 构建和运行时反射的开销，这在其他语言的 ORM 中很常见。

3.  **富有表现力的查询 DSL:** 提供了类似 SQL 的函数和操作符，允许开发者以结构化的方式构造复杂的查询，如 `filter`, `select`, `limit`, `offset`, `order`, `group_by`, `join`, `left_join`, `inner_join`, `distinct_on` 等。

4.  **数据库迁移工具 (`diesel_cli`):** 提供了命令行工具来创建、应用和回滚数据库 Schema 迁移。这使得数据库 Schema 的管理和版本控制变得非常方便。

    **迁移工作流:**
    {% mermaid %}
    flowchart TD
        %% 节点定义
        Start([开始])
        
        subgraph Migration [数据库迁移阶段]
            B[确定迁移需求]
            C[生成迁移文件<br/>diesel migration generate ...]
            D[编辑 SQL 文件<br/>up.sql / down.sql]
            E[执行迁移更新数据库<br/>diesel migration run]
        end

        subgraph Development [Rust 业务开发]
            F[同步 Rust Schema<br/>diesel print-schema > src/schema.rs]
            G[编写业务代码<br/>使用 Query DSL]
            H{编译时检查}
        end

        End([程序运行])

        %% 流程逻辑
        Start --> B
        B --> C
        C --> D
        D --> E
        E --> F
        F --> G
        G --> H
        H -- 验证通过 --> End
        H -- 报错 --> G

        %% 样式定义 (针对黑暗模式优化)
        classDef startEnd fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#ffffff
        classDef cmd fill:#111827,stroke:#10b981,stroke-width:2px,color:#10b981
        classDef manual fill:#1f2937,stroke:#f59e0b,stroke-width:1px,color:#e5e7eb
        classDef logic fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#e0e7ff

        %% 类分配 (采用更兼容的写法)
        class Start,End startEnd
        class C,E,F cmd
        class D,G manual
        class H logic
    {% endmermaid %}

5.  **关系和关联:** 通过 `associations` 宏和 Trait，可以方便地定义和查询表之间的关系 (has_many, belongs_to)。

    **示例 (关联查询):**
    ```rust
    use diesel::QueryDsl;

    // ... (User 和 Post 模型定义，确保 Post 有 user_id 字段)

    impl User {
        pub fn posts(self, conn: &mut PgConnection) -> QueryResult<Vec<Post>> {
            Post::belonging_to(&self) // Diesel 会自动根据外键 user_id 关联
                .filter(posts::published.eq(true))
                .load::<Post>(conn)
        }
    }

    // 在 main 函数中
    // let user = get_user_by_id(conn, 1).unwrap();
    // let user_posts = user.posts(conn).unwrap();
    // println!("User {} has posts: {:?}", user.name, user_posts);
    ```

6.  **可扩展性:** 支持添加自定义 SQL 函数、数据类型和表达式。当内置 DSL 无法满足需求时，可以回退到 `diesel::sql_query!` 宏执行原始 SQL，但仍能将结果映射到 Rust 结构体。

## 四、如何使用 Diesel (快速入门)

### 4.1 项目设置

1.  **创建 Rust 项目:**
    ```bash
    cargo new my_diesel_app --bin
    cd my_diesel_app
    ```

2.  **添加 Diesel 依赖:**
    编辑 `Cargo.toml`，根据你的数据库选择特性：
    ```toml
    [dependencies]
    diesel = { version = "2.1.0", features = ["postgres", "chrono"] } # 或 "mysql", "sqlite"
    dotenvy = "0.15" # 用于加载环境变量，如 DATABASE_URL
    chrono = { version = "0.4", features = ["serde"] } # 用于时间类型

    [dev-dependencies]
    diesel_migrations = { version = "2.1.0", features = ["sqlite"] } # 如果在测试中使用 Sqlite

    [build-dependencies] # 用于 diesel print-schema
    diesel = { version = "2.1.0", features = ["postgres"] } # 注意这里需要与 dependencies 中的数据库匹配

    [profile.release]
    opt-level = 3
    debug = false
    ```

3.  **安装 `diesel_cli`:**
    全局安装 Diesel 命令行工具。
    **注意:** `diesel_cli` 必须与你使用的 `diesel` 库版本兼容。
    ```bash
    cargo install diesel_cli --no-default-features --features "postgres" # 或 "mysql", "sqlite"
    ```

4.  **配置数据库连接:**
    创建 `.env` 文件，定义 `DATABASE_URL`。
    ```ini
    DATABASE_URL=postgres://username:password@localhost/my_database
    # 或者 sqlite://./my_database.db
    # 或者 mysql://username:password@localhost/my_database
    ```

5.  **初始化 Diesel 项目:**
    这会创建 `diesel.toml` 和 `migrations` 文件夹。
    ```bash
    diesel setup
    ```

### 4.2 数据库迁移

1.  **创建迁移文件:**
    ```bash
    diesel migration generate create_users_and_posts_tables
    ```
    这会在 `migrations/` 目录下创建两个 SQL 文件（`up.sql` 和 `down.sql`）。

2.  **编辑迁移文件:**
    `migrations/<timestamp>_create_users_and_posts_tables/up.sql`:
    ```sql
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      email VARCHAR NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR NOT NULL,
      body TEXT NOT NULL,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      user_id INTEGER NOT NULL REFERENCES users (id)
    );
    ```
    `migrations/<timestamp>_create_users_and_posts_tables/down.sql`:
    ```sql
    DROP TABLE posts;
    DROP TABLE users;
    ```

3.  **运行迁移:**
    ```bash
    diesel migration run
    ```

4.  **生成 `schema.rs`:**
    ```bash
    diesel print-schema > src/schema.rs
    ```
    这将根据数据库的当前 Schema 生成 `src/schema.rs` 文件。

### 4.3 编写 Rust 代码 (CRUD 示例)

1.  **`src/models.rs` (定义模型):**
    ```rust
    use diesel::prelude::*;
    use crate::schema::{users, posts};
    use chrono::NaiveDateTime;

    #[derive(Queryable, Debug, PartialEq)]
    pub struct User {
        pub id: i32,
        pub name: String,
        pub email: String,
        pub created_at: NaiveDateTime,
    }

    #[derive(Insertable)]
    #[diesel(table_name = users)]
    pub struct NewUser<'a> {
        pub name: &'a str,
        pub email: &'a str,
    }

    #[derive(Queryable, Debug, PartialEq)]
    #[diesel(belongs_to(User))] // 定义与 User 的关联
    pub struct Post {
        pub id: i32,
        pub title: String,
        pub body: String,
        pub published: bool,
        pub user_id: i32,
    }

    #[derive(Insertable)]
    #[diesel(table_name = posts)]
    pub struct NewPost<'a> {
        pub title: &'a str,
        pub body: &'a str,
        pub user_id: i32,
        #[diesel(default = "false")] // 可以在插入时提供默认值
        pub published: bool,
    }

    #[derive(Debug, AsChangeset)]
    #[diesel(table_name = users)]
    pub struct UserUpdateForm {
        pub name: Option<String>,
        pub email: Option<String>,
    }
    ```

2.  **`src/main.rs` (业务逻辑):**
    ```rust
    use diesel::prelude::*;
    use dotenvy::dotenv;
    use std::env;

    pub mod schema;
    pub mod models;

    use models::{User, NewUser, Post, NewPost, UserUpdateForm};
    use schema::{users, posts};

    pub fn establish_connection() -> PgConnection {
        dotenv().ok();
        let database_url = env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set");
        PgConnection::establish(&database_url)
            .expect(&format!("Error connecting to {}", database_url))
    }

    fn main() {
        let mut conn = establish_connection();
        println!("Connected to database.");

        // --- Create ---
        let new_user = models::NewUser {
            name: "Alice",
            email: "alice@example.com",
        };
        let user_alice = diesel::insert_into(users::table)
            .values(&new_user)
            .get_result::<User>(&mut conn)
            .expect("Error inserting new user");
        println!("Inserted user: {:?}", user_alice);

        let new_post = models::NewPost {
            title: "My First Post",
            body: "Content of Alice's first post.",
            user_id: user_alice.id,
            published: true,
        };
        let post_1 = diesel::insert_into(posts::table)
            .values(&new_post)
            .get_result::<Post>(&mut conn)
            .expect("Error inserting new post");
        println!("Inserted post: {:?}", post_1);


        // --- Read ---
        println!("\n--- All users ---");
        let all_users = users::table
            .load::<User>(&mut conn)
            .expect("Error loading users");
        for user in all_users {
            println!("{:?}", user);
        }

        println!("\n--- Published posts ---");
        let published_posts = posts::table
            .filter(posts::published.eq(true))
            .order(posts::title.asc())
            .load::<Post>(&mut conn)
            .expect("Error loading published posts");
        for post in published_posts {
            println!("{:?}", post);
        }

        println!("\n--- Alice's posts (using association) ---");
        let alice_posts = Post::belonging_to(&user_alice)
            .load::<Post>(&mut conn)
            .expect("Error loading Alice's posts");
        for post in alice_posts {
            println!("{:?}", post);
        }

        // --- Update ---
        let updated_email = "alice_new_email@example.com";
        let updated_user = diesel::update(users::table.find(user_alice.id))
            .set(users::email.eq(updated_email))
            .get_result::<User>(&mut conn)
            .expect("Error updating user");
        println!("\nUpdated user: {:?}", updated_user);

        let update_form = UserUpdateForm {
            name: Some("Alicia".to_string()),
            email: None, // 不更新 email
        };
        let updated_user_with_form: User = diesel::update(users::table.find(user_alice.id))
            .set(&update_form) // 使用 AsChangeset
            .get_result(&mut conn)
            .expect("Error updating user with form");
        println!("\nUpdated user with form: {:?}", updated_user_with_form);


        // --- Delete ---
        let num_deleted = diesel::delete(posts::table.filter(posts::user_id.eq(user_alice.id)))
            .execute(&mut conn)
            .expect("Error deleting posts");
        println!("\nDeleted {} posts for user_alice.", num_deleted);

        let num_deleted_users = diesel::delete(users::table.find(user_alice.id))
            .execute(&mut conn)
            .expect("Error deleting user");
        println!("Deleted {} user ({}).", num_deleted_users, user_alice.name);
    }
    ```

## 五、Diesel 的优缺点

### 5.1 优点

*   **编译时类型安全:** 大幅减少运行时错误，提高代码健壮性和可维护性。
*   **性能卓越:** 生产的 SQL 通常与手写优化 SQL 相当，避免了许多 ORM 常见的性能瓶颈。
*   **表达力强:** 提供丰富的 DSL，能够构建复杂的查询，且保持代码可读性。
*   **出色的 `diesel_cli`:** 简化了数据库 Schema 的管理和版本控制，自动生成 Rust Schema。
*   **活跃的社区和良好的文档:** 遇到问题时容易找到支持。
*   **零成本抽象:** 符合 Rust 的设计哲学，在提供高级抽象的同时不牺牲运行时性能。

### 5.2 缺点

*   **学习曲线陡峭:** 对初学者来说，理解 Diesel 的类型系统、DSL 和生命周期可能需要一些时间，特别是对于复杂的查询。
*   **相对冗长:** 与一些高级 ORM (如 Ruby on Rails 的 ActiveRecord) 相比，Diesel 对于简单操作可能需要更多的代码。
*   **同步特性为主:** 核心 API 主要为同步操作设计。虽然可以通过 `tokio_diesel` 或 `async-diesel` 等库在异步上下文中使用，但原生异步支持仍不如某些专门为异步设计的数据库客户端成熟。
*   **依赖 `diesel_cli`:** Schema 生成和迁移管理必须依靠外部命令行工具。
*   **不完全的 ORM:** Diesel 更侧重于查询构建器，而不是一个完整的“活动记录”模式 ORM。例如，它不直接支持从数据库加载后自动跟踪对象的状态变化。

## 六、何时使用 Diesel？

Diesel 是以下场景的理想选择：

*   **对性能有严格要求** 的 Web 服务、API 后端或数据处理应用。
*   **重视编译时安全性**，希望在软件发布前就捕获数据库相关的错误。
*   **喜欢强类型和 Rust 的类型系统**，并希望将这种安全性延伸到数据库层。
*   **项目需要复杂的 SQL 查询**，但又不想手动拼接字符串 SQL。
*   **愿意投入时间学习** 其独特的 DSL 和类型系统，以换取长期代码质量和稳定性。

如果你的项目对开发速度要求极高，且对运行时错误容忍度较高，或者你的团队对 Rust 宏和类型系统不熟悉，可能可以考虑其他更简单的数据库访问库（如 `sqlx`），但它们通常会在编译时安全性或性能方面有所不同。

## 七、最佳实践

1.  **始终使用 `diesel_cli` 管理 Schema 和迁移:** 这是确保 `src/schema.rs` 始终与数据库保持同步，并避免手动错误的最佳方式。
2.  **正确处理连接生命周期:** 在 Web 应用中，使用连接池 (`r2d2-diesel`) 来管理数据库连接，避免频繁创建和关闭连接。
3.  **遵循 Diesel 的类型系统:** 尽量利用 Diesel 的 DSL 来构建查询，而不是回退到裸 SQL，以最大化编译时检查的优势。
4.  **清晰地定义模型:** `Queryable` 和 `Insertable` 结构体可以分开，以处理 `id`、时间戳等自动生成字段。
5.  **错误处理:** 始终期望数据库操作可能失败，并使用 `Result` 和 `expect`/`unwrap` 或 `?` 运算符来妥善处理错误。
6.  **理解 `Box<dyn ...>`:** 对于复杂的动态查询，可能需要使用 `Box<dyn ReadOnlyBody + QueryId>` (或类似类型) 来将查询体装箱，这在构建动态过滤等场景中很常见。
7.  **熟悉宏和属性:** Diesel 广泛使用 Rust 宏和属性（如 `#[derive]`, `#[diesel(table_name)]`），理解它们的作用对高效使用 Diesel 至关重要。

## 八、总结

Diesel 是 Rust 生态系统中一个出类拔萃的 ORM/查询构建器，它以其卓越的类型安全、高性能和强大的查询 DSL 而闻名。虽然它可能带来一定的学习曲线，但其在编译时捕获错误的能力以及生成的代码效率，使得它成为构建健壮、快速和可维护的 Rust 数据库应用的理想选择。通过合理地利用 Diesel 提供的工具和遵循最佳实践，开发者可以极大地提升与关系型数据库交互的体验和代码质量。