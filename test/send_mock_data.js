import WebSocket from 'ws';
import { io } from 'socket.io-client';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Socket配置选项
const socketOptions = {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 5000,
    transports: ['websocket', 'polling']
};

// 创建socket实例
const socket = io('http://localhost:8080', socketOptions);

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('已连接到服务器');
    sendMockData();
});

// 事件监听器集中管理
const setupEventListeners = () => {
    // 基础连接事件
    socket.on('connect', () => {
        console.log('=== 连接事件 ===');
        console.log('已成功连接到服务器');
        console.log('Socket ID:', socket.id);
        
        // 连接成功后立即发送模拟数据
        sendMockData();
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

    socket.on('disconnect', (reason) => {
        console.log('=== 断开连接 ===');
        console.log('断开连接:', reason);
    });
};

// 从Python脚本获取模拟数据并发送
const sendMockData = () => {
    const pythonProcess = spawn('python', [path.join(__dirname, 'get_data.py')]);
    
    pythonProcess.stdout.on('data', (data) => {
        try {
            // 解析Python脚本输出的JSON数据
            const mockData = JSON.parse(data.toString().trim());
            console.log('=== 生成的模拟数据 ===');
            console.log(mockData);
            
            // 发送数据到服务器
            const dataToSend = {
                message: {
                    client_type: "web",
                    order_data: mockData
                }
            };
            
            console.log('=== 发送数据 ===');
            console.log('发送的数据类型:', typeof dataToSend);
            console.log('发送的数据内容:', dataToSend);
            
            // 发送数据
            socket.emit('client_message', JSON.stringify(dataToSend));
            
            // 每隔10秒发送一次新的模拟数据
            setTimeout(sendMockData, 10000);
        } catch (error) {
            console.error('=== 解析数据错误 ===');
            console.error('无法解析Python输出:', error);
            console.error('原始输出:', data.toString());
        }
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error('=== Python错误 ===');
        console.error(data.toString());
    });
    
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`Python进程退出，退出码: ${code}`);
        }
    });
};

// 初始化事件监听
setupEventListeners();

// 保持进程运行
process.stdin.resume();

console.log('开始运行，等待连接到服务器...');