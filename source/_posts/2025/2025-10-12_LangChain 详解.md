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

> **LangChain** 是一个用于开发由大型语言模型 (LLM) 驱动的应用程序的开源框架。它提供了一套工具、组件和接口，旨在简化 LLM 应用的开发流程，包括将 LLM 与外部数据源、计算逻辑和业务流程相结合，从而构建更复杂、更强大、更具上下文感知能力的应用程序。

{% note info %}
核心思想：**将 LLM 的能力扩展到超越单一提示的范围，通过链式组合不同的组件（如 LLM、提示模板、解析器、工具、内存等），构建具有推理、记忆和外部交互能力的复杂智能体 (Agent)。**
{% endnote %}
------

## 一、为什么需要 LangChain？

大型语言模型（LLM），如 GPT 系列、Llama 系列等，具有强大的文本理解和生成能力。然而，在实际应用中，直接使用 LLM API 存在一些挑战：

1.  **上下文限制 (Context Window Limitations)**：LLM 有输入令牌限制，无法处理过长的文本。
2.  **知识截止 (Knowledge Cutoff)**：LLM 的知识基于训练数据，无法获取实时或私有数据。
3.  **幻觉 (Hallucination)**：LLM 可能生成不准确或虚构的信息。
4.  **缺乏记忆**：LLM 默认是无状态的，无法记住之前的对话。
5.  **缺乏外部工具**：LLM 无法直接执行外部操作，如查询数据库、调用 API、执行代码等。
6.  **复杂逻辑编排**：构建多步骤、有条件的 LLM 应用需要复杂的逻辑编排。
7.  **可维护性与可扩展性**：硬编码的 LLM 应用难以维护和扩展。

LangChain 旨在通过提供以下功能来解决这些问题：

*   **模块化组件**：将 LLM 应用的各个部分（模型、提示、解析器、工具、记忆等）抽象为可重用的模块。
*   **链式结构 (Chains)**：允许将这些模块以特定的顺序组合起来，形成一个完整的处理流程。
*   **智能体 (Agents)**：赋予 LLM 决策能力，使其能够根据用户的请求选择并使用合适的工具来完成任务。
*   **检索增强生成 (RAG - Retrieval Augmented Generation)**：通过结合外部知识库（如向量数据库），突破 LLM 的知识截止限制。
*   **可观测性与调试**：通过 LangSmith 等工具提供对链式执行过程的详细跟踪。

## 二、LangChain 的核心概念

LangChain 的设计围绕着一系列核心组件，它们共同协作构建复杂的 LLM 应用程序。

1.  **LLM (Large Language Model)**:
    *   **定义**：LangChain 对各种语言模型 API 的封装。可以是基于文本的生成模型 (`LLM`) 或基于聊天消息的模型 (`ChatModel`)。
    *   **作用**：作为应用程序的“大脑”，执行文本生成、理解和推理。

2.  **Prompt (提示)**:
    *   **定义**：用户或应用程序提供给 LLM 的输入文本，用于指导 LLM 的行为。LangChain 提供了模板 (`PromptTemplate`) 来结构化提示。
    *   **作用**：决定 LLM 的输出质量和相关性。

3.  **Output Parser (输出解析器)**:
    *   **定义**：用于将 LLM 生成的原始文本输出转换为结构化的数据格式（如 JSON, Python 对象）。
    *   **作用**：使 LLM 输出能够被下游组件或应用程序逻辑方便地处理。

4.  **Chain (链)**:
    *   **定义**：将多个组件（如 Prompt, LLM, Parser, 其他 Chain）按顺序组合起来，形成一个端到端的处理流程。
    *   **作用**：实现复杂的业务逻辑，将多个 LLM 调用和数据处理步骤自动化。

5.  **Retrieval (检索)**:
    *   **定义**：从外部数据源（如文档、数据库、API）中获取相关信息，以增强 LLM 的上下文。通常涉及向量数据库和嵌入模型。
    *   **作用**：解决 LLM 的知识截止和上下文限制问题，实现 RAG 模式。

