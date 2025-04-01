import { WebSocketServer, WebSocket } from 'ws';
import { io } from 'socket.io-client';
import http from 'http';
import fs from 'fs';
import path from 'path';

const server = http.createServer((req, res) => {
    // 添加 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 其他请求返回 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('未找到');
});

const wss = new WebSocketServer({ server });

// 用于存储所有连接的客户端及其类型
const clients = new Map(); // 存储格式: ws => { id, type }

// 添加重连状态标志
let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

// 添加轮询间隔配置
const WORLD_CHECK_INTERVAL = 5000; // 5秒
const worldCheckTimers = new Map(); // 存储每个客户端的轮询定时器

// 修改 Socket.IO 客户端配置
const socketOptions = {
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 3000, // 增加重连延迟
    timeout: 10000, // 增加超时时间
    transports: ['polling', 'websocket'],
    forceNew: true,
    autoConnect: true,
    withCredentials: false,
    path: '/socket.io/'
};

// 连接到远程 Socket.IO 服务器
const remoteSocket = io('http://10.4.152.244:5001', socketOptions);

// 添加重连函数
function connectToRemoteServer() {
    if (isReconnecting) return;
    
    isReconnecting = true;
    console.log(`尝试连接远程服务器 (第 ${reconnectAttempts + 1} 次)`);
    
    if (!remoteSocket.connected) {
        remoteSocket.connect();
    }
}

// 修改错误处理
remoteSocket.on('connect_error', (error) => {
    console.log('远程服务器连接错误:', error.message);
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
            isReconnecting = false;
            connectToRemoteServer();
        }, socketOptions.reconnectionDelay);
    } else {
        console.log('达到最大重试次数，停止重连');
        // 通知所有客户端远程服务器不可用
        broadcastServerStatus(false);
    }
});

// 添加广播服务器状态的函数
function broadcastServerStatus(isConnected) {
    for (const [client, info] of clients) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify({
                    type: 'server-status',
                    data: {
                        remoteServerConnected: isConnected,
                        timestamp: Date.now()
                    }
                }));
            } catch (error) {
                console.error(`发送服务器状态失败 (客户端 ${info.id}):`, error);
            }
        }
    }
}

// 修改连接成功处理
remoteSocket.on('connect', () => {
    console.log('已连接到远程服务器');
    isReconnecting = false;
    reconnectAttempts = 0;
    broadcastServerStatus(true);
    
    // 发送初始化消息
    remoteSocket.emit('init_client', JSON.stringify({"client_type": "web"}));
    remoteSocket.emit('init_world', JSON.stringify({"client_type": "web", "action": "synchronize"}));
});

// 修改 init_world 事件处理
remoteSocket.on('init_world', (data) => {
    console.log('\n=== [Server] 收到世界初始化数据 ===');
    console.log('原始数据:', JSON.stringify(data, null, 2));
    
    if (data.message === 'No initialized simulation world' && data.action === 'wait') {
        console.log('模拟世界尚未初始化，等待同步指令...');
        
        // 通知相关客户端等待状态
        for (const [client, info] of clients) {
            if (client.readyState === WebSocket.OPEN && info.type === 'viewer') {
                try {
                    client.send(JSON.stringify({
                        type: 'world-status',
                        data: {
                            status: 'waiting',
                            message: '等待模拟世界初始化...'
                        }
                    }));
                } catch (error) {
                    console.error(`发送世界状态失败 (客户端 ${info.id}):`, error);
                }
            }
        }
        return;
    }

    console.log('当前连接的客户端数量:', clients.size);
    
    // 转发给所有 viewer 类型的客户端
    for (const [client, info] of clients) {
        console.log(`检查客户端 ${info.id}, 类型: ${info.type}`);
        if (client.readyState === WebSocket.OPEN && info.type === 'viewer') {
            try {
                const worldData = {
                    type: 'world-data',
                    data: {
                        merchant_names: data.merchant_names,
                        merchant_ids: data.merchant_ids,
                        cabinets_ids: data.cabinets_ids,
                        merchant_coordinates: data.merchant_coordinates,
                        cabinets_coordinates: data.cabinets_coordinates,
                        drone_ids: data.drone_ids
                    }
                };
                console.log(`准备发送世界数据到客户端 ${info.id}:`, JSON.stringify(worldData, null, 2));
                client.send(JSON.stringify(worldData));
                console.log(`成功转发世界数据到客户端 ${info.id}`);
            } catch (error) {
                console.error(`转发世界数据失败 (客户端 ${info.id}):`, error);
            }
        } else {
            console.log(`跳过客户端 ${info.id}: readyState=${client.readyState}, type=${info.type}`);
        }
    }
    console.log('=== [Server] 世界数据处理完成 ===\n');
});

