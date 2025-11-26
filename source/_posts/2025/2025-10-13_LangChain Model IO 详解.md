---
title: LangChain Model I/O 详解
date: 2025-10-13 06:24:00
tags:
  - 2025
  - LangChain
  - AI
  - LLM
categories:
  - AI
  - 开发框架
---
> **LangChain Model I/O** 是 LangChain 框架的核心组成部分之一，它提供了一套标准化的接口和工具，用于与各种大型语言模型 (LLMs) 和聊天模型 (Chat Models) 进行交互，并对其输入和输出进行有效的管理和结构化。这是构建任何基于 LLM 的应用程序的基础。

{% note info %}
核心思想：**将与 LLM 的“对话”分解为可管理、可组合的组件：输入 (Prompt Templates)、模型调用 (LLM/Chat Models) 和输出处理 (Output Parsers)。**
{% endnote %}

## 一、为什么 Model I/O 至关重要？

在没有 LangChain Model I/O 的情况下，直接与 LLM 交互通常意味着：

1.  **手动拼接 Prompt**: 需要手动构建复杂的字符串，其中包含指令、上下文、示例和用户输入。这既繁琐又容易出错。
2.  **硬编码模型调用**: 每次更换模型或供应商时，都需要修改底层代码。
3.  **非结构化的输出**: LLM 的原始输出通常是自由文本，需要编写复杂的字符串解析逻辑来提取所需信息。
4.  **缺乏可复用性**: 不同应用场景下的 Prompt 和解析逻辑难以复用。

LangChain Model I/O 旨在解决这些问题，提供一个抽象层，使开发者能够：

*   **标准化 Prompt**: 通过 `Prompt Templates` 精确控制输入结构和内容。
*   **抽象模型接口**: 轻松切换不同的 `LLMs` 或 `Chat Models`，实现供应商无关性。
*   **结构化输出**: 通过 `Output Parsers` 将 LLM 的自由文本输出转换为 JSON、Pydantic 对象或其他结构化格式。
*   **模块化与可组合性**: Model I/O 组件可以与其他 LangChain 组件 (如 Chains, Agents) 无缝组合，构建更复杂的应用。

## 二、Model I/O 的核心组件

LangChain Model I/O 主要由以下三大核心组件构成：

1.  **LLMs / Chat Models (模型)**：与大型语言模型本身交互的接口。
2.  **Prompt Templates (提示词模板)**：生成发送给语言模型的指令。
3.  **Output Parsers (输出解析器)**：从语言模型的响应中提取和结构化信息。

### 2.1 LLMs (Large Language Models)

`LLMs` 类是 LangChain 中用于表示像 GPT-3.5-turbo-instruct、Bison、Llama 等**文本输入、文本输出**的大型语言模型的抽象。它们接收一个字符串作为输入，并返回一个字符串作为输出。

**特点**：
*   **文本到文本**：最直接的交互方式。
*   **无记忆**：通常是无状态的，每个调用都是独立的。

**常见的 LLM 提供商**：
*   `OpenAI` (例如 `text-davinci-003`, `gpt-3.5-turbo-instruct`)
*   `HuggingFaceHub` (各种 Hugging Face 模型)
*   `GooglePalm` (Google PaLM API)
*   `Anthropic` (Claude)

**示例 (Python)**:
```python
from langchain_openai import OpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 初始化 OpenAI LLM，这里使用 text-davinci-003 或 gpt-3.5-turbo-instruct
# 需要设置环境变量 OPENAI_API_KEY
llm = OpenAI(model_name="gpt-3.5-turbo-instruct", temperature=0.7)

# 直接调用 LLM
response = llm.invoke("世界上最高的山峰是什么？")
print(response)
# 预期输出: 世界上最高的山峰是珠穆朗玛峰。
```

### 2.2 Chat Models (聊天模型)

`Chat Models` 类用于表示设计为接收和返回**消息列表**的语言模型，通常用于多轮对话。例如 OpenAI 的 `gpt-3.5-turbo` 和 `gpt-4`，Anthropic 的 `Claude` 系列。

