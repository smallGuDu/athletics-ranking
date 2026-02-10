const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 解析请求数据
        const { id } = JSON.parse(event.body);
        
        if (!id) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: '缺少ID参数' })
            };
        }
        
        // 数据目录路径
        const dataDir = path.join(process.cwd(), '_data');
        const dataPath = path.join(dataDir, 'athletes.json');
        
        let athletes = [];
        
        // 读取现有数据
        if (fs.existsSync(dataPath)) {
            try {
                const data = fs.readFileSync(dataPath, 'utf8');
                athletes = JSON.parse(data);
            } catch (readError) {
                console.error('读取数据时出错:', readError);
                return {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: '数据文件损坏' })
                };
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: '数据文件不存在' })
            };
        }
        
        // 过滤掉要删除的数据
        const initialLength = athletes.length;
        athletes = athletes.filter(athlete => athlete.id !== id);
        
        if (athletes.length === initialLength) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
            body: JSON.stringify({ 
                success: true,
                message: '数据删除成功',
                count: athletes.length
            })
        };
        
    } catch (error) {
        console.error('删除数据时出错:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: '删除数据失败',
                details: error.message
            })
        };
    }
};
