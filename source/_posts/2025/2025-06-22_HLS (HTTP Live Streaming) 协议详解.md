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

> **HLS (HTTP Live Streaming)** 是 Apple 公司在 2009 年推出的一种基于 HTTP 的自适应比特率流媒体传输协议。它将整个媒体流切割成一系列小的、基于 HTTP 的文件片段，通常是 MPEG-2 Transport Stream (TS) 格式。客户端下载这些片段，并通过一个被称为 "manifest" 或 "playlist" 的 M3U8 文件来获取片段的顺序和可用的比特率版本。HLS 最初是为了在 iOS 设备上播放流媒体而设计，但由于其简单、CDN 友好以及自适应比特率等优势，现已成为互联网上最流行的流媒体协议之一。

{% note info info %}
核心思想：**将视频内容切分成小段（TS 文件），用 M3U8 文件描述这些片段的顺序和不同质量版本，客户端通过 HTTP 渐进下载和播放，并根据网络状况动态切换视频质量。**
{% endnote %}
------

## 一、为什么需要 HLS？

在 HLS 出现之前，传统的流媒体协议如 RTMP (Real-Time Messaging Protocol) 依赖于特定的服务器和协议栈，需要专门的流媒体服务器，并且在防火墙和 CDN 部署方面存在一些挑战。HLS 的出现旨在解决这些问题，并提供更优的流媒体体验：

1.  **基于标准 HTTP/TCP**：
    *   **CDN 友好**：可以直接利用现有的 HTTP 服务器和内容分发网络 (CDN) 进行高效缓存和分发，大大降低了基础设施成本和复杂性。
    *   **防火墙穿透**：HTTP 流量通常不会被防火墙阻拦，因此具有更好的可达性。
2.  **自适应比特率 (Adaptive Bitrate Streaming - ABR)**：
    *   HLS 服务器提供同一视频的多个不同分辨率和比特率的版本。
    *   客户端播放器可以根据用户的网络带宽、设备性能和屏幕大小，动态地在这些版本之间切换，从而提供最佳的观看体验，避免卡顿或画质模糊。
