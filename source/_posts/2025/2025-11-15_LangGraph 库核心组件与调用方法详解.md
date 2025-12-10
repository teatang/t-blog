---
title: LangGraph 库核心组件与调用方法详解
date: 2025-11-15 06:24:00
tags:
  - 2025
  - LangChain
  - AI
  - LLM
categories:
  - AI
  - 开发框架
---

> **LangGraph** 是 LangChain 生态系统中的一个高级库，它允许开发者使用**有向无环图 (DAG)** 的方式构建健壮、有状态且可控的 LLM 应用。它特别适用于需要多步骤推理、代理 (Agent) 行为、循环和人工干预的复杂工作流。LangGraph 的核心优势在于其明确的状态管理和对图结构的直接建模能力，使得构建和调试复杂代理系统变得更加直观和可靠。

{% note info %}
核心思想：**将多步骤的 LLM 应用程序建模为状态机，其中每个节点代表一个操作（LLM 调用、工具调用、函数等），边代表状态转换。通过在节点之间传递和修改状态，实现复杂、有循环的工作流。它解决了传统 LangChain Chain 在处理复杂逻辑（特别是循环和条件分支）时的局限性。**
{% endnote %}

------

## 一、LangGraph 核心概念

LangGraph 的设计基于图论和状态机的思想。理解以下核心概念是使用 LangGraph 的基础：

1.  **State (状态)**：
    *   表示整个应用程序在某个时间点的数据快照。
    *   通过 `StateDict` 对象传递，它是一个字典或类似字典的结构。
    *   节点操作通常会接收当前状态，并返回一个表示状态更新的 `StateDict`。
    *   支持 `TypedDict` 或 `dataclass` 来定义强类型状态，提高可读性和健壮性。
    *   LangGraph 会智能地合并每个节点返回的状态更新（例如，对于字典类型的状态，它会执行深合并）。

2.  **Node (节点)**：
    *   图中的基本处理单元。每个节点封装了一个独立的操作。
    *   可以是一个 LLM 调用、一个工具调用、一个 Python 函数、或另一个 LangChain Chain。
    *   节点接收当前状态作为输入，执行其逻辑，并返回一个状态更新。

3.  **Edge (边)**：
    *   连接节点，决定了执行流程的路径。
    *   分为两种主要类型：
        *   **Conditional Edges (条件边)**：根据节点的输出（通常是一个字符串或字典中的特定字段）来决定下一个要执行的节点。例如，代理可能会输出一个“tool_call”指令，系统根据此指令跳转到工具执行节点。
        *   **Direct Edges (直接边)**：无条件地从一个节点直接跳转到另一个节点。

4.  **Graph (图)**：
    *   由节点和边构成，定义了应用程序的完整工作流。
    *   `StateGraph` 是带有明确状态管理的图，是我们主要使用的构建块。
    *   可以通过 `add_node()`, `add_edge()`, `add_conditional_edges()`, `set_entry_point()`, `set_finish_point()` 等方法来构建。

5.  **Agent (代理)**：
    *   在 LangGraph 中，代理通常是一个特殊的节点，它利用 LLM 的推理能力，根据当前状态决定下一步行动（是调用工具还是直接给出答案）。
    *   LangGraph 的图结构非常适合实现复杂的 ReAct (Reasoning and Acting) 或 COT (Chain of Thought) 代理模式。

## 二、安装与基础构建块

首先，确保安装了 LangGraph 和必要的 LLM 库（如 OpenAI）：

```bash
pip install langgraph langchain_openai
```

### 2.1 定义应用程序状态 (State)

使用 `TypedDict` 来定义应用程序的状态，这是最佳实践。它使状态结构清晰、易于理解和调试。

```python
from typing import List, TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage

# 定义应用程序的状态
class AgentState(TypedDict):
    """
    一个 TypedDict，用于在图中的节点之间传递状态。

    Attributes:
        messages: 这是一个列表，包含对话历史中的所有消息。
        original_query: 原始的用户输入，有时需要保留。
        tool_output: 上一个工具调用的输出。
        # 可以根据需要添加更多状态变量，例如：
        # num_steps: int
        # current_task: str
    """
    messages: Annotated[List[BaseMessage], operator.add]
    original_query: str
    tool_output: Annotated[List[dict], operator.add] # 存放工具调用的输出
```

