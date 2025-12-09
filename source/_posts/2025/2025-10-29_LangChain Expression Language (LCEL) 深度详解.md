---
title: LangChain Expression Language (LCEL) 深度详解
date: 2025-10-29 06:24:00
tags:
  - 2025
  - LangChain
  - AI
  - LLM
categories:
  - AI
  - 开发框架
---

> **LangChain Expression Language (LCEL)** 是 LangChain 框架中一种强大、灵活且声明式的编程范式，用于构建和编排复杂的链 (Chains) 和代理 (Agents)。它提供了一种简洁、易读且高性能的方式来组合 LangChain 的各种组件（如提示模板、大语言模型、输出解析器、检索器、自定义函数等），从而构建出端到端的 LLM 应用程序。

{% note info %}
核心思想：**LCEL 的核心在于提供一个统一的 `Runnable` 接口和管道操作符 (`|`)，允许开发者以类似 Unix 管道的方式将不同的组件连接起来。这种声明式组合方式不仅提高了代码的可读性和可维护性，还带来了自动化的并行处理、流式传输、异步支持、类型安全以及与 LangSmith 等调试工具的深度集成等诸多优势。**
{% endnote %}
------

## 一、为什么选择 LCEL？

在 LCEL 出现之前，LangChain 主要通过传统的 `Chain` 类来构建应用程序。虽然这些 Chain 也有效，但 LCEL 解决了它们的一些局限性，并带来了显著的改进：

1.  **更简洁的语法和可读性**：LCEL 使用管道操作符 (`|`)，使得链式调用直观，像数据流一样从左到右流动，提高了代码的可读性。
2.  **默认的流式传输 (Streaming)**：LCEL 从设计之初就考虑了流式传输，使得构建能够实时响应的应用程序变得轻而易举，尤其适用于聊天机器人等交互式应用。
3.  **原生的异步支持**：LCEL 组件默认支持异步操作，可以通过 `await` 关键字高效地处理并发请求，提升性能。
4.  **自动化的并行化**：当链中存在可以独立运行的组件时（例如 `RunnableParallel`），LCEL 可以自动并行执行这些组件，从而显著减少端到端的延迟。
5.  **增强的调试和可观测性**：LCEL 与 LangSmith（LangChain 的调试和可观测性平台）深度集成。每个 LCEL 表达式都会在 LangSmith 中生成清晰的轨迹 (trace)，极大地简化了复杂链的调试和性能分析。
6.  **类型安全 (Type Safety)**：通过 `with_types()` 方法，LCEL 支持为链的输入和输出添加类型提示，从而在开发阶段捕获潜在的错误。
7.  **更强大的组合能力**：LCEL 提供了更丰富的组合原语（如并行、分支、回退），使得构建非常复杂的逻辑成为可能。

简而言之，LCEL 是 LangChain 推荐的、更现代、更强大、更高效的构建 LLM 应用程序的方式。

## 二、LCEL 的核心概念

### 2.1 `Runnable` 接口

LCEL 的基石是 `Runnable` 接口。LangChain 中的所有核心组件——无论是 `PromptTemplate`、`LLM`、`BaseOutputParser` 还是其他 `Chain`——都实现了 `Runnable` 接口。
`Runnable` 接口定义了几个关键方法：

*   **`invoke(input, config=None)`**：同步调用组件，返回单个输出。
*   **`stream(input, config=None)`**：同步调用组件，以迭代器形式返回输出块，实现流式传输。
*   **`batch(inputs, config=None)`**：同步调用组件，处理一批输入并返回一批输出。
*   **`ainvoke(input, config=None)`**：异步调用组件，返回单个输出。
*   **`astream(input, config=None)`**：异步调用组件，以异步迭代器形式返回输出块。
*   **`abatch(inputs, config=None)`**：异步调用组件，处理一批输入并返回一批输出。

通过统一的 `Runnable` 接口，任何实现了它的组件都可以无缝地组合在一起。

