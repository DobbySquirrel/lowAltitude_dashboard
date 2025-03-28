// 生成随机数据
const generateMockData = () => {
  return {
    type: "dashboard-data",
    payload: {
      header: {
        carbonReduction: Number((Math.random() * 20).toFixed(3)),
        recycledBoxes: Math.floor(Math.random() * 50)
      },
      
      orderDisplay: {
        orders: Array.from({ length: 10 }, (_, i) => ({
          id: `00012${i}`,
          itemName: ['咖啡', '奶茶', '快递包裹', '文件'][Math.floor(Math.random() * 4)],
          customer: ['Lei CHEN', 'Zhang SAN', 'Li SI', 'Wang WU'][Math.floor(Math.random() * 4)],
          deliveryMethod: ['无人机', '室内车', '室外车'][Math.floor(Math.random() * 3)],
          status: ['下单', '备餐', '配送中', '已送达'][Math.floor(Math.random() * 4)],
          type: ['coffee', 'drink', 'package', 'document'][Math.floor(Math.random() * 4)]
        }))
      },
      
      orderCount: {
        droneOrders: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50)),
        indoorOrders: Array.from({ length: 24 }, () => Math.floor(Math.random() * 40)),
        outdoorOrders: Array.from({ length: 24 }, () => Math.floor(Math.random() * 60))
      },
      
      userScore: {
        rankings: Array.from({ length: 10 }, (_, i) => ({
          phone: `1381234${i.toString().padStart(4, '0')}`,
          score: Math.floor(Math.random() * 1000)
        }))
      },
      
      occupancy: {
        devices: {
          locker: { total: 100, used: Math.floor(Math.random() * 100) },
          indoorCar: { total: 5, used: Math.floor(Math.random() * 5) },
          outdoorCar: { total: 8, used: Math.floor(Math.random() * 8) },
          drone: { total: 10, used: Math.floor(Math.random() * 10) }
        }
      },
      
      deliveryRole: {
        drones: Array.from({ length: 5 }, (_, i) => ({
          id: (i + 1).toString(),
          status: ['空闲', '载货', '配送中'][Math.floor(Math.random() * 3)],
          orderNumber: `00012${i}`,
          customer: ['Lei CHEN', 'Zhang SAN', 'Li SI'][Math.floor(Math.random() * 3)],
          location: `P${Math.floor(Math.random() * 3) + 1}->C${Math.floor(Math.random() * 3) + 1}`
        })),
        
        couriers: Array.from({ length: 3 }, (_, i) => ({
          id: (i + 1).toString(),
          status: ['空闲', '载货', '配送中'][Math.floor(Math.random() * 3)],
          location: `P${Math.floor(Math.random() * 3) + 1}->C${Math.floor(Math.random() * 3) + 1}`,
          orders: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
            number: `00012${i}${j}`,
            customer: ['Wang WU', 'Zhao LIU', 'Sun QI'][Math.floor(Math.random() * 3)]
          })),
          selectedOrder: '000120',
          selectedCustomer: 'Wang WU'
        }))
      }
    }
  };
};

// 模拟WebSocket服务器定期发送数据
export const startMockDataStream = (wsClient) => {
  setInterval(() => {
    const mockData = generateMockData();
    wsClient.send(JSON.stringify(mockData));
  }, 2000); // 每2秒更新一次数据
}; 