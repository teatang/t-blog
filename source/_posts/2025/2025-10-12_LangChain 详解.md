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

> **LangChain** 是一个用于开发由大型语言模型 (LLMs) 驱动的应用程序的框架。它提供了一套模块化、灵活的工具和抽象，使得开发者能够将 LLMs 与外部数据源、计算逻辑以及其他工具进行结合，从而构建出更复杂、更强大的应用程序。LangChain 的核心思想是**链式化 (Chaining)** 不同的组件，以实现复杂的逻辑。

{% note info %}
核心思想：**将大型语言模型 (LLMs) 的能力与其他数据源和计算逻辑解耦、模块化，并通过链 (Chains)、代理 (Agents) 等机制进行编排，以创建高度智能且可扩展的应用程序。** Python 作为 AI 和数据科学领域的主流语言，提供了功能全面且易于使用的 LangChain 库实现。
{% endnote %}
------

## 一、LangChain 核心概念与组件

LangChain 的设计是围绕一系列可组合的抽象组件构建的，这些组件可以独立使用，也可以通过“链”的方式连接起来，形成复杂的工作流。以下是 LangChain 的主要核心组件：

*   **Models (模型)**：与各种大型语言模型 (LLMs) 进行交互的接口。
    *   **LLMs (Large Language Models)**：用于文本生成和完成。
    *   **Chat Models (聊天模型)**：为对话式应用优化，接收和返回聊天消息列表。
    *   **Embeddings (嵌入模型)**：将文本转换为向量表示，用于语义搜索和相似性比较。
*   **Prompts (提示)**：管理和优化与 LLM 交互的提示词。
    *   **Prompt Templates (提示模板)**：结构化提示词的工具。
    *   **Chat Prompt Templates (聊天提示模板)**：为聊天模型设计的多消息提示词结构。
*   **Output Parsers (输出解析器)**：从 LLM 的响应中提取结构化信息。
*   **Document Loaders (文档加载器)**：从各种来源加载数据，转换为 `Document` 对象。
*   **Text Splitters (文本分割器)**：将长文本分割成适合 LLM 处理的小块。
*   **Vector Stores (向量存储)**：存储和检索文本嵌入的数据库。
*   **Retrievers (检索器)**：从存储中获取相关文档的泛化接口。
*   **Chains (链)**：将 LLMs 与其他组件（如提示、解析器、检索器）组合在一起，形成特定的应用逻辑。
*   **Agents (代理)**：赋予 LLMs 决策能力，使其能够使用一系列工具来解决复杂问题。
*   **Tools (工具)**：代理可以调用的外部功能或服务（如搜索、计算器、API 调用）。
*   **Memory (记忆)**：为会话提供状态，使链或代理能够记住之前的交互。

## 二、模型 (Models) 调用方法

Models 是 LangChain 与底层 LLM/Chat Model/Embedding Model 交互的基础接口。

在开始之前，请确保已安装必要的库并设置好 API 密钥：
```bash
pip install langchain langchain-openai chromadb sentence-transformers
export OPENAI_API_KEY="your_openai_api_key_here" # 或者在代码中直接传入
```

### 2.1 LLMs (Large Language Models)

LLMs 接口用于文本完成 (text completion)。它们接收一个字符串输入，并返回一个字符串输出。

```python
import os
from langchain_openai import OpenAI

def call_llm_model():
    # 确保环境变量 OPENAI_API_KEY 已设置
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 初始化 OpenAI LLM 客户端
    # 可以指定不同的模型，例如 "gpt-3.5-turbo-instruct", "text-davinci-003"
    llm = OpenAI(model_name="gpt-3.5-turbo-instruct", temperature=0.7)

    # 调用 LLM 生成文本
    prompt = "讲一个关于人工智能的简短笑话。"
    completion = llm.invoke(prompt)

    print(f"Prompt: {prompt}")
    print(f"Completion: {completion}")

if __name__ == "__main__":
    call_llm_model()

# 预期输出示例 (实际输出会因模型和温度而异):
# Prompt: 讲一个关于人工智能的简短笑话。
# Completion: \n\n为什么AI喜欢去博物馆？因为它喜欢回顾它的“历史记录”！
```

### 2.2 Chat Models (聊天模型)

Chat Models 提供一个基于消息的接口，接收一系列聊天消息作为输入，并返回一条聊天消息。这更适合对话场景。

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

def call_chat_model():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 初始化 OpenAI Chat Model 客户端
    # 使用如 "gpt-4o", "gpt-3.5-turbo" 等模型
    chat = ChatOpenAI(model_name="gpt-4o", temperature=0.7)

    # 构造聊天消息列表
    messages = [
        SystemMessage(content="你是一个会讲冷笑话的助手。"),
        HumanMessage(content="讲一个关于程序员的冷笑话。"),
    ]

    # 调用 Chat Model
    completion = chat.invoke(messages)

    print(f"Prompt Messages: {messages}")
    print(f"Completion: {completion}")
    print(f"Content: {completion.content}")