### 2.2 管道操作符 (`|`)

LCEL 最具代表性的特征是其管道操作符 `|`。它允许您将两个 `Runnable` 组件连接起来，前一个组件的输出自动作为后一个组件的输入。这与 Unix shell 中的管道概念非常相似。

```python
# 示例： Prompt -> Model -> Parser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("讲一个关于{topic}的笑话。")
model = ChatOpenAI(model="gpt-4", temperature=0.7)
parser = StrOutputParser()

# 使用管道操作符连接组件
chain = prompt | model | parser

# 输入 "程序员"
# prompt 接收 "程序员" -> 生成完整提示
# model 接收完整提示 -> 生成 LLM 响应
# parser 接收 LLM 响应 -> 提取字符串
response = chain.invoke({"topic": "程序员"})
print(response)
```

### 2.3 `invoke()`, `stream()`, `batch()` 方法

每个 LCEL `Runnable` 都支持这三种主要的调用方式，以及它们的异步版本 (`ainvoke()`, `astream()`, `abatch()`)：

*   **`invoke()`**：最简单的调用方式，处理单个输入并返回单个最终输出。
*   **`stream()`**：以块的形式实时返回输出。对于 LLM，这意味着可以逐字或逐句地看到生成的内容，提高了用户体验。
*   **`batch()`**：处理多个输入，并返回对应的多个输出。这对于并行处理大量数据非常高效，可以减少多次 API 调用的开销。

**示例：流式传输**

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("给我写一个关于{animal}的短篇故事。")
model = ChatOpenAI(model="gpt-4", temperature=0.7)
parser = StrOutputParser()

story_chain = prompt | model | parser

print(f"--- 故事开始 (流式传输) ---")
for chunk in story_chain.stream({"animal": "太空猫"}):
    print(chunk, end="", flush=True)
print("\n--- 故事结束 ---")
```

## 三、Essential LCEL Components (基本组件)

LCEL 允许您将 LangChain 的任何 `Runnable` 组件组合起来。

### 3.1 Prompts (提示模板)

`PromptTemplate` 和 `ChatPromptTemplate` 都是 `Runnable`。它们将输入变量转换为适合 LLM 的完整提示。

*   `PromptTemplate.from_template()`：适用于文本模型。
*   `ChatPromptTemplate.from_messages()`：适用于聊天模型，支持系统消息、用户消息等多种消息类型。

```python
from langchain_core.prompts import ChatPromptTemplate
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的AI助手。"),
    ("user", "{question}")
])
```

### 3.2 Models (大语言模型)

包括 `LLM` 和 `ChatModel`（如 `ChatOpenAI`, `AnthropicLLM`, `GoogleGenerativeAI` 等）。

```python
from langchain_openai import ChatOpenAI
model = ChatOpenAI(model="gpt-4", temperature=0.0)
```

### 3.3 Output Parsers (输出解析器)

用于将 LLM 的原始输出结构化或格式化。

*   `StrOutputParser()`：将 LLM 输出直接转换为字符串。
*   `JsonOutputParser()`：尝试将 LLM 输出解析为 JSON 对象。
*   `PydanticOutputParser()`：结合 Pydantic 模型，强制 LLM 输出特定结构的数据。

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain.pydantic_v1 import BaseModel, Field

# 字符串解析器
str_parser = StrOutputParser()

# JSON 解析器
json_parser = JsonOutputParser()

# Pydantic 解析器
class Joke(BaseModel):
    setup: str = Field(description="The setup of the joke")
    punchline: str = Field(description="The punchline of the joke")
pydantic_parser = PydanticOutputParser(pydantic_object=Joke)
```

### 3.4 Retrievers (检索器)

