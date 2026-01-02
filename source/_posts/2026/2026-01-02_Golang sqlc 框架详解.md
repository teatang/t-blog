---
title: Golang sqlc 框架详解
date: 2026-01-02 06:24:00
tags: 
    - 2025
    - Golang
    - SQL
categories: 
    - Golang
    - 库
---

> **sqlc** 是一个**SQL 编译器 (SQL Compiler)**，它能够根据用户定义的 SQL 查询和数据库 Schema 自动生成类型安全 (type-safe) 的 Go 代码。与传统的 ORM (Object-Relational Mapping) 工具不同，`sqlc` 的核心理念是**“写 SQL，生成 Go (Write SQL, Get Go)”**。开发者专注于编写原生的 SQL 查询，`sqlc` 则负责将其转换为易于在 Go 应用程序中使用的、无反射、高性能的 API。

{% note info %}
核心思想：**保持 SQL 源码作为事实的唯一来源，并通过代码生成器将其无缝集成到 Go 代码中，实现类型安全和高效的数据库操作。** 它不尝试将 SQL 抽象化，而是将 SQL 语句转换为可直接调用的 Go 函数。
{% endnote %}

------

## 一、为什么选择 sqlc？

在 Golang 中进行数据库操作，开发者通常面临几种选择：

1.  **直接使用 `database/sql` 库**：最底层、最灵活，但需要手动处理行扫描、错误检查、参数绑定等，代码量大且容易出错。
2.  **使用传统 ORM (如 GORM, XORM)**：提供了高层次的抽象，通过 Go 结构体标签或方法调用来构建 SQL，但可能引入“魔术”、性能开销 (反射)、N+1 查询问题，以及在复杂查询时难以控制生成的 SQL。
3.  **使用 `sqlc`**：介于两者之间，它结合了 `database/sql` 的性能和 SQL 的控制力，同时提供了 ORM 的类型安全和便利性。

`sqlc` 的主要优势包括：

1.  **类型安全 (Type-Safety)**：`sqlc` 在编译时就能够检查 SQL 查询的语法和参数类型。它根据数据库 Schema 和 SQL 查询的返回结果，生成具有精确类型签名的 Go 函数和结构体。这意味着你可以在编码阶段捕获许多潜在的数据库错误，而不是在运行时。
2.  **性能 (Performance)**：`sqlc` 不使用反射，生成的 Go 代码直接调用 `database/sql` 的方法，性能接近手写 SQL。
3.  **SQL 主导 (SQL-First)**：开发者直接编写和维护原生的 SQL 查询。这使得数据库专家可以专注于优化 SQL 语句，而无需关心 Go 层的实现细节。生成的 Go 代码只是 SQL 的一个类型安全封装。
4.  **可维护性 (Maintainability)**：SQL 查询清晰可见，易于理解和调试。生成的 Go 代码是可读且可预测的，便于集成到项目中。
5.  **避免 ORM 弊端**：无需学习复杂的 ORM API，不必担心 ORM 隐式生成的低效 SQL 或 N+1 查询问题。
6.  **多数据库支持**：支持 PostgreSQL, MySQL, SQLite, Oracle 等主流关系型数据库。
7.  **工具友好**：由于 SQL 查询是独立的 `.sql` 文件，可以利用各种 SQL 编辑器、格式化工具和 Lint 工具进行管理。

## 二、sqlc 的核心概念

`sqlc` 的工作流程和核心概念相对直观：

### 2.1 数据库 Schema (DDL)

`sqlc` 需要你的数据库 Schema 来理解表结构、列类型和约束。你通常会提供一个或多个 SQL 文件，其中包含 `CREATE TABLE` 等 DDL (Data Definition Language) 语句。`sqlc` 会解析这些文件，构建数据库的内部表示。

### 2.2 SQL 查询文件

这是你编写原生 SQL 查询的地方。每个 SQL 文件可以包含多个查询，每个查询都应该有一个唯一的名称（通过 SQL 注释指定），`sqlc` 会根据这个名称生成对应的 Go 函数。

**示例：**
```sql
-- name: GetUser :one
SELECT id, name, email FROM users WHERE id = ?;

-- name: ListUsers :many
SELECT id, name, email FROM users ORDER BY name;

-- name: CreateUser :execrows
INSERT INTO users (name, email) VALUES (?, ?);
```

### 2.3 `sqlc.yaml` 配置文件

这个 YAML 文件定义了 `sqlc` 的行为，包括：

