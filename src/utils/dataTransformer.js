import { ref } from 'vue';

// 用于存储累积数据的对象
let accumulatedData = {
    humanSuccessOrders: 0,
    droneSuccessOrders: 0,
    orders: [],
    droneOrderTrend: Array(60).fill(0),  // 初始化为60分钟的数组
    humanOrderTrend: Array(60).fill(0),   // 初始化为60分钟的数组
    lastDayOrders: [],
    activeDrones: [],
    activeCouriers: [],
    lastUpdate: null
};

// 添加状态常量
const STATUS_MAP = {
  'Ordered': '已下单',
  'Preparing': '准备中',
  'Delivering': '配送中',
  'Completed': '已送达'
};

// 新增：用于跟踪角色状态的 Map
const completedRoles = new Map();

// 添加坐标处理的辅助函数
function getFormattedLocation(coordinates) {
    if (!coordinates || coordinates.length < 2) {
        return '未知位置';
    }
    try {
        return `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`;
    } catch (error) {
        console.error('坐标格式化错误:', error);
        return '未知位置';
    }
}

// 添加状态转换函数
function getDeliveryStatus(status) {
    // 如果状态已经是中文，直接返回
    if (Object.values(STATUS_MAP).includes(status)) {
        return status;
    }
    // 如果是英文状态，转换为中文
    if (STATUS_MAP[status]) {
        return STATUS_MAP[status];
    }
    // 默认返回"已下单"
    return '已下单';
}

// 清理和更新24小时数据
function cleanupAndUpdateData(data) {
    try {
        // 检查数据结构
        if (data.type === 'order-data' && data.data) {
            data = data.data;  // 解包一层数据
        }

        // 确保时间戳是有效的
        const timestamp = data.createTime || data.customer_order_timestamp * 1000;
        if (!timestamp || isNaN(timestamp)) {
            console.warn('无效的时间戳:', data);
            data.createTime = Date.now(); // 使用当前时间作为后备
        } else {
            data.createTime = timestamp;
        }

        // 处理坐标
        if (data.merchant_coordinates && Array.isArray(data.merchant_coordinates)) {
            data.merchant_location = getFormattedLocation(data.merchant_coordinates);
        } else {
            data.merchant_location = '未知位置';
        }

        if (data.customer_coordinates && Array.isArray(data.customer_coordinates)) {
            data.customer_location = getFormattedLocation(data.customer_coordinates);
        } else {
            data.customer_location = '未知位置';
        }

        // 确保必要的字段都存在
        data.status = data.status || '未知';
        data.deliveryMethod = data.deliveryMethod || '未知';
        data.price = data.price || 0;
        data.customer = data.customer || '未知客户';
        data.merchant = data.merchant || '未知商家';

        return data;
    } catch (error) {
        console.error('数据清理错误:', error);
        return null;
    }
}

// 重构：合并重复的配送角色更新逻辑
function updateDeliveryRole(data) {
    const roleId = `${data.deliveryMethod === '无人机配送' ? 'drone' : 'courier'}-${data.id}`;
    
    // 确保状态正确
    let currentStatus = getDeliveryStatus(data.status);


    const roleData = {
        id: roleId,
        type: data.deliveryMethod === '无人机配送' ? 'drone' : 'courier',
        status: currentStatus,
        location: data.merchant_coordinates && Array.isArray(data.merchant_coordinates) && data.merchant_coordinates.length >= 2
            ? `${data.merchant_coordinates.slice(0, 2).map(coord => Number(coord).toFixed(4)).join(', ')}`
            : '0.0000, 0.0000'
    };

    // 根据类型添加特定属性
    if (data.deliveryMethod === '无人机配送') {
        roleData.orderNumber = data.id;
        roleData.customer = data.customer;
    } else {
        roleData.orders = [{
            number: data.id,
            customer: data.customer,
            status: currentStatus
        }];
    }

    // 处理完成状态
    if (currentStatus === '已送达') {
        if (!completedRoles.has(roleId)) {
            completedRoles.set(roleId, {
                completedAt: Date.now(),
                data: roleData
            });
        }
        // 设置延时清理
        setTimeout(() => {
            completedRoles.delete(roleId);
            if (data.deliveryMethod === '无人机配送') {
                accumulatedData.activeDrones = accumulatedData.activeDrones.filter(d => d.id !== roleId);
            } else {
                accumulatedData.activeCouriers = accumulatedData.activeCouriers.filter(c => c.id !== roleId);
            }
        }, 60000); // 1分钟后清理
    }

    return roleData;
}

