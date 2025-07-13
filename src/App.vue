<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Vue 3 API 演示</h1>
      </div>
      <div class="nav-links">
        <button @click="currentPage = 'home'" :class="{ active: currentPage === 'home' }">
          首页
        </button>
        <button @click="currentPage = 'userList'" :class="{ active: currentPage === 'userList' }">
          用户列表
        </button>
        <button @click="currentPage = 'userForm'" :class="{ active: currentPage === 'userForm' }">
          创建用户
        </button>
        <button @click="currentPage = 'userManagement'" :class="{ active: currentPage === 'userManagement' }">
          用户管理
        </button>
        <button @click="currentPage = 'apiDemo'" :class="{ active: currentPage === 'apiDemo' }">
          API 演示
        </button>
      </div>
    </nav>

    <main class="main-content">
      <!-- 首页 -->
      <div v-if="currentPage === 'home'" class="home-page">
        <div class="hero">
          <h2>Vue 3 + TypeScript + API 调用演示</h2>
          <p>这是一个完整的API调用演示项目，展示了各种HTTP方法和最佳实践</p>
        </div>
        
        <div class="features">
          <div class="feature-card">
            <h3>🔍 GET 请求</h3>
            <p>获取用户列表、用户详情、统计数据</p>
            <button @click="currentPage = 'userList'">查看演示</button>
          </div>
          
          <div class="feature-card">
            <h3>📝 POST 请求</h3>
            <p>创建新用户、提交表单数据</p>
            <button @click="currentPage = 'userForm'">查看演示</button>
          </div>
          
          <div class="feature-card">
            <h3>✏️ PUT 请求</h3>
            <p>更新用户信息、修改状态</p>
            <button @click="currentPage = 'userManagement'">查看演示</button>
          </div>
          
          <div class="feature-card">
            <h3>🗑️ DELETE 请求</h3>
            <p>删除用户、批量操作</p>
            <button @click="currentPage = 'userManagement'">查看演示</button>
          </div>
        </div>

        <div class="api-info">
          <h3>API 代理配置</h3>
          <p>本项目配置了API代理，所有 <code>/api/*</code> 请求都会被代理到远程服务器</p>
          <div class="code-block">
            <pre>// 开发环境: Vite 代理
// 生产环境: Nginx 反向代理
// 目标服务器: https://esearch-rxdtest.midbus.cn/api</pre>
          </div>
        </div>
      </div>

      <!-- 用户列表页面 -->
      <UserList v-else-if="currentPage === 'userList'" />

      <!-- 用户表单页面 -->
      <UserForm v-else-if="currentPage === 'userForm'" />

      <!-- 用户管理页面 -->
      <UserManagement v-else-if="currentPage === 'userManagement'" />

      <!-- API 演示页面 -->
      <div v-else-if="currentPage === 'apiDemo'" class="api-demo">
        <h2>API 调用演示</h2>
        
        <div class="demo-section">
          <h3>基础 API 调用</h3>
          <div class="demo-buttons">
            <button @click="testGetUsers" :disabled="loading">获取用户列表</button>
            <button @click="testGetUserStats" :disabled="loading">获取统计数据</button>
            <button @click="testSearchUsers" :disabled="loading">搜索用户</button>
          </div>
        </div>

        <div class="demo-section">
          <h3>用户操作</h3>
          <div class="demo-buttons">
            <button @click="testCreateUser" :disabled="loading">创建用户</button>
            <button @click="testUpdateUser" :disabled="loading">更新用户</button>
            <button @click="testDeleteUser" :disabled="loading">删除用户</button>
          </div>
        </div>

        <div class="demo-section">
          <h3>组合式函数演示</h3>
          <div class="demo-buttons">
            <button @click="testComposables" :disabled="loading">测试组合式函数</button>
            <button @click="testCache" :disabled="loading">测试缓存</button>
            <button @click="testBatchOperations" :disabled="loading">测试批量操作</button>
          </div>
        </div>

        <!-- 结果显示 -->
        <div v-if="apiResult" class="api-result">
          <h4>API 调用结果:</h4>
          <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
        </div>

        <!-- 错误显示 -->
        <div v-if="apiError" class="api-error">
          <h4>错误信息:</h4>
          <pre>{{ apiError }}</pre>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from './utils/api';
import { useUsers, useBatchOperations, cacheManager } from './composables/useApi';
import UserList from './pages/UserList.vue';
import UserForm from './pages/UserForm.vue';
import UserManagement from './pages/UserManagement.vue';

// 页面状态
const currentPage = ref('home');
const loading = ref(false);
const apiResult = ref<any>(null);
const apiError = ref<string | null>(null);

// 使用组合式函数
const { fetchUsers, fetchStats, searchUsers, createUser, updateUser, deleteUser } = useUsers();
const { batchDeleteUsers, batchUpdateUserStatus } = useBatchOperations();

// API 测试方法
const testGetUsers = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await api.getUsers();
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testGetUserStats = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await api.getUserStats();
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testSearchUsers = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await api.searchUsers('test');
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testCreateUser = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await api.createUser({
      name: '测试用户',
      email: 'test@example.com',
      phone: '13800138000'
    });
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testUpdateUser = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await api.updateUser({
      id: 1,
      name: '更新后的用户',
      status: 'active'
    });
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testDeleteUser = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await api.deleteUser(1);
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testComposables = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const users = await fetchUsers();
    const stats = await fetchStats();
    apiResult.value = { users, stats };
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testCache = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    // 第一次调用
    await fetchUsers();
    const cacheSize1 = cacheManager.size();
    
    // 第二次调用（应该使用缓存）
    await fetchUsers();
    const cacheSize2 = cacheManager.size();
    
    // 清除缓存
    cacheManager.clear();
    const cacheSize3 = cacheManager.size();
    
    apiResult.value = {
      firstCall: '完成',
      secondCall: '完成（使用缓存）',
      cacheSizeBefore: cacheSize1,
      cacheSizeAfter: cacheSize2,
      cacheSizeAfterClear: cacheSize3
    };
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};

const testBatchOperations = async () => {
  loading.value = true;
  apiError.value = null;
  try {
    const result = await batchUpdateUserStatus([1, 2, 3], 'active');
    apiResult.value = result;
  } catch (error) {
    apiError.value = error instanceof Error ? error.message : '未知错误';
  } finally {
    loading.value = false;
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h1 {
  font-size: 1.5rem;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-links button {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-links button:hover {
  background: #f0f0f0;
}

.nav-links button.active {
  background: #007bff;
  color: white;
}

.main-content {
  padding: 2rem;
}

.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.hero h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.feature-card button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.feature-card button:hover {
  background: #0056b3;
}

.api-info {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.api-info h3 {
  margin-bottom: 1rem;
  color: #333;
}

.api-info p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #333;
}

.api-demo {
  max-width: 1000px;
  margin: 0 auto;
}

.api-demo h2 {
  margin-bottom: 2rem;
  color: #333;
}

.demo-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.demo-section h3 {
  margin-bottom: 1rem;
  color: #333;
}

.demo-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.demo-buttons button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.demo-buttons button:hover:not(:disabled) {
  background: #0056b3;
}

.demo-buttons button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.api-result, .api-error {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.api-result h4, .api-error h4 {
  margin-bottom: 1rem;
  color: #333;
}

.api-result pre, .api-error pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.api-error pre {
  color: #dc3545;
  background: #f8d7da;
  border-color: #f5c6cb;
}
</style> 