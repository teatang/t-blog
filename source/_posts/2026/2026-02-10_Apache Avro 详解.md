---
title: Apache Avro 详解
date: 2026-02-10 06:24:00
tags:
  - 2026
  - 计算机网络
  - 网络技术
categories:
  - 计算机网络
  - 网络技术
---

> **Apache Avro** 是一个**数据序列化系统**和**远程过程调用 (RPC)** 框架，起源于 Apache Hadoop 项目。它的核心目标是提供一个高效、紧凑、跨语言的数据交换和持久化存储解决方案，尤其适用于大数据环境和需要强大**Schema 演进 (Schema Evolution)** 支持的场景。Avro 通过 JSON 定义数据结构（Schema），但实际数据以紧凑的二进制格式存储，兼顾了可读性与传输效率。

{% note info %}
核心思想：以 JSON 定义 Schema (模式) 实现跨语言的数据结构描述，以紧凑二进制格式序列化数据，并通过读写 Schema 差异自动处理数据兼容性，实现高效灵活的数据交换。
{% endnote %}

------

## 一、为什么需要 Avro？

在分布式系统和大数据领域，数据交换和存储是核心挑战。传统的数据格式如 JSON 或 XML 虽然具有良好的可读性，但在数据量巨大时，它们的文件体积和解析效率往往成为瓶颈。而其他二进制格式如 Protocol Buffers 或 Thrift 虽然效率高，但通常需要代码生成，且在 Schema 演进和动态语言支持方面存在一些局限性。

Avro 的出现旨在解决这些问题，提供一个兼具以下优点的解决方案：
*   **高效和紧凑**：使用二进制格式存储数据，大幅减少存储空间和网络传输带宽。
*   **强类型 (Strongly Typed)**：通过明确的 Schema 定义数据结构，确保数据质量和一致性。
*   **强大的 Schema 演进能力**：能够在数据结构发生变化时，保持新旧数据之间的兼容性，允许系统组件独立更新。
*   **语言无关性**：支持多种编程语言（Java, Python, C, C++, Ruby, C#, Go 等），实现跨语言数据交换。
*   **无需代码生成 (Dynamic Typing)**：对于许多语言，特别是脚本语言，Avro 可以动态解析 Schema 进行序列化和反序列化，无需预先生成代码，简化了开发流程。
*   **RPC 支持**：提供远程过程调用框架，方便构建分布式服务。

## 二、Avro 的核心概念

Avro 的架构基于以下几个核心概念：

### 2.1 Schema (数据模式)

Avro 的 Schema 是数据的骨架，它以 **JSON (JavaScript Object Notation)** 格式定义，描述了数据的结构、字段名称和数据类型。 这种 JSON 格式的 Schema 易于人类阅读和机器解析。Schema 是 Avro 的灵魂，它确保了数据的一致性和兼容性。

**Avro 支持的常见数据类型包括：**

*   **原始类型 (Primitive Types)**：
    *   `null`: 无类型。
    *   `boolean`: 布尔值。
    *   `int`: 32 位带符号整数。
    *   `long`: 64 位带符号整数。
    *   `float`: 单精度浮点数。
    *   `double`: 双精度浮点数。
    *   `bytes`: 未类型化的 8 位字节序列。
    *   `string`: Unicode 字符串序列 (UTF-8 编码)。
*   **复杂类型 (Complex Types)**：
    *   **`record` (记录)**：最常用的复杂类型，类似于编程语言中的对象或结构体，包含一系列命名的字段。每个字段都有自己的名称和类型，可以包含默认值。
    *   **`enum` (枚举)**：固定数量的符号集合。
    *   **`array` (数组)**：同类型元素的有序列表。
    *   **`map` (映射)**：键值对集合，键必须是字符串，值可以是任意类型。
    *   **`union` (联合)**：允许字段可以是多种类型之一（例如，`["null", "string"]` 表示字段可以是 null 或字符串，常用于表示可选字段）。
    *   **`fixed` (固定)**：指定大小的字节数组。

### 2.2 数据序列化与二进制格式

Avro 的实际数据以高度优化的**紧凑二进制格式**存储或传输。这种格式不可直接人工读取，但对于计算机处理来说极其高效。 Avro 数据是**行式**存储的，这意味着它将每条记录的所有字段连续存储。

### 2.3 Schema 演进 (Schema Evolution)

这是 Avro 最强大的特性之一。Avro 允许在不破坏兼容性的前提下，对数据 Schema 进行修改。它通过在读取数据时，同时使用**写入者 Schema (Writer's Schema)** 和**读取者 Schema (Reader's Schema)** 来解决版本兼容性问题。

