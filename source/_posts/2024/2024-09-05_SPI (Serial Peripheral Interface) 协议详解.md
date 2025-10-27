---
title: SPI (Serial Peripheral Interface) 协议详解
date: 2024-09-05 06:24:00
tags:
  - 2024
  - 硬件协议
  - 嵌入式系统
  - 硬件编程
categories:
  - 嵌入式系统
  - 硬件协议
---

> **SPI (Serial Peripheral Interface)** 是一种高性能、全双工、同步串行通信协议，由 Motorola 公司在 1980 年代中期开发。它主要用于在微控制器 (Master) 和各种外设 (Slave) 之间进行短距离、高速的数据交换。SPI 协议因其简单、灵活和高速的特点，在闪存、EEPROM、传感器、实时时钟、LCD 驱动器等众多嵌入式应用中得到了广泛应用。

{% note info %}
核心思想：**基于四条线（SCLK、MOSI、MISO、CS）实现同步全双工通信，Master 驱动时钟，并通过 CS 选择 Slave。** 速度快，但线材多且不具备地址分配能力。
{% endnote %}

## 一、SPI 协议概述

SPI 是一种**主从式 (Master-Slave)** 架构的通信协议，通常有一个主设备 (Master) 和一个或多个从设备 (Slave)。

*   **主设备 (Master)**：负责启动和控制通信，提供时钟信号。
*   **从设备 (Slave)**：在主设备的控制下进行数据传输。

**主要特点：**

1.  **全双工 (Full-Duplex)**：主设备和从设备可以同时发送和接收数据。
2.  **同步 (Synchronous)**：通信由一个共享的时钟信号 (SCLK) 进行同步。
3.  **串行 (Serial)**：数据一位一位地传输。
4.  **接口简单**：通常只需 4 根线。
5.  **高速**：通常比 I2C 和 UART 快。

## 二、SPI 接口的四条线

SPI 通信通常需要四根物理线路：

1.  **SCLK (Serial Clock)**：**串行时钟线**。由 Master 生成，用于同步数据传输。所有 Slave 都会连接到同一根 SCLK 线。
2.  **MOSI (Master Output, Slave Input)**：**主设备输出，从设备输入线**。Master 在这条线上发送数据给 Slave。
3.  **MISO (Master Input, Slave Output)**：**主设备输入，从设备输出线**。Slave 在这条线上发送数据给 Master。
4.  **CS/SS (Chip Select / Slave Select)**：**片选线 / 从设备选择线**。由 Master 控制，用于选择哪个 Slave 处于激活状态。通常是**低电平有效**。在多 Slave 情况下，每个 Slave 都需要独立的一条 CS 线。

**SPI 连接示意图:**

{% mermaid %}
graph LR
    subgraph Master Device
        M_SCLK[SCLK]
        M_MOSI[MOSI]
        M_MISO[MISO]
        M_CS1[CS1]
        M_CS2[CS2]
    end

    subgraph Slave Device 1
        S1_SCLK[SCLK]
        S1_MOSI[MOSI]
        S1_MISO[MISO]
        S1_CS[CS]
    end

    subgraph Slave Device 2
        S2_SCLK[SCLK]
        S2_MOSI[MOSI]
        S2_MISO[MISO]
        S2_CS[CS]
    end

    M_SCLK -- SCLK --> S1_SCLK
    M_SCLK -- SCLK --> S2_SCLK
    M_MOSI -- MOSI --> S1_MOSI
    M_MOSI -- MOSI --> S2_MOSI
    S1_MISO -- MISO --> M_MISO
    S2_MISO -- MISO --> M_MISO
    M_CS1 -- CS1 --> S1_CS
    M_CS2 -- CS2 --> S2_CS
{% endmermaid %}

## 三、SPI 数据传输过程

SPI 数据传输是基于移位寄存器实现的，一位一位地传输。

