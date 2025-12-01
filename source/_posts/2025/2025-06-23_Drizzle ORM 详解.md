---
title: Drizzle ORM 详解
date: 2025-06-23 06:24:00
tags:
  - 2025
  - 前端技术
  - ORM
categories:
  - 前端技术
  - 库
---

> **Drizzle ORM** 是一个为 TypeScript/JavaScript 设计的现代、轻量级、**完全类型安全 (fully type-safe)** 的 ORM (Object Relational Mapper)。它旨在提供一个高度接近 SQL 的 API，同时利用 TypeScript 的类型系统，在编译时捕获数据库相关的错误，并在运行时生成高效的 SQL 语句。Drizzle ORM 强调性能、开发者体验和对底层 SQL 的透明度。

{% note info %}
核心思想：**将数据库 schema 定义为 TypeScript 代码，并通过其表达式语言在编译时实现对 SQL 查询的完全类型安全检查，同时保持生成 SQL 的高效性与可读性。** 它更像是一个类型安全的 SQL 查询构建器，而非传统的重型 ORM。
{% endnote %}
------

> **重要提示**: Drizzle ORM 是为 TypeScript/JavaScript 生态系统设计的。因此，本文档中的所有代码示例都将使用 **TypeScript** 语言。这与之前关于 Go 或 Python 库的示例有所不同，以确保示例的实用性和相关性。

## 一、为什么需要 Drizzle ORM？

在 TypeScript/JavaScript 应用中与关系型数据库交互时，开发者常面临以下痛点：

1.  **类型安全缺失**：传统上，SQL 字符串是在运行时构造和执行的，无法在编译时检查列名拼写错误、类型不匹配等问题，容易导致运行时错误。
2.  **ORM 的“魔术”和性能开销**：许多传统 ORM 隐藏了底层 SQL 的复杂性，虽然简化了开发，但可能生成低效的 SQL，且难以调试。开发者对生成的查询缺乏控制。
3.  **模式同步与迁移**：手动管理数据库模式的创建和变更（迁移）过程繁琐且容易出错。
4.  **跨数据库兼容性**：不同的数据库有细微的 SQL 语法差异，需要 ORM 进行适配。
5.  **开发者体验**：希望在享受 TypeScript 带来的类型安全和自动补全的同时，能以接近原生 SQL 的方式操作数据库。

Drizzle ORM 旨在通过以下方式解决这些问题：

*   **编译时类型安全**：从数据库模式到查询结果，整个过程都是类型安全的。在编写查询时即可获得自动补全和错误提示。
*   **“SQL-like” API**：提供一个高度接近 SQL 语法的表达式语言，让熟悉 SQL 的开发者能够快速上手，并对生成的 SQL 拥有更大控制权。
*   **轻量与高性能**：生成简洁高效的 SQL，没有过多的运行时开销。
*   **Drizzle Kit CLI**：提供强大的命令行工具，用于数据库模式内省 (introspection)、迁移生成和管理。
*   **多数据库支持**：支持 PostgreSQL (Neon, Supabase, Vercel Postgres, AWS RDS), MySQL, SQLite (Bun SQLite, Turso, Cloudflare D1)。

## 二、Drizzle ORM 的核心概念

Drizzle ORM 围绕几个关键概念构建，理解它们是高效使用 Drizzle 的基础。

1.  **Schema Definition (模式定义)**:
    *   **定义**：使用 Drizzle 提供的 DSL (Domain Specific Language) 在 TypeScript 代码中定义数据库的表、列、索引和关系。
    *   **作用**：作为事实的单一来源 (Single Source of Truth)，用于生成 SQL 语句、进行类型推断和生成数据库迁移。

2.  **DB Instance (数据库实例)**:
    *   **定义**：通过 Drizzle 的 `drizzle-orm` 包提供的 `drizzle()` 函数，传入数据库驱动的连接对象，创建的 Drizzle ORM 数据库客户端实例。
    *   **作用**：是执行所有 Drizzle ORM 操作的入口点。

3.  **Drizzle Kit (CLI 工具)**:
    *   **定义**：一个命令行工具，用于处理 Drizzle ORM 的模式管理任务。
    *   **作用**：**内省**现有数据库模式并生成 TypeScript Schema 文件；**生成**数据库迁移文件以同步代码中的 Schema 变更到数据库；**推送** Schema 变更到数据库。