6.  **Agent (智能体)**:
    *   **定义**：由一个 LLM 驱动的决策循环。Agent 能够根据用户输入和当前状态，动态地选择并使用一个或多个 `Tools` 来完成任务。
    *   **作用**：赋予 LLM 规划和执行复杂任务的能力，使其能够与外部世界交互。

7.  **Tool (工具)**:
    *   **定义**：Agent 可以调用的特定功能。可以是搜索工具、计算器、API 调用、数据库查询等。
    *   **作用**：扩展 LLM 的能力，使其能够执行特定的外部操作。

8.  **Memory (记忆)**:
    *   **定义**：存储和管理对话历史或会话状态，使 LLM 能够记住之前的交互。
    *   **作用**：实现多轮对话，保持对话的连贯性和上下文。

9.  **Callbacks (回调)**:
    *   **定义**：在链或 Agent 执行的各个阶段触发的函数，用于监控、日志记录、调试、自定义处理等。
    *   **作用**：提供对 LLM 应用内部执行流程的可见性和控制能力。

## 三、LangChain 架构与工作流程

LangChain 的核心是它的模块化和可组合性。所有组件都是 `Runnable` 对象，可以通过 LangChain Expression Language (LCEL) 的 `|` 操作符轻松组合。

### 3.1 架构图

{% mermaid %}
graph TD
    subgraph LangChain Application
        User[用户输入] -->|请求| Agent["Agent (LLM + Tools + Reasoning)"]
        Agent -->|思考/规划| LLM_Core["LLM (e.g., GPT-4)"]
        LLM_Core -->|输出决策| Agent

        subgraph Chains
            Chain1[Prompt + LLM + Parser]
            Chain2[Retrieval + Prompt + LLM]
            Chain3[Agentic Chain]
        end

        Agent -- "使用" --> Tools["工具集 (e.g., Calculator, Search)"]
        Agent -- "使用" --> Memory["记忆 (对话历史)"]
        Agent -- "编排" --> Chain1
        Agent -- "编排" --> Chain2

        Chain1 -- "数据流" --> OutputParser[Output Parser]
        Chain2 -- "数据流" --> Retrieval["Retrieval (Vector DB, Embeddings)"]

        LLM_Core -- "封装" --> LLM_API["LLM API (e.g., OpenAI, HuggingFace)"]
    end

    Retrieval -- "查询" --> ExternalData["外部数据源 (e.g., 文档, 数据库)"]
    Tools -- "执行" --> ExternalServices["外部服务 (e.g., API, Web)"]
    Memory -- "存储/检索" --> DB["持久化存储 (可选)"]

    LLM_API <--> CloudService["云服务 (e.g., OpenAI, Azure)"]
{% endmermaid %}

### 3.2 工作流程 (LCEL 范式)

一个典型的 LangChain 应用（特别是使用 LCEL）的工作流程如下：

{% mermaid %}
sequenceDiagram
    participant User as 用户
    participant App as LangChain 应用
    participant Prompt as 提示模板
    participant LLM as 大型语言模型
    participant Parser as 输出解析器
    participant Retriever as 检索器
    participant Tools as 工具
    participant Memory as 记忆
    participant ExternalDB as 外部数据库/服务

    User->>App: 1. 发送用户请求 (e.g., "帮我总结文档 X")

    alt 如果是Agent
        App->>LLM: 2. Agent LLM 思考如何处理请求
        LLM-->>App: 3. Agent LLM 输出行动计划 (Tool use/Final Answer)
        alt 如果需要工具
            App->>Tools: 4. 调用相应工具
            Tools->>ExternalDB: 5. 工具执行外部操作
            ExternalDB-->>Tools: 6. 返回结果
            Tools-->>App: 7. 返回工具执行结果
            App->>LLM: 8. Agent LLM 基于工具结果继续思考
        end
    end

    alt 如果是RAG (检索增强生成)
        App->>Retriever: 2. 提取查询词，进行文档检索
        Retriever->>ExternalDB: 3. 查询向量数据库
        ExternalDB-->>Retriever: 4. 返回相关文档片段
        Retriever-->>App: 5. 返回文档上下文
    end

    App->>Prompt: 6. 将用户请求、(工具结果或文档上下文)、记忆等填充到提示模板
    Prompt-->>App: 7. 生成完整提示
    App->>LLM: 8. 将完整提示发送给 LLM
    LLM-->>App: 9. LLM 生成原始文本输出
    App->>Parser: 10. 解析 LLM 输出
    Parser-->>App: 11. 返回结构化结果

    alt 如果有记忆
        App->>Memory: 12. 更新记忆 (存储当前对话)
    end

    App-->>User: 13. 返回最终结果
{% endmermaid %}

