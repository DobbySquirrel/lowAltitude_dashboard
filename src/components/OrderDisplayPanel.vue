<template>
  <div class="order-panel">
    <div class="panel-header">
      <h2>Order Display Panel</h2>
      <div class="status-indicators">
        <div class="indicator" @click="filterOrders('all')" :class="{ active: currentFilter === 'all' }">
          <div class="icon total"><i class="icon-list"></i></div>
          <span>Total</span>
        </div>
        <div class="indicator" @click="filterOrders('success')" :class="{ active: currentFilter === 'success' }">
          <div class="icon success"><i class="icon-check"></i></div>
          <span>Success</span>
        </div>
        <div class="indicator" @click="filterOrders('failed')" :class="{ active: currentFilter === 'failed' }">
          <div class="icon failed"><i class="icon-close"></i></div>
          <span>Failed</span>
        </div>
        <div class="indicator" @click="filterOrders('delivery')" :class="{ active: currentFilter === 'delivery' }">
          <div class="icon delivery"><i class="icon-truck"></i></div>
          <span>Delivery</span>
        </div>
      </div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search orders" 
          @input="applyFilters"
        />
      </div>
    </div>
    
    <div class="orders-container">
      <div class="order-card" v-for="order in filteredOrders" :key="order.id">
        <div class="order-content">
          <div class="order-icon">
            <img :src="getOrderIcon(order.type)" alt="Order Icon">
          </div>
          <div class="order-details">
            <div class="order-id">Order ID: {{ order.id }}</div>
            <div class="order-item">Item Name: {{ order.itemName }}</div>
            <div class="order-customer">Customer: {{ order.customer }}</div>
            <div class="order-delivery">Delivery Method: {{ order.deliveryMethod }}</div>
            <div class="order-status">Order Status: {{ order.status }}</div>
          </div>
        </div>
      </div>
      <div v-if="filteredOrders.length === 0" class="no-results">
        No matching orders found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { orderIcons } from '@/utils/orderIcons';

const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  }
});

const currentFilter = ref('all');
const searchQuery = ref('');

const getOrderIcon = (type) => {
  return orderIcons[type] || orderIcons.package;
};

const filteredOrders = computed(() => {
  let result = [...props.orders];
  
  // 应用状态过滤
  if (currentFilter.value === 'success') {
    result = result.filter(order => order.status.includes('送达') || order.status.includes('已送达'));
  } else if (currentFilter.value === 'failed') {
    result = result.filter(order => order.status.includes('失败'));
  } else if (currentFilter.value === 'delivery') {
    result = result.filter(order => 
      order.status.includes('备餐') || 
      order.status.includes('等待备餐') || 
      order.status.includes('配送中')
    );
  }
  
  // 应用搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(order => 
      order.id.toLowerCase().includes(query) ||
      order.itemName.toLowerCase().includes(query) ||
      order.customer.toLowerCase().includes(query) ||
      order.deliveryMethod.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  }
  
  return result;
});

const filterOrders = (filterType) => {
  currentFilter.value = filterType;
};
</script>

<style scoped>
.order-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(221, 221, 221, 0.4); /* 更透明的边框 */
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.4); /* 更透明的背景 */
  box-sizing: border-box;
  backdrop-filter: blur(2px);
}

.panel-header {
  padding: 10px;
  flex-shrink: 0; /* Prevent header from being compressed */
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  text-align: center;
  color: #333;
}

.status-indicators {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
}

.indicator {
  display: flex;
  align-items: center;
  padding: 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.indicator:hover {
  background-color: rgba(245, 245, 245, 0.85);
}

.indicator.active {
  background-color: rgba(230, 247, 255, 0.85);
  font-weight: bold;
}

.icon {
  width: 10px;
  height: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
}

.icon i {
  font-size: 10px;
}

.icon.total i, .icon.success i, .icon.failed i, .icon.delivery i {
  font-size: 10px;
}

.total {
  background-color: rgba(240, 240, 240, 0.85);
}

.success {
  background-color: rgba(245, 245, 245, 0.85);
  color: #2c3e50;
}

.failed {
  background-color: rgba(245, 245, 245, 0.85);
  color: #2c3e50;
}

.delivery {
  background-color: rgba(245, 245, 245, 0.85);
  color: #2c3e50;
}

.search-bar {
  margin-bottom: 10px;
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
}

.search-bar input {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(221, 221, 221, 0.8);
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  background-color: rgba(255, 255, 255, 0.85);
}

.search-bar input:focus {
  border-color: #2c3e50;
}

.orders-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  max-height: 500px;
  box-sizing: border-box;
  width: 100%;
  border: none; /* 移除边框 */
}
.orders-container::-webkit-scrollbar {
  width: 6px;
}

.orders-container::-webkit-scrollbar-track {
  background: rgba(241, 241, 241, 0.85);
  border-radius: 3px;
}

.orders-container::-webkit-scrollbar-thumb {
  background: rgba(221, 221, 221, 0.85);
  border-radius: 3px;
}

.orders-container::-webkit-scrollbar-thumb:hover {
  background: rgba(204, 204, 204, 0.85);
}
.order-card {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.3); /* 更透明的背景 */
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02); /* 更淡的阴影 */
  box-sizing: border-box;
  backdrop-filter: blur(1px); /* 减少模糊效果 */
}

.order-content {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

.order-icon {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-icon img {
  width: 30px;
  height: 30px;
}

.order-details {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.order-id, .order-item, .order-customer, .order-delivery, .order-status {
  margin-bottom: 4px;
  font-size: 12px;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.indicator span {
  font-size: 12px; /* 减小字体大小 */
}

/* 如果需要更小，可以设置为10px */
/* .indicator span {
  font-size: 10px;
} */

/* 添加全局样式 */
* {
  box-sizing: border-box;
}
</style>