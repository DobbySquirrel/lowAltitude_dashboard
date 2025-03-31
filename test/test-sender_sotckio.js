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
        
        // 直接使用字符串形式
        const initData = '{"message": {"client_type": "web"}}';
        
        console.log('发送的数据类型:', typeof initData);
        console.log('发送的数据内容:', initData);
        
        socket.emit('init', initData);
        socket.emit('client_message', initData);
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
};

// 初始化事件监听
setupEventListeners();

// 定时发送 ping
setInterval(() => {
    socket.emit('ping');
    console.log('=== 发送 ping ===');
}, 5000);

// 保持进程运行
process.stdin.resume();

// 导出模块
export {
    socket
};