import { VideoStreamClient } from './videoStreamClient';

export class VideoViewer {
    constructor(wsUrl, videoElement) {
        this.client = new VideoStreamClient(wsUrl);
        this.videoElement = videoElement;
        this.imageElement = document.createElement('img');
        this.videoElement.appendChild(this.imageElement);
    }

    async start() {
        try {
            await this.client.connect('viewer');
            
            // 设置接收视频帧的回调
            this.client.setFrameCallback((imageUrl) => {
                this.imageElement.src = imageUrl;
                // 释放URL对象
                URL.revokeObjectURL(imageUrl);
            });

        } catch (error) {
            console.error('启动视频接收失败:', error);
            throw error;
        }
    }

    stop() {
        this.client.disconnect();
    }
} 