---
title: 在NAS上部署Jellyfin媒体服务器
date: 2024-10-21 06:024:00
tags:
  - 2024
  - NAS
  - Jellyfin
  - Docker
categories:
  - NAS
  - 影音娱乐
---

> Jellyfin 是一个免费、开源的媒体系统，可以帮助你管理、播放和流式传输你的电影、电视节目、音乐、照片等媒体内容。它是一个强大的替代品，适用于那些希望完全控制自己数据的用户，与 Emby 和 Plex 类似，但完全免费且无任何订阅限制。将 Jellyfin 部署在 NAS 上，可以充分利用 NAS 的存储能力、稳定性和网络共享特性，打造专属的家庭影音中心。

{% note info %}
“拥有自己的媒体服务器，意味着你的影音世界，你做主。”
{% endnote %}

## 一、为什么选择 Jellyfin 和 NAS？

### 为什么是 Jellyfin？

*   **完全免费且开源**：无需任何订阅费用，社区活跃，持续更新。
*   **私有化部署**：所有数据（元数据、观看记录）都存储在你的服务器上，完全掌控。
*   **跨平台客户端**：支持 Web 浏览器、Android、iOS、Apple TV、Roku、Fire TV、Kodi 插件等多种设备。
*   **硬件加速**：支持多种硬件解码/编码，提供流畅的转码体验（如果你的 NAS 支持）。
*   **强大的媒体管理**：自动抓取电影、电视节目的元数据、海报、预告片，整理媒体库。

### 为什么部署在 NAS 上？

*   **集中存储**：NAS 天然就是存储海量媒体文件的最佳场所。
*   **24/7 运行**：NAS 通常设计为低功耗、长时间运行，非常适合作为媒体服务器。
*   **网络共享**：方便家庭内网甚至外网访问。
*   **数据安全**：NAS 通常支持 RAID，提供一定的数据冗余和保护。
*   **Docker 支持**：主流 NAS 都支持 Docker，使得 Jellyfin 的部署和管理变得轻而易举。

## 二、部署前的准备

本教程主要以 **Docker 部署**为例，因为这是最通用、最灵活、最推荐的方式。

### 1. NAS 要求

*   **支持 Docker**：确保你的 NAS 型号和操作系统版本支持 Docker。群晖 (Synology) 和威联通 (QNology) 的大部分型号都支持。
*   **足够的存储空间**：存储你的媒体文件。
*   **足够的内存**：建议 4GB 及以上，如果需要进行转码，内存和 CPU 都更重要。
*   **CPU 性能（可选，但推荐）**：如果需要进行实时转码，CPU 性能（尤其是集成核显 Quick Sync 或支持其他转码技术的 CPU）至关重要。

### 2. 软件准备

*   **Docker**：确保你的 NAS 上已安装 Docker。
*   **SSH 客户端**：如 PuTTY (Windows) 或终端 (macOS/Linux)，用于连接 NAS 进行命令行操作。
*   **文件管理器**：用于在 NAS 上创建媒体文件夹。

### 3. 理解 Docker 部署的好处

*   **环境隔离**：Jellyfin 运行在独立的容器中，不会污染 NAS 系统环境。
*   **易于部署和管理**：使用 Docker Compose 可以一行命令启动整个服务。
*   **版本控制**：方便升级和回滚 Jellyfin 版本。
*   **可移植性**：配置一旦完成，可以轻松迁移到其他支持 Docker 的平台。

## 三、部署步骤（以 Docker Compose 为例）

### 1. 登录 NAS，启用 SSH

大多数 NAS 厂商会提供一个控制面板。请查找并启用 SSH 功能。
*   **群晖 (Synology)**: `控制面板` -> `终端机和 SNMP` -> `启用 SSH 功能`
*   **威联通 (QNOLOGY)**: `控制台` -> `网络和文件服务` -> `Telnet/SSH` -> `允许 SSH 连接`

记下 NAS 的 IP 地址和 SSH 端口（通常是 22）。

### 2. 创建目录结构

通过 NAS 的文件管理器或 SSH 命令，创建用于 Jellyfin 存储配置和媒体文件的目录。

**推荐目录结构：**

