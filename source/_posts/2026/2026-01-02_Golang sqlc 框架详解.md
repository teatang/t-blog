---
title: Golang sqlc 框架详解
date: 2026-01-02 06:24:00
tags: 
    - 2026
    - Golang
    - SQL
categories: 
    - Golang
    - 库
---

> **sqlc** 是一个功能强大的**代码生成器**，它将 SQL 语句转换为类型安全的 Go 代码。与传统的 ORM (Object-Relational Mapper) 不同，sqlc 不会尝试将数据库表映射为 Go 结构体或构建复杂的查询 DSL。相反，它让开发者直接编写原始 SQL 语句，然后通过静态分析这些 SQL 语句及其对应的数据库 schema，自动生成用于执行这些查询的 Go 代码，包括参数结构体、结果结构体以及执行方法。这种方法结合了原始 SQL 的性能和灵活性，以及 Go 语言的强类型安全特性，极大地减少了数据库交互中的样板代码和潜在的运行时错误。

{% note info %}
核心思想：
- **SQL-First**：开发者编写纯 SQL，而非通过 Go DSL 操作数据库。
- **类型安全**：在编译时捕获 SQL 相关的类型错误和字段名错误。
- **零反射/运行时开销**：生成的 Go 代码是普通的代码，没有运行时反射或额外的依赖。
- **减少样板代码**：自动生成参数和结果 Go struct，以及执行 CRUD 操作的方法。
- **防止 SQL 注入**：所有参数都通过 SQL 驱动参数化，避免手动字符串拼接。
- **与数据库紧密集成**：通过数据库 Schema 进行类型推断和验证。
{% endnote %}
------

## 一、什么是 sqlc？为什么选择它？

### 1.1 背景与痛点

在 Go 语言中与关系型数据库交互，通常有以下几种方式：

1.  **直接使用 `database/sql` 包**: 这是 Go 官方提供的数据库接口。它提供了高度的灵活性和性能，但需要开发者手动处理参数绑定、结果集扫描以及错误处理等大量样板代码。例如，每次查询结果都需要手动调用 `rows.Scan()` 将数据扫描到 Go 变量中，并且需要处理 `sql.NullString` 等空值类型。
2.  **使用 ORM (Object-Relational Mapper)**: 例如 GORM、XORM 等。ORM 将数据库表映射为 Go 结构体，并提供一套 Go 语言的 API 来构建和执行查询。它们可以显著减少代码量，但缺点也显而易见：
    *   **学习曲线**: 需要掌握 ORM 自身的 API 和约定。
    *   **性能问题**: 有时生成的 SQL 不够优化，或者引入了运行时反射开销。
    *   **灵活性受限**: 对于复杂的联接查询、自定义函数或数据库特定功能，ORM 往往难以支持或表达起来很笨重。
3.  **sqlc 的出现**：sqlc 旨在结合前两者的优点，规避它们的缺点。它让你编写原始 SQL，从而保持 SQL 的性能和灵活性，同时通过代码生成，消除了 `database/sql` 的大量样板代码和潜在的类型不匹配错误，提供了强类型安全保证。

### 1.2 sqlc 的优势

*   **类型安全**: sqlc 在编译时根据 SQL Schema 验证你的 SQL 查询。这意味着，如果你的 SQL 查询中的列名拼写错误、类型不匹配，或者参数数量不正确，它会在代码生成阶段就报错，而不是在运行时。
*   **性能**：由于生成的是普通的 Go 代码，不涉及运行时反射或其他抽象层，其性能与手动编写 `database/sql` 代码几乎相同。
*   **减少样板代码**: 自动生成结构体用于接收查询参数和查询结果，以及执行各种 SQL 操作的方法。
*   **防止 SQL 注入**: 所有参数都通过数据库驱动的安全参数绑定机制进行传递，而不是通过字符串拼接。
*   **易于集成**: 生成的代码完全兼容 `database/sql` 接口，可以轻松集成到现有项目中。
*   **强大的 SQL 支持**: 只要你的数据库支持，你就可以编写任何复杂的 SQL 查询，包括聚合、联接、子查询、存储过程调用等。

## 二、工作原理与核心概念

sqlc 的核心工作流程可以概括为以下步骤：

