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
  indoorOrders: {
    type: Array,
    default: () => []
  },
  outdoorOrders: {
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
  // 获取最近24小时的时间标签
  const timeLabels = Array.from({length: 24}, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - (23 - i));
    return d.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  const option = {
    title: {
      text: "Package Quantity Trend",
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
    },
    legend: {
      data: ["Drone Orders", "Indoor Delivery Car Orders", "Outdoor Delivery Car Orders"],
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
          formatter: function(value) {
            return value;
          },
          interval: 'auto',
          rotate: 0,
          margin: 8,
          hideOverlap: true
        }
      },
    ],
    yAxis: [
      {
        type: "value",
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
        name: "Indoor Delivery Car Orders",
        type: "line",
        areaStyle: {color:"rgba(115, 192, 222, 0.5)"}, 
        color:"#73c0de",
        emphasis: {
          focus: "series",
        },
        data: props.indoorOrders,
      },
      {
        name: "Outdoor Delivery Car Orders",
        type: "line",
        color:"#91CC75",
        areaStyle: {color:"rgba(145, 204, 117, 0.5)"},
        emphasis: {
          focus: "series",
        },
        data: props.outdoorOrders,
      },
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
watch([() => props.droneOrders, () => props.indoorOrders, () => props.outdoorOrders], () => {
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