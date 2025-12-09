---
title: LangChain Chains 深度详解与应用实践
date: 2025-10-30 06:24:00
tags:
  - 2025
  - LangChain
  - AI
  - LLM
categories:
  - AI
  - 开发框架
---

> **LangChain** 是一个强大的框架，旨在帮助开发者使用大语言模型（LLM）构建端到端的应用程序。在其众多核心模块中，**Chains (链)** 是最基础也是最重要的概念之一。它允许开发者将多个组件（如 LLM、提示模板、解析器、其他链）以逻辑顺序连接起来，形成一个完整的、可执行的流程，从而实现复杂的任务。

{% note info %}
核心思想：**Chains 的核心思想是将一系列操作（比如准备提示、调用 LLM、处理输出）串联起来，形成一个连贯的工作流。这使得开发者能够构建超越单一 LLM 调用的复杂应用程序，实现模块化、可组合和可扩展的 AI 应用。**
{% endnote %}
------

## 一、为什么需要 Chains？

大语言模型 (LLM) 固然强大，但直接调用 LLM 的 API 往往只能解决单一的、相对简单的问题。在实际应用中，我们面临的任务通常更加复杂：

*   **多步骤任务**：一个任务可能需要多次调用 LLM，每次调用基于上一次的输出。
*   **输入预处理**：可能需要根据用户输入动态地生成 LLM 提示。
*   **输出后处理**：LLM 的原始输出可能需要结构化、格式化或进一步处理才能使用。
*   **数据检索**：LLM 可能需要结合外部数据源（如数据库、文档）才能给出准确答案。
*   **工具使用**：LLM 可能需要调用外部工具（如计算器、API）来完成任务。

如果将所有这些逻辑都写在一个函数中，代码会变得臃肿、难以维护。Chains 提供了一个结构化的方式来编排这些复杂的流程，使得我们可以将任务分解为更小的、可管理的组件，并通过 Chain 将它们连接起来。

## 二、Chains 的核心概念

在 LangChain 中，`Chain` 是一个抽象基类，代表一个通用的链式结构。所有具体的 Chain 类都继承自它。一个 Chain 的基本特征是它接受输入，执行一些逻辑，然后返回输出。

### 2.1 Chain 的输入与输出

所有 Chain 都遵循一个统一的接口：

*   **输入**：接受一个或多个键值对作为输入。
*   **处理**：执行内部逻辑。
*   **输出**：返回一个或多个键值对作为输出。

这使得不同的 Chain 可以方便地串联起来：一个 Chain 的输出可以作为下一个 Chain 的输入。

### 2.2 常见的 Chain 类型

LangChain 提供了多种开箱即用的 Chain 类型，用于处理不同的任务和集成不同的组件。以下是一些最常见和重要的类型：

1.  **LLMChain (最基础的 Chain)**
2.  **Sequential Chains (顺序链)**
3.  **Router Chains (路由链)**
4.  **Retrieval Chains (检索链)**
5.  **StuffDocumentsChain, MapReduceDocumentsChain, RefineDocumentsChain, MapReRankDocumentsChain (文档处理链)**
6.  **Question Answering Chains (问答链)**
7.  **Summary Chains (摘要链)**

我们将重点介绍一些核心的 Chain 类型及其使用技巧。

## 三、核心 Chains 详解与应用技巧

### 3.1 LLMChain：基础构建块

`LLMChain` 是最基础的 Chain，它将 `PromptTemplate`、`LLM` 和可选的 `OutputParser` 组合在一起。

**工作流程：**
输入 -> 提示模板（格式化输入） -> LLM（生成响应） -> 输出解析器（结构化响应） -> 输出

{% mermaid %}
graph TD
    A[输入] --> B(PromptTemplate);
    B --> C(LLM);
    C --> D(OutputParser);
    D --> E[输出];
{% endmermaid %}

**应用技巧：**

*   **清晰的提示工程**：`PromptTemplate` 是 LLMChain 的核心。精心设计的提示可以显著提高 LLM 的性能。使用变量来使提示动态化。
*   **结构化输出**：使用 `OutputParser`（如 `PydanticOutputParser`、`StructuredOutputParser`）来强制 LLM 输出特定格式（如 JSON），这对于后续处理至关重要。

**代码示例：**