**特点**：
*   **消息列表输入/输出**：接收 `HumanMessage`, `AIMessage`, `SystemMessage` 等对象。
*   **更适合对话场景**：模型内部通常有针对对话优化的结构。

**消息类型**：
*   `SystemMessage`: 提供模型关于其角色、行为和通用指令。
*   `HumanMessage`: 用户发出的消息。
*   `AIMessage`: AI 助理的回复。
*   `FunctionMessage` (`ToolMessage`): 工具调用结果（高级Agent功能）。

**常见的 Chat Model 提供商**：
*   `ChatOpenAI` (例如 `gpt-3.5-turbo`, `gpt-4`)
*   `ChatAnthropic` (Claude 系列)
*   `ChatGoogleGenerativeAI` (Gemini 系列)

**示例 (Python)**:
```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 初始化 ChatOpenAI 模型
chat_model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)

# 定义消息列表
messages = [
    SystemMessage(content="你是一个乐于助人的AI助手。"),
    HumanMessage(content="帮我写一个关于秋天的短诗。")
]

# 调用聊天模型
response = chat_model.invoke(messages)
print(response.content)
# 预期输出: 金风送爽叶渐黄，落霞孤鹜舞夕阳。枫林尽染霜天醉，一曲秋歌入画廊。
```

### 2.3 Prompt Templates (提示词模板)

`Prompt Templates` 使得构建动态、可重用的提示词变得简单。它们可以接收用户输入或其他变量，并将其格式化为模型能够理解的结构化字符串或消息列表。

**主要类型**：

*   **`StringPromptTemplate`**: 最基本的模板，用于 `LLMs`。通过 Python 的格式化字符串语法 (`{variable_name}`) 来定义变量占位符。
    ```python
    from langchain_core.prompts import PromptTemplate

    string_template = PromptTemplate.from_template("告诉我一个关于 {subject} 的 {adjective} 故事。")
    prompt = string_template.format(subject="龙", adjective="有趣")
    print(prompt)
    # 预期输出: 告诉我一个关于 龙 的 有趣 故事。
    ```

*   **`ChatPromptTemplate`**: 专为 `Chat Models` 设计，它通过定义不同角色的消息 (System, Human, AI) 来构建消息列表。
    ```python
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.messages import SystemMessage, HumanMessage

    chat_template = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content="你是一个专业的 {role}。"),
            HumanMessage(content="为我起一个关于 {product_name} 的产品slogan。")
        ]
    )
    messages = chat_template.format_messages(role="市场营销专家", product_name="智能音箱")
    print(messages)
    # 预期输出: [SystemMessage(content='你是一个专业的 市场营销专家。'), HumanMessage(content='为我起一个关于 智能音箱 的产品slogan。')]
    ```

*   **`FewShotPromptTemplate`**: 用于实现 Few-Shot Learning，它结合了一组输入/输出示例来指导模型生成更好的响应。它内部嵌套了另一个 `PromptTemplate` 来格式化每个示例。

### 2.4 Output Parsers (输出解析器)

`Output Parsers` 将 LLM / Chat Model 生成的原始文本输出转换为更易于程序处理的结构化格式，例如 JSON、列表或自定义 Pydantic 对象。

**主要类型**：

*   **`StrOutputParser`**: 最简单的解析器，它只是将模型输出转换为字符串并删除任何额外的空白。在大多数链的末端，如果没有指定其他解析器，这通常是默认的。
    ```python
    from langchain_core.output_parsers import StrOutputParser

    parser = StrOutputParser()
    # 假设模型输出是 "  Hello World!\n"
    parsed_output = parser.invoke("  Hello World!\n")
    print(parsed_output)
    # 预期输出: Hello World!
    ```

