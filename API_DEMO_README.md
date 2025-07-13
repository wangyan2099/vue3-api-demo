# Vue 3 API 调用演示项目

这是一个完整的Vue 3 + TypeScript项目，演示了各种API调用模式和最佳实践。

## 🚀 项目特性

- **Vue 3 + TypeScript**: 使用最新的Vue 3 Composition API
- **完整的API层**: 包含GET、POST、PUT、DELETE等所有HTTP方法
- **组合式函数**: 可复用的API调用逻辑
- **缓存机制**: 智能缓存管理，提升性能
- **错误处理**: 完善的错误处理和重试机制
- **批量操作**: 支持批量处理用户数据
- **响应式UI**: 现代化的用户界面设计

## 📁 项目结构

```
src/
├── utils/
│   └── api.ts              # API服务层
├── composables/
│   └── useApi.ts           # 组合式函数
├── pages/
│   ├── UserList.vue        # 用户列表页面
│   ├── UserForm.vue        # 用户表单页面
│   ├── UserDetail.vue      # 用户详情页面
│   └── UserManagement.vue  # 用户管理页面
└── App.vue                 # 主应用组件
```

## 🔧 API 配置

### 开发环境代理配置

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://esearch-rxdtest.midbus.cn',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### 生产环境Nginx配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass https://esearch-rxdtest.midbus.cn/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📚 API 调用示例

### 1. 基础API服务层 (`utils/api.ts`)

```typescript
// 获取用户列表
const response = await api.getUsers();

// 获取单个用户
const user = await api.getUser(1);

// 创建用户
const newUser = await api.createUser({
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '13800138000'
});

// 更新用户
const updatedUser = await api.updateUser({
  id: 1,
  name: '李四',
  status: 'active'
});

// 删除用户
await api.deleteUser(1);

// 搜索用户
const searchResults = await api.searchUsers('张三');

// 获取统计信息
const stats = await api.getUserStats();
```

### 2. 组合式函数 (`composables/useApi.ts`)

```typescript
// 使用用户管理组合式函数
const { users, stats, fetchUsers, createUser, updateUser, deleteUser } = useUsers();

// 使用单个用户组合式函数
const { user, fetchUser, updateUser } = useUser(userId);

// 使用批量操作组合式函数
const { batchLoading, batchProgress, batchResults, batchDeleteUsers } = useBatchOperations();
```

### 3. 页面组件中的API调用

#### 用户列表页面 (`pages/UserList.vue`)

```vue
<template>
  <div class="user-list">
    <!-- 搜索框 -->
    <input v-model="searchQuery" @input="handleSearch" placeholder="搜索用户..." />
    
    <!-- 用户卡片 -->
    <div v-for="user in users" :key="user.id" class="user-card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <button @click="deleteUser(user.id)">删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUsers } from '../composables/useApi';

const { users, fetchUsers, searchUsers, deleteUser } = useUsers();

// 搜索防抖
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (searchQuery.value) {
      searchUsers(searchQuery.value);
    } else {
      fetchUsers();
    }
  }, 300);
};
</script>
```

#### 用户表单页面 (`pages/UserForm.vue`)

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" required />
    <input v-model="form.email" type="email" required />
    <input v-model="form.phone" type="tel" required />
    <button type="submit">{{ isEdit ? '更新' : '创建' }}</button>
  </form>
</template>

<script setup lang="ts">
import { api } from '../utils/api';

const handleSubmit = async () => {
  if (isEdit.value) {
    await api.updateUser({ id: userId, ...form });
  } else {
    await api.createUser(form);
  }
};
</script>
```

### 4. 高级功能演示

#### 缓存管理

```typescript
import { cacheManager } from '../composables/useApi';

// 清除所有缓存
cacheManager.clear();

// 获取缓存大小
const size = cacheManager.size();

// 检查是否有缓存
const hasCache = cacheManager.has('users');
```

#### 批量操作

```typescript
import { useBatchOperations } from '../composables/useApi';

const { batchDeleteUsers, batchUpdateUserStatus } = useBatchOperations();

// 批量删除用户
await batchDeleteUsers([1, 2, 3, 4, 5]);

// 批量更新用户状态
await batchUpdateUserStatus([1, 2, 3], 'active');
```

#### 错误处理和重试

```typescript
// API层自动重试机制
const response = await retry(() => api.getUsers(), 3, 1000);

// 页面级错误处理
try {
  const users = await fetchUsers();
} catch (error) {
  error.value = error.message;
  // 显示错误信息给用户
}
```

## 🎯 使用指南

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 构建生产版本

```bash
npm run build
```

### 3. Docker部署

```bash
# 构建镜像
docker build -t vue3-api-demo .

# 运行容器
docker run -p 8080:80 vue3-api-demo
```

### 4. 测试API调用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击导航栏中的不同页面
3. 在"API演示"页面测试各种API调用
4. 查看控制台和网络面板了解请求详情

## 🔍 API 端点说明

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| GET | `/api/users/:id` | 获取单个用户 |
| POST | `/api/users` | 创建新用户 |
| PUT | `/api/users/:id` | 更新用户信息 |
| DELETE | `/api/users/:id` | 删除用户 |
| GET | `/api/users/search?q=:query` | 搜索用户 |
| GET | `/api/users/stats` | 获取用户统计 |

## 📝 最佳实践

### 1. 错误处理

```typescript
try {
  const response = await api.getUsers();
  // 处理成功响应
} catch (error) {
  // 统一错误处理
  console.error('API调用失败:', error);
  // 显示用户友好的错误信息
}
```

### 2. 加载状态管理

```typescript
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    await api.getUsers();
  } finally {
    loading.value = false;
  }
};
```

### 3. 表单验证

```typescript
const validateForm = () => {
  const errors = {};
  
  if (!form.name.trim()) {
    errors.name = '姓名不能为空';
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址';
  }
  
  return Object.keys(errors).length === 0;
};
```

### 4. 缓存策略

```typescript
// 使用缓存获取数据
const users = await fetchUsers(); // 自动使用缓存

// 强制刷新
const freshUsers = await fetchUsers(true); // 忽略缓存
```

## 🚀 性能优化

1. **智能缓存**: 自动缓存API响应，减少重复请求
2. **防抖搜索**: 搜索输入防抖，避免频繁API调用
3. **批量操作**: 支持批量处理，减少网络请求次数
4. **懒加载**: 按需加载组件和数据
5. **错误重试**: 自动重试失败的请求

## 🔧 自定义配置

### 修改API基础URL

```typescript
// utils/api.ts
const API_BASE_URL = '/api'; // 修改为你的API地址
```

### 调整缓存时间

```typescript
// composables/useApi.ts
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5分钟
```

### 配置重试策略

```typescript
// composables/useApi.ts
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  // 自定义重试逻辑
};
```

## 📞 技术支持

如有问题或建议，请查看：

1. Vue 3 官方文档: https://vuejs.org/
2. TypeScript 官方文档: https://www.typescriptlang.org/
3. Vite 官方文档: https://vitejs.dev/

---

这个项目展示了现代Vue 3应用中API调用的完整解决方案，可以作为实际项目的参考模板。 