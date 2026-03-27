---
title: HLS (HTTP Live Streaming) 协议详解
date: 2025-06-22 06:24:00
tags:
  - 2025
  - HLS
  - 计算机网络
  - 网络协议
  - Web影音
categories:
  - 计算机网络
  - 网络协议
---

> **HLS (HTTP Live Streaming)** 是一种由 Apple 公司提出的、基于 HTTP 协议的自适应比特率流媒体通信协议。它旨在通过将媒体内容切割成一系列小的、基于 HTTP 的媒体文件片段，并提供一个描述这些片段的索引文件（M3U8 播放列表），从而实现**在各种网络条件下为用户提供流畅和高质量的视频播放体验**。HLS 最初为 iOS 设备开发，但如今已成为事实上的行业标准，广泛应用于视频点播 (VOD) 和直播 (Live Streaming) 服务中，几乎所有主流浏览器和设备都支持 HLS 播放。

{% note info %}
核心思想：
-   **自适应性**：根据客户端网络带宽和设备性能动态选择并切换媒体流质量。
-   **基于 HTTP**：利用现有的全球 HTTP 服务器和 CDN 基础设施进行内容分发。
-   **M3U8 播放列表**：文本格式的索引文件，描述了可用的媒体流、它们的质量选项和媒体片段的 URI。
-   **媒体分段**：将原始媒体内容分割成短小的 MPEG-2 TS (Transport Stream) 或 fMP4 (Fragmented MP4) 片段。
{% endnote %}

------

## 一、为什么需要 HLS？

在 HLS 出现之前，流媒体传输面临着与 DASH 类似的多重挑战，尤其是在移动互联网和多设备时代：

1.  **网络波动性**：移动网络（3G/4G/5G）和 Wi-Fi 网络经常出现带宽波动。传统的、固定码率的流媒体传输在带宽不足时容易导致卡顿，而在带宽充足时又无法提供最高的清晰度。
2.  **设备碎片化**：用户设备种类繁多，屏幕尺寸、分辨率和处理能力各异。单一质量的媒体流无法满足所有设备的需求。
3.  **防火墙与网络兼容性**：传统的流媒体协议（如 RTMP）通常依赖特定的端口或协议，容易被企业防火墙阻止，且难以利用标准 HTTP 缓存机制。
4.  **Apple 生态系统的需求**：Apple 公司为了在 iOS 设备上提供最佳视频体验，同时利用其强大的浏览器和操作系统平台，需要一种能够无缝集成、高效运行的流媒体解决方案。

HLS 通过采用分段传输和基于 HTTP 的自适应策略，有效地解决了这些问题，实现了：
*   **无缝自适应**：自动调整视频质量，减少卡顿。
*   **广泛兼容**：利用 HTTP 协议，与现有 Web 基础设施和 CDN 无缝集成。
*   **跨设备支持**：得益于 Apple 的推广和其开放性（尽管最初是私有协议，但规范已公开），HLS 几乎在所有设备和平台上都受到广泛支持。

## 二、HLS 核心概念

理解 HLS 需要掌握以下几个关键概念：

### 2.1 自适应比特率流媒体 (Adaptive Bitrate Streaming)

与 DASH 相同，HLS 的核心能力在于自适应比特率流媒体。它允许服务器为同一内容提供多个不同比特率（和分辨率）的版本，客户端播放器可以根据网络带宽、CPU 使用率和显示能力等实时条件，动态地在这些版本之间进行切换。目标是始终提供当前环境下最佳的视频质量，最小化缓冲和卡顿。

### 2.2 基于 HTTP 的流媒体 (HTTP-based Streaming)

HLS 完全基于标准的 HTTP/HTTPS 协议进行媒体内容传输。这意味着内容提供商可以利用全球部署的 HTTP 服务器、CDN (内容分发网络) 和 HTTP 缓存机制来分发内容，无需特殊的流媒体服务器。这大大降低了部署和运营成本，同时也具有更好的防火墙穿透性。