*   `schema`: 指向你的数据库 Schema DDL 文件。
*   `queries`: 指向你的 SQL 查询文件。
*   `version`: `sqlc` 配置的版本 (目前是 `v2`)。
*   `plugins`: 定义要生成的语言和目标路径。
*   `overrides`: 允许你将特定的 SQL 类型映射到自定义的 Go 类型。
*   `sql`: 数据库类型 (`mysql`, `postgresql`, `sqlite`)，以及其他 SQL 相关的配置。

### 2.4 生成的代码 (Go)

`sqlc` 会根据 Schema 和查询文件生成以下 Go 代码：

*   **`models.go`**: 包含与数据库表行对应的 Go 结构体。例如，如果 `SELECT id, name, email FROM users`，则会生成一个 `User` 结构体。
*   **`queries.go`**: 包含所有 SQL 查询对应的 Go 函数。每个函数都接受 `context.Context` 和查询参数，并返回查询结果或错误。
*   **`db.go`**: 包含 `Querier` 接口 (定义了所有查询函数) 和 `New` 函数 (用于创建 `Querier` 实例)。
*   **`copyfrom.go` (可选)**: 如果启用，用于批量插入优化。

### 2.5 `Querier` 接口

`sqlc` 会自动生成一个 `Querier` 接口，其中包含了所有你在 SQL 查询文件中定义的查询函数。你的应用程序代码将主要通过这个接口来与数据库进行交互。

## 三、sqlc 的工作流程

`sqlc` 的典型工作流程如下：

{% mermaid %}
graph TD
    A[定义数据库Schema] --> B[编写SQL查询];
    B --> C[配置sqlc.yaml];
    C -- 运行 sqlc generate --> D[生成类型安全的Go代码];
    D --> E[在应用程序中使用<br>生成的Go代码];

    subgraph Schema 定义
        A1["schema.sql (DDL)"]
        A --> A1
    end

    subgraph SQL 查询
        B1["query.sql (SELECT, <br>INSERT, UPDATE, DELETE)"]
        B --> B1
    end

    subgraph sqlc 配置
        C1[sqlc.yaml]
        C --> C1
    end

    subgraph Go 应用程序
        E1[main.go, service.go 等]
        E --> E1
    end
{% endmermaid %}

**详细步骤：**

1.  **编写 DDL (Data Definition Language) 文件 (`schema.sql`)**: 定义你的数据库表结构。
2.  **编写 SQL 查询文件 (`query.sql`)**: 包含你想要在 Go 代码中使用的所有 `SELECT`, `INSERT`, `UPDATE`, `DELETE` 语句。每个查询前加上 `--- name: QueryName :returntype` 注释。
3.  **创建 `sqlc.yaml` 配置文件**: 指明 Schema 文件、查询文件、目标语言和输出路径等。
4.  **运行 `sqlc generate` 命令**: `sqlc` 会读取配置文件、Schema 文件和查询文件，然后生成相应的 Go 代码。
5.  **在 Go 应用程序中使用生成的代码**: 你可以通过 `sqlc.New(db)` 创建 `Querier` 实例，然后调用其上的方法来执行数据库操作。

## 四、sqlc 实践示例 (MySQL)

本示例将创建一个简单的 `users` 表，并实现 CRUD 操作。

### 4.1 准备工作

1.  **初始化 Go 项目**
    ```bash
    mkdir sqlc-demo && cd sqlc-demo
    go mod init sqlc-demo
    ```

2.  **安装 `sqlc` CLI 工具和数据库驱动**
    ```bash
    go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
    go get github.com/go-sql-driver/mysql # 或者 github.com/lib/pq for PostgreSQL
    ```

### 4.2 定义数据库 Schema (`schema.sql`)

创建一个 `schema.sql` 文件：
```sql
-- schema.sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 编写 SQL 查询 (`query.sql`)

创建一个 `query.sql` 文件：
```sql
-- query.sql
-- name: CreateUser :execresult
INSERT INTO users (name, email) VALUES (?, ?);

-- name: GetUserByID :one
SELECT id, name, email, created_at FROM users WHERE id = ?;

-- name: GetUserByEmail :one
SELECT id, name, email, created_at FROM users WHERE email = ?;

-- name: ListUsers :many
SELECT id, name, email, created_at FROM users ORDER BY name;

