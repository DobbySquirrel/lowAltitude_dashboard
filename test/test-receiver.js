import WebSocket from 'ws';
import chalk from 'chalk'; // 需要先安装: npm install chalk

// 连接到WebSocket服务器
const ws = new WebSocket('ws://10.12.17.136:8080');

// 设置客户端类型
ws.on('open', () => {
    console.log(chalk.green('已连接到服务器'));
    
    // 发送客户端类型（改为 monitor 类型）
    ws.send(JSON.stringify({
        type: 'client-ready',
        timestamp: Date.now(),
        clientType: 'monitor'  // 监控类型客户端
    }));
});

// 处理接收到的消息
ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        switch(message.type) {
            case 'chat-message':
                console.log('\n' + chalk.blue('收到聊天消息:'));
                console.log(chalk.blue('内容:'), message.data.content);
                console.log(chalk.blue('时间:'), message.data.time);
                console.log(chalk.blue('发送者:'), message.data.sender);
                break;
                
            case 'order-status':
                console.log('\n' + chalk.yellow('收到订单:'));
                console.log(chalk.yellow('订单ID:'), message.data.orderId);
                console.log(chalk.yellow('餐厅:'), message.data.restaurant);
                console.log(chalk.yellow('取餐点:'), message.data.pickup);
                console.log(chalk.yellow('用户:'), message.data.username);
                console.log(chalk.yellow('商品:'), message.data.items.join(', '));
                console.log(chalk.yellow('配送方式:'), message.data.deliveryMethod);
                console.log(chalk.yellow('接单时间:'), message.data.receivedTime);
                break;
                
            default:
                console.log('\n' + chalk.gray('其他消息类型:'), message.type);
                console.log(message);
        }
    } catch (error) {
        console.error('解析消息失败:', error);
    }
});

// 错误处理
ws.on('error', (error) => {
    console.error(chalk.red('WebSocket错误:'), error);
});

// 连接关闭处理
ws.on('close', () => {
    console.log(chalk.red('连接已关闭'));
});

// 处理进程终止
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n正在关闭连接...'));
    ws.close();
    process.exit();
}); 