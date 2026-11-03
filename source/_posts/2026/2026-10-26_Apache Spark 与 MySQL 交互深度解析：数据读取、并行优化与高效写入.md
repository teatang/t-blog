---
title: Apache Spark 与 MySQL 交互深度解析：数据读取、并行优化与高效写入
date: 2026-10-26 06:24:00
tags:
  - 2026
  - Java
  - Scala
  - 程序设计
  - 编码规范
  - 分布式系统
  - MySQL
categories:
  - Java
  - Scala
mathjax: true
---

> 在大数据架构中，关系型数据库（RDBMS）与分布式计算引擎之间的互联互通是构建数据湖仓集市的关键环节。Apache Spark 提供了专用的 **JDBC 数据源接口**，能够将 MySQL 表无缝映射为分布式 `DataFrame`。然而，单节点关系型数据库与分布式计算引擎在吞吐能力与并发模型上存在天然断层。如果不合理配置并行度、分区边界与下推策略，极易引发 **单 Task 内存溢出、MySQL 连接池被打垮、长尾慢查询** 等严重问题。

{% note info %}
**核心考量维度：**
*   **读取瓶颈破解：** 默认配置下 Spark 仅使用**单个 Task** 单线程拉取全量 MySQL 表；必须通过配置**分区字段（Partition Column）**与上下界边界参数，触发分布式并行多管道读取。
*   **计算边界下推：** 依托 Catalyst 优化器将 `WHERE` 谓词下推（Predicate Pushdown）至 MySQL 执行，减少过网数据体量。
*   **高并发写入安全：** 控制写入并发度（`coalesce`/`repartition`）、配置批处理提交（`batchsize`）以及解决主键冲突（如 `ON DUPLICATE KEY UPDATE`）。
{% endnote %}

------

## 一、Spark 连接 MySQL 体系架构与交互机理

Spark 与 MySQL 的交互基于标准的 JDBC 驱动。数据读取与写出在物理层面的流转模型如下图所示：

{% mermaid %}
graph TB
    subgraph Spark_Driver
        D["Driver 进程"] -->|1. 元数据探测: 读表结构 Schema| MySQL[("MySQL Server")]
        D -->|2. 依据界限计算步长，生成 N 个 Task| Execs["Task 切分计划"]
    end

    subgraph Spark_Executors_Parallel_Read
        T1["Executor Task 0<br/>WHERE id &gt;= 1 AND id &lt; 250000"] -->|JDBC Connection 1| MySQL
        T2["Executor Task 1<br/>WHERE id &gt;= 250000 AND id &lt; 500000"] -->|JDBC Connection 2| MySQL
        T3["Executor Task 2<br/>WHERE id &gt;= 500000 AND id &lt; 750000"] -->|JDBC Connection 3| MySQL
        T4["Executor Task 3<br/>WHERE id &gt;= 750000 AND id &lt;= 1000000"] -->|JDBC Connection 4| MySQL
    end

    Execs -.-> T1
    Execs -.-> T2
    Execs -.-> T3
    Execs -.-> T4

    style D fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#f0f9ff
    style MySQL fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#fff7ed
    style Execs fill:#1e293b,stroke:#334155,stroke-width:1.5px,color:#e2e8f0

    style T1 fill:#064e3b,stroke:#34d399,stroke-width:1.5px,color:#ecfdf5
    style T2 fill:#064e3b,stroke:#34d399,stroke-width:1.5px,color:#ecfdf5
    style T3 fill:#064e3b,stroke:#34d399,stroke-width:1.5px,color:#ecfdf5
    style T4 fill:#064e3b,stroke:#34d399,stroke-width:1.5px,color:#ecfdf5

    style Spark_Driver fill:#111827,stroke:#374151,stroke-width:1.5px,color:#94a3b8
    style Spark_Executors_Parallel_Read fill:#111827,stroke:#374151,stroke-width:1.5px,color:#94a3b8
{% endmermaid %}

### 1.1 分区切分数学模型
当在 Spark 中指定基于数字型主键/索引列进行并行切分读取时，Spark 会根据以下公式为每个 Task 生成独立的 SQL 范围查询语句：

