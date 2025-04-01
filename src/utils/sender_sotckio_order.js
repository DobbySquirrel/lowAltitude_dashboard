import { io } from 'socket.io-client';

// Socket配置选项
const socketOptions = {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
    autoConnect: true
};

// 创建socket实例
const socket = io('http://10.4.152.244:5001', socketOptions);

// 事件监听器集中管理
const setupEventListeners = () => {
    // 基础连接事件
    socket.on('connect', () => {
        console.log('=== 连接事件 ===');
        console.log('已成功连接到服务器');
        console.log('Socket ID:', socket.id);
        
        try {
            // 发送 init_client 消息
            const clientData = '{"client_type": "web"}';
            socket.emit('init_client', clientData);

            // 发送 init_world 消息
            const worldData = '{"client_type": "web", "action": "synchronize"}';
            socket.emit('init_world', worldData);
        } catch (error) {
            console.error('发送初始化消息失败:', error);
        }
    });

    // 监听init响应
    socket.on('init', (data) => {
        console.log('=== 初始化响应 ===');
        console.log('服务器初始化响应:', data);
    });

    // 错误处理
    socket.on('connect_error', (error) => {
        console.log('=== 连接错误 ===');
        console.log('连接错误详情:', error);
        console.log('正在尝试重新连接...');
        
        if (window.$message) {
            window.$message.error('服务器连接失败，正在尝试重新连接...');
        }
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('=== 重新连接成功 ===');
        console.log('重试次数:', attemptNumber);
        
        if (window.$message) {
            window.$message.success('重新连接成功！');
        }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('=== 尝试重新连接 ===');
        console.log('当前尝试次数:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
        console.log('=== 重连错误 ===');
        console.log('重连错误详情:', error);
    });

    socket.on('reconnect_failed', () => {
        console.log('=== 重连失败 ===');
        console.log('已达到最大重试次数');
        
        if (window.$message) {
            window.$message.error('无法连接到服务器，请检查网络后刷新页面');
        }
    });

    socket.on('error', (error) => {
        console.log('=== 错误消息 ===');
        console.log('收到错误消息:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('=== 断开连接 ===');
        console.log('断开连接:', reason);
    });

    // 测试消息响应
    socket.on('message', (data) => {
        console.log('=== 收到消息 ===');
        console.log('收到服务器消息:', data);
    });

    // 监听 pong 响应
    socket.on('pong', (data) => {
        console.log('=== 收到 pong ===');
        console.log('Pong 数据:', data);
    });

    // 处理返回的 init_world 响应
    socket.on('init_world', (data) => {
        console.log('=== 初始化世界响应 ===');
        if (!data) {
            console.log('接收到无效数据');
            return;
        }

        if (data.merchant_names) {
            const worldData = {
                merchants: data.merchant_names.map((name, index) => ({
                    name: name,
                    id: data.merchant_ids[index],
                    coordinates: data.merchant_coordinates[index]
                })),
                cabinets: data.cabinets_ids.map((id, index) => ({
                    id: id,
                    coordinates: data.cabinets_coordinates[index]
                })),
                drones: data.drone_ids
            };
            console.log('世界数据已更新:', worldData);
        }
    });

    // 监听order_message
    socket.on('order_message', (data) => {
        console.log('=== 收到订单消息 ===');
        console.log('订单数量:', data.total_orders_num);
        // 在这里添加处理订单信息的代码逻辑
    });
};

// 初始化事件监听
setupEventListeners();

// 移除定时发送 ping 的部分
// setInterval(() => {
//     socket.emit('ping');
//     console.log('=== 发送 ping ===');
// }, 5000);

// 导出模块
export {
    socket
};