<template>
  <div class="delivery-panel">
    <div class="panel-header">
      <h2>Delivery Role Panel</h2>
      <div class="role-indicators">
        <div class="role-indicator">
          <div class="role-icon">
            <img :src="orderIcons.drone" alt="Drone Icon">
          </div>
          <span>X{{ drones.length }}</span>
        </div>
        <div class="role-indicator">
          <div class="role-icon">
            <img :src="orderIcons.courier" alt="Courier Icon">
          </div>
          <span>X{{ couriers.length }}</span>
        </div>
      </div>
      <div class="role-buttons">
        <button class="role-button" @click="toggleFilter('drone')" :class="{ active: currentFilter === 'drone' }">Drone</button>
        <button class="role-button" @click="toggleFilter('courier')" :class="{ active: currentFilter === 'courier' }">Courier</button>
      </div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search orders" 
          @input="searchOrders"
        />
      </div>
    </div>
    
    <div class="orders-container">
      <div class="order-card" v-for="(role, index) in filteredRoles" :key="index">
        <div class="order-content">
          <div class="order-icon">
            <img :src="orderIcons[role.type]" alt="Order Icon">
          </div>
          <div class="order-details">
            <div class="order-item">编号: {{ role.id }}</div>
            <div class="order-status">状态: {{ role.status }}</div>
            
            <!-- 骑手多订单下拉框 -->
            <div v-if="role.type === 'courier'" class="order-dropdown">
              <div class="dropdown-field">
                <span>订单: </span>
                <select v-model="role.selectedOrder" @change="updateCustomer(role)">
                  <option v-for="(orderOption, idx) in role.orders" :key="idx" :value="orderOption.number">
                    {{ orderOption.number }}
                  </option>
                </select>
                <span class="dropdown-arrow">▼</span>
              </div>
              
              <div class="dropdown-field">
                <span>客户: </span>
                <select v-model="role.selectedCustomer" @change="updateOrder(role)">
                  <option v-for="(orderOption, idx) in role.orders" :key="idx" :value="orderOption.customer">
                    {{ orderOption.customer }}
                  </option>
                </select>
                <span class="dropdown-arrow">▼</span>
              </div>
            </div>
            
            <!-- 无人机单订单显示 -->
            <div v-else>
              <div class="order-number">Order: {{ role.orderNumber }}</div>
              <div class="order-customer">Customer: {{ role.customer }}</div>
            </div>
            
            <div class="order-location">位置: {{ role.location }}</div>
          </div>
        </div>
      </div>
      <div v-if="filteredRoles.length === 0" class="no-results">
        No matching roles found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { orderIcons } from '@/utils/orderIcons';

const props = defineProps({
  drones: {
    type: Array,
    default: () => []
  },
  couriers: {
    type: Array,
    default: () => []
  }
});

const currentFilter = ref(null);
const searchQuery = ref('');

const updateCustomer = (role) => {
  const selectedOrder = role.orders.find(o => o.number === role.selectedOrder);
  if (selectedOrder) {
    role.selectedCustomer = selectedOrder.customer;
  }
};

const updateOrder = (role) => {
  const selectedOrder = role.orders.find(o => o.customer === role.selectedCustomer);
  if (selectedOrder) {
    role.selectedOrder = selectedOrder.number;
  }
};

const filteredRoles = computed(() => {
  let result = [];
  
  // 根据类型筛选
  if (!currentFilter.value || currentFilter.value === 'drone') {
    result.push(...props.drones.map(drone => ({ ...drone, type: 'drone' })));
  }
  if (!currentFilter.value || currentFilter.value === 'courier') {
    result.push(...props.couriers.map(courier => ({ ...courier, type: 'courier' })));
  }
  
  // 应用搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(role => {
      const basicMatch = 
        role.id.toLowerCase().includes(query) ||
        role.status.toLowerCase().includes(query) ||
        role.location.toLowerCase().includes(query);
        
      if (role.type === 'drone') {
        return basicMatch ||
          role.orderNumber?.toLowerCase().includes(query) ||
          role.customer?.toLowerCase().includes(query);
      } else {
        return basicMatch ||
          role.orders.some(order => 
            order.number.toLowerCase().includes(query) ||
            order.customer.toLowerCase().includes(query)
          );
      }
    });
  }
  
  return result;
});

const toggleFilter = (type) => {
  currentFilter.value = currentFilter.value === type ? null : type;
};
</script>

<style scoped>
.delivery-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(221, 221, 221, 0.4);
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.4);
  font-family: Arial, sans-serif;
  box-sizing: border-box;
  backdrop-filter: blur(2px);
}

.panel-header {
  padding: 10px;
  flex-shrink: 0;
}

.panel-header h2 {
  margin: 0 0 10px;
  font-size: 16px;
  text-align: center;
  color: #333;
}

.role-indicators {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.role-indicator {
  display: flex;
  align-items: center;
  margin: 0 15px;
  color: #666;
}

.role-icon {
  width: 24px;
  height: 24px;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-icon img {
  width: 24px;
  height: 24px;
  opacity: 0.6;
}

.role-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.role-button {
  flex: 1;
  margin: 0 5px;
  padding: 8px;
  background-color: rgba(245, 245, 245, 0.85);
  border: none;
  border-radius: 4px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.role-button:hover {
  background-color: rgba(224, 224, 224, 0.85);
}

.role-button.active {
  background-color: rgba(44, 62, 80, 0.85);
  color: white;
  font-weight: bold;
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
}

.order-card {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  min-height: 130px;
  box-sizing: border-box;
  backdrop-filter: blur(1px);
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

.order-item, .order-status, .order-number, .order-customer, .order-location {
  margin-bottom: 4px;
  font-size: 12px;
}

/* 下拉框样式 */
.order-dropdown {
  margin-bottom: 4px;
}

.dropdown-field {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  position: relative;
  background-color: rgba(245, 245, 245, 0.3);
  border-radius: 4px;
  padding: 4px 8px;
}

.dropdown-field span {
  font-size: 12px;
  margin-right: 5px;
}

.dropdown-field select {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  padding-right: 15px;
  appearance: none;
  outline: none;
}

.dropdown-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 8px;
  color: #666;
  pointer-events: none;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* 自定义滚动条样式 */
.orders-container::-webkit-scrollbar {
  width: 6px;
}

.orders-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.orders-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.orders-container::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>