remoteSocket.on('order_message', (data) => {
    console.log('收到订单消息');
    // 转发给相关客户端
    for (const [client, info] of clients) {
        if (client.readyState === WebSocket.OPEN && 
            ['viewer', 'monitor'].includes(info.type)) {
            try {
                client.send(JSON.stringify({
                    type: 'remote-order',
                    data: data
                }));
            } catch (error) {
                console.error(`转发订单消息失败 (客户端 ${info.id}):`, error);
            }
        }
    }
});

// 消息处理函数
function handleChatMessage(ws, data) {
    const senderInfo = clients.get(ws);
    // console.log(`收到来自 ${senderInfo.id} 的聊天消息:`, data.data.content);
    
    // 广播给其他客户端
    for (const [client, info] of clients) {
        if (client !== ws && 
            client.readyState === WebSocket.OPEN && 
            ['viewer', 'monitor'].includes(info.type)) {
            try {
                const response = {
                    type: 'chat-message',
                    timestamp: Date.now(),
                    data: {
                        ...data.data,
                        processed: true,
                        serverTime: new Date().toISOString()
                    }
                };
                client.send(JSON.stringify(response));
            } catch (error) {
                console.error(`发送聊天消息失败 (客户端 ${info.id}):`, error);
            }
        }
    }
}

wss.on('connection', (ws) => {
    const clientId = `client_${Date.now()}`;
    clients.set(ws, { id: clientId, type: 'unknown' });
    console.log(`新客户端连接 (ID: ${clientId})`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`收到客户端 ${clientId} 消息:`, data);

            if (data.type === 'client-ready') {
                // 更新客户端类型
                const clientInfo = clients.get(ws);
                clientInfo.type = data.clientType;
                console.log(`客户端 ${clientId} 类型设置为: ${data.clientType}`);

                // 如果是 viewer 类型，主动请求并发送世界数据
                if (data.clientType === 'viewer') {
                    console.log(`向远程服务器请求世界数据 (客户端 ${clientId})`);
                    remoteSocket.emit('init_world', JSON.stringify({
                        "client_type": "web",
                        "action": "synchronize"
                    }));
                }
            }

            if (data.type === 'order-submit') {
                console.log('=== 收到订单提交请求 ===');
                const orderId = Date.now() % 1000000;
                
                const orderForRemote = {
                    ...data.data,  // 保持原始数据结构
                    order_id: orderId,
                    consumer_order_timestamp: Date.now()
                };
                
                console.log('准备发送订单到远程服务器:', JSON.stringify(orderForRemote, null, 2));
                const confirmationMessage = orderForRemote;
                
                remoteSocket.emit('set_order', confirmationMessage);
                console.log('订单已发送到远程服务器');
            }
        } catch (error) {
            console.error('处理消息错误:', error);
        }
    });

    ws.on('close', () => {
        const info = clients.get(ws);
        console.log(`客户端断开连接 (ID: ${info.id}, 类型: ${info.type})`);
        
        // 清除该客户端的世界检查定时器
        if (worldCheckTimers.has(info.id)) {
            clearInterval(worldCheckTimers.get(info.id));
            worldCheckTimers.delete(info.id);
        }
        
        clients.delete(ws);
        console.log(`剩余连接数: ${clients.size}`);
    });

    ws.on('error', (error) => {
        const info = clients.get(ws);
        console.error(`客户端 ${info.id} 发生错误:`, error);
        clients.delete(ws);
    });
});

// 错误处理
remoteSocket.on('connect_error', (error) => {
    console.log('远程服务器连接错误:', error);
});

remoteSocket.on('error', (error) => {
    console.log('远程服务器错误:', error);
});

remoteSocket.on('disconnect', (reason) => {
    console.log('与远程服务器断开连接:', reason);
});

// 处理远程服务器的订单状态更新
remoteSocket.on('order_status', (data) => {
    console.log('=== 收到订单状态更新 ===');
    console.log('状态数据:', data);
    
    // 转发给所有相关客户端
    for (const [client, info] of clients) {
        if (client.readyState === WebSocket.OPEN && 
            ['viewer', 'monitor'].includes(info.type)) {
            try {
                client.send(JSON.stringify({
                    type: 'order-status',
                    data: {
                        orderId: data.order_id,
                        status: data.status,
                        timestamp: Date.now()
                    }
                }));
            } catch (error) {
                console.error(`转发订单状态失败 (客户端 ${info.id}):`, error);
            }
        }
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('等待WebSocket连接...');
}); 