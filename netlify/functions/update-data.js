const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 解析请求数据
        const updateData = JSON.parse(event.body);
        const { id, ...updatedFields } = updateData;
        
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
        
        // 查找并更新数据
        const index = athletes.findIndex(athlete => athlete.id === id);
        
        if (index === -1) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: '未找到对应数据' })
            };
        }
        
        // 更新数据
        athletes[index] = { ...athletes[index], ...updatedFields };
        
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
        console.error('更新数据时出错:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '更新数据失败' })
        };
    }
};