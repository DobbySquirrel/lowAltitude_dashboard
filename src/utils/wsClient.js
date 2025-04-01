import { useDataStore } from '../store';
import { startMockDataStream } from './mockDataGenerator';
import { messageReceiver } from './messageReceiver';
import { messageHandler } from './messageHandler';

let mockMode = false;

const WS_SERVER = 'ws://10.12.17.136:8080';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.store = null;
    this.messageHandler = null;
    this.connected = false;
    this.connectionPromise = null;
    this.mockWs = null;

    this.messageHandler = (event) => {
      try {
        const data = JSON.parse(event.data);
        messageReceiver.handleMessage(event);
        
        if (this.messageCallback) {
          this.messageCallback(event);
        }
      } catch (error) {
        console.error('[WebSocketClient] 处理消息错误:', error);
      }
    };
  }

  connect() {
    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_SERVER);
      
      this.ws.onopen = () => {
        this.connected = true;
        messageHandler.setWebSocketClient(this);
        
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

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (typeof message === 'string') {
            this.ws.send(message);
        } else {
            this.ws.send(JSON.stringify(message));
        }
    } else {
        console.error('WebSocket is not connected');
    }
  }

  onMessage(handler) {
    this.messageCallback = handler;
    if (this.ws) {
      this.ws.onmessage = this.messageHandler;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const wsClient = new WebSocketClient(); 