## 四、LangChain 模块详解与调用方法

### 4.1 安装

```bash
pip install langchain langchain-community langchain-openai
# langchain-community 包含各种第三方集成
# langchain-openai 包含 OpenAI 模型集成
# 其他模型如 HuggingFace, Anthropic 等需安装相应包
pip install python-dotenv # 用于加载环境变量
```

创建 `.env` 文件并添加你的 API Key：
```
OPENAI_API_KEY="your_openai_api_key_here"
# HUGGINGFACEHUB_API_TOKEN="your_huggingface_token_here"
```

### 4.2 LLMs (大型语言模型)

LangChain 将 LLM 分为 `LLM`（传统文本输入/输出，如 completions API）和 `ChatModel`（消息列表输入/输出，如 chat completions API）。推荐使用 `ChatModel`。

**调用方法:**

1.  **导入与实例化**: 从 `langchain_openai` 或 `langchain_community` 导入相应的模型类。
2.  **`invoke(input)`**: 最简单的调用方法，直接传入字符串（对 `LLM`）或消息列表（对 `ChatModel`），返回单个结果。
3.  **`stream(input)`**: 流式传输结果，用于实时显示 LLM 生成的文本。
4.  **`batch(inputs)`**: 批量处理多个输入。

```python
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv() # 加载 .env 文件中的环境变量

# 实例化 LLM (传统文本模型)
llm = OpenAI(temperature=0.7, model_name="gpt-3.5-turbo-instruct") # model_name for legacy LLMs

# 实例化 ChatModel (推荐)
chat_model = ChatOpenAI(temperature=0.7, model="gpt-3.5-turbo") # model for chat models

print("--- LLM 模块调用示例 ---")

# 1. LLM 调用 (invoke)
response_llm = llm.invoke("What is the capital of France?")
print(f"LLM Response (invoke): {response_llm.strip()}")

# 2. ChatModel 调用 (invoke)
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What is the capital of France?")
]
response_chat = chat_model.invoke(messages)
print(f"ChatModel Response (invoke): {response_chat.content}")

# 3. ChatModel 流式调用 (stream)
print("\nChatModel Response (stream):")
stream_messages = [HumanMessage(content="Tell me a short story about a brave knight.")]
for chunk in chat_model.stream(stream_messages):
    print(chunk.content, end="", flush=True)
print("\n")

# 4. ChatModel 批量调用 (batch)
batch_inputs = [
    [HumanMessage(content="What is the color of the sky?")],
    [HumanMessage(content="What is the color of grass?")]
]
batch_responses = chat_model.batch(batch_inputs)
print("\nChatModel Response (batch):")
for res in batch_responses:
    print(f"- {res.content}")
```

### 4.3 Prompts (提示)

提示模板用于构建 LLM 的输入，确保提示结构化且可复用。

**调用方法:**

1.  **`PromptTemplate`**: 适用于 `LLM` 模型的字符串输入。
2.  **`ChatPromptTemplate`**: 适用于 `ChatModel` 模型的聊天消息列表输入。
    *   `from_messages()`: 从消息列表创建模板。
    *   `SystemMessagePromptTemplate`, `HumanMessagePromptTemplate`, `AIMessagePromptTemplate`: 组合不同角色消息的模板。
    *   `MessagesPlaceholder`: 占位符，用于插入其他消息（如记忆）。
3.  **`FewShotPromptTemplate`**: 少样本提示，通过提供少量示例来指导 LLM。

