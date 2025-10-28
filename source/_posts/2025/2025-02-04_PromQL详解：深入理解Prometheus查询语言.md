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

> **PromQL (Prometheus Query Language)** 是 Prometheus 监控系统中用于查询、聚合和分析时间序列数据的一种功能强大的查询语言。它是 Prometheus 核心价值的体现之一。无论你是要构建仪表盘、创建告警规则，还是进行故障排查，PromQL 都是你与 Prometheus 数据进行交互的唯一途径。掌握 PromQL 是有效利用 Prometheus 的关键。

{% note info %}
“PromQL 让你能够将原始指标数据转化为有意义的洞察和可操作的智能信息。”
{% endnote %}
------

## 一、Prometheus 指标类型回顾

在深入 PromQL 之前，我们先快速回顾一下 Prometheus 的四种核心指标类型，因为 PromQL 的查询行为会根据指标类型有所不同：

1.  **Counter (计数器)**：一种累计型指标，只增不减（重置除外）。通常用于统计请求总数、错误总数等。
    *   **例子**：`http_requests_total`
    *   **适用 PromQL 函数**：`rate()`、`irate()`、`increase()`
2.  **Gauge (测量仪)**：一种可任意上下变动的指标，反映当前状态。通常用于表示内存使用量、CPU 温度、并发连接数等。
    *   **例子**：`node_memory_MemFree_bytes`
    *   **适用 PromQL 函数**：直接查询、`delta()`、`deriv()`
3.  **Histogram (直方图)**：用于对采样值（如请求持续时间、响应大小）进行聚合统计，提供分布情况。它暴露 `_bucket` (区间内样本数)、`_sum` (所有样本值之和)、`_count` (样本总数) 三个指标。
    *   **例子**：`http_request_duration_seconds_bucket`
    *   **适用 PromQL 函数**：`histogram_quantile()`
4.  **Summary (摘要)**：与 Histogram 类似，但它在客户端计算分位数，如 0.5、0.99，也提供 `_sum` 和 `_count`。
    *   **例子**：`http_request_duration_seconds_count` (同 `Summary` 的 `_count`)

## 二、PromQL 基础概念

### 2.1 指标名称 (Metric Name)

PromQL 查询的基础是指标名称。指标名称通常描述了被测量事物的通用特征。

*   **例子**：`http_requests_total` （记录 HTTP 请求总数）

### 2.2 标签 (Labels)

标签是 Prometheus 最强大的特性之一。它们是键值对，用于标识指标的各个维度。通过标签，我们可以精确地过滤和聚合数据。

*   **例子**：`http_requests_total{method="post", path="/api/v1"}`

### 2.3 查询结果类型

PromQL 查询可以返回四种类型的结果：

1.  **瞬时向量 (Instant vector)**：由一组时间序列组成，每个时间序列只有一个样本值，且所有样本值都对应于查询的“瞬时时间”。这是最常用的返回类型。
    *   **例子**：`http_requests_total`
2.  **区间向量 (Range vector)**：由一组时间序列组成，每个时间序列包含在给定时间范围内的多个样本值。主要用于函数操作。
    *   **例子**：`http_requests_total[5m]` （过去 5 分钟内的 `http_requests_total` 值）
3.  **标量 (Scalar)**：一个简单的浮点数值（不带时间戳和标签）。
    *   **例子**：`count(http_requests_total)`
4.  **字符串 (String)**：目前未使用。

## 三、PromQL 查询语法

### 3.1 表达式语言元素

PromQL 表达式包括：
*   **字面量**：布尔值 (true/false) 和数字。
*   **字符串**：双引号或单引号包围的文本。
*   **变量**：自定义的动态值（通常在 Grafana 中使用）。
*   **向量选择器**：用于选择瞬时向量或区间向量。
*   **函数**：对向量执行操作（如 `rate()`、`sum()`）。
*   **操作符**：数学运算 (`+`, `-`, `*`, `/`, `%`, `^`)，比较运算 (`==`, `!=`, `>`, `<`, `>=`, `<=`)，逻辑运算 (`and`, `or`, `unless`)，聚合运算 (`sum`, `avg`, `min`, `max`, `count`)。