### 2.3 媒体分段 (Media Segments)

原始的音视频内容会被编码成不同的质量版本，并且每个版本都会被进一步**分割成一系列短小的、独立的媒体片段（segments）**。每个片段通常是几秒钟长（例如 2 秒、6 秒或 10 秒）。历史版本中，HLS 主要使用 **MPEG-2 Transport Stream (.ts)** 格式作为媒体片段，但现代 HLS 也广泛支持 **Fragmented MP4 (fMP4)** 格式，这与 DASH 的片段格式趋于一致，有助于实现 Common Media Application Format (CMAF)。

### 2.4 M3U8 播放列表 (M3U8 Playlist)

M3U8 是 HLS 的核心索引文件格式，它是一个基于 UTF-8 编码的文本文件。它不包含实际的媒体数据，而是包含**媒体片段的 URI 列表和其他元数据**。HLS 定义了两种主要的 M3U8 播放列表：

*   **Master Playlist (主播放列表)**：
    *   用于描述所有可用的变体流 (Variant Streams)。
    *   每个变体流对应一个不同的比特率、分辨率、音频语言或编解码器组合。
    *   主播放列表包含对一个或多个**媒体播放列表**的 URI 引用。
    *   客户端在开始播放前，首先下载并解析主播放列表，了解所有可选的质量版本。

    **M3U8 主播放列表示例：**
    ```m3u8
    #EXTM3U
    #EXT-X-STREAM-INF:BANDWIDTH=1280000,AVERAGE-BANDWIDTH=1000000,RESOLUTION=640x360,CODECS="avc1.42e01e,mp4a.40.2"
    360p.m3u8
    #EXT-X-STREAM-INF:BANDWIDTH=2560000,AVERAGE-BANDWIDTH=2000000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
    720p.m3u8
    #EXT-X-STREAM-INF:BANDWIDTH=7680000,AVERAGE-BANDWIDTH=6000000,RESOLUTION=1920x1080,CODECS="avc1.64002a,mp4a.40.2"
    1080p.m3u8
    ```
    其中 `#EXT-X-STREAM-INF` 标签描述了每个变体流的属性，例如 `BANDWIDTH`（带宽）、`RESOLUTION`（分辨率）和 `CODECS`（编解码器）。

*   **Media Playlist (媒体播放列表)**：
    *   描述特定变体流（即特定质量版本）中的媒体片段序列。
    *   包含一系列 `#EXTINF` 标签，每个标签指定一个媒体片段的持续时间，后面紧跟着该片段的 URI。
    *   对于直播，媒体播放列表会动态更新，新的片段会被追加，旧的片段（已播放或不再需要的）会被移除。
    *   对于点播，媒体播放列表是完整的、静态的。

    **M3U8 媒体播放列表示例 (直播动态更新)：**
    ```m3u8
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:100
    #EXT-X-PLAYLIST-TYPE:LIVE
    #EXTINF:10.0,
    segment100.ts
    #EXTINF:10.0,
    segment101.ts
    #EXTINF:10.0,
    segment102.ts
    ```
    *   `#EXT-X-TARGETDURATION`: 定义媒体片段的最大持续时间（秒）。客户端以此为依据推断何时去刷新播放列表。
    *   `#EXT-X-MEDIA-SEQUENCE`: 序列号，指示播放列表中第一个片段的唯一序列号。对于直播，此值会随着新片段的添加而递增。
    *   `#EXT-X-PLAYLIST-TYPE:LIVE`: 标记为直播播放列表。对于点播是 `VOD` 或不指定。
    *   `#EXTINF`: 标记一个媒体片段的持续时间。

## 三、HLS 的工作原理

HLS 的工作流程可以分为内容准备和客户端播放两个主要阶段：

### 3.1 内容准备 (Content Preparation / Server Side)