设指定的分区数为 $P$，下界为 $L$（`lowerBound`），上界为 $U$（`upperBound`），则步长（Stride）为：

$$\text{Stride} = \left\lceil \frac{U - L}{P} \right\rceil$$

对于第 $i$ 个 Task（$0 \le i < P$）：
*   **首个 Task ($i = 0$)：** `WHERE partitionColumn < L + Stride`（兜底小于下界的数据）
*   **中间 Task ($0 < i < P - 1$)：** `WHERE partitionColumn >= L + i * Stride AND partitionColumn < L + (i + 1) * Stride`
*   **尾部 Task ($i = P - 1$)：** `WHERE partitionColumn >= L + (P - 1) * Stride`（兜底大于上界的数据）

{% note warning %}
**边界陷阱：** `lowerBound` 与 `upperBound` **并不是**用于过滤数据的过滤条件！它们仅用于计算划分步长。如果表中实际存在大于 `upperBound` 或小于 `lowerBound` 的记录，它们依然会被首尾两个 Task 全部扫描，且容易造成首尾 Task 数据严重倾斜。
{% endnote %}

---

## 二、从 MySQL 读取数据

### 2.1 依赖引入 (SBT / Maven)
使用 Spark 读取 MySQL 前，需在项目中引入官方的 MySQL Connector/J 依赖：

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
```

### 2.2 生产级多并发切分读取配置

在生产环境中，严禁直接使用无参数配置读取千万级宽表。以下展示完整的并行化读取示例：

```scala
package com.example.spark.mysql

import java.util.Properties
import org.apache.spark.sql.{DataFrame, SparkSession}

object MySQLParallelReadDemo {
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder()
      .appName("Spark-MySQL-Parallel-Read")
      .master("local[*]")
      .getOrCreate()

    // 1. 基础连接属性配置
    val jdbcUrl = "jdbc:mysql://10.0.0.10:3306/trade_db?useSSL=false&serverTimezone=UTC&rewriteBatchedStatements=true"
    val tableName = "trade_orders"

    // 2. 高效并行读取核心参数
    val df: DataFrame = spark.read.format("jdbc")
      .option("url", jdbcUrl)
      .option("dbtable", tableName)
      .option("user", "data_reader")
      .option("password", "SecurePass123!")
      .option("driver", "com.mysql.cj.jdbc.Driver")
      // 并行切片核心参数
      .option("partitionColumn", "id")     // 必须为整型/时间戳字段，建议是单调递增的主键或索引
      .option("lowerBound", "1")           // 分区下边界
      .option("upperBound", "10000000")    // 分区上边界 (例如 1000 万条)
      .option("numPartitions", "20")       // 启动 20 个 Task 并行拉取
      // 避免单条长查询超时与单次 Fetch 内存溢出
      .option("fetchsize", "10000")
      .load()

    // 3. 打印生成物理计划，验证分区情况
    println(s"当前读取生成的分区数量: ${df.rdd.getNumPartitions}")
  
    // 验证谓词下推
    val filteredDF = df.filter("order_status = 'PAID' AND create_time >= '2024-01-01'")
    filteredDF.explain(extended = true)

    spark.stop()
  }
}
```

### 2.3 任意复杂查询下推（使用 `dbtable` 子查询）

如果 MySQL 中表结构庞大，且只需抽取聚合结果或经过多表 Join 后的视图，可以直接将**子查询（Subquery）**包裹在 `dbtable` 中执行，将算力压到 MySQL 引擎上：

```scala
// 注意：子查询必须显式赋予别名（如 AS sub_tbl），否则 MySQL 解析语法报错
val pushdownQuery =
  """(
    |  SELECT 
    |    user_id, 
    |    COUNT(order_id) AS total_orders, 
    |    SUM(payment_amount) AS total_spend
    |  FROM trade_orders
    |  WHERE create_time >= '2024-01-01'
    |  GROUP BY user_id
    |) AS sub_tbl""".stripMargin

val aggregatedDF = spark.read.format("jdbc")
  .option("url", jdbcUrl)
  .option("dbtable", pushdownQuery)
  .option("user", "data_reader")
  .option("password", "SecurePass123!")
  .option("driver", "com.mysql.cj.jdbc.Driver")
  .load()
