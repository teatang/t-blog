---
title: PromQL详解：深入理解Prometheus查询语言
date: 2025-02-04 06:24:00
tags:
  - 2025
  - Prometheus
  - 数据监控
categories:
  - 开发工具
  - 数据监控
---

> **PromQL (Prometheus Query Language)** 是 Prometheus 监控系统中用于实时查询和聚合时间序列数据的强大表达式语言。它是 Prometheus 核心价值的体现之一，通过 PromQL，用户可以灵活地对指标数据进行筛选、聚合、计算和转换，从而深入洞察系统行为、发现问题模式并支持警报规则的定义。掌握 PromQL 是有效利用 Prometheus 进行监控和可观测性的关键。

{% note info %}
核心思想：
**PromQL 允许用户通过组合指标名称、标签选择器、范围选择器、运算符和函数，从 Prometheus 的时序数据库 (TSDB) 中提取、转换和计算数据。它的多维数据模型和向量操作使其在处理和分析复杂的时序数据方面表现出色。**
{% endnote %}

------

## 一、PromQL 基础

PromQL 表达式返回的结果类型可以是以下四种之一：
1.  **即时向量 (Instant vector)**：由一组时间序列组成，每个时间序列包含一个时间戳和一个样本值。所有时间序列共享相同的时间戳。例如：`http_requests_total`。
2.  **范围向量 (Range vector)**：由一组时间序列组成，每个时间序列包含在给定时间范围内的多个样本值。例如：`http_requests_total[5m]`。
3.  **纯量 (Scalar)**：一个简单的浮点数。例如：`100`。
4.  **字符串 (String)**：一个简单的字符串（在 PromQL 中不常用）。例如：`"up"`。

### 1.1 指标选择器 (Metric Selectors)

PromQL 查询的核心是选择要操作的时间序列。

#### 1.1.1 指标名称 (Metric Name)

最简单的查询是只指定指标名称。这将返回该指标名称下所有标签组合的最新即时向量。

```promql
# 获取所有 http_requests_total 指标的最新值
http_requests_total
```

#### 1.1.2 标签匹配 (Label Matching)

通过花括号 `{}` 可以添加标签匹配器来过滤时间序列。

*   **`=` (精确匹配)**：选择标签值完全等于给定字符串的。
*   **`!=` (不等于)**：选择标签值不等于给定字符串的。
*   **`=~` (正则匹配)**：选择标签值匹配给定正则表达式的。
*   **`!~` (正则不匹配)**：选择标签值不匹配给定正则表达式的。

```promql
# 选择 job 为 prometheus 且 instance 为 localhost:9090 的时间序列
up{job="prometheus", instance="localhost:9090"}

# 选择 job 为 prometheus 但 instance 不为 localhost:9090 的时间序列
up{job="prometheus", instance!="localhost:9090"}

# 选择 job 以 pro 开头，且 instance 以 :9090 结尾的时间序列
up{job=~"pro.*", instance=~".*:9090"}

# 选择 job 不以 pro 开头的时间序列
up{job!~"pro.*"}
```

**特殊标签：`__name__`**
指标名称本身在内部被视为一个名为 `__name__` 的标签。这意味着你可以使用标签匹配器来选择或过滤指标名称。

```promql
# 等同于 http_requests_total
{__name__="http_requests_total"}

# 选择所有以 http_ 开头的指标
{__name__=~"http_.*"}
```

#### 1.1.3 范围选择器 (Range Vector Selectors)

范围选择器通过在即时向量选择器后加上方括号 `[]` 和一个持续时间来获取一段时间内的样本数据，返回一个范围向量。持续时间可以用 `s` (秒), `m` (分钟), `h` (小时), `d` (天), `w` (周), `y` (年) 等表示。

**注意事项：** 范围向量不能直接绘制成图，通常需要配合函数使用，如 `rate()`, `increase()` 等。

```promql
# 获取过去 5 分钟内 http_requests_total 指标的所有样本
http_requests_total[5m]

# 获取过去 1 小时内 CPU 使用率的所有样本
node_cpu_seconds_total[1h]
```

### 1.2 时间位移操作 (Offset)

`offset` 关键字用于将查询的时间点向后或向前移动。

*   `offset 5m`：查询 5 分钟前的数据。
*   `offset -1h`：查询 1 小时后的数据（通常用于比较未来预测或调试）。

```promql
# 查询 1 小时前 http_requests_total 的最新值
http_requests_total offset 1h

# 查询 5 分钟前 http_requests_total 在过去 10 分钟内的范围向量
http_requests_total[10m] offset 5m
```