-- name: UpdateUserName :execrows
UPDATE users SET name = ? WHERE id = ?;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = ?;
```
**`:` 后面的注释 (`:one`, `:many`, `:exec`, `:execresult`, `:execrows`) 是 `sqlc` 特定的，用于指示查询的返回类型：**
*   `:one`: 期望返回单行结果。生成的函数返回一个结构体和一个错误 (如果未找到则为 `sql.ErrNoRows`)。
*   `:many`: 期望返回多行结果。生成的函数返回一个结构体切片和一个错误。
*   `:exec`: 执行 DML (INSERT, UPDATE, DELETE) 语句，不返回结果集。生成的函数返回 `error`。
*   `:execrows`: 执行 DML 语句，返回受影响的行数 (`int64`)。
*   `:execresult`: 执行 DML 语句，返回 `sql.Result` 接口 (包含 `LastInsertId` 和 `RowsAffected`)。

### 4.4 配置 `sqlc.yaml`

创建一个 `sqlc.yaml` 文件：
```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "mysql" # 或 "postgresql", "sqlite"
    queries: "query.sql"
    schema: "schema.sql"
    codegen:
      - out: "sqlc" # 生成的 Go 代码的输出目录
        plugin: "go"
        options:
          package: "sqlc" # 生成的 Go 包名
          emit_json_tags: true # 为生成的结构体字段添加 JSON tag
          emit_prepared_queries: false # 不生成预处理语句，默认 false
          emit_interface: true # 生成 Querier 接口
          emit_exact_table_names: false # 使用小写单数形式作为默认结构体名
          emit_empty_slices: true # 查询结果为空时返回空切片而不是 nil
          # sql_type_to_go_type: # 可选：自定义 SQL 类型到 Go 类型的映射
          #   - db_type: "timestamptz"
          #     go_type: "github.com/jackc/pgx/v5/pgtype.Timestamptz"
