---
title: LangChain Text Splitters 详解
date: 2025-11-03 06:24:00
tags:
  - 2025
  - LangChain
  - AI
  - LLM
categories:
  - AI
  - 开发框架
---
> **LangChain Text Splitters** 是 LangChain 框架中的一个核心模块，用于将长文档或文本智能地分割成更小、更易于管理和处理的块 (chunks)。这个过程对于大语言模型 (LLM) 相关的应用至关重要，特别是当处理的文本长度超出 LLM 的上下文窗口限制时。

{% note info %}
核心思想：**将长文本分割成大小适中、语义连贯且包含一定重叠的块，以便 LLM 能够有效处理这些块，同时保持上下文完整性。LangChain 提供多种具有不同策略的 Text Splitters，以适应不同的文本结构和应用场景。**
{% endnote %}
------

## 一、为什么需要 Text Splitters？

在构建基于 LLM 的应用程序（尤其是问答 RAG (Retrieval Augmented Generation) 系统、文档摘要、聊天机器人等）时，我们经常遇到以下问题：

1.  **LLM 上下文窗口限制 (Context Window Limit)**：大语言模型（如 GPT-3.5, GPT-4, Llama）通常有一个固定的最大输入长度。如果输入文本太长，会超出这个限制，导致模型无法处理。
2.  **性能和成本**：即使模型支持很长的上下文窗口，处理非常长的文本也会显著增加推理时间、降低效率，并提高 API 调用成本。
3.  **信息密度和噪音**：过长的文本可能包含大量无关信息，稀释了关键上下文，从而降低 LLM 响应的质量。
4.  **分块检索 (Chunking for Retrieval)**：在 RAG 系统中，我们需要在向量数据库中存储文档的小块，以便在接收到用户查询时，能够快速准确地检索到最相关的、大小合适的文本片段，而不是整个冗长的文档。
5.  **语义完整性**：简单地按固定字符数截断文本会破坏句子、段落甚至代码块的语义完整性，导致 LLM 无法理解片段的真实含义。

Text Splitters 的目标就是以一种智能的方式解决这些问题，确保每个文本块：

*   **大小合适**：符合 LLM 的上下文窗口或 embedding 模型的输入限制。
*   **语义连贯**：尽量不切断一个完整的句子或段落，避免破坏上下文。
*   **包含重叠**：通过块之间的重叠 (overlap)，在块边界处提供额外的上下文，避免关键信息被切断在两个不相关的块之间。

## 二、Text Splitters 的核心策略

LangChain 的 Text Splitters 通常遵循以下核心策略：

1.  **基于分隔符 (Delimiter-based Splitting)**：
    *   **概念**：尝试使用一组预定义的分隔符（如换行符 `\n\n`, `\n`, 空格 ` `）来切割文本。
    *   **优先级**：通常会尝试从更强烈的语义分隔符（如段落分隔符）开始，逐级向下尝试更细粒度的分隔符，直到满足块大小要求。
    *   **优点**：能较好地保留语义结构。
    *   **缺点**：如果分隔符不存在或分隔符旁边的文本过长，仍然可能需要进一步切割长段落。

2.  **字符计数 (Character Counting)**：
    *   **概念**：指定每个块的最大字符数 (`chunk_size`)。
    *   **优点**：简单直接。
    *   **缺点**：可能在句子或词语中间强行截断，破坏语义。

3.  **重叠 (Overlapping Chunks)**：
    *   **概念**：在切割文本时，让相邻的块之间共享一部分文本 (`chunk_overlap`)。
    *   **作用**：
        *   **保留上下文**：当一个概念或句子跨越两个块的边界时，重叠部分可以帮助模型从两个块中都能获取到相关上下文。
        *   **提高召回率**：在 RAG 场景中，即使查询只命中了一个块的重叠部分，也能帮助找到完整的语义块。
    *   **重要性**：一个良好定义的 `chunk_overlap` 对于 RAG 系统至关重要。

### 关键参数：

