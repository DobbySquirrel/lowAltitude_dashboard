<template>
  <el-header class="custom-header">
    <div class="header-container">
      <el-row :gutter="3" class="main-row">
        <!-- First Column: Title and Statistic Cards -->
        <el-col :span="18" class="content-container">
          <!-- Title Section -->
          <div class="title-container">
            <h2 class="dashboard-title">
              <span style="color: #3a7ca5">Intelligent LowAltitude Delivery Dashboard </span>
              <span style="color: #2c3e50">for HKUST(GZ) </span>
              <span style="color: #16a2d7">2025</span>
            </h2>
            <hr style="border-top: 2px solid #bde0fe; width: 90%; margin: 5px 0 0 5px" />
          </div>

          <!-- Statistic Cards Layout -->
          <el-row :gutter="5" class="statistic-row">
            <el-col :span="1" class="statistic-col"> </el-col>
            <el-col :span="5" class="statistic-col">
              <div class="statistic-card">
                <el-statistic
                  :value="carbonReduction"
                  value-style="font-size: 1.2em; color: #2c3e50;font-weight: bold;"
                >
                  <template #title>
                    <div style="display: inline-flex; align-items: center; font-size: 1.2em; color: #2c3e50;">
                      Carbon Reduction
                    </div>
                  </template>
                  <template #prefix>
                    <el-icon class="statistic-icon" color="#16a2d7">
                      <Odometer />
                    </el-icon>
                    <span style="margin-left: 5px"></span>
                  </template>
                  <template #suffix>
                    <el-text class="mx-1" style="font-size: 0.8em; color: #3a7ca5">
                      <span style="margin-left: 10px"></span>g CO2
                    </el-text>
                  </template>
                </el-statistic>
              </div>
            </el-col>
            
            <el-col :span="8" class="statistic-col">
              <div style="font-size: 0.5em; color: #2c3e50;">
                = {{ recycledBoxes }} boxes * 0.5267g per box
              </div>
              <div style="font-size: 10px; color: #2c3e50; margin-top: 5px;">
                Notes: <br>1. Assumed 20 cycles for green boxes <br>2. Carbon reduction is compared with corrugated boxes of the same size and transport distance
              </div>
            </el-col>

            <el-col :span="4" class="statistic-col">
              <div class="statistic-card">
                <el-statistic
                  :value="recycledBoxes"
                  value-style="font-size: 1.2em; color: #2c3e50;font-weight: bold;"
                >
                  <template #title>
                    <div style="display: inline-flex; align-items: center; font-size: 1.2em; color: #2c3e50;">
                      Box Recycling
                    </div>
                  </template>
                  <template #prefix>
                    <el-icon class="statistic-icon" color="#16a2d7">
                      <MessageBox />
                    </el-icon>
                    <span style="margin-left: 5px"></span>
                  </template>
                  <template #suffix>
                    <el-text class="mx-1" style="font-size: 0.8em; color: #3a7ca5">
                      <span style="margin-left: 10px"></span>Boxes
                    </el-text>
                  </template>
                </el-statistic>
              </div>
            </el-col>
            <el-col :span="5" class="statistic-col">
              <div style="font-size: 10px; color: #2c3e50; ">
                = Number of Recycling boxes placed in the locker
              </div>
            </el-col>
          </el-row>
        </el-col>

        <!-- Second Column: SVG Image -->
        <el-col :span="6" class="svg-container">
          <img src="@/assets/Header.svg" alt="Descriptive Text" class="header-image" />
        </el-col>
      </el-row>
    </div>
  </el-header>
</template>

<script setup>
import { Odometer, MessageBox } from "@element-plus/icons-vue";

// 定义props
defineProps({
  carbonReduction: {
    type: Number,
    default: 0
  },
  recycledBoxes: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
.custom-header {
  background-color: #d8fcf247;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 5px;
  border-radius: 30px;
  height: auto;
  min-height: 150px;
}

.header-container {
  width: 100%;
  height: auto;
}

.main-row {
  width: 100%;
  height: auto;
}

.content-container {
  display: flex;
  flex-direction: column;
  height: auto;
}

.statistic-row {
  width: 100%;
  height: auto;
  margin-top: 2px;
}

.statistic-card {
  height: auto;
  padding: 3px;
}

.svg-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding-right: 10px;
}

.header-image {
  width: auto;
  height: calc(100% - 15px);
  max-height: 120px;
  min-height: 110px;
  object-fit: contain;
  margin-right: 0;
}

.dashboard-title {
  font-size: 1.4em;
  margin: 0;
  line-height: 1.1;
  text-align: left;
  width: 100%;
}

.title-container {
  margin-bottom: 5px;
  margin-top: 0;
}

@media screen and (max-width: 1920px) {
  .header-image {
    max-height: 130px;
  }
}

@media screen and (max-width: 1440px) {
  .header-image {
    max-height: 110px;
  }
}

@media screen and (max-width: 1280px) {
  .header-image {
    max-height: 90px;
  }
}

.statistic-icon {
  font-size: 2.5em;
  vertical-align: middle;
}

/* 响应式设计 */
@media screen and (max-width: 1920px) {
  .statistic-icon {
    font-size: 2.2em;
  }
}

@media screen and (max-width: 1440px) {
  .statistic-icon {
    font-size: 2em;
  }
}

@media screen and (max-width: 1280px) {
  .statistic-icon {
    font-size: 1.8em;
  }
}

/* 添加深度选择器来覆盖 Element Plus 的默认样式 */
:deep(.el-icon) {
  vertical-align: middle !important;
}
</style>