```python
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder, FewShotPromptTemplate

print("\n--- Prompts 模块调用示例 ---")

# 1. PromptTemplate (用于 LLM 模型)
prompt_template = PromptTemplate.from_template("Tell me a {adjective} story about a {noun}.")
formatted_prompt = prompt_template.invoke({"adjective": "funny", "noun": "cat"})
print(f"PromptTemplate 结果: {formatted_prompt}")

# 2. ChatPromptTemplate (用于 ChatModel 模型)
# 使用 from_messages 快速创建
chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that translates English to French."),
    ("human", "Translate this sentence: {sentence}")
])
formatted_chat_prompt = chat_prompt.invoke({"sentence": "Hello, how are you?"})
print(f"ChatPromptTemplate 结果: {formatted_chat_prompt.messages}")

# 3. ChatPromptTemplate 结合 MessagesPlaceholder (用于记忆或复杂消息注入)
from langchain_core.messages import HumanMessage, AIMessage
history = [HumanMessage(content="Hi there!"), AIMessage(content="Hello! How can I help you?")]
chat_prompt_with_history = ChatPromptTemplate.from_messages([
    ("system", "You are a friendly chatbot."),
    MessagesPlaceholder(variable_name="chat_history"), # 占位符用于插入历史消息
    ("human", "{input}")
])
formatted_prompt_with_history = chat_prompt_with_history.invoke({
    "chat_history": history,
    "input": "What's the weather like today?"
})
print(f"ChatPromptTemplate (含历史) 结果: {formatted_prompt_with_history.messages}")

# 4. FewShotPromptTemplate
examples = [
    {"word": "happy", "antonym": "sad"},
    {"word": "tall", "antonym": "short"},
]
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=PromptTemplate.from_template("Word: {word}\nAntonym: {antonym}"),
    suffix="Word: {word}\nAntonym:",
    input_variables=["word"],
)
formatted_few_shot_prompt = few_shot_prompt.invoke({"word": "big"})
print(f"FewShotPromptTemplate 结果:\n{formatted_few_shot_prompt.text}")
```

### 4.4 Output Parsers (输出解析器)

将 LLM 的文本输出解析成结构化的数据。

**调用方法:**

1.  **`StrOutputParser`**: 最简单的解析器，直接返回字符串。
2.  **`JsonOutputParser`**: 将 LLM 输出解析为 JSON 格式。
3.  **`PydanticOutputParser`**: 基于 Pydantic 模型定义输出结构。

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

print("\n--- Output Parsers 模块调用示例 ---")

chat_model_parser = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")

# 1. StrOutputParser
# 这是一个默认行为，但明确指定可读性更好
chain_str = ChatPromptTemplate.from_template("Tell me a fact about {animal}.") | chat_model_parser | StrOutputParser()
fact = chain_str.invoke({"animal": "dogs"})
print(f"StrOutputParser 结果: {fact}")

# 2. JsonOutputParser
json_prompt = ChatPromptTemplate.from_template(
    "Return a JSON object with the 'animal' and 'fact' about {animal}."
    "Format: {{\"animal\": \"<animal_name>\", \"fact\": \"<fact_about_animal>\"}}"
)
chain_json = json_prompt | chat_model_parser | JsonOutputParser()
json_output = chain_json.invoke({"animal": "cats"})
print(f"JsonOutputParser 结果 (类型: {type(json_output)}): {json_output}")

# 3. PydanticOutputParser
class AnimalFact(BaseModel):
    animal: str = Field(description="The name of the animal.")
    fact: str = Field(description="An interesting fact about the animal.")

parser = PydanticOutputParser(pydantic_object=AnimalFact)

pydantic_prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer the user query. {format_instructions}"),
    ("human", "Tell me a fact about {animal}.")
]).partial(format_instructions=parser.get_format_instructions()) # 将格式指令注入到提示中