```

### 4.5 生成 Go 代码

运行 `sqlc generate` 命令：
```bash
sqlc generate
```
这将在 `sqlc/` 目录下生成 `db.go`, `models.go`, `query.go` 文件。

### 4.6 编写 Go 应用程序 (`main.go`)

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"sqlc-demo/sqlc" // 引入 sqlc 生成的包

	_ "github.com/go-sql-driver/mysql" // 引入 MySQL 驱动
)

func main() {
	// 1. 连接数据库
	db, err := sql.Open("mysql", "root:pass@tcp(127.0.0.1:3306)/sqlc_demo?parseTime=true")
	if err != nil {
		log.Fatalf("failed to open database connection: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	log.Println("Successfully connected to the database!")

	// 确保数据库中存在 'sqlc_demo' 数据库，并已执行 schema.sql
	// 在生产环境中，你会使用专门的迁移工具来管理 schema。
	// 这里为了演示，假设表已存在。

	ctx := context.Background()

	// 2. 创建 sqlc.Queries 实例
	queries := sqlc.New(db)

	// --- CRUD Operations ---

	// Create User
	fmt.Println("\n--- Create User ---")
	createResult, err := queries.CreateUser(ctx, sqlc.CreateUserParams{
		Name:  "Alice",
		Email: "alice@example.com",
	})
	if err != nil {
		log.Fatalf("failed to create user: %v", err)
	}
	aliceID, _ := createResult.LastInsertId()
	fmt.Printf("Created user Alice with ID: %d\n", aliceID)

	createResult, err = queries.CreateUser(ctx, sqlc.CreateUserParams{
		Name:  "Bob",
		Email: "bob@example.com",
	})
	if err != nil {
		log.Fatalf("failed to create user: %v", err)
	}
	bobID, _ := createResult.LastInsertId()
	fmt.Printf("Created user Bob with ID: %d\n", bobID)

	// Get User by ID
	fmt.Println("\n--- Get User by ID ---")
	userAlice, err := queries.GetUserByID(ctx, int32(aliceID))
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("User with ID %d not found.\n", aliceID)
		} else {
			log.Fatalf("failed to get user by ID: %v", err)
		}
	} else {
		fmt.Printf("Found user by ID: %+v\n", userAlice)
	}

	// Get User by Email
	fmt.Println("\n--- Get User by Email ---")
	userBob, err := queries.GetUserByEmail(ctx, "bob@example.com")
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("User with email bob@example.com not found.")
		} else {
			log.Fatalf("failed to get user by email: %v", err)
		}
	} else {
		fmt.Printf("Found user by email: %+v\n", userBob)
	}

	// List Users
	fmt.Println("\n--- List Users ---")
	users, err := queries.ListUsers(ctx)
	if err != nil {
		log.Fatalf("failed to list users: %v", err)
	}
	fmt.Println("All users:")
	for _, u := range users {
		fmt.Printf("- %+v\n", u)
	}

	// Update User Name
	fmt.Println("\n--- Update User Name ---")
	rowsAffected, err := queries.UpdateUserName(ctx, sqlc.UpdateUserNameParams{
		Name: "Alice Smith",
		ID:   int32(aliceID),
	})
	if err != nil {
		log.Fatalf("failed to update user name: %v", err)
	}
	fmt.Printf("Updated %d rows for user ID %d\n", rowsAffected, aliceID)

	// Verify update
	userAliceUpdated, err := queries.GetUserByID(ctx, int32(aliceID))
	if err != nil {
		log.Fatalf("failed to get updated user: %v", err)
	}
	fmt.Printf("Updated user Alice: %+v\n", userAliceUpdated)

	// Delete User
	fmt.Println("\n--- Delete User ---")
	err = queries.DeleteUser(ctx, int32(bobID))
	if err != nil {
		log.Fatalf("failed to delete user: %v", err)
	}
	fmt.Printf("Deleted user with ID: %d\n", bobID)

	// Verify deletion
	_, err = queries.GetUserByID(ctx, int32(bobID))
	if err == sql.ErrNoRows {
		fmt.Printf("User with ID %d not found after deletion (as expected).\n", bobID)
	} else if err != nil {
		log.Fatalf("failed to get deleted user: %v", err)
	} else {
		fmt.Println("User found after deletion (deletion failed).")
	}

	// --- Transaction Example ---
	fmt.Println("\n--- Transaction Example ---")
	tx, err := db.BeginTx(ctx, nil) // 开始事务
	if err != nil {
		log.Fatalf("failed to begin transaction: %v", err)
	}
	// 在事务中使用 sqlc.Queries
	txQueries := queries.WithTx(tx) // 重要：使用 WithTx 创建一个事务专用的 Querier 实例

	// 在事务中创建新用户
	carolResult, err := txQueries.CreateUser(ctx, sqlc.CreateUserParams{
		Name:  "Carol",
		Email: fmt.Sprintf("carol_%d@example.com", time.Now().UnixNano()),
	})
	if err != nil {
		tx.Rollback() // 失败时回滚
		log.Fatalf("failed to create Carol in transaction: %v", err)
	}
	carolID, _ := carolResult.LastInsertId()
	fmt.Printf("Created user Carol in transaction with ID: %d\n", carolID)

	// 假设这里有一些业务逻辑，可能导致错误
	if false { // 模拟一个错误，这将导致回滚
		tx.Rollback()
		fmt.Println("Transaction rolled back due to error.")
	} else {
		tx.Commit() // 成功时提交
		fmt.Println("Transaction committed successfully.")
	}

	// 确认 Carol 是否存在 (如果提交了事务)
	userCarol, err := queries.GetUserByID(ctx, int32(carolID))
	if err != nil {
		fmt.Printf("Carol not found after transaction (expected if rolled back): %v\n", err)
	} else {
		fmt.Printf("Carol found after transaction commit: %+v\n", userCarol)
	}
}
```

### 4.7 运行示例

1.  确保 MySQL 数据库已运行，并创建了名为 `sqlc_demo` 的数据库。
2.  更新 `main.go` 中的数据库连接字符串。
3.  手动在 `sqlc_demo` 数据库中执行 `schema.sql` 中的 `CREATE TABLE` 语句，或者在 `main.go` 中添加自动执行 `schema.sql` 的逻辑 (不推荐在生产环境)。
4.  运行 `main.go`：
    ```bash
    go run main.go
    ```

## 五、高级用法和特性

1.  **Null 值处理**：`sqlc` 可以配置如何处理数据库中的 `NULL` 值。默认情况下，它会生成 Go 语言的 `sql.NullString`, `sql.NullInt32` 等类型。你也可以在 `sqlc.yaml` 中配置 `sql_type_to_go_type` 将其映射为 Go 指针类型 (如 `*string`) 或第三方库的 Nullable 类型 (如 `pgx/v5/pgtype`)。
2.  **自定义类型**：通过 `sql_type_to_go_type` 配置，你可以将数据库的自定义类型 (如 PostgreSQL 的 `UUID` 类型) 映射到 Go 中的特定类型。
3.  **事务**：`sqlc` 支持事务操作。你可以通过 `db.BeginTx(ctx, nil)` 开始一个事务，然后使用 `queries.WithTx(tx)` 方法创建一个新的 `Querier` 实例，该实例的所有操作都会在同一个事务中执行。
4.  **Prepared Statements**：`sqlc` 默认生成的查询会使用预处理语句，这提高了性能并防止了 SQL 注入。
5.  **批量插入/更新**：对于支持 `COPY FROM` (PostgreSQL) 或 `LOAD DATA LOCAL INFILE` (MySQL) 等批量操作的数据库，`sqlc` 可以生成相应的代码，显著提高数据导入效率。
6.  **Hooks**：通过 `sqlc.yaml` 配置，可以运行自定义 Go 命令来处理生成的代码，例如格式化或 Lint。

