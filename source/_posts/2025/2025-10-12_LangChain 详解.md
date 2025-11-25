---
title: LangChain 详解
date: 2025-10-12 06:24:00
tags:
  - 2025
  - LangChain
  - AI
  - LLM
categories:
  - AI
  - 开发框架
---
> **LangChain** 是一个开源框架，旨在帮助开发者使用大语言模型 (LLMs) 构建端到端的应用程序。它提供了一套工具、组件和接口，极大地简化了 LLMs 应用的开发流程，特别是对于那些需要**多步骤推理、与外部数据源交互、具备记忆能力**的复杂应用场景。LangChain 的核心理念是**将 LLM 的能力与外部计算和数据源结合起来**，使其不仅仅是一个文本生成器，而是一个能够执行复杂任务的智能代理。

{% note info %}
核心思想：**连接 LLM 与外部世界，赋能 LLM 解决更复杂、更实际的问题。**
{% endnote %}
------

## 一、为什么需要 LangChain？

大语言模型（如 GPT-3/4, Claude, Llama 等）拥有强大的文本理解和生成能力，但它们本身存在一些局限性：

1.  **知识截止日期 (Knowledge Cut-off)**：LLMs 的知识库停留在其训练数据的截止日期，无法获取最新信息。
2.  **幻觉 (Hallucination)**：LLMs 可能会生成听起来合理但实际上错误或捏造的信息。
3.  **缺乏上下文记忆 (Lack of Contextual Memory)**：LLMs 默认是无状态的，无法记住之前的对话或交互。
4.  **无法执行外部操作 (Cannot Perform External Actions)**：LLMs 只能生成文本，无法直接调用 API、查询数据库或执行其他软件操作。
5.  **单次调用限制 (Single-Shot Limit)**：对于复杂任务，LLMs 需要多步骤的思考、规划和执行。
6.  **Prompt 工程复杂 (Prompt Engineering Complexity)**：构建有效的 Prompt 需要经验和技巧，且难以模块化和复用。

LangChain 正是为了解决这些痛点而诞生的。它提供了一个结构化的方式来：

*   **与外部数据源集成**：让 LLM 获取最新或领域特定的信息。
*   **赋予记忆能力**：使 LLM 能够进行有状态的对话。
*   **支持工具使用 (Tool Usage)**：让 LLM 能够调用外部 API 或函数来执行动作。
*   **链式操作 (Chaining)**：将多个 LLM 调用或其他组件组合成一个序列，实现复杂任务的分解和执行。
*   **可观测性 (Observability)**：方便开发者理解和调试 LLM 链的运行过程。

## 二、LangChain 的核心模块与概念

LangChain 的架构设计由六个核心模块组成，它们共同协作，提供了构建 LLM 应用所需的所有基本组件。

{% mermaid %}
graph TD
    User(用户) --> Prompts(Prompts)
    Prompts --> LLMs(LLMs)
    LLMs --> OutputParsers(Output Parsers)
    OutputParsers --> Chains(Chains)
    Chains --> Agents(Agents)
    Agents --> Tools(Tools)
    Tools --> ExternalServices(外部服务/数据源)
    Agents --> Memory(Memory)
    Memory --> Chains
    Memory --> LLMs
{% endmermaid %}

### 2.1 LLMs (大语言模型)

这是 LangChain 的核心驱动力。
*   **定义**：LangChain 提供了与各种大语言模型交互的统一接口。无论是 OpenAI 的 GPT 系列、Google 的 Gemini/PaLM、Hugging Face 上的开源模型，还是自定义的本地模型，都可以通过标准接口接入。
*   **功能**：负责文本的生成、理解、摘要、翻译等核心能力。
*   **类型**：
    *   **LLMs**：纯文本输入输出模型（如 GPT-3.5 `text-davinci-003`，旧接口）。
    *   **ChatModels**：聊天模型，接收一系列消息（`HumanMessage`, `AIMessage`, `SystemMessage`），返回一条消息（如 GPT-3.5 `gpt-3.5-turbo`，GPT-4）。

**示例 (Python)**：