### 1.3 运算符 (Operators)

PromQL 支持各种数学、比较和逻辑运算符。

#### 1.3.1 数学运算符

`+`, `-`, `*`, `/`, `%`, `^` (幂)

```promql
# 计算空闲 CPU 百分比
(1 - sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) / sum(rate(node_cpu_seconds_total[5m]))) * 100

# 计算集群中所有实例的 http_requests_total 总和除以实例数量
sum(http_requests_total) / count(http_requests_total)
```

#### 1.3.2 比较运算符

`==`, `!=`, `<`, `>`, `<=`, `>=`

这些运算符可以用于即时向量和纯量之间，或两个即时向量之间。

```promql
# 选择 UP 状态为 0 的实例 (服务宕机)
up == 0

# 选择 HTTP 请求总数大于 1000 的实例
http_requests_total > 1000
```

当比较两个即时向量时，Prometheus 会尝试匹配两个向量中标签相同的系列。

```promql
# 比较两个不同 job 的 HTTP 请求总数
http_requests_total{job="app1"} > http_requests_total{job="app2"}
```

#### 1.3.3 逻辑/集合运算符

`and`, `or`, `unless`

这些运算符用于即时向量之间的集合操作。

*   `vector1 and vector2`：返回 `vector1` 中存在且在 `vector2` 中也存在（匹配标签）的元素，结果值是 `vector1` 中的值。
*   `vector1 or vector2`：返回 `vector1` 中所有元素，以及 `vector2` 中不在 `vector1` 中的元素。
*   `vector1 unless vector2`：返回 `vector1` 中存在但 `vector2` 中不存在（匹配标签）的元素。

```promql
# 选择处于活跃状态 (up==1) 且过去 5 分钟内 HTTP 错误率超过 5% 的实例
up{job="my_app"} == 1 and (sum(rate(http_requests_total{job="my_app", status=~"5.."}[5m])) / sum(rate(http_requests_total{job="my_app"}[5m])) > 0.05)
```

## 二、PromQL 函数

PromQL 提供了大量的函数来处理、转换和聚合时间序列数据。

### 2.1 聚合函数 (Aggregators)

这些函数用于将一组即时向量聚合为更小的即时向量，通常用于在多个时间序列上进行计算。它们可以与 `by` 或 `without` 子句一起使用，以指定聚合时要保留或删除的标签。

*   `sum()`: 计算所有输入元素的和。
*   `avg()`: 计算所有输入元素的平均值。
*   `min()`: 计算所有输入元素的最小值。
*   `max()`: 计算所有输入元素的最小值。
*   `count()`: 计算所有输入元素的数量。
*   `stddev()`: 计算所有输入元素的标准差。
*   `stdvar()`: 计算所有输入元素的标准方差。
*   `group()`: 将所有输入元素分组，并为每个组返回一个 `1`。

**`by` 和 `without` 子句：**
*   `sum(...) by (label1, label2)`：对指定的 `label1`, `label2` 进行分组，然后对每个组进行求和。结果中只保留 `label1`, `label2` 标签。
*   `sum(...) without (label1, label2)`：对除了 `label1`, `label2` 之外的所有标签进行分组，然后对每个组进行求和。结果中删除 `label1`, `label2` 标签。

```promql
# 计算所有实例的 CPU 空闲时间总和
sum(node_cpu_seconds_total{mode="idle"})

# 计算每个 job 的 HTTP 请求总数
sum(http_requests_total) by (job)

# 计算每个 job 在去除 instance 标签后的 http_requests_total 总和
sum(http_requests_total) without (instance)
```

### 2.2 变化率函数 (Rate, Irates, Increase)

这些函数专门用于处理 **Counter (计数器)** 类型的指标，它们是 PromQL 中最常用的函数之一。

*   `rate(v range vector)`: 计算一个时间窗口内，v 中时间序列的平均每秒增长率。**它会自动处理计数器重置 (counter resets)**。常用于计算 RPS (Requests Per Second)、BPS (Bytes Per Second) 等。

    ```promql
    # 计算过去 5 分钟内每个 HTTP 请求路径和方法的平均 RPS
    rate(http_requests_total[5m])

    # 计算某个网络接口过去 1 分钟内的入站流量速率（Bytes/sec）
    rate(node_network_receive_bytes_total{device="eth0"}[1m])
    ```