*   **`messages: Annotated[List[BaseMessage], operator.add]`**: 这是一个关键的 LangGraph 特性。`Annotated` 结合 `operator.add` 告诉 LangGraph，当不同节点提供 `messages` 更新时，应该将它们简单地**追加**到现有列表中，而不是替换。这对于维护对话历史非常有用。
*   **`operator.add`**: 对于列表类型，它会执行 `list.extend()` 操作。对于数字，它会相加。对于字典，它会执行合并操作。

### 2.2 定义图节点 (Nodes)

每个节点都是一个 Python 函数，接收当前 `state` 作为输入，并返回一个 `StateDict` 来更新状态。

**LLM 调用节点示例：**

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
import os

# 配置 OpenAI API Key
# 确保在运行前设置环境变量：export OPENAI_API_KEY="sk-..."
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 定义一个 LLM 节点，用于处理用户请求
def call_llm(state: AgentState):
    print("---CALL LLM NODE---")
    messages = state["messages"]

    # 代理LLM需要一个明确的系统提示，指导其如何行动
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个强大的AI助手，可以回答问题和使用工具。"),
        MessagesPlaceholder(variable_name="messages"),
    ])
  
    # 绑定工具，使LLM知道它可以使用哪些工具
    # 假设我们有一个工具列表 `tools`
    # llm_with_tools = llm.bind_tools(tools) # 如果LLM需要决定工具调用
    llm_with_tools = llm # 仅用于生成文本回复，不进行工具调用决策
  
    response = llm_with_tools.invoke(messages)
  
    # 返回状态更新，将LLM的响应追加到消息列表中
    return {"messages": [response]}
```

**工具调用节点示例：**

```python
# 定义一个简单的工具
@tool
def search_web(query: str) -> str:
    """根据查询执行网络搜索并返回结果。"""
    print(f"---EXECUTING WEB SEARCH FOR: {query}---")
    # 实际应用中可以集成搜索引擎API (如 Brave Search, SerpAPI 等)
    if "天气" in query:
        return " today is sunny in Shanghai, 28 degrees celsius."
    elif "Python LangGraph" in query:
        return "LangGraph is a library for building stateful, multi-actor applications with LLMs."
    else:
        return f"Simulated search result for '{query}'"

# 假设我们有更多的工具
tools = [search_web]

# 定义一个工具调用节点
def call_tool(state: AgentState):
    print("---CALL TOOL NODE---")
    messages = state["messages"]
    last_message = messages[-1]

    # LLM通常会以ToolCall消息的形式指示工具调用
    if not last_message.tool_calls:
        raise ValueError("LLM did not request a tool call.")

    # 遍历所有工具调用并执行它们
    tool_outputs = []
    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        # 根据工具名称查找并执行对应的工具
        tool_found = False
        for t in tools:
            if t.name == tool_name:
                print(f"  Executing tool: {tool_name} with args: {tool_args}")
                output = t.invoke(tool_args)
                tool_outputs.append(output)
              
                # 将工具的输出作为ToolMessage添加到messages中，供LLM后续使用
                messages.append(ToolMessage(content=str(output), tool_call_id=tool_call["id"]))
                tool_found = True
                break
        if not tool_found:
             print(f"  Tool {tool_name} not found.") # 实际应是错误处理

    return {"messages": messages[-1:], "tool_output": tool_outputs} # 只返回最新的ToolMessage和tool_output
```

### 2.3 定义条件边函数 (Conditional Edges Function)

条件边函数接收当前状态，并返回一个字符串，该字符串对应着图中的某个节点名称，或特定的终止指令 (`END`)。

```python
# 定义一个条件边函数，用于决定下一步的路由
def should_continue(state: AgentState):
    print("---CHECK LLM OUTPUT (CONDITIONAL EDGE)---")
    last_message = state["messages"][-1]
  
    # 如果LLM的最新消息有工具调用，说明需要执行工具
    if last_message.tool_calls:
        print("  Decision: TOOL CALL")
        return "call_tool"
    else:
        # 否则，LLM已经给出了最终答案或普通回复
        print("  Decision: END (or direct answer)")
        return "end_chat" # 或者可以是一个辅助节点来处理最终回复