*   `chunk_size`：每个文本块的最大长度（通常以字符数或token数计）。
*   `chunk_overlap`：相邻文本块之间的重叠长度。
*   `separator`：用于分割文本的字符串或字符串列表。
*   `length_function`：一个自定义函数，用于计算文本块的长度（默认是 `len` 计算字符数，也可以用 `tokenizer.encode` 计算 token 数）。

## 三、LangChain 提供的主要 Text Splitters

LangChain 提供了多种 Text Splitters，每种都有其特定的设计目的和最佳实践。
安装`langchain-text-splitters`:
```bash
pip install -U langchain-text-splitters
```

### 3.1 `RecursiveCharacterTextSplitter`

这是 LangChain 中**最通用、最推荐**的文本分割器。它会递归地尝试使用一组分隔符进行分割。

*   **工作原理**：它维护一个分隔符列表（例如：`["\n\n", "\n", " ", ""]`）。
    1.  首先尝试使用第一个分隔符分割文本。
    2.  如果分割后的任一文本块仍然超过 `chunk_size`，则对该长块递归地使用下一个分隔符进行分割。
    3.  如果所有分隔符都尝试过了，并且块仍然过长，它会回退到按字符进行分割。
*   **优点**：灵活且智能，能够很好地保持文本的语义结构。
*   **适用场景**：绝大多数通用文本，如文章、报告、书籍等。

**代码示例:**

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text = """
LangChain 是一个强大的框架，用于开发基于大语言模型的应用程序。
它提供了构建LLM应用的模块化组件。这些应用包括问答、摘要、聊天机器人等。

使用LangChain，我们可以轻松地将大型复杂文档分割成小块。
这对于将文档嵌入到向量数据库中进行检索增强生成（RAG）至关重要。

例如，一个长篇研究报告可能包含多个章节和段落。
如果我们不进行智能分割，直接将整个报告输入给LLM，可能会超出其上下文窗口限制。
而RecursiveCharacterTextSplitter能够优雅地处理这类问题。它会优先根据段落、句子进行分割，并考虑重叠。
"""

# 初始化分割器
splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,  # 每个块的最大字符数
    chunk_overlap=20, # 块之间的重叠字符数
    separators=["\n\n", "\n", " ", ""] # 默认分隔符，可以自定义
)

# 分割文本
chunks = splitter.split_text(text)

print(f"原始文本长度: {len(text)} 字符")
print(f"分割成 {len(chunks)} 个块")
for i, chunk in enumerate(chunks):
    print(f"--- 块 {i+1} (长度: {len(chunk)}) ---")
    print(chunk)
```

### 3.2 `CharacterTextSplitter`

最基础的分割器。它只使用一个指定的字符作为分隔符，如果分隔后块仍然过大，会直接在任意位置截断。

*   **工作原理**：首先根据一个指定的 `separator` 进行分割。然后，如果任何一个分割后的块超过 `chunk_size`，它会将其直接截断为多个块。
*   **优点**：简单，易于理解和控制。
*   **缺点**：如果 `separator` 没有有效地分割文本，可能导致语义被破坏。
*   **适用场景**：当你知道文本结构非常规则，例如每行都是一个独立记录时。通常不推荐用于通用文本。

**代码示例:**

```python
from langchain_text_splitters import CharacterTextSplitter

text = "这是一段非常长的文本。它没有任何换行符或段落分隔。所以我们看它如何被切割。"

splitter = CharacterTextSplitter(
    separator="。", # 以句号作为分隔符
    chunk_size=20,
    chunk_overlap=5,
    length_function=len,
    is_separator_regex=False, # 分隔符是否是正则表达式
)

chunks = splitter.split_text(text)

print(f"分割成 {len(chunks)} 个块")
for i, chunk in enumerate(chunks):
    print(f"--- 块 {i+1} (长度: {len(chunk)}) ---")
    print(chunk)
