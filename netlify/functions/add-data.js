const fs = require('fs');
const path = require('path');

// 简单存储方案：使用临时文件
let storage = {
    data: [],
    filePath: null,
    
    init: function() {
        try {
            // 尝试使用 /tmp 目录
            this.filePath = '/tmp/athletics_data.json';
            console.log('存储路径:', this.filePath);
            
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(data);
                console.log('从文件加载数据:', this.data.length, '条记录');
            } else {
                this.data = this.getSampleData();
                this.save();
                console.log('创建示例数据');
            }
            return true;
        } catch (error) {
            console.error('初始化存储失败:', error.message);
            // 使用内存存储
            this.data = this.getSampleData();
            return false;
        }
    },
    
    save: function() {
        try {
            if (this.filePath) {
                fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
                return true;
            }
            return false;
        } catch (error) {
            console.error('保存数据失败:', error.message);
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
    console.log('=== add-data 函数调用 ===');
    
    try {
        // 解析请求数据
        const athleteData = JSON.parse(event.body || '{}');
        
        // 验证数据
        if (!athleteData.name || athleteData.name.trim() === '') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: '姓名不能为空' })
            };
        }
        
        const distance = parseFloat(athleteData.distance);
        if (isNaN(distance) || distance <= 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: '距离必须是大于0的数字' })
            };
        }
        
        if (!athleteData.pace || !athleteData.pace.match(/^\d+:\d{2}$/)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: '配速格式不正确，请使用"分钟:秒"格式' })
            };
        }
        
        // 准备数据
        const newAthlete = {
            id: Date.now().toString(),
            name: athleteData.name.trim(),
            distance: distance,
            pace: athleteData.pace,
            date: athleteData.date || new Date().toISOString().split('T')[0],
            reflections: athleteData.reflections || '',
            photo: athleteData.photo || null,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        console.log('准备添加数据:', newAthlete);
        
        // 添加到存储
        storage.data.push(newAthlete);
        const saved = storage.save();
        
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({ 
                success: true, 
                message: '数据添加成功',
                storage: saved ? 'file' : 'memory',
                id: newAthlete.id,
                athlete: newAthlete
            })
        };
        
    } catch (error) {
        console.error('处理请求时出错:', error);
        
        return {
            statusCode: 500,
            headers: { 
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({ 
                error: '添加数据失败',
                details: error.message,
                suggestion: '请检查数据格式是否正确'
            })
        };
    }
};
