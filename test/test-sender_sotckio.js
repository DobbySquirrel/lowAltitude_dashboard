import WebSocket from 'ws';
import chalk from 'chalk'; // 需要先安装: npm install chalk

// 连接到Stockio WebSocket服务器
const ws = new WebSocket('ws://10.4.152.254:5001');

// 设置客户端类型
ws.on('open', () => {
    console.log(chalk.green('已连接到Stockio服务器'));
    console.log(chalk.green('WebSocket连接成功! 地址:', 'ws://10.4.152.254:5001'));
    
    // 定期发送模拟的股票数据
    setInterval(() => {
        const mockStockData = {
            type: 'stock-update',
            timestamp: Date.now(),
            data: {
                symbol: 'AAPL',  // 股票代码
                price: (Math.random() * 100 + 150).toFixed(2),  // 随机价格
                volume: Math.floor(Math.random() * 10000),  // 随机成交量
                change: (Math.random() * 10 - 5).toFixed(2)  // 随机涨跌
            }
        };
        
        ws.send(JSON.stringify(mockStockData));
        console.log(chalk.blue('已发送股票数据:'), mockStockData);
    }, 2000);  // 每2秒发送一次数据
});

// 处理接收到的消息
ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log(chalk.yellow('收到服务器响应:'), message);
    } catch (error) {
        console.error('解析消息失败:', error);
    }
});

// 错误处理
ws.on('error', (error) => {
    console.error(chalk.red('WebSocket错误:'), error);
    console.error(chalk.red('请确认以下内容:'));
    console.error(chalk.red('1. 服务器IP是否可以访问 (ping 10.4.152.244)'));
    console.error(chalk.red('2. 端口5001是否开放'));
    console.error(chalk.red('3. 服务器是否正在运行'));
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