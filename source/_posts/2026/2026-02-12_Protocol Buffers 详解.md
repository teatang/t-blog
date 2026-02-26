---
title: Protocol Buffers 详解
date: 2026-02-12 06:24:00
tags:
  - 2026
  - 计算机网络
  - 网络技术
categories:
  - 计算机网络
  - 网络技术
---

> **Protocol Buffers (Protobuf)** 是 Google 开发的一种**语言无关、平台无关、可扩展的序列化数据结构**的方法。它旨在替代 XML 等数据交换格式，以实现更小、更快、更简单的数据传输。Protobuf 允许开发者定义数据结构（称为 `message`），并通过生成的代码，以高效的二进制格式序列化这些数据，或从二进制格式反序列化回原始数据结构。它广泛应用于微服务间的通信、数据存储以及网络协议定义等场景，尤其是 Google 自家的 gRPC 框架更是以 Protobuf 作为其默认的接口定义语言和数据交换格式。

{% note info %}
核心思想：通过简洁的 `.proto` 文件定义数据结构，然后通过代码生成工具将其转换为特定语言的高效代码，实现紧凑、快速的二进制数据序列化和反序列化，支持强大的 Schema 演进和跨语言互操作性。
{% endnote %}

------

## 一、为什么需要 Protocol Buffers？

在分布式系统和微服务架构中，不同服务之间的数据交换是核心环节。传统的数据交换格式，如 JSON 或 XML，存在以下一些问题：

1.  **性能瓶颈**：文本格式解析速度相对较慢，对于大量数据或高并发场景，CPU 消耗较大。
2.  **数据体积大**：文本格式通常包含大量的冗余字符（如标签、空格、换行），导致数据包体积较大，增加了网络带宽和存储成本。
3.  **缺乏强类型检查**：JSON/XML 本身是弱类型的，虽然可以通过 Schema 定义进行约束，但运行时仍然容易出现类型不匹配或字段缺失的问题，需要额外的验证逻辑。
4.  **跨语言互操作性复杂**：虽然 JSON/XML 是跨语言的，但要在不同语言中实现对复杂数据结构的序列化和反序列化，并保持严格的类型和结构一致性，需要各语言端手动实现或使用第三方库，容易出错。

Protocol Buffers 旨在解决这些问题，提供一个：

*   **高效和紧凑**：使用二进制格式存储数据，大幅减少存储空间和网络传输带宽，解析速度更快。
*   **强类型**：通过严格的 `*.proto` 文件定义，确保数据结构的一致性，减少运行时错误。
*   **出色的 Schema 演进能力**：允许在数据结构发生变化时，保持新旧数据之间的兼容性，使得系统组件可以独立升级。
*   **语言无关性**：支持大多数主流编程语言（Java, Python, C++, Go, C#, Ruby, JavaScript 等）。

## 二、Protocol Buffers 的核心概念

### 2.1 Interface Definition Language (IDL) - `.proto` 文件

Protobuf 的核心是 `.proto` 文件，它使用一种简洁的**接口定义语言 (IDL)** 来描述数据结构。开发者在 `.proto` 文件中定义 `message` 类型，类似于编程语言中的类或结构体。

**示例：**

```protobuf
syntax = "proto3"; // 指定 Protobuf 版本

package tutorial; // 定义包名，避免命名冲突

message Person {
  string name = 1;
  int32 id = 2;
  bool has_email = 3; // 字段定义：类型 字段名 = 字段编号;

  enum PhoneType { // 定义枚举类型
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber { // 可以定义嵌套消息
    string number = 1;
    PhoneType type = 2;
  }

  repeated PhoneNumber phones = 4; // repeated 表示可以有零个或多个该类型的字段
}
```

### 2.2 Message Types (消息类型)

`message` 是 Protobuf 中最基本的数据结构单元。它由一系列命名字段组成，每个字段都有一个类型和一个唯一的字段编号。

### 2.3 字段规则与数据类型

#### 2.3.1 字段规则 (Field Rules)

在 `proto2` 中，字段规则有 `required`, `optional`, `repeated`。
*   `required`：字段必须被设置。如果未设置，序列化时会出错。
*   `optional`：字段可有可无。如果未设置，则使用默认值。
*   `repeated`：字段可以重复任意次数（包括零次），相当于数组或列表。

