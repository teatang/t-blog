---
title: Python 结构化模式匹配 (Structural Pattern Matching) 深度详解
date: 2024-04-17 06:24:00
tags: 
    - 2024
    - Python
    - 编程语法
    - 程序设计
    - 函数式编程
categories: 
    - Python
    - 程序设计
---

> **Python 的结构化模式匹配 (Structural Pattern Matching)** 是在 **Python 3.10** 中引入的一项强大新特性，灵感来源于其他函数式编程语言。该特性通过 `match` 和 `case` 语句，提供了一种简洁、富有表现力的方式来根据数据结构和值进行分支逻辑处理。它不仅是对传统 `if/elif/else` 语句的补充，更是一种处理复杂数据结构（如列表、字典、对象）的新范式，能够显著提高代码的可读性、可维护性和健壮性。

{% note info %}
**核心思想**：模式匹配允许你将一个**主题 (subject)** 值与一系列**模式 (patterns)** 进行比较。当一个模式成功匹配主题值时，相关的代码块将被执行。在此过程中，模式还可以**解构 (destructure)** 主题值，并将其中的部分绑定到新的变量上，从而直接获取所需的数据。
{% endnote %}

## 一、为什么需要结构化模式匹配？背景与痛点

在 Python 3.10 之前，处理复杂的数据结构，特别是当需要根据其形状、类型或包含的值进行条件判断时，代码往往会变得冗长且难以阅读。例如，考虑处理来自不同来源的 JSON 数据，或者解析命令行参数，传统的方法通常涉及：

1.  **大量的 `if/elif/else` 语句**：用于检查类型、长度、键是否存在、值是否相等。
2.  **嵌套的条件判断**：当数据结构有多层时，代码缩进会很深，逻辑难以追踪。
3.  **手动解构**：通过索引或键访问，通常需要额外的变量赋值。
4.  **缺乏表达力**：无法直观地表达“如果这个数据看起来像这样，就执行这段代码”的意图。

**示例 (处理一个简单的命令列表，不使用模式匹配)：**

```python
def process_command_legacy(command):
    if isinstance(command, list) and len(command) > 0:
        cmd_name = command[0]
        if cmd_name == "quit":
            print("Exiting application.")
            return True
        elif cmd_name == "load":
            if len(command) == 2 and isinstance(command[1], str):
                filename = command[1]
                print(f"Loading file: {filename}")
                return True
            else:
                print("Error: 'load' command requires a filename.")
        elif cmd_name == "move":
            if len(command) == 3 and all(isinstance(x, int) for x in command[1:]):
                x, y = command[1], command[2]
                print(f"Moving to ({x}, {y})")
                return True
            else:
                print("Error: 'move' command requires two integer coordinates.")
    print(f"Unknown command or invalid format: {command}")
    return False

# 传统方式调用
process_command_legacy(["quit"])
process_command_legacy(["load", "data.json"])
process_command_legacy(["move", 10, 20])
process_command_legacy(["move", "invalid", 20])
process_command_legacy(["save"])
```
可以看到，即使是一个相对简单的命令处理，代码也显得有些冗长和嵌套。模式匹配正是为了解决这种“看形状、取数据、做判断”的场景而设计。

## 二、`match` 和 `case` 语句的基本语法

结构化模式匹配的核心是 `match` 语句，它接受一个**主题 (subject)** 表达式，然后与多个 `case` 模式进行比较。

```python
match subject:
    case pattern_1:
        # 当 subject 匹配 pattern_1 时执行
        pass
    case pattern_2:
        # 当 subject 匹配 pattern_2 时执行
        pass
    case pattern_N:
        # 当 subject 匹配 pattern_N 时执行
        pass
    case _:
        # 可选：捕获所有不匹配任何模式的情况 (默认匹配)
        pass
```

**工作原理**：
1.  `match` 语句评估 `subject` 表达式的值。
2.  Python 尝试将 `subject` 逐个与 `case` 语句中的 `pattern` 进行匹配。
3.  第一个成功匹配的 `case` 块将被执行。
4.  如果没有任何 `case` 匹配成功，且存在 `case _` (通配符模式)，则执行 `case _` 后面的代码块。
5.  匹配过程是从上到下进行的，一旦找到匹配的 `case`，其余的 `case` 将被跳过（即使它们也能匹配）。

## 三、模式的类型与详解

模式匹配支持多种模式类型，可以组合使用来处理复杂的结构。

### 3.1 1. 字面量模式 (Literal Patterns)

匹配确切的字面量值。

