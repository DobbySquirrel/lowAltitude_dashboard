<template>
  <div class="chart-container">
    <div id="UserScoreBarChart"></div>
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

const renderChart = () => {
  const chartDom = document.getElementById("UserScoreBarChart");
  if (!chartDom) return;

  const option = {
    title: {
      text: "Consumer Age and Price Distribution",
      left: "center",
      textStyle: {
        color: "#333",
        fontSize: 10
      },
      top: '0%'
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: 0,
      top: '18%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `Age Group: ${params.name}<br/>Average Price: $${params.value.toFixed(2)}`;
      }
    },
    xAxis: {
      type: 'category',
      name: 'Age Group',
      nameLocation: 'middle',
      nameGap: 30,
      data: ['18-25', '26-35', '36-45', '46-65'],
      axisLabel: {
        fontSize: 10,
        interval: 'auto',
        rotate: 0,
        margin: 8,
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      name: 'AVG (¥)',
      nameTextStyle: {
        fontSize: 10
      },
      axisLabel: {
        fontSize: 10,
        formatter: (value) => value.toFixed(1)
      }
    },
    series: [{
      type: 'bar',
      barWidth: '30%',
      itemStyle: {
        color: 'rgba(115, 192, 222, 0.8)'
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params) => params.value.toFixed(1),
        fontSize: 10
      },
      data: calculateAgeGroupPrices(props.orders)
    }]
  };

  myChart.value.setOption(option);
};

// 计算各年龄段的平均消费金额
const calculateAgeGroupPrices = (orders) => {
  const ageGroups = {
    '18-25': { sum: 0, count: 0 },
    '26-35': { sum: 0, count: 0 },
    '36-45': { sum: 0, count: 0 },
    '46-65': { sum: 0, count: 0 }
  };

  orders.forEach(order => {
    const age = order.customer_age;
    const price = order.price;
    
    if (age >= 18 && age <= 25) {
      ageGroups['18-25'].sum += price;
      ageGroups['18-25'].count++;
    } else if (age > 25 && age <= 35) {
      ageGroups['26-35'].sum += price;
      ageGroups['26-35'].count++;
    } else if (age > 35 && age <= 45) {
      ageGroups['36-45'].sum += price;
      ageGroups['36-45'].count++;
    } else if (age > 45 && age <= 65) {
      ageGroups['46-65'].sum += price;
      ageGroups['46-65'].count++;
    }
  });

  return Object.values(ageGroups).map(group => 
    group.count > 0 ? group.sum / group.count : 0
  );
};

const handleResize = () => {
  if (myChart.value) {
    myChart.value.resize();
  }
};

// 监听数据变化
watch(() => props.orders, () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  myChart.value = echarts.init(document.getElementById("UserScoreBarChart"));
  renderChart();
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