RAG (检索增强生成) 架构的关键组件，用于从向量数据库等检索相关文档。

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# 假设已经有文档和向量存储
documents = [Document(page_content="LangChain 是一个LLM开发框架"), Document(page_content="LCEL 是 LangChain 的表达语言")]
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents, embeddings)
retriever = vectorstore.as_retriever()
```

### 3.5 Custom Functions / Lambdas (自定义函数和 Lambda)

您可以使用 `RunnableLambda` 或直接使用 `lambda` 函数将任何 Python 函数集成到 LCEL 链中。

```python
from langchain_core.runnables import RunnableLambda

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

formatter_runnable = RunnableLambda(format_docs)

# 或者直接使用 lambda
uppercase_lambda = lambda x: x.upper()
```

## 四、Building Complex Chains with LCEL Operators (使用 LCEL 操作符构建复杂链)

LCEL 不仅仅是顺序管道，它还提供了多种操作符来构建更复杂的逻辑。

### 4.1 Sequential Chaining (顺序链)

前面已经提到，使用 `|` 操作符连接。

### 4.2 Parallel Execution (`RunnableParallel`)

当您需要同时运行多个组件，并且它们的输出都将作为后续步骤的输入时，可以使用 `RunnableParallel`。它以字典的形式接收多个 `Runnable`，并以字典的形式返回它们的输出。

```python
from langchain_core.runnables import RunnableParallel

# 创建两个并行的链
context_chain = RunnableParallel(
    summary=RunnableLambda(lambda x: f"总结: {x['text'][:50]}..."),
    keywords=RunnableLambda(lambda x: f"关键词: {', '.join(x['text'].split()[:5])}")
)

# 示例输入
input_data = {"text": "这是一篇很长的文章，包含了很多重要的信息，我们需要从中提取关键点和总结。"}

# 运行并行链
output = context_chain.invoke(input_data)
print(output)
# Output: {'summary': '总结: 这是一篇很长的文章，包含了很多重要的信息，我们...', 'keywords': '关键词: 这是一篇很长的文章，包含了很多'}
```

### 4.3 Conditional Routing (`RunnableBranch`)

`RunnableBranch` 允许您根据条件将输入路由到不同的 `Runnable`。它接收一个列表，每个元素是 `(condition_runnable, branch_runnable)` 对，以及一个 `default_runnable`。

```python
from langchain_core.runnables import RunnableBranch

# 定义两个分支的条件和对应的 Runnable
# condition_runnable 返回 True/False
is_long_question = RunnableLambda(lambda x: len(x.get("question", "").split()) > 10)

long_answer_chain = RunnableLambda(lambda x: f"这是一个长问题的回答：{x['question']}...")
short_answer_chain = RunnableLambda(lambda x: f"这是一个短问题的回答：{x['question']}.")

branch = RunnableBranch(
    (is_long_question, long_answer_chain), # 如果是长问题，走这个分支
    short_answer_chain # 否则走默认分支
)

print(branch.invoke({"question": "地球的自转和公转有什么区别？请详细解释一下。"}))
print(branch.invoke({"question": "地球有多大？"}))
```

### 4.4 Adding Robustness (`with_fallbacks`)

`with_fallbacks()` 方法允许您为 `Runnable` 定义备用 (fallback) 方案。如果主 `Runnable` 失败，它会自动尝试执行备用 `Runnable`。

```python
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableLambda
import os

# os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

# 主模型（可能更快或更便宜）
fast_model = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
# 备用模型（可能更稳定或能力更强，但更慢或更贵）
robust_model = ChatOpenAI(model="gpt-4", temperature=0)

# 结合 fallbacks
# 如果 fast_model 调用失败，会尝试 robust_model
reliable_model_chain = (
    fast_model.with_fallbacks([robust_model])
)

try:
    # 正常情况下会使用 fast_model
    response = reliable_model_chain.invoke("你好，世界！")
    print(response.content)

    # 模拟 fast_model 失败 (例如，通过一个永远抛出异常的 Lambda)
    failing_runnable = RunnableLambda(lambda x: 1/0)
    test_chain = failing_runnable.with_fallbacks([RunnableLambda(lambda x: "Fallback worked!")])
    print(test_chain.invoke("test")) # 应该输出 "Fallback worked!"