chain_pydantic = pydantic_prompt | chat_model_parser | parser
pydantic_output = chain_pydantic.invoke({"animal": "pandas"})
print(f"PydanticOutputParser 结果 (类型: {type(pydantic_output)}): {pydantic_output}")
print(f"Pydantic 结果的 animal 字段: {pydantic_output.animal}")
```

### 4.5 Chains (链)

链是 LangChain 的核心，通过 LangChain Expression Language (LCEL) 将可运行组件组合起来。

**调用方法:**

使用 `|` 操作符连接 `Runnable` 对象。

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

print("\n--- Chains 模块调用示例 ---")

# 最简单的链：Prompt -> LLM -> Parser
llm_chain = (
    ChatPromptTemplate.from_template("Tell me a short {emotion} story about a {animal}.")
    | ChatOpenAI(temperature=0.7, model="gpt-3.5-turbo")
    | StrOutputParser()
)

story = llm_chain.invoke({"emotion": "happy", "animal": "rabbit"})
print(f"简单链执行结果:\n{story}")

# 更复杂的链：包含多个 LLM 调用或中间步骤
from langchain_core.runnables import RunnablePassthrough

# 定义一个函数，作为链中的一个步骤
def summarize_text(text: str) -> str:
    # 模拟一个文本摘要服务
    if len(text) > 100:
        return text[:100] + "..." # 截断
    return text

summary_chain = (
    {"text": llm_chain} # 将上一个链的输出作为 'text' 键传入下一个链
    | RunnablePassthrough.assign(summary=lambda x: summarize_text(x["text"]))
    | ChatPromptTemplate.from_template("Original Story: {text}\nSummary: {summary}\n\nBased on the summary, what is the main theme of the story?")
    | ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
    | StrOutputParser()
)

main_theme = summary_chain.invoke({"emotion": "happy", "animal": "rabbit"})
print(f"\n复杂链执行结果 (主旨):\n{main_theme}")
```

### 4.6 Retrieval (检索)

检索用于将外部数据引入 LLM 的上下文。通常涉及嵌入模型、文档加载器、文本分割器和向量存储。

**调用方法:**

1.  **`VectorStoreRetriever`**: 从向量存储中获取相关文档。
2.  **`create_retrieval_chain`**: LangChain 提供的便捷函数，用于构建 RAG 链。

```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

print("\n--- Retrieval 模块调用示例 ---")

# 1. 创建一个模拟文档
with open("example_document.txt", "w") as f:
    f.write("LangChain is a framework for developing applications powered by large language models. "
            "It enables applications that are context-aware and can reason. "
            "LangChain also helps with data augmentation, agentic reasoning, and evaluation. "
            "Key components include LLMs, prompts, chains, agents, and memory. "
            "Vector databases like Chroma are often used for retrieval.")

# 2. 加载文档
loader = TextLoader("example_document.txt")
docs = loader.load()

# 3. 分割文本
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
splits = text_splitter.split_documents(docs)

# 4. 创建嵌入模型和向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)

# 5. 创建检索器
retriever = vectorstore.as_retriever()

# 6. 构建 RAG 链
# a. 定义一个文档组合链，它知道如何处理检索到的文档
document_chain = create_stuff_documents_chain(
    ChatOpenAI(model="gpt-3.5-turbo"),
    ChatPromptTemplate.from_template("Answer the question based only on the provided context:\n\n{context}\n\nQuestion: {input}")
)

# b. 创建检索链
retrieval_chain = create_retrieval_chain(retriever, document_chain)

# 7. 调用检索链
response = retrieval_chain.invoke({"input": "What is LangChain useful for?"})
print(f"RAG 链的响应: {response['answer']}")
# print(f"检索到的文档: {[d.page_content for d in response['context']]}")

# 清理模拟文档
os.remove("example_document.txt")
```

### 4.7 Agents (智能体)

Agent 赋予 LLM 决策和使用工具的能力。

**调用方法:**

1.  **`Tool`**: 封装 Agent 可以调用的函数。
2.  **`create_react_agent`**: 创建基于 ReAct (Reasoning and Acting) 模式的 Agent。
3.  **`AgentExecutor`**: 运行 Agent，管理其与工具的交互循环。

