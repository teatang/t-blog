---
title: 通过 PostgreSQL 触发器设计可靠的消息队列
date: 2025-04-09 06:24:00
tags: 
    - 2025
    - PostgreSQL
    - 数据库
categories: 
    - 中间件
    - PostgreSQL
---

> **PostgreSQL** 作为一款功能强大的关系型数据库管理系统 (RDBMS)，其事务特性、数据持久性以及对并发处理的良好支持，使其在特定场景下能够被用来构建**可靠的消息队列**。虽然专用的消息队列系统（如 Kafka, RabbitMQ, Redis Streams）在吞吐量、扩展性和复杂路由方面表现更优，但对于中低流量、对事务一致性要求高，且希望复用现有数据库基础设施的应用而言，使用 PostgreSQL 触发器和 `LISTEN/NOTIFY` 机制实现消息队列是一种可行且成本效益高的方案。本文将详细探讨如何利用 PostgreSQL 的核心特性来设计一个具备事务保障和至少一次交付能力的消息队列。

{% note info %}
核心思想：利用 PostgreSQL 的**事务性写入**确保消息的原子性入队，通过 `AFTER INSERT` **触发器**结合 `NOTIFY` 机制实现对新增消息的即时通知，同时消费者利用 **`SELECT FOR UPDATE SKIP LOCKED`** 在事务中安全地获取并处理消息，最终通过**事务提交或回滚**来保证消息的至少一次交付。
{% endnote %}
------

## 一、背景与动机

在分布式系统中，消息队列是实现服务解耦、异步通信和流量削峰填谷的关键组件。虽然有许多成熟的专用消息队列产品，但在以下情况下，考虑使用 PostgreSQL 作为消息队列具有独特的优势：

1.  **现有基础设施复用**：如果项目已经重度依赖 PostgreSQL，且不希望引入新的运维复杂性，使用现有数据库可以简化架构。
2.  **事务一致性要求高**：对于某些业务逻辑，消息的入队必须与业务数据的更新处于同一数据库事务中，以确保数据一致性。例如，下单成功后才发送订单处理消息。PostgreSQL 可以原生支持这种原子性。
3.  **流量不高或可接受的延迟**：对于中低吞吐量的场景，PostgreSQL 能够提供足够的性能。
4.  **至少一次交付 (At-Least-Once Delivery)**：PostgreSQL 的事务机制天然支持消息的至少一次交付语义。

然而，这种设计也存在局限性，例如在高吞吐量场景下可能面临性能瓶颈，扩展性不如分布式消息队列，以及 `LISTEN/NOTIFY` 机制的连接数限制。因此，它适用于特定场景而非所有情况。

## 二、核心组件与机制

利用 PostgreSQL 构建消息队列主要依赖以下几个核心机制：

1.  **消息表 (Message Table)**：用于持久化存储待处理的消息。
2.  **`INSERT` 操作**：生产者将消息原子性地写入消息表。
3.  **触发器 (Trigger)**：在消息写入（`INSERT`）后自动执行，发出通知。
4.  **`LISTEN/NOTIFY` 机制**：生产者通过触发器发出通知，消费者通过 `LISTEN` 监听通道以获取消息提醒。
5.  **`SELECT FOR UPDATE SKIP LOCKED`**：消费者在事务中并发安全地获取消息，防止多个消费者处理同一条消息。
6.  **事务 (Transactions)**：确保消息处理的原子性，即要么成功处理并删除，要么未成功处理并留待重试。

## 三、消息队列设计

### 3.1 消息表结构设计

首先，我们需要一个表来存储消息。一个典型的消息表结构可能如下：

```sql
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,           -- 消息唯一ID
    payload JSONB NOT NULL,             -- 消息内容，使用JSONB存储复杂结构
    created_at TIMESTAMPTZ DEFAULT NOW(), -- 消息创建时间
    processed_at TIMESTAMPTZ,           -- 消息处理时间 (可选，用于软删除或审计)
    status TEXT DEFAULT 'pending'       -- 消息状态 (可选，'pending', 'processing', 'completed', 'failed')
);

-- 添加索引，优化按创建时间查询或按状态查询
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
-- 如果使用status，则该索引也有用
-- CREATE INDEX IF NOT EXISTS idx_messages_status_created_at ON messages (status, created_at) WHERE status = 'pending';
```

