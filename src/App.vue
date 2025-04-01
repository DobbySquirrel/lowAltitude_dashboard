<template>
  <div class="common-layout">
    <el-container>
      <!-- 头部 -->
      <el-header>
        <AppHeader 
          v-bind="dashboardData.header"
        />
      </el-header>
      <!-- 主体内容区域 -->
      <el-main class="main-content-area">
        <!-- 地图层 - 作为背景 -->
        <div class="map-background">
          <VideoDisplay
         
          />
        </div>
        
        <!-- 内容层 -->
        <div class="content-overlay">
          <el-row :gutter="10">
            <!-- 左侧部分 -->
            <el-col :span="5" class="left">
              <div class="left-panel card">
                <OrderDisplayPanel
                  v-bind="dashboardData.orderDisplay"
                />
              </div>
            </el-col>

            <!-- 中间部分 -->
            <el-col :span="14" class="middle">
              <div class="middle-content card">
                <!-- 下部图表区域 -->
                <div class="middle-content-bottom">
                  <el-row :gutter="10">
                    <el-col :span="8">
                      <OrderCountChart
                        v-bind="dashboardData.orderCount"
                      />
                    </el-col>
                    <el-col :span="8">
                      <UserScoreBarChart
                        v-bind="dashboardData.userScore"
                      />
                    </el-col>
                    <el-col :span="8">
                      <OccupancyChart
                        v-bind="dashboardData.occupancy"
                      />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-col>
            
            <!-- 右侧部分 -->
            <el-col :span="5" class="right">
              <div class="right-panel card">
                <DeliveryRolePanel
                  v-bind="dashboardData.deliveryRole"
                />
              </div>
            </el-col>
          </el-row>
        </div>
      </el-main>
      
      <!-- 修改虚实交互和聊天窗口的实现方式 -->
      <el-button class="float-button virtual-button" @click="showVirtualDialog = true">
        <el-icon><Shop /></el-icon>
        Virtual Interaction
      </el-button>
      
      <el-button class="float-button chat-button" @click="showChatDialog = true">
        <el-icon><ChatDotRound /></el-icon>
        Online Chatting
      </el-button>

      <!-- 使用对话框形式展示虚实交互界面 -->
      <el-dialog
        v-model="showVirtualDialog"
        title="showVirtualDialog"
        width="80%"
        :before-close="handleClose"
      >
        <VirtualTransaction />
      </el-dialog>

      <!-- 使用对话框形式展示聊天窗口 -->
      <el-dialog
        v-model="showChatDialog"
        title="showChatDialog"
        width="60%"
        :before-close="handleClose"
      >
        <ChatWindow />
      </el-dialog>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from './store';
import { wsClient } from './utils/wsClient';
import AppHeader from "./components/Header.vue";
import OrderDisplayPanel from "./components/OrderDisplayPanel.vue";
import OrderCountChart from "./components/OrderCountChart.vue";
import UserScoreBarChart from "./components/UserScoreBarChart.vue";
import OccupancyChart from "./components/OccupancyChart.vue";
import VideoDisplay from "./components/VideoDisplay.vue";
import VirtualTransaction from './components/VirtualTransaction.vue';
import ChatWindow from './components/ChatWindow.vue';
import { ref } from 'vue'
import { Shop, ChatDotRound } from '@element-plus/icons-vue'
import DeliveryRolePanel from "./components/DeliveryRolePanel.vue";
import { transformOrderToDashboard } from './utils/dataTransformer';

const store = useDataStore();
const { dashboardData } = storeToRefs(store);
const showVirtualDialog = ref(false);
const showChatDialog = ref(false);

const handleClose = () => {
  showVirtualDialog.value = false;
  showChatDialog.value = false;
};