```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub
from langchain_core.tools import Tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
import operator # 用于模拟一个简单的计算器

print("\n--- Agents 模块调用示例 ---")

# 1. 定义工具 (Tools)
def multiply(a: float, b: float) -> float:
    """Multiplies two numbers."""
    return a * b

def add(a: float, b: float) -> float:
    """Adds two numbers."""
    return a + b

# 将 Python 函数封装成 LangChain 工具
tools = [
    Tool(
        name="Multiply",
        func=multiply,
        description="Useful for multiplying two floating point numbers. Input should be two numbers separated by a comma."
    ),
    Tool(
        name="Add",
        func=add,
        description="Useful for adding two floating point numbers. Input should be two numbers separated by a comma."
    )
]

# 2. 创建 Agent
# a. 从 LangChain Hub 加载 Agent 提示模板 (或自定义)
# pull_from_hub 函数需要安装 `langchainhub`
# pip install langchainhub
try:
    prompt = hub.pull("hwchase17/react")
except Exception:
    # 如果无法访问 LangChain Hub，使用一个通用模板
    prompt = ChatPromptTemplate.from_template("""Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}""")


llm_agent = ChatOpenAI(temperature=0, model="gpt-4") # Agent 通常需要更强大的模型

agent = create_react_agent(llm_agent, tools, prompt)

# 3. 创建 AgentExecutor
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True) # verbose=True 会打印 Agent 的思考过程

# 4. 调用 Agent
question = "What is 15.6 multiplied by 3.2 and then added to 10?"
response = agent_executor.invoke({"input": question})
print(f"\nAgent 的最终响应: {response['output']}")
```

### 4.8 Memory (记忆)

记忆模块用于存储和管理对话历史，以便 LLM 能够记住之前的交互。

**调用方法:**

1.  **`ConversationBufferMemory`**: 最简单的记忆类型，将所有对话存储在一个缓冲区中。
2.  **`ConversationBufferWindowMemory`**: 只记住最近 N 轮对话。
3.  **`ConversationSummaryMemory`**: 总结旧的对话内容，减少令牌消耗。
4.  集成到链中：通常通过 `RunnablePassthrough.assign` 和 `MessagesPlaceholder`。

```python
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory, ConversationSummaryMemory
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

print("\n--- Memory 模块调用示例 ---")

chat_model_memory = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")

# 1. ConversationBufferMemory
memory = ConversationBufferMemory(return_messages=True)
memory.save_context({"input": "Hi!"}, {"output": "What's up?"})
memory.save_context({"input": "Not much, just chilling."}, {"output": "Cool."})
# 获取历史消息
print(f"Buffer Memory 历史: {memory.load_memory_variables({})['history']}")

# 2. 将记忆集成到链中 (推荐使用 MessagesPlaceholder)
prompt_with_memory = ChatPromptTemplate.from_messages([
    ("system", "You are a friendly chatbot."),
    MessagesPlaceholder(variable_name="history"), # 确保 variable_name 与 Memory 的键匹配
    ("human", "{input}")
])

# 创建一个链来演示记忆的运作
conversation_with_memory = (
    RunnablePassthrough.assign(
        history=lambda x: memory.load_memory_variables({})["history"]
    )
    | prompt_with_memory
    | chat_model_memory
    | StrOutputParser()
)

print("\n--- 带记忆的对话示例 ---")
user_input1 = "My name is Alice."
response1 = conversation_with_memory.invoke({"input": user_input1})
memory.save_context({"input": user_input1}, {"output": response1}) # 手动保存上下文
print(f"用户: {user_input1}\nAI: {response1}")

user_input2 = "What did I just tell you my name was?"
response2 = conversation_with_memory.invoke({"input": user_input2})
memory.save_context({"input": user_input2}, {"output": response2})
print(f"用户: {user_input2}\nAI: {response2}")

# 3. ConversationBufferWindowMemory (只记住最后 N 轮)
window_memory = ConversationBufferWindowMemory(k=1, return_messages=True) # 只记住最近1轮
window_memory.save_context({"input": "First msg"}, {"output": "First reply"})
window_memory.save_context({"input": "Second msg"}, {"output": "Second reply"})
window_memory.save_context({"input": "Third msg"}, {"output": "Third reply"})
print(f"\nWindow Memory (k=1) 历史: {window_memory.load_memory_variables({})['history']}") # 应该只剩最后1轮
```

### 4.9 Callbacks (回调)

回调允许你在链或 Agent 执行的各个阶段插入自定义逻辑。

**调用方法:**

通过 `callbacks` 参数传递回调处理器实例或列表。

