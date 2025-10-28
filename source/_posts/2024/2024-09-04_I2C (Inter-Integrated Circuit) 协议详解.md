---
title: I2C (Inter-Integrated Circuit) 协议详解
date: 2024-09-04 06:24:00
tags:
  - 2024
  - 硬件协议
  - 嵌入式系统
  - 硬件编程
categories:
  - 嵌入式系统
  - 硬件协议
---

> **I2C (Inter-Integrated Circuit)** 是一种多主从、半双工、同步串行通信协议，由 Philips Semiconductors (现 NXP) 在 1982 年开发。它以其简单的两线接口（SDA 和 SCL）而闻名，广泛应用于微控制器和各种外设之间进行短距离、中低速的数据交换。I2C 协议因其引脚少、易于扩展等特点，在传感器、EEPROM、LCD 驱动器、实时时钟等众多嵌入式系统中扮演着重要角色。

{% note info %}
核心思想：**基于两条线（SDA、SCL）实现多主多从通信，通过设备地址进行寻址，并有应答机制确保数据传输可靠性。** 线材少、可扩展性强，但速度相对较慢。
{% endnote %}
------

## 一、I2C 协议概述

I2C 是一种**多主多从 (Multi-Master, Multi-Slave)** 架构的通信协议，允许总线上有多个主设备和多个从设备。

*   **主设备 (Master)**：发起和终止通信，生成时钟信号 (SCL)，并向从设备发送或请求数据。
*   **从设备 (Slave)**：响应主设备的请求，根据分配的唯一地址进行通信。

**主要特点：**

1.  **两线接口**：仅需要两条线——**SDA (串行数据线)** 和 **SCL (串行时钟线)**。
2.  **多主多从**：同一总线上可以挂载多个主设备和多个从设备。
3.  **同步 (Synchronous)**：通信由一个共享的时钟信号 (SCL) 进行同步。
4.  **半双工 (Half-Duplex)**：数据只能在一个方向上传输（要么主设备发送，要么从设备发送），不能同时双向传输。
5.  **基于地址寻址**：每个从设备在总线上都有一个唯一的 7 位或 10 位地址，主设备通过地址选择目标从设备。
6.  **具应答 (ACK) 机制**：每次发送一个字节后，接收方会发送一个应答信号 (ACK) 或非应答信号 (NACK)，以确认数据是否成功接收。
7.  **速度模式**：支持多种速度模式，如标准模式 (100 kbps)、快速模式 (400 kbps)、快速模式+ (1 Mbps)、高速模式 (3.4 Mbps) 等。

## 二、I2C 接口的两条线

I2C 通信的核心是两条线：

1.  **SDA (Serial Data Line)**：**串行数据线**。用于双向传输数据。
2.  **SCL (Serial Clock Line)**：**串行时钟线**。由 Master 生成，用于同步数据传输。

两条线都必须连接到**上拉电阻 (Pull-up Resistor)**。当总线空闲时，SDA 和 SCL 均为高电平。这使得 I2C 成为**开漏 (Open-Drain)** 或 **开集 (Open-Collector)** 总线。

**I2C 连接示意图:**

{% mermaid %}
graph LR
    subgraph Master Device
        M_SDA[SDA] --- M_SCL[SCL]
    end

    subgraph Slave Device 1
        S1_SDA[SDA] --- S1_SCL[SCL]
    end

    subgraph Slave Device 2
        S2_SDA[SDA] --- S2_SCL[SCL]
    end

    Rp_SDA[Rpullup] --- VCC(VCC)
    Rp_SCL[Rpullup] --- VCC(VCC)


    M_SDA -- SDA --> S1_SDA
    M_SDA -- SDA --> S2_SDA
    S1_SDA -- SDA --> Rp_SDA
    S2_SDA -- SDA --> Rp_SDA
  
    M_SCL -- SCL --> S1_SCL
    M_SCL -- SCL --> S2_SCL
    S1_SCL -- SCL --> Rp_SCL
    S2_SCL -- SCL --> Rp_SCL
{% endmermaid %}

**上拉电阻的作用：**

*   确保当设备不驱动总线时，线路保持高电平。
*   允许多个设备共同驱动总线（开漏输出）。当任何一个设备将线路拉低时，线路就为低电平；所有设备都释放线路时，线路通过上拉电阻恢复高电平。这实现了“线与”逻辑。

## 三、I2C 通信协议细节

I2C 通信遵循特定的时序和数据组织结构。

### 3.1 传输步骤概览

一个完整的 I2C 传输通常包含以下步骤：

1.  **起始条件 (START Condition)**
2.  **发送从设备地址和读写位**
3.  **接收方发送应答 (ACK) / 非应答 (NACK)**
4.  **数据传输（Master 发送 / Master 接收）**
5.  **接收方发送应答 (ACK) / 非应答 (NACK)**
6.  **停止条件 (STOP Condition)**