```
/volume1/docker/jellyfin/       # Jellyfin 配置目录
/volume1/data/media/            # 媒体文件总目录
/volume1/data/media/movies/     # 电影
/volume1/data/media/tvshows/    # 电视节目
/volume1/data/media/music/      # 音乐
/volume1/data/media/photos/     # 照片
```

**SSH 命令示例：**

```bash
# 登录 NAS
ssh your_nas_username@your_nas_ip

# 创建 Docker 配置目录
sudo mkdir -p /volume1/docker/jellyfin/config
sudo mkdir -p /volume1/docker/jellyfin/cache

# 创建媒体文件目录
sudo mkdir -p /volume1/data/media/movies
sudo mkdir -p /volume1/data/media/tvshows
sudo mkdir -p /volume1/data/media/music
sudo mkdir -p /volume1/data/media/photos

# 授予 Jellyfin 访问这些媒体目录的权限（重要！）
# Jellyfin 容器通常以 UID 1000, GID 100 运行。
# 确保 jellyfin 用户或用户组有读写这些目录的权限。
# 最简单粗暴的方式是给 777 权限，但生产环境不推荐。
# 更好的方式是改变这些目录的所有者或组，使其匹配 Jellyfin 容器内的用户/组。
# 例如，如果你的 NAS 上有一个 'docker' 用户组，可以将媒体目录的组改为 'docker'
# 并且确保 jellyfin 容器内的 UID/GID 有权限，或者容器启动时指定 UID/GID。
# 这里我们先用最简单的方式测试，后续可以优化权限。
sudo chmod -R 777 /volume1/data/media
```

### 3. 创建 Docker Compose 文件

在 `/volume1/docker/jellyfin/` 目录下创建一个名为 `docker-compose.yml` 的文件。

```bash
cd /volume1/docker/jellyfin/
sudo nano docker-compose.yml
```

将以下内容粘贴到 `docker-compose.yml` 文件中：

```yaml
version: "3.8"

services:
  jellyfin:
    image: nyanmisaka/jellyfin:latest # 官方镜像为：jellyfin/jellyfin:latest 国内建议使用：nyanmisaka/jellyfin:latest
    container_name: jellyfin
    network_mode: bridge              # 如果使用 host 网络模式，方便端口映射和硬件加速，无需手动映射端口
    ports:
      - 8096:8096  # Web UI 端口
      # - 8920:8920  # HTTPS 端口 (可选)
      # - 1900:1900/udp # DLNA 发现端口
      # - 7359:7359/udp # Android TV 发现端口

    volumes: # 根据自己的NAS目录调整
      - /volume1/docker/jellyfin/config:/config # 配置文件目录
      - /volume1/docker/jellyfin/cache:/cache   # 缓存文件目录
      # 映射你的媒体文件路径
      - /volume1/data/media/movies:/media/movies:ro   # 只读挂载电影
      - /volume1/data/media/tvshows:/media/tvshows:ro # 只读挂载电视剧
      - /volume1/data/media/music:/media/music:ro     # 只读挂载音乐
      - /volume1/data/media/photos:/media/photos:ro   # 只读挂载照片
      # 如有需要，可以添加更多媒体文件夹

      # **硬件加速配置 (根据你的 NAS 硬件选择)**
      # 1. Intel 核显 Quick Sync (群晖大部分 Intel CPU NAS 适用)
      #    确保你的NAS系统已安装i915驱动
      #    - /dev/dri:/dev/dri

      # 2. NVIDIA GPU (如果有支持的独立显卡)
      #    确保已安装NVIDIA Docker runtime
      #    runtime: nvidia
      #    environment:
      #      - NVIDIA_VISIBLE_DEVICES=all
      #      - NVIDIA_DRIVER_CAPABILITIES=all

    environment:
      - PUID=1000 # 容器内用户ID，通常是 default user，可能需要根据自己NAS的用户ID调整
      - PGID=100 # 容器内用户组ID，通常是 users group，可能需要根据自己NAS的用户组ID调整
      - TZ=Asia/Shanghai # 设置时区
      # - JELLYFIN_FFMPEG=/usr/lib/jellyfin-ffmpeg/ffmpeg # 指定FFmpeg路径（高级用户，通常不需要）
  
    restart: unless-stopped # 容器崩溃或NAS重启后自动重启
  
    # 推荐设定资源限制，防止 Jellyfin 占用过多资源
    # deploy:
    #   resources:
    #     limits:
    #       cpus: '2.0' # 限制为2个CPU核心
    #       memory: 4G  # 限制为4GB内存
```

