import { io } from 'socket.io-client';

// Socket配置选项
const socketOptions = {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 5000,
    transports: ['websocket', 'polling']
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
        
        // 发送 init_client 消息
        const clientData = '{"client_type": "web"}';
        socket.emit('init_client', clientData);

        // 发送 init_world 消息
        const worldData = '{"client_type": "web", "action": "check"}';
        socket.emit('init_world', worldData);
    });

    // 监听init响应
    socket.on('init', (data) => {
        console.log('=== 初始化响应 ===');
        console.log('服务器初始化响应:', data);
    });
    // 监听init响应
    socket.on('connect', (data) => {
        console.log('=== 初始化响应 ===');
        console.log('服务器初始化响应:', data);
    });

    // 监听所有事件（调试用）
    socket.onAny((eventName, ...args) => {
        console.log('=== 收到事件 ===');
        console.log('事件名称:', eventName);
        console.log('事件数据:', args);
    });

    // 错误处理
    socket.on('connect_error', (error) => {
        console.log('=== 连接错误 ===');
        console.log('连接错误详情:', {
            message: error.message,
            type: error.type,
            description: error.description
        });
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
        console.log('服务器响应:', data);

        if (data && data.action === 'wait') {
            console.log('等待状态，重新发送 init_world 检查请求');
            const recheckData = '{"client_type": "web", "action": "check"}';
            socket.emit('init_world', recheckData);
        } else if (data && data.action === 'synchronize') {
            console.log('可以同步，执行同步操作');
            // 将动作更改为 synchronize 并发送
            const syncData = '{"client_type": "web", "action": "synchronize"}';
            socket.emit('init_world', syncData);
            // 执行同步相关操作，如处理订单消息等
        } else {
            console.log('接收到非期望响应:', data.message);
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

// 保持进程运行
process.stdin.resume();

// 导出模块
export {
    socket
};