if __name__ == "__main__":
    call_chat_model()

# 预期输出示例 (实际输出会因模型和温度而异):
# Prompt Messages: [SystemMessage(content='你是一个会讲冷笑话的助手。'), HumanMessage(content='讲一个关于程序员的冷笑话。')]
# Completion: AIMessage(content='为什么程序员总是喜欢穿连帽衫？\n\n因为这样他们就可以在思考的时候把系统“罩”起来！')
# Content: 为什么程序员总是喜欢穿连帽衫？
#
# 因为这样他们就可以在思考的时候把系统“罩”起来！
```

### 2.3 Embeddings (嵌入模型)

嵌入模型将文本转换为数值向量，捕捉文本的语义信息。这些向量可用于检索、聚类、相似度搜索等任务。

```python
import os
from langchain_openai import OpenAIEmbeddings

def call_embedding_model():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 初始化 OpenAI Embedding 客户端
    # 可以指定不同的模型，例如 "text-embedding-3-small", "text-embedding-ada-002"
    embedder = OpenAIEmbeddings(model="text-embedding-3-small")

    # 要嵌入的文本列表
    texts = [
        "我爱吃披萨。",
        "披萨是我最喜欢的食物。",
        "狗是一种忠实的宠物。",
        "猫喜欢玩毛线球。",
    ]

    # 调用嵌入模型生成向量
    embeddings = embedder.embed_documents(texts)

    print("Generated Embeddings:")
    for i, emb in enumerate(embeddings):
        print(f"Text: \"{texts[i]}\" -> Embedding (first 5 dims): {emb[:5]}...")
        print(f"  Vector Dimension: {len(emb)}")

if __name__ == "__main__":
    call_embedding_model()

# 预期输出示例 (向量值会是浮点数，维度取决于模型):
# Generated Embeddings:
# Text: "我爱吃披萨。" -> Embedding (first 5 dims): [-0.015, -0.016, 0.005, -0.012, 0.008]...
#   Vector Dimension: 1536
# Text: "披萨是我最喜欢的食物。" -> Embedding (first 5 dims): [-0.013, -0.009, 0.002, -0.015, 0.006]...
#   Vector Dimension: 1536
# ...
```

## 三、提示 (Prompts) 调用方法

Prompts 用于构建和管理发送给 LLMs 的文本。LangChain 提供了模板化和格式化提示词的工具。

### 3.1 PromptTemplate (提示模板)

`PromptTemplate` 用于 LLM（文本完成模型），它使用占位符来动态插入变量值。

```python
from langchain_core.prompts import PromptTemplate

def use_prompt_template():
    # 创建一个提示模板
    template = "写一篇关于 {topic} 的短文，主题是 {theme}。字数限制在 {word_count} 字以内。"
    prompt_template = PromptTemplate.from_template(template)

    # 填充变量并格式化提示词
    formatted_prompt = prompt_template.format(
        topic="人工智能在医学领域的应用",
        theme="机遇与挑战",
        word_count=200
    )

    print("Formatted Prompt (Template):")
    print(formatted_prompt)

if __name__ == "__main__":
    use_prompt_template()

# 预期输出示例:
# Formatted Prompt (Template):
# 写一篇关于 人工智能在医学领域的应用 的短文，主题是 机遇与挑战。字数限制在 200 字以内。
```

### 3.2 ChatPromptTemplate (聊天提示模板)

`ChatPromptTemplate` 用于 Chat Models，它支持定义系统消息、人类消息、AI 消息等多种类型的消息模板。

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts.message import SystemMessagePromptTemplate, HumanMessagePromptTemplate

def use_chat_prompt_template():
    # 创建聊天提示模板的各个部分
    system_message_template = SystemMessagePromptTemplate.from_template(
        "你是一个友好的AI助手，擅长讲解{language}编程。"
    )
    human_message_template = HumanMessagePromptTemplate.from_template(
        "请用简单的语言解释{concept}。"
    )

    # 组合成一个聊天提示模板
    chat_prompt_template = ChatPromptTemplate.from_messages([
        system_message_template,
        human_message_template,
    ])

    # 填充变量并格式化聊天消息列表
    messages = chat_prompt_template.format_messages(
        language="Python",
        concept="生成器"
    )

    print("Formatted Chat Messages:")
    for msg in messages:
        print(f"- Type: {msg.type}, Content: {msg.content}")

if __name__ == "__main__":
    use_chat_prompt_template()

# 预期输出示例:
# Formatted Chat Messages:
# - Type: system, Content: 你是一个友好的AI助手，擅长讲解Python编程。
# - Type: human, Content: 请用简单的语言解释生成器。
```