*   `irate(v range vector)`: 计算一个时间窗口内，v 中时间序列的**瞬时每秒增长率**。与 `rate` 相比，`irate` 关注的是时间窗口内最后两个数据点之间的速率变化，因此对快速变化的计数器更为敏感。**它也会处理计数器重置**。

    ```promql
    # 计算过去 5 分钟内每个 HTTP 请求路径和方法的瞬时 RPS
    irate(http_requests_total[5m])
    ```
    **何时使用 `rate` 或 `irate`？**
    *   `rate` 更适合用于长期趋势分析和聚合，因为它提供了更平滑的平均值。
    *   `irate` 更适合用于快速检测瞬时峰值或下降，例如在警报规则中快速响应问题。

*   `increase(v range vector)`: 计算在时间窗口内，v 中时间序列的**增量**。它返回一个纯量，表示计数器在该时间范围内的总增长量。

    ```promql
    # 计算过去 1 小时内 HTTP 请求的总增量
    increase(http_requests_total[1h])
    ```

### 2.3 预测与趋势函数

*   `predict_linear(v range vector, t scalar)`: 基于范围向量 `v` 中时间序列的线性回归，**预测**在未来 `t` 秒后的值。常用于磁盘空间预测、 容量规划。

    ```promql
    # 预测某个磁盘分区在未来 4 小时 (4 * 3600 秒) 后是否会满
    # node_filesystem_avail_bytes 是可用空间
    predict_linear(node_filesystem_avail_bytes{mountpoint="/data"}[1h], 4 * 3600) < 0
    ```

*   `holt_winters(v range vector, sf scalar, tf scalar)`: 基于 Holt-Winters 算法对范围向量 `v` 中的时间序列进行**平滑和预测**。`sf`（平滑因子）和 `tf`（趋势因子）控制平滑程度和趋势响应速度。
    ```promql
    # 使用 Holt-Winters 算法预测未来 1 小时的请求量
    holt_winters(rate(http_requests_total[5m]), 0.2, 0.4)
    ```

### 2.4 各种实用函数

*   `abs(v instant vector)`: 返回向量 `v` 中所有元素的绝对值。
*   `ceil(v instant vector)`: 返回向量 `v` 中所有元素向上取整的整数。
*   `floor(v instant vector)`: 返回向量 `v` 中所有元素向下取整的整数。
*   `round(v instant vector, to_nearest = 1 scalar)`: 四舍五入到最近的整数或指定的小数位。
*   `delta(v range vector)`: 计算范围向量 `v` 中每个时间序列的第一个和最后一个样本值之间的差值。**不会处理计数器重置**。
*   `deriv(v range vector)`: 计算范围向量 `v` 中每个时间序列的简单线性回归斜率（即每秒变化率）。
*   `vector(scalar)`: 将一个纯量转换为一个即时向量。
    ```promql
    # 将纯量 100 转换为一个单元素的即时向量
    vector(100)
    ```
*   `label_replace(v instant vector, dst_label string, replacement string, src_label string, regex string)`: 替换或添加标签。
    ```promql
    # 将 instance 标签的值复制到 new_instance 标签中
    label_replace(up{job="prometheus"}, "new_instance", "$1", "instance", "(.*)")
    ```
*   `histogram_quantile(φ scalar, b instant vector)`: 计算直方图的 `φ` (0-1) 分位数。`b` 是 `_bucket` 指标。
    ```promql
    # 计算 http_request_duration_seconds 指标的 90% 分位数
    histogram_quantile(0.9, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
    ```

### 2.5 聚合组匹配 (On/Group_left/Group_right)

当执行向量之间的操作（如加减乘除）时，两个向量的元素需要进行匹配。Prometheus 默认根据所有共享的标签进行匹配。`on` 和 `group_left`/`group_right` 提供了更精细的控制。

*   **`on (label1, label2)`**：只根据指定的标签列表进行匹配。
*   **`group_left()` / `group_right()`**：用于在多对一或一对多的匹配中，将“多”方向量的额外标签传播到“一”方向量的结果中。

```promql
# 假设有指标：
# instance_info{instance="a:1", region="us-east"} 1
# instance_info{instance="b:2", region="us-west"} 1
# http_requests_total{instance="a:1", path="/"} 100

# 错误示例：直接相乘会因为标签不完全匹配而导致部分结果丢失
# instance_info * http_requests_total

# 使用 on 明确匹配标签
# 匹配 instance 相同的时间序列，并保留 instance_info 的 region 标签
instance_info * on (instance) group_left(region) http_requests_total
```

## 三、PromQL 表达式评估

Prometheus 在评估 PromQL 表达式时，会根据查询的时间范围和步长 (step) 进行数据点的插值和计算。

