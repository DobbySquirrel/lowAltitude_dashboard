import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDataStore = defineStore('data', () => {
  const dashboardData = ref({
    // Header组件数据 - 只需要碳排放和回收箱数据
    header: {
      carbonReduction: 0,    // 碳排放减少量
      recycledBoxes: 0       // 回收箱数量
    },
    
    // OrderDisplayPanel组件数据 - 显示订单列表
    orderDisplay: {
      orders: []  // 订单列表
    },
    
    // OrderCountChart组件数据 - 各类订单数量统计
    orderCount: {
      droneOrders: [],      // 无人机订单数量趋势
      indoorOrders: [],     // 室内车订单数量趋势
      outdoorOrders: []     // 室外车订单数量趋势
    },
    
    // UserScoreBarChart组件数据 - 用户积分排行
    userScore: {
      rankings: []  // 用户积分排名数据
    },
    
    // OccupancyChart组件数据 - 设备占用率
    occupancy: {
      devices: {
        locker: { total: 0, used: 0 },
        indoorCar: { total: 0, used: 0 },
        outdoorCar: { total: 0, used: 0 },
        drone: { total: 0, used: 0 }
      }
    },
    
    // DeliveryRolePanel组件数据 - 配送角色信息
    deliveryRole: {
      drones: [],    // 无人机状态列表
      couriers: []   // 配送员状态列表
    }
  });

  const updateDashboardData = (newData) => {
    Object.assign(dashboardData.value, newData);
  };

  return {
    dashboardData,
    updateDashboardData
  };
}); 