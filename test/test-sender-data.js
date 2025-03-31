import WebSocket from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';
import { generateMockData } from '../src/utils/mockDataGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const config = {
    maxRetries: 3,
    retryDelay: 2000,
    minInterval: 2000,
};

async function connectWithRetry(url, retryCount = 0) {
    try {
        const ws = new WebSocket(url, {
            handshakeTimeout: 5000,
            rejectUnauthorized: false
        });
        
        return new Promise((resolve, reject) => {
            ws.on('open', () => resolve(ws));
            ws.on('error', reject);
        });
    } catch (error) {
        if (retryCount < config.maxRetries) {
            console.log(`连接失败，${config.retryDelay/1000}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
            return connectWithRetry(url, retryCount + 1);
        }
        throw error;
    }
}

// 主函数
async function main() {
    try {
        const ws = await connectWithRetry('ws://localhost:8080');
        console.log('连接到服务器成功');
        
        ws.send(JSON.stringify({
            type: 'client-ready',
            timestamp: Date.now(),
            clientType: 'sender'
        }));

        let lastSendTime = 0;
        let failedAttempts = 0;

        const sendInterval = setInterval(() => {
            const now = Date.now();
            
            if (ws.readyState === WebSocket.OPEN && 
                ws.bufferedAmount === 0 && 
                now - lastSendTime >= config.minInterval) {
                
                try {
                    const mockData = generateMockData();
                    const testFrame = {
                        type: 'order-data',
                        timestamp: now,
                        data: mockData
                    };

                    ws.send(JSON.stringify(testFrame));
                    lastSendTime = now;
                    failedAttempts = 0; // 重置失败计数
                } catch (error) {
                    failedAttempts++;
                    console.error(`发送失败 (${failedAttempts}/${config.maxRetries}):`, error);
                    
                    if (failedAttempts >= config.maxRetries) {
                        console.log('达到最大重试次数，停止发送');
                        clearInterval(sendInterval);
                        ws.close();
                    }
                }
            }
        }, config.minInterval);
        
        // 添加清理函数
        const cleanup = () => {
            clearInterval(sendInterval);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };

        // 30分钟后自动停止
        setTimeout(cleanup, 30 * 60 * 1000);
        
        // 处理进程终止信号
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        
    } catch (error) {
        console.error('程序运行错误:', error);
        process.exit(1);
    }
}

main().catch(console.error);