**说明：**
*   `id`：`BIGSERIAL` 提供自动递增的唯一 ID。
*   `payload`：`JSONB` 是 PostgreSQL 特有的高效 JSON 存储类型，支持索引和查询，非常适合存储灵活的消息数据。
*   `created_at`：记录消息入队时间，常用于消息排序和清理。
*   `processed_at`, `status`：这些字段是可选的。如果采取“硬删除”策略（处理成功即删除），则不需要。如果需要“软删除”（更新状态而非删除，以便审计、重试或延迟清理），则它们非常有用。在本文中，为了简化，我们将主要关注“硬删除”模式，但在消费者部分会提及软删除的替代方案。

### 3.2 触发器与 `NOTIFY` 机制

为了实现消息的即时通知，我们会在 `messages` 表的 `INSERT` 操作上定义一个触发器。这个触发器会向一个特定的 `channel` 发送 `NOTIFY` 信号，并可以附带消息的 ID 作为 payload。

首先，定义一个触发器函数：

```sql
CREATE OR REPLACE FUNCTION notify_message_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- 通知 channel 'message_queue'，payload 为新插入消息的 ID
    -- NEW.id 包含新插入行的 ID
    PERFORM pg_notify('message_queue_channel', NEW.id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

接着，创建触发器并将其绑定到 `messages` 表的 `INSERT` 事件：

```sql
CREATE TRIGGER messages_notify_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_message_queue();
```

**说明：**
*   `pg_notify('channel', 'payload')`：这是 PostgreSQL 内置的函数，用于发送通知。`'channel'` 是通道名称，`'payload'` 是一个字符串，通常用于携带少量关键信息（如消息 ID）。
*   `AFTER INSERT FOR EACH ROW`：表示在每次插入操作成功后，对每一行执行触发器函数。
*   `NEW.id::text`：`NEW` 是一个特殊变量，表示刚刚插入的行。我们将 `id` 字段转换为文本作为通知的 payload。

### 3.3 生产者 (Producer)

生产者向消息表中插入消息。由于 `INSERT` 操作本身是事务性的，如果生产者在同一个事务中执行其他业务逻辑和消息插入，那么消息的入队将与业务逻辑的成功或失败保持原子一致。

```sql
BEGIN;

-- 业务逻辑操作...
-- 例如：INSERT INTO orders (...) VALUES (...);

-- 插入消息到消息队列
INSERT INTO messages (payload) VALUES ('{"order_id": 123, "event": "order_created"}');