1.  **媒体编码与转码**：原始媒体内容（视频、音频）会被编码成不同的质量版本，即不同的比特率、分辨率、编解码器组合。例如，一个视频可能被编码为 1080p (5Mbps)、720p (3Mbps)、480p (1Mbps) 等多个版本。
2.  **媒体分段 (Segmentation)**：每个编码后的质量版本都会被分割成一系列短小的、同等长度的（例如，每 6 秒）媒体片段。这些片段通常存储为 `.ts` 文件或 `.mp4` 文件。
3.  **M3U8 播放列表生成**：
    *   **媒体播放列表 (Media Playlists)**：为每个质量版本的媒体片段序列生成一个专用的 M3U8 文件。对于直播，这个列表会动态更新，每当有新的片段生成，就会添加到列表中，并可能移除旧的片段（通常保持固定数量的最近片段）。
    *   **主播放列表 (Master Playlist)**：生成一个 M3U8 文件，其中包含了所有媒体播放列表的引用，以及每个媒体流的元数据（如带宽、分辨率、编解码器等）。

### 3.2 客户端播放 (Client Playback)

1.  **获取主播放列表**：HLS 客户端（浏览器中的 JavaScript 播放器、原生应用等）首先通过 HTTP 请求获取主播放列表 (Master Playlist)。
2.  **解析主播放列表**：客户端解析主播放列表，获取所有可用的变体流信息（不同质量版本）。
3.  **选择初始媒体流**：客户端基于初始网络状况、设备能力（如屏幕分辨率）和用户偏好，选择一个合适的媒体播放列表作为初始播放流。
4.  **获取媒体播放列表**：客户端请求并下载选定的媒体播放列表。
5.  **获取媒体片段**：客户端根据媒体播放列表中的 URI 顺序，通过 HTTP 请求下载媒体片段。
6.  **缓冲与播放**：客户端将下载的媒体片段放入播放缓冲区。当缓冲区达到一定阈值时，开始解码并播放。
7.  **自适应质量切换**：在播放过程中，HLS 客户端会持续监测：
    *   **实时网络带宽**：通过测量片段的下载速度来估算。
    *   **播放缓冲区状态**：观察缓冲区的填充或消耗速度。
    *   **CPU 负载**：了解设备解码能力。
    根据这些实时数据，客户端会动态地决定是“升级”到更高质量的媒体流（如果带宽充足）还是“降级”到更低质量的媒体流（如果带宽不足，以避免卡顿）。切换通常在片段边界处发生，以确保平滑过渡。
8.  **直播播放列表刷新**：对于直播，客户端会定期刷新媒体播放列表（例如，根据 `#EXT-X-TARGETDURATION` 指定的时间间隔），以获取最新的媒体片段列表，从而持续播放直播内容。

以下是一个简化的 HLS 工作流程 Mermaid 图：

{% mermaid %}
graph TD
    %% 全局样式定义 (针对深色模式优化)
    classDef default fill:#1e1e1e,stroke:#555,stroke-width:1px,color:#d4d4d4;
    classDef server fill:#2d3748,stroke:#4a9eff,stroke-width:2px,color:#fff;
    classDef storage fill:#3c3c3c,stroke:#ffa726,stroke-width:1px,color:#ffe0b2;
    classDef client fill:#2c3e50,stroke:#66bb6a,stroke-width:2px,color:#fff;

    subgraph Prep ["内容准备 (Content Preparation)"]
        A[原始媒体内容] --> B{多码率转码}
        B --> C[切片器 / Slicer]
        C --> D1["360p.m3u8 (Variant)"]
        C --> D2["720p.m3u8 (Variant)"]
        D1 & D2 --> E["master.m3u8 (Master)"]
    end

    subgraph Infra ["CDN / HTTP Server"]
        F[[Master Playlist]]
        G[[Variant Playlists]]
        H[(Segment Files .ts/.m4s)]
        E -.-> F
        D1 & D2 -.-> G
        C -.-> H
    end

    subgraph HLS_Player ["HLS Player (Client Side)"]
        I[播放器启动] --> J{请求 Master}
        J --> F
        F --> K[解析多码率层级]
        K --> L{ABR 决策层<br/>带宽/设备监测}
        L --> M[请求选定 Variant]
        M --> G
        G --> N[解析分片列表]
        N --> O[请求媒体片段]
        O --> H
        H --> P[Buffer 缓冲]
        P --> Q[解码与播放]
        
        %% 循环与反馈
        Q -- 状态反馈 --> L
        Q -- "直播: 定期刷新" --> M
    end

    %% 应用样式
    class A,B,C,D1,D2,E server;
    class F,G,H storage;
    class I,J,K,L,M,N,O,P,Q client;

    %% 连线颜色微调
    linkStyle default stroke:#888,stroke-width:1px,fill:none;
{% endmermaid %}

