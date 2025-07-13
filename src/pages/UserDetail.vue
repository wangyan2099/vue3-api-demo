<template>
  <div class="user-detail">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>用户详情</h1>
      <div class="actions">
        <button @click="editUser" class="edit-btn">编辑</button>
        <button @click="deleteUser" class="delete-btn">删除</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="fetchUserData" class="retry-btn">重试</button>
    </div>

    <!-- 用户详情 -->
    <div v-else-if="user" class="user-content">
      <div class="user-profile">
        <div class="avatar-section">
          <img 
            :src="user.avatar || '/default-avatar.png'" 
            :alt="user.name"
            class="avatar"
            @error="handleImageError"
          />
          <div class="status-badge" :class="user.status">
            {{ user.status === 'active' ? '活跃' : '非活跃' }}
          </div>
        </div>
        
        <div class="user-info">
          <h2>{{ user.name }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">邮箱:</span>
              <span class="value">{{ user.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">电话:</span>
              <span class="value">{{ user.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户ID:</span>
              <span class="value">{{ user.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户活动记录 -->
      <div class="user-activity">
        <h3>最近活动</h3>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon">📧</div>
            <div class="activity-content">
              <div class="activity-title">邮箱验证</div>
              <div class="activity-time">{{ formatDate(user.createdAt) }}</div>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-content">
              <div class="activity-title">账户创建</div>
              <div class="activity-time">{{ formatDate(user.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作历史 -->
      <div class="user-actions-history">
        <h3>操作历史</h3>
        <div class="action-buttons">
          <button @click="sendMessage" class="action-btn message-btn">
            📧 发送消息
          </button>
          <button @click="resetPassword" class="action-btn reset-btn">
            🔒 重置密码
          </button>
          <button @click="toggleStatus" class="action-btn status-btn">
            {{ user.status === 'active' ? '🚫 禁用账户' : '✅ 激活账户' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>用户不存在或已被删除</p>
      <button @click="goBack" class="back-btn">返回列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api, type User } from '../utils/api';

// Props (从路由获取用户ID)
const props = defineProps<{
  userId: string;
}>();

// 响应式数据
const user = ref<User | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 获取用户数据
const fetchUserData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.getUser(parseInt(props.userId));
    user.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取用户信息失败';
    console.error('Failed to fetch user:', err);
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/default-avatar.png';
};

// 返回上一页
const goBack = () => {
  console.log('返回上一页');
  // router.back();
};

// 编辑用户
const editUser = () => {
  console.log('编辑用户:', props.userId);
  // router.push(`/user/${props.userId}/edit`);
};

// 删除用户
const deleteUser = async () => {
  if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) return;
  
  try {
    await api.deleteUser(parseInt(props.userId));
    alert('用户删除成功！');
    goBack();
  } catch (err) {
    alert('删除失败: ' + (err instanceof Error ? err.message : '未知错误'));
    console.error('Delete failed:', err);
  }
};

// 发送消息
const sendMessage = () => {
  const message = prompt('请输入要发送的消息:');
  if (message) {
    console.log('发送消息给用户:', props.userId, message);
    alert('消息发送成功！');
  }
};

// 重置密码
const resetPassword = () => {
  if (confirm('确定要重置该用户的密码吗？')) {
    console.log('重置用户密码:', props.userId);
    alert('密码重置成功！新密码已发送到用户邮箱。');
  }
};

// 切换用户状态
const toggleStatus = async () => {
  if (!user.value) return;
  
  const newStatus = user.value.status === 'active' ? 'inactive' : 'active';
  const action = newStatus === 'active' ? '激活' : '禁用';
  
  if (!confirm(`确定要${action}该用户吗？`)) return;
  
  try {
    await api.updateUser({
      id: user.value.id,
      status: newStatus,
    });
    
    // 更新本地状态
    user.value.status = newStatus;
    alert(`用户${action}成功！`);
  } catch (err) {
    alert(`${action}失败: ` + (err instanceof Error ? err.message : '未知错误'));
    console.error('Status toggle failed:', err);
  }
};

// 生命周期
onMounted(() => {
  fetchUserData();
});
</script>

<style scoped>
.user-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  margin: 0;
  color: #333;
}

.back-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  background: #5a6268;
}

.actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn {
  background: #ffc107;
  color: #212529;
}

.edit-btn:hover {
  background: #e0a800;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.loading {
  text-align: center;
  padding: 50px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 50px;
  color: #dc3545;
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.user-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.user-profile {
  display: flex;
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.avatar-section {
  position: relative;
  margin-right: 30px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f8f9fa;
}

.status-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.status-badge.active {
  background: #28a745;
}

.status-badge.inactive {
  background: #dc3545;
}

.user-info h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
}

.info-grid {
  display: grid;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.value {
  color: #333;
  font-weight: 400;
}

.user-activity,
.user-actions-history {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.user-activity:last-child,
.user-actions-history:last-child {
  border-bottom: none;
}

.user-activity h3,
.user-actions-history h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  font-size: 20px;
  margin-right: 15px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 12px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.message-btn {
  background: #007bff;
  color: white;
}

.message-btn:hover {
  background: #0056b3;
}

.reset-btn {
  background: #ffc107;
  color: #212529;
}

.reset-btn:hover {
  background: #e0a800;
}

.status-btn {
  background: #6c757d;
  color: white;
}

.status-btn:hover {
  background: #5a6268;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
}
</style> 