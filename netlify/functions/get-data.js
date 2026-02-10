const fs = require('fs');
const path = require('path');

// 与add-data.js相同的存储方案
let storage = {
    data: [],
    filePath: '/tmp/athletics_data.json',
    
    init: function() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(data);
                console.log('从文件加载数据:', this.data.length, '条记录');
            } else {
                this.data = this.getSampleData();
                console.log('使用示例数据');
            }
            return true;
        } catch (error) {
            console.error('加载数据失败:', error.message);
            this.data = this.getSampleData();
            return false;
        }
    },
    
    getSampleData: function() {
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
};

// 初始化存储
storage.init();

exports.handler = async function(event, context) {
    console.log('=== get-data 函数调用 ===');
    
    try {
        // 返回数据
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(storage.data)
        };
        
    } catch (error) {
        console.error('获取数据时出错:', error);
        
        return {
            statusCode: 200,  // 即使出错也返回200，但返回空数组
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify([])
        };
    }
};