在 `proto3` 中，简化了字段规则：
*   **默认隐式可选**：所有非 `repeated` 的字段都是 `optional` 的，且没有 `required` 关键字。如果赋值为字段类型的默认值（例如 `int32` 为 0，`string` 为空字符串，`bool` 为 `false`），它在序列化时不会被编码，从而节省空间。
*   `repeated`：与 `proto2` 相同，表示列表或数组。

#### 2.3.2 数据类型 (Scalar Types)

Protobuf 提供了丰富的标量数据类型，对应到不同编程语言会有相应的映射：

| Protobuf 类型 | 备注                                     | 对应 Python 类型    | 对应 Java 类型      | 对应 Go 类型      |
| :------------ | :--------------------------------------- | :------------------ | :------------------ | :---------------- |
| `double`      | 双精度浮点数                             | `float`             | `double`            | `float64`         |
| `float`       | 单精度浮点数                             | `float`             | `float`             | `float32`         |
| `int32`       | 32 位整数 (使用变长编码，负数效率低)        | `int`               | `int`               | `int32`           |
| `int64`       | 64 位整数 (使用变长编码，负数效率低)        | `int`               | `long`              | `int64`           |
| `uint32`      | 32 位无符号整数 (使用变长编码)             | `int`               | `int`               | `uint32`          |
| `uint64`      | 64 位无符号整数 (使用变长编码)             | `int`               | `long`              | `uint64`          |
| `sint32`      | 32 位有符号整数 (使用 ZigZag 编码，负数效率高) | `int`               | `int`               | `int32`           |
| `sint64`      | 64 位有符号整数 (使用 ZigZag 编码，负数效率高) | `int`               | `long`              | `int64`           |
| `fixed32`     | 32 位固定长度整数                        | `int`               | `int`               | `uint32`          |
| `fixed64`     | 64 位固定长度整数                        | `int`               | `long`              | `uint64`          |
| `sfixed32`    | 32 位有符号固定长度整数                  | `int`               | `int`               | `int32`           |
| `sfixed64`    | 64 位有符号固定长度整数                  | `int`               | `long`              | `int64`           |
| `bool`        | 布尔值                                   | `bool`              | `boolean`           | `bool`            |
| `string`      | UTF-8 编码的文本字符串                   | `str`               | `String`            | `string`          |
| `bytes`       | 任意字节序列                             | `bytes`             | `ByteString`        | `[]byte`          |

**注意**：`int32`, `int64`, `uint32`, `uint64` 使用 `varint` 变长编码，对于小数值非常高效，但对于负数，`int32` 和 `int64` 会占用 10 个字节。因此，如果字段值可能为负且数值范围较大，建议使用 `sint32` 或 `sint64`，它们使用 ZigZag 编码，对负数同样高效。

### 2.4 字段编号 (Field Numbers)

每个字段声明时都会有一个**唯一的字段编号**（例如 `name = 1;` 中的 `1`）。这个编号在序列化时用于标识字段，而不是字段名。这是 Protobuf 实现**Schema 演进**的关键。

*   **规则**：字段编号必须在 1 到 536,870,911 之间。1 到 15 的编号需要一个字节编码，16 到 2047 需要两个字节。因此，对于频繁出现或数量较大的字段，应使用 1 到 15 的编号以优化性能。不应使用 19000 到 19999 的编号，这是 Protobuf 内部保留的。
*   **重要性**：一旦定义，**字段编号绝不能更改**。删除某个字段后，在将来也不应重新使用该字段编号，以避免与旧数据发生冲突。

### 2.5 序列化和反序列化

当数据从应用程序写入时，Protobuf 会根据 Schema 定义和字段类型，将其编码为紧凑的**二进制格式**。反之，当读取数据时，Protobuf 会将二进制数据解码回应用程序中的数据对象。

### 2.6 代码生成 (Code Generation)

