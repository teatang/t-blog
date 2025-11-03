---
title: Drizzle ORM 详解
date: 2025-06-23 06:24:00
tags:
  - 2025
  - 前端技术
  - ORM
categories:
  - 前端技术
  - Web
---

> **Drizzle ORM** 是一款为 TypeScript 开发者设计的现代、类型安全、轻量级的 ORM (Object-Relational Mapper)。它旨在提供一种接近 SQL 的开发体验，同时利用 TypeScript 的强大类型推断能力，在编译时捕获数据库相关的错误，极大地提升了开发效率和代码的健壮性。Drizzle ORM 不像传统 ORM 那样抽象化所有 SQL，而是拥抱 SQL，提供了一个类型安全的 SQL 查询构建器。

{% note info %}
核心思想：**Drizzle ORM 是一个为 TypeScript 量身定制的、类型安全的 SQL 查询构建器，它不试图完全隐藏 SQL，而是以编程的方式构造 SQL，并利用 TypeScript 的强大类型推断能力，在编译时提供极致的类型安全，从而减少运行时错误并提升开发体验。**
{% endnote %}
------

## 一、为什么选择 Drizzle ORM？

传统的 ORM，如 TypeORM 或 Sequelize，通常采用 ActiveRecord 或 DataMapper 模式，旨在将数据库操作完全对象化，有时会过度封装 SQL，导致：

1.  **性能问题**：过度封装可能生成非优化的 SQL。
2.  **学习曲线**：需要学习一套复杂的 ORM API，而不是 SQL 本身。
3.  **类型安全挑战**：在复杂查询中，类型推断可能不尽如人意，导致运行时类型错误。

Drizzle ORM 旨在解决这些痛点，提供一种更现代的解决方案：

*   **极致的类型安全 (TypeScript-First)**：Drizzle 在编译时就能推断出查询结果的精确类型，包括 JOIN 后的复杂类型，极大地减少了运行时错误。
*   **接近 SQL 的体验 (SQL-like API)**：它的 API 设计非常接近 SQL 语法，开发者可以直接将 SQL 思维映射到 Drizzle 代码中，学习成本较低。
*   **轻量级和高性能**：生成简洁高效的 SQL，避免不必要的抽象和运行时开销。
*   **多数据库支持**：支持 PostgreSQL (Neon, Vercel Postgres, Supabase, AWS RDS, etc.), MySQL (PlanetScale, AWS RDS, etc.), SQLite (Turso, libSQL, etc.)。
*   **适配各种驱动**：不绑定特定的数据库驱动，可以与 `pg`, `mysql2`, `@libsql/client`, `better-sqlite3` 等多种驱动程序配合使用。
*   **集成 ORM 功能**：除了查询构建器，还提供 Schema 定义、关系管理 (Relations)、迁移工具 (Migrations)、SQL 扩展等功能。

## 二、核心概念

### 2.1 Schema 定义

Drizzle ORM 允许你使用 TypeScript 来定义数据库 Schema。这通常通过导入 Drizzle 提供的函数（如 `pgTable`, `varchar`, `integer` 等）来完成。

**示例：PostgreSQL Schema 定义 (`schema.ts`)**

```typescript
import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

// 定义用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(), // 序列类型，主键
  name: varchar('name', { length: 256 }).notNull(), // 字符串类型，最大长度256，非空
  email: varchar('name', { length: 256 }).unique().notNull(), // 唯一邮箱
  createdAt: timestamp('created_at').defaultNow().notNull(), // 时间戳，默认当前时间，非空
  isActive: boolean('is_active').default(true), // 布尔类型，默认true
});

// 定义文章表，并与用户表建立关系
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  content: varchar('content'),
  authorId: serial('author_id').references(() => users.id).notNull(), // 外键引用 users.id
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 类型推断：自动生成 TypeScript 类型
export type User = typeof users.$inferSelect; // 选中的类型
export type NewUser = typeof users.$inferInsert; // 插入的类型
```

### 2.2 数据库连接与初始化 Drizzle 客户端

Drizzle ORM 不直接处理数据库连接，而是依赖底层的数据库驱动。你需要先初始化驱动，然后将驱动实例传递给 Drizzle。