```python
# 导入 OpenAI ChatModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# 初始化模型
chat = ChatOpenAI(temperature=0, model="gpt-4")

# 调用模型
response = chat.invoke([
    SystemMessage("你是一个专业的翻译助手。"),
    HumanMessage("Hello, how are you today?")
])

print(response.content) # Output: "你好，你今天过得怎么样？"
```

### 2.2 Prompts (提示词)

*   **定义**：Prompt 是你给 LLM 的输入指令。LangChain 提供了工具来构造、管理和优化这些提示词。
*   **功能**：
    *   **`PromptTemplate`**：用于动态地构建 Prompt，将用户输入或变量插入到预定义的模板中。
    *   **`ChatPromptTemplate`**：专门为聊天模型设计，可以构造包含系统消息、人类消息、AI 消息等多角色的消息序列。
    *   **`ExampleSelector`**：根据输入动态选择最佳的示例来构造 Few-shot Prompt。
*   **重要性**：好的 Prompt 是 LLM 应用成功的关键，Prompt 工程是核心技能。

**示例 (Python)**：

```python
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI

# 1. PromptTemplate (适用于 LLMs 或单个字符串输入)
string_prompt_template = PromptTemplate.from_template(
    "给我一个关于 {product} 的有趣名称。"
)
print(string_prompt_template.format(product="智能吸尘器"))
# Output: "给我一个关于 智能吸尘器 的有趣名称。"

# 2. ChatPromptTemplate (适用于 ChatModels)
chat_template = ChatPromptTemplate.from_messages([
    ("system", "你是一个起名专家，擅长为科技产品起名。"),
    ("human", "给我一个关于 {product} 的有趣名称。")
])
# 将 PromptTemplate 与 LLM 结合
model = ChatOpenAI(temperature=0, model="gpt-4")
chain = chat_template | model
response = chain.invoke({"product": "智能吸尘器"})
print(response.content) # Output: 可能是 "旋风管家" 或 "扫地忍者" 等
```

### 2.3 Output Parsers (输出解析器)

*   **定义**：LLM 的输出通常是自由格式的文本。Output Parsers 负责将这些文本结构化为特定的数据格式，如 JSON、列表或自定义对象。
*   **功能**：确保 LLM 的输出能够被下游组件或应用逻辑方便地处理。
*   **重要性**：弥合了 LLM 的文本输出与程序化数据结构之间的鸿沟。

**示例 (Python)**：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field # 用于定义结构化输出

# 定义期望的输出结构
class Joke(BaseModel):
    setup: str = Field(description="笑话的开场白")
    punchline: str = Field(description="笑话的包袱")

model = ChatOpenAI(temperature=0, model="gpt-4")
parser = JsonOutputParser(pydantic_object=Joke)

# 获取格式指导的 Prompt
format_instructions = parser.get_format_instructions()

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个输出 JSON 格式的助手。\n{format_instructions}"),
    ("human", "给我讲一个关于 {topic} 的笑话。")
]).partial(format_instructions=format_instructions) # 填充格式指令

chain = prompt | model | parser