## 四、HLS 的主要组件

1.  **媒体编码器/流送器 (Media Encoder/Streamer)**：
    *   负责将原始媒体源编码成不同比特率和分辨率的版本。
    *   将编码后的流分割成媒体片段。
    *   生成并维护 M3U8 播放列表文件（特别是直播时需要动态更新）。

2.  **HTTP 服务器/CDN (Content Delivery Network)**：
    *   存储并分发 M3U8 播放列表和媒体片段文件。
    *   由于 HLS 基于 HTTP，可以充分利用 CDN 的全球分发能力，提高内容传输效率和用户访问速度。

3.  **HLS 客户端 (HLS Client)**：
    *   负责获取主播放列表及相应的媒体播放列表。
    *   根据自适应算法实时监测网络和设备状况，动态选择最佳质量流。
    *   请求、接收、缓冲、解码并播放媒体片段。
    *   主流的 Web 浏览器（通过 `<video>` 标签或 JavaScript 库如 `hls.js`），iOS/Android 原生 SDK，智能电视等都内置或支持 HLS 客户端。

4.  **M3U8 播放列表 (M3U8 Playlists)**：
    *   如前所述，包括主播放列表和媒体播放列表，是 HLS 协议的核心索引文件。

5.  **媒体片段 (Media Segments)**：
    *   通常是 MPEG-2 TS (`.ts`) 文件或 Fragmented MP4 (`.mp4`) 文件，包含实际的音视频数据。

## 五、HLS 的优势

1.  **广泛的设备兼容性**：作为 Apple 的原生流媒体格式，HLS 在 iOS、macOS 和 Safari 浏览器上获得最佳支持。通过第三方库和播放器，HLS 也广泛支持 Android、Windows、智能电视和各种 Web 浏览器。
2.  **利用 HTTP 基础设施**：无需专用流媒体服务器或协议，可与现有的 HTTP 服务器、CDN 和缓存设备无缝集成，降低了部署成本和复杂性，并且具有良好的防火墙穿透性。
3.  **自适应比特率**：根据网络条件自动调整视频质量，提供流畅的观看体验，减少缓冲和卡顿。
4.  **简单的内容保护**：HLS 内置了对基本加密（AES-128）的支持，并可与更复杂的 DRM 系统（如 Apple FairPlay Streaming）集成，保护版权内容。
5.  **易于实现**：M3U8 播放列表是简单的文本文件，易于生成、解析和调试。
6.  **成熟稳定**：作为一项发展多年的技术，HLS 的规范和实现都非常成熟，有大量的工具和生态系统支持。

## 六、HLS 的挑战与限制