// 修改数据累积逻辑
function updateAccumulatedData(cleanedData) {
    if (!cleanedData) return;

    // 查找是否存在相同ID的订单
    const existingOrderIndex = accumulatedData.orders.findIndex(order => order.id === cleanedData.id);
    const existingOrder = existingOrderIndex !== -1 ? accumulatedData.orders[existingOrderIndex] : null;

    if (existingOrder) {
        // 如果订单状态从非"已送达"变为"已送达"，更新计数
        if (existingOrder.status !== '已送达' && cleanedData.status === '已送达') {
            if (cleanedData.deliveryMethod === '人工配送') {
                accumulatedData.humanSuccessOrders++;
 
            } else if (cleanedData.deliveryMethod === '无人机配送') {
                accumulatedData.droneSuccessOrders++;
         
            }
        }

        // 更新订单状态
        accumulatedData.orders[existingOrderIndex] = {
            ...existingOrder,
            ...cleanedData
        };

        // 如果订单已送达，设置延时移除
        if (cleanedData.status === '已送达') {
            setTimeout(() => {
                accumulatedData.orders = accumulatedData.orders.filter(order => order.id !== cleanedData.id);
            }, 5000);
        }
    } else {
        // 添加新订单
        accumulatedData.orders.unshift(cleanedData);

        // 如果新订单已经是"已送达"状态
        if (cleanedData.status === '已送达') {
            if (cleanedData.deliveryMethod === '人工配送') {
                accumulatedData.humanSuccessOrders++;
                
            } else if (cleanedData.deliveryMethod === '无人机配送') {
                accumulatedData.droneSuccessOrders++;
            
            }
        }

        // 更新配送趋势，改为按分钟统计
        if (cleanedData.deliveryMethod === '无人机配送') {
            const date = new Date(cleanedData.createTime);
            const minute = date.getMinutes();
            accumulatedData.droneOrderTrend[minute] = (accumulatedData.droneOrderTrend[minute] || 0) + 1;
          
        } else {
            const date = new Date(cleanedData.createTime);
            const minute = date.getMinutes();
            accumulatedData.humanOrderTrend[minute] = (accumulatedData.humanOrderTrend[minute] || 0) + 1;
           
        }

        // 更新活跃配送员/无人机
        if (cleanedData.deliveryMethod === '无人机配送') {
            const droneData = {
                id: `DRONE-${cleanedData.id}`,
                status: getDeliveryStatus(cleanedData.status),
                location: cleanedData.merchant_location,
                destination: cleanedData.customer_location
            };
            const existingIndex = accumulatedData.activeDrones.findIndex(d => d.id === droneData.id);
            if (existingIndex !== -1) {
                accumulatedData.activeDrones[existingIndex] = droneData;
            } else {
                accumulatedData.activeDrones.push(droneData);
            }
        } else {
            const courierData = {
                id: `COURIER-${cleanedData.id}`,
                status: getDeliveryStatus(cleanedData.status),
                location: cleanedData.merchant_location,
                destination: cleanedData.customer_location
            };
            const existingIndex = accumulatedData.activeCouriers.findIndex(c => c.id === courierData.id);
            if (existingIndex !== -1) {
                accumulatedData.activeCouriers[existingIndex] = courierData;
            } else {
                accumulatedData.activeCouriers.push(courierData);
            }
        }
    }
}