## 四、输出解析器 (Output Parsers) 调用方法

Output Parsers 用于将 LLM 生成的原始文本输出转换为结构化的数据格式，如 JSON、列表等。

```python
from langchain_core.output_parsers import CommaSeparatedListOutputParser, PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.pydantic_v1 import BaseModel, Field

def use_output_parsers():
    # 示例1：CommaSeparatedListOutputParser，用于解析逗号分隔的列表
    list_parser = CommaSeparatedListOutputParser()
    input_str = "苹果,香蕉,橘子,梨"
    parsed_list = list_parser.parse(input_str)
    print(f"Parsed List (CommaSeparatedListOutputParser): {parsed_list}")

    # 示例2：PydanticOutputParser，用于解析结构化数据 (JSON)
    # 定义 Pydantic 模型来描述期望的输出结构
    class Person(BaseModel):
        name: str = Field(description="人的姓名")
        age: int = Field(description="人的年龄")
        city: str = Field(description="人居住的城市")

    parser = PydanticOutputParser(pydantic_object=Person)

    # 通常，这个格式指令会通过 PromptTemplate 传递给 LLM
    format_instructions = parser.get_format_instructions()
    print("\n格式指令 (用于引导LLM生成特定格式):")
    print(format_instructions)

    # 假设 LLM 返回了以下 JSON 字符串
    json_output = '{"name": "Alice", "age": 28, "city": "Beijing"}'
    try:
        parsed_person = parser.parse(json_output)
        print(f"\nParsed JSON (PydanticOutputParser): {parsed_person}")
        print(f"  Name: {parsed_person.name}")
        print(f"  Age: {parsed_person.age}")
    except OutputParserException as e:
        print(f"Error parsing JSON: {e}")

if __name__ == "__main__":
    use_output_parsers()

# 预期输出示例:
# Parsed List (CommaSeparatedListOutputParser): ['苹果', '香蕉', '橘子', '梨']
#
# 格式指令 (用于引导LLM生成特定格式):
# The output should be a markdown code snippet formatted in a JSON blob.
# The JSON blob should adhere to the following structure:
# ```json
# {
#   "name": string // 人的姓名
#   "age": integer // 人的年龄
#   "city": string // 人居住的城市
# }
# ```
#
# Parsed JSON (PydanticOutputParser): name='Alice' age=28 city='Beijing'
#   Name: Alice
#   Age: 28
```

## 五、文档加载器 (Document Loaders) 与文本分割器 (Text Splitters)

这两个组件是处理外部数据以供 LLM 使用的关键。

### 5.1 Document Loaders (文档加载器)

Document Loaders 负责从各种数据源（如文件、网页、数据库）加载数据，并将其封装成 `Document` 对象。

```python
import os
from langchain_community.document_loaders import TextLoader

def use_document_loader():
    # 创建一个临时文件作为示例
    temp_file_path = "example_document.txt"
    content = """这是一个关于LangChain Python库的文档。
它提供了一系列工具来构建LLM驱动的应用。
LangChain Python非常有助于将AI能力集成到Python项目中。
"""
    with open(temp_file_path, "w", encoding="utf-8") as f:
        f.write(content)

    try:
        # 使用 TextLoader 加载文本文件
        loader = TextLoader(temp_file_path, encoding="utf-8")
        docs = loader.load()

        print("Loaded Documents:")
        for i, doc in enumerate(docs):
            print(f"Document {i+1}:")
            print(f"  PageContent: {doc.page_content.strip()}")
            print(f"  Metadata: {doc.metadata}")
    finally:
        # 清理临时文件
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    use_document_loader()

