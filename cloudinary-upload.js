// Cloudinary配置
// 在实际项目中，建议将这些配置放在环境变量中
const CLOUDINARY_CONFIG = {
    cloudName: 'dzz2oifvl', // 请替换为您的Cloudinary云名称
    uploadPreset: 'athletics_upload' // 请替换为您的上传预设
};

// 上传图片到Cloudinary
async function uploadImageToCloudinary(file) {
    // 显示上传进度
    showMessage('form-message', '正在上传图片到云存储...', 'info');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            throw new Error(`上传失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 返回优化后的图片URL（中等质量，适合网页显示）
        return {
            original: data.secure_url,
            optimized: data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_800/'),
            thumbnail: data.secure_url.replace('/upload/', '/upload/c_fill,w_200,h_200,q_auto/')
        };
        
    } catch (error) {
        console.error('图片上传失败:', error);
        throw new Error('图片上传失败，请检查网络连接或稍后重试');
    }
}

// 提交运动员数据（包含图片上传）
async function submitAthleteData() {
    const form = document.getElementById('upload-form');
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    
    // 验证数据
    const name = document.getElementById('name').value.trim();
    const distance = parseFloat(document.getElementById('distance').value);
    const pace = document.getElementById('pace').value.trim();
    const date = document.getElementById('date').value;
    const reflections = document.getElementById('reflections').value.trim();
    const photoFile = document.getElementById('photo').files[0];
    
    // 验证必填字段
    if (!name || !distance || !pace || !date) {
        showMessage('form-message', '请填写所有必填字段', 'error');
        return;
    }
    
    // 验证配速格式
    if (!pace.match(/^\d+:\d{2}$/)) {
        showMessage('form-message', '配速格式不正确，请使用"分钟:秒"格式，例如"5:30"', 'error');
        return;
    }
    
    // 验证距离
    if (distance <= 0) {
        showMessage('form-message', '运动距离必须大于0', 'error');
        return;
    }
    
    try {
        // 禁用提交按钮，防止重复提交
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上传中...';
        
        let photoData = null;
        
        // 如果有图片，先上传到Cloudinary
        if (photoFile) {
            try {
                showMessage('form-message', '正在上传图片...', 'info');
                photoData = await uploadImageToCloudinary(photoFile);
                showMessage('form-message', '图片上传成功！正在保存数据...', 'success');
            } catch (error) {
                showMessage('form-message', error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }
        }
        
        // 创建运动员数据对象
        const athleteData = {
            name: name,
            distance: distance,
            pace: pace,
            date: date,
            reflections: reflections,
            photo: photoData, // 包含原始、优化和缩略图URL
            timestamp: new Date().toISOString(),
            status: 'pending' // 审核状态：pending, approved, rejected
        };
        
        // 保存到Netlify Functions
        const response = await fetch(`${API_BASE}/add-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(athleteData)
        });
        
        if (!response.ok) {
            throw new Error('数据保存失败');
        }
        
        const result = await response.json();
        
        showMessage('form-message', 
            `数据上传成功！${photoData ? '照片已保存到云存储。' : ''}即将跳转到排行榜...`, 
            'success'
        );
        
        // 重置表单
        form.reset();
        document.getElementById('photo-preview').innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        
        // 3秒后跳转到首页
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('上传数据时出错:', error);
        showMessage('form-message', '上传失败，请稍后重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// 图片上传区域拖拽效果
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('file-upload-area');
    
    if (uploadArea) {
        // 防止浏览器默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // 高亮拖拽区域
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            uploadArea.classList.add('highlight');
        }
        
        function unhighlight() {
            uploadArea.classList.remove('highlight');
        }
        
        // 处理文件拖放
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const fileInput = document.getElementById('photo');
                fileInput.files = files;
                
                // 触发change事件
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        }
    }
});