4.  **SQL Expression Language (SQL 表达式语言)**:
    *   **定义**：Drizzle ORM 提供的用于构建查询的 TypeScript 函数和操作符集合，它们与 SQL 关键字和操作符一对一对应。
    *   **作用**：在 TypeScript 代码中以类型安全的方式编写 `SELECT`, `INSERT`, `UPDATE`, `DELETE` 等 SQL 语句。

5.  **Relations (关系)**:
    *   **定义**：在 Schema 文件中定义表之间的关系，如一对一、一对多、多对多。
    *   **作用**：允许在查询时轻松地`with`相关联的数据，进行连接查询。

6.  **Transactions (事务)**:
    *   **定义**：一组原子性的数据库操作，要么全部成功，要么全部失败。
    *   **作用**：确保数据的一致性和完整性。

## 三、Drizzle ORM 架构与工作流程

Drizzle ORM 的设计理念是**“编译器优先” (Compiler-First)**，这意味着它在编译时利用 TypeScript 的类型系统进行大量检查和推断。

### 3.1 架构图

{% mermaid %}
graph TD
    subgraph Application
        AppCode[TypeScript/JavaScript Application Code]
    end

    subgraph Drizzle ORM Framework
        AppCode --> SchemaDef["Schema Definition (.ts files)"]
        AppCode --> DrizzleORM["Drizzle ORM API (select, insert, update, delete, etc.)"]
        DrizzleORM -- "Generates" --> SQLStatements[Optimized SQL Statements]
    end

    subgraph Drizzle Kit CLI
        direction LR
        SchemaDef -->|Used by| DrizzleKit[Drizzle Kit CLI]
        ExistingDB[(Existing Database)] -->|Introspects & Generates Schema| DrizzleKit
        DrizzleKit -->|Generates/Pushes| Migrations[Database Migrations]
    end

    subgraph Database Interaction
        SQLStatements -- "Executed by" --> DBClient["Database Driver Client (e.g., node-postgres, better-sqlite3)"]
        DBClient <--> Database["Relational Database (PostgreSQL, MySQL, SQLite)"]
    end

    AppCode -- "Creates & Uses" --> DBClient
    Migrations --> Database
{% endmermaid %}

### 3.2 工作流程 (Schema 到数据操作)

一个典型的 Drizzle ORM 工作流程如下：

{% mermaid %}
sequenceDiagram
    participant Dev as 开发者
    participant Schema as Schema 定义 (.ts)
    participant DrizzleKit as Drizzle Kit CLI
    participant DB as 数据库
    participant App as 应用程序

    Dev->>Schema: 1. 定义数据库 Schema (Tables, Columns, Relations)
    Dev->>DrizzleKit: 2. 生成初始迁移 (drizzle-kit generate)
    DrizzleKit->>DB: 3. 应用迁移到数据库 (drizzle-kit migrate / push)
    Dev->>App: 4. 在应用程序中实例化 Drizzle DB 客户端

    App->>App: 5. 编写 Drizzle ORM 查询 (select, insert, update, delete)
    Note over App: TypeScript 编译器在编写时提供类型安全和自动补全

    App->>DB: 6. Drizzle ORM 生成并执行 SQL 语句
    DB-->>App: 7. 返回原始数据库结果

    App->>App: 8. Drizzle ORM 将结果类型化，供应用程序使用
{% endmermaid %}

## 四、Drizzle ORM 入门与基本用法

### 4.1 安装

```bash
# 安装核心 Drizzle ORM 库
npm install drizzle-orm
# 或 yarn add drizzle-orm

# 安装 Drizzle Kit CLI (用于 schema 管理和迁移)
npm install -D drizzle-kit
# 或 yarn add -D drizzle-kit

# 安装数据库驱动 (根据你使用的数据库选择)
# PostgreSQL:
npm install pg
# MySQL:
npm install mysql2
# SQLite (例如 with better-sqlite3 for Node.js):
npm install better-sqlite3
```

### 4.2 配置 `drizzle.config.ts`

在项目根目录创建 `drizzle.config.ts` (或 `.js`) 文件，用于 Drizzle Kit 配置。

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: "./src/schema.ts", // 指向你的 schema 定义文件
  out: "./drizzle",          // 迁移文件输出目录
  driver: "pg",              // 或 "mysql2", "sqlite"
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!, // 你的数据库连接字符串
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 4.3 数据库连接与 Schema 定义

