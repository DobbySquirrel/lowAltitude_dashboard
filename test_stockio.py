import socketio
import json
# 创建 SocketIO 客户端
sio = socketio.Client()
# 连接成功回调
@sio.event
def connect():
    print("Connected to server")
    start_simulation(sio)  # 在连接成功后启动模拟


@sio.on("*")
def catch_all(event, data):
    """捕获所有事件并打印事件名称和数据"""
    print(f"Received event: {event} with data: {data}")


# 断开连接回调
@sio.event
def disconnect():
    print("Disconnected from server")


def start_simulation(sio):
    """启动模拟并发送配置信息"""
    simulation_config = {
        "map_name": "hkust-gz-v-5-new",
        "simulation_seconds": 3600,
        "drone_count": 5,
        "rider_count": 10,
        "rider_max_order": 5,
        "consumer_count": 10,
        "order_count": 100,
        "rider_speed": 5,
        "drone_speed": 10,
        "human_speed": 3,
        "goods_info_file_path": "datas/goods_info.jsonl",
        "delivery_meal_preparation_time": 10,
    }

    protocol = {"message_type": "init", "message": json.dumps(simulation_config)}

    print("Sending simulation configuration...")
    sio.emit("client_message", json.dumps(protocol))

if __name__ == "__main__":
    host = "10.4.152.244"  # 服务器地址
    port = 5001  # 服务器端口（Flask-SocketIO 默认端口）
    print(f"Connecting to server at ws://{host}:{port}")
    sio.connect(f"http://{host}:{port}")
    sio.wait()  # 阻塞等待，直到客户端断开连接