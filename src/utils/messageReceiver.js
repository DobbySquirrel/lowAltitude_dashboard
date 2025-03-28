import { ref } from 'vue';

// 消息存储
const state = {
    // 聊天消息历史
    chatMessages: ref([]),
    // 订单历史
    orders: ref([]),
    // 最新订单状态
    latestOrderStatus: ref(null),
    // 在线用户列表
    onlineUsers: ref([])
};

// 消息接收处理器
class MessageReceiver {
    constructor() {
        this.handlers = {
            'chat-message': this.handleChatMessage,
            'order-status': this.handleOrderStatus,
            'order-confirmation': this.handleOrderConfirmation
        };
    }

    // 处理接收到的消息
    handleMessage(event) {
        try {
            let data;
            // 统一处理数据格式,不管是模拟还是真实数据
            if (typeof event.data === 'string') {
                data = JSON.parse(event.data);
            } else {
                data = event.data;
            }

            const handler = this.handlers[data.type];
            if (handler) {
                handler.call(this, data);
            } else {
                console.warn('未知的消息类型:', data.type);
            }
        } catch (error) {
            console.error('处理消息失败:', error);
        }
    }

    // 处理聊天消息
    handleChatMessage(data) {
        const message = {
            content: data.data.content,
            time: data.data.time,
            sender: data.data.sender,
            serverTime: data.data.serverTime,
            type: 'received'
        };

        state.chatMessages.value.push(message);
        
        // 保持消息历史在合理范围内
        if (state.chatMessages.value.length > 100) {
            state.chatMessages.value.shift();
        }
    }

    // 处理订单状态更新
    handleOrderStatus(data) {
        const order = {
            id: data.data.orderId,
            status: data.data.status,
            restaurant: data.data.restaurant,
            items: data.data.items,
            deliveryMethod: data.data.deliveryMethod,
            receivedTime: data.data.receivedTime,
            timestamp: data.timestamp
        };

        state.orders.value.push(order);
        state.latestOrderStatus.value = order;
    }

    // 处理订单确认
    handleOrderConfirmation(data) {
        const confirmation = {
            orderId: data.data.orderId,
            status: data.data.status,
            receivedTime: data.data.receivedTime
        };

        state.latestOrderStatus.value = confirmation;
        
        // 可以触发通知或其他UI反馈
        this.notifyOrderConfirmation(confirmation);
    }

    // 订单确认通知
    notifyOrderConfirmation(confirmation) {
        // 这里可以集成Element Plus的通知组件
        console.log('订单已确认:', confirmation);
    }

    // 清理历史数据
    clearHistory() {
        state.chatMessages.value = [];
        state.orders.value = [];
        state.latestOrderStatus.value = null;
    }
}

// 创建单例实例
const receiver = new MessageReceiver();

// 导出接口
export const messageReceiver = {
    // 状态
    chatMessages: state.chatMessages,
    orders: state.orders,
    latestOrderStatus: state.latestOrderStatus,
    onlineUsers: state.onlineUsers,

    // 方法
    handleMessage: (event) => receiver.handleMessage(event),
    clearHistory: () => receiver.clearHistory()
}; 