# Low Altitude Dashboard

基于 Vue 3 + Vite 的低空监控平台。

## 项目设置

```sh
# 安装依赖
npm install

# 安装测试工具依赖
npm install chalk
```

### 开发环境运行

```sh
# 启动前端开发服务器
npm run dev

# 启动 WebSocket 服务器
node server.js

# 启动测试工具（可选）
node test/test-sender.js    # 测试视频流发送
node test/test-receiver.js  # 测试消息监控
```

## WebSocket 测试工具

项目包含两个测试工具，用于测试消息和视频流功能。

### 测试发送端 (test-sender.js)

用于测试视频流发送功能。

### 测试接收端 (test-receiver.js)

用于监控和测试消息接收功能。

#### 输出示例

1. 聊天消息:
```
收到聊天消息:
内容: Hello World
时间: 12:34:56
发送者: user
```

2. 订单消息:
```
收到订单:
订单ID: ORD1743093153182
餐厅: 肯德基
取餐点: 逸林
用户: test_user
商品: burger
配送方式: indoor
接单时间: 2025-03-27T16:32:33.182Z
```

### 客户端类型
可以通过修改 `clientType` 来测试不同角色：
- `monitor`: 监控所有消息
- `restaurant`: 仅接收订单相关消息
- `viewer`: 接收聊天和视频流

## 功能模块

1. 实时视频流显示
2. 聊天系统
3. 订单处理系统
4. 数据可视化仪表盘
## 数据格式说明

### Dashboard数据格式
 见模拟程序src/utils/messageReceiver.js 
 
### 发送方式
 见模拟程序src/utils/wsClient.js 或者test-sender.js


## 注意事项

1. 确保所有服务都已启动：
   - 前端开发服务器
   - WebSocket 服务器
   - 测试工具（如需要）