```python
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

print("\n--- Callbacks 模块调用示例 ---")

# 1. 自定义回调处理器
class MyCustomCallbackHandler(BaseCallbackHandler):
    def on_chain_start(self, serialized, **kwargs):
        print(f"--- Chain started: {serialized['lc_id']} ---")

    def on_llm_start(self, serialized, prompts, **kwargs):
        print(f"--- LLM started with prompts: {prompts} ---")

    def on_llm_end(self, response, **kwargs):
        print(f"--- LLM ended with response: {response.generations[0][0].text[:50]}... ---")

    def on_chain_end(self, outputs, **kwargs):
        print(f"--- Chain ended with outputs: {outputs} ---")

# 2. 将回调处理器添加到链中
chain_with_callbacks = (
    ChatPromptTemplate.from_template("What is a good name for a company that makes {product}?")
    | ChatOpenAI(temperature=0.7, model="gpt-3.5-turbo")
    | StrOutputParser()
)

# invoke 方法接受 callbacks 参数
response = chain_with_callbacks.invoke(
    {"product": "eco-friendly water bottles"},
    config={"callbacks": [MyCustomCallbackHandler()]}
)
print(f"链的最终响应 (带回调): {response}")

# 3. 使用 LangChain 提供的默认回调 (如 StdOutCallbackHandler 用于打印详细日志)
from langchain_core.callbacks.manager import CallbackManager
from langchain_core.callbacks.stdout import ConsoleCallbackHandler

print("\n--- StdOutCallbackHandler 示例 ---")
chain_with_stdout_callbacks = (
    ChatPromptTemplate.from_template("Explain the concept of {concept} in simple terms.")
    | ChatOpenAI(temperature=0.5, model="gpt-3.5-turbo")
    | StrOutputParser()
)

response_stdout = chain_with_stdout_callbacks.invoke(
    {"concept": "quantum entanglement"},
    config={"callbacks": [ConsoleCallbackHandler()]} # 或者直接 verbose=True 在某些组件上
)
print(f"链的最终响应 (StdOut 回调): {response_stdout}")
```

### 4.10 LCEL (LangChain Expression Language)

LCEL 是 LangChain 的强大之处，它提供了一种声明式的方式来组合 `Runnable` 对象。所有 LangChain 的核心组件（LLM、Prompt、Parser、Retriever、Tools 等）都实现了 `Runnable` 接口。

**LCEL 的优势:**
*   **可组合性**：使用 `|` 运算符轻松连接组件。
*   **流式处理**：原生支持流式输出。
*   **异步支持**：支持 `async/await`。
*   **并行化**：自动并行处理。
*   **回退机制**：轻松添加重试和回退逻辑。
*   **类型安全**：支持类型提示。
*   **调试和可观测性**：与 LangSmith 深度集成。

LCEL 的调用方法就是上面示例中大量使用的 `|` 操作符。

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

print("\n--- LCEL 核心思想示例 ---")

# 这是一个典型的 LCEL 链：
# 1. 定义 Prompt
# 2. 定义 LLM
# 3. 定义 Output Parser
# 4. 使用 | 连接它们
final_lcel_chain = (
    ChatPromptTemplate.from_template("Say hi to {person}.") # Prompt 是 Runnable
    | ChatOpenAI(temperature=0.8, model="gpt-3.5-turbo")    # LLM 是 Runnable
    | StrOutputParser()                                     # Parser 是 Runnable
)

output = final_lcel_chain.invoke({"person": "Alice"})
print(f"LCEL 链输出: {output}")

# LCEL 还可以结合 Python 函数 (包装成 RunnableLambda) 或 RunnablePassthrough.assign
def reverse_string(text: str) -> str:
    return text[::-1]

