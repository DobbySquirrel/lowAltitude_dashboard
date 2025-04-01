import { ref } from 'vue';

// 消息类型枚举
export const MessageType = {
    CHAT: 'chat-message',
    ORDER: 'order-submit',
    CLIENT_READY: 'client-ready',  // 添加客户端就绪消息类型
};

// 消息处理器
class MessageHandler {
    constructor() {
        this.wsClient = null;  // 初始化时不直接引用 wsClient
        this.maxRetries = 3;
        this.initialized = false;
    }

    // 设置 WebSocket 客户端
    setWebSocketClient(client) {
        this.wsClient = client;
    }

    // 初始化连接
    async initialize(wsClient) {
        if (this.initialized) return;
        
        try {
            this.setWebSocketClient(wsClient);
            await this.wsClient.connect();
            // 发送客户端就绪消息
            this.sendClientReady();
            this.initialized = true;
            console.log('MessageHandler initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MessageHandler:', error);
        }
    }

    // 发送客户端就绪消息
    sendClientReady() {
        const readyMessage = {
            type: MessageType.CLIENT_READY,
            clientType: 'viewer'
        };
        this.send(JSON.stringify(readyMessage));
    }

    async send(data, retryCount = 0) {
        if (!this.wsClient || !this.wsClient.isConnected() && retryCount < this.maxRetries) {
            console.log('等待 WebSocket 连接...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.send(data, retryCount + 1);
        }

        if (!this.wsClient || !this.wsClient.isConnected()) {
            console.error('WebSocket client not connected after retries');
            return;
        }

        this.wsClient.send(data);
    }

    // 发送聊天消息
    sendChatMessage(message) {
        const chatData = {
            type: MessageType.CHAT,
            timestamp: Date.now(),
            data: {
                content: message,
                time: new Date().toLocaleTimeString(),
                sender: 'user'
            }
        };
        this.send(JSON.stringify(chatData));
    }

    // 发送订单信息
    sendOrder(orderData) {
        const order = {
            type: 'order-submit',
            timestamp: Date.now(),
            data: {
                ...orderData  // 直接传递原始订单数据,不做转换
            }
        };
        this.send(JSON.stringify(order));
    }
}

// 创建单例实例
export const messageHandler = new MessageHandler();

// 导出初始化函数
export const initializeMessageHandler = (wsClient) => messageHandler.initialize(wsClient); 