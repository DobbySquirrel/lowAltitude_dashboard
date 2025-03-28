<template>
  <div class="video-container">
    <div class="title-container">
      <el-text class="mx-1" style="font-size: 12px; color: #333"
        >Live Video</el-text
      >
    </div>
    <div ref="videoContainer" class="video-display">
      <img ref="imageDisplay" class="video-frame" />
    </div>
  </div>
</template>

<script>
import { initWebSocketServer, cleanup, setFrameCallback, setFrameRate } from '@/utils/videoStreamClient';

export default {
  name: "VideoDisplay",
  mounted() {
    this.initVideoDisplay();
    initWebSocketServer();
    // 设置合适的帧率
    setFrameRate(15); // 设置15fps
  },
  methods: {
    initVideoDisplay() {
      const imageElement = this.$refs.imageDisplay;
      
      setFrameCallback((imageUrl) => {
        // 更新图像显示
        imageElement.src = imageUrl;
        // 在图像加载后释放 URL
        imageElement.onload = () => {
          URL.revokeObjectURL(imageUrl);
        };
      });
    }
  },
  beforeDestroy() {
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