```

### 3.3 `TokenTextSplitter`

将文本分割成由模型 token 长度控制的块，而不是字符长度。

*   **工作原理**：使用预训练模型的`tokenizer`来计算文本的长度，确保每个块的 token 数量不超过 `chunk_size` 的限制。
*   **优点**：更精确地匹配 LLM 或 Embedding 模型的输入限制，因为它们通常以 token 而非字符进行计数。
*   **缺点**：需要加载一个 tokenizer，可能引入额外的依赖。
*   **适用场景**：当你的 `chunk_size` 严格指代 token 数量，且需要精准控制 token 长度时。

**代码示例:**

```python
from langchain_text_splitters import TokenTextSplitter
from transformers import AutoTokenizer # 使用Hugging Face tokenizer

# 加载一个Hugging Face tokenizer
tokenizer = AutoTokenizer.from_pretrained("BEEGYM/bge-small-zh-v1.5") # 示例，可以换成你用的embedding模型对应的tokenizer

text = "这是使用 token 长度而不是字符长度进行切割的例子。它能够更精确地控制每个文本块的大小。"

# 定义一个长度函数，使用tokenizer计算token数量
def count_tokens(text: str) -> int:
    return len(tokenizer.encode(text))

splitter = TokenTextSplitter(
    chunk_size=10, # 每个块的最大token数
    chunk_overlap=2, # 块之间重叠的token数
    encoding_name="cl100k_base" # OpenAI tokenizers使用的编码名称，仅用于OAI模型
)
# 注意：TokenTextSplitter默认使用ticktoken库，对于其他模型需要传递自定义length_function。
# 或者直接使用 RecursiveCharacterTextSplitter 并传入自定义length_function

# 对于通用HuggingFace tokenizer，更推荐以下方式结合RecursiveCharacterTextSplitter
splitter_with_hf_tokenizer = RecursiveCharacterTextSplitter(
    chunk_size=20, # 字符数 (或其他长度单位，取决于length_function)
    chunk_overlap=5,
    length_function=count_tokens, # 使用自定义的token长度函数
    separators=["。", "\n", " ", ""],
)

chunks_hf = splitter_with_hf_tokenizer.split_text(text)

print(f"原始文本的token长度: {count_tokens(text)}")
print(f"分割成 {len(chunks_hf)} 个块 (由Hugging Face tokenizer计数)")
for i, chunk in enumerate(chunks_hf):
    print(f"--- 块 {i+1} (长度: {count_tokens(chunk)} tokens) ---")
    print(chunk)
```

### 3.4 `HTMLHeaderTextSplitter`

专门用于解析 HTML 文档，并根据 HTML 标题标签（如 `<h1>`, `<h2>`）进行分割，同时保留标题信息。

*   **工作原理**：它会解析 HTML 结构，并根据你提供的标题标签 (如 `h1`, `h2`, `h3`) 作为分隔符。分割后的块会自动将相关的标题信息作为元数据包含进来。
*   **优点**：非常适合结构化的 HTML 文档，能更好地捕获语义层次。
*   **适用场景**：网页内容、Markdown 转换的 HTML 文档等。

**代码示例:**

```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import HTMLHeaderTextSplitter

html_document = """
<!DOCTYPE html>
<html>
<body>
    <h1>Llamas</h1>
    <p>Llamas are members of the camelid family native to South America.</p>
    <h2>Description</h2>
    <p>They are well-known for their wool and as pack animals.</p>
    <h3>Size and Weight</h3>
    <p>Adult llamas typically stand 1.7 to 1.8 meters (5.6 to 5.9 ft) tall at the top of the head.</p>
    <h2>Habitat</h2>
    <p>Llamas are found in the Andes mountains.</p>
</body>
</html>
"""

# 指定要分割的标题标签及其级别
headers_to_split_on = [
    ("h1", "Header 1"),
    ("h2", "Header 2"),
    ("h3", "Header 3"),
]

html_splitter = HTMLHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

docs = html_splitter.split_text(html_document)

print(f"分割成 {len(docs)} 个文档块")
for i, doc in enumerate(docs):
    print(f"--- 文档块 {i+1} ---")
    print(f"内容:\n{doc.page_content[:100]}...")
    print(f"元数据: {doc.metadata}")
    print("-" * 20)