# 预期输出示例:
# Loaded Documents:
# Document 1:
#   PageContent: 这是一个关于LangChain Python库的文档。
# 它提供了一系列工具来构建LLM驱动的应用。
# LangChain Python非常有助于将AI能力集成到Python项目中。
#   Metadata: {'source': 'example_document.txt'}
```

### 5.2 Text Splitters (文本分割器)

Text Splitters 将大型文档分割成更小的、适合 LLM 上下文窗口的块。常用的分割策略包括按字符、按递归字符、按 token 等。

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def use_text_splitter():
    long_text = """LangChain 是一个强大的框架，旨在帮助开发者构建由大型语言模型驱动的应用程序。
它通过提供模块化组件和灵活的 API，简化了将 LLMs 集成到各种应用中的过程。
LangChain 的核心思想是围绕可组合的抽象构建，如 Models、Prompts、Chains、Agents 和 Tools。
这意味着您可以将不同的功能单元连接起来，形成复杂的工作流。
例如，您可以创建一个链，首先从数据库中检索相关信息，然后使用 LLM 基于这些信息生成回答。
这种模块化设计使得应用程序更易于开发、测试和维护。
"""
    doc = Document(page_content=long_text)

    # 初始化 RecursiveCharacterTextSplitter
    # 它会尝试不同的分隔符（如换行符、空格、标点符号），并递归地分割文本
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=100,      # 每个 chunk 最多 100 个字符
        chunk_overlap=20,   # chunk 之间有 20 个字符的重叠，用于保持上下文
        length_function=len # 使用字符长度而非 token 长度
    )

    # 分割文档
    chunks = splitter.split_documents([doc])

    print(f"Original Text Length: {len(long_text)}")
    print(f"Number of Chunks: {len(chunks)}")
    print("Split Chunks:")
    for i, chunk in enumerate(chunks):
        print(f"--- Chunk {i+1} (Length {len(chunk.page_content)}) ---")
        print(chunk.page_content)

if __name__ == "__main__":
    use_text_splitter()

# 预期输出示例 (内容会根据 chunk_size 和 chunk_overlap 动态生成):
# Original Text Length: 279
# Number of Chunks: 4
# Split Chunks:
# --- Chunk 1 (Length 99) ---
# LangChain 是一个强大的框架，旨在帮助开发者构建由大型语言模型驱动的应用程序。
# 它通过提供模块化组件和灵活的 API，简化了将 LLMs 集成到各种应用中的过程。
# --- Chunk 2 (Length 90) ---
# 它通过提供模块化组件和灵活的 API，简化了将 LLMs 集成到各种应用中的过程。
# LangChain 的核心思想是围绕可组合的抽象构建，如 Models、Prompts、Chains、Agents 和 Tools。
# --- Chunk 3 (Length 99) ---
# LangChain 的核心思想是围绕可组合的抽象构建，如 Models、Prompts、Chains、Agents 和 Tools。
# 这意味着您可以将不同的功能单元连接起来，形成复杂的工作流。
# --- Chunk 4 (Length 73) ---
# 形成复杂的工作流。
# 例如，您可以创建一个链，首先从数据库中检索相关信息，然后使用 LLM 基于这些信息生成回答。
# 这种模块化设计使得应用程序更易于开发、测试和维护。
```

## 六、向量存储 (Vector Stores) 与检索器 (Retrievers)

这两个组件是实现信息检索 (Retrieval Augmented Generation, RAG) 的核心。

### 6.1 Vector Stores (向量存储)

Vector Stores 存储文本的嵌入向量，并支持高效的相似性搜索。LangChain 支持多种向量存储，如 Chroma、FAISS、Pinecone 等。

```python
import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

def use_vector_store():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 1. 初始化嵌入模型
    embedder = OpenAIEmbeddings(model="text-embedding-3-small")

    # 2. 创建一些文档
    docs = [
        Document(page_content="披萨是一种起源于意大利的美味食物。"),
        Document(page_content="意大利位于欧洲南部，以其丰富的历史和文化而闻名。"),
        Document(page_content="法国的首都是巴黎，以埃菲尔铁塔而闻名。"),
        Document(page_content="AI 的未来是充满无限可能的。"),
    ]

    # 3. 初始化 Chroma 向量存储
    # Chroma 可以运行在内存中，也可以有持久化存储
    # 这里使用内存模式作为示例
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embedder,
        # persist_directory="./chroma_db" # 如果需要持久化
    )
    # vectorstore.persist() # 如果使用了持久化，需要调用此方法
    print("Documents added to vector store (Chroma).")

    # 4. 进行相似性搜索
    query = "关于意大利食物的信息是什么？"
    retrieved_docs = vectorstore.similarity_search(query, k=2) # 检索最相似的2个文档

    print(f"\nQuery: \"{query}\"")
    print("Retrieved Documents:")
    for i, rd in enumerate(retrieved_docs):
        print(f"Doc {i+1}: {rd.page_content}")

if __name__ == "__main__":
    use_vector_store()

# 预期输出示例:
# Documents added to vector store (Chroma).
#
# Query: "关于意大利食物的信息是什么？"
# Retrieved Documents:
# Doc 1: 披萨是一种起源于意大利的美味食物。
# Doc 2: 意大利位于欧洲南部，以其丰富的历史和文化而闻名。
```

### 6.2 Retrievers (检索器)

检索器是向量存储的一个泛化接口，它基于一个查询字符串返回相关文档。向量存储通常通过实现 `Retriever` 接口来提供检索功能。

在 LangChain 中，许多向量存储（如 Chroma）本身就实现了 `Retriever` 接口，可以直接当作检索器使用。

