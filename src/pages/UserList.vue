<template>
  <div class="user-list">
    <div class="header">
      <h1>用户管理</h1>
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          placeholder="搜索用户..."
          class="search-input"
        />
        <button @click="refreshUsers" class="refresh-btn">刷新</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats" v-if="stats">
      <div class="stat-item">
        <span class="stat-label">总用户数:</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">活跃用户:</span>
        <span class="stat-value active">{{ stats.active }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">非活跃用户:</span>
        <span class="stat-value inactive">{{ stats.inactive }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="refreshUsers" class="retry-btn">重试</button>
    </div>

    <!-- 用户列表 -->
    <div v-else class="user-grid">
      <div 
        v-for="user in users" 
        :key="user.id" 
        class="user-card"
        @click="viewUser(user.id)"
      >
        <div class="user-avatar">
          <img 
            :src="user.avatar || '/default-avatar.png'" 
            :alt="user.name"
            @error="handleImageError"
          />
        </div>
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p class="email">{{ user.email }}</p>
          <p class="phone">{{ user.phone }}</p>
          <span :class="['status', user.status]">
            {{ user.status === 'active' ? '活跃' : '非活跃' }}
          </span>
        </div>
        <div class="user-actions">
          <button @click.stop="editUser(user)" class="edit-btn">编辑</button>
          <button @click.stop="deleteUser(user.id)" class="delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !error && users.length === 0" class="empty-state">
      <p>暂无用户数据</p>
      <button @click="refreshUsers" class="add-btn">添加用户</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api, type User } from '../utils/api';

// 响应式数据
const users = ref<User[]>([]);
const stats = ref<{ total: number; active: number; inactive: number } | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');

// 搜索防抖
let searchTimeout: number;

// 计算属性
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  return users.value.filter(user => 
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 方法
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.getUsers();
    users.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取用户列表失败';
    console.error('Failed to fetch users:', err);
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const response = await api.getUserStats();
    stats.value = response.data;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
};

const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    if (searchQuery.value) {
      searchUsers();
    } else {
      fetchUsers();
    }
  }, 300);
};

const searchUsers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.searchUsers(searchQuery.value);
    users.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败';
    console.error('Search failed:', err);
  } finally {
    loading.value = false;
  }
};

const refreshUsers = () => {
  searchQuery.value = '';
  fetchUsers();
  fetchStats();
};

const viewUser = (id: number) => {
  // 跳转到用户详情页面
  console.log('查看用户:', id);
  // router.push(`/user/${id}`);
};

const editUser = (user: User) => {
  // 跳转到编辑页面
  console.log('编辑用户:', user);
  // router.push(`/user/${user.id}/edit`);
};

const deleteUser = async (id: number) => {
  if (!confirm('确定要删除这个用户吗？')) return;
  
  try {
    await api.deleteUser(id);
    // 重新获取用户列表
    await fetchUsers();
    await fetchStats();
    alert('用户删除成功！');
  } catch (err) {
    alert('删除失败: ' + (err instanceof Error ? err.message : '未知错误'));
    console.error('Delete failed:', err);
  }
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/default-avatar.png';
};

// 生命周期
onMounted(() => {
  fetchUsers();
  fetchStats();
});
</script>

<style scoped>
.user-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.search-bar {
  display: flex;
  gap: 10px;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: 250px;
  font-size: 14px;
}

.refresh-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.refresh-btn:hover {
  background: #0056b3;
}

.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-value.active {
  color: #28a745;
}

.stat-value.inactive {
  color: #dc3545;
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

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.user-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-avatar {
  text-align: center;
  margin-bottom: 15px;
}

.user-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.user-info p {
  margin: 5px 0;
  color: #666;
}

.status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.inactive {
  background: #f8d7da;
  color: #721c24;
}

.user-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.edit-btn, .delete-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
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

.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
}

.add-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.add-btn:hover {
  background: #218838;
}
</style> 