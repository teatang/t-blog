---
title: Frigate介绍与部署：基于AI的本地视频监控系统
date: 2024-12-15 06:24:00
tags:
  - 2024
  - NAS
  - Docker
categories:
  - NAS
  - 实用工具
---

> Frigate 是一个开源的、高性能的本地视频监控系统，它利用 AI （特别是通过 [Google Coral TPU](https://coral.ai/) 进行边缘计算）来实现实时目标检测，例如检测人、车辆、宠物等。与传统监控系统只是录像不同，Frigate 能够智能识别画面中的物体，并只在检测到感兴趣的事件时进行录像或发送通知，大大减少了存储空间和误报，同时提高了事件分析的效率。

{% note info %}
“让你的摄像头变得更智能，只记录你真正关心的事件。”
{% endnote %}

## 一、Frigate 是什么？

Frigate 是一个基于 `FFmpeg` 和 `TensorFlow` 的 AI 目标检测视频监控系统。它的核心思想是利用神经网络在本地对视频流进行实时分析，识别预定义的目标（如人、车），然后根据这些识别结果进行录制、快照捕捉或触发自动化。

**核心优势：**

*   **本地处理**：所有视频流和 AI 推理都在本地完成，保障隐私，不依赖云服务。
*   **实时目标检测**：利用 Google Coral TPU 等硬件加速，实现毫秒级的实时检测。
*   **智能录像与快照**：只在检测到目标时录制完整的视频片段，并捕捉关键帧快照。
*   **集成度高**：与 Home Assistant 深度集成，可以作为强大的自动化触发器。
*   **事件分组**：自动将连续的检测事件进行分组，方便回溯和管理。
*   **区域检测**：可定义特定区域，只在该区域内进行目标检测。
*   **丰富的通知**：结合 Home Assistant 或其他服务，发送包含快照的通知。
*   **高度可配置**：通过 YAML 文件进行详细配置，满足各种高级需求。
*   **开源免费**：完全开放源代码，社区活跃。

## 二、为什么选择 Frigate？

*   **告别误报**：传统监控遇到树叶摇曳、光线变化、小动物经过等情况常会误报，Frigate 通过 AI 准确识别“人”或“车”，显著减少误报。
*   **节省存储**：只录制有事件发生的片段，而非持续录像，大大节省 NAS / NVR 的存储空间。
*   **快速查找事件**：通过 Frigate 的 Web UI 或 Home Assistant 界面，可以快速浏览所有检测到的“人”或“车”事件，而无需大海捞针般地查看大量录像。
*   **强大的自动化**：结合 Home Assistant，当 Frigate 检测到“人”时，可以自动开灯、发送通知、触发警报等。
*   **隐私保护**：所有处理都在本地完成，无需将视频流上传到第三方云服务。

## 三、部署前的准备

Frigate 推荐使用 Docker 部署。为了发挥其最佳性能，特别是实时 AI 推理，强烈建议使用 **Google Coral TPU**。

### 1. 硬件要求

*   **服务器**：一台能运行 Docker 的 Linux 服务器（如 NAS、NUC、树莓派 4B/5、Mini PC、旧电脑等）。
    *   **CPU**：建议有一定性能的 CPU，如 Intel Celeron J4125/J5005 或更好，用于运行 FFmpeg。
    *   **内存**：建议 4GB 及以上。
*   **摄像头**：支持 RTSP 协议的 IP 摄像头（几乎所有现代网络摄像头都支持）。
*   **Google Coral TPU (强烈推荐)**：
    *   **USB Accelerator**：最常见的形式，通过 USB 3.0 接口连接到你的服务器。
    *   **PCIe Accelerator**：性能更高，适用于有 PCIe 插槽的服务器。
    *   **为何需要？**：没有 Coral TPU，Frigate 也能运行，但 AI 推理将完全依赖 CPU，性能会非常差，可能无法满足多路摄像头的实时检测需求，甚至可能导致 CPU 占用过高。Coral TPU 可以极大地加速 AI 推理，让每秒帧数 (FPS) 大幅提升，从而实现实时分析。

### 2. 软件要求

*   **Docker 和 Docker Compose**：确保你的服务器已安装。
*   **SSH 客户端**：用于连接服务器进行命令行操作。
*   **媒体存储路径**：用于保存录像和快照的持久化存储目录。
*   **Python (如果需要 Coral)**：部分系统可能需要安装 Python 和 Coral 驱动。

### 3. 理解 Docker 部署的好处

*   **环境隔离**：Frigate 运行在独立的容器中，不影响宿主系统。
*   **易于部署和管理**：使用 Docker Compose 一键启动、停止、升级。
*   **版本控制**：方便升级和回滚 Frigate 版本。
*   **Coral TPU 兼容性**：Docker 提供标准化的方式来将 Coral 设备映射到容器内部。

## 四、部署步骤（以 Docker Compose 为例）

### 1. 挂载 Coral TPU (如果使用)

如果你的服务器连接了 Google Coral TPU，需要确保宿主系统能够识别它，并将其映射到 Docker 容器中。

#### USB Coral

1.  **安装 Coral 驱动 (部分系统可能需要)**：
    通常，Linux 系统会自动识别 USB Coral。如果遇到问题，可以参考 Coral 官方文档安装 `libedgetpu1-std`。

2.  **检查设备**：
    连接 Coral TPU 到 USB 3.0 端口，然后运行：
    ```bash
    lsusb # 查看 USB 设备列表，应能看到 Google Inc. 或 Global Unichip Corp.
    ls -l /dev/bus/usb/ # 查看 USB 设备文件
    ```
    你可能会看到一个类似 `Bus 001 Device 002: ID 1a6e:089a Global Unichip Corp.` 的设备。

#### PCIe Coral

1.  **安装 Coral 驱动**：
    PCIe Coral 需要安装驱动。请参考 [Coral 官方文档](https://coral.ai/docs/m2/get-started/)。
2.  **检查设备**：
    ```bash
    lspci -nn | grep -i coral
    ```
    应能看到 Coral PCIe 设备。

### 2. 创建目录结构

通过 SSH 连接到你的服务器，创建用于 Frigate 存储配置、录像、缓存等数据的目录。

```bash
# 创建 Frigate 配置目录
sudo mkdir -p /mnt/data/frigate/config
sudo chmod -R 777 /mnt/data/frigate/config # 确保容器有读写权限

# 创建 Frigate 媒体存储目录
sudo mkdir -p /mnt/data/frigate/media
sudo chmod -R 777 /mnt/data/frigate/media # 确保容器有读写权限

# 如果你还有额外的用于存储录像的目录，如NAS的共享文件夹，也一并创建并设置权限
# sudo mkdir -p /mnt/your_nas_share_for_recordings
# sudo chmod -R 777 /mnt/your_nas_share_for_recordings
```
**注意：** `/mnt/data/frigate` 仅为示例路径，请根据你的存储实际情况调整。

### 3. 编写 `config.yml` (Frigate 核心配置文件)

在 `/mnt/data/frigate/config` 目录下创建一个名为 `config.yml` 的文件。
这是 Frigate 最重要的配置文件，定义了你的摄像头、AI 模型、检测区域等。

```bash
sudo nano /mnt/data/frigate/config/config.yml
```

一个基本的 `config.yml` 示例（请根据你的摄像头和需求修改）：

```yaml
# Frigate 配置示例

# MQTT 配置 (与 Home Assistant 集成需要)
# 如果不使用 Home Assistant 或 MQTT，可以禁用或删除此部分
mqtt:
  host: YOUR_MQTT_BROKER_IP # 例如 Home Assistant 的 IP
  # user: mqtt_user         # 如果你的 MQTT 需要认证
  # password: mqtt_password # 如果你的 MQTT 需要认证
  # port: 1883              # 默认端口

# TensorFlow Lite AI 模块配置
detectors:
  cpu1: # 定义一个 CPU 检测器，如果你没有 Coral TPU，推理会非常慢
    type: cpu
  # coral_tpu: # 如果你有 Coral TPU，请取消注释并使用此配置
  #   type: edgetpu
  #   device: usb # 或 "pci" 如果是 PCIe 版本，如果只有一个 TPU 可以不指定 device

# Frigate 主配置
database:
  path: /media/frigate.db # 数据库文件路径 (推荐默认，会自动挂载到持久化目录)

# 视频录制和快照等配置
record:
  enabled: True # 启用录制
  events:
    pre_capture: 5 # 事件发生前录制 5 秒
    post_capture: 5 # 事件发生后录制 5 秒
    max_seconds: 300 # 最长录制 300 秒 (5分钟)
    # objects:       # 仅录制哪些类型的对象 (默认录制所有配置的检测对象)
    #   - person
    #   - car
  retain:
    default: 10 # 默认保存 10 天的录像 (按事件保留)
    # days:     # 也可以按天数设置 (默认按事件数量)
    #   default: 7
snapshots:
  enabled: True            # 启用快照
  bounding_box: True       # 快照中显示检测框
  timestamp: True          # 快照中显示时间戳
  retain:
    default: 7 # 默认保存 7 天的快照
    # days:
    #   default: 7
object_detection:
  enabled: True
  # lp_detector:
  #   enabled: False # 是否启用车牌检测，需要额外模型
ffmpeg:
  # 线程数根据你的CPU核心数调整，如果CPU性能不够，可能需要降低
  # global_args: -hwaccel vaapi -hwaccel_output_format vaapi # 如果Intel CPU支持VAAPI硬件加速FFmpeg解码
  output_args:
    detect: -f segment -segment_times 10 -segment_format mp4 -r 10 -c:v libx264 -preset ultrafast -tune zerolatency -crf 23 -bf 0 -g 30 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart # 检测流的FFmpeg输出参数，推荐
    record: -c copy -map 0:v:0 -map 0:a? -f segment -segment_times 10 -segment_format mp4 -reset_timestamps 1 -strftime 1 -ar 44100 # 录制流的FFmpeg输出参数，推荐
    rtmp: -c copy -map 0:v:0 -map 0:a? -f flv # RTMP 流输出参数
# Web UI 配置
web:
  port: 5000 # Web UI 端口
  # password: your_password # 如果需要为Web UI设置密码

# 摄像头配置 (重点配置项)
cameras:
  front_door: # 摄像头名称，唯一标识符
    enabled: True
    ffmpeg:
      inputs:
        - path: rtsp://user:password@192.168.1.100:554/stream1 # 摄像头的 RTSP 地址
          roles:
            - detect # 用于目标检测的视频流 (通常是低分辨率子码流，节省资源)
            - record # 用于录像的视频流 (可以是高分辨率主码流)
        # - path: rtsp://user:password@192.168.1.100:554/stream2 # 如果有第二个流用于 Web UI 预览
        #   roles:
        #     - rtmp # 用于 Web UI 预览的 RTMP 流
    detect:
      enabled: True
      # 减小帧率以降低 CPU 占用，如果你没有 Coral。
      # frigate默认会根据FFmpeg output的帧率进行检测。
      # 如果你的RTSP流本身是30FPS，并且你想降低检测帧率，则可以在这里指定：
      # fps: 5
    zones: # 区域检测 (可选)
      # 只在特定区域内进行检测，或者在特定区域内不检测
      driveway:
        coordinates: 0,0,0,1,1,1,1,0 # 定义一个多边形区域，以像素百分比表示 (左上角是0,0，右下角是1,1)
                                      # 例如：0,0, 0.5,0, 0.5,0.5, 0,0.5 （上、右、下、左）
        objects:
          - person # 只在此区域检测人
    objects:
      track: # 跟踪的对象类型
        - person
        - car
        - dog
        - cat
      filters: # 过滤条件
        person:
          min_area: 5000 # 最小检测面积
          max_area: 1000000 # 最大检测面积
          threshold: 0.7 # 置信度阈值
        car:
          min_area: 10000
    motion:
      mask: # 运动检测遮罩区域 (可选)
        - 0,0,0,0.5,0.5,0.5,0.5,0 # 示例：遮蔽图像上半部分
      threshold: 25 # 运动检测阈值
      contour_area: 50 # 轮廓区域阈值

  back_yard: # 第二个摄像头，如果需要
    enabled: True
    ffmpeg:
      inputs:
        - path: rtsp://user:password@192.168.1.101:554/H264_stream # 另一个摄像头的 RTSP 地址
          roles:
            - detect
            - record
    detect:
      enabled: True
    objects:
      track:
        - person
        - car
```

保存并关闭文件。

**配置解释：**

*   **`mqtt`**：用于与 Home Assistant 集成，将检测事件发布到 MQTT Broker。
*   **`detectors`**：定义 AI 推理设备。`cpu` 是默认的，`edgetpu` 是为 Coral TPU 准备的。如果你有 Coral，记得取消注释 `coral_tpu` 部分。
*   **`record` / `snapshots`**：控制录像和快照的行为，保留时间等。
*   **`ffmpeg`**：FFmpeg 的参数配置。`inputs` 是摄像头的 RTSP 地址，`roles` 定义了该流的用途 (`detect` 用于检测，`record` 用于录像，`rtmp` 用于 Web UI 预览)。
*   **`cameras`**：定义你的每个摄像头。
    *   `ffmpeg`：每个摄像头的 FFmpeg 配置。
    *   `detect.fps`：用于检测的帧率，如果 CPU 性能不足且没有 Coral，可以适当降低此值。
    *   `zones`：定义感兴趣的检测区域，可以减少误报。
    *   `objects.track`：指定 Frigate 应该关注哪些类型的对象。
    *   `motion.mask`：定义忽略运动的区域。

### 4. 创建 Docker Compose 文件

在 `/mnt/data/frigate` 目录下创建一个名为 `docker-compose.yml` 的文件。

```bash
sudo nano /mnt/data/frigate/docker-compose.yml
```

将以下内容粘贴到 `docker-compose.yml` 文件中：

```yaml
version: "3.8"
services:
  frigate:
    container_name: frigate
    image: blakeblackshear/frigate:stable # 推荐使用 stable 标签
    # image: blakeblackshear/frigate:0.13.0-beta # 如果你想尝试最新功能，使用特定版本
  
    privileged: true # 必需，允许访问 /dev/dri 或 /dev/bus/usb
  
    # 网络模式，通常 host 模式更简单，避免复杂的端口映射，且方便FFmpeg访问RTSP流
    network_mode: host 
    # 或者用 bridge 模式，需要手动映射端口
    # ports:
    #   - "5000:5000" # Frigate Web UI
    #   - "1935:1935" # RTMP 流
  
    volumes:
      - /etc/localtime:/etc/localtime:ro # 同步时区
      - /mnt/data/frigate/config:/config:ro # 映射 Frigate 配置文件 (只读，避免容器修改)
      - /mnt/data/frigate/media:/media # 映射录像、快照和数据库等数据 (读写)

      # 如果使用 Intel 核显进行 FFmpeg 解码/编码硬件加速
      # - /dev/dri:/dev/dri

      # 如果使用 Coral TPU (USB 版本或 PCIe 版本通用设备映射)
      # - /dev/bus/usb:/dev/bus/usb # 挂载整个 USB bus，让容器识别 Coral USB
      # 如果你的Coral设备文件是固定的，可以精确映射，例如：
      # - /dev/bus/usb/001/002:/dev/bus/usb/001/002 # 精确映射某个USB设备

      # 如果使用 NVIDIA GPU (需要安装 NVIDIA Container Toolkit)
      # devices:
      #   - /dev/nvidia0:/dev/nvidia0
      #   - /dev/nvidiactl:/dev/nvidiactl
      #   - /dev/nvidia-uvm:/dev/nvidia-uvm
      # runtime: nvidia

    environment:
      # 在某些系统上，PUID/PGID 可能有助于文件权限
      # - PUID=1000
      # - PGID=100
      # 更多环境变量可参考 Frigate 文档，例如：
      # - FRIGATE_ENV_VAR=value
  
    # 设定 CPU 核心和内存限制，防止占用过多资源
    # deploy:
    #   resources:
    #     limits:
    #       cpus: '3.0' # 限制为3个CPU核心
    #       memory: 4G  # 限制为4GB内存

    restart: unless-stopped # 容器崩溃或服务器重启后自动重启
```

**配置解释：**

*   `image: blakeblackshear/frigate:stable`：使用 Frigate 的稳定版 Docker 镜像。
*   `privileged: true`：**必需**。允许容器访问宿主机的 `/dev` 设备，这是为了让容器能够识别和使用 `/dev/dri` (Intel GPU) 或 `/dev/bus/usb` (Coral USB)。
*   `network_mode: host`：为了简化，让容器直接使用宿主机的网络堆栈。这样 Frigate 就可以直接访问你的局域网中的摄像头，而无需复杂的端口转发或 Bridge 网络配置。缺点是容器不再拥有独立 IP。如果你需要为 Frigate 分配一个独立的 IP 地址，请使用 `bridge` 模式并手动映射端口。
*   `volumes:`
    *   `/etc/localtime:/etc/localtime:ro`：同步容器和宿主机的时区。
    *   `/mnt/data/frigate/config:/config:ro`：将宿主机的 `config` 目录映射为容器内部的 `/config`。`ro` 表示只读，这意味着 Frigate 无法修改 `config.yml`。
    *   `/mnt/data/frigate/media:/media`：将宿主机的 `media` 目录映射为容器内部的 `/media`。Frigate 会将录像、快照、数据库文件等存储在这里。
    *   **`/dev/dri:/dev/dri`** (Intel GPU 解码/编码)：如果使用 Intel CPU 的核显进行硬件加速，请取消注释此行。
    *   **`/dev/bus/usb:/dev/bus/usb`** (Coral USB TPU)：如果使用 USB Coral TPU，请取消注释此行。
*   `environment`: 如果宿主机的文件权限与容器内 Jellyfin 的 `PUID`/`PGID` 不匹配，你可能需要根据实际情况设置这些环境变量，确保容器有权限写入 `media` 目录。
*   `restart: unless-stopped`：保证 Frigate 在服务器重启后自动启动。

保存并关闭文件。

### 5. 启动 Frigate 容器

在 `/mnt/data/frigate` 目录下，执行以下命令来启动 Frigate：

```bash
sudo docker compose up -d
```

*   `docker compose up`：根据 `docker-compose.yml` 文件创建并启动服务。
*   `-d`：表示在后台运行容器。

如果一切顺利，Frigate 容器应该已经启动并运行。

### 6. 检查容器状态和日志

```bash
sudo docker ps -a | grep frigate
sudo docker logs -f frigate # 查看实时日志，检查是否有错误，特别是关于FFmpeg和Coral TPU的
```
在日志中，你应该能看到 FFmpeg 启动、摄像头流接收以及 Coral TPU 初始化成功的消息。

### 7. 访问 Frigate Web UI

打开你的浏览器，访问 `http://你的服务器IP:5000`。

你将看到 Frigate 的 Web UI 界面。
*   在 `Live` 页面，你应该能看到你的摄像头实时画面。
*   在 `Events` 页面，当 Frigate 检测到配置的对象时，会生成事件和快照。
*   在 `Configuration` 页面，你可以查看当前的配置（只读）。

## 五、与 Home Assistant 集成（推荐）

Frigate 与 Home Assistant 官方集成，可以极大扩展其功能。

1.  确保你的 Home Assistant 和 Frigate 都在同一个网络中，且 MQTT 服务已运行并配置在 Frigate 的 `config.yml` 中。
2.  在 Home Assistant 中，进入 `设置` -> `设备与服务` -> `添加集成`。
3.  搜索 `Frigate`。
4.  Home Assistant 会尝试自动发现 Frigate。如果发现失败，你可能需要手动输入 Frigate 的 IP 地址。
5.  通过集成，Home Assistant 会自动创建各种 Frigate 实体，包括：
    *   `binary_sensor`：每次检测到对象时触发。
    *   `media_player`：用于查看摄像头直播流。
    *   `camera`：用于查看录像、快照。
    *   `sensor`：显示当前在线人数、车辆数等。
6.  你可以利用这些实体在 Home Assistant 中创建强大的自动化，例如：
    *   当 Frigate 检测到 `person` 时，触发智能灯光亮起。
    *   当 Frigate 检测到 `car` 且是夜间时，发送包含快照的通知到手机。
    *   结合门窗传感器，只有在门窗打开时才检测特定区域等。

## 六、高级配置与优化

### 1. FFmpeg 硬件加速

如果你的服务器 CPU 是 Intel (带核显)，强烈建议开启 FFmpeg 的硬件解码/编码，可以大幅降低 CPU 占用。

1.  **宿主机驱动**：确保你的 Linux 系统已安装 Intel 显卡的 VA-API 驱动。
2.  **Docker Compose**：在 `volumes` 中添加 `- /dev/dri:/dev/dri`。
3.  **Frigate `config.yml`**：
    在 `ffmpeg` 部分的 `global_args` 中添加：
    ```yaml
    ffmpeg:
      global_args: -hwaccel vaapi -hwaccel_output_format vaapi
    ```
    并调整 `output_args` 中的编码器，例如：
    ```yaml
    # ...
    output_args:
      detect: -f segment -segment_times 10 -segment_format mp4 -r 10 -c:v h264_vaapi -preset ultrafast -tune zerolatency -crf 23 -bf 0 -g 30 -sc_threshold 0 -pix_fmt vaapi_vpp -movflags +faststart
      record: -c:v h264_vaapi -map 0:v:0 -map 0:a? -f segment -segment_times 10 -segment_format mp4 -reset_timestamps 1 -strftime 1 -ar 44100 # 如果录像也想用VAAPI编码
    ```
    具体编码器名称(`h264_vaapi`) 和像素格式 (`vaapi_vpp`) 可能因 FFmpeg 版本和驱动而异，请查阅资料匹配。

### 2. 内存磁盘 (`tmpfs`)

Frigate 会在 `cache` 中存储一些临时文件。如果你的内存足够大，可以考虑将 `/tmp/cache` 映射为 `tmpfs`，以减少磁盘 I/O，并提升性能。

在 `docker-compose.yml` 中 `volumes` 部分添加：

```yaml
    volumes:
      # ... 其他 volumes
      - type: tmpfs # 内存磁盘
        target: /tmp/cache
        tmpfs:
          size: 1g # 设定为1GB，根据你的内存和摄像头数量调整
```

### 3. 多路 Coral TPU

如果你有多个 Coral TPU，可以在 `config.yml` 的 `detectors` 部分定义多个 `edgetpu` 检测器，并为每个摄像头指定使用哪个 TPU。

```yaml
detectors:
  coral_tpu_0:
    type: edgetpu
    device: usb:0 # 引用第一个 USB Coral
  coral_tpu_1:
    type: edgetpu
    device: usb:1 # 引用第二个 USB Coral

cameras:
  front_door:
    detector: coral_tpu_0 # 指定使用哪个检测器
    # ...
  back_yard:
    detector: coral_tpu_1 # 指定使用哪个检测器
    # ...
```

### 4. 远程存储

Frigate 可以配置将录像和快照存储到远程位置（如网络共享、S3 存储桶）。这需要更复杂的配置和额外的工具（如 `rclone`）。

### 5. 自定义 AI 模型

Frigate 允许你使用自定义的 TensorFlow Lite 模型，来识别更多类型的物体或优化现有物体识别性能。这需要具备一定的 AI 模型训练和转换知识。

## 七、总结

Frigate 是一个革命性的本地视频监控解决方案，它将 AI 驱动的目标检测带入了家庭和小型办公室场景。通过智能识别和事件驱动的录制，它解决了传统监控系统在误报、存储空间和事件查找方面的痛点。配合 Google Coral TPU，Frigate 能够提供高性能的实时检测，并与 Home Assistant 无缝集成，开启无限自动化可能。

虽然部署 Frigate 需要一些 Docker 和 YAML 配置的知识，但一旦配置完成，它将大大提升你的监控体验，让你的智能家居系统真正“智能”起来。强烈推荐给所有希望升级自己视频监控系统的用户！