joke = chain.invoke({"topic": "猫"})
print(joke)
# Output: {'setup': '为什么猫是糟糕的扑克玩家？', 'punchline': '因为它们总是藏着一张王牌！'}
print(joke.setup) # 可以像访问对象属性一样访问
```

### 2.4 Chains (链)

*   **定义**：将多个 LLM 调用或其他组件（如 PromptTemplate、OutputParser）组合成一个逻辑序列，以完成更复杂的任务。
*   **功能**：实现多步骤推理、数据转换、流程编排。
*   **核心理念**：将复杂的 LLM 任务分解成一系列可管理的、相互连接的步骤。
*   **类型**：
    *   **LLMChain**：最基本的链，将 `PromptTemplate` 与 `LLM` 结合。
    *   **SequentialChain**：顺序执行多个链，将一个链的输出作为下一个链的输入。
    *   **RetrievalQAChain**：用于问答系统，结合检索器获取相关文档。
    *   **`LCEL (LangChain Expression Language)`**：是 LangChain 中构建链的推荐方式，提供了一种声明式、可组合的语法 (`|` 管道操作符)。

**示例 (Python - 使用 LCEL)**：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

model = ChatOpenAI(temperature=0, model="gpt-4")
output_parser = StrOutputParser() # 简单地将 LLM 输出转换为字符串

# 步骤 1: 概念生成链
concept_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个概念生成专家。"),
    ("human", "给我生成一个关于 {item} 的有趣概念。")
])
concept_chain = concept_prompt | model | output_parser

# 步骤 2: 描述生成链 (使用上一步的输出)
description_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个描述生成专家。"),
    ("human", "描述一下这个概念: {concept}")
])
description_chain = description_prompt | model | output_parser

# 组合成一个完整的链 (使用 LCEL 的 `RunnablePassthrough` 和 `chain.with_config`)
from langchain_core.runnables import RunnablePassthrough

full_chain = (
    {"concept": concept_chain} # 先执行 concept_chain，结果作为 'concept' 键值
    | RunnablePassthrough.assign(
        description=description_chain # 再执行 description_chain，输入为 {concept: ...}，结果作为 'description' 键值
    )
)

result = full_chain.invoke({"item": "智能冰箱"})
print(result)
# Output:
# {
#   'concept': '“智能食物管家”：一个能追踪库存、建议食谱、自动补货的冰箱。',
#   'description': '智能食物管家是一款革命性的智能冰箱，它搭载了先进的传感器和AI系统，能够实时监控冰箱内食材的种类、数量和新鲜度。它不仅能根据现有食材智能推荐个性化食谱，还能在食材即将耗尽时自动生成购物清单，甚至通过合作平台一键完成在线补货。此外，它还能根据用户的饮食偏好和健康目标，提供营养分析和膳食建议，真正实现对家庭饮食的智能化管理。'
# }
```

### 2.5 Agents (代理)

*   **定义**：Agent 是 LangChain 中最强大的概念之一。它让 LLM 具备了**推理 (Reasoning)** 和**行动 (Action)** 的能力。Agent 会根据用户的输入，自主决定需要执行哪些 `Tool`，以及执行多少次，直到任务完成。
*   **功能**：实现复杂、动态的、需要规划和多步操作的任务。
*   **工作原理 (ReAct 模式)**：通常遵循 **ReAct (Reasoning and Acting)** 模式：
    1.  **Thought (思考)**：LLM 思考下一步应该做什么。
    2.  **Action (行动)**：LLM 决定调用哪个 `Tool` 以及使用什么参数。
    3.  **Observation (观察)**：`Tool` 执行后返回结果。
    4.  重复以上步骤，直到达到最终答案。
*   **重要性**：是构建能够自主解决问题的 LLM 应用程序的核心。

**示例 (Python)**：

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent, tool
from langchain_core.prompts import ChatPromptTemplate
import operator

# 定义一个工具
@tool
def get_current_weather(location: str) -> str:
    """获取指定城市当前天气信息的工具。"""
    if location == "北京":
        return "北京：晴，25°C，微风。"
    elif location == "上海":
        return "上海：多云，28°C，阵雨。"
    else:
        return "未知城市天气。"

# 定义另一个工具
@tool
def calculate_expression(expression: str) -> str:
    """计算数学表达式的工具。"""
    try:
        return str(eval(expression)) # 注意 eval 的安全风险，实际应用中应使用更安全的数学表达式解析器
    except Exception as e:
        return f"计算失败: {e}"

tools = [get_current_weather, calculate_expression]

# 定义 Agent Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个善于使用工具的助手。尽可能地回答用户的问题。"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}") # 代理的思考过程和工具输出会填充到这里
])

llm = ChatOpenAI(temperature=0, model="gpt-4")

# 创建 ReAct 代理
agent = create_react_agent(llm, tools, prompt)

# 创建 Agent 执行器
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True) # verbose=True 可以看到代理的思考过程

# 调用代理
print("--- 调用 Agent 1 ---")
result1 = agent_executor.invoke({"input": "上海今天天气怎么样？"})
print(f"最终答案: {result1['output']}")

print("\n--- 调用 Agent 2 ---")
result2 = agent_executor.invoke({"input": "计算 123 乘以 456 再加上 789 等于多少？"})
print(f"最终答案: {result2['output']}")

