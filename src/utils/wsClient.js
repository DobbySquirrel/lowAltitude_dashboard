import { useDataStore } from '../store';
import { startMockDataStream } from './mockDataGenerator';
import { messageReceiver } from './messageReceiver';
import { messageHandler } from './messageHandler';


let mockMode = false; // 改为默认关闭模拟模式

// WebSocket服务器地址
const WS_SERVER = 'ws://localhost:8080';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.store = null;
    this.messageHandler = null;
    this.connected = false;
    this.connectionPromise = null;
    this.mockWs = null;    // 保留这行，但我们不会再使用它

    // 修改消息处理器，简化处理逻辑
    this.messageHandler = (event) => {
      console.log('收到消息:', event.data);
      
      try {
        const data = JSON.parse(event.data);
        if (this.messageCallback) {
          this.messageCallback(event);
        }
      } catch (error) {
        console.error('处理消息错误:', error);
      }
    };
  }

  connect() {
    // 移除模拟模式相关代码，直接连接WebSocket
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

  isConnected() {
    return this.connected;
  }
}

// 创建单例实例
export const wsClient = new WebSocketClient(); 