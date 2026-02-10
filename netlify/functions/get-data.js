const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 在实际部署中，这里应该从数据库或文件系统中读取数据
        // 为简化演示，我们使用一个示例数据文件
        const dataPath = path.join(process.cwd(), '_data', 'athletes.json');
        
        let athletes = [];
        
        // 检查文件是否存在
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            athletes = JSON.parse(data);
        } else {
            // 如果文件不存在，创建示例数据
            athletes = [
                {
                    id: "1",
                    name: "张三",
                    distance: 10.5,
                    pace: "5:20",
                    date: "2023-10-15",
                    reflections: "今天状态不错，突破了10公里大关！",
                    photo: null,
                    timestamp: "2023-10-15T08:30:00Z"
                },
                {
                    id: "2",
                    name: "李四",
                    distance: 8.2,
                    pace: "4:45",
                    date: "2023-10-14",
                    reflections: "速度训练，配速有提升",
                    photo: null,
                    timestamp: "2023-10-14T07:15:00Z"
                },
                {
                    id: "3",
                    name: "王五",
                    distance: 21.1,
                    pace: "6:10",
                    date: "2023-10-13",
                    reflections: "完成了半程马拉松，虽然累但很有成就感",
                    photo: null,
                    timestamp: "2023-10-13T10:45:00Z"
                }
            ];
            
            // 确保目录存在
            const dirPath = path.join(process.cwd(), '_data');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            
            // 写入示例数据
            fs.writeFileSync(dataPath, JSON.stringify(athletes, null, 2));
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(athletes)
        };
        
    } catch (error) {
        console.error('获取数据时出错:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '获取数据失败' })
        };
    }
};