```

---

## 三、Spark 处理 MySQL 数据（DSL 与 SQL 混合分析）

从 MySQL 加载的数据在 Spark 内部即为标准 `DataFrame`，可以无缝使用所有的算子与 SQL 进行高并发清洗、聚合及窗口分析。

```scala
package com.example.spark.mysql

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.expressions.Window
import org.apache.spark.sql.functions._

object DataProcessingPipeline {
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder()
      .appName("Process-MySQL-Data")
      .master("local[*]")
      .getOrCreate()

    import spark.implicits._

    // 假设已从 MySQL 读取到 ordersDF
    val ordersDF = spark.read.format("jdbc")
      .option("url", "jdbc:mysql://localhost:3306/trade_db")
      .option("dbtable", "trade_orders")
      .option("user", "root")
      .option("password", "root")
      .load()

    // 1. 数据清洗与格式标准化
    val cleanDF = ordersDF
      .filter($"payment_amount".isNotNull && $"payment_amount" > 0)
      .withColumn("order_date", to_date($"create_time"))

    // 2. 窗口分析：计算每个用户每笔订单在其历史消费中的累计金额与排名
    val userWindow = Window.partitionBy("user_id").orderBy("create_time")

    val analyzedDF = cleanDF
      .withColumn("user_order_seq", row_number().over(userWindow))
      .withColumn("user_cumulative_spend", sum($"payment_amount").over(userWindow))

    // 3. 注册临时表进行纯 SQL 查询
    analyzedDF.createOrReplaceTempView("v_user_orders")

    val finalMetrics = spark.sql(
      """
        |SELECT 
        |  user_id,
        |  MAX(user_cumulative_spend) AS lifetime_spend,
        |  COUNT(1) AS total_order_count
        |FROM v_user_orders
        |GROUP BY user_id
        |HAVING total_order_count >= 5
        |""".stripMargin
    )

    finalMetrics.show(10)
    spark.stop()
  }
}
```

---

## 四、将数据写回 MySQL

分布式写回 MySQL 时，若未经并发控制，Spark Executor 的几百个并发 Task 会在瞬间向 MySQL 建立数百个数据库连接并发送高并发写入事务，导致 MySQL 数据库直接触发 `Too many connections` 甚至发生死锁挂起。

### 4.1 标准 DataFrame 写出（控制并发与批处理）

```scala
package com.example.spark.mysql

import org.apache.spark.sql.{DataFrame, SaveMode, SparkSession}

object MySQLWriteDemo {
  def writeMetricsToMySQL(df: DataFrame, jdbcUrl: String): Unit = {
    // 关键步骤 1：使用 coalesce 或 repartition 压减分区数，收敛写回时的数据库连接数
    val targetPartitions = 4
    val coalescedDF = if (df.rdd.getNumPartitions > targetPartitions) {
      df.coalesce(targetPartitions)
    } else {
      df
    }

    // 关键步骤 2：使用 batchsize 启用批量攒批插入
    coalescedDF.write
      .format("jdbc")
      .option("url", jdbcUrl)
      .option("dbtable", "user_metrics_summary")
      .option("user", "writer")
      .option("password", "WriterPass456!")
      .option("driver", "com.mysql.cj.jdbc.Driver")
      // 开启驱动层攒批大小
      .option("batchsize", "5000")
      // isolationLevel 事务隔离级别：默认为 READ_UNCOMMITTED，可根据一致性需求调整
      .option("isolationLevel", "READ_COMMITTED")
      // SaveMode 说明：
      // Append: 追加写入
      // Overwrite: 危险！默认会执行 DROP TABLE + CREATE TABLE，导致原有主键、索引全丢失
      .mode(SaveMode.Append)
      .save()
  }
}
```

### 4.2 幂等性写入与主键冲突更新（`ON DUPLICATE KEY UPDATE`）

在生产环境中，Spark Job 失败重试时，如果直接用 `SaveMode.Append` 极易产生重复数据；而 Spark 内置 JDBC 写入不支持 `INSERT INTO ... ON DUPLICATE KEY UPDATE` 语法。

此时最优的工程实践是结合 `foreachPartition` 原生调用 JDBC `PreparedStatement`，实现精准的**幂等性批量 Upsert**：

```scala
package com.example.spark.mysql

