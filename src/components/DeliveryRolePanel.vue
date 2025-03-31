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
      <div 
        class="order-card" 
        v-for="role in filteredRoles" 
        :key="role.id"
        :class="{
          'card-expanded': role.type === 'courier' && role.orders?.length > 1
        }"
      >
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: getProgressWidth(role.status) }"
            :class="getProgressClass(role.status)"
          ></div>
          <div class="progress-steps">
            <div class="step" :class="{ active: isStepActive('Ordered', role.status) }">
              Ordered
            </div>
            <div class="step" :class="{ active: isStepActive('Preparing', role.status) }">
              Preparing
            </div>
            <div class="step" :class="{ active: isStepActive('Delivering', role.status) }">
              Delivering
            </div>
            <div class="step" :class="{ active: isStepActive('Completed', role.status) }">
              Completed
            </div>
          </div>
        </div>

        <div class="order-content">
          <div class="order-icon">
            <img :src="orderIcons[role.type]" alt="Order Icon">
          </div>
          <div class="order-details">
            <div class="order-item">ID: {{ role.id }}</div>
            
            <!-- Courier multiple orders display -->
            <div v-if="role.type === 'courier' && role.orders" class="orders-list">
              <div class="orders-header">Orders ({{ role.orders.length }}):</div>
              <div 
                v-for="order in role.orders" 
                :key="order.number"
                class="order-row"
                :class="{ 'status-updated': order.status === '已下单' }"
              >
                <span class="order-number">#{{ order.number }}</span>
                <span class="order-customer">{{ order.customer }}</span>
              </div>
            </div>
            
            <!-- Drone single order display -->
            <div v-else class="single-order">
              <div class="order-row">
                <span class="order-number">#{{ role.orderNumber }}</span>
                <span class="order-customer">{{ role.customer }}</span>
              </div>
            </div>
            
            <div class="order-location">Location: {{ role.location }}</div>
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
import { ref, computed, watch } from 'vue';
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
  
  // 统一数据结构
  const normalizedDrones = props.drones.map(drone => ({
    ...drone,
    type: 'drone',
    orders: drone.orderNumber ? [{
      number: drone.orderNumber,
      customer: drone.customer
    }] : []
  }));

  const normalizedCouriers = props.couriers.map(courier => ({
    ...courier,
    type: 'courier'
  }));
  
  // 根据类型筛选
  if (!currentFilter.value || currentFilter.value === 'drone') {
    result.push(...normalizedDrones);
  }
  if (!currentFilter.value || currentFilter.value === 'courier') {
    result.push(...normalizedCouriers);
  }
  
  // 应用搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(role => {
      const basicMatch = 
        role.id.toLowerCase().includes(query) ||
        role.status.toLowerCase().includes(query) ||
        role.location.toLowerCase().includes(query);
        
      return basicMatch ||
        role.orders.some(order => 
          order.number.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query)
        );
    });
  }
  
  // 反转数组顺序，使新项目出现在顶部
  return result.reverse();
});

const toggleFilter = (type) => {
  currentFilter.value = currentFilter.value === type ? null : type;
};

// 将状态相关的常量和函数移到前面
const STATUS_MAP = {
  '已下单': 'Ordered',
  '准备中': 'Preparing',
  '配送中': 'Delivering',
  '已送达': 'Completed'
};

const previousStates = ref(new Map());

// 状态监听逻辑移到前面
watch(() => props.roles, (newRoles) => {
  newRoles.forEach(role => {
    const prevState = previousStates.value.get(role.id);
    if (prevState) {
      if (role.type === 'drone') {
        role.statusChanged = prevState.status !== role.status;
      } else {
        role.orders.forEach(order => {
          const prevOrder = prevState.orders.find(o => o.number === order.number);
          order.statusChanged = prevOrder && prevOrder.status !== order.status;
        });
      }
    }
    previousStates.value.set(role.id, JSON.parse(JSON.stringify(role)));
  });
}, { deep: true });

const getProgressWidth = (status) => {
  console.log('计算进度条宽度，当前状态:', status);
  if (!status) {
    console.log('状态为空，返回 0%');
    return '0%';
  }
  
  const steps = ['已下单', '准备中', '配送中', '已送达'];
  const index = steps.indexOf(status);
  console.log('状态在步骤中的索引:', index);
  if (index === -1) {
    console.log('未找到对应状态，返回 0%');
    return '0%';
  }
  const width = `${((index + 1) / steps.length) * 100}%`;
  console.log('计算得到的宽度:', width);
  return width;
};

