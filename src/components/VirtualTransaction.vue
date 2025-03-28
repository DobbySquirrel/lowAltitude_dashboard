<template>
  <div class="virtual-transaction">
    <div class="transaction-container">
      <h2 class="title">Virtual Interaction Platform</h2>
      
      <div class="main-content">
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
              <el-radio-group v-model="form.deliveryMethod">
                <el-radio-button label="indoor">Indoor Delivery</el-radio-button>
                <el-radio-button label="outdoor">Outdoor Delivery</el-radio-button>
                <el-radio-button label="drone">Drone Delivery</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <el-button type="primary" 
                     class="submit-btn" 
                     icon="el-icon-check"
                     @click="submitOrder">
            Confirm Order
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { messageHandler } from '../utils/messageHandler'
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
      restaurants: [
        { name: '逸林' },
        { name: '肯德基' },
        { name: '贵粉' },
        { name: '真功夫' }
      ],
      pickupPoints: [
        { name: '逸林', icon: 'el-icon-location' },
        { name: '肯德基', icon: 'el-icon-location' },
        { name: '贵粉', icon: 'el-icon-location' },
        { name: '真功夫', icon: 'el-icon-location' }
      ],
      items: [
        { label: '炸鸡套餐', value: 'chicken' },
        { label: '汉堡套餐', value: 'burger' },
        { label: '米粉套餐', value: 'rice' },
        { label: '饮品', value: 'drink' }
      ]
    }
  },
  computed: {
    latestOrderStatus() {
      return messageReceiver.latestOrderStatus.value;
    }
  },
  watch: {
    latestOrderStatus(newStatus) {
      if (newStatus) {
        // 显示订单状态更新
        this.$message({
          type: 'success',
          message: `订单状态: ${newStatus.status}`
        });
      }
    }
  },
  methods: {
    selectRestaurant(name) {
      this.selectedRestaurant = name;
    },
    selectPickup(name) {
      this.selectedPickup = name;
    },
    submitOrder() {
      // 表单验证
      if (!this.selectedRestaurant) {
        this.$message.warning('请选择餐厅');
        return;
      }
      if (!this.selectedPickup) {
        this.$message.warning('请选择取餐点');
        return;
      }
      if (!this.form.username) {
        this.$message.warning('请输入用户名');
        return;
      }
      if (this.form.selectedItems.length === 0) {
        this.$message.warning('请选择商品');
        return;
      }
      if (!this.form.deliveryMethod) {
        this.$message.warning('请选择配送方式');
        return;
      }

      const orderData = {
        selectedRestaurant: this.selectedRestaurant,
        selectedPickup: this.selectedPickup,
        username: this.form.username,
        selectedItems: this.form.selectedItems,
        deliveryMethod: this.form.deliveryMethod
      };
      
      messageHandler.sendOrder(orderData);
      
      // 提交后的提示
      this.$message.success('订单已提交，请等待确认');
      
      // 清空表单
      this.form.selectedItems = [];
      this.form.deliveryMethod = '';
      this.selectedRestaurant = '';
      this.selectedPickup = '';
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
</style> 