Protobuf 最大的特点是其**代码生成**机制。开发者使用 `protoc` (Protobuf 编译器) 对 `.proto` 文件进行编译，生成目标语言（如 Python, Java, Go）的源代码文件。这些生成的代码包含了与 message 类型对应的类或结构体，以及方便的 getter/setter 方法和序列化/反序列化方法。

### 2.7 Schema 演进 (Schema Evolution)

Protobuf 的 Schema 演进能力非常强大，允许你在不破坏现有数据兼容性的前提下修改数据结构：

*   **新增字段**：可以添加新的字段，只要分配一个新的、未使用的字段编号。旧的程序读取新数据时会忽略这些新字段；新的程序读取旧数据时，新字段将使用其默认值。
*   **删除字段**：可以删除字段，但其字段编号不能再被使用。新程序读取旧数据时会忽略该字段；旧程序读取新数据时会忽略已删除的字段。
*   **修改字段类型**：某些类型兼容性修改是允许的（例如 `int32` 改为 `int64`），但通常不推荐，因为它可能会导致数据丢失或解析错误。多数类型之间的更改是不兼容的。
*   **重命名字段**：允许重命名字段，只要字段编号保持不变即可，因为序列化时只依赖字段编号。
*   **添加 `oneof` 字段**：允许在 `oneof` 中添加新成员。
*   **添加 `enum` 值**：可以添加新的枚举值。

## 三、Protobuf 的优势与劣势

### 3.1 优势

*   **高效紧凑**：二进制格式相比 XML/JSON 大幅减少数据体积，节省带宽和存储。
*   **序列化速度快**：二进制编码和解码速度远超文本格式。
*   **强类型**：`.proto` 文件定义了严格的类型和结构，减少了运行时错误。
*   **Schema 演进**：通过字段编号实现向前和向后兼容性，方便系统升级和协调。
*   **跨语言支持**：生成的代码可以在多种编程语言中使用，实现无缝的跨语言数据交换。
*   **自动代码生成**： `protoc` 简化了开发，减少了手动编写序列化代码的工作量和出错率。
*   **广泛应用于 RPC**：是 gRPC 的基础，是构建高性能分布式系统的理想选择。

### 3.2 劣势

*   **非人类可读**：二进制格式不方便直接查看和调试，需要专门的工具或反序列化才能理解。
*   **需要代码生成**：每次修改 `.proto` 文件后都需要重新编译并生成代码，这对于脚本语言或需要高度动态 Schema 的场景可能不够灵活。
*   **缺乏自描述性**：Protobuf 编码的数据本身不包含 Schema 信息（不像 Avro Data File），读取方必须拥有相同的 `.proto` 定义才能正确解析数据。
*   **学习曲线**：对于不熟悉 IDL 和代码生成流程的开发者来说，可能需要一定的学习时间。
*   **无内置联合类型/Any 值**：虽然 `oneof` 可以模拟联合类型，但没有 Avro 那样灵活的 `union` 类型或 `Any` 类型（尽管 Protobuf 提供了 `google.protobuf.Any` 类型的特殊消息来解决这个问题，但使用起来比原生 `union` 更复杂）。

## 四、Protobuf 与其他数据格式的比较

| 特性 / 格式       | Protocol Buffers                                 | Apache Avro                                      | JSON                                             |
| :---------------- | :----------------------------------------------- | :----------------------------------------------- | :----------------------------------------------- |
| **Schema**        | **强制要求**，自定义 IDL (`.proto`) 定义，需代码生成。 | **强制要求**，JSON 定义，可嵌入数据或注册表管理。 | **可选/无**，通常依靠约定。                    |
| **数据格式**      | **紧凑二进制**。                                | **紧凑二进制**，行式存储。                 | **文本 (UTF-8)**，人类可读。                     |
| **Schema 演进**   | **良好** (基于字段 ID，兼容性强)。            | **强大** (读写 Schema 兼容性处理，支持 Union)。| **灵活但无内置支持**，需手动处理兼容性。          |
| **代码生成**      | **强制**。                                    | **可选** (动态解析，脚本语言无需)。        | **无**。                                         |
| **RPC 支持**      | **内置 (gRPC)**。                               | **内置**。                                | **无** (通常与 HTTP/REST 结合)。                   |
| **易读性**        | 差 (二进制)。                                | 差 (二进制)。                                | **高** (文本)。                                |
| **大小/性能**     | **优异**。                                    | **优异**，可能略小于 Protobuf。                 | 差。                                         |
| **自描述性**      | 差 (数据不包含 Schema)。                        | **高** (Avro Data File 包含 Schema)。            | 差 (文本不包含 Schema 结构)。                 |
| **典型应用**      | 微服务间通信 (gRPC)、数据存储、网络协议。       | 大数据存储、流处理、Kafka 消息、数据湖。    | Web API、配置文件、浏览器与服务器数据交换。             |