### 3.2 起始和停止条件

*   **起始条件 (START)**：当 SCL 为高电平时，SDA 从高电平变为低电平。这是主设备开始通信的信号。
*   **停止条件 (STOP)**：当 SCL 为高电平时，SDA 从低电平变为高电平。这是主设备结束通信的信号。

{% mermaid %}
sequenceDiagram
    participant SCL
    participant SDA

    Note over SCL,SDA: Bus Idle (SCL=H, SDA=H)
    SDA->SDA: Change H to L (while SCL High)
    Note over SCL,SDA: START Condition
    SCL->SCL: Starts toggling
    SDA->SDA: Transmit Data (during SCL Low)
    SCL->SCL: Continue toggling
    SDA->SDA: Transmit Data (during SCL Low)
    Note over SCL,SDA: Data Transfer
    SCL->SCL: Stay High
    SDA->SDA: Change L to H (while SCL High)
    Note over SCL,SDA: STOP Condition
    Note over SCL,SDA: Bus Idle (SCL=H, SDA=H)
{% endmermaid %}

### 3.3 数据传输

*   **数据有效性**：当 SCL 为高电平期间，SDA 上的数据必须保持稳定。只有在 SCL 为低电平期间，SDA 上的数值才能改变（数据位从 Master 移位到 Slave，或反之）。
*   **字节传输**：数据以 8 位字节的形式传输，每次传输一个字节。
*   **应答 (ACK) / 非应答 (NACK)**：在每个 8 位字节传输完成后，发送方会释放 SDA 线，接收方在第 9 个时钟脉冲期间拉低 SDA 作为应答 (ACK)。如果接收方没有拉低 SDA，则表示非应答 (NACK)，通常意味着接收失败、设备忙或不支持该命令。

**数据传输时序图 (单字节写入为例):**

{% mermaid %}
sequenceDiagram
    participant Master
    participant Slave

    Note over Master,Slave: Bus Idle (SDA=H, SCL=H)
    Master->Slave: START Condition (SDA: H->L while SCL: H)
    Master->Slave: Send 7-bit Slave Address + Write Bit (0)
 
    Slave->Master: ACK (pull SDA low for 9th SCL pulse)
  
    Master->Slave: Send Data Byte 1
    Slave->Master: ACK

    Master->Slave: Send Data Byte 2
    Slave->Master: ACK
  
    Master->Slave: STOP Condition (SDA: L->H while SCL: H)
    Note over Master,Slave: Bus Idle (SDA=H, SCL=H)
{% endmermaid %}

### 3.4 从设备地址和读写位

在起始条件之后，主设备会发送一个字节，其中包含：