```python
import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

def use_retriever():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    embedder = OpenAIEmbeddings(model="text-embedding-3-small")

    docs = [
        Document(page_content="猫是可爱的宠物，喜欢睡觉和玩耍。"),
        Document(page_content="狗是人类最好的朋友，忠诚且活泼。"),
        Document(page_content="鸟儿在天空中自由飞翔。"),
        Document(page_content="鱼生活在水中，用鳃呼吸。"),
    ]

    # 创建一个内存中的 Chroma 向量存储
    vectorstore = Chroma.from_documents(docs, embedder)
    print("Documents added to vector store (Chroma).")

    # 将向量存储包装成一个 Retriever
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2}) # 检索最相似的2个文档

    # 使用检索器进行查询
    query = "关于猫的信息是什么？"
    retrieved_docs = retriever.invoke(query)

    print(f"\nQuery: \"{query}\"")
    print("Retrieved Documents:")
    for i, rd in enumerate(retrieved_docs):
        print(f"Doc {i+1}: {rd.page_content}")

if __name__ == "__main__":
    use_retriever()

# 预期输出示例:
# Documents added to vector store (Chroma).
#
# Query: "关于猫的信息是什么？"
# Retrieved Documents:
# Doc 1: 猫是可爱的宠物，喜欢睡觉和玩耍。
# Doc 2: 狗是人类最好的朋友，忠诚且活泼。
```

## 七、链 (Chains) 调用方法

Chains 是 LangChain 的核心概念之一，它允许将多个 LLM 调用、提示模板和数据处理步骤组合成一个有向无环图 (DAG)，以实现复杂的逻辑。

{% mermaid %}
graph TD
    A[用户输入] --> B[PromptTemplate 格式化]
    B --> C{LLM 模型调用}
    C --> D[Output Parser 解析]
    D --> E[最终结果/下一步操作]
{% endmermaid %}

### 7.1 LLMChain

`LLMChain` 是最基础的链，用于将 `PromptTemplate` 与 `LLM` 或 `ChatModel` 结合。

```python
import os
from langchain_openai import OpenAI
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain

def use_llm_chain():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 1. 初始化 LLM
    llm = OpenAI(model_name="gpt-3.5-turbo-instruct", temperature=0.7)

    # 2. 创建 PromptTemplate
    template = "请概括以下文本，使其不超过 {words} 个字：\n\n{text}"
    prompt = PromptTemplate.from_template(template)

    # 3. 创建 LLMChain
    # 在 LangChain 0.1.x 版本后，链的创建和调用方式有所变化
    # 对于简单的 LLMChain，可以直接使用 Runnable 接口的 .pipe() 和 .invoke() 等
    # 或者对于更复杂的组合，可以用 LangChain Expression Language (LCEL)
    chain = prompt | llm

    # 4. 调用链
    input_vars = {
        "words": "50",
        "text": """LangChain 是一个致力于帮助开发者构建由大型语言模型驱动的应用程序的框架。
它提供了一套模块化、灵活的工具和抽象，使得开发者能够将 LLMs 与外部数据源、
计算逻辑以及其他工具进行结合，从而构建出更复杂、更强大的应用程序。
LangChain 的核心思想是链式化 (Chaining) 不同的组件，以实现复杂的逻辑。
Python 社区通过 LangChain 库，将 LangChain 的核心概念和功能带到了 Python 生态系统，
使得 Python 开发者也能利用 LangChain 的强大能力。"""
    }
    result = chain.invoke(input_vars)

    print("Original Text:")
    print(input_vars["text"])
    print(f"\nSummarized Text ({input_vars['words']} words):")
    print(result.strip()) # strip() for cleaner output

if __name__ == "__main__":
    use_llm_chain()

# 预期输出示例 (实际概括内容会因模型而异):
# Original Text:
# LangChain 是一个致力于帮助开发者构建由大型语言模型驱动的应用程序的框架。
# 它提供了一套模块化、灵活的工具和抽象，使得开发者能够将 LLMs 与外部数据源、
# 计算逻辑以及其他工具进行结合，从而构建出更复杂、更强大的应用程序。
# LangChain 的核心思想是链式化 (Chaining) 不同的组件，以实现复杂的逻辑。
# Python 社区通过 LangChain 库，将 LangChain 的核心概念和功能带到了 Python 生态系统，
# 使得 Python 开发者也能利用 LangChain 的强大能力。
#
# Summarized Text (50 words):
# LangChain 是一个框架，帮助开发者利用大型语言模型构建应用。它提供模块化工具和抽象，将LLMs与外部数据、计算逻辑结合，构建复杂程序。核心思想是链式化，使Python开发者能利用其强大功能。
```

### 7.2 Retrieval QA Chain (RAG)

Retrieval QA Chain 是一个常见的链模式，用于结合检索 (Retrieval) 和问答 (Question Answering)。它将用户查询作为输入，从文档集合中检索相关信息，然后使用 LLM 基于这些信息生成答案。这是 RAG (Retrieval Augmented Generation) 模式的典型实现。

{% mermaid %}
graph TD
    A[用户问题] --> B["检索器 (Retriever)"]
    B --> C[相关文档]
    C --> D[PromptTemplate 结合文档与问题]
    D --> E{LLM 模型调用}
    E --> F[答案]
{% endmermaid %}

