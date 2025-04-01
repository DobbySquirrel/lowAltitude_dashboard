import { ref } from 'vue';

const state = {
    chatMessages: ref([]),
    orders: ref([]),
    latestOrderStatus: ref(null),
    worldData: ref(null),
    serverStatus: ref({
        connected: false,
        remoteServerConnected: false
    })
};

class MessageReceiver {
    constructor() {
        console.log('[MessageReceiver] Initialized');
        this.handlers = {
            'chat-message': this.handleChatMessage,
            'order-status': this.handleOrderStatus,
            'order-confirmation': this.handleOrderConfirmation,
            'world-data': this.handleWorldData,
            'server-status': this.handleServerStatus
        };
    }

    handleMessage(event) {
        try {
            let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            console.log('[MessageReceiver] Received message type:', data.type);
            const handler = this.handlers[data.type];
            if (handler) {
                handler.call(this, data);
            }
        } catch (error) {
            console.error('[MessageReceiver] 处理消息错误:', error);
        }
    }

    handleWorldData(data) {
        console.log('[MessageReceiver] Handling world data:', {
            merchantCount: data.data.merchant_names?.length,
            cabinetCount: data.data.cabinets_ids?.length
        });
        state.worldData.value = data.data;
        console.log('[MessageReceiver] World data updated, new state:', {
            hasData: !!state.worldData.value,
            merchantNames: state.worldData.value?.merchant_names,
            cabinetIds: state.worldData.value?.cabinets_ids
        });
    }

    handleOrderStatus(data) {
        const order = {
            id: data.data.order_id,
            status: data.data.status,
            timestamp: Date.now(),
            droneId: data.data.selected_drone_id
        };

        state.orders.value.push(order);
        state.latestOrderStatus.value = order;
    }

    handleOrderConfirmation(data) {
        state.latestOrderStatus.value = {
            id: data.data.order_id,
            status: 'submitted',
            timestamp: Date.now(),
            droneId: data.data.selected_drone_id
        };
    }

    handleServerStatus(data) {
        state.serverStatus.value = {
            ...state.serverStatus.value,
            ...data.data
        };
    }
}

const receiver = new MessageReceiver();

export const messageReceiver = {
    chatMessages: state.chatMessages,
    orders: state.orders,
    latestOrderStatus: state.latestOrderStatus,
    worldData: state.worldData,
    serverStatus: state.serverStatus,

    handleMessage: (event) => receiver.handleMessage(event),

    getRestaurants() {
        return state.worldData.value?.merchant_names?.map((name, index) => ({
            name,
            id: state.worldData.value.merchant_ids[index]
        })) || [];
    },

    getPickupPoints() {
        return state.worldData.value?.cabinets_ids?.map(id => ({
            name: id,
            icon: 'el-icon-location'
        })) || [];
    }
}; 