```python
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
import os

# 设置OpenAI API Key
# os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

# 1. 定义输出结构 (Pydantic Model)
class Joke(BaseModel):
    setup: str = Field(description="The setup of the joke")
    punchline: str = Field(description="The punchline of the joke")

# 2. 创建一个输出解析器实例
parser = PydanticOutputParser(pydantic_object=Joke)

# 3. 定义提示模板，并包含输出格式指令
prompt = PromptTemplate(
    template="讲一个关于{topic}的笑话。\n{format_instructions}\n",
    input_variables=["topic"],
    partial_variables={"format_instructions": parser.get_format_instructions()},
)

# 4. 初始化 LLM
llm = OpenAI(temperature=0.7)

# 5. 创建 LLMChain
joke_chain = LLMChain(llm=llm, prompt=prompt, output_parser=parser, verbose=True)

# 6. 运行 Chain
try:
    joke = joke_chain.run("程序员")
    print("\n--- 笑话 ---")
    print(f"设定: {joke.setup}")
    print(f"包袱: {joke.punchline}")
except Exception as e:
    print(f"发生错误: {e}")

# 实际运行时，请确保 OPENAI_API_KEY 已设置，并替换为您的实际 API Key。
# 由于OpenAI API可能需要付费，本示例仅为演示代码结构。
```

### 3.2 Sequential Chains (顺序链)：多步骤任务编排

`SequentialChains` 允许您将多个 Chain 串联起来，一个 Chain 的输出作为下一个 Chain 的输入。

*   **SimpleSequentialChain**：每个 Chain 只有一个输入和输出。
*   **SequentialChain**：更通用，允许每个 Chain 有多个输入和输出，并可以指定如何将输出映射到下一个 Chain 的输入。

{% mermaid %}
graph TD
    A[初始输入] --> B(Chain 1);
    B --> C(Chain 2);
    C --> D(Chain 3);
    D --> E[最终输出];
{% endmermaid %}

**应用技巧：**

*   **分解复杂任务**：将一个复杂任务分解为一系列独立的、可管理的子任务，每个子任务对应一个 Chain。
*   **数据传递清晰**：在 `SequentialChain` 中，明确定义 `input_variables` 和 `output_variables`，确保数据在不同 Chain 之间正确传递。

**代码示例：**

```python
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SimpleSequentialChain
import os

# os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

llm = OpenAI(temperature=0.0)

# Chain 1: 生成一个关于产品的名称
prompt1 = PromptTemplate(
    input_variables=["product"],
    template="给我一个关于{product}的创意名称。",
)
chain1 = LLMChain(llm=llm, prompt=prompt1)

# Chain 2: 撰写产品名称的口号
prompt2 = PromptTemplate(
    input_variables=["product_name"],
    template="为以下产品名称写一个简短且吸引人的口号: {product_name}",
)
chain2 = LLMChain(llm=llm, prompt=prompt2)

# 组合成 SimpleSequentialChain
overall_chain = SimpleSequentialChain(chains=[chain1, chain2], verbose=True)

# 运行 Chain
try:
    result = overall_chain.run("一款新的智能手机，带有超级摄像头")
    print("\n--- 最终输出 ---")
    print(result)
except Exception as e:
    print(f"发生错误: {e}")
```

### 3.3 Router Chains (路由链)：根据输入动态选择路径

`RouterChain` 允许您根据用户输入的内容，动态地将请求路由到不同的“目标链”（Destination Chain）。这对于构建能够处理多种类型请求的通用 AI 助手非常有用。

**工作流程：**
输入 -> 路由器 (LLM 决定哪个目标) -> 目标链 1 / 目标链 2 / ... -> 输出

{% mermaid %}
graph TD
    A[输入] --> B(Router Chain);
    B --> C1(目标 Chain 1);
    B --> C2(目标 Chain 2);
    B --> C3(目标 Chain 3);
    C1 --> D[输出];
    C2 --> D;
    C3 --> D;
{% endmermaid %}

**应用技巧：**

*   **多功能助手**：构建一个可以回答事实问题、生成创意文本、执行代码等多种任务的单个入口点。
*   **领域专家切换**：根据用户问题切换到不同的专业知识链。
*   **详细的路由提示**：路由器的提示模板非常重要，需要清晰地指导 LLM 如何选择目标链，并提供每个目标链的功能描述。

**代码示例 (概念性，略复杂，需要多个目标链)：**

