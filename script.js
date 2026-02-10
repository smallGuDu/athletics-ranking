// API基础URL - 部署到Netlify后使用相对路径
const API_BASE = '/.netlify/functions';

// 通用函数：显示消息
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        
        // 5秒后自动隐藏消息
        if (type !== 'error') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
}

// 计算跑步得分（基于距离和配速）
function calculateScore(distance, pace) {
    // 配速转换为秒/公里
    const paceParts = pace.split(':');
    const paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1] || 0);
    
    // 得分公式：距离(km) * 10 + (300 - 配速秒数)/10
    // 配速越快（秒数越小），得分越高
    const score = distance * 10 + Math.max(0, (300 - paceSeconds) / 10);
    return Math.round(score * 100) / 100; // 保留两位小数
}

// 加载排名数据
async function loadRankings(sortBy = 'score') {
    try {
        const response = await fetch(`${API_BASE}/get-data`);
        if (!response.ok) throw new Error('获取数据失败');
        
        const athletes = await response.json();
        
        // 计算得分
        athletes.forEach(athlete => {
            athlete.score = calculateScore(athlete.distance, athlete.pace);
        });
        
        // 排序
        athletes.sort((a, b) => {
            if (sortBy === 'distance') {
                return b.distance - a.distance;
            } else if (sortBy === 'pace') {
                // 配速转换为秒进行比较（越小越快）
                const aPace = a.pace.split(':');
                const bPace = b.pace.split(':');
                const aPaceSec = parseInt(aPace[0]) * 60 + parseInt(aPace[1] || 0);
                const bPaceSec = parseInt(bPace[0]) * 60 + parseInt(bPace[1] || 0);
                return aPaceSec - bPaceSec;
            } else {
                // 默认按综合得分排序
                return b.score - a.score;
            }
        });
        
        // 更新统计数据
        updateStats(athletes);
        
        // 渲染排名列表
        renderRankings(athletes);
        
    } catch (error) {
        console.error('加载排名数据时出错:', error);
        document.getElementById('rankings-list').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>加载数据失败，请稍后重试</p>
            </div>
        `;
    }
}

// 更新统计信息
function updateStats(athletes) {
    if (athletes.length === 0) {
        document.getElementById('total-distance').textContent = '0 km';
        document.getElementById('total-athletes').textContent = '0';
        document.getElementById('average-pace').textContent = '0:00';
        return;
    }
    
    // 总跑量
    const totalDistance = athletes.reduce((sum, athlete) => sum + parseFloat(athlete.distance), 0);
    document.getElementById('total-distance').textContent = `${totalDistance.toFixed(1)} km`;
    
    // 总人数
    document.getElementById('total-athletes').textContent = athletes.length;
    
    // 平均配速
    let totalPaceSeconds = 0;
    athletes.forEach(athlete => {
        const paceParts = athlete.pace.split(':');
        totalPaceSeconds += parseInt(paceParts[0]) * 60 + parseInt(paceParts[1] || 0);
    });
    
    const avgPaceSeconds = totalPaceSeconds / athletes.length;
    const avgMinutes = Math.floor(avgPaceSeconds / 60);
    const avgSeconds = Math.round(avgPaceSeconds % 60);
    document.getElementById('average-pace').textContent = 
        `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
}

// 渲染排名列表
function renderRankings(athletes) {
    const container = document.getElementById('rankings-list');
    
    if (athletes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>暂无数据</h3>
                <p>还没有人上传跑步数据，点击"上传数据"成为第一个！</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    athletes.forEach((athlete, index) => {
        const rankClass = index === 0 ? 'rank-1' : 
                         index === 1 ? 'rank-2' : 
                         index === 2 ? 'rank-3' : '';
        
        html += `
            <div class="ranking-item ${rankClass}">
                <div class="rank-number">${index + 1}</div>
                <div class="athlete-info">
                    <div class="athlete-name">${athlete.name}</div>
                    <div class="athlete-stats">
                        <div class="athlete-stat">
                            <i class="fas fa-road"></i>
                            <span>${athlete.distance} km</span>
                        </div>
                        <div class="athlete-stat">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>${athlete.pace}/km</span>
                        </div>
                        <div class="athlete-stat">
                            <i class="far fa-calendar-alt"></i>
                            <span>${athlete.date || '未知日期'}</span>
                        </div>
                    </div>
                    ${athlete.reflections ? `<div class="athlete-reflections">"${athlete.reflections}"</div>` : ''}
                </div>
                <div class="athlete-score">${athlete.score} 分</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 提交运动员数据
async function submitAthleteData() {
    const form = document.getElementById('upload-form');
    const formData = new FormData(form);
    
    // 验证数据
    const name = formData.get('name');
    const distance = parseFloat(formData.get('distance'));
    const pace = formData.get('pace');
    
    if (!name || !distance || !pace) {
        showMessage('form-message', '请填写所有必填字段', 'error');
        return;
    }
    
    // 验证配速格式
    if (!pace.match(/^\d+:\d{2}$/)) {
        showMessage('form-message', '配速格式不正确，请使用"分钟:秒"格式，例如"5:30"', 'error');
        return;
    }
    
    try {
        // 创建JSON数据对象
        const athleteData = {
            name: name,
            distance: distance,
            pace: pace,
            date: formData.get('date'),
            reflections: formData.get('reflections') || '',
            photo: null, // 这里简化处理，实际项目中需要上传到云存储
            timestamp: new Date().toISOString()
        };
        
        // 如果有照片，需要特殊处理（简化版，实际应使用Netlify Forms或云存储）
        const photoFile = document.getElementById('photo').files[0];
        if (photoFile) {
            // 在实际项目中，这里应该将照片上传到云存储
            // 为简化演示，我们只存储文件名
            athleteData.photo = photoFile.name;
        }
        
        const response = await fetch(`${API_BASE}/add-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(athleteData)
        });
        
        if (response.ok) {
            showMessage('form-message', '数据上传成功！即将跳转到排行榜...', 'success');
            
            // 3秒后跳转到首页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            throw new Error('上传失败');
        }
        
    } catch (error) {
        console.error('上传数据时出错:', error);
        showMessage('form-message', '上传失败，请稍后重试', 'error');
    }
}

// 加载管理数据
async function loadAdminData() {
    try {
        const response = await fetch(`${API_BASE}/get-data`);
        if (!response.ok) throw new Error('获取数据失败');
        
        const athletes = await response.json();
        
        // 计算得分
        athletes.forEach(athlete => {
            athlete.score = calculateScore(athlete.distance, athlete.pace);
        });
        
        // 按得分排序
        athletes.sort((a, b) => b.score - a.score);
        
        // 渲染管理表格
        renderAdminTable(athletes);
        
    } catch (error) {
        console.error('加载管理数据时出错:', error);
        const tableBody = document.getElementById('admin-table-body');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载数据失败，请刷新重试</p>
                </td>
            </tr>
        `;
    }
}

// 渲染管理表格
function renderAdminTable(athletes) {
    const tableBody = document.getElementById('admin-table-body');
    
    if (athletes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-cell">
                    <i class="fas fa-inbox"></i>
                    <p>暂无数据</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    athletes.forEach((athlete, index) => {
        html += `
            <tr data-id="${athlete.id || index}">
                <td>${index + 1}</td>
                <td>${athlete.name}</td>
                <td>${athlete.distance}</td>
                <td>${athlete.pace}</td>
                <td>${athlete.score || calculateScore(athlete.distance, athlete.pace)}</td>
                <td>${athlete.date || '未知'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="openEditModal('${athlete.id || index}', '${athlete.name}', ${athlete.distance}, '${athlete.pace}', '${athlete.reflections || ''}')">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteAthleteData('${athlete.id || index}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// 打开编辑模态框
function openEditModal(id, name, distance, pace, reflections) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-distance').value = distance;
    document.getElementById('edit-pace').value = pace;
    document.getElementById('edit-reflections').value = reflections;
    
    document.getElementById('edit-modal').style.display = 'flex';
}

// 更新运动员数据
async function updateAthleteData() {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const distance = parseFloat(document.getElementById('edit-distance').value);
    const pace = document.getElementById('edit-pace').value;
    const reflections = document.getElementById('edit-reflections').value;
    
    // 验证数据
    if (!name || !distance || !pace) {
        alert('请填写所有必填字段');
        return;
    }
    
    try {
        const athleteData = {
            id: id,
            name: name,
            distance: distance,
            pace: pace,
            reflections: reflections,
            updatedAt: new Date().toISOString()
        };
        
        const response = await fetch(`${API_BASE}/update-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(athleteData)
        });
        
        if (response.ok) {
            alert('数据更新成功！');
            document.getElementById('edit-modal').style.display = 'none';
            loadAdminData(); // 刷新表格
        } else {
            throw new Error('更新失败');
        }
        
    } catch (error) {
        console.error('更新数据时出错:', error);
        alert('更新失败，请稍后重试');
    }
}

// 删除运动员数据
async function deleteAthleteData(id) {
    if (!confirm('确定要删除这条记录吗？此操作不可恢复。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/delete-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        });
        
        if (response.ok) {
            alert('数据删除成功！');
            loadAdminData(); // 刷新表格
        } else {
            throw new Error('删除失败');
        }
        
    } catch (error) {
        console.error('删除数据时出错:', error);
        alert('删除失败，请稍后重试');
    }
}

// 搜索/筛选表格
function filterTable(searchTerm) {
    const rows = document.querySelectorAll('#admin-table-body tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        if (name.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
// 渲染排名列表（添加点击事件和图片指示器）
function renderRankings(athletes) {
    const container = document.getElementById('rankings-list');
    
    if (athletes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>暂无数据</h3>
                <p>还没有人上传跑步数据，点击"上传数据"成为第一个！</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    athletes.forEach((athlete, index) => {
        const rankClass = index === 0 ? 'rank-1' : 
                         index === 1 ? 'rank-2' : 
                         index === 2 ? 'rank-3' : '';
        
        // 检查是否有照片
        const hasPhoto = athlete.photo && 
                        (athlete.photo.original || athlete.photo.optimized || 
                         typeof athlete.photo === 'string');
        
        html += `
            <div class="ranking-item ${rankClass} ${hasPhoto ? 'has-photo' : ''}" 
                 onclick="showAthleteImage(${JSON.stringify(athlete).replace(/"/g, '&quot;')})">
                <div class="rank-number">${index + 1}</div>
                <div class="athlete-info">
                    <div class="athlete-name">
                        ${athlete.name}
                        ${hasPhoto ? ' <i class="fas fa-camera" style="color:#666;font-size:0.9em;"></i>' : ''}
                    </div>
                    <div class="athlete-stats">
                        <div class="athlete-stat">
                            <i class="fas fa-road"></i>
                            <span>${athlete.distance} km</span>
                        </div>
                        <div class="athlete-stat">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>${athlete.pace}/km</span>
                        </div>
                        <div class="athlete-stat">
                            <i class="far fa-calendar-alt"></i>
                            <span>${athlete.date || '未知日期'}</span>
                        </div>
                    </div>
                </div>
                <div class="athlete-score">${athlete.score || calculateScore(athlete.distance, athlete.pace)} 分</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 显示运动员图片和详情（在主页面中定义）
function showAthleteImage(athlete) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalName = document.getElementById('modal-athlete-name');
    const modalDistance = document.getElementById('modal-distance');
    const modalPace = document.getElementById('modal-pace');
    const modalDate = document.getElementById('modal-date');
    const modalReflections = document.getElementById('modal-reflections-text');
    
    // 设置模态框内容
    modalName.textContent = `${athlete.name} 的跑步记录`;
    modalDistance.textContent = `${athlete.distance} km`;
    modalPace.textContent = `${athlete.pace}/km`;
    modalDate.textContent = athlete.date || '未知日期';
    modalReflections.textContent = athlete.reflections || '暂无跑步心得';
    
    // 设置图片
    const imageContainer = modalImage.parentElement;
    
    // 清除之前的无照片提示
    const existingNoPhoto = imageContainer.querySelector('.no-photo');
    if (existingNoPhoto) {
        existingNoPhoto.remove();
    }
    
    // 确定图片URL
    let imageUrl = '';
    if (athlete.photo) {
        if (typeof athlete.photo === 'object') {
            // 如果是Cloudinary返回的对象
            imageUrl = athlete.photo.optimized || athlete.photo.original || '';
        } else {
            // 如果是直接存储的URL字符串
            imageUrl = athlete.photo;
        }
    }
    
    if (imageUrl) {
        modalImage.src = imageUrl;
        modalImage.alt = `${athlete.name}的跑步照片`;
        modalImage.style.display = 'block';
    } else {
        modalImage.style.display = 'none';
        // 添加无照片提示
        const noPhotoDiv = document.createElement('div');
        noPhotoDiv.className = 'no-photo';
        noPhotoDiv.innerHTML = `
            <i class="far fa-image"></i>
            <p>该运动员未上传跑步照片</p>
        `;
        imageContainer.appendChild(noPhotoDiv);
    }
    
    // 显示模态框
    modal.style.display = 'flex';
}

// 更新Netlify Functions中的add-data.js以支持图片数据
// 在netlify/functions/add-data.js中添加图片处理逻辑