3.  **广泛的设备支持**：
    *   最初为 iOS 和 macOS 设计， Safari 浏览器原生支持 HLS。
    *   通过 JavaScript 库 (如 [hls.js](https://github.com/video-dev/hls.js/))，HLS 可以在 Chrome, Firefox, Edge 等不支持原生 HLS 的现代浏览器中播放。
    *   智能电视、机顶盒、Android 设备等也普遍支持 HLS。
4.  **易于实现**：服务器端实现相对简单，可以将视频编码为不同比特率的片段，并生成对应的 M3U8 文件。

## 二、HLS 协议的工作原理

HLS 的核心工作流程涉及以下几个关键组件：

### 2.1 编码与切片 (Encoding and Segmentation)

1.  **视频编码**：原始视频源被编码成一个或多个不同比特率和分辨率的版本。常见的视频编码器是 H.264 或 H.265 (HEVC)，音频编码器是 AAC。
2.  **封装 (Container)**：编码后的视频和音频流被封装到 MPEG-2 Transport Stream (TS) 文件中。TS 是一种标准的数字容器格式，可以包含多个音频、视频和数据流。
3.  **切片 (Segmentation)**：每个编码版本的视频流都会被切割成一系列小的、固定长度（通常为 2-10 秒）的 `.ts` 文件片段。

### 2.2 Manifest 文件 (M3U8 Playlist)

HLS 使用扩展的 M3U8 文件作为 manifest (播放列表) 文件。M3U8 文件是基于 HTTP 的文本文件，它包含了关于媒体流的所有元数据，客户端通过解析这些文件来理解如何播放视频。

M3U8 文件分为两种类型：

1.  **主播放列表 (Master Playlist)**：
    *   通常是第一个被客户端请求的 M3U8 文件。
    *   它不直接包含媒体片段，而是列出了一系列可用的**媒体播放列表 (Media Playlists)**，每个媒体播放列表对应一个不同比特率或分辨率的视频流。
    *   包含 `#EXT-X-STREAM-INF` 标签，描述了每个媒体流的带宽、分辨率、编码信息以及其对应的媒体播放列表的 URI。

    **主播放列表示例：**

    ```m3u8
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-independent-segments // 表示所有媒体段独立，可从任意段开始播放

    #EXT-X-STREAM-INF:BANDWIDTH=1280000,AVERAGE-BANDWIDTH=1000000,CODECS="avc1.4d401f,mp4a.40.2",RESOLUTION=640x360
    http://example.com/video/360p/playlist.m3u8

    #EXT-X-STREAM-INF:BANDWIDTH=2560000,AVERAGE-BANDWIDTH=2000000,CODECS="avc1.4d4028,mp4a.40.2",RESOLUTION=1280x720
    http://example.com/video/720p/playlist.m3u8

    #EXT-X-STREAM-INF:BANDWIDTH=7680000,AVERAGE-BANDWIDTH=6000000,CODECS="avc1.4d402a,mp4a.40.2",RESOLUTION=1920x1080
    http://example.com/video/1080p/playlist.m3u8
    ```

2.  **媒体播放列表 (Media Playlist)**：
    *   包含实际的媒体片段 (`.ts` 文件) 的 URI 列表，以及每个片段的持续时间。
    *   对于点播 (VOD) 视频，媒体播放列表是一个完整的、静态的文件。
    *   对于直播 (Live) 视频，媒体播放列表会不断更新，服务器会删除旧的片段条目并添加新的片段条目。
    *   包含 `#EXTINF` 标签（媒体片段持续时间）和 `#EXT-X-ENDLIST` 标签（仅限点播，表示播放列表结束）。

    **点播媒体播放列表示例：**

    ```m3u8
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10 // 最大片段持续时间
    #EXT-X-MEDIA-SEQUENCE:0 // 第一个媒体片段的序列号

    #EXTINF:10.000, // 片段持续时间
    http://example.com/video/360p/segment00000.ts

    #EXTINF:10.000,
    http://example.com/video/360p/segment00001.ts

    #EXTINF:10.000,
    http://example.com/video/360p/segment00002.ts

    #EXT-X-ENDLIST // 标识播放列表结束（点播流）
    ```

    **直播媒体播放列表示例 (会不断更新)：**

    ```m3u8
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:10
    #EXT-X-MEDIA-SEQUENCE:123 // 序列号会增加

    #EXTINF:10.000,
    http://example.com/video/360p/segment00123.ts

    #EXTINF:10.000,
    http://example.com/video/360p/segment00124.ts

    #EXTINF:10.000,
    http://example.com/video/360p/segment00125.ts
    // ... 服务器会不断添加新的片段，并移除最老的片段
    ```

### 2.3 客户端播放器 (Client Player)

1.  **加载主播放列表**：播放器首先加载主播放列表 (`.m3u8` 文件)。
2.  **选择初始流**：根据初始带宽、屏幕分辨率等信息，选择一个合适的媒体播放列表作为初始播放流。
3.  **加载媒体播放列表**：加载选定的媒体播放列表。
4.  **下载片段**：逐个下载列表中的 `.ts` 媒体片段。
5.  **解封装与解码**：将下载的 `.ts` 片段通过浏览器的 Media Source Extensions (MSE) API 喂给 HTML5 `<video>` 元素。浏览器负责解封装、解码和渲染视频。
6.  **自适应切换**：播放器会持续监控网络带宽和缓冲区状况。如果带宽下降，它会切换到比特率较低的媒体流；如果带宽提升，则切换到更高比特率的媒体流，以提供更好的画质。这个过程是无缝的，用户通常不会察觉。
7.  **直播更新**：对于直播流，播放器会定期重新加载媒体播放列表，获取最新的媒体片段并追加到播放队列中。

{% mermaid %}
graph TD
    A[原始视频源] --> B{编码与切片};
    B --> C1[1080p TS 片段];
    B --> C2[720p TS 片段];
    B --> C3[360p TS 片段];

    C1 --> D1[1080p Media Playlist.m3u8];
    C2 --> D2[720p Media Playlist.m3u8];
    C3 --> D3[360p Media Playlist.m3u8];

    D1 --> E[Master Playlist.m3u8];
    D2 --> E;
    D3 --> E;

    E --> F[客户端播放器];
    F --> G{网络带宽检测};
    G -- 切换流 --> F;
    F --> H[下载TS片段];
    H --> I[Media Source Extensions API];
    I --> J[HTML5 &lt;video&gt; 元素];
    J --> K[用户观看];

    subgraph Server
        A
        B
        C1
        C2
        C3
        D1
        D2
        D3
        E
    end

    subgraph Client
        F
        G
        H
        I
        J
        K
    end
{% endmermaid %}

## 三、HLS 的主要特性

1.  **基于 HTTP**：所有传输都通过 HTTP 完成，便于与现有 Web 基础设施集成。
2.  **自适应比特率 (ABR)**：根据网络状况动态调整视频质量。
3.  **MPEG-2 TS 片段**：视频通常被封装成 `.ts` 文件，便于切片和播放。
4.  **M3U8 播放列表**：清晰描述媒体结构和可用流的信息。
5.  **直播与点播支持**：
    *   **点播 (VOD)**：M3U8 文件是静态的，`#EXT-X-ENDLIST` 标签表示文件结束。
    *   **直播 (Live)**：M3U8 文件是动态更新的，没有 `#EXT-X-ENDLIST` 标签，且会不断添加新的片段。
6.  **DVR 功能 (Digital Video Recorder)**：对于直播流，服务器可以保留一定时长的旧片段，允许用户回放最近的内容。客户端可以通过更改 `MEDIA_SEQUENCE` 来实现。
7.  **加密与 DRM (Digital Rights Management)**：HLS 支持基本的 AES-128 加密，通过 `#EXT-X-KEY` 标签指定密钥 URI。更复杂的 DRM 方案（如 FairPlay Streaming）也可以与 HLS 结合使用。
8.  **广告插入**：通过在 M3U8 文件中插入 `#EXT-X-CUE` 或自定义标签，可以在流中标记广告插入点。
9.  **多音轨与多字幕**：HLS 支持在主播放列表中定义多个音轨（如多语言音频）和字幕轨道。

## 四、HLS 与其他流媒体协议的对比

| 特性           | HLS                                | MPEG-DASH                                  | RTMP                                    | WebRTC                                      |
| :------------- | :--------------------------------- | :----------------------------------------- | :-------------------------------------- | :------------------------------------------ |
| **协议**       | HTTP                               | HTTP                                       | RTMP (专用协议)                         | UDP (P2P), STUN/TURN, SDP                   |
| **切片格式**   | MPEG-2 TS (传统), MP4 Fragment (fMP4) | MP4 Fragment (fMP4)                        | 非切片流                                | 非切片流                                    |
| **Manifest**   | M3U8                               | MPD (Media Presentation Description) XML   | 无 (会话描述)                           | SDP (Session Description Protocol)          |
| **ABR**        | 支持                               | 支持                                       | 不支持 (通常通过服务器端逻辑实现)     | 不支持 (P2P 直连，需应用层处理)           |
| **延迟**       | 通常 5-30 秒 (直播)                | 通常 3-10 秒 (直播)                        | 毫秒级到秒级 (直播)                     | 毫秒级 (实时通信)                           |
| **CDN 友好**   | 高                                 | 高                                         | 差 (需特殊配置)                         | 差 (P2P，需信令服务器和穿透服务器)        |
| **浏览器支持** | Safari 原生，其他需 JS 库 (hls.js) | 部分浏览器原生，其他需 JS 库 (dash.js)   | 不支持 (需 Flash 或特殊插件)            | Chrome, Firefox, Edge 原生支持            |
| **主要应用**   | 直播/点播分发，大部分 OTT 服务     | 直播/点播分发，部分 OTT 服务，Android 原生 | 老一代直播，推流                        | 实时音视频通信 (视频会议，语聊)           |
| **加密/DRM**   | AES-128, FairPlay Streaming        | Widevine, PlayReady, FairPlay, Marlin      | RTMP 的加密拓展                         | DTLS-SRTP 加密                              |

## 五、HLS 的演进与 fMP4

早期 HLS 仅支持 MPEG-2 TS 作为媒体片段格式。然而，MPEG-2 TS 格式在一些高级功能（如快速切换轨道、精准 seek）上不如 Fragmented MP4 (fMP4) 灵活。

**HLS fMP4 (CMAF)**：
为了更好地与 MPEG-DASH 兼容，并利用 fMP4 的优势，Apple 在后续的 HLS 规范中引入了对 fMP4 的支持。Common Media Application Format (CMAF) 是一个旨在统一 HLS 和 MPEG-DASH 媒体片段格式的标准，使得同一套 fMP4 片段可以用于两种协议，降低存储和处理成本。

使用 fMP4 的 HLS manifest 会使用 `#EXT-X-MAP` 和 `#EXT-X-MAP` 标签来指定初始化片段。

## 六、总结

HLS 协议以其基于 HTTP、自适应比特率、CDN 友好和广泛的设备支持等优势，成为了当今互联网流媒体传输的核心技术。它通过将视频内容切割成小片段并使用 M3U8 播放列表进行描述的方式，为用户提供了流畅、高质量且适应网络环境变化的观看体验。随着 fMP4 和 CMAF 的引入，HLS 正在不断演进，以满足更高效、更通用的流媒体传输需求。对于任何涉及视频内容分发的 Web 应用或服务，深入理解 HLS 协议都是至关重要的。