**示例：使用 `node-postgres` 驱动 (PostgreSQL)**

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; // 导入你的 Schema

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 初始化 Drizzle DB 客户端
export const db = drizzle(pool, { schema }); // 传入 schema，以便 Drizzle 进行类型推断
```

### 2.3 查询构建器 (Query Builder)

Drizzle 的核心是其类型安全的 SQL 查询构建器。它提供了类似于 SQL 的 `select`, `insert`, `update`, `delete`, `where`, `join` 等方法。

#### 2.3.1 Select 查询

```typescript
import { eq, and, like } from 'drizzle-orm';
import { db, users, posts } from './db'; // 假设 db 已初始化

async function getUsers() {
  // 查询所有用户
  const allUsers = await db.select().from(users);
  console.log(allUsers); // 类型: User[]

  // 查询特定用户
  const john = await db.select().from(users).where(eq(users.name, 'John Doe'));
  console.log(john); // 类型: User[]

  // 查询特定字段
  const userNames = await db.select({ id: users.id, name: users.name }).from(users);
  console.log(userNames); // 类型: { id: number; name: string; }[]

  // 复杂条件查询
  const activeUsers = await db.select().from(users)
    .where(and(eq(users.isActive, true), like(users.email, '%@example.com')));
  console.log(activeUsers); // 类型: User[]
}
```

#### 2.3.2 Insert 插入

```typescript
import { db, users } from './db';

async function createUser(name: string, email: string) {
  const newUser = await db.insert(users).values({ name, email }).returning(); // .returning() 返回插入的行
  console.log('New user created:', newUser); // 类型: User[]
  return newUser[0];
}
```

#### 2.3.3 Update 更新

```typescript
import { eq } from 'drizzle-orm';
import { db, users } from './db';

async function updateUserName(userId: number, newName: string) {
  const updatedUser = await db.update(users)
    .set({ name: newName })
    .where(eq(users.id, userId))
    .returning(); // 返回更新后的行
  console.log('User updated:', updatedUser);
  return updatedUser[0];
}
```

#### 2.3.4 Delete 删除

```typescript
import { eq } from 'drizzle-orm';
import { db, users } from './db';

async function deleteUser(userId: number) {
  const deletedUser = await db.delete(users)
    .where(eq(users.id, userId))
    .returning(); // 返回删除的行
  console.log('User deleted:', deletedUser);
  return deletedUser[0];
}
```

### 2.4 关系查询 (Relations)

Drizzle ORM 支持定义表之间的关系（一对一、一对多、多对多），并在查询时方便地加载关联数据。

**在 Schema 中定义关系 (`schema.ts`)**

```typescript
import { pgTable, serial, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm'; // 导入 relations

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  content: varchar('content'),
  authorId: serial('author_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 定义用户和文章的关系
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts), // 一个用户可以有多篇文章
}));

// 定义文章和用户的关系
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }), // 一篇文章只有一个作者
}));
```

**进行关系查询**

```typescript
import { db, users, posts } from './db'; // 确保 db 是通过 drizzle(pool, { schema }) 初始化的