1.  **选择从设备**：Master 将目标 Slave 的 CS 线拉低，使该 Slave 处于激活状态。
2.  **时钟驱动**：Master 开始在 SCLK 线上生成时钟脉冲。
3.  **数据交换**：在每个时钟周期：
    *   Master 通过 MOSI 线发送 1 位数据给选中的 Slave。
    *   选中的 Slave 通过 MISO 线发送 1 位数据给 Master。
    *   数据通常是**高位在前 (MSB First)**，也可以配置为低位在前 (LSB First)。
4.  **完成传输**：当传输完一个字节或多个字节后，Master 可以将 CS 线拉高，结束与当前 Slave 的通信。

**SPI 数据传输时序图 (CPOL=0, CPHA=0 示例):**

{% mermaid %}
sequenceDiagram
    participant Master
    participant Slave

    Master->>Slave: Pull CS Low
    Note over Master,Slave: Start Communication
  
    Master->Master: Generate SCLK
    Note over Master: Clock drives data transfer
    Master->>Slave: MOSI Data (Bit 0)
    Slave->>Master: MISO Data (Bit 0)

    Master->Master: Generate SCLK
    Master->>Slave: MOSI Data (Bit 1)
    Slave->>Master: MISO Data (Bit 1)

    Note over Master,Slave: ... more bits for N-bit data (e.g., 8 bits total)

    Master->>Slave: Pull CS High
    Note over Master,Slave: End Communication
{% endmermaid %}

**更详细的时序图 (波形):**

{% mermaid %}
graph TD
    subgraph Signal Lines
        CS("CS (Chip Select)")
        SCLK("SCLK (Serial Clock)")
        MOSI("MOSI (Master Out Slave In)")
        MISO("MISO (Master In Slave Out)")
    end

    CS -- Low (Active) --> CS_Active_Period[ ]
    CS_Active_Period -- High (Inactive) --> CS_Inactive_Period[ ]
  
    SCLK --- SCLK_Idle_Low[ ]
    SCLK_Idle_Low -- Rising Edge (Sample Data) --> SCLK_High_Half[ ]
    SCLK_High_Half -- Falling Edge (Output Data) --> SCLK_Cycle_End[ ]
  
    MOSI --- MOSI_Data_Setup[Data Setup] --- MOSI_Data_Hold[Data Hold]
    MISO --- MISO_Data_Setup[Data Setup] --- MISO_Data_Hold[Data Hold]

    linkStyle 0 stroke:#006600,stroke-width:2px;
    linkStyle 1 stroke:#FF0000,stroke-width:2px;
    linkStyle 2 stroke:#0000FF,stroke-width:2px;
    linkStyle 3 stroke:#FF9900,stroke-width:2px;

    CS_Active_Period -- connects to --> SCLK_Idle_Low
    CS_Active_Period -- connects to --> MOSI_Data_Setup
    CS_Active_Period -- connects to --> MISO_Data_Setup
  
    SCLK_Idle_Low ---> SCLK_High_Half
    SCLK_High_Half ---> SCLK_Cycle_End
  
    MOSI_Data_Setup ---> MOSI_Data_Hold
    MISO_Data_Setup ---> MISO_Data_Hold
  
    style CS_Active_Period fill:#f0f9ff,stroke:#006600,stroke-dasharray: 5 5;
    style CS_Inactive_Period fill:#f0f9ff,stroke:#006600,stroke-dasharray: 5 5;
    style SCLK_Idle_Low fill:#f0f9ff,stroke:#FF0000,stroke-dasharray: 5 5;
    style SCLK_High_Half fill:#f0f9ff,stroke:#FF0000,stroke-dasharray: 5 5;
    style SCLK_Cycle_End fill:#f0f9ff,stroke:#FF0000,stroke-dasharray: 5 5;
    style MOSI_Data_Setup fill:#f0f9ff,stroke:#0000FF,stroke-dasharray: 5 5;
    style MOSI_Data_Hold fill:#f0f9ff,stroke:#0000FF,stroke-dasharray: 5 5;
    style MISO_Data_Setup fill:#f0f9ff,stroke:#FF9900,stroke-dasharray: 5 5;
    style MISO_Data_Hold fill:#f0f9ff,stroke:#FF9900,stroke-dasharray: 5 5;