COMMIT; -- 事务提交，消息才会被持久化并触发NOTIFY
```

如果 `COMMIT` 成功，消息将安全入队并发出 `NOTIFY`。如果 `ROLLBACK`，则消息不会入队。

### 3.4 消费者 (Consumer)

消费者负责监听消息通道，并在收到通知时获取并处理消息。关键在于如何并发安全地获取消息并保证至少一次交付。

**消费者逻辑流程图 (Mermaid):**

{% mermaid %}
graph TD
    A[Consumer Start] --> B{"LISTEN 'message_queue_channel'"};
    B --> C{Wait for NOTIFY or Timeout};
    C -- NOTIFY received --> D["Parse Notification Payload (e.g., message ID)"];
    C -- Timeout --> E["Poll for messages (optional, robustness)"];
    D --> F{Start Transaction};
    E --> F;
    F --> G{SELECT id, payload FROM messages WHERE id = notified_id_or_oldest_pending FOR UPDATE SKIP LOCKED LIMIT 1;};
    G -- Message acquired --> H{Process Message};
    H --> I{DELETE FROM messages WHERE id = acquired_id;};
    I --> J{COMMIT Transaction};
    J --> B;
    G -- No message or locked --> K{"ROLLBACK Transaction (if an explicit selection was made)"};
    K --> B;
    H -- Processing Error --> L{ROLLBACK Transaction};
    L --> M[Handle Error: Log, Re-insert/Update Status for Retry];
    M --> B;
{% endmermaid %}

**解释：**

1.  **`LISTEN`**：消费者首先连接到 PostgreSQL 数据库，并执行 `LISTEN 'message_queue_channel'` 命令。一旦有 `NOTIFY` 消息发送到这个通道，PostgreSQL 会通知所有监听该通道的客户端。
2.  **`NOTIFY` 或轮询**：
    *   收到 `NOTIFY` 后，消费者知道有新消息可用，可以立即尝试获取。payload 携带的消息 ID 可以用于定向获取，提高效率。
    *   为了健壮性，即使没有收到 `NOTIFY`（例如，`NOTIFY` 可能由于网络问题丢失或消费者重启后错过），消费者也应该定期（例如，每隔几秒）进行轮询，以确保不会漏掉任何消息。
3.  **`SELECT FOR UPDATE SKIP LOCKED`**：
    *   这是确保并发安全和至少一次交付的核心。当多个消费者同时尝试获取消息时：
        *   `FOR UPDATE` 会在选定的行上放置行级排他锁。
        *   `SKIP LOCKED` 告诉 PostgreSQL，如果遇到已经被其他事务锁定的行，则跳过这些行并返回未锁定的行。这避免了消费者之间的相互阻塞。
        *   `LIMIT 1` 确保每次只获取一条消息进行处理。
        *   消息选择条件 (`WHERE id = notified_id_or_oldest_pending`)：
            *   如果有 `NOTIFY` 带来的具体 `id`，可以直接 `WHERE id = $1`。
            *   如果没有特定 `id`（例如，轮询模式或`NOTIFY`只通知有新消息而没有具体ID），则使用 `ORDER BY created_at ASC` 来获取最早的消息。
    *   **关键：** 整个消息获取、处理和删除/更新必须在一个事务中完成。
4.  **处理消息**：消费者安全地获取消息后，执行业务逻辑来处理消息内容。
5.  **`COMMIT` 或 `ROLLBACK`**：
    *   如果消息处理成功，消费者在事务中执行 `DELETE FROM messages WHERE id = $1;` 来移除消息，然后 `COMMIT` 事务。`DELETE` 操作本身受到事务的保护。
    *   如果消息处理失败（例如，因为业务错误或外部服务不可用），事务应该 `ROLLBACK`。回滚后，之前 `SELECT FOR UPDATE` 获得的锁会被释放，并且 `DELETE` 操作也不会实际发生，消息会被保留在表中，可供后续重试。

**消费者（Go 语言示例）：**

```go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL 驱动
)

const (
	pgConnStr   = "postgres://user:password@localhost:5432/dbname?sslmode=disable"
	channelName = "message_queue_channel"
)

// Message represents the structure of a message in the database
type Message struct {
	ID      int64           `json:"id"`
	Payload json.RawMessage `json:"payload"`
}

func main() {
	db, err := sql.Open("postgres", pgConnStr)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	log.Println("Connected to PostgreSQL")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start listening for notifications
	go listenForNotifications(ctx, db)

	// Start polling for messages (as a fallback/initial load)
	go pollForMessages(ctx, db)

	// Keep main goroutine alive
	select {}
}

// listenForNotifications establishes a LISTEN connection and processes notifications
func listenForNotifications(ctx context.Context, db *sql.DB) {
	conn, err := db.Conn(ctx)
	if err != nil {
		log.Printf("Failed to get connection for LISTEN: %v", err)
		return
	}
	defer conn.Close()

	// LISTEN command must be executed within a transaction, but notifications are received outside the transaction.
	_, err = conn.ExecContext(ctx, fmt.Sprintf("LISTEN %s", channelName))
	if err != nil {
		log.Printf("Error executing LISTEN: %v", err)
		return
	}

	for {
		select {
		case <-ctx.Done():
			log.Println("Listener shutdown.")
			return
		default:
			// Use a context with timeout for notification waiting
			// Actual pq driver (github.com/lib/pq) provides a Notify channel
			// This simplified example assumes a pseudo-blocking wait
			// In real applications, use pq.Listener or check driver specific notification handling
			log.Println("Waiting for notifications...")
			time.Sleep(5 * time.Second) // Simulate waiting, real implementation would block on notification

			// In a real `github.com/lib/pq` usage:
			// listener := pq.NewListener(pgConnStr, 10*time.Second, time.Minute, nil)
			// err = listener.Listen(channelName)
			// if err != nil { /* handle error */ }
			// for n := range listener.Notify {
			//    log.Printf("Received notification from channel %s: %s", n.Channel, n.Extra)
			//    processMessages(ctx, db) // Process all available messages, optionally using n.Extra as a hint
			// }

			// After receiving a notification (or timeout for robustness), process messages
			processMessages(ctx, db, nil) // Process all available, as notify payload might not be specific
		}
	}
}