*   **写入者 Schema (Writer's Schema)**：数据写入时使用的 Schema。
*   **读取者 Schema (Reader's Schema)**：数据读取时期望的 Schema。

Avro 的“Delta Engine”会比较这两个 Schema，并自动进行兼容性处理：
*   如果写入 Schema 有额外字段，而读取 Schema 没有，则读取者会忽略这些多余字段。
*   如果读取 Schema 有额外字段，而写入 Schema 没有，如果该字段定义了默认值，则读取者会使用默认值；否则会报错。
*   如果字段类型发生改变，Avro 会尝试进行类型转换（如果可能）。

这种机制使得数据生产者和消费者可以独立演进，而无需同时升级，对于大数据管道和微服务架构至关重要。

### 2.4 数据容器文件 (Avro Data File)

Avro 可以将数据存储在一种特殊的文件格式中，即 **Avro Data File**。这种文件不仅包含序列化后的二进制数据，还会在文件头中嵌入数据的完整 Schema (元数据)。 这使得 Avro 文件具有**自描述性**，任何程序即使不知道 Schema 也能读取和理解文件中的数据。

Avro Data File 还支持分块存储和压缩，这对于大规模数据处理（如 Apache MapReduce）非常有利。

### 2.5 远程过程调用 (RPC)

除了数据序列化，Avro 还提供了一个 RPC 框架。它利用 Avro Schema 来定义 RPC 服务的消息和协议，从而实现了不同语言之间的服务调用，而无需复杂的接口定义语言（IDL）或额外的代码生成步骤。

## 三、Avro 的优势与劣势

### 3.1 优势

*   **性能和空间效率高**：二进制格式非常紧凑，存储和传输成本低，解析速度快。
*   **强大的 Schema 演进**：核心竞争力，允许数据结构灵活变化，同时保持数据兼容性。
*   **动态 Schema 解析**：支持在运行时解析 Schema，尤其适合动态语言，减少了编译时代码生成的复杂性。
*   **跨语言互操作性**：支持多种编程语言，便于异构系统间的数据交换。
*   **自描述性**：Avro Data File 包含 Schema，使得文件可以独立解析，不受外部 Schema 存储的限制。
*   **与大数据生态集成**：与 Apache Kafka, Hadoop, Spark, Flink 等大数据工具无缝集成。

### 3.2 劣势

*   **非人类可读**：二进制数据格式不方便直接查看和调试。
*   **Schema 管理开销**：虽然 Schema 演进很强大，但仍需要对 Schema 进行管理和版本控制，尤其在复杂系统中，这可能增加一定开销（虽然有像 Confluent Schema Registry 这样的工具来简化）。
*   **在 Web 开发中不常见**：在传统的 Web API 场景下，JSON 仍然是主流。
*   **对分析型查询效率不如列式存储**：作为行式存储格式，Avro 在需要选择性读取少量列的分析型查询场景中，效率不如 Parquet 等列式存储格式。

## 四、Avro 与其他数据格式的比较

| 特性 / 格式       | Apache Avro                                      | JSON                                             | Protocol Buffers (Protobuf)                      | Apache Thrift                                  |
| :---------------- | :----------------------------------------------- | :----------------------------------------------- | :----------------------------------------------- | :--------------------------------------------- |
| **Schema**        | **强制要求**，JSON 定义，嵌入数据或注册表管理。 | **可选/无**，通常依靠约定。                    | **强制要求**，自定义 IDL 定义，需代码生成。 | **强制要求**，自定义 IDL 定义，需代码生成。 |
| **数据格式**      | **紧凑二进制**，行式存储。                 | **文本 (UTF-8)**，人类可读。                     | **紧凑二进制**。                                | **紧凑二进制**，支持多种协议。             |
| **Schema 演进**   | **强大** (读写 Schema 兼容性处理)。        | **灵活但无内置支持**，需手动处理兼容性。          | **良好** (基于字段 ID)。                    | **良好** (基于字段 ID)。                 |
| **代码生成**      | **可选** (动态解析，脚本语言无需)。        | **无**。                                         | **强制**。                                    | **强制**。                                  |
| **RPC 支持**      | **内置**。                                | **无** (通常与 HTTP/REST 结合)。                   | **提供 gRPC** (独立项目)。                            | **内置**。                                    |
| **易读性**        | 差 (二进制)。                                | **高** (文本)。                                | 差 (二进制)。                                     | 差 (二进制)。                                  |
| **大小/性能**     | **优异**。                                  | 差。                                         | **优异**，可能略优于 Avro。                     | **优异**。                                     |
| **典型应用**      | 大数据存储、流处理、Kafka 消息、数据湖。    | Web API、配置文件、小型数据交换。             | 微服务间通信、高性能服务。                       | 服务间通信、跨语言 RPC。                    |

## 五、Avro 工作原理 (序列化与反序列化)

Avro 的工作流程主要包括 Schema 定义、数据序列化和数据反序列化。

1.  **定义 Schema**：首先，开发者需要用 JSON 格式定义数据的 Schema (`.avsc` 文件)。
2.  **序列化数据**：当写入数据时，应用程序获取 Schema，并将应用程序中的数据对象（如 Python 字典、Java 对象）转换为 Avro 的二进制格式。这个过程中，Schema 会指导 Avro 如何编码数据。 如果是 Avro Data File，Schema 也会被写入文件头部。
3.  **反序列化数据**：当读取数据时，应用程序提供期望的读取者 Schema。Avro 会从数据中（如果是 Avro Data File 则从文件头中）获取写入者 Schema，然后比较读取者 Schema 和写入者 Schema。根据兼容性规则，Avro 会将二进制数据转换回应用程序期望的数据对象，并处理字段缺失、增加等情况。

### UML 流程图

```mermaid
graph TD
    A[定义 Avro Schema (.avsc)] --> B{应用程序写入数据};
    B -- 使用 Writer's Schema --> C[数据序列化为紧凑二进制格式];
    C --> D[存储 / 传输 Avro 数据];
    D -- (Avro Data File 包含 Writer's Schema) --> E{应用程序读取数据};
    E -- 提供 Reader's Schema --> F[Avro 对比 Writer's Schema 和 Reader's Schema];
    F -- Schema 兼容性解析 --> G[数据反序列化为应用程序对象];
    G --> H[应用处理数据];
```

## 六、代码示例 (Python)

我们将使用 `avro` 库来演示 Python 中的 Avro 序列化和反序列化。

首先，确保安装了 `avro` 库：
`pip install avro`

或者更推荐使用性能更好的 `fastavro` 库：
`pip install fastavro`
这里我们将使用 `avro` 官方库进行演示。

### 6.1 定义 Schema (`user.avsc`)

创建一个名为 `user.avsc` 的文件，内容如下：

```json
{
  "namespace": "example.avro",
  "type": "record",
  "name": "User",
  "fields": [
    {"name": "name", "type": "string"},
    {"name": "favorite_number", "type": ["int", "null"]},
    {"name": "favorite_color", "type": ["string", "null"]}
  ]
}
```
**解释:**
*   `namespace`: 定义 Schema 的命名空间。
*   `type`: 定义 Schema 的类型，这里是 `record`。
*   `name`: 定义记录的名称。
*   `fields`: 一个数组，定义了记录包含的字段。
    *   `name`: 字段名称。
    *   `type`: 字段类型。`["int", "null"]` 是一个 union 类型，表示该字段可以是 `int` 或 `null`，使其成为一个可选字段。

### 6.2 序列化数据到 Avro 文件 (`serialize_avro.py`)

```python
import avro.schema
import avro.io
import avro.data
import io

# 1. 定义或加载 Avro Schema
# 假设我们已经将 Schema 定义在 user.avsc 文件中
schema_path = 'user.avsc'
with open(schema_path, 'r') as f:
    schema_str = f.read()
parsed_schema = avro.schema.parse(schema_str) # [26]

# 2. 准备要序列化的数据 (Python 字典列表)
users = [
    {"name": "Alice", "favorite_number": 256, "favorite_color": "blue"},
    {"name": "Bob", "favorite_number": None, "favorite_color": "green"},
    {"name": "Charlie", "favorite_number": 7, "favorite_color": None}
]

# 3. 序列化数据到 Avro Data File
output_file = 'users.avro'
# 确保文件以二进制写入模式打开 ('wb') [26]
with open(output_file, 'wb') as out_f:
    # DatumWriter 用来将 Python 对象写成 Avro 格式 [6]
    writer = avro.io.DatumWriter(parsed_schema)
    # DataFileWriter 用来将 Avro 数据写入文件，并包含 Schema [6]
    data_writer = avro.data.DataFileWriter(out_f, writer, parsed_schema)

    for user in users:
        data_writer.append(user) # 写入每一条记录
    data_writer.close()

print(f"成功将数据序列化到 {output_file}")

# 也可以序列化到内存中的 BytesIO 对象
bytes_writer = io.BytesIO()
encoder = avro.io.BinaryEncoder(bytes_writer) # [19]
datum_writer = avro.io.DatumWriter(parsed_schema)

print("\n序列化一条数据到内存 (二进制):")
single_user = {"name": "David", "favorite_number": 42, "favorite_color": "red"}
datum_writer.write(single_user, encoder)
serialized_bytes = bytes_writer.getvalue()
print(f"二进制数据长度: {len(serialized_bytes)} bytes")
# print(serialized_bytes) # 通常是不可读的二进制数据
```

### 6.3 反序列化数据从 Avro 文件 (`deserialize_avro.py`)

```python
import avro.schema
import avro.io
import avro.data
import io

# 1. 定义或加载 Avro Schema (这里使用与写入时相同的 Schema 作为 Reader's Schema)
schema_path = 'user.avsc'
with open(schema_path, 'r') as f:
    schema_str = f.read()
parsed_schema = avro.schema.parse(schema_str)

# 2. 从 Avro 文件反序列化数据
input_file = 'users.avro'
# 确保文件以二进制读取模式打开 ('rb') [26]
with open(input_file, 'rb') as in_f:
    # DataFileReader 可以从文件中读取 Avro 数据，并自动获取 Writer's Schema [6]
    data_reader = avro.data.DataFileReader(in_f, avro.io.DatumReader()) # DatumReader 负责解析数据 [19]

    print(f"从 {input_file} 反序列化数据:")
    for user_record in data_reader:
        print(user_record)
    data_reader.close()

# 也可以从内存中的 BytesIO 对象反序列化
# 假设 serialized_bytes 是之前序列化的二进制数据
# 为了演示，这里假设已经得到了 serialized_bytes
# 例如: serialized_bytes = b'\x06David\x00*\x06red' (这是一个示例值，实际值会不同)
# 从上面的序列化代码中获取
from serialize_avro import serialized_bytes as mem_serialized_bytes, parsed_schema as mem_schema

if mem_serialized_bytes:
    print("\n从内存中的二进制数据反序列化:")
    bytes_reader = io.BytesIO(mem_serialized_bytes)
    decoder = avro.io.BinaryDecoder(bytes_reader) # [19]
    datum_reader = avro.io.DatumReader(mem_schema)

    deserialized_user = datum_reader.read(decoder)
    print(deserialized_user)
else:
    print("\n没有从内存中获取序列化数据，跳过内存反序列化演示。请先运行 serialize_avro.py。")

```

**运行结果 (大致):**

```bash
# 运行 serialize_avro.py
成功将数据序列化到 users.avro

序列化一条数据到内存 (二进制):
二进制数据长度: XX bytes

# 运行 deserialize_avro.py
从 users.avro 反序列化数据:
{'name': 'Alice', 'favorite_number': 256, 'favorite_color': 'blue'}
{'name': 'Bob', 'favorite_number': None, 'favorite_color': 'green'}
{'name': 'Charlie', 'favorite_number': 7, 'favorite_color': None}

从内存中的二进制数据反序列化:
{'name': 'David', 'favorite_number': 42, 'favorite_color': 'red'}
```

## 七、Avro 的典型应用场景

*   **大数据存储**：在 Hadoop/HDFS 中存储结构化数据，用于数据湖、数据仓库。
*   **数据流处理**：作为 Apache Kafka 消息队列的序列化格式，实现高效可靠的事件和消息传递。
*   **ETL (Extract, Transform, Load) 流程**：在数据管道中转换和加载数据，利用其 Schema 演进能力处理数据结构变化。
*   **跨语言数据交换**：在不同编程语言编写的服务或应用程序之间进行数据交互。
*   **微服务架构**：在微服务之间进行高效的数据传输。
*   **实时数据处理**：适用于需要低延迟和高吞吐的实时数据流场景。

## 八、总结

Apache Avro 是一个为大数据和分布式系统设计的强大数据序列化和 RPC 框架。它通过 JSON 定义清晰的 Schema，并以紧凑的二进制格式存储实际数据，在效率和可读性之间取得了良好的平衡。其独特的 Schema 演进机制是其核心优势，允许不同版本的数据结构进行兼容性操作，极大地简化了系统的维护和升级。 尽管其二进制格式不直接人类可读，且在分析型查询上可能不如列式存储，但 Avro 在数据流、大数据存储和跨语言数据交换等场景中表现出色，尤其在 Apache Kafka 和 Hadoop 生态系统中扮演着关键角色。 掌握 Avro 对于构建现代、可扩展的数据驱动型应用至关重要。