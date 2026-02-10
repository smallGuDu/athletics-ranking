const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 解析请求数据
        const athleteData = JSON.parse(event.body);
        
        // 验证必需字段
        if (!athleteData.name || !athleteData.distance || !athleteData.pace) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: '缺少必需字段: name, distance, pace' 
                })
            };
        }
        
        // 添加ID和时间戳
        athleteData.id = Date.now().toString();
        athleteData.timestamp = new Date().toISOString();
        athleteData.status = athleteData.status || 'pending';
        
        // 数据目录路径
        const dataDir = path.join(process.cwd(), '_data');
        const dataPath = path.join(dataDir, 'athletes.json');
        
        let athletes = [];
        
        // 确保数据目录存在
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('创建数据目录:', dataDir);
        }
        
        // 读取现有数据
        if (fs.existsSync(dataPath)) {
            try {
                const data = fs.readFileSync(dataPath, 'utf8');
                athletes = JSON.parse(data);
                console.log('成功读取现有数据，记录数:', athletes.length);
            } catch (readError) {
                console.error('读取数据文件时出错:', readError);
                // 如果文件损坏，创建新的空数组
                athletes = [];
            }
        } else {
            console.log('数据文件不存在，创建新文件');
        }
        
        // 添加新数据
        athletes.push(athleteData);
        
        // 保存数据
        try {
            fs.writeFileSync(dataPath, JSON.stringify(athletes, null, 2));
            console.log('数据保存成功，路径:', dataPath);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    id: athleteData.id,
                    message: '数据添加成功',
                    count: athletes.length
                })
            };
            
        } catch (writeError) {
            console.error('保存数据时出错:', writeError);
            
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: '保存数据失败',
                    details: writeError.message 
                })
            };
        }
        
    } catch (error) {
        console.error('添加数据时出错:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: '处理请求时发生错误',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