```python
def check_status(status_code):
    match status_code:
        case 200:
            print("OK")
        case 404:
            print("Not Found")
        case 500:
            print("Internal Server Error")
        case _: # 通配符模式，匹配所有其他情况
            print(f"Unknown status: {status_code}")

check_status(200) # Output: OK
check_status(404) # Output: Not Found
check_status(403) # Output: Unknown status: 403
```

### 3.2 2. 通配符模式 (Wildcard Pattern) - `_`

`_` (下划线) 是一个特殊的模式，它总是匹配任何值，并且不绑定任何变量。常用于作为默认匹配项或忽略某个不关心的部分。

```python
match (1, 2, 3):
    case (1, _, _): # 匹配第一个元素是1的长度为3的元组
        print("Starts with 1")
    case (_, 2, _): # 匹配第二个元素是2的长度为3的元组
        print("Second element is 2") # 这里不会执行，因为第一个匹配已经被接受
    case _:
        print("Fallback")

# Output: Starts with 1
```

### 3.3 3. 捕获模式 (Capture Patterns)

通过一个变量名来匹配任何值，并将匹配到的值绑定到该变量上。

```python
def process_message(message):
    match message:
        case ["LOG", level, text]: # 匹配列表，将第二个元素绑定到 level，第三个绑定到 text
            print(f"[{level.upper()}] {text}")
        case ["ERROR", code]:
            print(f"Error occurred: {code}")
        case ["ALERT", msg] if "urgent" in msg.lower(): # 带有 guard 的捕获模式
            print(f"!!! URGENT ALERT: {msg} !!!")
        case cmd: # 捕获任何不匹配其他模式的值到 cmd 变量
            print(f"Unrecognized command: {cmd}")

process_message(["LOG", "info", "User logged in"]) # Output: [INFO] User logged in
process_message(["ERROR", 503]) # Output: Error occurred: 503
process_message(["ALERT", "System reboot initiated (urgent)"]) # Output: !!! URGENT ALERT: System reboot initiated (urgent) !!!
process_message("Just text") # Output: Unrecognized command: Just text
```

### 3.4 4. 序列模式 (Sequence Patterns)

匹配列表或元组等序列类型。可以指定长度、元素值以及使用捕获模式。

```python
def process_data(data):
    match data:
        case [item1, item2]: # 匹配长度为2的序列，并捕获两个元素
            print(f"Two items: {item1} and {item2}")
        case [head, *tail]: # 匹配至少一个元素的序列，捕获第一个元素和其余部分
            print(f"Head: {head}, Tail: {tail}")
        case []: # 匹配空序列
            print("Empty list/tuple")
        case _:
            print("Not a sequence or unsupported sequence.")

process_data([10, 20])      # Output: Two items: 10 and 20
process_data(("a", "b", "c")) # Output: Head: a, Tail: ('b', 'c')
process_data([])            # Output: Empty list/tuple
process_data("hello")       # Output: Not a sequence or unsupported sequence. (字符串也是序列，但此处为示例)
```
注意：`*name` 只能在序列模式中出现一次，且必须是可迭代的尾部。

### 3.5 5. 映射模式 (Mapping Patterns)

匹配字典类型。可以检查键是否存在，并捕获对应的值。

```python
def handle_event(event):
    match event:
        case {"type": "click", "x": x, "y": y}: # 匹配 type 为 "click" 且包含 x, y 键的字典
            print(f"Click at ({x}, {y})")
        case {"type": "login", "user": user, "timestamp": ts}:
            print(f"User '{user}' logged in at {ts}")
        case {"type": "error", "message": msg, **rest}: # 捕获其余的键值对到 rest
            print(f"Error: {msg}, Details: {rest}")
        case _:
            print(f"Unknown event: {event}")

handle_event({"type": "click", "x": 100, "y": 200})
# Output: Click at (100, 200)
handle_event({"type": "login", "user": "alice", "timestamp": "2024-07-28"})
# Output: User 'alice' logged in at 2024-07-28
handle_event({"type": "error", "message": "Failed", "code": 500, "severity": "high"})
# Output: Error: Failed, Details: {'code': 500, 'severity': 'high'}
```
注意：`**name` 只能在映射模式中出现一次，且必须捕获所有剩余的键值对。

### 3.6 6. 类模式 (Class Patterns)

匹配对象的类型和属性。这是模式匹配最强大的功能之一。

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Point({self.x}, {self.y})"

class Circle:
    def __init__(self, center, radius):
        self.center = center
        self.radius = radius

    def __repr__(self):
        return f"Circle({self.center}, {self.radius})"

