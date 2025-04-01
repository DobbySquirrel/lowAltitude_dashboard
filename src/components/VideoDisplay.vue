<template>
  <div class="video-container">
    <div class="title-container">
      <el-text class="mx-1" style="font-size: 12px; color: #333"
        >Live</el-text
      >
    </div>
    <div ref="videoContainer" class="video-display">
      <img ref="imageDisplay" class="video-frame" />
    </div>
  </div>
</template>

<script>
import { initWebSocketServer, cleanup, setFrameCallback, setFrameRate, setMaxQueueSize } from '@/utils/videoStreamClient';

export default {
  name: "VideoDisplay",
  mounted() {
    this.initVideoDisplay();
    initWebSocketServer();
    // 降低帧率
    setFrameRate(10); // 设置10fps
    // 设置较小的队列大小
    setMaxQueueSize(2);
  },
  methods: {
    initVideoDisplay() {
      const imageElement = this.$refs.imageDisplay;
      let currentImageUrl = null;
      
      setFrameCallback((imageUrl) => {
        // 如果当前图像正在加载，跳过新帧
        if (imageElement.src && !imageElement.complete) {
          URL.revokeObjectURL(imageUrl);
          return;
        }
        
        // 清理当前显示的URL
        if (currentImageUrl) {
          URL.revokeObjectURL(currentImageUrl);
        }
        
        // 更新图像显示
        currentImageUrl = imageUrl;
        imageElement.src = imageUrl;
      });
    }
  },
  beforeDestroy() {
    // 确保在组件销毁时清理最后一个URL
    if (this.$refs.imageDisplay && this.$refs.imageDisplay.src) {
        URL.revokeObjectURL(this.$refs.imageDisplay.src);
    }
    cleanup();
  }
};
</script>

<style scoped>
.video-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
}

.video-display {
  width: 100%;
  height: 100%;
  background: #00000000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-frame {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.title-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 3px 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}
</style>
