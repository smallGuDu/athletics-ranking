const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 解析请求数据
        const { id } = JSON.parse(event.body);
        
        // 读取现有数据
        const dataPath = path.join(process.cwd(), '_data', 'athletes.json');
        let athletes = [];
        
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            athletes = JSON.parse(data);
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: '数据文件不存在' })
            };
        }
        
        // 过滤掉要删除的数据
        const initialLength = athletes.length;
        athletes = athletes.filter(athlete => athlete.id !== id);
        
        if (athletes.length === initialLength) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: '未找到对应数据' })
            };
        }
        
        // 保存数据
        fs.writeFileSync(dataPath, JSON.stringify(athletes, null, 2));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        console.error('删除数据时出错:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '删除数据失败' })
        };
    }
};