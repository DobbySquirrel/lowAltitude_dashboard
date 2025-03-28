<template>
  <div class="chart-container">
    <div id="UserScoreBarChart"></div>
  </div>
</template>

<script setup>
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  rankings: {
    type: Array,
    default: () => []
  }
});

const myChart = ref(null);

const renderBarChart = () => {
  const chartDom = document.getElementById("UserScoreBarChart");
  if (!chartDom) return;
  
  // 按分数排序
  const sortedData = [...props.rankings].sort((a, b) => b.score - a.score);

  const option = {
    title: {
      text: "User Cumulative Points",
      left: "center",
      textStyle: {
        color: "#333",
        fontSize: 12
      }
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: '7%',
      right: '4%',
      bottom: '0%',
      top: '30%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.phone),
      axisLabel: {
        color: "#44652a",
        interval: 0,
        rotate: 30,
        fontSize: 9,
        formatter: function(value) {
          // 如果字符串长度超过4，显示后4位
          return value.length > 4 ? value.slice(-4) : value;
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Score',
      nameTextStyle: {
        color: "#44652a"
      },
      axisLabel: {
        color: "#44652a"
      }
    },
    series: [
      {
        name: "Return Score",
        type: "bar",
        data: sortedData.map(item => ({
          value: item.score,
          itemStyle: {
            color: item.score >= 0 ? "rgba(145, 204, 117, 0.5)" : "rgba(255, 99, 71, 0.5)"
          }
        })),
        label: {
          show: true,
          position: 'top',
          color: "#44652a",
          fontSize: 9
        },
        barWidth: '40%'
      }
    ]
  };

  myChart.value.setOption(option);
};

const handleResize = () => {
  if (myChart.value) {
    myChart.value.resize();
  }
};

// 监听数据变化
watch(() => props.rankings, () => {
  renderBarChart();
}, { deep: true });

onMounted(() => {
  myChart.value = echarts.init(document.getElementById("UserScoreBarChart"));
  renderBarChart();
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

#UserScoreBarChart {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 160px;
}
</style>