*   **7 位从设备地址**：用于唯一标识总线上的目标从设备。
*   **1 位读写位 (R/W#)**：
    *   `0` 表示主设备要**写入**（发送）数据到从设备。
    *   `1` 表示主设备要**读取**（接收）数据从从设备。

所以，第一个传输的字节实际上是 `[Slave Address (7 bits)][R/W# (1 bit)]`。

### 3.5 10 位地址模式 (扩展)

除了标准的 7 位地址，I2C 也支持 10 位地址寻址，以允许更多的设备连接。10 位地址模式通过特定的前缀字节来区分。

## 四、I2C 的优缺点

### 4.1 优点：

1.  **引脚数量少**：只需要 SDA 和 SCL 两根线，节省了微控制器的 I/O 资源和 PCB 走线空间。
2.  **多主多从**：支持多个主设备和多个从设备在同一总线上通信，系统扩展性强。
3.  **地址寻址**：通过设备地址选择通信目标，方便管理多个从设备。
4.  **应答机制**：提供数据传输的可靠性确认，接收方发送 ACK/NACK。
5.  **软件实现简单**：相对于一些更复杂的协议，I2C 容易用软件模拟实现。

### 4.2 缺点：

1.  **速度相对慢**：标准模式下只有 100 kbps，快速模式也只有 400 kbps，不如 SPI 协议快。
2.  **复杂性较高**：时序相对 SPI 复杂，需要处理起始/停止条件、地址寻址、应答位等。
3.  **总线电容和上拉电阻选择**：对总线电容敏感，在长距离或高速模式下，选择合适的上拉电阻值变得重要，且可能需要更强的驱动能力。
4.  **没有片选线**：由于依靠地址寻址，如果两个 I2C 设备具有相同的地址，则无法在同一总线上使用。
5.  **半双工通信**：无法同时发送和接收数据。

## 五、I2C 的应用场景

I2C 在各种嵌入式应用中广泛使用，尤其是在需要连接多个低速外设的场合：

*   **传感器**：温度传感器、湿度传感器、加速度计、陀螺仪、磁力计等。
*   **存储器**：EEPROM (电可擦除可编程只读存储器)。
*   **实时时钟 (RTC)**。
*   **LCD/OLED 屏幕控制器**。
*   **I/O 扩展器**：通过 I2C 控制额外的 GPIO。
*   **电源管理**芯片。
*   **ADC/DAC** (模数/数模转换器)。

## 六、I2C 编程示例 (Arduino / Go - TinyGo)

### 6.1 Arduino (C++) 示例 (Master 发送数据到 Slave)

Arduino IDE 为 I2C 通信提供了方便的 `Wire` 库。

```cpp
#include <Wire.h> // 引入 Wire 库

// 假设从设备地址为 0x27 (常见的 LCD I2C 模块地址)
const int SLAVE_ADDRESS = 0x27;

void setup() {
  Serial.begin(9600);
  Wire.begin(); // 初始化 I2C 总线，作为 Master
  Serial.println("I2C Master init complete.");
}

void loop() {
  Wire.beginTransmission(SLAVE_ADDRESS); // 开始与从设备通信，指定地址

  // 发送数据
  Wire.write("Hello I2C!"); // 发送字符串
  Wire.write(0x0A);         // 发送一个字节 (换行符)

  // 结束传输，发送停止条件
  // 返回值：
  // 0: success
  // 1: data too long to fit in transmit buffer
  // 2: received NACK on transmit of address
  // 3: received NACK on transmit of data
  // 4: other error
  byte status = Wire.endTransmission(); 

  if (status == 0) {
    Serial.println("Data sent successfully.");
  } else {
    Serial.print("Error sending data, status: ");
    Serial.println(status);
  }

  delay(2000); // 每2秒发送一次
}
```

### 6.2 TinyGo (Go) on ESP32 示例 (Master 读写数据)

TinyGo 同样提供了 `machine` 包来控制 I2C 外设。

```go
package main

import (
	"machine"
	"time"
)

// 定义 I2C 通信引脚和从设备地址
const (
	I2C_SDA = machine.GPIO21 // ESP32 默认 SDA
	I2C_SCL = machine.GPIO22 // ESP32 默认 SCL
	SLAVE_ADDR = 0x27 // 假设的从设备地址
)

var (
	i2c = machine.I2C0 // 使用 I2C0 接口
)

func main() {
	machine.InitSerial() // 初始化串口用于调试输出

	// 配置 I2C 外设
	i2c.Configure(machine.I2CConfig{
		SDA:       I2C_SDA,
		SCL:       I2C_SCL,
		Frequency: machine.I2C400kHz, // 设置为快速模式 400kHz
	})

	println("I2C Master init complete. Scanning...")

	// I2C 设备扫描 (可选，用于发现总线上的设备)
	scanI2CDevices()

	// 写入数据示例
	writeData := []byte("Hello from TinyGo!")
	err := i2c.Tx(uint16(SLAVE_ADDR), writeData, nil) // 写操作: address, data_to_write, data_to_read
	if err != nil {
		println("I2C Write Error:", err.Error())
	} else {
		println("Data '", string(writeData), "' sent to 0x", byteToHex(SLAVE_ADDR), " successfully.")
	}

	time.Sleep(2 * time.Second)

	// 读取数据示例 (这里假设从设备在写入后立即发送数据，实际情况会先写寄存器地址再读)
    // 通常从一个特定寄存器读取，例如先发送寄存器地址，再读取
    // 假设我们要读取一个字节作为示例
    readBuf := make([]byte, 1)
    err = i2c.Tx(uint16(SLAVE_ADDR), nil, readBuf) // 读操作: address, nil, data_to_read
    if err != nil {
        println("I2C Read Error:", err.Error())
    } else {
        println("Data 0x", byteToHex(readBuf[0]), " recieved from 0x", byteToHex(SLAVE_ADDR), " successfully.")
    }


	for {
		time.Sleep(5 * time.Second)
	}
}

// 辅助函数：将 byte 转换为十六进制字符串
func byteToHex(b byte) string {
	hex := "0123456789ABCDEF"
	return string(hex[b>>4]) + string(hex[b&0x0F])
}

// 辅助函数：扫描 I2C 设备
func scanI2CDevices() {
	println("Scanning I2C bus for devices...")
	for addr := uint16(1); addr < 127; addr++ { // 7位地址范围
		// 尝试进行空写操作，看是否有设备响应
		err := i2c.Tx(addr, nil, nil)
		if err == nil {
			println("Found I2C device at address 0x", byteToHex(byte(addr)))
		}
	}
	println("I2C scan complete.")
}
```

## 七、总结

I2C 协议以其简单的两线接口、多主多从能力和地址寻址机制，在嵌入式系统中广泛应用于连接各种外设。它提供了可靠的数据传输，但速度相对较慢，且对总线电容和上拉电阻的选择有一定的要求。在进行 I2C 开发时，理解其起始/停止条件、设备地址、读写位和应答机制至关重要。正确配置总线和选择合适的设备地址，将确保设备间的稳定通信。