except Exception as e:
    print(f"发生错误: {e}")
```

### 4.5 Binding Parameters (`bind`)

`bind()` 方法允许您将额外的参数绑定到 `Runnable`，这些参数将在运行时传递给底层组件。这对于设置工具调用 (`tool_choice`, `functions`)、日志 ID 或其他模型特定参数非常有用。

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool

# 定义一个工具
@tool
def multiply(a: int, b: int) -> int:
    """Multiplies two integers together."""
    return a * b

# 将工具绑定到模型
model_with_tools = ChatOpenAI(model="gpt-4", temperature=0).bind_tools([multiply])

# 创建一个提示和模型链
chain = ChatPromptTemplate.from_template("{question}") | model_with_tools

# 调用 chain，LLM 可以决定是否使用工具
response = chain.invoke({"question": "123 乘以 456 是多少？"})
print(response.content) # 可能会看到 LLM 调用工具的输出或直接给出答案
# output.tool_calls 可以在 Python 中进一步处理
```

### 4.6 Partial Application (`partial`)

`partial()` 方法允许您预填充 `Runnable` 的某些输入变量，从而创建一个新的 `Runnable`，它只需要更少的输入。

```python
from langchain_core.prompts import PromptTemplate

# 原始提示需要 'entity' 和 'action'
full_prompt = PromptTemplate.from_template("请为{entity}生成一个关于{action}的句子。")

# 偏函数应用：预设 'entity' 为 '用户'
partial_prompt = full_prompt.partial(entity="用户")

# 现在 partial_prompt 只需要 'action' 作为输入
sentence = partial_prompt.invoke({"action": "登录"})
print(sentence) # Output: PromptValue(messages=[HumanMessage(content='请为用户生成一个关于登录的句子。')])
```

## 五、Advanced LCEL Features (高级 LCEL 特性)

### 5.1 Native Streaming (原生流式传输)

LCEL 的 `stream()` 方法天然支持流式传输，对于构建实时交互的应用至关重要。

### 5.2 Asynchronous Support (异步支持)

所有 `Runnable` 都支持异步方法 (`ainvoke`, `astream`, `abatch`)，允许您在 `async/await` 环境中构建高性能的并发应用程序。

```python
import asyncio
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

async def async_example():
    prompt = ChatPromptTemplate.from_template("描述一下{topic}。")
    model = ChatOpenAI(model="gpt-4", temperature=0.7)
    parser = StrOutputParser()
    chain = prompt | model | parser

    # 异步流式传输
    async for chunk in chain.astream({"topic": "AI在医疗领域的应用"}):
        print(chunk, end="", flush=True)

    print("\n--- 异步完成 ---")

# 运行异步函数
# asyncio.run(async_example()) # 请自行执行此行
```

### 5.3 Type Safety with `with_types()` (使用 `with_types()` 实现类型安全)

`with_types()` 方法允许您为 `Runnable` 的输入和输出添加 Pydantic 类型提示，从而在运行时进行验证。这增强了代码的鲁棒性和可维护性。

```python
from langchain.pydantic_v1 import BaseModel, Field
from langchain_core.runnables import RunnableLambda

class InputModel(BaseModel):
    name: str = Field(description="The user's name")
    age: int = Field(description="The user's age")

class OutputModel(BaseModel):
    greeting: str = Field(description="A personalized greeting")
    age_category: str = Field(description="Category based on age")

def process_user_data(data: InputModel) -> OutputModel:
    age_cat = "young" if data.age < 30 else "adult"
    return OutputModel(greeting=f"Hello, {data.name}!", age_category=age_cat)

type_safe_processor = RunnableLambda(process_user_data).with_types(
    input_type=InputModel,
    output_type=OutputModel
)

# 正常调用
result = type_safe_processor.invoke({"name": "Alice", "age": 25})
print(result)

# 尝试错误输入 (例如，age 是字符串，会抛出 Pydantic ValidationError)
try:
    type_safe_processor.invoke({"name": "Bob", "age": "thirty"})
except Exception as e:
    print(f"输入类型错误捕获: {e}")
```