1.  **传统 HLS 的延迟**：传统的 HLS 协议由于其片段切割的机制（通常为 6-10 秒），在直播场景下会引入数秒到数十秒的端到端延迟。这对于实时交互性要求高的直播（如在线竞拍、观众互动）是一个挑战。
2.  **片段粒度**：较大的片段长度有助于提高编码效率和缓存命中率，但会增加启动延迟和切换延迟。如果片段过小，管理开销会增加。
3.  **MPEG-2 TS 格式的开销**： historically，HLS 对 MPEG-2 TS 的依赖导致其兼容性在非 Apple 生态系统中可能不如 fMP4 灵活，尽管现在已广泛支持 fMP4。
4.  **私有协议背景**：尽管已成为事实标准，但其起源于 Apple 私有协议，过去可能存在一些平台特定的优化和实现差异。

为了应对直播延迟问题，Apple 推出了 **Low-Latency HLS (LL-HLS)** 规范，它通过更小的片段（部分片段）、HTTP/2 Push 和预取等技术，显著降低了直播延迟，使其可以与 WebRTC 等技术在高互动性场景中竞争。

## 七、HLS 与 DASH 的对比

HLS 和 DASH 是目前最主流的两种基于 HTTP 的自适应流媒体协议。它们在核心理念上趋同，但在技术细节和普及度上存在差异。随着 Common Media Application Format (CMAF) 的出现，两者在片段格式上正在融合，以便使用同一套媒体内容服务于两种协议的客户端。

| 特性             | HLS                                             | DASH                                      |
| :--------------- | :---------------------------------------------- | :---------------------------------------- |
| **标准**         | Apple 私有协议，后成为事实标准                  | ISO/IEC 23009-1 (国际开放标准)          |
| **清单文件格式** | M3U8 (基于文本的 Playlist)                      | XML (MPD - Media Presentation Description) |
| **片段格式**     | 传统上是 MPEG-2 TS，现在也广泛支持 fMP4       | 主要为 ISOBMFF (fMP4)，也可以是 MPEG-2 TS |
| **编解码器中立性** | 对编解码器要求较宽松，传统上倾向于 H.264/AAC    | 高度中立，支持各种音视频编解码器         |
| **DRM 支持**     | 支持 Apple FairPlay Streaming，也可以通过 CMAF 支持 CENC | 内置通用加密 (CENC) 支持多种 DRM 方案     |
| **普及度**       | iOS/macOS 设备的默认和首选协议，Web 浏览器广泛支持 | Android 平台、智能电视、OTT 设备、PC (通过 dash.js) 广泛支持 |
| **低延迟**       | 有 LL-HLS 扩展                                  | 有 LL-DASH 扩展                             |

## 八、HLS 的应用场景

HLS 广泛应用于以下领域：

*   **视频点播 (Video On Demand, VOD)**：包括电影、电视剧、用户上传内容等。例如 YouTube、Netflix (也用 DASH)、Vimeo 等。
*   **直播 (Live Streaming)**：新闻直播、体育赛事、在线教育、游戏直播等。尤其是通过 LL-HLS，支持更高实时性的需求。
*   **在线教育和企业培训**：确保不同网络条件下的学员都能流畅观看教学视频。
*   **短视频平台**：通过 HLS 分发短视频内容，确保快速启动和流畅播放。
*   **OTT (Over-The-Top) 服务**：智能电视和机顶盒上的流媒体应用普遍支持 HLS。

## 九、总结

HLS 作为由 Apple 公司开创并推广的基于 HTTP 协议的自适应流媒体技术，已经成为当今互联网视频传输领域的核心技术之一。其利用 HTTP 协议的普适性、M3U8 播放列表的灵活性以及自适应比特率的机制，成功解决了在复杂多变网络环境下提供高质量视频体验的挑战。

从最初为苹果设备量身定制的解决方案，到如今被几乎所有主流平台和浏览器支持的事实标准，HLS 的演进证明了其设计的稳健性和市场的广泛需求。随着低延迟 HLS (LL-HLS) 和 Common Media Application Format (CMAF) 等新技术的不断发展，HLS 将继续在提供更丰富的媒体体验、降低直播延迟和提高跨平台互操作性方面发挥关键作用，为未来的数字媒体世界奠定坚实基础。