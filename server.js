import { WebSocketServer, WebSocket } from 'ws';
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

// 消息处理函数
function handleChatMessage(ws, data) {
    const senderInfo = clients.get(ws);
    console.log(`收到来自 ${senderInfo.id} 的聊天消息:`, data.data.content);
    
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

function handleOrderSubmit(ws, data) {
    const senderInfo = clients.get(ws);
    console.log(`收到来自 ${senderInfo.id} 的订单:`, data.data);
    
    // 处理订单并广播给相关客户端
    const orderResponse = {
        type: 'order-status',
        timestamp: Date.now(),
        data: {
            orderId: `ORD${Date.now()}`,
            status: 'received',
            ...data.data,
            receivedTime: new Date().toISOString()
        }
    };

    // 发送确认给下单客户端
    try {
        ws.send(JSON.stringify({
            type: 'order-confirmation',
            timestamp: Date.now(),
            data: orderResponse.data
        }));
    } catch (error) {
        console.error(`发送订单确认失败 (客户端 ${senderInfo.id}):`, error);
    }

    // 广播给监控客户端和餐厅客户端
    for (const [client, info] of clients) {
        if (client !== ws && 
            client.readyState === WebSocket.OPEN && 
            ['restaurant', 'monitor'].includes(info.type)) {
            try {
                client.send(JSON.stringify(orderResponse));
            } catch (error) {
                console.error(`发送订单通知失败 (客户端 ${info.id}):`, error);
            }
        }
    }
}

wss.on('connection', (ws) => {
    const clientId = Date.now();
    const clientInfo = {
        id: clientId,
        type: 'unknown'
    };
    
    clients.set(ws, clientInfo);
    console.log(`新客户端连接 (ID: ${clientId})`);
    console.log(`当前总连接数: ${clients.size}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'chat-message':
                    handleChatMessage(ws, data);
                    break;
                case 'order-submit':
                    handleOrderSubmit(ws, data);
                    break;
                case 'client-ready':
                    const info = clients.get(ws);
                    info.type = data.clientType;
                    console.log(`客户端 ${clientId} 类型设置为: ${data.clientType}`);
                    break;
                case 'dashboard-data':
                    // 广播给所有viewer类型的客户端
                    for (const [client, info] of clients) {
                        if (client !== ws && 
                            client.readyState === WebSocket.OPEN && 
                            info.type === 'viewer') {
                            try {
                                client.send(JSON.stringify(data));
                            } catch (error) {
                                console.error(`发送到客户端 ${info.id} 失败:`, error);
                            }
                        }
                    }
                    break;
                case 'video-frame':
                    const senderInfo = clients.get(ws);
                    if (senderInfo.type === 'sender') {
                        let broadcastCount = 0;
                        for (const [client, info] of clients) {
                            if (client !== ws && 
                                client.readyState === WebSocket.OPEN && 
                                info.type === 'viewer') {
                                try {
                                    client.send(JSON.stringify(data));
                                    broadcastCount++;
                                } catch (error) {
                                    console.error(`发送视频帧失败 (客户端 ${info.id}):`, error);
                                }
                            }
                        }
                    }
                    break;
                default:
                    console.error(`未知的消息类型: ${data.type}`);
            }
        } catch (error) {
            console.error('处理消息错误:', error);
        }
    });

    ws.on('close', () => {
        const info = clients.get(ws);
        console.log(`客户端断开连接 (ID: ${info.id}, 类型: ${info.type})`);
        clients.delete(ws);
        console.log(`剩余连接数: ${clients.size}`);
    });

    ws.on('error', (error) => {
        const info = clients.get(ws);
        console.error(`客户端 ${info.id} 发生错误:`, error);
        clients.delete(ws);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('等待WebSocket连接...');
}); 