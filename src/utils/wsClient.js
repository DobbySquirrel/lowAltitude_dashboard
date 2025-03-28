import { useDataStore } from '../store';
import { startMockDataStream } from './mockDataGenerator';
import { messageReceiver } from './messageReceiver';
import { messageHandler } from './messageHandler';

let mockMode = true; // 启用模拟数据

// WebSocket服务器地址
const WS_SERVER = 'ws://113.45.11.133:8080';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.store = null;
    this.messageHandler = null;
    this.connected = false;
    this.connectionPromise = null;
    this.mockWs = null;    // 新增：用于模拟连接

    // 设置消息处理器
    this.messageHandler = (event) => {
      messageReceiver.handleMessage(event);
    };
  }

  connect() {
    // 同时启动真实连接和模拟数据
    this.mockConnect();
    
    // 创建连接 Promise
    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_SERVER);
      
      this.ws.onopen = () => {
        this.connected = true;
        messageHandler.setWSClient(this);
        
        setTimeout(() => {
          try {
            this.ws.send(JSON.stringify({
              type: 'client-ready',
              timestamp: Date.now(),
              clientType: 'viewer'
            }));
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 100);
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      if (this.messageHandler) {
        this.ws.onmessage = this.messageHandler;
      }
    });

    return this.connectionPromise;
  }

  mockConnect() {
    this.mockWs = {
      send: (data) => {
        if (this.messageHandler) {
          this.messageHandler({ data });
        }
      }
    };
    startMockDataStream(this.mockWs);
  }

  async send(data) {
    // 总是发送到真实连接
    if (this.connectionPromise) {
      await this.connectionPromise;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  onMessage(handler) {
    this.messageHandler = handler;
    if (this.ws) {
      this.ws.onmessage = handler;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  setupMockData() {
    // 导入模拟数据生成器
    import('./mockDataGenerator').then(({ startMockDataStream }) => {
      startMockDataStream(this);
    });
  }

  isConnected() {
    return this.connected;
  }
}

// 创建单例实例
export const wsClient = new WebSocketClient(); 