1.  **输入**: 提供数据库 Schema 文件（`schema.sql`）、包含 SQL 查询的文件（`query.sql`）以及 `sqlc.yaml` 配置文件。
2.  **解析与验证**: sqlc 解析 `sqlc.yaml` 配置文件以获取生成选项。然后，它读取并解析数据库 Schema 文件，了解表格结构、列名、数据类型等。接着，它解析 SQL 查询文件，并根据已解析的 Schema 对这些查询进行静态验证。
3.  **类型推断**: 基于 Schema 和查询，sqlc 推断 SQL 查询参数和结果集的 Go 语言类型。例如，一个 `INT` 类型的列可能会被映射为 `int32` 或 `int64`。
4.  **代码生成**: 根据推断出的类型和查询定义，sqlc 生成 Go 源代码文件，包括：
    *   用于传递查询参数的结构体。
    *   用于接收查询结果的结构体。
    *   一个 `Querier` 接口，定义了所有查询方法。
    *   一个 `Queries` 结构体，实现了 `Querier` 接口，包含执行数据库操作的实际逻辑。

{% mermaid %}
graph TD
    %% 节点样式定义
    classDef input fill:#11263d,stroke:#007acc,stroke-width:2px,color:#fff;
    classDef process fill:#1e3a1e,stroke:#4ec9b0,stroke-width:2px,color:#fff;
    classDef output fill:#3d2b11,stroke:#d19a66,stroke-width:2px,color:#fff;
    classDef error fill:#3d1111,stroke:#f44747,stroke-width:2px,color:#fff;

    subgraph Inputs [输入源 - Source Files]
        A[<b>schema.sql</b><br/>数据库定义]:::input
        C[<b>query.sql</b><br/>SQL 查询语句]:::input
        E[<b>sqlc.yaml</b><br/>全局配置]:::input
    end

    subgraph Core [sqlc 核心引擎 - Engine]
        F{解析与读取}:::process
        G{验证与推断}:::process
        H[Go 类型映射/AST 生成]:::process
    end

    subgraph Outputs [生成代码 - Generated Go]
        J[<b>db.go</b><br/>Entrypoint]:::output
        K[<b>models.go</b><br/>Structs]:::output
        L[<b>querier.go</b><br/>Interface]:::output
        M[<b>*.sql.go</b><br/>Methods]:::output
    end

    %% 流程连接
    A & C & E --> F
    F --> G
    G -- 验证失败 --> I[错误报告]:::error
    G -- 验证通过 --> H
    H --> J & K & L & M

    %% 全局微调
    linkStyle default stroke:#858585,stroke-width:1px;
{% endmermaid %}
*图：sqlc 工作流程示意图*

### 2.1 关键概念

*   **SQL Schema 文件**: 包含 `CREATE TABLE`, `ALTER TABLE` 等 DDL (Data Definition Language) 语句，用于描述数据库结构。sqlc 使用这些文件来理解数据库的实际布局和数据类型。
*   **SQL 查询文件**: 包含 `SELECT`, `INSERT`, `UPDATE`, `DELETE` 等 DML (Data Manipulation Language) 语句。每个 SQL 查询通常以 `sqlc` 注释 (`-- name: FunctionName :query-type`) 开头，指导 sqlc 生成特定类型的 Go 函数。
*   **`sqlc.yaml` 配置文件**: SQLc 的核心配置文件，定义了如何生成 Go 代码，包括目标数据库类型、输出目录、包名、自定义类型映射等。
*   **`-- name: FunctionName :query-type` 注释**: 这是 sqlc 特有的语法，用于为 SQL 查询命名，并指定其期望的执行结果类型。
    *   `FunctionName`: 生成的 Go 函数名。
    *   `query-type`:
        *   `:one`: 期望返回单行结果。生成的函数将返回一个结构体和一个错误。
        *   `:many`: 期望返回多行结果。生成的函数将返回一个结构体切片和一个错误。
        *   `:exec`: 执行 DML 操作（`INSERT`, `UPDATE`, `DELETE`），不返回结果集。生成的函数将返回 `sql.Result` 和一个错误。
        *   `:execrows`: 类似于 `:exec`，但返回受影响的行数 (`int64`)。
        *   `:execresult`: 类似于 `:exec`，但返回 `sql.Result`。
        *   `:migrations`: 运行 SQL 迁移文件，不生成任何 Go 代码。