## 五、Protobuf 工作原理 (Workflow)

Protobuf 的工作流程通常包含以下几个步骤：

{% mermaid %}
graph TD
    %% --- 开发阶段 ---
    subgraph DevTime ["1. Development Time"]
        direction TB
        ProtoFile["📄 <b>Definition</b><br/>Write .proto file"] 
        Protoc[["⚙️ <b>Protoc Compiler</b><br/>Generate Code"]]
        GenCode["📦 <b>Generated Classes</b><br/>(Java, Go, Python, etc.)"]

        ProtoFile --> Protoc
        Protoc --> GenCode
    end

    %% --- 运行阶段：发送方 ---
    subgraph Sender ["2. Runtime: Sender"]
        direction TB
        AppA["💻 Application A"]
        ObjA["Object (Data)"]
        Serialize["<b>Serialize</b><br/>(toBinary)"]

        AppA --> ObjA
        ObjA --> Serialize
    end

    %% --- 传输媒介 ---
    subgraph Transport ["Binary Stream (传输层)"]
        direction LR
        Wire{"01010110... <br/> (Protobuf Binary Payload)"}
    end

    %% --- 运行阶段：接收方 ---
    subgraph Receiver ["3. Runtime: Receiver"]
        direction TB
        Deserialize["<b>Deserialize</b><br/>(parseFrom)"]
        ObjB["Reconstructed Object"]
        AppB["💻 Application B"]

        Deserialize --> ObjB
        ObjB --> AppB
    end

    %% --- 逻辑连接 ---
    GenCode -.->|Import| AppA
    GenCode -.->|Import| AppB
    
    Serialize ==> Wire
    Wire ==> Deserialize

{% endmermaid %}

1.  **定义 `.proto` 文件**：首先，开发者编写 `.proto` 文件，使用 Protobuf 的 IDL 来定义消息 (`message`) 的结构、字段和类型。
2.  **编译 `.proto` 文件**：使用 `protoc` 编译器将 `.proto` 文件编译成目标编程语言（如 Python, Java, Go）的源代码。这些生成的代码包含了对应消息类型的类或结构体，以及用于设置字段、序列化和反序列化数据的方法。
3.  **应用程序中使用生成的代码**：在应用程序中，开发者可以使用生成的代码来创建消息实例，设置其字段值。
4.  **序列化数据**：调用消息实例的序列化方法，将其转换为紧凑的二进制字节流。
5.  **传输或存储**：将序列化后的二进制数据通过网络传输给其他服务，或存储到文件/数据库中。
6.  **反序列化数据**：接收方应用程序获取到二进制数据后，使用其对应语言中生成的代码来调用反序列化方法，将二进制数据解码并重建为消息实例（数据对象）。
7.  **处理数据**：应用程序可以像处理普通对象一样访问消息实例的字段，进行业务逻辑处理。

## 六、代码示例 (Python)

这里我们以 Python 为例，演示如何使用 Protobuf。

### 6.1 定义 Protobuf Schema (`person.proto`)

创建一个名为 `person.proto` 的文件：

```protobuf
syntax = "proto3";

package example;

message Person {
  string name = 1;
  int32 id = 2; // Unique ID for the person
  string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    string number = 1;
    PhoneType type = 2;
  }

  repeated PhoneNumber phones = 4;
}

message AddressBook {
  repeated Person people = 1;
}
```

### 6.2 编译 `.proto` 文件