{% endmermaid %}
*(注：Mermaid 对复杂波形图支持有限，此处仅为简化示意。实际波形会展示数据位与时钟边沿的对应关系。)*

## 四、SPI 模式 (Mode) 和时钟极性/相位 (CPOL/CPHA)

SPI 协议有四种工作模式，由两个参数定义：**时钟极性 (CPOL)** 和 **时钟相位 (CPHA)**。

1.  **CPOL (Clock Polarity)**：
    *   `CPOL = 0`：SCLK 在空闲时为低电平。
    *   `CPOL = 1`：SCLK 在空闲时为高电平。
2.  **CPHA (Clock Phase)**：
    *   `CPHA = 0`：数据在 SCLK 的**第一个边沿**（下降沿或上升沿，取决于 CPOL）采样，并在**第二个边沿**传输。**数据在时钟信号的上升沿被锁存，在下降沿被移出。**
    *   `CPHA = 1`：数据在 SCLK 的**第二个边沿**采样，并在**第一个边沿**传输。**数据在时钟信号的下降沿被锁存，在上升沿被移出。**

这四种模式很重要，因为 Master 和 Slave 必须使用相同的 SPI 模式才能正确通信。

| SPI Mode | CPOL | CPHA | 空闲时 SCLK | 数据采样边沿 | 数据输出边沿 | 典型应用 |
| :------- | :--- | :--- | :---------- | :----------- | :----------- | :------- |
| **Mode 0** | 0    | 0    | 低电平      | 上升沿       | 下降沿       | 最常用，如 SD 卡 |
| **Mode 1** | 0    | 1    | 低电平      | 下降沿       | 上升沿       | 多数微控制器 |
| **Mode 2** | 1    | 0    | 高电平      | 下降沿       | 上升沿       | 少数设备 |
| **Mode 3** | 1    | 1    | 高电平      | 上升沿       | 下降沿       | 少数设备 |

选择正确的 SPI 模式对于确保主从设备之间的数据能被正确采样至关重要。

## 五、SPI 的优缺点

### 5.1 优点：

1.  **高速全双工**：数据传输速度快，且支持同时收发。
2.  **简单灵活**：硬件实现简单，没有复杂的地址寻址机制，也无需起始位/停止位。
3.  **无地址限制**：不需要为每个从设备分配一个唯一的地址。
4.  **硬件连接少**：只需要 4 根线（对于单从设备）。
5.  **没有最大从设备数量限制**：理论上只要 Master 有足够的 CS 线，就可以连接无限个从设备（实际受限于 Master 的 I/O 资源）。

### 5.2 缺点：

1.  **线材数量多**：相较于 I2C (2 根线)，SPI 每多一个 Slave 就需要多一根 CS 线，布线变得复杂。
2.  **无标准协议**：没有严格的标准来定义数据传输的格式或错误检测机制，需要由用户根据设备数据手册来定义。
3.  **距离限制**：由于是高速、同步通信，总线长度受限于信号完整性，通常用于短距离通信。
4.  **没有应答机制**：Master 发送数据后，不知道 Slave 是否已经收到或处理成功，需要更高层协议或额外的 GPIO 进行确认。

## 六、SPI 的应用场景

由于其高速和简单性，SPI 在嵌入式系统中非常流行：

*   **存储设备**：闪存 (Flash Memory)、EEPROM。
*   **传感器**：加速度计、陀螺仪、温度传感器、压力传感器等。
*   **显示设备**：LCD 控制器、OLED 显示屏。
*   **实时时钟 (RTC)**。
*   **ADC (模数转换器) 和 DAC (数模转换器)**。
*   **外部通信模块**：WiFi 模块、以太网控制器。
*   **SD 卡读写**。

## 七、SPI 编程示例 (Arduino / Go - TinyGo)

### 7.1 Arduino (C++) 示例

Arduino IDE 为 SPI 通信提供了方便的 `SPI` 库。