### 3.2 瞬时向量选择器

用于选择在给定时间戳上的所有匹配标签的时间序列的最新样本。

*   **选择所有 `http_requests_total` 指标**：
    ```promql
    http_requests_total
    ```
*   **通过标签过滤**：
    *   **精确匹配**：`{<labelname>="<labelvalue>"}`
        ```promql
        http_requests_total{method="post", status="200"}
        ```
    *   **不等于**：`{<labelname>!="<labelvalue>"}`
        ```promql
        http_requests_total{instance!="localhost:8080"}
        ```
    *   **正则表达式匹配**：`{<labelname>=~"<regex>"}`
        ```promql
        http_requests_total{job=~"api-server|my-app"}
        ```
    *   **正则表达式不匹配**：`{<labelname>!~"<regex>"}`
        ```promql
        http_requests_total{path!~"/admin/.*"}
        ```

### 3.3 区间向量选择器

通过在瞬时向量选择器后添加 `[<duration>]` 来获取一个时间范围内的样本。持续时间用数字加单位表示，单位包括 `s` (秒), `m` (分钟), `h` (小时), `d` (天), `w` (周), `y` (年)。

*   **例子**：
    ```promql
    http_requests_total[5m] # 过去 5 分钟内 http_requests_total 的所有样本
    node_cpu_seconds_total[1h] # 过去 1 小时内 CPU 使用的累积秒数
    ```

### 3.4 偏移量 (Offset)

通过 `offset <duration>` 可以在查询中将表达式的时间点向过去偏移。

*   **例子**：
    ```promql
    http_requests_total offset 5m # 5 分钟前的 http_requests_total 值
    http_requests_total[1h] offset 1d # 昨天同一时间段的 1 小时内的总请求
    ```

### 3.5 操作符 (Operators)

#### 3.5.1 数学运算符

`+`, `-`, `*`, `/`, `%`, `^` (幂)。
可以用于标量和瞬时向量之间，或两个瞬时向量之间。

*   **例子**：
    ```promql
    node_memory_MemFree_bytes / node_memory_MemTotal_bytes * 100 # 计算内存空闲百分比
    ```

#### 3.5.2 比较运算符

`==`, `!=`, `>`, `<`, `>=`, `<=`。
返回结果只有在比较条件为真时才会保留。

*   **例子**：
    ```promql
    node_cpu_usage > 0.8 # 返回 CPU 使用率大于 0.8 的时间序列
    ```

#### 3.5.3 逻辑/集合运算符

`and` (交集), `or` (并集), `unless` (差集)。

*   **例子**：
    ```promql
    # 返回 status="200" 和 method="post" 的请求交集
    http_requests_total{status="200"} and http_requests_total{method="post"}
    ```

#### 3.5.4 向量匹配 (Vector Matching)

当两个瞬时向量操作时，Prometheus 会尝试匹配它们的标签集。
*   **一对一匹配 (One-to-one matching)**：操作符两侧的向量元素具有完全相同的标签集。
*   **多对一 / 一对多匹配 (Many-to-one / One-to-many matching)**：一侧的向量元素可以与多侧的多个元素匹配。需要使用 `on()` 或 `ignoring()` 来指定匹配标签。

    *   `on(<label list>)`：仅在指定的标签上匹配。
    *   `ignoring(<label list>)`：忽略指定的标签进行匹配。

*   **例子**：
    ```promql
    # 计算每个 job 的请求成功率
    (http_requests_total{status="200"} / http_requests_total) by (job)

    # 假设一个服务有 error 和 total 两个计数器，通过实例匹配
    sum by (instance) (service_errors_total) / sum by (instance) (service_requests_total)
    ```

### 3.6 聚合函数 (Aggregation Operators)

用于将多个时间序列聚合为一个或多个时间序列。
语法：`<agg-op>([parameter,] <vector expression>) [by / without <label list>]`