首先，在 `src/db.ts` 或类似文件中设置数据库连接：

```typescript
// src/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'; // 根据你的驱动选择，例如 'drizzle-orm/node-postgres'
import postgres from 'postgres'; // 导入具体的数据库驱动
import * as schema from './schema'; // 导入你的 schema 定义

// 从环境变量获取连接字符串
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// 创建一个 PostgreSQL 客户端
const client = postgres(connectionString);

// 将客户端与 Drizzle ORM 绑定，并导入 schema
export const db = drizzle(client, { schema });

// 示例：用于演示的异步连接关闭函数（实际应用可能在应用退出时调用）
export async function closeDbConnection() {
  await client.end();
  console.log('Database client disconnected.');
}
```

然后，在 `src/schema.ts` 定义你的数据库模式：

```typescript
// src/schema.ts
import { pgTable, serial, text, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 定义一个枚举类型
export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'viewer']);

// 定义 users 表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()), // 自动更新
});

// 定义 posts 表
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  content: text('content'),
  userId: serial('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // 外键关联 users.id
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 定义表之间的关系
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts), // 一个用户有多个帖子 (一对多)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }), // 一个帖子属于一个作者 (多对一)
}));
```

## 五、Drizzle ORM 各种 SQL 操作方法详解

以下示例将演示 Drizzle ORM 的 CRUD (Create, Read, Update, Delete) 操作，以及更高级的查询功能。

