---
title: MySQL EXPLAIN 详解
date: 2023-06-01 06:24:00
tags: 
    - 2023
    - MySQL
    - 中间件
categories:
  - 中间件
  - MySQL
---

> `EXPLAIN` 是 MySQL 提供的一个非常强大的工具，用于分析 `SELECT` 语句的执行计划。通过 `EXPLAIN` 的输出结果，我们可以了解查询是如何执行的，包括使用了哪些索引、扫描了多少行、是否进行了文件排序等信息。这是数据库性能调优不可或缺的一环，能够帮助我们发现SQL语句中的性能瓶颈并进行优化。

{% note info %}
“优化前，先 `EXPLAIN`。没有 `EXPLAIN` 的优化都是盲人摸象。” - 数据库优化格言
{% endnote %}

## 一、什么是 EXPLAIN？

`EXPLAIN` 命令实际上是用来获取 MySQL 执行查询语句的执行计划的。执行计划描述了 MySQL 如何处理 `SQL` 语句，包括：

*   表的连接顺序
*   每个表使用的索引
*   是否使用了临时表
*   是否进行了文件排序
*   扫描的行数预估

通过分析这些信息，我们可以判断查询是否高效，是否可以进一步优化。

## 二、如何使用 EXPLAIN？

使用 `EXPLAIN` 非常简单，只需将 `EXPLAIN` 关键字放在任何 `SELECT` 语句的前面。

```sql
EXPLAIN SELECT * FROM users WHERE username = 'Alice';
EXPLAIN SELECT u.username, o.order_id
FROM users u JOIN orders o ON u.id = o.user_id
WHERE u.status = 1;
```

执行后，结果会以表格的形式展示，每行代表一个表或一个操作。

## 三、EXPLAIN 输出格式解读

`EXPLAIN` 命令的输出结果通常包含以下列（不同版本或配置可能略有差异）：

| 列名        | 描述                                                           | 关键关注点                                          |
| :---------- | :------------------------------------------------------------- | :-------------------------------------------------- |
| `id`        | SELECT 查询的编号，表示查询中每个 `SELECT` 语句的序号。       | 越大越优先执行，相同 ID 从上往下执行。               |
| `select_type` | SELECT 查询的类型。                                       | `SIMPLE`, `PRIMARY`, `SUBQUERY`, `UNION` 等。          |
| `table`     | 查询涉及的表名。                                               | 关系到数据的来源。                                  |
| `partitions` | 匹配到的分区信息 (MySQL 5.6+), 对于未分区表显示 NULL。        | 如果是分区表，查看是否正确选择分区。                   |
| `type`      | 连接类型/访问类型，非常重要，显示查询如何从表中查找行。 | `ALL` (全表扫描) 最差，`index`, `range`, `ref`, `eq_ref`, `const` 较好。 |
| `possible_keys` | 可能使用的索引列表。                                          | 供优化器选择的索引。                                |
| `key`       | 实际使用的索引。                                          | 优化器最终选择的索引。                               |
| `key_len`   | 实际使用的索引长度（字节）。                                    | 越短越好，看是否完全使用了联合索引。                 |
| `ref`       | 显示索引的哪一列被用作查找依据。                                | 常量、其他表的列、函数等。                          |
| `rows`      | MySQL 估计要扫描的行数。                                  | 越小越好，直接影响查询性能。                        |
| `filtered`  | MySQL 估计将通过条件过滤的表行的百分比 (MySQL 5.7+)。          | 过滤率越高，说明通过索引过滤的数据越多。              |
| `Extra`     | 额外信息，包含许多重要的执行细节。                       | `Using filesort`, `Using temporary`, `Using index` (覆盖索引) 等，非常关键。 |

接下来，我们详细解读其中几个最重要的列：

### 1. `id` (SELECT Query ID)

*   同一组的查询，`id` 相同。ID 越大，执行优先级越高。
*   并发执行的查询，`id` 可能相同。
*   如果存在子查询等嵌套查询，`id` 会不同。
    *   `id` 最大的语句块最先执行。
    *   如果 `id` 相同，则从上往下依次执行。

示例：
```sql
EXPLAIN SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);
-- id=2 (子查询) 会比 id=1 (外层查询) 先执行
```

### 2. `select_type` (Query Type)