## 六、sqlc 的优缺点与适用场景

### 6.1 优点：

1.  **极高的类型安全性**：编译时捕获 SQL 错误和类型不匹配，提高代码质量和稳定性。
2.  **高性能**：无反射开销，生成的代码直接使用 `database/sql`，性能接近手写 SQL。
3.  **SQL 主导**：保持 SQL 的原生优势和控制力，方便数据库专家进行优化。
4.  **易于维护和调试**：SQL 和 Go 代码都清晰可见，逻辑透明。
5.  **避免 ORM 陷阱**：避免了 ORM 可能带来的复杂性、隐式行为和性能问题。
6.  **工具生态友好**：可以直接使用现有 SQL 工具链进行 SQL 文件的管理。

### 6.2 缺点：

1.  **学习曲线**：对于习惯了 ORM 的开发者，需要适应 `sqlc` 的代码生成和 SQL-First 范式。
2.  **SQL 文件的管理**：随着项目增长，SQL 查询文件会增多，需要良好的组织和命名规范。
3.  **不处理 Schema 迁移**：`sqlc` 仅关注查询，Schema 迁移仍需配合其他工具（如 `golang-migrate`, `flyway`, `ent` 的迁移工具等）。
4.  **关联查询的复杂性**：对于非常复杂的 JOIN 查询，可能需要手动编写更多的 SQL，而 ORM 可能会提供更高级的抽象。然而，这也可以看作是一种优势，因为它迫使你更清楚地理解 SQL。
5.  **少量样板代码**：每次修改 Schema 或 `query.sql` 都需要重新运行 `sqlc generate`。

### 6.3 适用场景：

*   **对性能和类型安全有高要求**：例如高性能后端服务、数据处理服务。
*   **希望保持 SQL 原生控制力**：当开发者希望完全控制 SQL 语句，不希望被 ORM 框架过度封装时。
*   **微服务架构**：在微服务中，每个服务可以拥有自己的数据库 Schema 和 `sqlc` 生成的客户端。
*   **与数据库专家紧密协作**：DBA 或后端开发者可以专注于优化 SQL 语句，Go 开发者只需使用生成的 API。
*   **不希望引入复杂 ORM 依赖的项目**。

## 七、安全性考虑

1.  **SQL 注入防护**：`sqlc` 通过生成参数化查询的代码来**自动防止 SQL 注入**。你只需要在 SQL 中使用占位符 (`?` for MySQL/SQLite, `$1, $2` for PostgreSQL)，`sqlc` 会负责将 Go 参数安全地绑定到这些占位符上。
2.  **敏感数据处理**：在数据库 Schema 和查询中不应直接暴露敏感信息，例如密码应存储哈希值。
3.  **错误处理**：始终检查 `sqlc` 生成函数返回的 `error`。特别是 `sql.ErrNoRows` 表示未找到数据，而不是错误。
4.  **数据库连接安全**：数据库连接字符串应从环境变量、配置文件或秘密管理服务中安全加载，绝不硬编码在代码中。
5.  **权限控制**：`sqlc` 专注于数据库交互，不提供应用层面的权限管理。应用程序需要自行实现身份验证和授权逻辑。
6.  **Schema 变更审查**：虽然 `sqlc` 不直接处理迁移，但在更改 `schema.sql` 后重新生成代码时，应配合版本化的数据库迁移工具，并在生产环境部署前仔细审查迁移脚本。

## 八、总结

`sqlc` 为 Golang 开发者提供了一个独特且强大的数据库访问方法。它在 `database/sql` 的性能和 SQL 的控制力之上，构建了一个类型安全的代码生成层。通过将 SQL 查询作为核心，`sqlc` 使得 Go 应用程序能够以最小的开销和最大的可靠性与数据库进行交互。对于那些重视性能、类型安全、SQL 透明度并乐于编写原生 SQL 的项目和团队来说，`sqlc` 是一个非常优秀的数据库工具。