## 三、快速入门

### 3.1 安装 sqlc

首先，安装 `sqlc` 命令行工具：

```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

验证安装：

```bash
sqlc version
```

### 3.2 项目结构

典型的 sqlc 项目结构如下：

```
.
├── main.go               # 应用程序入口
├── sqlc.yaml             # sqlc 配置文件
└── db/                   # 存放数据库相关的 schema 和 query 文件
    ├── schema.sql        # 数据库 Schema 定义
    └── query.sql         # 应用的 SQL 查询
```

### 3.3 编写 Schema (`db/schema.sql`)

创建一个 `db/schema.sql` 文件，定义你的数据库表结构。这里以一个简单的 `users` 表为例：

```sql
-- db/schema.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 编写 Queries (`db/query.sql`)

创建一个 `db/query.sql` 文件，包含你的应用将使用的 SQL 查询。使用 `sqlc` 的特定注释来定义函数。

```sql
-- db/query.sql

-- name: CreateUser :one
INSERT INTO users (name, email)
VALUES ($1, $2)
RETURNING id, name, email, created_at;

-- name: GetUserByID :one
SELECT id, name, email, created_at FROM users
WHERE id = $1 LIMIT 1;

-- name: ListUsers :many
SELECT id, name, email, created_at FROM users
ORDER BY created_at DESC;

-- name: UpdateUserName :execrows
UPDATE users
SET name = $2
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
```
**注意**: PostgreSQL 数据库使用 `$1, $2, ...` 作为占位符。MySQL 则使用 `?`。不同的数据库驱动在 `sqlc.yaml` 中配置。

### 3.5 配置 `sqlc.yaml`

在项目根目录创建 `sqlc.yaml` 文件，用于配置代码生成行为。

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql" # 数据库类型 (支持 postgresql, mysql, sqlite)
    queries: "db/query.sql" # SQL 查询文件路径
    schema: "db/schema.sql" # 数据库 Schema 文件路径
    gen:
      go:
        package: "db" # 生成 Go 代码的包名
        out: "db" # 生成 Go 代码的输出目录
        emit_json_tags: true # 为生成的 struct 字段添加 JSON 标签
        emit_interface: true # 生成 Querier 接口
        # emit_exact_table_names: false # 是否使用精确的表名作为 struct 名 (默认 false，会转为单数形式)
        # emit_empty_slices: true # 对于 `:many` 查询，如果没有结果是否返回空切片而不是 nil
        # overrides:
        #   - db_type: "pg_catalog.uuid"
        #     go_type:
        #       import: "github.com/google/uuid"
        #       type: "UUID"
        #   - db_type: "pg_catalog.jsonb"
        #     go_type:
        #       import: "github.com/jackc/pgx/v5/pgtype"
        #       type: "JSONB"
```

### 3.6 生成 Go 代码

在项目根目录运行 `sqlc generate` 命令：

```bash
sqlc generate
```

成功后，`db/` 目录下将生成以下 Go 文件：

*   `db/models.go`: 定义了 `User` 等结果结构体，以及 `CreateUserParams`, `UpdateUserNameParams` 等参数结构体。
*   `db/query.sql.go`: 包含了 `Queries` 结构体和实现 `Querier` 接口的方法，如 `CreateUser()`, `GetUserByID()`, `ListUsers()`, `UpdateUserName()`, `DeleteUser()`。
*   `db/querier.go`: 定义了 `Querier` 接口。

### 3.7 使用生成的 Go 代码 (`main.go`)

在 `main.go` 中，你可以使用生成的代码与数据库进行交互。

**注意**: 需要安装 PostgreSQL 驱动 `github.com/lib/pq` 或 `github.com/jackc/pgx/v5`。这里以 `pgx/v5` 为例：

```bash
go get github.com/jackc/pgx/v5
```

```go
// main.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"your_module_name/db" // 导入生成的 Go 包
)