表示每个 `SELECT` 语句的类型。常见的有：

*   `SIMPLE`: 简单的 `SELECT` 查询，不包含 `UNION` 或子查询。
*   `PRIMARY`: 最外层 `SELECT` 查询 (如果包含子查询)。
*   `SUBQUERY`: 子查询中的第一个 `SELECT` 查询。
*   `DEPENDENT SUBQUERY`: 依赖于外部查询的子查询。
*   `UNION`: `UNION` 中的第二个或后续 `SELECT` 查询。
*   `DEPENDENT UNION`: 依赖于外部查询的 `UNION` 中的第二个或后续 `SELECT` 查询。
*   `UNION RESULT`: `UNION` 查询的结果集。
*   `DERIVED`: 用于代表派生表（`FROM` 子句中的子查询）。
*   `MATERIALIZED`: 已经物化（创建了临时表）的子查询（MySQL 5.6+）。

### 3. `table` (Table Name)

当前操作的表名。如果是派生表或 `UNION` 结果，会显示为 `<derivedN>` 或 `<unionM,N>`。

### 4. `type` (Access Type) - 最重要的列之一

这是判断查询性能的最关键指标之一，显示 MySQL 如何从表中查找行。从最好到最差的连接类型：

*   `system`: 表只有一行记录（系统表），这是 `const` 类型的一个特例。
*   `const`: 通过主键或唯一索引查找，结果只有一行。非常快，因为只读一次。
    *   `EXPLAIN SELECT * FROM users WHERE id = 1;`
*   `eq_ref`: 对于每个来自先前的表的行，从当前表中读取一行。通常在连接操作中使用主键或唯一索引时发生。
    *   `EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE o.order_id = 1;`
*   `ref`: 非唯一性索引扫描，返回匹配某个单独值的多行。
    *   `EXPLAIN SELECT * FROM users WHERE status = 1;` (status 列有索引且值不唯一)
*   `range`: 范围扫描，适用于 `WHERE` 子句中使用 `<`、`>`、`BETWEEN`、`IN` 等操作符。
    *   `EXPLAIN SELECT * FROM users WHERE id BETWEEN 1 AND 10;`
*   `index`: 全索引扫描，扫描整个索引树，但由于不读取数据行，比 `ALL` 快（如果索引小于数据）。
    *   `EXPLAIN SELECT username FROM users ORDER BY username;` (如果 `username` 有索引)
*   `ALL`: 全表扫描，最差的访问类型。如果 `Extra` 列没有 `Using where`，那可能是在全表扫描后直接返回所有数据。如果 `Extra` 列有 `Using where`，那表示全表扫描后进行条件过滤。我们应该尽量避免。
    *   `EXPLAIN SELECT * FROM users WHERE address LIKE '%street%';` (address 列没有索引)

优化目标： 尽量将 `type` 优化到 `ref`、`eq_ref`、`const` 或 `system` 等，`range` 也是可以接受的。避免 `ALL`。

### 5. `possible_keys` (Possible Keys)

表示 MySQL 在当前查询中可能选择的索引列表。这只是一个候选列表，优化器最终可能不选择其中任何一个。

### 6. `key` (Chosen Key) - 也很重要

优化器最终决定实际使用的索引。

*   如果为 `NULL`，表示没有使用索引。
*   如果 `key` 显示的索引不在 `possible_keys` 中，说明 `possible_keys` 有误，或者 `key` 是通过隐式优化生成的（如自适应哈希索引）。

### 7. `key_len` (Key Length)

表示实际使用的索引的长度（字节数）。

*   对于联合索引，`key_len` 可以帮你判断索引被用到了多少列。
*   如果是一个 `VARCHAR(100) CHARACTER SET utf8mb4` 的列，其 `key_len` 会根据编码和是否允许 `NULL` 有所不同。
*   `key_len` 越小，说明索引用到的字段越少，或者字段的类型本身占用空间小。在保证索引效率的前提下，通常希望 `key_len` 尽可能小。

### 8. `ref` (Reference)

显示索引的哪一列或常量被用作查找索引的参考。

*   `const`: 表示与一个常量进行比较。
*   `func`: 表示与表达式或函数的结果进行比较。
*   `db.tbl.col_name`: 表示与前一个表的某个列进行比较 (在连接查询中)。