reverse_chain = (
    final_lcel_chain
    | reverse_string # Python 函数会自动包装成 RunnableLambda
)
reversed_output = reverse_chain.invoke({"person": "Bob"})
print(f"LCEL 链 (含 Python 函数) 输出: {reversed_output}")
```

## 五、LangChain 的优缺点与适用场景

### 5.1 优点：

1.  **高度模块化和可组合性**：所有组件都是可插拔的，易于构建、修改和复用。
2.  **LCEL 提供强大编排能力**：使得构建复杂链式应用变得直观、高效且可扩展。
3.  **支持 RAG 模式**：与向量数据库和嵌入模型深度集成，有效解决 LLM 知识限制。
4.  **Agent 能力强大**：通过工具扩展 LLM 边界，使其能够执行外部操作，实现复杂任务自动化。
5.  **广泛的模型和集成支持**：支持 OpenAI、HuggingFace、Anthropic 等多种 LLM 和各种工具集成。
6.  **活跃的社区与生态系统**：拥有庞大用户群、丰富的文档和工具，如 LangSmith 用于调试和评估。
7.  **异步和流式处理**：原生支持现代应用的需求。

### 5.2 缺点：

1.  **学习曲线陡峭**：概念多且抽象，API 繁杂，初学者需要投入较多时间理解。
2.  **抽象层级有时过高**：对于简单任务可能引入不必要的复杂性。
3.  **调试复杂性**：链式结构和 Agent 的决策循环可能难以调试和追踪。
4.  **性能考量**：多步骤链式调用可能增加延迟和成本。
5.  **快速迭代带来变化**：库更新频繁，API 可能有不兼容的改动。

### 5.3 适用场景：

*   **智能问答系统 (Q&A)**：结合 RAG 实现基于特定文档或知识库的问答。
*   **聊天机器人**：利用记忆模块实现多轮对话，通过工具扩展机器人功能。
*   **自动化工作流**：Agent 可以编排多个工具和 LLM 调用，完成复杂自动化任务。
*   **数据分析与报告生成**：结合代码解释器或数据分析工具，实现数据驱动的洞察和报告。
*   **代码生成与辅助**：利用 LLM 的代码理解和生成能力。
*   **自定义 AI 助手**：构建满足特定业务需求的智能助手。

## 六、安全性考虑

开发基于 LangChain 的 LLM 应用程序时，安全性至关重要：

1.  **API Key 管理**：
    *   **环境变量**：绝不将 API Key 硬编码在代码中，应通过环境变量 (`.env` 文件, 操作系统环境变量) 加载。
    *   **秘密管理服务**：在生产环境中，使用专门的秘密管理服务 (如 AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) 来存储和访问敏感凭据。
2.  **输入验证与过滤**：
    *   **用户输入**：对所有用户输入进行严格验证和清理，防止恶意注入，例如提示注入 (Prompt Injection)。
    *   **RAG 内容**：确保从外部数据源检索到的内容是可靠和无害的，防止恶意文档导致 LLM 偏离预期。
3.  **LLM 输出过滤**：
    *   **敏感信息泄露**：对 LLM 的输出进行审查，确保不泄露敏感信息。
    *   **有害内容**：过滤掉可能有害、不当或偏见的内容。
    *   **工具执行风险**：Agent 可能会调用外部工具。确保工具执行的指令是安全的，并且工具本身不会被滥用（例如，限制对文件系统或敏感 API 的访问）。
4.  **权限控制**：
    *   **工具权限**：为 Agent 提供的工具应遵循最小权限原则，仅授予完成任务所需的权限。
    *   **用户权限**：如果应用程序涉及多用户，应确保每个用户只能访问其有权操作的功能和数据。
5.  **数据隐私**：
    *   **敏感数据处理**：如果 LLM 处理敏感用户数据，必须确保符合 GDPR、HIPAA 等数据隐私法规。
    *   **数据驻留**：了解 LLM 服务提供商的数据处理政策和数据存储位置。
6.  **速率限制与成本管理**：
    *   合理设置 LLM API 的速率限制和最大令牌数，防止意外的高成本或拒绝服务。
7.  **可观测性与日志**：
    *   使用 LangSmith 或其他日志工具监控 Agent 和链的执行过程，及时发现异常行为和安全漏洞。

## 七、总结

LangChain 是 LLM 应用开发的强大基石，它通过提供模块化组件、灵活的编排能力和对复杂智能体的支持，极大地降低了开发门槛，加速了创新。理解其核心概念，并熟练运用 LLMs、Prompts、Parsers、Chains、Retrieval、Agents、Tools、Memory 等模块的调用方法，是构建强大、智能且可维护的 LLM 应用程序的关键。同时，开发者必须始终将安全性放在首位，确保应用程序的稳健和可靠。