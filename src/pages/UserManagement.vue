<template>
  <div class="user-management">
    <div class="header">
      <h1>用户管理系统</h1>
      <div class="header-actions">
        <button @click="refreshData" class="refresh-btn">🔄 刷新</button>
        <button @click="clearCache" class="cache-btn">🗑️ 清除缓存</button>
        <button @click="showCreateForm = true" class="create-btn">➕ 创建用户</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section" v-if="stats.data">
      <div class="stat-card">
        <div class="stat-number">{{ stats.data.total }}</div>
        <div class="stat-label">总用户数</div>
      </div>
      <div class="stat-card active">
        <div class="stat-number">{{ stats.data.active }}</div>
        <div class="stat-label">活跃用户</div>
      </div>
      <div class="stat-card inactive">
        <div class="stat-number">{{ stats.data.inactive }}</div>
        <div class="stat-label">非活跃用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ cacheManager.size() }}</div>
        <div class="stat-label">缓存项</div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          placeholder="搜索用户..."
          class="search-input"
        />
        <button @click="clearSearch" class="clear-btn">✕</button>
      </div>
      <div class="filter-options">
        <select v-model="statusFilter" @change="applyFilters">
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="inactive">非活跃</option>
        </select>
      </div>
    </div>

    <!-- 批量操作 -->
    <div class="batch-actions" v-if="selectedUsers.length > 0">
      <div class="batch-info">
        已选择 {{ selectedUsers.length }} 个用户
      </div>
      <div class="batch-buttons">
        <button @click="batchActivate" :disabled="batchLoading" class="batch-btn activate">
          ✅ 批量激活
        </button>
        <button @click="batchDeactivate" :disabled="batchLoading" class="batch-btn deactivate">
          🚫 批量禁用
        </button>
        <button @click="batchDelete" :disabled="batchLoading" class="batch-btn delete">
          🗑️ 批量删除
        </button>
      </div>
    </div>

    <!-- 批量操作进度 -->
    <div v-if="batchLoading" class="batch-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: batchProgress + '%' }"></div>
      </div>
      <div class="progress-text">
        处理中... {{ Math.round(batchProgress) }}%
      </div>
    </div>

    <!-- 批量操作结果 -->
    <div v-if="batchResults.success > 0 || batchResults.failed > 0" class="batch-results">
      <div class="result-item success">
        ✅ 成功: {{ batchResults.success }}
      </div>
      <div class="result-item failed">
        ❌ 失败: {{ batchResults.failed }}
      </div>
      <div v-if="batchResults.errors.length > 0" class="error-list">
        <div v-for="error in batchResults.errors" :key="error" class="error-item">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-section">
      <div v-if="users.loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="users.error" class="error">
        <p>❌ {{ users.error }}</p>
        <button @click="refreshData" class="retry-btn">重试</button>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <p>暂无用户数据</p>
        <button @click="showCreateForm = true" class="create-btn">创建第一个用户</button>
      </div>

      <div v-else class="users-grid">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id" 
          class="user-card"
          :class="{ selected: selectedUsers.includes(user.id) }"
        >
          <div class="user-header">
            <input 
              type="checkbox" 
              :checked="selectedUsers.includes(user.id)"
              @change="toggleUserSelection(user.id)"
              class="user-checkbox"
            />
            <div class="user-avatar">
              <img 
                :src="user.avatar || '/default-avatar.png'" 
                :alt="user.name"
                @error="handleImageError"
              />
            </div>
            <div class="user-status" :class="user.status">
              {{ user.status === 'active' ? '活跃' : '非活跃' }}
            </div>
          </div>
          
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p class="email">{{ user.email }}</p>
            <p class="phone">{{ user.phone }}</p>
            <p class="created">创建于: {{ formatDate(user.createdAt) }}</p>
          </div>
          
          <div class="user-actions">
            <button @click="viewUser(user.id)" class="action-btn view">👁️ 查看</button>
            <button @click="editUser(user.id)" class="action-btn edit">✏️ 编辑</button>
            <button @click="deleteUser(user.id)" class="action-btn delete">🗑️ 删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建用户表单 -->
    <div v-if="showCreateForm" class="modal-overlay" @click="showCreateForm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>创建新用户</h2>
          <button @click="showCreateForm = false" class="close-btn">✕</button>
        </div>
        <UserForm @user-created="handleUserCreated" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useUsers, useBatchOperations, cacheManager } from '../composables/useApi';
import UserForm from './UserForm.vue';

// 使用组合式函数
const { 
  users, 
  stats, 
  fetchUsers, 
  fetchStats, 
  searchUsers, 
  deleteUser: removeUser 
} = useUsers();

