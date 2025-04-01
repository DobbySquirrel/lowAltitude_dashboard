import { ref } from 'vue';

// 单例模式
const instance = {
    latestFrame: ref(null),
    ws: ref(null),
    isConnecting: ref(false),
    connectionId: ref(null),
    initialized: false,
    frameCallback: null,
    // 添加帧率控制
    lastFrameTime: 0,
    minFrameInterval: 1000 / 60,  // 提高帧率到60fps
    urlQueue: [], // 用于管理 URL 生命周期
    maxQueueSize: 4, // 略微增加队列大小
};

// 根据环境配置 WebSocket 服务器地址
const WS_SERVER = process.env.NODE_ENV === 'production' 
    ? `ws://${window.location.hostname}:8080`
    : 'ws://10.12.17.136:8080';

function initWebSocketServer() {
    if (instance.initialized || 
        instance.isConnecting.value || 
        (instance.ws.value && instance.ws.value.readyState === WebSocket.OPEN)) {
        return;
    }

    instance.isConnecting.value = true;
    instance.connectionId.value = `viewer-${Date.now()}`;
    
    try {
        if (instance.ws.value) {
            instance.ws.value.close();
            instance.ws.value = null;
        }

        instance.ws.value = new WebSocket(WS_SERVER);

        instance.ws.value.onopen = () => {
            instance.isConnecting.value = false;
            instance.initialized = true;
            
            instance.ws.value.send(JSON.stringify({
                type: 'client-ready',
                timestamp: Date.now(),
                clientType: 'viewer',
                clientId: instance.connectionId.value
            }));
        };

        instance.ws.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'video-frame') {
                    const currentTime = Date.now();
                    if (currentTime - instance.lastFrameTime < instance.minFrameInterval) {
                        return;
                    }
                    
                    while (instance.urlQueue.length > 0) {
                        const oldUrl = instance.urlQueue.shift();
                        URL.revokeObjectURL(oldUrl);
                    }

                    instance.lastFrameTime = currentTime;
                    const frameData = new Uint8Array(data.data);
                    const blob = new Blob([frameData], { 
                        type: 'image/jpeg',
                        quality: 1  // 进一步提高JPEG质量到0.98
                    });
                    
                    const imageUrl = URL.createObjectURL(blob);
                    instance.urlQueue.push(imageUrl);
                    instance.latestFrame.value = imageUrl;
                    
                    if (instance.frameCallback) {
                        instance.frameCallback(imageUrl);
                    }
                }
            } catch (error) {
                console.error('视频帧处理错误:', error);
            }
        };

        instance.ws.value.onerror = (error) => {
            console.error('视频流连接错误:', error);
            instance.isConnecting.value = false;
        };

        instance.ws.value.onclose = () => {
            instance.isConnecting.value = false;
            setTimeout(() => initWebSocketServer(), 5000);
        };
    } catch (error) {
        console.error('视频流连接初始化失败:', error);
        instance.isConnecting.value = false;
        instance.connectionId.value = null;
        instance.initialized = false;
    }
}

function setFrameCallback(callback) {
    instance.frameCallback = callback;
}

function cleanup() {
    if (instance.ws.value) {
        instance.ws.value.close();
        instance.ws.value = null;
    }
    
    instance.urlQueue.forEach(url => {
        URL.revokeObjectURL(url);
    });
    instance.urlQueue = [];
    instance.latestFrame.value = null;
    
    instance.isConnecting.value = false;
    instance.connectionId.value = null;
    instance.initialized = false;
    instance.frameCallback = null;
}

// 添加帧率设置函数
function setFrameRate(fps) {
    if (fps > 0) {
        instance.minFrameInterval = 1000 / fps;
    }
}

// 添加设置队列大小的函数
function setMaxQueueSize(size) {
    if (size > 0) {
        instance.maxQueueSize = size;
    }
}

// 初始化连接
initWebSocketServer();

// 导出供其他组件使用
export {
    instance as wsInstance,
    initWebSocketServer,
    cleanup,
    setFrameCallback,
    setFrameRate,
    setMaxQueueSize
}; 