```cpp
#include <SPI.h>

// SPI 设备通常有一个 CS 引脚，这里假设连接到 GPIO5
const int CS_PIN = 5;

void setup() {
  Serial.begin(115200);
  pinMode(CS_PIN, OUTPUT); // CS 引脚设置为输出
  digitalWrite(CS_PIN, HIGH); // 默认拉高 CS，取消选择设备

  // 初始化 SPI 总线
  // SPI.begin() 使用默认的 SPI 引脚 (例如 ESP32: SCK=18, MISO=19, MOSI=23)
  // 或者使用 SPI.begin(sck_pin, miso_pin, mosi_pin, ss_pin) 自定义引脚
  SPI.begin();

  // 设置 SPI 通信参数：
  // MOSI MSB 先传，时钟频率，SPI Mode (0-3)
  // 许多设备使用 SPI_MODE0
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0)); // 1MHz, MSB First, Mode 0
}

void loop() {
  byte dataToSend = 0xAA; // 要发送给从设备的数据
  byte receivedData;      // 从设备返回的数据

  digitalWrite(CS_PIN, LOW); // 拉低 CS，选择从设备
  receivedData = SPI.transfer(dataToSend); // 发送数据并同时接收数据
  digitalWrite(CS_PIN, HIGH); // 拉高 CS，取消选择从设备

  Serial.print("Sent: 0x");
  Serial.print(dataToSend, HEX);
  Serial.print(", Received: 0x");
  Serial.println(receivedData, HEX);

  delay(1000);
}
```

### 7.2 TinyGo (Go) on ESP32 示例

TinyGo 同样提供了 `machine` 包来控制 SPI 外设。

```go
package main

import (
	"machine"
	"time"
)

// 定义 SPI 通信的引脚
const (
	SPI_SCK  = machine.GPIO18 // 默认 SCK 引脚
	SPI_MOSI = machine.GPIO23 // 默认 MOSI 引脚
	SPI_MISO = machine.GPIO19 // 默认 MISO 引脚
	CS_PIN   = machine.GPIO5
)

var (
	spi = machine.SPI0 // 使用 SPI0 接口
	cs  = machine.Pin(CS_PIN)
)

func main() {
	machine.InitSerial() // 初始化串口用于调试输出

	cs.Configure(machine.PinConfig{Mode: machine.PinOutput}) // 配置 CS 为输出
	cs.High() // 默认拉高 CS

	// 配置 SPI 外设
	// 参数：SCK, MOSI, MISO
	// 这里使用 ESP32 的硬件 SPI 引脚
	spi.Configure(machine.SPIConfig{
		SCK:       SPI_SCK,
		MOSI:      SPI_MOSI,
		MISO:      SPI_MISO,
		Frequency: 1000 * 1000, // 1MHz
		// Mode 0: CPOL=0, CPHA=0。TinyGo 默认是 Mode 0
	})

	for {
		dataToSend := []byte{0xAA} // 要发送的字节数组
		receivedData := make([]byte, 1) // 接收数据的缓冲区

		cs.Low() // 拉低 CS，选择从设备
		// 读写数据：发送 dataToSend，并将接收到的数据存入 receivedData
		err := spi.Tx(dataToSend, receivedData)
		if err != nil {
			println("SPI_TX_Error:", err.Error())
		}
		cs.High() // 拉高 CS，取消选择从设备

		println("Sent:", byteToHex(dataToSend[0]), "Received:", byteToHex(receivedData[0]))

		time.Sleep(time.Second)
	}
}

// 辅助函数：将 byte 转换为十六进制字符串
func byteToHex(b byte) string {
	hex := "0123456789ABCDEF"
	return "0x" + string(hex[b>>4]) + string(hex[b&0x0F])
}
```

## 八、总结

SPI 协议以其高速、全双工和硬件实现简单等特点，成为嵌入式系统中连接各种外设的理想选择。理解其四线接口、四种工作模式以及 CS 片选机制是成功搭建 SPI 通信的基础。尽管它不像 I2C 那样节省引脚，也缺乏内置的地址寻址和应答机制，但对于需要高性能、可靠短距离通信的应用而言，SPI 仍然是首选协议之一。在进行 SPI 开发时，务必仔细查阅设备的文档，确保主从设备的 SPI 模式设置一致。