const { 
  batchLoading, 
  batchProgress, 
  batchResults, 
  batchDeleteUsers, 
  batchUpdateUserStatus 
} = useBatchOperations();

// 响应式数据
const searchQuery = ref('');
const statusFilter = ref('');
const selectedUsers = ref<number[]>([]);
const showCreateForm = ref(false);

// 搜索防抖
let searchTimeout: number;

// 计算属性
const filteredUsers = computed(() => {
  let filtered = users.data || [];
  
  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(user => user.status === statusFilter.value);
  }
  
  return filtered;
});

// 方法
const refreshData = async () => {
  try {
    await Promise.all([
      fetchUsers(true), // 强制刷新
      fetchStats(true)
    ]);
  } catch (error) {
    console.error('刷新数据失败:', error);
  }
};

const clearCache = () => {
  cacheManager.clear();
  alert('缓存已清除');
};

const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(async () => {
    if (searchQuery.value.trim()) {
      try {
        await searchUsers(searchQuery.value);
      } catch (error) {
        console.error('搜索失败:', error);
      }
    } else {
      await fetchUsers();
    }
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchUsers();
};

const applyFilters = () => {
  // 筛选逻辑已在计算属性中处理
};

const toggleUserSelection = (userId: number) => {
  const index = selectedUsers.value.indexOf(userId);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  } else {
    selectedUsers.value.push(userId);
  }
};

const batchActivate = async () => {
  if (!confirm(`确定要激活选中的 ${selectedUsers.value.length} 个用户吗？`)) return;
  
  try {
    await batchUpdateUserStatus(selectedUsers.value, 'active');
    selectedUsers.value = [];
    await refreshData();
  } catch (error) {
    console.error('批量激活失败:', error);
  }
};

const batchDeactivate = async () => {
  if (!confirm(`确定要禁用选中的 ${selectedUsers.value.length} 个用户吗？`)) return;
  
  try {
    await batchUpdateUserStatus(selectedUsers.value, 'inactive');
    selectedUsers.value = [];
    await refreshData();
  } catch (error) {
    console.error('批量禁用失败:', error);
  }
};

const batchDelete = async () => {
  if (!confirm(`确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可撤销！`)) return;
  
  try {
    await batchDeleteUsers(selectedUsers.value);
    selectedUsers.value = [];
    await refreshData();
  } catch (error) {
    console.error('批量删除失败:', error);
  }
};

const viewUser = (userId: number) => {
  console.log('查看用户:', userId);
  // router.push(`/user/${userId}`);
};

const editUser = (userId: number) => {
  console.log('编辑用户:', userId);
  // router.push(`/user/${userId}/edit`);
};

const deleteUser = async (userId: number) => {
  if (!confirm('确定要删除这个用户吗？')) return;
  
  try {
    await removeUser(userId);
    await refreshData();
    alert('用户删除成功！');
  } catch (error) {
    alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
};

const handleUserCreated = () => {
  showCreateForm.value = false;
  refreshData();
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/default-avatar.png';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    fetchUsers();
  }
});

// 生命周期
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.user-management {
  max-width: 1400px;
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

.header-actions {
  display: flex;
  gap: 10px;
}

.refresh-btn, .cache-btn, .create-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn {
  background: #007bff;
  color: white;
}

.cache-btn {
  background: #6c757d;
  color: white;
}

.create-btn {
  background: #28a745;
  color: white;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card.active {
  border-left: 4px solid #28a745;
}

.stat-card.inactive {
  border-left: 4px solid #dc3545;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.search-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.filter-options select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.batch-info {
  font-weight: 500;
  color: #333;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.batch-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.batch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.batch-btn.activate {
  background: #28a745;
  color: white;
}

.batch-btn.deactivate {
  background: #ffc107;
  color: #212529;
}

.batch-btn.delete {
  background: #dc3545;
  color: white;
}

.batch-progress {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.batch-results {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.result-item {
  margin-bottom: 8px;
  font-weight: 500;
}

.result-item.success {
  color: #28a745;
}

.result-item.failed {
  color: #dc3545;
}

.error-list {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #dee2e6;
}

.error-item {
  font-size: 12px;
  color: #dc3545;
  margin-bottom: 4px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.user-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-card.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.user-checkbox {
  margin-right: 10px;
}

.user-avatar {
  margin-right: 15px;
}

.user-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.user-status {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.user-status.active {
  background: #d4edda;
  color: #155724;
}

.user-status.inactive {
  background: #f8d7da;
  color: #721c24;
}

.user-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.user-info p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.user-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.view {
  background: #007bff;
  color: white;
}

.action-btn.edit {
  background: #ffc107;
  color: #212529;
}

.action-btn.delete {
  background: #dc3545;
  color: white;
}

.loading, .error, .empty-state {
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

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}
</style> 