首先，确保你已经安装了 Protobuf 编译器 `protoc`。安装方法可以参考 Protobuf 官方文档 [<sup>1</sup>](https://grpc.io/docs/protoc-installation/)。

然后，在 `person.proto` 文件所在的目录执行以下命令，为 Python 生成代码：

```bash
protoc --python_out=. person.proto
```

这会生成一个名为 `person_pb2.py` 的文件。这个文件中包含了 Python 版本的 `Person` 和 `AddressBook` 消息类。

### 6.3 Python 示例代码 (`main.py`)

现在，我们可以使用生成的 `person_pb2.py` 文件来序列化和反序列化数据。

```python
import person_pb2 # 导入生成的 Protocol Buffers 模块

# 1. 创建并填充 Person 消息
person = person_pb2.Person()
person.name = "John Doe"
person.id = 1234
person.email = "john.doe@example.com"

# 添加电话号码
phone1 = person.phones.add()
phone1.number = "555-1234"
phone1.type = person_pb2.Person.PhoneType.MOBILE

phone2 = person.phones.add()
phone2.number = "555-5678"
phone2.type = person_pb2.Person.PhoneType.HOME

print("--- 原始 Person 消息 ---")
print(f"Name: {person.name}")
print(f"ID: {person.id}")
print(f"Email: {person.email}")
for phone in person.phones:
    print(f"Phone: {phone.number} ({person_pb2.Person.PhoneType.Name(phone.type)})")

# 2. 序列化消息到字节串
# 将消息序列化为二进制格式
serialized_data = person.SerializeToString()
print(f"\n--- 序列化后的二进制数据 ({len(serialized_data)} bytes) ---")
print(serialized_data) # 输出的是字节串，非人类可读

# 3. 反序列化字节串到新的 Person 消息对象
new_person = person_pb2.Person()
new_person.ParseFromString(serialized_data) # 从二进制数据解析

print("\n--- 反序列化后的 New Person 消息 ---")
print(f"Name: {new_person.name}")
print(f"ID: {new_person.id}")
print(f"Email: {new_person.email}")
for phone in new_person.phones:
    print(f"Phone: {phone.number} ({person_pb2.Person.PhoneType.Name(phone.type)})")

# 4. 演示 AddressBook 消息以及文件存取
address_book = person_pb2.AddressBook()
address_book.people.append(person) # 将之前创建的 person 添加到 AddressBook

# 创建另一个 Person
person2 = person_pb2.Person()
person2.name = "Jane Smith"
person2.id = 5678
person2.email = "jane.smith@example.com"
phone3 = person2.phones.add()
phone3.number = "555-4321"
phone3.type = person_pb2.Person.PhoneType.WORK
address_book.people.append(person2)

# 序列化 AddressBook 并保存到文件
file_name = "addressbook.dat"
with open(file_name, "wb") as f:
    f.write(address_book.SerializeToString())
print(f"\nAddressBook 已序列化并保存到 {file_name}")

# 从文件反序列化 AddressBook
new_address_book = person_pb2.AddressBook()
with open(file_name, "rb") as f:
    new_address_book.ParseFromString(f.read())
print(f"\n--- 从文件反序列化后的 AddressBook ---")
for p in new_address_book.people:
    print(f"  Name: {p.name}, ID: {p.id}")
    for phone in p.phones:
        print(f"    Phone: {phone.number} ({person_pb2.Person.PhoneType.Name(phone.type)})")
```

**运行步骤：**

1.  保存 `person.proto` 文件。
2.  执行 `protoc --python_out=. person.proto` 生成 `person_pb2.py`。
3.  保存 `main.py` 文件。
4.  执行 `python main.py`。

你将看到 Protobuf 消息的创建、序列化、反序列化以及文件存取的详细输出。

## 七、总结

Protocol Buffers 提供了一种高效、可靠且维护性强的数据序列化解决方案。其强类型定义、紧凑的二进制格式和强大的 Schema 演进能力，使其成为构建高性能、分布式系统和跨语言通信的理想选择。尽管它牺牲了部分人类可读性和动态性，但通过代码生成带来的开发效率和运行时性能的提升，以及与 gRPC 的深度集成，使其在当今的软件开发领域，尤其是在微服务和大数据后端系统中占据着举足轻重的地位。 理解并掌握 Protobuf 是现代软件工程师必备的技能之一。