**关于 `PUID` 和 `PGID`：**
这两个环境变量是为了让 Jellyfin 容器里的进程拥有正确的用户ID和用户组ID，从而能够访问 NAS 文件系统上的媒体文件。
*   你可以通过 SSH 登录 NAS 后，运行 `id your_nas_username` 命令来查看你当前用户的 `uid` (`PUID`) 和 `gid` (`PGID`)。
*   通常，`uid=1000` (`admin` 或第一个创建的用户) 和 `gid=100` (`users` 组) 是比较常见的默认值。
*   如果 Jellyfin 无法访问媒体文件，这通常是权限问题，检查 `PUID` 和 `PGID` 是第一步。

**关于硬件加速：**
*   **Intel 核显 (`/dev/dri`)**: 对于群晖等大部分内置 Intel CPU 带核显的 NAS，挂载 `/dev/dri` 即可利用 Quick Sync 进行转码。你需要确保 NAS 系统已正确安装驱动。
*   **NVIDIA GPU**: 如果你的 NAS 有独立 NVIDIA 显卡（较少见），你需要安装 NVIDIA Docker Runtime，并配置 `runtime` 和 `environment`。
*   **其他**：检查 Jellyfin 官方文档和你的 NAS 硬件手册，了解具体支持的硬件加速方式。如果不需要转码或者 NAS 性能足够，可以不配置。

按 `Ctrl + X`，然后按 `Y` 确认保存，再按 `Enter` 退出 `nano` 编辑器。

### 4. 启动 Jellyfin 容器

在 `docker-compose.yml` 文件所在的目录下，执行以下命令来启动 Jellyfin：

```bash
sudo docker compose up -d
```

*   `docker compose up`：根据 `docker-compose.yml` 文件创建并启动服务。（旧版本 Docker 可能需要用 `docker-compose` 命令）
*   `-d`：表示在后台运行容器。

如果一切顺利，Jellyfin 容器应该已经启动并运行。

### 5. 检查容器状态

```bash
sudo docker ps -a | grep jellyfin
```

你应该看到 `jellyfin` 容器的状态是 `Up ...`。

### 6. 访问 Jellyfin Web UI 进行初始化

打开你的浏览器，访问 `http://你的NAS_IP:8096`。

你将看到 Jellyfin 的安装向导：

1.  **Welcome**: 选择语言。
2.  **Create your first user**: 创建管理员账户。这是 Jellyfin 内部的账户，与 NAS 账户无关。
3.  **Add Media Library**: 添加你的媒体库。
    *   点击 `+ 添加媒体库`。
    *   选择 `内容类型` (例如：电影、电视节目、音乐)。
    *   为媒体库起一个名称 (例如：我的电影)。
    *   选择 `文件夹`，然后点击 `+`。你会看到你在 `docker-compose.yml` 中映射的 `/media/movies`、`/media/tvshows` 等目录。选择对应的目录。
    *   其他选项可以根据需要自行配置（如 `下载元数据`、`抓取图片` 等），通常默认即可。
    *   重复此步骤添加所有媒体库。
4.  **Preferred Metadata Language**: 选择媒体元数据语言。
5.  **Configure Remote Access**: 如果你想从外网访问，这里可以选择允许远程访问。**请确保你了解网络安全风险，并配置好路由器端口转发和防火墙。**
6.  **Done!**: 完成设置。

现在，Jellyfin 会开始扫描你的媒体文件，自动匹配元数据、海报等。你可以在 `仪表盘` -> `任务` 中查看扫描进度。

## 四、高级配置与优化

### 1. 硬件解码/编码（Hardware Transcoding）

这是提升观看体验的关键，特别是当你需要在低带宽或不支持 Jellyfin 直播的设备上观看高码率视频时。