### 9. `rows` (Estimated Rows) - 非常重要

MySQL 估计为了找到所需的行而需要读取的行数。这是一个非常重要的指标，值越小越好。它直接反映了查询的效率。

即使 `type` 看起来不错，如果 `rows` 很大，也需要警惕。

### 10. `filtered` (Filtered Percentage) - (MySQL 5.7+ 常用)

通过条件过滤后的表行的百分比。

*   `filtered` 的值越高（越接近100%），表示通过索引或 WHERE 条件过滤掉的数据越多，越高效。
*   例如，`rows` 是 1000，`filtered` 是 10%，表示 MySQL 认为从这个表里取出 1000 行，经过 WHERE 过滤后，只有 100 行会传给上层。

### 11. `Extra` (Extra Information) - 最重要的列之一

包含不适合在其他列中显示但对查询优化非常重要的额外信息。以下是一些常见的 `Extra` 值及其含义：

*   `Using index`: 覆盖索引（Covering Index）。表示查询所需的所有数据都可以在索引中找到，而不需要回表查询数据行。这是非常高效的查询，值得追求。
*   `Using where`: 表明 `WHERE` 子句被用来限制哪些行与下一个表匹配，或者发送给客户端。如果 `type` 是 `ALL` 且 `Extra` 有 `Using where`，则表示在全表扫描后进行了过滤。
*   `Using filesort`: 文件排序。当查询需要对结果进行排序，但无法使用索引来完成排序时，MySQL 会在内存或磁盘上进行排序。这通常会导致性能问题，尤其是在大数据量时。应尽量避免。
    *   优化方法：为 `ORDER BY` 子句的列创建索引。
*   `Using temporary`: 使用临时表。通常发生在 `GROUP BY` 或 `ORDER BY` 子句无法使用索引优化时，或者多次 `UNION` 查询时。这也会导致性能问题，应尽量避免。
    *   优化方法：考虑优化 `GROUP BY` 或 `UNION` 语句，或增加内存。
*   `Using join buffer (Block Nested Loop)`: 当两个表连接时，如果连接条件没有索引或者无法使用索引，MySQL 可能会使用连接缓冲区来处理。
*   `Using index condition`: 索引条件下推 (Index Condition Pushdown, ICP) (MySQL 5.6+)。在存储引擎层进行数据过滤，而不是在服务器层。这可以减少存储引擎返回给服务器层的行数，提高效率。
    *   例如，对于 `idx(A, B)`，查询 `WHERE A > 10 AND B < 20`，ICP 允许在遍历索引时就根据 `B < 20` 条件进行过滤，而不是将所有 `A > 10` 的行都取出来再过滤。
*   `Using MRR`: 多范围读取 (Multi-Range Read) (MySQL 5.6+)。当访问非聚集索引来获取数据时，MRR 可以将随机 I/O 转换为顺序 I/O，提高效率。
*   `Backward index scan`: 反向索引扫描 (MySQL 8.0+)。查询以相反的顺序（降序）遍历索引，避免了额外的文件排序。

## 四、EXPLAIN 的限制

*   `EXPLAIN` 只能解释 `SELECT` 语句，不能解释 `INSERT`、`UPDATE`、`DELETE`。但可以通过将 `UPDATE/DELETE` 的 `WHERE` 子句提炼成 `SELECT` 语句进行分析。
*   `EXPLAIN` 提供的是查询优化器估算的执行计划，在某些复杂查询或数据分布极端的情况下，实际执行计划可能与 `EXPLAIN` 有细微差异。
*   当涉及到存储过程、触发器或用户自定义函数时，`EXPLAIN` 可能无法提供完整的执行计划信息。

## 五、实际案例分析

场景：用户表 `users` (id, username, email, status, create_time)，订单表 `orders` (order_id, user_id, amount, create_time)。

### 案例 1: 无索引全表扫描

```sql
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```
| id | select_type | table | partitions | type | possible_keys | key | key_len | ref | rows | filtered | Extra       |
| -- | ----------- | ----- | ---------- | ---- | ------------- | --- | ------- | --- | ---- | -------- | ----------- |
| 1  | SIMPLE      | users | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 10000 | 10.00    | Using where |