func main() {
	ctx := context.Background()

	// 替换为你的 PostgreSQL 连接字符串
	connStr := "postgresql://user:password@localhost:5432/database?sslmode=disable"
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	queries := db.New(conn) // 创建 Queries 实例

	// 1. 创建用户
	log.Println("--- 创建用户 ---")
	userParams := db.CreateUserParams{
		Name:  "Alice",
		Email: fmt.Sprintf("alice-%d@example.com", time.Now().Unix()),
	}
	createdUser, err := queries.CreateUser(ctx, userParams)
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}
	log.Printf("Created user: %+v\n", createdUser)

	// 2. 获取用户
	log.Println("--- 获取用户 ---")
	fetchedUser, err := queries.GetUserByID(ctx, createdUser.ID)
	if err != nil {
		log.Fatalf("Failed to get user by ID: %v", err)
	}
	log.Printf("Fetched user: %+v\n", fetchedUser)

	// 3. 更新用户姓名
	log.Println("--- 更新用户姓名 ---")
	updateParams := db.UpdateUserNameParams{
		ID:   fetchedUser.ID,
		Name: "Alicia Smith",
	}
	rowsAffected, err := queries.UpdateUserName(ctx, updateParams)
	if err != nil {
		log.Fatalf("Failed to update user name: %v", err)
	}
	log.Printf("Updated %d rows.\n", rowsAffected)

	// 4. 再次获取用户以验证更新
	log.Println("--- 再次获取用户以验证更新 ---")
	updatedFetchedUser, err := queries.GetUserByID(ctx, createdUser.ID)
	if err != nil {
		log.Fatalf("Failed to get updated user: %v", err)
	}
	log.Printf("Updated user: %+v\n", updatedFetchedUser)

	// 5. 列出所有用户
	log.Println("--- 列出所有用户 ---")
	users, err := queries.ListUsers(ctx)
	if err != nil {
		log.Fatalf("Failed to list users: %v", err)
	}
	log.Printf("Listed %d users:\n", len(users))
	for _, u := range users {
		log.Printf("- %+v\n", u)
	}

	// 6. 删除用户
	log.Println("--- 删除用户 ---")
	err = queries.DeleteUser(ctx, createdUser.ID)
	if err != nil {
		log.Fatalf("Failed to delete user: %v", err)
	}
	log.Printf("User with ID %d deleted.\n", createdUser.ID)
}

```
**重要**: 将 `your_module_name` 替换为你的 Go 模块名，并将连接字符串替换为实际的数据库凭据。

## 四、高级特性

### 4.1 自定义类型映射 (`overrides`)

当数据库类型无法直接映射到 Go 标准库类型（例如 UUID, JSONB）时，或者你希望使用特定的第三方库类型时，可以使用 `sqlc.yaml` 的 `overrides` 配置。

```yaml
# sqlc.yaml (部分)
    overrides:
      # 将 PostgreSQL 的 uuid 类型映射到 github.com/google/uuid.UUID
      - db_type: "pg_catalog.uuid"
        go_type:
          import: "github.com/google/uuid"
          type: "UUID"
      # 将 PostgreSQL 的 jsonb 类型映射到 pgx/v5 的 pgtype.JSONB
      - db_type: "pg_catalog.jsonb"
        go_type:
          import: "github.com/jackc/pgx/v5/pgtype"
          type: "JSONB"
      # 可以指定特定的列名进行映射
      # - column: "users.status"
      #   go_type: "my_app/enums.UserStatus"
```
这将确保在生成的 Go 代码中，相应的 SQL 类型被正确地表示为指定的 Go 类型。

### 4.2 空值处理 (Null Handling)

sqlc 默认使用 `database/sql` 提供的空值类型（如 `sql.NullString`, `sql.NullInt32`, `sql.NullTime`）来处理可能为 NULL 的列。例如，如果 `users.bio` 列允许 NULL，则在 `User` 结构体中，`Bio` 字段将被生成为 `sql.NullString`。

如果要使用更现代的 `pgx` 驱动的类型（如 `pgtype.Text`, `pgtype.UUID`），可以在 `sqlc.yaml` 中配置 `pgx/v5`，它会使用其自己的空值支持。

```yaml
# sqlc.yaml (使用 pgx/v5 的空值类型)
sql:
  - engine: "postgresql"
    queries: "db/query.sql"
    schema: "db/schema.sql"
    gen:
      go:
        package: "db"
        out: "db"
        sql_package: "pgx/v5" # 使用 pgx/v5 的类型，而非 database/sql 的默认类型