*   **即时查询 (Instant Query)**：返回单个时间点的数据。通常用于面板中的 `Stat` 面板或一次性查询。
*   **范围查询 (Range Query)**：返回一段时间序列数据。通常用于图表面板。需要指定查询范围 (end - start) 和步长 (step)。 `step` 决定了图表上数据点的密度。

## 四、常见场景下的 PromQL 实践

### 4.1 计算服务请求速率 (RPS)

```promql
# 计算每个 job 和其下每个 instance 的 HTTP 请求在过去 5 分钟内的平均 RPS
rate(http_requests_total[5m])

# 聚合所有实例的 HTTP 请求 RPS，按 job 分组
sum by (job) (rate(http_requests_total[5m]))
```

### 4.2 计算错误率

```promql
# 计算过去 5 分钟内，每个 job 的 5xx 错误总数
sum by (job) (rate(http_requests_total{status=~"5.."}[5m]))

# 计算过去 5 分钟内，每个 job 的 5xx 错误率
sum by (job) (rate(http_requests_total{status=~"5.."}[5m]))
/
sum by (job) (rate(http_requests_total[5m]))
```

### 4.3 计算 CPU 利用率

假设 `node_cpu_seconds_total` 记录了每个 CPU 核心在不同模式下的秒数。

```promql
# 计算过去 5 分钟内所有 CPU 核心的平均总利用率
1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]))
```

### 4.4 统计服务在线实例数

```promql
# 统计每个 job 在线的实例数量
sum by (job) (up)
```

### 4.5 内存使用率

```promql
# 计算过去 5 分钟内每个 instance 的内存使用率 (Node Exporter 指标)
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - node_memory_Buffers_bytes - node_memory_Cached_bytes)
/
node_memory_MemTotal_bytes
```
或者更简单（取决于 Exporter 提供的指标）：
```promql
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes```

### 4.6 磁盘空间预测（剩余空间不足报警）

```promql
# 预测 /data 挂载点在未来 24 小时内是否会耗尽空间
# 假设 node_filesystem_avail_bytes 是可用空间，rate 是每秒变化率（负意味着减少）
predict_linear(node_filesystem_avail_bytes{mountpoint="/data"}[1h], 24 * 3600) < 0
```

### 4.7 警报规则示例 (YAML 文件, for Alertmanager)

```yaml
groups:
- name: critical_alerts
  rules:
  - alert: HighRequestLatency
    expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job)) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "{{ $labels.job }} 服务的 99% 请求延迟超过 0.5 秒"
      description: "在过去 5 分钟内，{{ $labels.job }} 服务的 99% HTTP 请求延迟超过 0.5 秒。当前值：{{ $value }}s"

  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "服务 {{ $labels.instance }} 已停止运行"
      description: "{{ $labels.instance }} 上的服务 {{ $labels.job }} 在过去 1 分钟内处于 DOWN 状态。"
```

## 五、高级用法与注意事项

*   **标签的最佳实践**：
    *   **高基数标签 (High Cardinality Labels)**：避免使用会产生大量唯一值作为标签的值（例如用户 ID、请求 ID），因为这会导致 Prometheus 存储大量时间序列，严重降低性能。
    *   **预定义的标签数量**：尽量限制每个指标的标签数量，通常不超过十几个。
*   **计数器重置**：`rate()` 和 `increase()` 函数会自动处理计数器重置。**不要自己手动计算两个点之间的差值，因为这会忽略重置，导致不准确的结果。**
*   **瞬时向量 vs. 范围向量**：清楚区分两种向量类型，并了解哪些函数接受哪种类型的输入。
*   **CPU 使用率的计算**：
    `rate(node_cpu_seconds_total{mode!="idle"}[5m])` 计算的是 `非空闲` 模式下 CPU 使用的秒数在 5 分钟内的平均每秒增长率，表示 CPU 的繁忙程度。
    `1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]))` 则是更标准的 Linux 系统 CPU 利用率计算方式，即 `1 - 空闲率`。
*   **分位数 (Quantiles)**：`histogram_quantile` 是计算直方图分位数的正确方式，它依赖于 `_bucket` 指标。

## 六、总结

PromQL 是 Prometheus 监控系统不可或缺的一部分，它的简洁性、灵活性和强大的功能使其成为处理和分析时序数据的理想工具。通过掌握指标选择器、标签匹配、运算符、以及各种内置函数，用户可以构建复杂的查询来回答关于系统性能和健康状况的各种问题，有效地发现异常，并驱动警报规则的逻辑。深入理解 PromQL 是实现高效故障排除、性能优化和容量规划的关键。