async function getUserWithPosts(userId: number) {
  // 使用 .findMany() 或 .findFirst() 搭配 .with() 来加载关系数据
  const userWithPosts = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      posts: true, // 加载该用户的所有文章
    },
  });
  console.log(userWithPosts);
  /*
  类型: {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
    isActive: boolean;
    posts: {
      id: number;
      title: string;
      content: string | null;
      authorId: number;
      createdAt: Date;
    }[];
  } | undefined
  */

  // 嵌套关系加载
  const postWithAuthor = await db.query.posts.findFirst({
    where: eq(posts.id, 1),
    with: {
      author: true, // 加载文章的作者信息
    },
  });
  console.log(postWithAuthor);
  /*
  类型: {
    id: number;
    title: string;
    content: string | null;
    authorId: number;
    createdAt: Date;
    author: { // author 的类型就是 User
      id: number;
      name: string;
      email: string;
      createdAt: Date;
      isActive: boolean;
    };
  } | undefined
  */
}
```

### 2.5 数据库迁移 (Migrations)

Drizzle ORM 提供了一个命令行工具 `drizzle-kit` 来生成和管理数据库迁移。

1.  **安装 `drizzle-kit`**：
    ```bash
    npm install drizzle-kit --save-dev
    ```
2.  **配置 `drizzle.config.ts`**：
    ```typescript
    import type { Config } from 'drizzle-kit';

    export default {
      schema: './src/db/schema.ts', // 你的 schema 文件路径
      out: './drizzle',             // 生成迁移文件的目录
      driver: 'pg',                 // 数据库驱动，根据你的数据库选择 'pg', 'mysql', 'sqlite'
      dbCredentials: {
        connectionString: process.env.DATABASE_URL!, // 你的数据库连接字符串
      },
    } satisfies Config;
    ```
3.  **生成迁移文件**：
    当你修改了 `schema.ts` 文件后，运行：
    ```bash
    drizzle-kit generate:pg # 根据 driver 选择对应的命令，如 generate:mysql, generate:sqlite
    ```
    这会在 `drizzle` 目录下生成一个包含 SQL 语句的迁移文件。
4.  **执行迁移**：
    你需要编写一个脚本来执行这些生成的 SQL 迁移文件。

    **示例迁移脚本 (`src/db/migrate.ts`)：**
    ```typescript
    import { migrate } from 'drizzle-orm/node-postgres/migrator';
    import { db, pool } from './db'; // 导入你的 Drizzle 客户端和连接池

    async function runMigrations() {
      console.log('Running migrations...');
      await migrate(db, { migrationsFolder: './drizzle' }); // migrationsFolder 必须和 drizzle.config.ts 中的 out 一致
      console.log('Migrations complete!');
      await pool.end(); // 关闭数据库连接
    }

    runMigrations().catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
    ```
    然后运行此脚本：
    ```bash
    ts-node src/db/migrate.ts # 或者编译后运行 js 文件
    ```

## 三、与其他 ORM 的比较

*   **与 TypeORM/Sequelize 比较**：
    *   **Drizzle ORM** 更加轻量，更接近 SQL，类型安全是其核心卖点，对 TypeScript 开发者更友好。它不会过度抽象 SQL，而是提供一个类型安全的查询构建器。
    *   **TypeORM/Sequelize** 提供了更完整的对象关系映射，例如自动生成实体类、Repository 模式等。它们可能在学习曲线和性能上不如 Drizzle，但在某些情况下提供了更高层次的抽象。

*   **与 Prisma 比较**：
    *   **Drizzle ORM** 允许你用 TypeScript 直接定义 Schema，并完全控制 SQL 生成。它更强调“类型安全的 SQL 查询构建器”。
    *   **Prisma** 有自己的 Schema 定义语言 (`.prisma` 文件)，并通过 `prisma generate` 生成客户端。它提供了一个非常强大的类型安全客户端和一套完整的工具链（包括数据库迁移）。Prisma 的抽象层次更高，隐藏了更多 SQL 细节。

**总结**：如果你希望在 TypeScript 中拥有极致的类型安全，同时又想保持对 SQL 的控制，并且喜欢 SQL 的查询风格，那么 Drizzle ORM 是一个非常出色的选择。

## 四、总结与最佳实践

Drizzle ORM 是一款为 TypeScript 时代量身打造的现代 ORM。它通过提供类型安全的 SQL 查询构建器，让开发者能够以更少的运行时错误、更高的开发效率和更接近 SQL 的直觉来操作数据库。

**最佳实践：**

1.  **始终使用 TypeScript**：Drizzle 的最大优势在于其类型推断，务必在 TypeScript 项目中使用。
2.  **利用 Schema 定义**：清晰地定义你的数据库 Schema，并利用 `relations` 来管理表之间的关联。
3.  **使用 `drizzle-kit` 进行迁移**：规范化数据库变更流程，确保开发环境和生产环境的 Schema 一致。
4.  **结合 `var()` 和 `sql` 模板字面量**：对于 Drizzle 暂时不支持的复杂 SQL 语句，可以使用 `sql` 模板字面量直接写入原始 SQL，同时 Drizzle 仍然可以进行类型检查。
5.  **理解底层驱动**：Drizzle ORM 并非完全的抽象层，理解你所使用的数据库驱动（如 `pg`）的工作原理，有助于更好地调试和优化。

通过 Drizzle ORM，开发者可以在享受现代 JavaScript 生态系统带来的便利的同时，获得传统 SQL 带来的性能和灵活性。