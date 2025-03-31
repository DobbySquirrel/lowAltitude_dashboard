import { ref } from 'vue';
import { useDataStore } from '../store';
// 消息存储
const state = {
    // 保留原有的状态
    chatMessages: ref([]),
    orders: ref([]),
    latestOrderStatus: ref(null),
    onlineUsers: ref([]),
    // 添加仪表盘数据状态
    dashboardData: ref(null)
};

class MessageReceiver {
    constructor() {
        this.handlers = {
            'chat-message': this.handleChatMessage,
            'order-status': this.handleOrderStatus,
            'order-confirmation': this.handleOrderConfirmation,
            // 添加 dashboard-data 处理器
            'dashboard-data': this.handleDashboardData
        };
    }

    // 添加仪表盘数据处理方法
    handleDashboardData(data) {
        // 更新本地状态
        state.dashboardData.value = data.payload;
        
        // 使用 pinia store 更新数据
        const store = useDataStore();
        store.updateDashboardData(data.payload);
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
        state.dashboardData.value = null;
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
    dashboardData: state.dashboardData,

    // 方法
    handleMessage: (event) => receiver.handleMessage(event),
    clearHistory: () => receiver.clearHistory()
}; 