*   **`<agg-op>`**：`sum`, `avg`, `min`, `max`, `count`, `stddev`, `stdvar`, `group`, `topk`, `bottomk`, `quantile`。
*   **`by (<label list>)`**：对指定的标签进行分组聚合，保留这些标签。
*   **`without (<label list>)`**：对除了指定的标签以外的所有标签进行分组聚合，丢弃这些标签。

*   **例子**：
    ```promql
    # 所有 Prometheus 抓取目标的活跃连接总数
    sum(up)

    # 每个 job 的 HTTP 请求总数
    sum(http_requests_total) by (job)

    # 排除 method 和 status 标签后，聚合 HTTP 请求的总数
    sum(http_requests_total) without (method, status)
    ```

## 四、PromQL 函数 (Functions)

PromQL 提供了丰富的内置函数来处理和分析时间序列数据。

### 4.1 计数器相关函数 (Counters)

*   **`rate(v range-vector)`**：计算区间向量 `v` 中时间序列**每秒的平均增长率**。这对于 Counter 类型指标是计算每秒平均增量的主要方法。
    ```promql
    rate(http_requests_total[5m]) # 每 5 分钟的平均每秒请求数
    ```
*   **`irate(v range-vector)`**：计算区间向量 `v` 中时间序列**最近两个样本的每秒瞬时增长率**。对频繁变化的 Counter 指标更敏感。
    ```promql
    irate(node_network_transmit_bytes_total[1m]) # 1 分钟内的瞬时网络发送速率
    ```
*   **`increase(v range-vector)`**：计算区间向量 `v` 中时间序列**总的增量**。适用于 Counter 指标，会处理计数器重置。
    ```promql
    increase(http_requests_total[1h]) # 过去 1 小时内 HTTP 请求的总数
    ```

### 4.2 Gauge 相关函数 (Gauges)

*   **`delta(v range-vector)`**：计算区间向量 `v` 中时间序列的**样本值变化量**。
    ```promql
    delta(node_temp_celsius[1h]) # 1 小时内温度的变化量
    ```
*   **`deriv(v range-vector)`**：计算区间向量 `v` 中时间序列的**一阶导数**。
    ```promql
    deriv(node_fans_speed_rpm[5m]) # 风扇转速的瞬时变化率
    ```
*   **`predict_linear(v range-vector, t scalar)`**：基于区间向量 `v` 中时间序列的线性回归，预测 `t` 秒后的值。
    ```promql
    predict_linear(node_disk_free_bytes[1h], 4 * 3600) # 预测 4 小时后磁盘剩余空间
    ```

### 4.3 直方图相关函数 (Histograms)

*   **`histogram_quantile(quantile scalar, bucket_le_series range-vector)`**：计算 Histogram 类型指标的分位数。它将 `_bucket` 指标作为输入。
    ```promql
    histogram_quantile(0.99, http_request_duration_seconds_bucket[5m]) # 过去 5 分钟内 HTTP 请求耗时的 99% 分位数
    ```

### 4.4 其他常用函数

*   **`sum_over_time(v range-vector)`**：返回区间向量 `v` 中每个时间序列所有样本值的和。
*   **`avg_over_time(v range-vector)`**：返回区间向量 `v` 中每个时间序列所有样本值的平均值。
*   **`count_over_time(v range-vector)`**：返回区间向量 `v` 中每个时间序列的样本数量。
*   **`absent(v instant-vector)`**：如果查询结果为空，则返回 1；否则返回 0。常用于告警，检测服务是否停止上报指标。
    ```promql
    absent(up{job="my-app"}) # 如果 my-app 停止上报，则触发告警
    ```
*   **`clamp_max(v instant-vector, max scalar)`**：将瞬时向量 `v` 中的值限制在 `max` 以下。
*   **`clamp_min(v instant-vector, min scalar)`**：将瞬时向量 `v` 中的值限制在 `min` 以上。

## 五、PromQL 告警规则示例

