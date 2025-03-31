// 存储已生成的订单
let generatedOrders = [];
const ORDER_COUNT = 100;

// 生成随机数据
export const generateMockData = () => {
  // 更新现有订单的状态
  if (generatedOrders.length > 0) {
    const orderToUpdate = generatedOrders[Math.floor(Math.random() * generatedOrders.length)];
    const currentTime = Date.now();
    const orderAge = currentTime - orderToUpdate.data.createTime;

    // 修改状态更新逻辑
    if (orderToUpdate.data.status === "已下单" && orderAge > 5000) { // 5秒后更新状态
      orderToUpdate.data.status = "准备中";
    } else if (orderToUpdate.data.status === "准备中" && orderAge > 15000) { // 15秒后更新状态
      orderToUpdate.data.status = "配送中";
    } else if (orderToUpdate.data.status === "配送中" && orderAge > 30000) { // 30秒后更新状态
      orderToUpdate.data.status = "已送达";
    }
  }

  // 生成多个订单的概率
  const shouldGenerateMultiple = Math.random() < 0.3; // 30%的概率生成多个订单
  const numberOfOrders = shouldGenerateMultiple ? Math.floor(Math.random() * 3) + 2 : 1; // 2-4个订单或1个订单

  let generatedData = [];

  // 如果订单数量少于指定数目，继续生成新订单
  if (generatedOrders.length < ORDER_COUNT) {
    for (let i = 0; i < numberOfOrders; i++) {
      if (generatedOrders.length >= ORDER_COUNT) break;

      const good = {
        name: `商品-${generatedOrders.length + 1}`,
        price: Math.floor(Math.random() * 91) + 10,
        fragile: Math.random() > 0.5
      };

      const customer = {
        name: `消费者-${generatedOrders.length + 1}`,
        age: Math.floor(Math.random() * 48) + 18,
        gender: Math.random() > 0.5 ? "男" : "女",
        city: ["北京", "上海", "广州"][Math.floor(Math.random() * 3)],
        economic_status: Math.random(),
        attitude_towards_delivery_preference: ["速度优先", "价格优先", "可靠优先"][Math.floor(Math.random() * 3)]
      };

      const merchant = {
        name: `商家-${generatedOrders.length + 1}`,
        age: Math.floor(Math.random() * 36) + 25,
        gender: Math.random() > 0.5 ? "男" : "女",
        economic_status: Math.random()
      };

      // 生成一个接近当前时间的时间戳（最多往前5分钟）
      const now = Date.now();
      const randomOffset = Math.floor(Math.random() * 5 * 60 * 1000); // 0-5分钟的随机偏移
      const orderTimestamp = Math.floor((now - randomOffset) / 1000);

      const newOrder = {
        type: 'order-data',
        data: {
          good,
          id: `ORDER-${generatedOrders.length + 1}`,
          merchant_coordinates: generateCoordinates(),
          customer_coordinates: generateCoordinates(),
          customer: customer.name,
          merchant: merchant.name,
          itemName: good.name,
          order_mode: 0,
          customer_order_timestamp: orderTimestamp,
          deliveryMethod: Math.random() > 0.5 ? "无人机配送" : "人工配送",
          status: "已下单",
          customer_age: customer.age,
          price: good.price,
          createTime: now
        }
      };

      generatedOrders.push(newOrder);
      generatedData.push(newOrder);
    }

    return generatedData.length === 1 ? generatedData[0] : generatedData[Math.floor(Math.random() * generatedData.length)];
  }

  // 当没有新订单生成时，返回更新的订单
  return generatedOrders[Math.floor(Math.random() * generatedOrders.length)];
};

// 生成随机坐标（以北京为中心）
const generateCoordinates = () => {
  const baseLatitude = 39.90923;  // 北京纬度
  const baseLongitude = 116.397428;  // 北京经度
  return [
    baseLongitude + (Math.random() - 0.5) * 0.1,  // 经度范围
    baseLatitude + (Math.random() - 0.5) * 0.1,   // 纬度范围
    0
  ];
};

// 模拟WebSocket服务器定期发送数据
export const startMockDataStream = (wsClient) => {
  // 立即发送第一条数据
  wsClient.send(JSON.stringify(generateMockData()));

  // 设置定时发送，更频繁地发送数据
  setInterval(() => {
    const mockData = generateMockData();
    wsClient.send(JSON.stringify(mockData));
  }, 500); // 改为每0.5秒更新一次数据
}; 