# 输出会包含 Thought, Action, Observation 的详细过程
```

### 2.6 Memory (记忆)

*   **定义**：使 LLM 能够记住之前的对话或交互，从而进行有状态的交流。
*   **功能**：将历史消息传递给 LLM，维持上下文。
*   **重要性**：对于聊天机器人、对话代理等应用至关重要。
*   **类型**：
    *   **`ConversationBufferMemory`**：最简单，存储所有历史消息。
    *   **`ConversationSummaryMemory`**：总结历史消息，以节省 Token。
    *   **`ConversationBufferWindowMemory`**：只保留最近 `k` 条消息。
    *   **`ConversationTokenBufferMemory`**：根据 Token 数量限制保留消息。
    *   **`VectorStoreRetrieverMemory`**：将记忆存储到向量数据库中，进行检索。

**示例 (Python)**：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

llm = ChatOpenAI(temperature=0, model="gpt-4")

# 1. 定义 PromptTemplate，包含 MessagesPlaceholder 用于记忆
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的聊天机器人。"),
    MessagesPlaceholder(variable_name="history"), # 记忆将填充到这里
    ("human", "{input}")
])

# 2. 初始化记忆
memory = ConversationBufferMemory(return_messages=True) # return_messages=True 会返回消息对象列表

# 3. 创建对话链
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    prompt=prompt
)

# 进行对话
print(conversation.invoke({"input": "你好！你叫什么名字？"}))
print(conversation.invoke({"input": "你最喜欢什么颜色？"}))
print(conversation.invoke({"input": "我刚才问了你什么？"})) # 此时机器人会记得之前的对话
```

## 三、LangChain 的应用场景

LangChain 极大地扩展了 LLM 的应用边界，常见的应用场景包括：

1.  **高级聊天机器人 (Advanced Chatbots)**：具备记忆、工具调用能力的智能对话系统。
2.  **问答系统 (Question Answering Systems)**：基于私有文档或最新信息的检索增强生成 (RAG) 系统。
3.  **智能代理 (Autonomous Agents)**：能够自主规划和执行复杂任务的代理，例如自动化客服、代码生成和执行、数据分析等。
4.  **数据提取与结构化 (Data Extraction & Structuring)**：从非结构化文本中提取信息并转换为 JSON 等结构化格式。
5.  **内容创作与摘要 (Content Creation & Summarization)**：更灵活地生成和总结内容。
6.  **代码生成与调试 (Code Generation & Debugging)**：结合代码解释器，实现更强大的代码辅助功能。

## 四、LangChain 的优势与挑战

### 4.1 优势：

*   **模块化与可组合性**：提供了丰富的可复用组件，可以像乐高积木一样自由组合。
*   **抽象层**：为各种 LLM、Prompt 工程、外部工具等提供统一的抽象接口，降低开发难度。
*   **强大的 Agent 能力**：通过 Agent 实现了 LLM 的自主规划和工具使用，是构建智能应用的关键。
*   **活跃的社区与生态**：社区活跃，更新迭代快，支持多种语言 (Python, JavaScript/TypeScript)。
*   **与外部系统集成**：轻松连接各种数据库、API、文档存储等。

### 4.2 挑战：

*   **学习曲线**：概念较多，初学者需要一定时间理解其核心模块和工作原理。
*   **性能与成本**：多步骤链和 Agent 意味着更多的 LLM 调用，可能增加延迟和成本。
*   **调试复杂性**：长链或 Agent 的运行过程可能难以调试和理解，虽然 LangSmith 等工具正在缓解这一问题。
*   **版本迭代快**：LangChain 作为一个新兴框架，版本更新非常频繁，API 可能会有变动。
*   **幻觉与可靠性**：尽管 LangChain 提供了工具来缓解，但 LLM 本身的幻觉问题依然存在，需要精心设计和测试以确保可靠性。

## 五、总结

LangChain 是 LLM 应用开发领域一个极其重要的框架，它为开发者提供了一条清晰的路径，将大语言模型从一个简单的文本生成器，提升为能够理解、推理、行动并与外部世界交互的智能引擎。通过其模块化的设计和对核心 LLM 应用范式的抽象，LangChain 极大地降低了构建复杂、功能丰富 LLM 应用程序的门槛。

随着 LLM 技术的发展，LangChain 无疑将继续演进，成为构建下一代 AI 应用不可或缺的工具。要充分利用 LangChain，开发者需要深入理解其核心概念，并根据具体应用场景灵活运用这些组件，以平衡功能、性能和成本。