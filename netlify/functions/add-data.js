const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 解析请求数据
        const athleteData = JSON.parse(event.body);
        
        // 添加ID和时间戳
        athleteData.id = Date.now().toString();
        athleteData.timestamp = new Date().toISOString();
        
        // 读取现有数据
        const dataPath = path.join(process.cwd(), '_data', 'athletes.json');
        let athletes = [];
        
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            athletes = JSON.parse(data);
        }
        
        // 添加新数据
        athletes.push(athleteData);
        
        // 确保目录存在
        const dirPath = path.join(process.cwd(), '_data');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // 保存数据
        fs.writeFileSync(dataPath, JSON.stringify(athletes, null, 2));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: true, id: athleteData.id })
        };
        
    } catch (error) {
        console.error('添加数据时出错:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '添加数据失败' })
        };
    }
};