```python
import os
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

def use_retrieval_qa_chain():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 1. 初始化 Chat Model 用于问答
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0)

    # 2. 初始化嵌入模型
    embedder = OpenAIEmbeddings(model="text-embedding-3-small")

    # 3. 准备文档并初始化向量存储
    docs = [
        Document(page_content="LangChain 是一个用于开发由大型语言模型 (LLMs) 驱动的应用程序的框架。"),
        Document(page_content="它的核心思想是将 LLMs 与外部数据源、计算逻辑以及其他工具进行结合。"),
        Document(page_content="Python 的 `langchain` 库提供了 LangChain 的核心概念和功能实现。"),
        Document(page_content="`langchain` 使得 Python 开发者也能构建复杂的 LLM 应用程序。"),
        Document(page_content="Python 是一个由 Guido van Rossum 创建的流行编程语言。"),
    ]

    vectorstore = Chroma.from_documents(docs, embedder)
    print("Documents added to vector store (Chroma).")

    # 4. 创建检索器
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2}) # 检索2个最相关的文档

    # 5. 创建 Prompt Template 用于 RAG
    # 这个模板会接收 "context" (检索到的文档) 和 "input" (用户问题)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "用以下检索到的上下文回答用户的问题。如果无法从上下文中找到答案，就说不知道。不要编造答案。\n\n{context}"),
        ("human", "{input}"),
    ])

    # 6. 将文档与提示合并，形成文档链
    document_chain = create_stuff_documents_chain(llm, prompt)

    # 7. 创建 RetrievalQAChain
    # create_retrieval_chain 结合了检索器和文档链
    retrieval_chain = create_retrieval_chain(retriever, document_chain)

    # 8. 调用链进行问答
    question = "LangChain Python 是什么？它有什么用？"
    response = retrieval_chain.invoke({"input": question})

    print(f"\nQuestion: \"{question}\"")
    print(f"Answer: {response['answer']}")
    print("\nSource Documents:")
    for doc in response["context"]:
        print(f"- {doc.page_content}")

if __name__ == "__main__":
    use_retrieval_qa_chain()

# 预期输出示例 (答案和源文档会根据检索结果和模型响应而异):
# Documents added to vector store (Chroma).
#
# Question: "LangChain Python 是什么？它有什么用？"
# Answer: LangChain Python 库是 LangChain 框架的 Python 实现，它提供核心概念和功能，使得 Python 开发者能够构建由大型语言模型 (LLMs) 驱动的复杂应用程序，并将 LLMs 与外部数据源、计算逻辑以及其他工具进行结合。
#
# Source Documents:
# - Python 的 `langchain` 库提供了 LangChain 的核心概念和功能实现。
# - `langchain` 使得 Python 开发者也能构建复杂的 LLM 应用程序。
```

## 八、代理 (Agents) 与工具 (Tools) 调用方法

Agents 使 LLM 能够决策和执行操作。它们选择要使用的工具，并基于工具的输出进行思考和行动。Tools 是代理可以调用的函数或服务。

{% mermaid %}
graph TD
    A["用户输入 (问题)"] --> B{"Agent (LLM)"}
    B --> C{Thought: 需要使用什么工具？}
    C --> D{"Action: 使用某工具 (e.g., Google Search)"}
    D --> E[Observation: 工具返回结果]
    E --> B
    B -- 如果问题解决 --> F[Final Answer: 最终答案]
    B -- 如果需要更多工具 --> C
{% endmermaid %}

### 8.1 Tools (工具)

Tools 是代理可以调用的外部功能。LangChain 提供了多种内置工具（如计算器、搜索），也可以自定义工具。