```typescript
// src/examples.ts (假设 db 实例已从 src/db.ts 导入)
import { db, closeDbConnection } from './db';
import { users, posts, userRoleEnum } from './schema';
import { eq, like, desc, asc, and, or, not, gt, lt, gte, lte, sql } from 'drizzle-orm';

async function runDrizzleExamples() {
  console.log("--- Drizzle ORM 操作示例 ---");

  // --- Ⅰ. 创建数据 (INSERT) ---
  console.log("\n--- Ⅰ. 创建数据 (INSERT) ---");
  try {
    // 1. 插入单个用户
    const [alice] = await db.insert(users).values({
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'admin',
    }).returning(); // .returning() 返回插入的行

    console.log("插入用户 Alice:", alice);

    // 2. 插入多个用户
    const newUsers = await db.insert(users).values([
      { name: 'Bob Johnson', email: 'bob@example.com', role: 'editor' },
      { name: 'Charlie Brown', email: 'charlie@example.com', isActive: false },
    ]).returning();

    console.log("插入用户 Bob 和 Charlie:", newUsers);

    // 3. 插入帖子并关联用户
    if (alice) {
      const [alicePost1] = await db.insert(posts).values({
        title: 'My First Post',
        content: 'This is Alice\'s first great post!',
        userId: alice.id,
      }).returning();
      console.log("插入 Alice 的帖子 1:", alicePost1);

      const [alicePost2] = await db.insert(posts).values({
        title: 'Another Article by Alice',
        content: 'Exploring Drizzle ORM features.',
        userId: alice.id,
      }).returning();
      console.log("插入 Alice 的帖子 2:", alicePost2);
    }
    const [bobUser] = await db.select().from(users).where(eq(users.name, 'Bob Johnson')).limit(1);
    if (bobUser) {
        await db.insert(posts).values({
            title: 'Bob\'s Tech Review',
            content: 'Reviewing the latest gadgets.',
            userId: bobUser.id,
        });
        console.log("插入 Bob 的帖子。");
    }

  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL 唯一约束错误代码
        console.error("插入数据失败：", error.message);
    } else {
        console.error("插入数据时发生未知错误：", error);
    }
  }


  // --- Ⅱ. 读取数据 (SELECT) ---
  console.log("\n--- Ⅱ. 读取数据 (SELECT) ---");

  // 1. 查询所有用户
  const allUsers = await db.select().from(users);
  console.log("所有用户:", allUsers);

  // 2. 带条件的查询 (WHERE)
  // `eq` (equals), `gt` (greater than), `lt` (less than), `like` 等
  const aliceOnly = await db.select().from(users).where(eq(users.email, 'alice@example.com'));
  console.log("查询用户 Alice:", aliceOnly);

  const activeUsers = await db.select().from(users).where(eq(users.isActive, true));
  console.log("活跃用户:", activeUsers);

  // 3. 组合条件 (AND, OR, NOT)
  const editorsOrAdmins = await db.select().from(users).where(
    or(
      eq(users.role, 'editor'),
      eq(users.role, 'admin')
    )
  );
  console.log("编辑或管理员:", editorsOrAdmins);

  const activeAdmins = await db.select().from(users).where(
    and(
      eq(users.role, 'admin'),
      eq(users.isActive, true)
    )
  );
  console.log("活跃管理员:", activeAdmins);

  // 4. 选择特定列 (Projection)
  const userEmails = await db.select({
    name: users.name,
    email: users.email
  }).from(users);
  console.log("只查询用户姓名和邮箱:", userEmails);

  // 5. 排序 (ORDER BY)
  const usersSortedByName = await db.select().from(users).orderBy(asc(users.name));
  console.log("按姓名升序排序的用户:", usersSortedByName);

  const latestUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(2);
  console.log("最新注册的2个用户:", latestUsers);

  // 6. 限制与偏移 (LIMIT, OFFSET)
  const paginatedUsers = await db.select().from(users).orderBy(asc(users.id)).limit(2).offset(1);
  console.log("分页查询 (跳过1个，获取2个):", paginatedUsers);

  // 7. 连接查询 (JOINs) - 使用 Relations (with)
  // Drizzle ORM 推荐使用 with() 语法加载关联数据，而非手动写 JOIN
  const usersWithPosts = await db.query.users.findMany({
    with: {
      posts: true, // 加载所有关联的帖子
    },
  });
  console.log("用户及其关联的帖子 (使用 with):", usersWithPosts);

  // 你也可以进行更细粒度的控制，例如只查询帖子的 title
  const usersWithPostTitles = await db.query.users.findMany({
    with: {
      posts: {
        columns: {
          title: true,
          publishedAt: true,
        },
      },
    },
  });
  console.log("用户及其帖子标题 (使用 with + columns):", usersWithPostTitles);

  // 如果需要更复杂的 JOIN 逻辑，例如 LEFT JOIN 且过滤：
  const postsAndAuthors = await db.select({
    postTitle: posts.title,
    authorName: users.name,
    authorEmail: users.email,
  })
  .from(posts)
  .leftJoin(users, eq(posts.userId, users.id)); // 手动指定 JOIN 条件
  console.log("帖子及其作者 (使用 leftJoin):", postsAndAuthors);


  // 8. 聚合函数 (Aggregation) 与分组 (GROUP BY)
  // count(), sum(), avg(), min(), max()
  // 导入聚合函数
  const { count } = await import('drizzle-orm');

  const userPostCounts = await db.select({
    userName: users.name,
    postCount: count(posts.id),
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId))
  .groupBy(users.id, users.name) // 必须包含所有非聚合的 SELECT 列
  .orderBy(desc(count(posts.id)));
  console.log("各用户发帖数量:", userPostCounts);

  // 9. 原始 SQL (Raw SQL)
  // 当 Drizzle ORM 的表达式语言无法满足需求时，可以直接执行原始 SQL
  const rawQueryResult = await db.execute(sql`SELECT name, email FROM users WHERE role = ${'editor'}`);
  // 注意：db.execute 返回的是原始数据库驱动的结果，类型可能不确定
  // 你可以使用 db.all(sql`...`) 或 db.get(sql`...`) 获取类型化结果 (如果驱动支持)
  // 或者使用 sql`...`.as(UserSchema) 协助类型推断 (高级用法)
  console.log("原始 SQL 查询结果:", rawQueryResult);

  // --- Ⅲ. 更新数据 (UPDATE) ---
  console.log("\n--- Ⅲ. 更新数据 (UPDATE) ---");
  const [updatedAlice] = await db.update(users)
    .set({ name: 'Alice Wonderland', updatedAt: new Date() })
    .where(eq(users.email, 'alice@example.com'))
    .returning();
  console.log("更新用户 Alice:", updatedAlice);

  const [updatedBob] = await db.update(users)
    .set({ isActive: true })
    .where(eq(users.name, 'Bob Johnson'))
    .returning({ id: users.id, name: users.name, isActive: users.isActive }); // 只返回特定列
  console.log("更新用户 Bob 的活跃状态:", updatedBob);

  // --- Ⅳ. 删除数据 (DELETE) ---
  console.log("\n--- Ⅳ. 删除数据 (DELETE) ---");
  const [deletedCharlie] = await db.delete(users)
    .where(eq(users.name, 'Charlie Brown'))
    .returning({ id: users.id, name: users.name });
  console.log("删除用户 Charlie:", deletedCharlie);

  // 因为 posts.userId 设置了 onDelete: 'cascade'，删除用户时其帖子也会被删除
  const [deletedBob] = await db.delete(users)
    .where(eq(users.name, 'Bob Johnson'))
    .returning();
  console.log("删除用户 Bob (级联删除其帖子):", deletedBob);

  const remainingPosts = await db.select().from(posts);
  console.log("删除 Bob 后剩余的帖子:", remainingPosts);


  // --- Ⅴ. 事务 (Transactions) ---
  console.log("\n--- Ⅴ. 事务 (Transactions) ---");
  try {
    await db.transaction(async (tx) => {
      const [userD] = await tx.insert(users).values({ name: 'David Lee', email: 'david@example.com' }).returning();
      console.log("事务中插入用户 David:", userD);

      if (userD) {
        await tx.insert(posts).values({ title: 'David\'s First Post', userId: userD.id });
        console.log("事务中插入 David 的帖子。");
      }

      // 模拟一个错误，这将导致整个事务回滚
      // throw new Error("模拟事务失败");
    });
    console.log("事务成功提交！");
  } catch (error) {
    console.error("事务回滚:", (error as Error).message);
  }

  // 关闭数据库连接
  await closeDbConnection();
}

// 确保在 Node.js 环境下运行
if (require.main === module) {
  // DATABASE_URL 环境变量需要在运行前设置
  // 例如：export DATABASE_URL="postgresql://user:password@host:port/database"
  // 或者在 .env 文件中设置并通过 dotenv 加载
  require('dotenv').config();
  runDrizzleExamples().catch(console.error);
}
```

