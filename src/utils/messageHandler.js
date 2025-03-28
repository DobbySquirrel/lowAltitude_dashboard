import { ref } from 'vue';

// 消息类型枚举
export const MessageType = {
    CHAT: 'chat-message',
    ORDER: 'order-submit',
};

// 消息处理器
class MessageHandler {
    constructor() {
        this.wsClient = null;
        this.maxRetries = 3;
    }

    // 设置 WebSocket 客户端
    setWSClient(client) {
        this.wsClient = client;
    }

    async send(data, retryCount = 0) {
        if (!this.wsClient && retryCount < this.maxRetries) {
            console.log('等待 WebSocket 连接...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.send(data, retryCount + 1);
        }

        if (!this.wsClient) {
            console.error('WebSocket client not initialized after retries');
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
            type: MessageType.ORDER,
            timestamp: Date.now(),
            data: {
                restaurant: orderData.selectedRestaurant,
                pickup: orderData.selectedPickup,
                username: orderData.username,
                items: orderData.selectedItems,
                deliveryMethod: orderData.deliveryMethod
            }
        };
        this.send(JSON.stringify(order));
    }
}

// 创建单例实例
export const messageHandler = new MessageHandler(); 