```python
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.chains.router import MultiPromptChain
from langchain.chains.router.llm_router import LLMRouterChain, RouterOutputParser
from langchain.pydantic_v1 import BaseModel, Field
from langchain.prompts import PromptTemplate, ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
import os

# os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

llm = OpenAI(temperature=0)

# 定义不同的目标链的提示模板
physics_template = """你是一位经验丰富的物理学教授。
回答以下关于物理学的问题:
{input}
"""

math_template = """你是一位专业的数学家。
解决以下数学问题，并给出详细的步骤:
{input}
"""

general_template = """你是一位友好的通用助手。
回答以下问题:
{input}
"""

# 创建目标 LLMChain
physics_chain = LLMChain(llm=llm, prompt=PromptTemplate(template=physics_template, input_variables=["input"]))
math_chain = LLMChain(llm=llm, prompt=PromptTemplate(template=math_template, input_variables=["input"]))
general_chain = LLMChain(llm=llm, prompt=PromptTemplate(template=general_template, input_variables=["input"]))


# 定义路由器的输出结构
class RouteQuery(BaseModel):
    destination: str = Field(description="The name of the destination chain to use, or 'DEFAULT' if none apply.")
    next_inputs: str = Field(description="The input to send to the destination chain.")

parser = PydanticOutputParser(pydantic_object=RouteQuery)

# 定义路由器的提示模板
router_prompt_template = """根据用户输入的类型，将其路由到最合适的专家链。
如果输入是关于物理学，路由到 'physics'。
如果输入是关于数学，路由到 'math'。
否则，路由到 'DEFAULT'。

请使用以下格式进行响应：
{format_instructions}

用户输入: {input}
"""
router_prompt = PromptTemplate(
    template=router_prompt_template,
    input_variables=["input"],
    partial_variables={"format_instructions": parser.get_format_instructions()},
)

# 创建路由 Chain
router_chain = LLMRouterChain.from_llm(llm, router_prompt, output_parser=parser, verbose=True)

# 组合所有的链到 MultiPromptChain
overall_chain = MultiPromptChain(
    router_chain=router_chain,
    destination_chains={
        "physics": physics_chain,
        "math": math_chain,
        "DEFAULT": general_chain,
    },
    default_chain=general_chain,
    verbose=True
)

# 运行 Chain
print("\n--- 测试路由 Chain ---")
print("物理问题:")
print(overall_chain.run("解释牛顿第三定律。"))

print("\n数学问题:")
print(overall_chain.run("计算 123 乘以 456。"))

print("\n通用问题:")
print(overall_chain.run("今天天气怎么样？"))
```

### 3.4 Retrieval Chains (检索链)：RAG 架构的核心

`RetrievalChain` 是实现 **检索增强生成 (Retrieval Augmented Generation, RAG)** 架构的关键。它结合了向量数据库的检索能力和 LLM 的生成能力，让 LLM 能够基于最新的、相关的外部信息进行回答，从而克服 LLM 知识时效性和幻觉问题。

**工作流程：**
用户问题 -> 检索器 (从向量数据库等检索相关文档) -> (文档 + 问题) -> LLM (生成基于文档的答案) -> 输出

{% mermaid %}
graph TD
    A[用户问题] --> B(检索器 - Retriever);
    B --> C(相关文档);
    C -- 结合用户问题 --> D(LLM);
    D --> E[增强回答];
{% endmermaid %}

**应用技巧：**

*   **高质量的检索器**：选择合适的向量数据库和 embedding 模型，确保检索到的文档与用户问题高度相关。
*   **适当的文档分割 (Chunking)**：文档分割的大小会影响检索效果。太小可能丢失上下文，太大可能引入不相关信息。
*   **上下文窗口管理**：确保检索到的文档加上用户问题不会超出 LLM 的上下文窗口限制。

**代码示例 (RAG 链的简化版，需要安装 `chromadb` 和 `tiktoken`)：**

