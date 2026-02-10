const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    try {
        // 数据目录路径
        const dataDir = path.join(process.cwd(), '_data');
        const dataPath = path.join(dataDir, 'athletes.json');
        
        let athletes = [];
        
        // 确保数据目录存在
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 读取数据
        if (fs.existsSync(dataPath)) {
            try {
                const data = fs.readFileSync(dataPath, 'utf8');
                athletes = JSON.parse(data);
            } catch (readError) {
                console.error('读取数据时出错:', readError);
                // 返回示例数据
                athletes = getSampleData();
                // 保存示例数据
                fs.writeFileSync(dataPath, JSON.stringify(athletes, null, 2));
            }
        } else {
            // 创建示例数据
            athletes = getSampleData();
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
        
        // 即使出错也返回空数组
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify([])
        };
    }
};

// 示例数据
function getSampleData() {
    return [
        {
            id: "1",
            name: "张三",
            distance: 10.5,
            pace: "5:20",
            date: new Date().toISOString().split('T')[0],
            reflections: "今天状态不错，突破了10公里大关！",
            photo: null,
            timestamp: new Date().toISOString(),
            status: "approved"
        },
        {
            id: "2",
            name: "李四",
            distance: 8.2,
            pace: "4:45",
            date: new Date().toISOString().split('T')[0],
            reflections: "速度训练，配速有提升",
            photo: null,
            timestamp: new Date().toISOString(),
            status: "approved"
        },
        {
            id: "3",
            name: "王五",
            distance: 21.1,
            pace: "6:10",
            date: new Date().toISOString().split('T')[0],
            reflections: "完成了半程马拉松，虽然累但很有成就感",
            photo: null,
            timestamp: new Date().toISOString(),
            status: "approved"
        }
    ];
}