Prometheus 的告警规则也是用 PromQL 编写的。规则存储在 `.yml` 文件中，并通过 `rules` 配置加载。

```yaml
# rules.yml
groups:
  - name: server_alerts
    rules:
      - alert: HostHighCPUUsage # 告警名称
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        # 表达式：当前 CPU 利用率在过去 5 分钟的平均值超过 80%
        for: 5m # 持续 5 分钟后触发告警
        labels:
          severity: critical # 告警级别
        annotations:
          summary: "主机 {{ $labels.instance }} CPU 使用率过高"
          description: "主机 {{ $labels.instance }} CPU 使用率已达到 {{ $value }}%，持续超过 5 分钟。"

      - alert: ServiceDown
        expr: absent(up{job="my_service"})
        for: 1m
        labels:
          severity: major
        annotations:
          summary: "服务 {{ $labels.job }} 已停止上报指标"
          description: "服务 {{ $labels.job }} 在过去 1 分钟内未上报任何指标，可能已停止运行。"
```

**告警规则解析：**

*   `alert`：告警名称。
*   `expr`：用于判断是否触发告警的 PromQL 表达式。
*   `for`：如果 `expr` 持续多长时间为真，才触发告警。用于减少瞬时波动的误报。
*   `labels`：附加到告警上的静态标签。
*   `annotations`：提供更详细信息的文本字段，支持 Go 模板语法 (`{{ $labels.label_name }}` 和 `{{ $value }}`)。

## 六、实际案例分析

### 6.1 计算 HTTP 总请求量

```promql
sum(http_requests_total) # 所有 HTTP 请求的总数
sum(http_requests_total) by (job, instance) # 按 job 和 instance 分组的 HTTP 请求总数
```

### 6.2 计算每秒请求数 (QPS)

```promql
rate(http_requests_total[1m]) # 过去 1 分钟的平均每秒请求数
```

### 6.3 计算 CPU 利用率

```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
# 首先计算 idle 模式下的 CPU 在 5 分钟内的平均每秒增量（即空闲时间占比）
# 然后 `1 - 空闲时间占比` 得到忙碌时间占比
# 最后乘以 100 得到百分比
```

### 6.4 计算网络带宽使用率

```promql
# 传入带宽
rate(node_network_receive_bytes_total{device="eth0"}[5m]) # eth0 网卡每秒接收字节数

# 传出带宽
rate(node_network_transmit_bytes_total{device="eth0"}[5m]) # eth0 网卡每秒发送字节数
```

### 6.5 检测磁盘空间不足 (少于 20%)

```promql
(node_filesystem_avail_bytes{device="/dev/sda1"} / node_filesystem_size_bytes{device="/dev/sda1"}) * 100 < 20
```

### 6.6 应用程序错误率

假设有 `app_requests_total` 和 `app_errors_total` 两个 Counter：

```promql
# 计算过去 5 分钟内的错误率
rate(app_errors_total[5m]) / rate(app_requests_total[5m])
```

## 七、学习资源与进阶

*   **Prometheus 官方文档**：[https://prometheus.io/docs/prometheus/latest/querying/basics/](https://prometheus.io/docs/prometheus/latest/querying/basics/)
*   **PromQL Cheat Sheet**：网上有很多 PromQL 速查卡片，是很好的参考。
*   **PromQL Playground**：在 Prometheus Web UI 的 `Graph` 页面或 `PromLens` (一个强大的 PromQL 调试工具) 中进行实验和练习。
*   **Grafana**：通过实践创建仪表盘来巩固 PromQL 知识。

## 八、总结

PromQL 是 Prometheus 监控系统的心脏，理解和熟练运用它是发挥 Prometheus 强大功能的基础。它通过多维数据模型、灵活的标签匹配、丰富的操作符和函数，使得从海量时间序列数据中抽取有价值的信息成为可能。从简单的指标查询到复杂的告警规则和趋势预测，PromQL 授予你对数据的高度掌控力，是构建高效、智能监控系统的必备技能。不断实践和探索，你将发现 PromQL 的无限潜力。