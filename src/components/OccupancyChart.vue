<template>
  <div class="chart-container">
    <div id="OccupancyChart"></div>
  </div>
</template>

<script setup>
import * as echarts from "echarts";
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  }
});

const myChart = ref(null);

const ORDER_STATUS = {
  '已下单': '已下单',
  '准备中': '准备中',
  '配送中': '配送中',
  '已送达': '已送达'
};

const renderChart = () => {
  const chartDom = document.getElementById("OccupancyChart");
  if (!chartDom) return;

  const orderCounts = calculateOrderStatusCounts(props.orders);
  
  const option = {
    title: {
      text: "Order Status Distribution",
      left: "center",
      textStyle: {
        color: "#333",
        fontSize: 10
      },
      top: '0%'
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `${params.name}<br/>Count: ${params.value} (${Math.round(params.percent)}%)`
      }
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: 0,
      top: '18%',
      containLabel: true,
    },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['30%', '50%'],
      center: ['50%', '55%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: function(params) {
          return `${params.name}:\n${params.value} (${Math.round(params.percent)}%)`;
        },
        fontSize: 10
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '12',
          fontWeight: 'bold'
        }
      },
      data: Object.entries(orderCounts).map(([status, count], index) => ({
        value: count,
        name: status,
        itemStyle: {
          color: [
            '#2c3e50',  // 最深的深灰蓝色
            '#3a7ca5',  // 深蓝色
            '#16a2d7',  // 亮蓝色
            '#bde0fe',  // 最浅的浅蓝色
          ][index % 4]
        }
      }))
    }]
  };

  myChart.value.setOption(option);
};

const calculateOrderStatusCounts = (orders) => {
  const counts = {
    '已下单': 0,
    '准备中': 0,
    '配送中': 0,
    '已送达': 0
  };
  
  const successOrders = props.orders.filter(order => order.status === '已送达').length;
  
  orders.forEach(order => {
    if (order.status && counts[order.status] !== undefined) {
      if (order.status === '已送达') {
        counts['已送达'] = successOrders;
      } else {
        counts[order.status]++;
      }
    }
  });
  
  return counts;
};

// Watch for data changes
watch(() => props.orders, () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  myChart.value = echarts.init(document.getElementById('OccupancyChart'));
  renderChart();
  window.addEventListener('resize', () => myChart.value?.resize());
});

onUnmounted(() => {
  window.removeEventListener('resize', () => myChart.value?.resize());
  myChart.value?.dispose();
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