def identify_shape(shape):
    match shape:
        case Point(x=0, y=0): # 匹配 x=0 且 y=0 的 Point 对象
            print("Origin point")
        case Point(x=x, y=y) if x == y: # 匹配 x=y 的 Point 对象，并捕获 x, y
            print(f"Point on diagonal: ({x}, {y})")
        case Point(x, y): # 匹配任意 Point 对象，并按顺序捕获属性 x, y
            print(f"Any point at ({x}, {y})")
        case Circle(center=Point(0, 0), radius=r): # 嵌套模式：匹配中心是原点的 Circle
            print(f"Circle centered at origin with radius {r}")
        case Circle(Point(cx, cy), r): # 匹配任意 Circle 对象，并解构其属性
            print(f"Circle at ({cx}, {cy}) with radius {r}")
        case _:
            print("Unknown shape")

identify_shape(Point(0, 0)) # Output: Origin point
identify_shape(Point(5, 5)) # Output: Point on diagonal: (5, 5)
identify_shape(Point(10, 20)) # Output: Any point at (10, 20)
identify_shape(Circle(Point(0, 0), 10)) # Output: Circle centered at origin with radius 10
identify_shape(Circle(Point(3, 4), 5)) # Output: Circle at (3, 4) with radius 5
identify_shape("not a shape") # Output: Unknown shape
```

**类模式的匹配规则**：
*   `case ClassName(arg1, arg2, ...)`：位置参数模式。如果类定义了 `__match_args__` 属性，那么 `arg1` 等将按顺序匹配 `__match_args__` 中指定的属性。
*   `case ClassName(attr=value, ...)`：关键字参数模式。直接匹配对象的属性。
*   可以嵌套类模式，实现更深层次的解构。

### 3.7 7. OR 模式 (`|`)

使用 `|` 运算符来组合多个模式，只要其中任何一个匹配成功即可。

```python
def get_color_type(color):
    match color:
        case "red" | "green" | "blue":
            print("Primary color")
        case "yellow" | "purple" | "orange":
            print("Secondary color")
        case _:
            print("Other color")

get_color_type("red")    # Output: Primary color
get_color_type("orange") # Output: Secondary color
get_color_type("black")  # Output: Other color
```

### 3.8 8. AS 模式 (`as`)

在匹配成功后，将整个匹配到的值绑定到一个变量上，同时也可以进行模式匹配。

```python
def process_point(coord):
    match coord:
        case (int() as x, int() as y) if x == y: # 匹配两个整数，且相等，同时捕获到 x, y
            print(f"Point on diagonal: ({x}, {y})")
        case Point(x, y) as p: # 匹配 Point 对象，捕获其 x, y 属性，并将整个对象捕获到 p
            print(f"Matched Point object: {p} (x={x}, y={y})")
        case _:
            print("Not a matching point.")

process_point((5, 5))      # Output: Point on diagonal: (5, 5)
process_point(Point(1, 2)) # Output: Matched Point object: Point(1, 2) (x=1, y=2)
```

### 3.9 9. Guard (守卫) - `if` 子句

在 `case` 模式后面可以添加一个 `if` 子句，作为额外的条件。只有当模式匹配成功**且** `if` 条件为真时，该 `case` 块才会被执行。

```python
def handle_num(value):
    match value:
        case int() if value > 0:
            print(f"Positive integer: {value}")
        case int() if value < 0:
            print(f"Negative integer: {value}")
        case 0:
            print("Zero")
        case _:
            print(f"Non-integer value: {value}")

handle_num(10)   # Output: Positive integer: 10
handle_num(-5)   # Output: Negative integer: -5
handle_num(0)    # Output: Zero
handle_num(3.14) # Output: Non-integer value: 3.14
```

## 四、结构化模式匹配的用例与最佳实践

### 4.1 1. 解析命令或配置

这是模式匹配最经典的用例之一。

```python
def execute_command(command_tuple):
    match command_tuple:
        case ("quit",):
            print("Exiting application.")
            return True
        case ("load", filename):
            print(f"Loading file: {filename}")
        case ("move", x, y) if isinstance(x, int) and isinstance(y, int):
            print(f"Moving to ({x}, {y})")
        case ("update", key, value):
            print(f"Updating {key} to {value}")
        case ("help", cmd_name):
            print(f"Displaying help for '{cmd_name}'.")
        case ("help",):
            print("Displaying general help.")
        case _:
            print(f"Unknown command: {command_tuple}")
    return False

