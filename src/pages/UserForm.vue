<template>
  <div class="user-form">
    <div class="form-header">
      <h1>{{ isEdit ? '编辑用户' : '创建用户' }}</h1>
      <button @click="goBack" class="back-btn">返回</button>
    </div>

    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="name">姓名 *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          :class="{ 'error': errors.name }"
          placeholder="请输入姓名"
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label for="email">邮箱 *</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          :class="{ 'error': errors.email }"
          placeholder="请输入邮箱"
        />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>

      <div class="form-group">
        <label for="phone">电话 *</label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          required
          :class="{ 'error': errors.phone }"
          placeholder="请输入电话号码"
        />
        <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
      </div>

      <div class="form-group">
        <label for="status">状态</label>
        <select id="status" v-model="form.status">
          <option value="active">活跃</option>
          <option value="inactive">非活跃</option>
        </select>
      </div>

      <div class="form-group">
        <label for="avatar">头像URL</label>
        <input
          id="avatar"
          v-model="form.avatar"
          type="url"
          placeholder="请输入头像图片URL"
        />
        <div v-if="form.avatar" class="avatar-preview">
          <img :src="form.avatar" alt="头像预览" @error="handleImageError" />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="resetForm" class="reset-btn">重置</button>
        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="spinner"></span>
          {{ isEdit ? '更新' : '创建' }}
        </button>
      </div>
    </form>

    <!-- 成功消息 -->
    <div v-if="successMessage" class="success-message">
      <p>✅ {{ successMessage }}</p>
    </div>

    <!-- 错误消息 -->
    <div v-if="submitError" class="error-message-global">
      <p>❌ {{ submitError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { api, type User, type CreateUserRequest, type UpdateUserRequest } from '../utils/api';

// Props (如果从路由获取用户ID)
const props = defineProps<{
  userId?: string;
}>();

// 响应式数据
const loading = ref(false);
const successMessage = ref('');
const submitError = ref('');

// 表单数据
const form = reactive({
  name: '',
  email: '',
  phone: '',
  status: 'active' as 'active' | 'inactive',
  avatar: '',
});

// 表单验证错误
const errors = reactive({
  name: '',
  email: '',
  phone: '',
});

// 计算属性
const isEdit = computed(() => !!props.userId);

// 表单验证
const validateForm = (): boolean => {
  let isValid = true;
  
  // 重置错误
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  // 姓名验证
  if (!form.name.trim()) {
    errors.name = '姓名不能为空';
    isValid = false;
  } else if (form.name.length < 2) {
    errors.name = '姓名至少需要2个字符';
    isValid = false;
  }

  // 邮箱验证
  if (!form.email.trim()) {
    errors.email = '邮箱不能为空';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址';
    isValid = false;
  }

  // 电话验证
  if (!form.phone.trim()) {
    errors.phone = '电话号码不能为空';
    isValid = false;
  } else if (!/^1[3-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) {
    errors.phone = '请输入有效的手机号码';
    isValid = false;
  }

  return isValid;
};

// 获取用户数据（编辑模式）
const fetchUser = async () => {
  if (!props.userId) return;
  
  loading.value = true;
  try {
    const response = await api.getUser(parseInt(props.userId));
    const user = response.data;
    
    // 填充表单
    form.name = user.name;
    form.email = user.email;
    form.phone = user.phone;
    form.status = user.status;
    form.avatar = user.avatar || '';
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : '获取用户信息失败';
    console.error('Failed to fetch user:', err);
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  submitError.value = '';
  successMessage.value = '';
  
  try {
    if (isEdit.value) {
      // 更新用户
      const updateData: UpdateUserRequest = {
        id: parseInt(props.userId!),
        name: form.name,
        email: form.email,
        phone: form.phone,
        status: form.status,
        avatar: form.avatar || undefined,
      };
      
      await api.updateUser(updateData);
      successMessage.value = '用户更新成功！';
    } else {
      // 创建用户
      const createData: CreateUserRequest = {
        name: form.name,
        email: form.email,
        phone: form.phone,
      };
      
      await api.createUser(createData);
      successMessage.value = '用户创建成功！';
      
      // 重置表单
      resetForm();
    }
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : '操作失败';
    console.error('Form submission failed:', err);
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.name = '';
  form.email = '';
  form.phone = '';
  form.status = 'active';
  form.avatar = '';
  
  // 清除错误
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });
  
  submitError.value = '';
  successMessage.value = '';
};

// 返回上一页
const goBack = () => {
  // 这里可以集成路由
  console.log('返回上一页');
  // router.back();
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};

// 生命周期
onMounted(() => {
  if (isEdit.value) {
    fetchUser();
  }
});
</script>

<style scoped>
.user-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.form-header h1 {
  margin: 0;
  color: #333;
}

.back-btn {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.back-btn:hover {
  background: #5a6268;
}

.form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.avatar-preview {
  margin-top: 10px;
  text-align: center;
}

.avatar-preview img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.reset-btn,
.submit-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
}

.submit-btn {
  background: #007bff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-message {
  margin-top: 20px;
  padding: 15px;
  background: #d4edda;
  color: #155724;
  border-radius: 5px;
  text-align: center;
}

.error-message-global {
  margin-top: 20px;
  padding: 15px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 5px;
  text-align: center;
}
</style> 