## 六、数据库迁移 (Drizzle Kit)

Drizzle Kit CLI 工具是 Drizzle ORM 生态系统的重要组成部分，它负责管理数据库模式的演进。

1.  **生成迁移文件**:
    当你修改了 `src/schema.ts` 文件后，运行以下命令会比较当前 Schema 和上次的快照，并生成一个新的迁移文件：
    ```bash
    npx drizzle-kit generate:pg # 或 generate:mysql, generate:sqlite
    ```
    这会在 `drizzle` 目录下创建一个带有时间戳的 `.ts` 文件，其中包含 Drizzle ORM 自动生成的 SQL 语句（如 `CREATE TABLE`, `ALTER TABLE`）。

2.  **应用迁移**:
    在你的应用程序中，你需要编写一个脚本来执行这些生成的迁移文件。
    ```typescript
    // scripts/migrate.ts
    import { migrate } from 'drizzle-orm/postgres-js/migrator';
    import { db, closeDbConnection } from '../src/db';

    async function main() {
      console.log('Running migrations...');
      await migrate(db, { migrationsFolder: './drizzle' }); // 传入 Drizzle 客户端实例和迁移文件目录
      console.log('Migrations finished!');
      await closeDbConnection();
      process.exit(0);
    }

    main().catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
    ```
    然后运行此脚本：
    ```bash
    ts-node scripts/migrate.ts # 或 node scripts/migrate.js (如果已编译)
    ```

3.  **模式推送 (Schema Push)**:
    对于开发环境，如果你想快速同步 Schema 变更而不需要生成迁移文件，可以使用 `push` 命令。它会直接将 Schema 状态推送到数据库（会删除不存在于 Schema 中的表）。**注意：不推荐在生产环境使用。**
    ```bash
    npx drizzle-kit push:pg # 或 push:mysql, push:sqlite
    ```

## 七、Drizzle ORM 的优缺点与适用场景

### 7.1 优点：

1.  **极致的类型安全**：从 Schema 定义到查询结果，全程类型推断和检查，极大减少运行时错误。
2.  **“SQL-like” API**：学习曲线平缓，熟悉 SQL 的开发者可以快速上手，对生成的 SQL 有清晰的认识和控制。
3.  **高性能与轻量**：生成的 SQL 简洁高效，运行时开销极小，是性能敏感应用的理想选择。
4.  **Drizzle Kit CLI 强大**：自动化 Schema 内省和迁移管理，提升开发效率。
5.  **现代化的开发体验**：利用 TypeScript 的优势，提供优秀的自动补全、重构支持。
6.  **多数据库支持**：广泛支持主流关系型数据库。
7.  **异步支持**：原生支持 `async/await`，与现代 JS/TS 生态系统完美融合。

