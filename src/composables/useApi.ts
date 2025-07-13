import { ref, reactive, computed } from 'vue';
import { api, type User, type CreateUserRequest, type UpdateUserRequest } from '../utils/api';

// API 状态管理
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// 缓存管理
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// 默认缓存时间（5分钟）
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

// 清除过期缓存
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
};

// 获取缓存数据
const getCachedData = <T>(key: string): T | null => {
  clearExpiredCache();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

// 设置缓存数据
const setCachedData = <T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

// 重试机制
const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries) break;
      
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};

// 用户管理组合式函数
export function useUsers() {
  const users = reactive<ApiState<User[]>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const stats = reactive<ApiState<{ total: number; active: number; inactive: number }>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // 获取用户列表（带缓存）
  const fetchUsers = async (forceRefresh = false) => {
    const cacheKey = 'users';
    
    if (!forceRefresh) {
      const cached = getCachedData<User[]>(cacheKey);
      if (cached) {
        users.data = cached;
        users.lastUpdated = new Date();
        return cached;
      }
    }

    users.loading = true;
    users.error = null;

    try {
      const response = await retry(() => api.getUsers());
      users.data = response.data;
      users.lastUpdated = new Date();
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      users.error = error instanceof Error ? error.message : '获取用户列表失败';
      throw error;
    } finally {
      users.loading = false;
    }
  };

  // 获取用户统计（带缓存）
  const fetchStats = async (forceRefresh = false) => {
    const cacheKey = 'user-stats';
    
    if (!forceRefresh) {
      const cached = getCachedData<{ total: number; active: number; inactive: number }>(cacheKey);
      if (cached) {
        stats.data = cached;
        stats.lastUpdated = new Date();
        return cached;
      }
    }

    stats.loading = true;
    stats.error = null;

    try {
      const response = await retry(() => api.getUserStats());
      stats.data = response.data;
      stats.lastUpdated = new Date();
      setCachedData(cacheKey, response.data, 2 * 60 * 1000); // 2分钟缓存
      return response.data;
    } catch (error) {
      stats.error = error instanceof Error ? error.message : '获取统计信息失败';
      throw error;
    } finally {
      stats.loading = false;
    }
  };

  // 搜索用户
  const searchUsers = async (query: string) => {
    users.loading = true;
    users.error = null;

    try {
      const response = await retry(() => api.searchUsers(query));
      users.data = response.data;
      users.lastUpdated = new Date();
      return response.data;
    } catch (error) {
      users.error = error instanceof Error ? error.message : '搜索失败';
      throw error;
    } finally {
      users.loading = false;
    }
  };

  // 创建用户
  const createUser = async (userData: CreateUserRequest) => {
    try {
      const response = await api.createUser(userData);
      // 清除用户列表缓存
      cache.delete('users');
      cache.delete('user-stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // 更新用户
  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      const response = await api.updateUser(userData);
      // 清除相关缓存
      cache.delete('users');
      cache.delete('user-stats');
      cache.delete(`user-${userData.id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      await api.deleteUser(id);
      // 清除相关缓存
      cache.delete('users');
      cache.delete('user-stats');
      cache.delete(`user-${id}`);
    } catch (error) {
      throw error;
    }
  };

  // 计算属性
  const hasData = computed(() => users.data !== null);
  const hasError = computed(() => users.error !== null);
  const isLoading = computed(() => users.loading);
  const lastUpdated = computed(() => users.lastUpdated);

  return {
    // 状态
    users,
    stats,
    hasData,
    hasError,
    isLoading,
    lastUpdated,
    
    // 方法
    fetchUsers,
    fetchStats,
    searchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

// 单个用户管理组合式函数
export function useUser(userId: string | number) {
  const user = reactive<ApiState<User>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // 获取用户详情（带缓存）
  const fetchUser = async (forceRefresh = false) => {
    const id = typeof userId === 'string' ? parseInt(userId) : userId;
    const cacheKey = `user-${id}`;
    
    if (!forceRefresh) {
      const cached = getCachedData<User>(cacheKey);
      if (cached) {
        user.data = cached;
        user.lastUpdated = new Date();
        return cached;
      }
    }

    user.loading = true;
    user.error = null;

    try {
      const response = await retry(() => api.getUser(id));
      user.data = response.data;
      user.lastUpdated = new Date();
      setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      user.error = error instanceof Error ? error.message : '获取用户信息失败';
      throw error;
    } finally {
      user.loading = false;
    }
  };

  // 更新用户
  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      const response = await api.updateUser(userData);
      user.data = response.data;
      user.lastUpdated = new Date();
      
      // 更新缓存
      const id = typeof userId === 'string' ? parseInt(userId) : userId;
      setCachedData(`user-${id}`, response.data);
      
      // 清除列表缓存
      cache.delete('users');
      cache.delete('user-stats');
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // 计算属性
  const hasData = computed(() => user.data !== null);
  const hasError = computed(() => user.error !== null);
  const isLoading = computed(() => user.loading);

  return {
    // 状态
    user,
    hasData,
    hasError,
    isLoading,
    
    // 方法
    fetchUser,
    updateUser,
  };
}

// 批量操作组合式函数
export function useBatchOperations() {
  const batchLoading = ref(false);
  const batchProgress = ref(0);
  const batchResults = ref<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });

  // 批量删除用户
  const batchDeleteUsers = async (userIds: number[]) => {
    batchLoading.value = true;
    batchProgress.value = 0;
    batchResults.value = { success: 0, failed: 0, errors: [] };

    const total = userIds.length;
    
    for (let i = 0; i < total; i++) {
      const userId = userIds[i];
      try {
        await api.deleteUser(userId);
        batchResults.value.success++;
      } catch (error) {
        batchResults.value.failed++;
        batchResults.value.errors.push(`用户 ${userId}: ${error instanceof Error ? error.message : '删除失败'}`);
      }
      
      batchProgress.value = ((i + 1) / total) * 100;
      
      // 添加小延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    batchLoading.value = false;
    
    // 清除相关缓存
    cache.delete('users');
    cache.delete('user-stats');
    userIds.forEach(id => cache.delete(`user-${id}`));
    
    return batchResults.value;
  };

  // 批量更新用户状态
  const batchUpdateUserStatus = async (userIds: number[], status: 'active' | 'inactive') => {
    batchLoading.value = true;
    batchProgress.value = 0;
    batchResults.value = { success: 0, failed: 0, errors: [] };

    const total = userIds.length;
    
    for (let i = 0; i < total; i++) {
      const userId = userIds[i];
      try {
        await api.updateUser({ id: userId, status });
        batchResults.value.success++;
      } catch (error) {
        batchResults.value.failed++;
        batchResults.value.errors.push(`用户 ${userId}: ${error instanceof Error ? error.message : '更新失败'}`);
      }
      
      batchProgress.value = ((i + 1) / total) * 100;
      
      // 添加小延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    batchLoading.value = false;
    
    // 清除相关缓存
    cache.delete('users');
    cache.delete('user-stats');
    userIds.forEach(id => cache.delete(`user-${id}`));
    
    return batchResults.value;
  };

  return {
    batchLoading,
    batchProgress,
    batchResults,
    batchDeleteUsers,
    batchUpdateUserStatus,
  };
}

// 导出缓存管理函数
export const cacheManager = {
  clear: () => cache.clear(),
  clearExpired: clearExpiredCache,
  get: getCachedData,
  set: setCachedData,
  delete: (key: string) => cache.delete(key),
  has: (key: string) => cache.has(key),
  size: () => cache.size,
}; 