// WebSocket 连接和数据处理
onMounted(() => {
  // 设置消息处理函数
  wsClient.onMessage((event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'order-data') {
        const orderData = message.data;
        const transformedData = transformOrderToDashboard(orderData);
        if (transformedData) {
          store.updateDashboardData(transformedData);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // 建立连接
  wsClient.connect().catch(error => {
    console.error('WebSocket connection error:', error);
  });
});

onUnmounted(() => {
  wsClient.disconnect();
});
</script>

<style>
/* 添加 el-container 相关样式 */
.el-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: auto;
  overflow: hidden;
}

/* 修改 header 样式使其固定 */
.el-header {
  position: fixed; /* 改为固定定位 */
  top: 0;
  left: 0;
  right: 0;
  flex-shrink: 0;
  height: auto !important;
  padding: 10px;
  min-height: 160px;
  max-height: 15vh;
  overflow: hidden;
  z-index: 100; /* 提高层级确保在最上层 */
  background-color: #fff; /* 添加背景色 */
}

/* 为了防止内容被固定header遮挡，需要给main内容添加上边距 */
.main-content-area {
  margin-top: 160px; /* 对应 header 的 min-height */
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
  min-height: calc(85vh - 20px);
  margin-left: 0;
  margin-right: 0;
  margin-bottom: 0;
  overflow: hidden;
}

/* 地图背景层 */
.map-background {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  height: auto;
  aspect-ratio: 2.05 / 1; /* 根据实际图片比例设置 */
  z-index: 1;
  overflow: hidden;
}

/* 确保地图容器内的内容也正确居中 */
.map-background > div {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 内容覆盖层 */
.content-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 15px 30px;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}

/* 修改左右两侧面板样式 */
.left-panel {
  position: fixed;
  left: 30px;
  top: calc(160px + 30px); /* header高度 + 间距 */
  width: calc(20.83% - 45px);
  height: calc(100vh - 280px); /* 调整高度以适应新的地图比例 */
  background-color: rgba(255, 255, 255, 0);
  /* backdrop-filter: blur(2px); */
  border-radius: 8px;
  padding: 15px;
  overflow-y: auto;
  z-index: 3;
  pointer-events: auto;
  overflow: hidden;
}

.right-panel {
  position: fixed;
  right: 30px;
  top: calc(160px + 30px); /* header高度 + 间距 */
  width: calc(20.83% - 45px);
  height: calc(100vh - 280px); /* 调整高度以适应新的地图比例 */
  background-color: rgba(255, 255, 255, 0);
  /* backdrop-filter: blur(2px); */
  border-radius: 8px;
  padding: 15px;
  overflow-y: auto;
  z-index: 3;
  pointer-events: auto;
  overflow: hidden;
}

/* 修改中间内容区域样式 */
.middle-content {
  height: 100%;
  padding: 0;
  margin: 0;
  position: relative;
  background-color: transparent;
  pointer-events: none; /* 允许点击穿透到地图 */
  bottom: 20px;
}

/* 下部图表区域容器 */
.middle-content-bottom {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 30px; /* 调整底部间距 */
  width: calc(58.33% - 60px);
  height: 200px; /* 设置固定高度 */
  background-color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(2px);
  border-radius: 8px;
  padding: 12px;
  z-index: 2;
  pointer-events: auto;
}

/* 调整图表内部间距 */
.middle-content-bottom .el-col {
  height: 100%;
  padding: 4px; /* 减小内部图表间距 */
}

/* 图表容器样式 */
.middle-content .el-col > * {
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.common-layout {
  background-color: transparent; /* 改为透明背景 */
  border-radius: 30px;
  min-height: 65vh;
  height: auto;
  padding: 0px;
  overflow: hidden;
  position: relative; /* 添加相对定位 */
}

/* 添加虚实交互界面的样式 */
.virtual-transaction-section {
  margin-top: 20px;
  padding: 0 20px;
}

/* 调整行间距 */
.el-row {
  height: 100%; /* 确保行高度铺满 */
}

/* 调整列间距 */
.el-col {
  height: 100%; /* 确保列高度铺满 */
  padding: 5px !important;
}

/* 在现有的样式后添加 */
.chat-window-container {
  margin-top: 20px;
  flex: 1;
}

/* 修改浮动按钮样式 */
.float-button {
  position: fixed;
  padding: 12px 20px;
  border-radius: 25px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  bottom: 2vh; /* 使用视窗高度的相对单位 */
}

.virtual-button {
  left: 5vw; /* 使用视窗宽度的相对单位 */
  background-color: rgba(64, 158, 255, 0.5);
  color: white;
}

.chat-button {
  right: 5vw; /* 使用视窗宽度的相对单位 */
  background-color: rgba(60, 98, 155, 0.5);
  color: white;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}
</style>