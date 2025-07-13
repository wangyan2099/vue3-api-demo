// API 服务层
interface ApiResponse<T = any> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
}

interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number;
  status?: 'active' | 'inactive';
  avatar?: string;
}

// 基础API配置
const API_BASE_URL = '/api';

// 通用请求方法
async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
      message: 'Success',
    };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API 方法
export const api = {
  // 获取用户列表
  async getUsers(): Promise<ApiResponse<User[]>> {
    return request<User[]>('/users');
  },

  // 获取单个用户
  async getUser(id: number): Promise<ApiResponse<User>> {
    return request<User>(`/users/${id}`);
  },

  // 创建用户
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 更新用户
  async updateUser(userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return request<User>(`/users/${userData.id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // 删除用户
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // 搜索用户
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  },

  // 获取用户统计信息
  async getUserStats(): Promise<ApiResponse<{ total: number; active: number; inactive: number }>> {
    return request<{ total: number; active: number; inactive: number }>('/users/stats');
  },
};

// 导出类型
export type { User, CreateUserRequest, UpdateUserRequest, ApiResponse }; 