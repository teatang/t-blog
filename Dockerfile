# 使用官方Node镜像作为构建环境
FROM node:22-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 使用Nginx作为生产服务器
FROM nginx:alpine

# 从构建阶段复制构建产物
COPY --from=builder /app/public /usr/share/nginx/html/public

# 暴露80端口
EXPOSE 2406

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