export function transformOrderToDashboard(data) {
    
    if (!data) {
        console.error('No data received');
        return null;
    }

    try {
        const cleanedData = cleanupAndUpdateData(data);
        if (!cleanedData) {
            return null;
        }

        // 更新累积数据
        updateAccumulatedData(cleanedData);

        // 构建仪表盘数据
        const dashboardData = {
            header: {
                humanSuccessOrders: accumulatedData.humanSuccessOrders,
                droneSuccessOrders: accumulatedData.droneSuccessOrders
            },
            orderDisplay: {
                orders: [...accumulatedData.orders]
            },
            orderCount: {
                droneOrders: accumulatedData.droneOrderTrend.map((value, index) => ({
                    time: `${Math.floor(index / 60).toString().padStart(2, '0')}:${(index % 60).toString().padStart(2, '0')}`,
                    value: value
                })),
                humanOrders: accumulatedData.humanOrderTrend.map((value, index) => ({
                    time: `${Math.floor(index / 60).toString().padStart(2, '0')}:${(index % 60).toString().padStart(2, '0')}`,
                    value: value
                }))
            },
            userScore: {
                orders: [...accumulatedData.orders]
            },
            occupancy: {
                orders: [...accumulatedData.orders]
            },
            deliveryRole: {
                drones: [...accumulatedData.activeDrones],
                couriers: [...accumulatedData.activeCouriers]
            }
        };


        return dashboardData;
    } catch (error) {
        console.error('Error transforming data:', error);
        return null;
    }
}

// 计算每日趋势
function calculateDailyTrend() {
    const last24Hours = new Array(24).fill(0);
    const now = new Date();
    
    accumulatedData.lastDayOrders.forEach(order => {
        const hourDiff = Math.floor((now - order.customer_order_timestamp * 1000) / (1000 * 60 * 60));
        if (hourDiff >= 0 && hourDiff < 24) {
            last24Hours[23 - hourDiff]++;
        }
    });
    
    return last24Hours;
}

// 计算订单趋势
function calculateOrderTrends() {
    return {
        growth: calculateGrowthRate(),
        peakHours: findPeakHours(),
    };
}

// 计算增长率
function calculateGrowthRate() {
    if (accumulatedData.lastDayOrders.length < 2) return 0;
    
    const recentHours = 6; // 比较最近6小时
    const now = Date.now();
    const sixHoursAgo = now - (recentHours * 60 * 60 * 1000);
    
    const recentOrders = accumulatedData.lastDayOrders.filter(
        order => order.customer_order_timestamp * 1000 > sixHoursAgo
    );
    
    return (recentOrders.length / recentHours).toFixed(2);
}

// 找出高峰时段
function findPeakHours() {
    const hourCounts = accumulatedData.droneOrderTrend;
    const maxCount = Math.max(...hourCounts);
    return hourCounts.map((count, hour) => ({
        hour,
        isPeak: count > maxCount * 0.8  // 80%的最大值认为是高峰
    }));
}

// 计算当前负载
function calculateCurrentLoad() {
    const recentOrders = accumulatedData.lastDayOrders.filter(
        order => order.customer_order_timestamp * 1000 > Date.now() - 3600000  // 最近1小时
    );
    
    return Math.min(Math.round((recentOrders.length / 20) * 100), 100);  // 假设每小时20单为满载
}

// 更新 transformDeliveryData 函数
export function transformDeliveryData(data, existingDrones, existingCouriers) {
  // 清理过期的完成角色
  const now = Date.now();
  for (const [id, info] of completedRoles.entries()) {
    if (now - info.completedAt > 60000) {
      completedRoles.delete(id);
    }
  }

  const roleData = updateDeliveryRole(data);
  
  if (data.deliveryMethod === '无人机配送') {
    return [...existingDrones.filter(d => d.id !== roleData.id), roleData];
  } else {
    return [...existingCouriers.filter(c => c.id !== roleData.id), roleData];
  }
}