*   **确认 NAS 支持**：检查你的 NAS CPU 是否支持 Intel Quick Sync Video (QSV)、AMD VCE/VCN 或 NVIDIA NVENC/NVDEC。
*   **Docker 配置**：在 `docker-compose.yml` 中正确挂载硬件设备（参考前面 `volumes` 部分的 `/dev/dri` 或 NVIDIA 配置）。
*   **Jellyfin 设置**：
    1.  登录 Jellyfin Web UI。
    2.  点击右上角 `管理员仪表盘` (齿轮图标)。
    3.  选择 `播放` -> `转码`。
    4.  启用 `启用硬件加速`。
    5.  选择正确的 `硬件加速设备` (例如：`VAAPI` for Intel QSV, `NVENC` for NVIDIA)。
    6.  保存设置，并尝试播放一个高码率视频，在 `仪表盘` 的 `活动` 中，你会看到转码信息，确认是否使用了硬件加速。

### 2. 端口转发与外网访问

如果你想从家庭网络外部访问 Jellyfin，你需要：

1.  **NAS 上固定 IP**：为你的 NAS 设置一个静态 IP 地址。
2.  **路由器端口转发 (Port Forwarding)**：在你的路由器设置中，将外部端口（例如 8096 或自定义的）转发到 NAS 的内部 IP 地址和 Jellyfin 的 8096 端口。
3.  **域名和 SSL (可选，但非常推荐)**：
    *   注册一个域名。
    *   使用 DDNS (动态 DNS) 服务，将你的域名解析到你家庭网络的公网 IP。
    *   通过 Nginx Proxy Manager 或 Caddy 等工具设置反向代理，并配置 SSL 证书（如 Let's Encrypt），实现 HTTPS 安全访问。
    *   这会增加复杂度，但能大大提高安全性。

### 3. 用户管理

在 `管理员仪表盘` -> `用户` 中，你可以创建新的用户，为他们分配查看不同媒体库的权限，以及设置是否允许转码等。

### 4. 优化媒体文件命名

Jellyfin 的元数据抓取严重依赖媒体文件的命名规范。遵循 Jellyfin 官方推荐的命名规范可以大大提高元数据匹配的准确性。

*   **电影**：`电影名称 (年份)/电影名称 (年份).ext` (例如: `Inception (2010)/Inception (2010).mkv`)
*   **电视节目**：`节目名称/Season XX/节目名称 - SXXEXX - 剧集标题.ext` (例如: `Game of Thrones/Season 01/Game of Thrones - S01E01 - Winter Is Coming.mkv`)

### 5. 容器升级

当 Jellyfin 有新版本发布时，升级非常简单：

```bash
cd /volume1/docker/jellyfin/ # 进入 docker-compose.yml 所在目录
sudo docker compose pull     # 拉取最新镜像
sudo docker compose up -d    # 用新镜像重建并启动容器
```

## 五、常见问题排查

*   **Jellyfin 无法启动或连接**：
    *   检查 Docker 容器是否正在运行 (`sudo docker ps -a | grep jellyfin`)。
    *   检查端口 8096 是否被占用 (`sudo netstat -tuln | grep 8096`)。
    *   检查 `docker-compose.yml` 文件是否有语法错误。
*   **Jellyfin 无法访问媒体文件**：
    *   **最常见的问题是权限不足。** 检查 `PUID` 和 `PGID` 是否正确对应 NAS 上的用户/组 ID。
    *   检查 NAS 媒体文件夹的权限，确保 `jellyfin` 容器的用户有读（和部分写，如元数据）权限。可以尝试 `sudo chmod -R 777 /volume1/data/media` (临时测试用，不推荐长期使用)。
    *   检查 `volumes` 映射路径是否正确。
*   **媒体文件元数据抓取失败或不准确**：
    *   检查媒体文件命名是否规范。
    *   在 Jellyfin 媒体库设置中，尝试 `刷新元数据`。
    *   检查网络连接，确保 Jellyfin 可以访问外网获取元数据。

## 六、总结

通过 Docker 在 NAS 上部署 Jellyfin 是一个强大且灵活的私有媒体中心解决方案。它让你能够完全掌控自己的媒体库，并在家庭网络中的各种设备上自由播放。虽然涉及到一些命令行操作和网络配置，但一旦设置完成，你将拥有一个稳定、高效、免费的影音娱乐平台。

希望本教程能够帮助你成功搭建属于自己的 Jellyfin 媒体服务器！尽情享受你的数字内容吧！