*   **`PydanticOutputParser`**: 强大的解析器，能够将模型输出解析为预定义的 Pydantic 模型对象。这对于需要严格结构化数据的场景非常有用。
    ```python
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import PydanticOutputParser
    from pydantic import BaseModel, Field
    from langchain_openai import ChatOpenAI

    # 定义 Pydantic 模型
    class Joke(BaseModel):
        setup: str = Field(description="笑话的起始部分")
        punchline: str = Field(description="笑话的结尾部分")

    parser = PydanticOutputParser(pydantic_object=Joke)

    prompt = PromptTemplate(
        template="请按照以下格式给出关于程序员的一个笑话。\n{format_instructions}\n",
        input_variables=[],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    chat_model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)
    chain = prompt | chat_model | parser

    output: Joke = chain.invoke({})
    print(f"笑话铺垫: {output.setup}")
    print(f"笑话包袱: {output.punchline}")
    # 预期输出（动态生成，结构固定）:
    # 笑话铺垫: 为什么程序员总是喜欢呆在黑暗里？
    # 笑话包袱: 因为他们喜欢 '暗' 示 (command prompt)！
    ```

*   **`JsonOutputParser`**: 用于将模型输出解析为 JSON 格式。如果 LLM 生成的 JSON 结构明确，可以直接使用。

*   **`CommaSeparatedListOutputParser`**: 将逗号分隔的字符串解析为 Python 列表。

## 三、构建 Model I/O Chain 的实践

在 LangChain 表达式语言 (LCEL) 中，`|` 操作符是构建 Model I/O 链的核心，它将 Prompt Template、LLM/Chat Model 和 Output Parser 有机地连接起来。

{% mermaid %}
graph TD
    A[Prompt Template] -->|格式化输入| B(LLM / Chat Model)
    B -->|生成原始文本输出| C[Output Parser]
    C -->|结构化输出| D(应用程序逻辑)
{% endmermaid %}

**示例：使用 LCEL 构建一个问答链**

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 1. 设置 OpenAI API Key (确保环境变量已配置)
# os.environ["OPENAI_API_KEY"] = "YOUR_API_KEY"

# 2. 定义 Prompt Template
chat_template = ChatPromptTemplate.from_messages(
    [
        SystemMessage(content="你是一个专业的 {expert_role}，回答问题简明扼要。"),
        HumanMessage(content="请回答: {question}")
    ]
)

# 3. 初始化 Chat Model
chat_model = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.2)

# 4. 初始化 Output Parser
output_parser = StrOutputParser()

# 5. 使用 LCEL 组合链
# 链的结构: 输入 -> Prompt -> 模型 -> 解析器 -> 输出
q_a_chain = chat_template | chat_model | output_parser

# 6. 调用链并获取结果
result = q_a_chain.invoke(
    {
        "expert_role": "历史学家",
        "question": "法国大革命开始于哪一年？"
    }
)
print(result)
# 预期输出: 法国大革命开始于1789年。

result_another = q_a_chain.invoke(
    {
        "expert_role": "数学家",
        "question": "π (pi) 的前五位小数是什么？"
    }
)
print(result_another)
# 预期输出: π 的前五位小数是 14159。
```

## 四、高级概念 (简述)

*   **Streaming Output (流式输出)**: 允许 LLM 逐字或逐词地返回响应，而不是等待整个响应生成完毕。LangChain 的 Model I/O 组件可以方便地与流式调用集成。
*   **Custom Prompt Templates / Output Parsers**: 对于非常特定的需求，可以通过继承基类来创建自定义的 Prompt Templates 或 Output Parsers，以实现灵活的输入输出处理逻辑。
*   **Runnable Interface**: LangChain 中所有可执行的组件 (`PromptTemplate`, `LLM`, `ChatModel`, `OutputParser`, `Chain` 等) 都实现了 `Runnable` 接口，这使得它们可以通过统一的 `invoke()`, `batch()`, `stream()` 等方法进行调用，并可以方便地使用 LCEL (`|`) 进行组合。

## 五、总结

LangChain Model I/O 是 LLM 应用开发中不可或缺的基石。它通过提供 LLMs/Chat Models、Prompt Templates 和 Output Parsers 这三大核心组件，极大地简化了与语言模型的交互过程。通过这种模块化、可组合的方式，开发者可以更高效地构建健壮、灵活且易于维护的 LLM 应用程序，无论是简单的问答系统还是复杂的 Agent 逻辑，Model I/O 都提供了坚实的基础。掌握 Model I/O 将使您能够充分发挥 LangChain 的强大能力。