```

### 3.5 `MarkdownHeaderTextSplitter`

类似 `HTMLHeaderTextSplitter`，但专门用于 Markdown 文档，根据 Markdown 标题 (`#`, `##`) 进行分割。

*   **工作原理**：解析 Markdown 语法，使用 Markdown 标题作为分隔符。
*   **优点**：适用于Markdown文档，能保持其结构。
*   **适用场景**：GitHub README、技术文档、博客文章等 Markdown 格式内容。

**代码示例:**

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter

markdown_document = """
# LangChain 中的文本分割器

## 为什么需要文本分割器？

*   LLM上下文窗口限制
*   性能和成本

## 主要文本分割器

### RecursiveCharacterTextSplitter

这是最推荐的一个。

### MarkdownHeaderTextSplitter

专门用于Markdown文件。
"""

headers_to_split_on = [
    ("#", "Header1"),
    ("##", "Header2"),
    ("###", "Header3"),
]

markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

docs = markdown_splitter.split_text(markdown_document)

print(f"分割成 {len(docs)} 个文档块")
for i, doc in enumerate(docs):
    print(f"--- 文档块 {i+1} ---")
    print(f"内容:\n{doc.page_content.strip()}...")
    print(f"元数据: {doc.metadata}")
    print("-" * 20)
```

### 其他 Text Splitters:

*   **`Language` 特定分割器**：如 `PythonCodeTextSplitter`, `JSCodeTextSplitter` 等，它们针对特定编程语言的代码结构进行分割，例如按函数、类定义分割，这对于代码理解和生成任务非常有用。
*   **`SemanticChunker`**：一种更高级的、基于嵌入和聚类的方法，旨在根据语义相似性而不是简单的分隔符来分割文本。这可以创建出语义上更连贯的块，但计算成本也更高。

## 四、选择合适的 Text Splitter

选择正确的 Text Splitter 对于 RAG 系统的性能至关重要。以下是一些指导原则：

1.  **了解你的文本结构**：
    *   **通用散文 (文章、报告)**：`RecursiveCharacterTextSplitter` 是首选。
    *   **HTML/XML 文档**：`HTMLHeaderTextSplitter`。
    *   **Markdown 文档**：`MarkdownHeaderTextSplitter`。
    *   **代码文件**：`PythonCodeTextSplitter` 等 `Language` 特定分割器。
    *   **高度结构化，且知道固定分隔符**：`CharacterTextSplitter` (配合合适的 `separator`)。
2.  **考虑 LLM 或 Embedding 模型的输入限制**：
    *   `chunk_size` 应该根据你的下游模型（LLM 或 Embedding 模型）的上下文窗口和性能要求来设定。通常，Embedding 模型的输入限制比 LLM 小。
    *   如果需要严格控制 Token 数，可以结合 `length_function` 自定义 token 计数器。
3.  **合理设置 `chunk_overlap`**：
    *   `chunk_overlap` 通常设置为 `chunk_size` 的 10%-20% 左右。过小的重叠可能导致上下文丢失，过大的重叠会增加冗余和计算成本。
    *   对于非常概念密集型或语义关联紧密的文本，可以适当增加重叠。
4.  **实验和评估**：
    *   没有通用的“最佳”分割器和参数组合。针对你的具体数据和任务，进行实验和评估至关重要。
    *   可以通过查看分割后的块、进行问答测试、或衡量 RAG 系统的召回率和准确率来评估效果。

## 五、总结

LangChain 的 Text Splitters 模块为处理长文本数据提供了强大而灵活的解决方案。通过智能地将长文档分解为适宜大小、语义连贯且具有良好重叠的块，它们能够有效克服 LLM 的上下文窗口限制，优化 RAG 系统的检索效率和质量。

理解不同 Text Splitters 的工作原理、适用场景以及 `chunk_size` 和 `chunk_overlap` 等关键参数的设置，是构建高性能 LLM 应用，特别是 RAG 系统的基石。在实际开发中，应根据文本的特点和具体的应用需求，选择最合适的分割策略，并通过迭代和评估来优化分割效果。