```
这将使得例如 `CHAR(255)` 类型对应 `pgtype.Text`，`INT` 对应 `pgtype.Int4`，它们都内置了空值类型处理。

### 4.3 事务支持

生成的 `Queries` 结构体通常是无状态的，每个方法都需要一个 `context.Context` 和一个 `sql.DB` 或 `sql.Tx` 实例。这意味着你可以通过传递 `sql.Tx` 来轻松地将多个操作组合到一个事务中。

```go
// 假设 main.go 中获取了 DB 连接池
func performTransaction(ctx context.Context, dbPool *pgx.Conn) error {
    tx, err := dbPool.Begin(ctx) // 开始事务
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx) // 确保在函数退出时回滚，除非明确提交

    queries := db.New(tx) // 使用事务创建新的 Queries 实例

    // 在事务中执行操作
    userParams1 := db.CreateUserParams{ Name: "Bob", Email: "bob@example.com" }
    _, err = queries.CreateUser(ctx, userParams1)
    if err != nil {
        return err
    }

    userParams2 := db.CreateUserParams{ Name: "Charlie", Email: "charlie@example.com" }
    _, err = queries.CreateUser(ctx, userParams2)
    if err != nil {
        return err
    }

    return tx.Commit(ctx) // 提交事务
}
```

### 4.4 多个 SQL 包

一个 `sqlc.yaml` 文件可以定义多个 `sql` 部分，从而为不同的数据库或不同的 SQL 文件生成不同的 Go 包。

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "db/users_query.sql"
    schema: "db/schema.sql"
    gen:
      go:
        package: "userrepo"
        out: "userrepo"
  - engine: "postgresql"
    queries: "db/products_query.sql"
    schema: "db/schema.sql"
    gen:
      go:
        package: "productrepo"
        out: "productrepo"
```

## 五、sqlc 的局限性

*   **没有自动迁移**: sqlc 专注于代码生成，不提供数据库 Schema 迁移工具。你需要结合如 `golang-migrate/migrate`、`goose` 等独立的工具来管理数据库 Schema 变更。
*   **不处理连接池**: sqlc 生成的代码直接操作 `sql.DB` 或 `sql.Tx` 接口，它不负责数据库连接池的创建和管理。这部分工作需要你自己使用 `database/sql` 或 `pgx` 等驱动库来完成。
*   **需要精确的 SQL**: sqlc 的强大之处在于它直接操作 SQL。这意味着你的 SQL 语句必须是有效的、正确的，并且与你的 Schema 一致。
*   **冗长的 SELECT 语句**: 每次 `SELECT` 语句都需要列出所有列，这可能很长。然而，这种显式性有助于避免隐式列更改带来的问题。

## 六、总结与最佳实践

sqlc 提供了一个在 Go 语言中与关系型数据库交互的极佳替代方案，它成功地在 SQL 的性能、灵活性与 Go 的类型安全、无反射之间找到了平衡点。

**最佳实践:**

1.  **版本控制 SQL 文件**: 将 `schema.sql` 和 `query.sql` 文件纳入版本控制，它们是应用程序的核心数据访问逻辑。
2.  **细粒度 SQL 文件**: 避免将所有查询都放在一个巨大的 `query.sql` 文件中。可以按功能模块拆分（例如 `users_query.sql`, `products_query.sql`）。
3.  **使用 `go generate`**: 将 `sqlc generate` 命令集成到 Go 的 `go generate` 工具链中，这样可以通过 `go generate ./...` 统一生成代码。
    ```go
    // 添加到某个 Go 文件顶部
    //go:generate sqlc generate
    ```
4.  **清晰的命名**: 为 SQL 查询选择清晰、描述性的 Go 函数名。
5.  **空值处理**: 根据项目需求选择 `database/sql` 的 `Null` 类型或 `pgx` 等驱动的空值类型。
6.  **错误处理**: 始终检查 sqlc 生成函数返回的错误。
7.  **数据库驱动选择**: 对于 PostgreSQL，`pgx/v5` 通常比 `lib/pq` 性能更好，且自带更丰富的类型支持。
8.  **将 `Queries` 作为接口传递**: 在业务逻辑层中，推荐接收 `db.Querier` 接口而不是 `db.Queries` 具体结构体，这有助于提高代码的解耦和可测试性（方便 mock）。

通过采用 sqlc，你的 Go 数据库访问层将变得更加健壮、高效且易于维护。