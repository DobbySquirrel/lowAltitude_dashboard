import random
from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


# 定义数据模型
class Good(BaseModel):
    name: str
    price: int
    fragile: bool

    def get_info(self):
        return f"Good name: {self.name}, Price: {self.price}, Fragile: {self.fragile}"


class Profile(BaseModel):
    name: str
    age: int
    gender: str
    economic_status: float


class ConsumerProfile(BaseModel):
    name: str
    age: int
    gender: str
    city: str
    economic_status: float = Field(..., ge=0, le=1)  # Normalized between 0 and 1
    attitude_towards_delivery_preference: str


class OrderType(Enum):
    ORDER_PLACE = 0  # 下单
    MEAL_PREPARATION = 1  # 备餐
    OUT_FOR_DELIVER = 2  # 配送
    DELIVERED = 3  # 送达


class DeliveryType(Enum):
    NONE = 0  # 未确定
    DRONE = 1  # 无人机
    RIDER = 2  # 骑手


class Order(BaseModel):
    order_id: str
    priority: int
    good: Any
    customer: Any
    merchant: Any
    merchant_coordinates: tuple[float, float, float]
    customer_coordinates: tuple[float, float, float]
    order_mode: OrderType = Field(default=OrderType.ORDER_PLACE)
    delivery_type: DeliveryType = Field(default=DeliveryType.NONE)
    consumer_order_timestamp: int

    def get_dict(self):
        return {
            "good": self.good.dict(),
            "order_id": self.order_id,
            "merchant_coordinates": self.merchant_coordinates,
            "customer_coordinates": self.customer_coordinates,
            "customer": self.customer.name,
            "merchant": self.merchant.name,
            "order_mode": self.order_mode.value,
            "customer_order_timestamp": self.consumer_order_timestamp
        }


# 生成模拟数据的函数
def generate_mock_data():
    # 生成模拟商品
    good = Good(
        name=f"Good-{random.randint(1, 100)}",
        price=random.randint(10, 100),
        fragile=random.choice([True, False])
    )

    # 生成模拟消费者
    consumer = ConsumerProfile(
        name=f"Consumer-{random.randint(1, 100)}",
        age=random.randint(18, 65),
        gender=random.choice(["Male", "Female"]),
        city=random.choice(["CityA", "CityB", "CityC"]),
        economic_status=random.uniform(0, 1),
        attitude_towards_delivery_preference=random.choice(["Fast", "Cheap", "Reliable"])
    )

    # 生成模拟商家
    merchant = Profile(
        name=f"Merchant-{random.randint(1, 100)}",
        age=random.randint(25, 60),
        gender=random.choice(["Male", "Female"]),
        economic_status=random.uniform(0, 1)
    )

    # 生成订单
    order = Order(
        order_id=f"ORDER-{random.randint(1000, 9999)}",
        priority=random.randint(1, 5),
        good=good,
        customer=consumer,
        merchant=merchant,
        merchant_coordinates=(random.uniform(-90, 90), random.uniform(-180, 180), 0),
        customer_coordinates=(random.uniform(-90, 90), random.uniform(-180, 180), 0),
        order_mode=OrderType.ORDER_PLACE,
        delivery_type=DeliveryType.DRONE if random.choice([True, False]) else DeliveryType.RIDER,
        consumer_order_timestamp=int(datetime.now().timestamp())
    )

    return order.get_dict()


# 生成并打印模拟订单数据
if __name__ == "__main__":
    mock_order_data = generate_mock_data()
    print(mock_order_data)