### 7.2 缺点：

1.  **相对新颖**：相较于 TypeORM、Prisma 等成熟 ORM，Drizzle ORM 出现时间较晚，社区规模和生态系统仍在快速成长中。
2.  **非传统 ORM 理念**：不提供 Active Record 模式，操作围绕 SQL 表达式展开，可能不适合偏爱高层抽象和对象模型的开发者。
3.  **缺乏缓存层**：Drizzle ORM 是一个 SQL 查询构建器，它不提供内置的查询缓存或一级/二级缓存，这通常需要开发者自行实现或集成。
4.  **学习某些高级特性**：虽然基础查询 SQL-like，但某些高级表达式（如复杂的 CTE、窗口函数）可能需要时间来适应 Drizzle 的 DSL 语法。

### 7.3 适用场景：

*   **追求类型安全的 TypeScript/JavaScript 应用**：无论是前端 (Next.js server components, Remix) 还是后端 (Node.js, Bun)。
*   **对性能有较高要求，不希望 ORM 引入额外开销的项目**。
*   **偏好 SQL 语法，希望对底层查询有更强控制的开发者**。
*   **微服务架构**：轻量级和高性能的特点使其成为微服务中数据访问层的理想选择。
*   **需要频繁管理数据库模式变更的项目**：Drizzle Kit 的迁移功能非常便捷。

## 八、安全性考虑

使用 Drizzle ORM 开发数据库应用时，虽然 Drizzle 本身在防止某些攻击方面提供了帮助，但开发者仍需关注以下安全实践：

1.  **SQL 注入防护 (由 Drizzle 自动处理)**：
    *   Drizzle ORM 的查询构建器会**自动参数化查询**，这意味着它会将所有动态值作为参数传递给数据库，而不是直接拼接到 SQL 字符串中。这从根本上防止了 SQL 注入攻击。
    *   即使使用 `sql` 模板字面量执行原始 SQL，Drizzle 也支持安全的参数化方式：`sql` `SELECT * FROM users WHERE name = ${userName}`。
2.  **数据库连接字符串安全**：
    *   **绝不**将数据库连接字符串硬编码到代码中。
    *   使用环境变量 (`.env` 文件, 操作系统环境变量) 来存储敏感的连接信息。
    *   在生产环境中，应使用专门的秘密管理服务 (如 AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)。
3.  **输入验证与过滤**：
    *   在将用户输入传递给 Drizzle ORM 查询之前，始终在应用程序层进行严格的**输入验证和清理**。这有助于防止意外的或恶意的数据进入数据库，例如：
        *   检查数据类型、长度、格式。
        *   防止 XSS (Cross-Site Scripting) 攻击 (如果数据最终会显示在前端)。
4.  **最小权限原则**：
    *   为应用程序连接数据库所使用的用户账号，配置**最小必要权限**。例如，如果应用只需要读写特定表，不要赋予其删除整个数据库的权限。
5.  **事务管理**：
    *   对于涉及多个相互依赖的数据库操作，务必使用 Drizzle ORM 提供的**事务** (`db.transaction()`) 来确保数据的一致性和原子性，防止部分操作成功而导致数据不完整。
6.  **错误处理**：
    *   捕获并适当地处理数据库操作可能抛出的错误，避免向用户暴露敏感的数据库错误信息。
7.  **依赖项安全**：
    *   保持 Drizzle ORM 及其数据库驱动 (`pg`, `mysql2`, `better-sqlite3` 等) 更新到最新版本，以获取安全补丁和性能改进。

## 九、总结

Drizzle ORM 凭借其独特的 TypeScript 优先、类型安全和 SQL-like 的设计理念，正在迅速成为现代 JavaScript/TypeScript 数据库开发的有力竞争者。它成功地在 ORM 的易用性和原生 SQL 的控制力之间取得了平衡，同时提供了卓越的性能和开发者体验。对于追求代码质量、类型安全和数据库操作透明度的项目，Drizzle ORM 提供了一个强大而优雅的解决方案。理解并熟练运用其 Schema 定义、SQL 表达式语言以及 Drizzle Kit 工具，将极大地提升你的数据层开发效率和应用健壮性。