### 5.4 First-Class Observability (LangSmith)

LCEL 链与 LangSmith 原生集成。当您使用 LangSmith 跟踪您的应用程序时，每个 LCEL 表达式、每个 `Runnable` 的调用都会自动记录为一个步骤，这为理解和调试复杂链提供了无与伦比的洞察力。

## 六、Putting It All Together: A RAG Example (RAG 示例)

以下是一个使用 LCEL 构建的 RAG 链示例：

```python
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from operator import itemgetter

# os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

# 1. 初始化模型和嵌入
llm = ChatOpenAI(model="gpt-4", temperature=0)
embeddings = OpenAIEmbeddings()

# 2. 准备文档并创建检索器 (In-memory for simplicity)
docs = [
    Document(page_content="苹果公司由史蒂夫·乔布斯、史蒂夫·沃兹尼亚克和罗纳德·韦恩于1976年4月1日创立。"),
    Document(page_content="苹果公司最著名的产品包括iPhone、iPad和Mac系列电脑。"),
    Document(page_content="2023年，苹果发布了iPhone 15系列和Apple Vision Pro。"),
    Document(page_content="特斯拉由马丁·艾伯哈德和马克·塔彭宁于2003年创立，埃隆·马斯克后来成为其CEO。"),
    Document(page_content="特斯拉以其电动汽车和能源解决方案而闻名，如Model S、Model 3。")
]
vectorstore = Chroma.from_documents(docs, embeddings)
retriever = vectorstore.as_retriever()

# 3. 定义 RAG 提示模板
template = """根据以下上下文信息回答问题:
{context}

问题: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

# 4. 定义文档格式化函数
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# 5. 构建 RAG 链 (使用 LCEL 组合)
rag_chain = (
    {"context": retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 6. 运行 RAG 链
print("\n--- LCEL RAG 查询 ---")
question = "苹果公司的创始人是谁？"
response = rag_chain.invoke(question)
print(f"问题: {question}")
print(f"回答: {response}")

question = "特斯拉的最新产品是什么？" # 故意提问一个文档中没有的信息
response = rag_chain.invoke(question)
print(f"问题: {question}")
print(f"回答: {response}")
```
在这个例子中：
*   `{"context": retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}` 使用了 `RunnableParallel` 的隐式形式（通过字典），同时并行地执行 `retriever`（获取上下文）和 `RunnablePassthrough`（传递原始问题）。
*   `itemgetter` 或 `RunnablePassthrough` 用于从字典输入中提取特定键的值，或直接传递整个输入。
*   整个流程通过 `|` 管道操作符清晰地连接起来。

## 七、LCEL 最佳实践

1.  **从小处着手，逐步构建**：先构建简单的链，然后逐步添加复杂性（并行、分支、回退）。
2.  **善用类型提示**：使用 `with_types()` 帮助您理解链的预期输入和输出，减少运行时错误。
3.  **拥抱流式传输和异步**：为用户提供更好的体验和更高的吞吐量。
4.  **利用 LangSmith 进行调试**：对于任何复杂的 LCEL 链，LangSmith 是不可或缺的调试工具。
5.  **模块化组件**：将提示、模型、解析器、自定义函数等封装为独立的 `Runnable`，提高复用性。
6.  **理解 `itemgetter` 和 `RunnablePassthrough`**：它们对于在链的不同阶段管理和传递数据流至关重要。

## 八、总结

LCEL 是 LangChain 框架的一次重大飞跃，它将构建 LLM 应用程序的体验提升到了一个新的水平。通过其声明式的语法、统一的 `Runnable` 接口以及强大的组合操作符，开发者可以更高效、更灵活、更可靠地构建从简单到高度复杂的 AI 应用。掌握 LCEL 是成为一名熟练 LangChain 开发者和构建下一代 LLM 应用程序的关键。