<template>
  <div class="chart-container">
    <div id="OrderCountChart"></div>
  </div>
</template>

<script setup>
import * as echarts from "echarts";
import { onMounted, onUnmounted, watch } from 'vue';
import { ref } from 'vue';

const props = defineProps({
  droneOrders: {
    type: Array,
    default: () => []
  },
  humanOrders: {
    type: Array,
    default: () => []
  }
});

const myChart = ref(null);

const initChart = () => {
  const chartDom = document.getElementById('OrderCountChart');
  myChart.value = echarts.init(chartDom);
  updateChart();
};

const updateChart = () => {
  // 获取最近60分钟的时间标签
  const timeLabels = Array.from({length: 60}, (_, i) => {
    return `${Math.floor(i / 60).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}`;
  });

  const option = {
    title: {
      text: "Hourly Order Trends",
      left: "center",
      textStyle: {
        color: "#333",
        fontSize: 10
      },
      top: '0%',
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
          fontSize: 10
        },
      },
      formatter: function(params) {
        return `${params[0].name}<br/>
                ${params[0].seriesName}: ${params[0].value} orders<br/>
                ${params[1].seriesName}: ${params[1].value} orders`;
      }
    },
    legend: {
      data: ["Drone Orders", "Manual Orders"],
      top: '10%',
      left: '10%',
      textStyle: {
        fontSize: 10
      }
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: 0,
      top: '18%',
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: timeLabels,
        axisLabel: {
          interval: 4,  // 每5分钟显示一个标签
          rotate: 45,
          margin: 8,
          hideOverlap: true,
          fontSize: 10
        }
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "Orders",
        nameTextStyle: {
          fontSize: 10
        },
        axisLabel: {
          fontSize: 10
        }
      },
    ],
    series: [
      {
        name: "Drone Orders",
        type: "line",
        areaStyle: {color:"rgba(250, 200, 88, 0.5)"},
        color:"#fac858",
        emphasis: {
          focus: "series",
        },
        data: props.droneOrders,
      },
      {
        name: "Manual Orders",
        type: "line",
        areaStyle: {color:"rgba(115, 192, 222, 0.5)"}, 
        color:"#73c0de",
        emphasis: {
          focus: "series",
        },
        data: props.humanOrders,
      }
    ],
  };

  myChart.value.setOption(option);
};

const handleResize = () => {
  if (myChart.value) {
    myChart.value.resize();
  }
};

// 监听数据变化
watch([() => props.droneOrders, () => props.humanOrders], ([newDroneOrders, newHumanOrders]) => {
  updateChart();
});

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart.value) {
    myChart.value.dispose();
  }
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 30vh;
  display: flex;
  flex-direction: column;
}

#OrderCountChart {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 150px;
}
</style>