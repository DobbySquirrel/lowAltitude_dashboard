<template>
  <div class="virtual-transaction">
    <div class="transaction-container">
      <h2 class="title">Virtual Interaction Platform</h2>
      
      <div v-if="isInitializing" class="initializing-overlay">
        <el-icon class="loading-icon"><loading /></el-icon>
        <span>Initializing System...</span>
      </div>
      
      <div class="main-content" v-else>
        <!-- 左侧餐厅部分 -->
        <div class="section restaurant-section">
          <h3><i class="el-icon-shop"></i> Restaurant Selection</h3>
          <div class="card-grid">
            <div v-for="restaurant in restaurants" :key="restaurant.name" 
                 class="restaurant-card" 
                 :class="{ active: selectedRestaurant === restaurant.name }"
                 @click="selectRestaurant(restaurant.name)">
              <span class="restaurant-name">{{ restaurant.name }}</span>
            </div>
          </div>
        </div>

        <!-- 中间取餐点部分 -->
        <div class="section pickup-section">
          <h3><i class="el-icon-position"></i> Pickup Location</h3>
          <div class="card-grid">
            <div v-for="point in pickupPoints" :key="point.name" 
                 class="pickup-card"
                 :class="{ active: selectedPickup === point.name }"
                 @click="selectPickup(point.name)">
              <i :class="point.icon"></i>
              <span class="pickup-name">{{ point.name }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧用户信息部分 -->
        <div class="section user-section">
          <h3><i class="el-icon-user"></i> Order Information</h3>
          <el-form :model="form" label-position="top">
            <el-form-item label="Username">
              <el-input v-model="form.username" placeholder="Please enter username">
                <template #prefix><i class="el-icon-user"></i></template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="Items">
              <el-select v-model="form.selectedItems" placeholder="Please select items" multiple>
                <el-option v-for="item in items" 
                          :key="item.value" 
                          :label="item.label" 
                          :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="Delivery Method">
              <el-select v-model="form.deliveryMethod" placeholder="Please select drone">
                <el-option 
                  v-for="droneId in availableDrones" 
                  :key="droneId"
                  :label="`Drone ${droneId}`"
                  :value="droneId">
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <el-button type="primary" 
                     class="submit-btn" 
                     icon="el-icon-check"
                     @click="submitOrder">
            Confirm Order
          </el-button>
        </div>

        <!-- 添加订单状态显示 -->
        <div v-if="latestOrderStatus" class="order-status">
          <el-alert
            :title="`Order ${latestOrderStatus.id}`"
            :description="`Status: ${latestOrderStatus.status} | Drone: ${latestOrderStatus.droneId}`"
            :type="getStatusType(latestOrderStatus.status)"
            show-icon
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { messageHandler, initializeMessageHandler } from '../utils/messageHandler'
import { wsClient } from '../utils/wsClient'
import { messageReceiver } from '../utils/messageReceiver'

export default {
  name: 'VirtualTransaction',
  data() {
    return {
      form: {
        username: '',
        selectedItems: [],
        deliveryMethod: ''
      },
      selectedRestaurant: '',
      selectedPickup: '',
      restaurants: [],
      pickupPoints: [],
      items: [
        { label: 'chicken', value: 'chicken' },
        { label: 'burger', value: 'burger' },
        { label: 'rice', value: 'rice' },
        { label: 'drink', value: 'drink' }
      ],
      isInitializing: true
    }
  },
  computed: {
    latestOrderStatus() {
      return messageReceiver.latestOrderStatus.value;
    },
    availableDrones() {
      return messageReceiver.worldData.value?.drone_ids || [];
    }
  },
  watch: {
    'messageReceiver.worldData.value': {
      handler(newData) {
        if (newData) {
          this.initializeData(newData);
        }
      },
      immediate: true,
      deep: true
    },
    latestOrderStatus(newStatus) {
      if (newStatus) {
        this.$message({
          type: 'success',
          message: `Order Status: ${newStatus.status}`
        });
      }
    },
    isInitializing(newVal) {
      console.log('isInitializing changed to:', newVal);
    }
  },
  created() {
    console.log('Component created');
    const worldData = messageReceiver.worldData.value;
    if (worldData) {
      this.initializeData(worldData);
    }
    initializeMessageHandler(wsClient);
  },
  beforeUnmount() {
    wsClient.disconnect();
  },
  methods: {
    initializeData(data) {
      console.log('Initializing with data:', data);
      
      if (Array.isArray(data.merchant_names)) {
        this.restaurants = data.merchant_names.map((name, index) => ({
          name,
          id: data.merchant_ids?.[index] || name,
          coordinates: data.merchant_coordinates?.[index] || []
        }));
      }
      
      if (Array.isArray(data.cabinets_ids)) {
        this.pickupPoints = data.cabinets_ids.map((id, index) => ({
          name: id,
          icon: 'el-icon-location',
          coordinates: data.cabinets_coordinates?.[index] || []
        }));
      }
      
      if (this.restaurants.length > 0 && this.pickupPoints.length > 0) {
        this.isInitializing = false;
      }
    },
    selectRestaurant(name) {
      console.log('选择餐厅:', name);
      this.selectedRestaurant = name;
    },
    selectPickup(name) {
      console.log('选择取餐点:', name);
      this.selectedPickup = name;
    },
    getStatusType(status) {
      const statusMap = {
        'submitted': 'info',
        'processing': 'warning',
        'completed': 'success',
        'failed': 'error'
      };
      return statusMap[status] || 'info';
    },
    submitOrder() {
      if (!this.validateOrder()) {
        return;
      }

      const selectedRestaurant = this.restaurants.find(r => r.name === this.selectedRestaurant);
      const selectedPickupPoint = this.pickupPoints.find(p => p.name === this.selectedPickup);

      if (!selectedRestaurant || !selectedPickupPoint) {
        this.$message.error('无法找到选中的餐厅或取餐点信息');
        return;
      }

      const orderData = {
        order_id: '',
        priority: 0,
        good: this.form.selectedItems,
        customer_name: this.form.username,
        customer_point: selectedPickupPoint.name,
        merchant_name: selectedRestaurant.name,
        merchant_point: selectedRestaurant.id,
        customer_coordinates: selectedPickupPoint.coordinates,
        merchant_coordinates: selectedRestaurant.coordinates,
        order_mode: "ORDER_PLACE",
        consumer_order_timestamp: Date.now(),
        selected_drone_id: this.form.deliveryMethod
      };

      console.log('提交订单数据:', orderData);
      messageHandler.sendOrder(orderData);
      this.resetForm();
    },
    validateOrder() {
      if (!this.selectedRestaurant) {
        this.$message.warning('Please select a restaurant');
        return false;
      }
      if (!this.selectedPickup) {
        this.$message.warning('Please select a pickup location');
        return false;
      }
      if (!this.form.username) {
        this.$message.warning('Please enter username');
        return false;
      }
      if (this.form.selectedItems.length === 0) {
        this.$message.warning('Please select items');
        return false;
      }
      if (!this.form.deliveryMethod) {
        this.$message.warning('Please select a drone');
        return false;
      }
      return true;
    },
    getRestaurantId(restaurantName) {
      const restaurant = this.restaurants.find(r => r.name === restaurantName);
      return restaurant ? restaurant.id : null;
    },
    resetForm() {
      this.form.selectedItems = [];
      this.form.deliveryMethod = '';
      this.selectedRestaurant = '';
      this.selectedPickup = '';
      this.$message.success('Order submitted successfully');
    }
  }
}
</script>

<style scoped>
.virtual-transaction {
  padding: 10px;
  min-height: auto;
  background-color: #f0f2f5;
  display: flex;
  align-items: flex-start;
}

.transaction-container {
  max-width: none;
  margin: 0 auto;
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
}

.title {
  text-align: center;
  margin-bottom: 40px;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 500;
}

.main-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.section {
  background: #ffffff;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.restaurant-card, .pickup-card {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.restaurant-card:hover, .pickup-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.restaurant-card.active, .pickup-card.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.restaurant-name, .pickup-name {
  font-size: 15px;
  color: #606266;
  line-height: 1.5;
}

.el-form-item {
  margin-bottom: 28px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  margin-top: 24px;
  border-radius: 8px;
  letter-spacing: 1px;
}

.el-radio-group {
  display: flex;
  flex-direction: row;
  gap: 14px;
}

.el-radio-button {
  margin-right: 0;
}

:deep(.el-radio-button__inner) {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  color: #409EFF;
  background-color: #ecf5ff;
  border-color: #409EFF;
  box-shadow: -1px 0 0 0 #409EFF;
}

:deep(.el-radio-button:first-child .el-radio-button__inner),
:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 4px;
}

.initializing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 1000;
}

.loading-icon {
  font-size: 48px;
  color: #409EFF;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.order-status {
  margin: 20px 0;
}
</style> 