```python
import os
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.tools.tavily_search import TavilySearchResults # 一个简单的搜索工具
from langchain.tools import tool # 用于自定义工具的装饰器

def use_agents_and_tools():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return
    # Tavily API Key for search tool (可选, 如果不使用搜索工具可以不设置)
    # export TAVILY_API_KEY="your_tavily_api_key_here"

    # 1. 初始化 LLM
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0)

    # 2. 定义工具
    # 示例：内置搜索工具
    search_tool = TavilySearchResults(max_results=3) # 限制搜索结果数量

    # 示例：自定义工具
    @tool
    def word_count_tool(text: str) -> int:
        """计算给定文本中的单词数量。"""
        return len(text.split())

    agent_tools = [search_tool, word_count_tool]

    # 3. 创建 Agent Prompt Template
    # OpenAI Functions Agent 需要一个特定的提示结构
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个乐于助人的助手，会使用可用的工具来回答问题。"),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    # 4. 创建 Agent
    # create_openai_functions_agent 是专门为 OpenAI 函数调用模型设计的
    agent = create_openai_functions_agent(llm, agent_tools, prompt)

    # 5. 创建 Agent Executor
    # AgentExecutor 是运行代理的引擎，它管理代理的思考、行动和观察循环
    agent_executor = AgentExecutor(agent=agent, tools=agent_tools, verbose=True)

    # 6. 调用 Agent Executor
    question1 = "计算 'Hello LangChain World' 这句话有多少个单词？"
    print(f"\n--- Question 1: {question1} ---")
    result1 = agent_executor.invoke({"input": question1, "chat_history": []})
    print(f"Answer 1: {result1['output']}")

    if os.getenv("TAVILY_API_KEY") is not None:
        question2 = "2024年奥运会在哪个城市举行？"
        print(f"\n--- Question 2: {question2} ---")
        result2 = agent_executor.invoke({"input": question2, "chat_history": []})
        print(f"Answer 2: {result2['output']}")
    else:
        print("\nTAVILY_API_KEY not set. Skipping search tool example.")


if __name__ == "__main__":
    use_agents_and_tools()

# 预期输出示例 (verbose=True 会打印详细的思考过程):
# --- Question 1: 计算 'Hello LangChain World' 这句话有多少个单词？ ---
# > Entering new AgentExecutor chain...
# {
#     "color": "green",
#     "kwargs": {
#         "log_or_template": "\nI need to count the number of words in the given text. The `word_count_tool` is suitable for this task.\n",
#         "log": "\nI need to count the number of words in the given text. The `word_count_tool` is suitable for this task.\n"
#     },
#     "type": "tool",
#     "name": "Thought"
# }
# {
#     "color": "yellow",
#     "kwargs": {
#         "log_or_template": "tool_code",
#         "log": "Calling tool \"word_count_tool\" with text: \"Hello LangChain World\"\n"
#     },
#     "type": "tool",
#     "name": "Action"
# }
# {
#     "tool_name": "word_count_tool",
#     "tool_input": "Hello LangChain World",
#     "log": "Input to word_count_tool: Hello LangChain World"
# }5
# {
#     "color": "blue",
#     "kwargs": {
#         "log_or_template": "\nI have successfully used the `word_count_tool` and the result is 3. Now I can provide the final answer.\n",
#         "log": "\nI have successfully used the `word_count_tool` and the result is 3. Now I can provide the final answer.\n"
#     },
#     "type": "tool",
#     "name": "Observation"
# }
# > Finished chain.
# Answer 1: 'Hello LangChain World' 这句话有 3 个单词。
#
# --- Question 2: 2024年奥运会在哪个城市举行？ ---
# > Entering new AgentExecutor chain...
# {
#     "color": "green",
#     "kwargs": {
#         "log_or_template": "\nI need to find out the host city for the 2024 Olympic Games. I should use a search tool for this.\n",
#         "log": "\nI need to find out the host city for the 2024 Olympic Games. I should use a search tool for this.\n"
#     },
#     "type": "tool",
#     "name": "Thought"
# }
# {
#     "color": "yellow",
#     "kwargs": {
#         "log_or_template": "tool_code",
#         "log": "Calling tool \"tavily_search_results\" with text: \"2024 Olympics host city\"\n"
#     },
#     "type": "tool",
#     "name": "Action"
# }
# {
#     "tool_name": "tavily_search_results",
#     "tool_input": "2024 Olympics host city",
#     "log": "Calling tool \"tavily_search_results\" with text: \"2024 Olympics host city\""
# }
# [
#   {'url': '...', 'content': '...Host city: Paris'},
#   ...
# ]
# {
#     "color": "blue",
#     "kwargs": {
#         "log_or_template": "\n根据搜索结果，2024年奥运会将在法国巴黎举行。我可以直接给出答案。\n",
#         "log": "\n根据搜索结果，2024年奥运会将在法国巴黎举行。我可以直接给出答案。\n"
#     },
#     "type": "tool",
#     "name": "Observation"
# }
# > Finished chain.
# Answer 2: 2024年奥运会将在法国巴黎举行。
```

## 九、记忆 (Memory) 调用方法

Memory 组件允许链和代理保留对话历史，从而在多轮交互中保持上下文。