// pollForMessages periodically checks for new messages in case LISTEN/NOTIFY fails or misses
func pollForMessages(ctx context.Context, db *sql.DB) {
	ticker := time.NewTicker(2 * time.Second) // Poll every 2 seconds
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Poller shutdown.")
			return
		case <-ticker.C:
			processMessages(ctx, db, nil)
		}
	}
}

// processMessages attempts to acquire and process one or more messages
func processMessages(ctx context.Context, db *sql.DB, notifiedID *int64) {
	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return
	}
	defer tx.Rollback() // Rollback by default if not committed

	var msg Message
	var selectQuery string
	var rows *sql.Rows

	if notifiedID != nil {
		// If a specific message ID was notified, try to acquire it first
		selectQuery = `SELECT id, payload FROM messages WHERE id = $1 FOR UPDATE SKIP LOCKED LIMIT 1;`
		rows, err = tx.QueryContext(ctx, selectQuery, *notifiedID)
	} else {
		// Otherwise, get the oldest pending message
		selectQuery = `SELECT id, payload FROM messages ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;`
		rows, err = tx.QueryContext(ctx, selectQuery)
	}

	if err != nil {
		log.Printf("Failed to select message(s): %v", err)
		return
	}
	defer rows.Close()

	if !rows.Next() {
		// log.Println("No pending messages acquired (might be locked by another consumer or none)")
		return // No message found or all locked
	}

	if err := rows.Scan(&msg.ID, &msg.Payload); err != nil {
		log.Printf("Failed to scan message: %v", err)
		return
	}

	log.Printf("Acquired message ID: %d, Payload: %s", msg.ID, string(msg.Payload))

	// --- Simulate message processing ---
	// In a real scenario, this would involve calling external services,
	// updating other databases, etc.
	if msg.ID%2 == 0 { // Simulate occasional processing failure
		log.Printf("Simulating processing FAILURE for message ID %d", msg.ID)
		// No commit, default defer tx.Rollback() will revert the SELECT FOR UPDATE's ephemeral lock.
		return
	}
	time.Sleep(500 * time.Millisecond) // Simulate work
	log.Printf("Successfully processed message ID: %d", msg.ID)
	// --- End simulation ---

	_, err = tx.ExecContext(ctx, `DELETE FROM messages WHERE id = $1;`, msg.ID)
	if err != nil {
		log.Printf("Failed to delete message ID %d: %v", msg.ID, err)
		return
	}

	err = tx.Commit()
	if err != nil {
		log.Fatalf("Failed to commit transaction for message ID %d: %v", msg.ID, err)
	}
	log.Printf("Message ID %d committed and removed.", msg.ID)

	// Since we successfully processed one message, immediately try to process another
	// without waiting for the next polling interval or notification.
	// This helps in clearing the queue faster.
	go processMessages(ctx, db, nil)
}
```

## 四、可靠性保障

### 4.1 至少一次交付 (At-Least-Once Delivery)

PostgreSQL 基于触发器的消息队列天然支持至少一次交付：

1.  **生产者原子性入队**：消息的写入是在事务中完成的，只有事务成功提交，消息才会被持久化。如果事务回滚，消息不会入队。
2.  **消费者原子性处理**：
    *   `SELECT FOR UPDATE` 确保了消息在被一个消费者选中并处理时，不会被其他消费者同时选中。
    *   消息的处理 (`H`) 和删除 (`I`) 都在同一个事务中。
    *   如果处理成功并 `COMMIT`，消息被删除，不会再次处理。
    *   如果处理失败或消费者崩溃，事务会 `ROLLBACK`，消息上的锁会释放，消息将保留在队列中，可供另一个消费者（或该消费者重启后）再次获取和处理。

这意味着，在任何失败情况下（消费者崩溃、网络瞬断、处理逻辑异常），消息都不会丢失，但可能会被重复处理。

### 4.2 幂等性 (Idempotency)

由于至少一次交付的特性，消费者必须是**幂等**的。这意味着即使收到并处理同一条消息多次，系统状态也不会发生错误的变化。例如，如果消息是“增加用户积分”，消费者需要检查用户积分是否已经增加过，或者确保增加操作本身是幂等的（如 `UPDATE users SET points = points + N WHERE id = $user_id AND last_handled_message_id < $message_id;`）。

### 4.3 消息排序 (Message Ordering)

`SELECT ... ORDER BY created_at ASC` 确保了消费者倾向于按照消息的入队时间顺序处理。然而，在多个并发消费者的情况下，由于 `SKIP LOCKED` 机制，实际的处理顺序可能无法严格保证（例如，一个消费者可能会跳过一个锁定的早期消息并处理较晚的消息）。对于需要严格顺序的场景，需要采取额外措施（例如，单消费者处理、或者在消息中包含排序键进行分组）。

### 4.4 持久性 (Durability)

消息存储在 PostgreSQL 数据库中，完全享有其数据持久化和备份恢复的保障。只要数据库本身是可靠的，消息就不会丢失。

### 4.5 错误处理与重试

*   **瞬时错误**：对于数据库连接中断、外部服务暂时不可用等瞬时错误，消费者可以回滚事务，并由轮询机制或后续的 `NOTIFY` 机制再次触发对该消息的处理。
*   **永久性错误**：对于处理逻辑中出现的无法恢复的错误（例如，消息格式错误、业务规则验证失败），简单的回滚会导致消息无限重试。在这种情况下，可以考虑：
    *   **死信队列 (Dead-Letter Queue, DLQ)**：将错误消息移动到一个单独的 `dead_letter_messages` 表中，记录失败原因，不再进行自动重试。
    *   **重试计数与延迟重试**：在消息表中添加 `retry_count` 和 `next_retry_time` 字段。每次失败后更新状态、增加计数并设置延迟时间，让消费者只获取 `next_retry_time` 之前未到达的消息。

## 五、优缺点分析

### 5.1 优点

*   **事务原子性**：消息入队与业务逻辑在同一事务中，确保强一致性。
*   **数据持久性**：消息存储在成熟可靠的数据库中，不易丢失。
*   **开发运维简便**：无需引入和维护额外的消息队列服务，复用现有 PostgreSQL 设施。
*   **至少一次交付**：天然支持，易于实现。
*   **低复杂性**：对于简单的异步通信需求，实现逻辑相对直观。

### 5.2 缺点

*   **吞吐量限制**：`LISTEN/NOTIFY` 机制的连接数和通知频率存在瓶颈。数据库作为消息队列的单点，在高并发写入和读取下，性能会受到 I/O 和 CPU 限制。
*   **扩展性差**：难以像分布式消息队列一样水平扩展（例如，通过分区、消费者组）。
*   **`LISTEN/NOTIFY` 限制**：`payload` 大小有限制 (目前为 8000 字节)，不适合直接传递大量消息内容。同时，连接状态依赖于数据库连接，如果连接断开需要重连并重新 `LISTEN`。
*   **功能受限**：缺乏专用消息队列系统（如消息过滤、复杂路由、延迟队列、批量操作、Exactly-Once 语义）的丰富功能。
*   **资源消耗**：`SELECT FOR UPDATE SKIP LOCKED` 可能会增加数据库的锁管理开销，尤其是在消息争用激烈时。

## 六、总结

通过 PostgreSQL 触发器和 `LISTEN/NOTIFY` 机制设计消息队列，是一种在特定场景下（中低流量、高事务一致性要求、现有 PostgreSQL 基础设施）实用且可靠的方案。它利用了 PostgreSQL 强大的事务保障能力，确保了消息的原子性入队和原子性处理，并自然地提供了至少一次交付的语义。

然而，在选择此方案时，必须充分评估其在吞吐量和扩展性方面的局限性。对于高并发、复杂路由和严格顺序要求的场景，仍然建议使用专用的分布式消息队列系统。对于许多内部服务通信、简单任务调度或与数据库事务紧密耦合的异步操作，PostgreSQL 提供了一个强大而低成本的替代方案。理解其工作原理和权衡利弊，将有助于我们做出更明智的技术选型。