```

## 三、构建与编译图 (Build and Compile the Graph)

使用 `StateGraph` 来定义整个工作流。

```python
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage

# 创建一个 StateGraph 实例，并指定状态类型
workflow = StateGraph(AgentState)

# 添加节点
workflow.add_node("llm", call_llm) # LLM 决策或生成回复
workflow.add_node("call_tool", call_tool) # 执行工具
# workflow.add_node("end_chat", process_final_answer) # 可以添加一个节点专门处理最终回复，这里直接END

# 设置入口点 (Entry Point)
workflow.set_entry_point("llm") # 聊天通常从 LLM 开始，进行初始判断或回复

# 添加条件边：LLM 节点后的逻辑
# 根据 should_continue 函数的返回值，决定是进入 'call_tool' 还是 'end_chat'
workflow.add_conditional_edges(
    "llm",          # 源节点
    should_continue, # 条件函数
    {               # 映射：条件函数的返回值 -> 目标节点
        "call_tool": "call_tool",
        "end_chat": END # 如果是最终回复，则结束图执行
    }
)

# 添加直接边：工具执行完成后，通常会返回 LLM，让 LLM 根据工具输出继续推理
workflow.add_edge("call_tool", "llm") # 工具执行完后，将结果传回 LLM 继续处理

# 编译图，准备执行
app = workflow.compile()
print("---GRAPH COMPILED---")

# 可视化图 (需要安装 graphviz: pip install pydot graphviz)
# try:
#     from IPython.display import Image
#     Image(app.get_graph().draw_png())
# except ImportError:
#     print("Graphviz not installed, cannot draw graph.")
```

**Mermaid 图示 (简化代理工作流)：**

{% mermaid %}
graph TD
    start("开始 (用户输入)") --> llm_node(("LLM (思考/生成/决策)"))
    llm_node --> |条件：需要工具| call_tool_node("调用工具")
    call_tool_node --> llm_node
    llm_node --> |条件：直接回复| end_node("结束 (返回答案)")
    end_node(["END"])
{% endmermaid %}

## 四、调用和执行图 (Invoke and Execute the Graph)

编译后的图可以通过 `app.invoke()` 方法执行。

```python
import uuid

# 设置环境变量，LangGraph 默认使用 UUID 作为 Thread ID (如果未提供)
os.environ["LANGCHAIN_TRACING_V2"] = "true" # 开启 LangSmith Debugging
os.environ["LANGCHAIN_API_KEY"] = "sk-..." # 替换为您的 LangSmith API Key
os.environ["LANGCHAIN_PROJECT"] = "LangGraph_Demo" # 项目名称

# 模拟用户输入
user_query = "上海今天的天气怎么样？"
unique_thread_id = str(uuid.uuid4()) # 为每次对话生成唯一ID，用于 LangSmith Trace

# 准备初始状态
initial_state = {
    "messages": [HumanMessage(content=user_query)],
    "original_query": user_query,
    "tool_output": []
}

# 执行图
print(f"\n---STARTING GRAPH EXECUTION FOR '{user_query}'---")
final_state = app.invoke(
    initial_state,
    {"configurable": {"thread_id": unique_thread_id}} # 传递线程ID，方便在 LangSmith 中追踪
)

print("\n---GRAPH EXECUTION FINISHED---")
print("Final State Messages:")
for msg in final_state["messages"]:
    print(f"  {msg.type.upper()}: {msg.content}")

print(f"\nFinal AI Response: {final_state['messages'][-1].content}")

# 再次执行一个不需要工具的查询
print("\n-------------------------------------------------")
user_query_2 = "什么是 LangGraph？"
unique_thread_id_2 = str(uuid.uuid4())

initial_state_2 = {
    "messages": [HumanMessage(content=user_query_2)],
    "original_query": user_query_2,
    "tool_output": []
}

print(f"\n---STARTING GRAPH EXECUTION FOR '{user_query_2}'---")
final_state_2 = app.invoke(
    initial_state_2,
    {"configurable": {"thread_id": unique_thread_id_2}} # 传递线程ID
)

