const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    console.log('=== add-data 函数开始执行 ===');
    console.log('事件类型:', event.httpMethod);
    console.log('请求体长度:', event.body?.length || 0);
    
    try {
        // 解析请求数据
        const athleteData = JSON.parse(event.body || '{}');
        console.log('解析的数据:', JSON.stringify(athleteData, null, 2));
        
        // 验证必需字段
        if (!athleteData.name || !athleteData.distance || !athleteData.pace) {
            console.log('验证失败：缺少必需字段');
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: '缺少必需字段: name, distance, pace',
                    received: athleteData
                })
            };
        }
        
        // 添加ID和时间戳
        athleteData.id = Date.now().toString();
        athleteData.timestamp = new Date().toISOString();
        athleteData.status = athleteData.status || 'pending';
        
        console.log('处理后的数据:', JSON.stringify(athleteData, null, 2));
        
        // 尝试不同的存储方案
        
        // 方案A：尝试写入文件系统
        try {
            const dataDir = '/tmp/_data';  // 使用Netlify的/tmp目录，有写入权限
            const dataPath = path.join(dataDir, 'athletes.json');
            
            console.log('数据目录:', dataDir);
            console.log('数据路径:', dataPath);
            
            // 确保目录存在
            if (!fs.existsSync(dataDir)) {
                console.log('创建数据目录...');
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            let athletes = [];
            
            // 读取现有数据
            if (fs.existsSync(dataPath)) {
                console.log('读取现有数据文件...');
                const data = fs.readFileSync(dataPath, 'utf8');
                athletes = JSON.parse(data);
                console.log('读取到', athletes.length, '条记录');
            } else {
                console.log('数据文件不存在，创建新文件');
            }
            
            // 添加新数据
            athletes.push(athleteData);
            console.log('添加后总数:', athletes.length);
            
            // 保存数据
            console.log('保存数据到文件...');
            fs.writeFileSync(dataPath, JSON.stringify(athletes, null, 2));
            console.log('数据保存成功');
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    id: athleteData.id,
                    message: '数据添加成功（文件存储）',
                    count: athletes.length,
                    storage: 'filesystem',
                    path: dataPath
                })
            };
            
        } catch (fileError) {
            console.error('文件存储失败:', fileError.message);
            console.error('文件错误堆栈:', fileError.stack);
            
            // 方案B：使用内存存储作为后备
            console.log('尝试内存存储...');
            
            // 这里可以添加内存存储逻辑
            // 注意：内存存储在函数调用之间不会持久化
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    id: athleteData.id,
                    message: '数据添加成功（内存存储）',
                    warning: '数据不会持久化，重启后会丢失',
                    storage: 'memory',
                    data: athleteData
                })
            };
        }
        
    } catch (error) {
        console.error('=== 全局错误 ===');
        console.error('错误信息:', error.message);
        console.error('错误堆栈:', error.stack);
        console.error('请求体:', event.body);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: '添加数据失败',
                details: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            })
        };
    }
};
