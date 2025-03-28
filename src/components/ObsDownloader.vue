<template>
  <div></div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { getObject } from '@/api/obs_chart.js';
import { useDataStore } from '../store';

export default {
  setup() {
    const store = useDataStore();
    
    // 文件列表配置
    const fileConfig = {
      highFrequency: [
        'Box/Box_owner.csv',
        'User_Score/Score_Record.csv',
        'DeliveryDrone_Property/DeliveryDrone_Property_DroneDeliveryOrder.csv',
        'OutdoorDeliveryCar_Property/OutdoorDeliveryCar_Property_OutdoorDeliveryOrder.csv',
      ],
      lowFrequency: [
        'IndoorDeliveryCar_Property/IndoorDeliveryCar_Property_IndoorDeliveryOrder.csv',
        'Delivery_Locker_Property/Delivery_Locker_Property_InputDelivery.csv',
        'Delivery_Locker_Property/Delivery_Locker_Property_OutputDelivery.csv',
        'IndoorDeliveryCar_Property/IndoorDeliveryCar_Property_IndoorCarState.csv',
        'OutdoorDeliveryCar_Property/OutdoorDeliveryCar_Property_OutdoorCarState.csv',
        'DeliveryDrone_Property/DeliveryDrone_Property_DroneState.csv',
        'Delivery_Locker_Property/Delivery_Locker_Property_RecycleInDelivery.csv',
        'Delivery_Locker_Property/Delivery_Locker_Property_OutputDelivery.csv',
      ]
    };

    const fetchFiles = async (files) => {
      store.setLoading(true);
      try {
        const promises = files.map(async file => {
          try {
            const content = await getObject('gbxbox1', file);
            if (content) {
              console.log(`Successfully fetched ${file}`);
              store.updateData(file, content);
            } else {
              console.error(`Empty content received for ${file}`);
            }
          } catch (error) {
            console.error(`Error fetching ${file}:`, error);
          }
        });
        
        await Promise.all(promises);
      } catch (error) {
        console.error('Batch fetch error:', error);
      } finally {
        store.setLoading(false);
      }
    };

    onMounted(() => {
      store.initializeData();
      
      // 初始加载
      fetchFiles([...fileConfig.highFrequency, ...fileConfig.lowFrequency]);

      // 使用 ref 存储定时器ID以便清理
      const highFrequencyTimer = setInterval(() => {
        console.log('Fetching high frequency files...');
        fetchFiles(fileConfig.highFrequency);
      }, 30000000);
      
      const lowFrequencyTimer = setInterval(() => {
        console.log('Fetching low frequency files...');
        fetchFiles(fileConfig.lowFrequency);
      }, 60000000);

      // 组件卸载时清理定时器
      onUnmounted(() => {
        clearInterval(highFrequencyTimer);
        clearInterval(lowFrequencyTimer);
      });
    });

    return {};    
  }
};
</script>