const getProgressClass = (status) => {
  console.log('获取进度条样式类，当前状态:', status);
  if (!status) {
    console.log('状态为空，返回默认样式');
    return 'progress-ordered';
  }
  
  const statusKey = Object.entries(STATUS_MAP).find(([key]) => key === status)?.[1];
  console.log('映射后的状态:', statusKey);
  const className = `progress-${(statusKey || 'ordered').toLowerCase()}`;
  console.log('返回的样式类名:', className);
  return className;
};

const isStepActive = (step, status) => {
  console.log('检查步骤是否激活:', { step, status });
  if (!status) {
    console.log('状态为空，返回 false');
    return false;
  }
  
  const steps = ['已下单', '准备中', '配送中', '已送达'];
  const currentIndex = steps.indexOf(status);
  const stepIndex = steps.indexOf(step);
  console.log('当前索引和步骤索引:', { currentIndex, stepIndex });
  const isActive = currentIndex >= stepIndex && stepIndex !== -1;
  console.log('步骤是否激活:', isActive);
  return isActive;
};

// 添加计算属性来查看过滤后的角色数据
const filteredRolesDebug = computed(() => {
  console.log('过滤角色数据:', {
    drones: props.drones,
    couriers: props.couriers,
    currentFilter: currentFilter.value,
    searchQuery: searchQuery.value
  });
  return filteredRoles.value;
});

const formatLocation = (location) => {
  return location.split(', ')
    .map(coord => Number(coord).toFixed(4))
    .join(', ');
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
  padding: 8px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  min-height: 90px;
  transition: all 0.3s ease;
}

.order-content {
  display: flex;
  padding: 6px;
  gap: 8px;
}

.order-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.7;
}

.order-details {
  flex: 1;
}

.order-item {
  font-size: 11px;
  color: #999;
  margin-bottom: 3px;
}

.order-dropdown {
  margin: 8px 0;
}

.dropdown-field {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
  gap: 8px;
}

.dropdown-field select {
  flex: 1;
  padding: 1px 16px 1px 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  appearance: none;
  font-size: 11px;
}

.dropdown-arrow {
  margin-left: -20px;
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

.status-updated {
  animation: highlightUpdate 2s ease;
}

.progress-bar {
  position: relative;
  height: 20px;
  margin: 6px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease, background-color 0.5s ease;
}

.progress-ordered {
  background-color: rgba(64, 158, 255, 0.6);
}

.progress-delivering {
  background-color: rgba(230, 162, 60, 0.6);
}

.progress-completed {
  background-color: rgba(103, 194, 58, 0.6);
}

.progress-steps {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.step {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
  z-index: 1;
}

.step.active {
  color: white;
  font-weight: 500;
}

.single-order {
  margin: 4px 0;
}

.single-order .order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 4px;
  margin: 2px 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.05);
}

.order-location {
  font-size: 11px;
  color: #888;
  margin-top: 3px;
}

.orders-list {
  margin: 4px 0;
  max-height: 80px; /* 限制最大高度 */
  overflow-y: auto; /* 添加滚动条 */
}

.orders-list::-webkit-scrollbar {
  width: 4px;
}

.orders-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.orders-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.orders-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.orders-header {
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 4px;
  margin: 2px 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.order-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.order-row.status-updated {
  animation: highlightUpdate 2s ease;
}

.order-number {
  font-size: 11px;
  color: #aaa;
  min-width: 60px;
}

.order-customer {
  font-size: 11px;
  color: #ddd;
  text-align: right;
  flex: 1;
}

@keyframes highlightUpdate {
  0% {
    background-color: rgba(255, 255, 255, 0.05);
  }
  50% {
    background-color: rgba(0, 191, 255, 0.15);
  }
  100% {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

/* 添加列表项动画 */
.order-list-enter-active,
.order-list-leave-active {
  transition: all 0.5s ease;
}

.order-list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.order-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.order-list-move {
  transition: transform 0.5s ease;
}
</style>