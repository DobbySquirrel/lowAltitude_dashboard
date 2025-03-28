<template>
  <div class="chart-container">
    <div id="OccupancyChart"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { orderIcons } from '@/utils/orderIcons';
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  devices: {
    type: Object,
    default: () => ({
      locker: { total: 0, used: 0 },
      indoorCar: { total: 0, used: 0 },
      outdoorCar: { total: 0, used: 0 },
      drone: { total: 0, used: 0 }
    })
  }
});

const myChart = ref(null);

const updateChart = () => {
  const option = {
    title: {
      text: 'Vehicle Occupancy Rate',
      left: "center",
      textStyle: {
        color: '#333',
        fontSize: 12
      },
      top: '0%',
    },
    legend: {
      data: ['Activated', 'Count'],
      top: '10%',
      left: 'center',
      textStyle: {
        fontSize: 10  
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      containLabel: true,
      left: '0%',
      bottom: '0%',
      top: '18%',
    },
    yAxis: {
      data: ['Locker', 'Indoor_Car', 'Outdoor_Car', 'Drone'],
      inverse: true,
      position: 'left',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        margin: 30,
        fontSize: 10,
      },
    },
    xAxis: {
      max: 14,
      splitLine: { show: true },
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false }
    },
    series: [
      {
        type: 'pictorialBar',
        name: 'Activated',
        barCategoryGap: 0,
        symbolBoundingData: 10,
        animationDuration: 0,
        symbolSize: ["80%", "80%"],
        z: 10,
        label: {
          show: true,
          position: 'left',
          offset: [0, 0],
          fontSize: 10,
          color: "#3a7ca5",
        },
        itemStyle: {
          color: '#3a7ca5'
        },
        data: [
          { value: props.devices.locker.used, symbol: orderIcons.Locker, symbolRepeat: 'true', symbolSize: ["60%", "60%"] },
          { value: props.devices.indoorCar.used, symbol: orderIcons.Indoor_Car, symbolRepeat: 'true', symbolSize: ["70%", "50%"] },
          { value: props.devices.outdoorCar.used, symbol: orderIcons.Outdoor_Car, symbolRepeat: 'true', symbolSize: ["70%", "50%"] },
          { value: props.devices.drone.used, symbol: orderIcons.Drone, symbolRepeat: 'true', symbolSize: ["65%", "65%"] }
        ]
      },
      {
        name: 'Count',
        type: 'pictorialBar',
        animationDuration: 0,
        symbolBoundingData: 10,
        symbolSize: ["80%", "80%"],
        label: {
          show: true,
          position: 'right',
          offset: [10, 0],
          fontSize: 10,
        },
        itemStyle: {
          color: 'rgba(128, 128, 128, 0.8)'
        },
        data: [
          { value: props.devices.locker.total, symbol: orderIcons.Locker, symbolRepeat: 'true', symbolSize: ["60%", "60%"] },
          { value: props.devices.indoorCar.total, symbol: orderIcons.Indoor_Car, symbolRepeat: 'true', symbolSize: ["70%", "50%"] },
          { value: props.devices.outdoorCar.total, symbol: orderIcons.Outdoor_Car, symbolRepeat: 'true', symbolSize: ["70%", "50%"] },
          { value: props.devices.drone.total, symbol: orderIcons.Drone, symbolRepeat: 'true', symbolSize: ["65%", "65%"] }
        ]
      }
    ]
  };

  myChart.value.setOption(option);
};

const handleResize = () => {
  myChart.value && myChart.value.resize();
};

// 监听数据变化
watch(() => props.devices, () => {
  updateChart();
}, { deep: true });

onMounted(() => {
  myChart.value = echarts.init(document.getElementById('OccupancyChart'));
  updateChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  myChart.value && myChart.value.dispose();
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 30vh;
  display: flex;
  flex-direction: column;
}

#OccupancyChart {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 150px;
}
</style>