```python
from langchain.llms import OpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import Document
from langchain.chains import RetrievalQA
import os

# os.environ["OPENAI_API_KEY"] = "YOUR_OPENAI_API_KEY"

# 1. 准备文档和向量数据库（模拟）
docs = [
    Document(page_content="苹果公司由史蒂夫·乔布斯、史蒂夫·沃兹尼亚克和罗纳德·韦恩于1976年4月1日创立。"),
    Document(page_content="苹果公司最著名的产品包括iPhone、iPad和Mac系列电脑。"),
    Document(page_content="2023年，苹果发布了iPhone 15系列和Apple Vision Pro。"),
    Document(page_content="特斯拉由马丁·艾伯哈德和马克·塔彭宁于2003年创立，埃隆·马斯克后来成为其CEO。"),
    Document(page_content="特斯拉以其电动汽车和能源解决方案而闻名，如Model S、Model 3。")
]

# 创建嵌入模型
embeddings = OpenAIEmbeddings()

# 创建一个临时的向量存储
vectorstore = Chroma.from_documents(docs, embeddings, persist_directory="./chroma_db")
vectorstore.persist() # 持久化到磁盘

# 2. 初始化 LLM
llm = OpenAI(temperature=0)

# 3. 创建检索器
retriever = vectorstore.as_retriever()

# 4. 构建 RetrievalQA Chain
# 默认的 RetrievalQA Chain 已经封装了检索和QA逻辑
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # "stuff" 表示将所有检索到的文档塞入提示中
    retriever=retriever,
    verbose=True
)

# 5. 运行 Chain
print("\n--- RAG 查询 ---")
print("查询: 谁创立了苹果公司？")
response = qa_chain.run("谁创立了苹果公司？")
print(f"回答: {response}")

print("\n查询: 特斯拉的CEO是谁？")
response = qa_chain.run("特斯拉的CEO是谁？")
print(f"回答: {response}")

print("\n查询: 苹果最新发布了什么？")
response = qa_chain.run("苹果最新发布了什么？")
print(f"回答: {response}")
```

### 3.5 文档处理链 (Document Chains)：处理大量文本

LangChain 提供了一系列专门用于处理大量文档的 Chain，它们通常与 `RetrievalChain` 或其他需要处理多文档输入的场景结合使用。

*   **StuffDocumentsChain**：将所有文档拼接成一个大字符串，塞入 LLM 的提示。最简单，但受限于上下文窗口。
*   **MapReduceDocumentsChain**：
    1.  **Map 阶段**：对每个文档独立运行一个 LLM Chain（如摘要）。
    2.  **Reduce 阶段**：将所有 Map 阶段的输出汇总，再运行一个 LLM Chain 进行最终处理（如总结所有摘要）。
    适用于处理超大文档集。
*   **RefineDocumentsChain**：
    1.  对第一个文档进行处理。
    2.  然后迭代剩余文档，每次将当前文档和之前文档的处理结果一起输入 LLM，逐步“提炼”最终结果。
    适用于需要逐步细化或更新答案的场景。
*   **MapReRankDocumentsChain**：
    1.  对每个文档独立运行一个 LLM Chain，除了生成答案外，还为每个答案提供一个“分数”或“相关性排名”。
    2.  根据分数选择最佳答案。
    适用于在多个文档中找到最佳答案的场景。

**应用技巧：**

*   **选择合适的 Chain 类型**：根据文档数量、LLM 上下文窗口限制和任务需求来选择。
    *   小文档集：`StuffDocumentsChain`。
    *   大文档集且每个文档可独立处理：`MapReduceDocumentsChain`。
    *   需要逐步累积或提炼答案：`RefineDocumentsChain`。
    *   需要从多个文档中选出最佳答案：`MapReRankDocumentsChain`。
*   **优化 Map 和 Reduce 提示**：对于 `MapReduce` 和 `Refine`，每个阶段的提示工程都至关重要。

## 四、Chain 的组合与自定义

LangChain 的强大之处在于其模块化和可组合性。您可以：

*   **嵌套 Chains**：一个 Chain 可以作为另一个 Chain 的子组件。
*   **自定义 Chain**：如果内置 Chain 无法满足需求，可以继承 `Chain` 基类或现有 Chain 来创建自己的定制 Chain。

### 4.1 Chain 的调试与可视化

*   **`verbose=True`**：在创建 Chain 时设置 `verbose=True`，可以在运行时打印详细的中间步骤，这对于调试非常有用。
*   **LangSmith**：LangChain 提供了 LangSmith 平台，这是一个强大的开发者平台，用于跟踪、监控和调试 LLM 应用程序。它可以可视化 Chain 的运行过程，包括每次 LLM 调用、工具使用等，极大地简化了复杂 Chain 的调试。

## 五、总结

LangChain 的 Chains 是构建复杂 LLM 应用程序的基石。它们提供了一种结构化、模块化的方式来编排 LLM 调用、数据处理、外部工具集成等多个步骤。
通过熟练掌握 `LLMChain`、`SequentialChains`、`RouterChains` 和 `RetrievalChains`，并结合自定义过滤器、解析器和调试工具，开发者可以构建出强大、灵活、可扩展的 AI 应用，充分发挥大语言模型的潜力。在未来的 LLM 应用开发中，Chains 将继续扮演核心角色。