import java.sql.{Connection, DriverManager, PreparedStatement}
import org.apache.spark.sql.{Dataset, Row}

object MySQLUpsertSink {

  def executeUpsert(dataset: Dataset[Row], jdbcUrl: String): Unit = {
    // 控制下沉并发
    val controlledDS = dataset.coalesce(4)

    controlledDS.foreachPartition { (partitionIter: Iterator[Row]) =>
      if (partitionIter.hasNext) {
        var conn: Connection = null
        var ps: PreparedStatement = null

        val upsertSql =
          """
            |INSERT INTO user_metrics_summary (user_id, lifetime_spend, total_order_count)
            |VALUES (?, ?, ?)
            |ON DUPLICATE KEY UPDATE
            |  lifetime_spend = VALUES(lifetime_spend),
            |  total_order_count = VALUES(total_order_count),
            |  update_time = CURRENT_TIMESTAMP
            |""".stripMargin

        try {
          // 每个 Partition 初始化单个 Connection
          conn = DriverManager.getConnection(jdbcUrl, "writer", "WriterPass456!")
          conn.setAutoCommit(false) // 开启手动事务，批量 Commit
          ps = conn.prepareStatement(upsertSql)

          var count = 0
          val batchSize = 2000

          while (partitionIter.hasNext) {
            val row = partitionIter.next()
            ps.setString(1, row.getAs[String]("user_id"))
            ps.setDouble(2, row.getAs[Double]("lifetime_spend"))
            ps.setLong(3, row.getAs[Long]("total_order_count"))
            ps.addBatch()

            count += 1
            if (count % batchSize == 0) {
              ps.executeBatch()
              conn.commit()
            }
          }

          // 提交剩余批次
          ps.executeBatch()
          conn.commit()
        } catch {
          case e: Exception =>
            if (conn != null) conn.rollback()
            throw e
        } finally {
          if (ps != null) ps.close()
          if (conn != null) conn.close()
        }
      }
    }
  }
}
```

---

## 五、生产环境性能调优与故障规避矩阵

| 场景 / 问题 | 根本原因 | 生产对策 |
| :--- | :--- | :--- |
| **单 Task 读取极慢，集群资源闲置** | 未配置 `partitionColumn`，默认退化为单并发扫描全表 | 必配 `partitionColumn`、`numPartitions`、`lowerBound`、`upperBound` |
| **首/尾 Task 严重长尾倾斜** | 表主键分布离散，或者数据存在大量小于 `lowerBound` / 大于 `upperBound` 的数据 | 提前在 MySQL 中使用 `SELECT MIN(id), MAX(id)` 动态获取边界注入 Spark 参数 |
| **写入时 MySQL 报 `Too many connections`** | 上游分区数上千，Spark 启动上千个 Task 并发创建连接 | 在写回前执行 `.coalesce(N)`（N 建议为 4~16），严格压减数据库连接数 |
| **写入性能低下，写入吞吐低** | 未开启 JDBC 批处理重写，每条记录单发一次网络包 | JDBC URL 必须增加 `rewriteBatchedStatements=true`，配置 `batchsize=5000` |
| **`SaveMode.Overwrite` 抹掉表结构** | Spark 默认逻辑是 `DROP TABLE` 然后根据 DataFrame Schema 重建 | 禁止在正式表使用 `Overwrite`，改为将目标表 TRUNCATE 后使用 `Append` |

---

## 六、总结

在 Spark 与 MySQL 的交互过程中，核心设计原则是**“保护数据库源端，压满分布式算力”**：
1.  **读数据时：** 杜绝单 Task 扫描，利用索引主键实施并行分片，同时借助 Catalyst 将筛选逻辑推迟到 MySQL 内部执行以减少数据网络过网；
2.  **算数据时：** 将多表关联与复杂窗口分析交由 Spark 集群分布式完成；
3.  **写数据时：** 必须使用 `coalesce` 收敛并发分区数、利用 `rewriteBatchedStatements` 开启批量交互，并在需要强幂等性时采用 `foreachPartition` 编写带有主键冲突处理的 Upsert 逻辑。