print("\n---GRAPH EXECUTION FINISHED---")
print("Final State Messages:")
for msg in final_state_2["messages"]:
    print(f"  {msg.type.upper()}: {msg.content}")

print(f"\nFinal AI Response: {final_state_2['messages'][-1].content}")
```

## 五、高级特性和注意事项

### 5.1 检查点 (Checkpoints)

LangGraph 允许为每个线程保存图的状态（检查点），以便中断后从上次的状态继续执行。这对于长时间运行的代理会话或人工审核流程非常有用。

```python
from langgraph.checkpoint.memory import MemorySaver

# 创建一个内存检查点存储器（生产环境应使用数据库）
memory_checkpoint = MemorySaver()

# 重新编译图，集成检查点
app_with_checkpoint = workflow.compile(checkpointer=memory_checkpoint)

# 首次执行时，将状态保存到 `thread_id`
thread_id = "user-session-123"
initial_state_c = {"messages": [HumanMessage(content="你好，帮我查一下旧金山的天气。")]}
app_with_checkpoint.invoke(initial_state_c, {"configurable": {"thread_id": thread_id}})

# 稍后，可以根据 thread_id 恢复并继续执行
# 假设 LLM 返回了工具调用，并保存了检查点
# 再次调用，会从上次的检查点开始
next_state = app_with_checkpoint.invoke(
    # 可以在这里添加一些新的用户消息，如果会话继续的话
    {"messages": [HumanMessage(content="好的，谢谢。")]},
    {"configurable": {"thread_id": thread_id}}
)

print(f"\n--- Resumed state for thread {thread_id} ---")
for msg in next_state["messages"]:
    print(f"  {msg.type.upper()}: {msg.content}")
```

### 5.2 并行执行 (Parallel Execution)

LangGraph 节点默认是同步执行的。如果需要并行执行多个不互相依赖的操作（例如同时调用多个工具），可以手动在单个节点内部实现多线程或异步编程。LangGraph 本身并不直接支持节点间的并行分支执行（因为它是一个序列图），但它非常适合编排那些可以在节点内部并行化的操作。

或者，如果需要更复杂的子图并行，可以考虑将某个并行执行的逻辑封装成一个嵌套的 LangGraph 子图，然后在主图中作为一个节点调用。

### 5.3 人工审核 (Human-in-the-Loop)

LangGraph 的状态机特性使其非常适合构建人工审核或干预的工作流。可以在某个节点之后添加一个条件边，判断是否需要人工干预，如果需要，则将状态暂停，等待人工输入后，再恢复执行。

```python
# 伪代码示例
# def should_get_human_feedback(state: AgentState):
#     if state["llm_output_confidence"] < 0.7:
#         return "human_feedback_node"
#     return "continue_processing"
#
# workflow.add_node("human_feedback_node", wait_for_human_input_function)
# workflow.add_conditional_edges("llm_output_node", should_get_human_feedback, {
#     "human_feedback_node": "human_feedback_node",
#     "continue_processing": "next_node"
# })
# workflow.add_edge("human_feedback_node", "llm_reprocess_node") # 人工反馈后返回LLM重新处理
```

### 5.4 动态图构建

虽然通常是预先定义图，但 LangGraph 也允许一定程度的动态图构建。例如，可以根据用户的输入或当前状态，在运行时选择性地添加、修改或跳过节点和边。不过，这会增加图的复杂性。

## 六、总结

LangGraph 是构建复杂、有状态、多步骤 LLM 应用程序的强大工具。通过将应用程序建模为状态机和图，它克服了传统 LangChain Chain 在处理循环、条件分支和显式状态管理方面的局限性。

**核心优势包括：**

*   **显式状态管理**：通过 `AgentState` 明确定义和更新应用程序状态。
*   **灵活的控制流**：支持条件边和图循环，实现复杂的代理行为（如 ReAct 模式）。
*   **模块化和可组合性**：将独立操作封装成节点，易于测试、调试和重用。
*   **内置检查点**：支持会话的暂停和恢复，实现鲁棒的长会话应用。
*   **适用于代理**：是实现高级自主代理和多代理系统的理想选择。

掌握 LangGraph 的核心组件和调用方法，将使您能够构建出更具韧性、更智能、更接近通用人工智能的 LLM 应用程序。