execute_command(("quit",))
execute_command(("load", "config.ini"))
execute_command(("move", 100, 200))
execute_command(("move", "abc", 123)) # Unknown command: ('move', 'abc', 123)
execute_command(("help", "load"))
execute_command(("help",))
execute_command(("save", "backup.cfg"))
```

### 4.2 2. 类型检查和数据解构

根据对象的类型和结构进行操作。

```python
def process_item(item):
    match item:
        case str(name) if len(name) > 5:
            print(f"Long string: {name}")
        case int(val) if val < 0:
            print(f"Negative integer: {val}")
        case {"id": item_id, "status": "active"}:
            print(f"Active item with ID: {item_id}")
        case (x, y): # 匹配任何二元组
            print(f"Coordinate: ({x}, {y})")
        case _:
            print(f"Unhandled item type: {type(item).__name__} for {item}")

process_item("hello world")
process_item(-100)
process_item({"id": "sku123", "status": "active"})
process_item({"id": "sku456", "status": "inactive"}) # Output: Unhandled item type: dict for {'id': 'sku456', 'status': 'inactive'}
process_item((10, 20))
```

### 4.3 3. 简化枚举或常量处理

```python
from enum import Enum

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3
    YELLOW = 4

def get_color_category(color_enum):
    match color_enum:
        case Color.RED | Color.GREEN | Color.BLUE:
            print("Primary Color")
        case Color.YELLOW:
            print("Secondary Color")
        case _:
            print("Unknown Color")

get_color_category(Color.RED)   # Output: Primary Color
get_color_category(Color.YELLOW) # Output: Secondary Color
```

## 五、模式匹配的设计哲学与注意事项

### 5.1 1. 匹配的是结构和值，而不是任意表达式

`case` 后面的模式不是任意的 Python 表达式。它们是专门的模式语法，用于匹配并解构数据。

```python
x = 10
match 20:
    case x: # WARNING: 这不是匹配 subject == x，而是将 20 捕获到 x 变量！
            # 这会覆盖外部的 x 变量，且 x 总是匹配成功。
        print(f"Matched {x}") # Output: Matched 20
```
**正确做法**：如果想匹配一个变量的值，需要使用 `if` 守卫或者将变量作为字面量表达式（例如使用常量）。
```python
x = 10
match 20:
    case val if val == x: # 使用 if 守卫
        print(f"Matched {val} with x")
    case _:
        print("Did not match x")

# 当然，直接匹配字面量 10 才是最常见的用法
match 10:
    case 10: print("Matched 10")
```
为了避免这种混淆，Python 模式匹配规定，在模式中，小写字母开头的裸名变量总是作为捕获模式，除非它是一个单下划线 `_`。为了引用外部的变量，需要使用守卫 `if` 子句，或者将其包裹在像 `Enum` 成员或常量那样的方式。

### 5.2 2. 模式是从上往下匹配，且只匹配一次

确保 `case` 的顺序是正确的。更具体的模式应该放在更宽泛的模式之前。

```python
match (1, 2):
    case (x, y): # 这个模式会匹配所有长度为2的元组
        print(f"Any pair: {x}, {y}")
    case (1, 2): # 这个模式永远不会被执行
        print("Specific pair (1, 2)")

# Output: Any pair: 1, 2
```

### 5.3 3. 对现有代码的提升

结构化模式匹配不会替换所有的 `if/elif/else` 语句。它最适合于处理：
*   **复杂数据结构的类型和值检查**。
*   **解构数据并提取其中的部分**。
*   **有明显“形状”或“类型”区别的多种情况**。

对于简单的布尔条件，传统的 `if/elif/else` 仍然是更直观的选择。

### 5.4 4. 可扩展性

虽然类模式提供了强大的解构能力，但如果一个类没有 `__match_args__` 定义，位置模式将无法工作。只有关键字模式可以用于任意对象属性。

### 5.5 5. QPACK 与 HPACK (非编程上下文)

在之前的 HTTP/3 讨论中提到了 `QPACK` 和 `HPACK`，它们是 HTTP 协议中的头部压缩算法。虽然它们的名字中都包含“PACK”，并且都提到了“字典”，但它们与 Python 的结构化模式匹配完全无关，请勿混淆。Python 的模式匹配是语言层面的语法，用于逻辑分支和数据解构。

## 六、总结

Python 3.10 引入的结构化模式匹配，通过 `match/case` 语句，为 Python 开发者提供了一种优雅且强大的工具，用于处理复杂的数据结构和实现基于数据形状的逻辑分支。它显著提高了代码的可读性和表达力，特别是在处理例如解析命令、API 响应、配置文件或对象类型时。

掌握模式匹配能让你：
*   编写更简洁、易于理解的代码。
*   更安全地解构数据，减少错误。
*   更好地表达代码的意图，即“当数据看起来像这样时，这样做”。

虽然像任何新特性一样，学习和适应需要时间，但在适当的场景中，结构化模式匹配无疑会成为 Python 编程中的一把利器。