分析:
*   `type: ALL` -> 全表扫描，性能极差。
*   `possible_keys: NULL`, `key: NULL` -> 没有使用任何索引。
*   `rows: 10000` -> 估计扫描 10000 行。
*   `Extra: Using where` -> 全表扫描后在服务器层进行条件过滤。

优化: 为 `email` 列添加索引 `CREATE INDEX idx_email ON users (email);`

### 案例 2: 使用普通索引

```sql
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```
| id | select_type | table | partitions | type | possible_keys | key       | key_len | ref    | rows | filtered | Extra |
| -- | ----------- | ----- | ---------- | ---- | ------------- | --------- | ------- | ------ | ---- | -------- | ----- |
| 1  | SIMPLE      | users | NULL       | ref  | idx_email     | idx_email | 302     | const  | 1    | 100.00   | NULL  |

分析:
*   `type: ref` -> 这是一个良好的访问类型，表示通过非唯一索引查找。
*   `key: idx_email` -> 成功使用了 `email` 索引。
*   `rows: 1` -> 估计只扫描 1 行，效率极高。
*   `Extra: NULL` -> 没有额外的开销。
*   `key_len: 302` -> `VARCHAR(100)` 的索引长度（UTF8MB4 编码下，每个字符最多占 4 字节 + 2 字节长度前缀 + 1 字节 NULL 标识 = 4*100 + 2 + 1 = 403 字节，这里是 302，说明它可能只索引了部分长度或者编码不同）。

### 案例 3: 使用覆盖索引

```sql
EXPLAIN SELECT email FROM users WHERE email = 'test@example.com';
```
| id | select_type | table | partitions | type | possible_keys | key       | key_len | ref    | rows | filtered | Extra         |
| -- | ----------- | ----- | ---------- | ---- | ------------- | --------- | ------- | ------ | ---- | -------- | ------------- |
| 1  | SIMPLE      | users | NULL       | ref  | idx_email     | idx_email | 302     | const  | 1    | 100.00   | Using index   |

分析:
*   `Extra: Using index` -> 覆盖索引！ 查询的所有列（`email`）都可以在 `idx_email` 索引中获取，不需要回表查询数据行，效率最高。

### 案例 4: 包含排序的文件排序

```sql
EXPLAIN SELECT * FROM users ORDER BY create_time DESC;
```
| id | select_type | table | partitions | type | possible_keys | key | key_len | ref | rows | filtered | Extra          |
| -- | ----------- | ----- | ---------- | ---- | ------------- | --- | ------- | --- | ---- | -------- | -------------- |
| 1  | SIMPLE      | users | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 10000 | 100.00   | Using filesort |

分析:
*   `type: ALL` -> 全表扫描。
*   `Extra: Using filesort` -> 进行了文件排序，性能代价高。

优化: 为 `create_time` 列添加索引 `CREATE INDEX idx_create_time ON users (create_time);`

```sql
EXPLAIN SELECT * FROM users ORDER BY create_time DESC;
```
| id | select_type | table | partitions | type  | possible_keys   | key           | key_len | ref  | rows | filtered | Extra             |
| -- | ----------- | ----- | ---------- | ----- | --------------- | ------------- | ------- | ---- | -------- | -------- | ----------------- |
| 1  | SIMPLE      | users | NULL       | index | idx_create_time | idx_create_time | 5       | NULL | 10000 | 100.00   | Backward index scan (MySQL 8.0+) 或 NULL (旧版本) |

分析:
*   `type: index` -> 全索引扫描，比全表扫描好。
*   `Extra: Backward index scan` (MySQL 8.0+) 或 `NULL` (旧版本) -> 说明利用索引进行排序，避免了文件排序。

## 六、总结

`EXPLAIN` 是 MySQL 性能调优的基石。掌握其输出结果的含义，并结合索引的知识进行分析，能够帮助我们：

1.  识别潜在的慢查询：特别是 `type: ALL` 和 `Extra` 中包含 `Using filesort` 或 `Using temporary` 的查询。
2.  验证索引的有效性：查看 `key` 字段是否使用了预期索引。
3.  优化索引设计和 SQL 语句：根据分析结果调整索引、重写 `WHERE` 或 `JOIN` 条件。

记住，性能优化是一个持续的过程，`EXPLAIN` 是你在这个过程中最得力的助手。