```python
import os
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

def use_memory():
    if os.getenv("OPENAI_API_KEY") is None:
        print("Error: OPENAI_API_KEY environment variable not set.")
        return

    # 1. 初始化 Chat Model
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0.7)

    # 2. 创建记忆 (ConversationBufferMemory 存储完整的聊天历史)
    conv_memory = ConversationBufferMemory(return_messages=True)

    # 3. 创建一个带有记忆功能的对话链 (Conversation Chain)
    # LangChain 0.1.x+ 推荐使用 LCEL 风格的链或 create_retrieval_chain 等高级函数
    # 对于 ConversationChain, 仍可直接使用，但 Prompt 需要MessagesPlaceholder
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "你是一个知识渊博的AI助手。"),
        MessagesPlaceholder(variable_name="history"), # 占位符用于插入历史消息
        ("human", "{input}"),
    ])

    # 创建 Conversation Chain
    conversation_chain = ConversationChain(
        llm=llm,
        memory=conv_memory,
        prompt=prompt_template,
        verbose=True # 详细输出链的运行过程
    )

    # 4. 多轮对话
    inputs = [
        "你好，你叫什么名字？",
        "我来自中国上海，你来自哪里？",
        "你觉得中国的传统文化怎么样？",
    ]

    for i, user_input in enumerate(inputs):
        print(f"\n--- User Input {i+1}: {user_input} ---")
        response = conversation_chain.invoke({"input": user_input})
        print(f"AI Response {i+1}: {response['response']}")

    # 打印记忆中的完整对话历史
    print("\n--- Full Conversation History in Memory ---")
    # conv_memory.buffer 是一个消息列表
    for msg in conv_memory.buffer:
        print(f"- {msg.type.capitalize()}: {msg.content}")

if __name__ == "__main__":
    use_memory()

# 预期输出示例 (verbose=True会打印更多信息，对话内容会因模型和温度而异):
# --- User Input 1: 你好，你叫什么名字？ ---
# > Entering new ConversationChain chain...
# Prompt after formatting:
# System: 你是一个知识渊博的AI助手。
# Human: 你好，你叫什么名字？
# > Finished chain.
# AI Response 1: 我是一个大型语言模型，由 Google 训练。
#
# --- User Input 2: 我来自中国上海，你来自哪里？ ---
# > Entering new ConversationChain chain...
# Prompt after formatting:
# System: 你是一个知识渊博的AI助手。
# Human: 你好，你叫什么名字？
# AI: 我是一个大型语言模型，由 Google 训练。
# Human: 我来自中国上海，你来自哪里？
# > Finished chain.
# AI Response 2: 我没有具体的物理位置，我是一个 AI，存在于服务器和我的程序代码中。
#
# --- User Input 3: 你觉得中国的传统文化怎么样？ ---
# > Entering new ConversationChain chain...
# Prompt after formatting:
# System: 你是一个知识渊博的AI助手。
# Human: 你好，你叫什么名字？
# AI: 我是一个大型语言模型，由 Google 训练。
# Human: 我来自中国上海，你来自哪里？
# AI: 我没有具体的物理位置，我是一个 AI，存在于服务器和我的程序代码中。
# Human: 你觉得中国的传统文化怎么样？
# > Finished chain.
# AI Response 3: 中国的传统文化非常丰富多彩，历史悠久，充满了智慧和艺术价值。从儒家思想、道家哲学到诗词歌赋、戏曲、书法、国画，再到传统节日和精湛的手工艺，都展现了中华民族独特的魅力和深厚的底蕴。这些文化遗产不仅影响了中国人的生活方式和价值观，也对世界文明产生了深远的影响。
#
# --- Full Conversation History in Memory ---
# - Human: 你好，你叫什么名字？
# - Ai: 我是一个大型语言模型，由 Google 训练。
# - Human: 我来自中国上海，你来自哪里？
# - Ai: 我没有具体的物理位置，我是一个 AI，存在于服务器和我的程序代码中。
# - Human: 你觉得中国的传统文化怎么样？
# - Ai: 中国的传统文化非常丰富多彩，历史悠久，充满了智慧和艺术价值。从儒家思想、道家哲学到诗词歌赋、戏曲、书法、国画，再到传统节日和精湛的手工艺，都展现了中华民族独特的魅力和深厚的底蕴。这些文化遗产不仅影响了中国人的生活方式和价值观，也对世界文明产生了深远的影响。
```

## 十、总结

LangChain Python 库提供了一个强大且模块化的框架，极大地简化了基于大型语言模型的应用开发。通过理解并掌握其核心组件——LLMs、Prompts、Outputs Parsers、Chains、Agents、Tools 以及 Memory——开发者能够：

*   **高效集成**：轻松接入主流的 LLMs 和 Embedding 模型。
*   **灵活编排**：通过链式结构（特别是 LangChain Expression Language, LCEL）将多个步骤组合，实现复杂的逻辑流。
*   **智能决策**：通过代理和工具赋予 LLM 外部操作的能力，突破 LLM 自身知识的限制。
*   **上下文感知**：利用记忆功能维持多轮对话的连贯性。
*   **数据驱动**：结合文档加载器、文本分割器和向量存储，实现高效的检索增强生成 (RAG)。

随着人工智能技术的不断发展，LangChain 将继续在构建下一代智能应用中扮演关键角色。Python 开发者可以利用 LangChain 的能力，将先进的 LLM 功能无缝集成到他们的项目中，从而构建高性能、可扩展的 AI 应用。