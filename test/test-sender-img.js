import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testImages = [
    path.join(__dirname, 'test.jpg'),
    path.join(__dirname, 'test2.jpg')
];

// 添加重试配置
const config = {
    maxRetries: 3,
    retryDelay: 2000,
    minInterval: 1000,
    imageQuality: 70,     // 提高一点质量
    imageWidth: 640,      // 增加宽度
    imageHeight: 480,     // 增加高度
    fit: 'inside'         // 添加适应模式，保持原始比例
};

// 预处理图片，压缩尺寸和质量
async function processImages() {
    console.log('开始处理图片...');
    return Promise.all(testImages.map(async (imagePath, index) => {
        try {
            const processedImage = await sharp(imagePath)
                .resize(config.imageWidth, config.imageHeight, {
                    fit: config.fit,        // 保持原始比例
                    withoutEnlargement: true // 避免放大小图片
                })
                .jpeg({ quality: config.imageQuality })
                .toBuffer();
            console.log(`图片 ${index + 1} 处理完成，大小: ${processedImage.length} 字节`);
            return Array.from(processedImage);
        } catch (error) {
            console.error(`处理图片 ${imagePath} 失败:`, error);
            throw error;
        }
    }));
}

let processedImagesData = [];

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
        processedImagesData = await processImages();
        console.log(`已处理 ${processedImagesData.length} 张图片`);
        
        const ws = await connectWithRetry('ws://10.12.17.136:8080');
        console.log('连接到服务器成功');
        
        ws.send(JSON.stringify({
            type: 'client-ready',
            clientType: 'sender'
        }));

        let currentImageIndex = 0;
        let lastSendTime = 0;
        let failedAttempts = 0;

        const sendInterval = setInterval(() => {
            const now = Date.now();
            
            if (ws.readyState === WebSocket.OPEN && 
                ws.bufferedAmount === 0 && 
                now - lastSendTime >= config.minInterval) {
                
                try {
                    const currentImage = processedImagesData[currentImageIndex];
                    const testFrame = {
                        type: 'video-frame',
                        data: currentImage,
                        format: 'jpeg',

                    };

                    ws.send(JSON.stringify(testFrame));
                    lastSendTime = now;
                    currentImageIndex = (currentImageIndex + 1) % processedImagesData.length;
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